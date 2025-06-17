import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import { testFastaData } from '../fixtures/fastaData.js';
import { TestUtils } from '../utils/testHelpers.js';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';

describe('MCP FASTA Server Integration', () => {
  let serverProcess: ChildProcess;
  let isServerReady = false;
  const testDir = join(process.cwd(), 'test_files');
  const testFile = join(testDir, 'integration_test.fasta');

  const sendMCPRequest = async (request: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!serverProcess.stdin || !serverProcess.stdout) {
        reject(new Error('Server process not available'));
        return;
      }

      let responseData = '';
      
      const onData = (data: Buffer) => {
        responseData += data.toString();
        try {
          const response = JSON.parse(responseData);
          serverProcess.stdout!.off('data', onData);
          resolve(response);
        } catch (e) {
          // Continue collecting data if JSON is incomplete
        }
      };

      serverProcess.stdout.on('data', onData);
      
      // Send request
      serverProcess.stdin.write(JSON.stringify(request) + '\n');
      
      // Timeout after 30 seconds
      setTimeout(() => {
        serverProcess.stdout!.off('data', onData);
        reject(new Error('Request timeout'));
      }, 30000);
    });
  };

  beforeAll(async () => {
    // Create test directory and files
    if (!existsSync(testDir)) {
      require('fs').mkdirSync(testDir, { recursive: true });
    }
    
    writeFileSync(testFile, testFastaData.multipleSequences);

    // Start the MCP server
    serverProcess = spawn('node', ['dist/server.js'], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Wait for server to be ready
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Server startup timeout'));
      }, 10000);

      serverProcess.on('spawn', () => {
        clearTimeout(timeout);
        isServerReady = true;
        resolve();
      });

      serverProcess.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }, 15000);

  afterAll(async () => {
    if (serverProcess) {
      serverProcess.kill();
    }
    
    // Clean up test files
    if (existsSync(testFile)) {
      unlinkSync(testFile);
    }
    if (existsSync(testDir)) {
      require('fs').rmdirSync(testDir);
    }
  });

  describe('Server lifecycle', () => {
    it('should start server successfully', () => {
      expect(isServerReady).toBe(true);
      expect(serverProcess.pid).toBeDefined();
    });
  });

  describe('Tool listing', () => {
    it('should list all available FASTA tools', async () => {
      const request = TestUtils.createMCPRequest('tools/list', {}, 1);
      const response = await sendMCPRequest(request);
      
      expect(TestUtils.validateMCPResponse(response)).toBe(true);
      expect(response.result.tools).toHaveLength(14);
      
      const toolNames = response.result.tools.map((tool: any) => tool.name);
      const expectedTools = [
        'load_fasta',
        'summarize_fasta', 
        'get_sequence_by_id',
        'filter_fasta_by_length',
        'write_fasta',
        'validate_sequence',
        'reverse_complement',
        'translate_sequence',
        'search_sequence',
        'calculate_gc_content',
        'split_fasta',
        'merge_fasta',
        'extract_subsequence',
        'find_duplicates'
      ];
      
      expectedTools.forEach(expectedTool => {
        expect(toolNames).toContain(expectedTool);
      });
    });

    it('should have proper tool definitions', async () => {
      const request = TestUtils.createMCPRequest('tools/list', {}, 2);
      const response = await sendMCPRequest(request);
      
      response.result.tools.forEach((tool: any) => {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema.properties).toBeDefined();
      });
    });
  });

  describe('Load FASTA Tool Integration', () => {
    it('should load FASTA file via MCP', async () => {
      const request = TestUtils.createMCPRequest('tools/call', {
        name: 'load_fasta',
        arguments: { path: testFile }
      }, 3);

      const response = await sendMCPRequest(request);
      
      expect(TestUtils.validateMCPResponse(response)).toBe(true);
      expect(response.result.content).toHaveLength(1);
      
      const data = JSON.parse(response.result.content[0].text);
      expect(data.records).toHaveLength(3);
      expect(data.records[0].id).toBe('seq1');
      expect(data.records[1].id).toBe('seq2');
      expect(data.records[2].id).toBe('seq3');
    });

    it('should handle load FASTA errors via MCP', async () => {
      const request = TestUtils.createMCPRequest('tools/call', {
        name: 'load_fasta',
        arguments: { path: 'non_existent.fasta' }
      }, 4);

      const response = await sendMCPRequest(request);
      expect(response.error).toBeDefined();
    });
  });

  describe('Calculate GC Content Tool Integration', () => {
    it('should calculate GC content via MCP', async () => {
      const request = TestUtils.createMCPRequest('tools/call', {
        name: 'calculate_gc_content',
        arguments: { path: testFile }
      }, 5);

      const response = await sendMCPRequest(request);
      
      expect(TestUtils.validateMCPResponse(response)).toBe(true);
      const data = JSON.parse(response.result.content[0].text);
      expect(data.overallStats.totalSequences).toBe(3);
      expect(data.sequences).toHaveLength(3);
      expect(data.sequences[0].gcContent).toBeGreaterThanOrEqual(0);
      expect(data.sequences[0].gcContent).toBeLessThanOrEqual(1);
    });

    it('should handle sliding window analysis via MCP', async () => {
      const request = TestUtils.createMCPRequest('tools/call', {
        name: 'calculate_gc_content',
        arguments: { path: testFile, windowSize: 4 }
      }, 6);

      const response = await sendMCPRequest(request);
      const data = JSON.parse(response.result.content[0].text);
      expect(data.windowSize).toBe(4);
      expect(data.sequences[0].slidingWindowStats).toBeDefined();
    });
  });

  describe('Reverse Complement Tool Integration', () => {
    it('should calculate reverse complement via MCP', async () => {
      const request = TestUtils.createMCPRequest('tools/call', {
        name: 'reverse_complement',
        arguments: { path: testFile }
      }, 7);

      const response = await sendMCPRequest(request);
      
      expect(TestUtils.validateMCPResponse(response)).toBe(true);
      const data = JSON.parse(response.result.content[0].text);
      expect(data.processedCount).toBe(3);
      expect(data.sequences).toHaveLength(3);
      
      data.sequences.forEach((seq: any) => {
        expect(seq.id).toContain('_rc');
        expect(TestUtils.validateDNASequence(seq.sequence)).toBe(true);
      });
    });

    it('should filter sequences by ID via MCP', async () => {
      const request = TestUtils.createMCPRequest('tools/call', {
        name: 'reverse_complement',
        arguments: { 
          path: testFile,
          sequenceIds: ['seq1', 'seq3']
        }
      }, 8);

      const response = await sendMCPRequest(request);
      const data = JSON.parse(response.result.content[0].text);
      expect(data.processedCount).toBe(2);
      expect(data.sequences[0].id).toBe('seq1_rc');
      expect(data.sequences[1].id).toBe('seq3_rc');
    });
  });

  describe('Validate Sequence Tool Integration', () => {
    it('should validate DNA sequences via MCP', async () => {
      const request = TestUtils.createMCPRequest('tools/call', {
        name: 'validate_sequence',
        arguments: { 
          path: testFile,
          sequenceType: 'dna'
        }
      }, 9);

      const response = await sendMCPRequest(request);
      
      expect(TestUtils.validateMCPResponse(response)).toBe(true);
      const data = JSON.parse(response.result.content[0].text);
      expect(data.summary.totalSequences).toBe(3);
      expect(data.summary.validSequences).toBeGreaterThan(0);
      expect(data.results).toHaveLength(3);
      
      data.results.forEach((result: any) => {
        expect(result.isValid).toBeDefined();
        expect(result.detectedType).toBeDefined();
      });
    });

    it('should auto-detect sequence types via MCP', async () => {
      const request = TestUtils.createMCPRequest('tools/call', {
        name: 'validate_sequence',
        arguments: { 
          path: testFile,
          sequenceType: 'auto'
        }
      }, 10);

      const response = await sendMCPRequest(request);
      const data = JSON.parse(response.result.content[0].text);
      
      data.results.forEach((result: any) => {
        expect(['dna', 'rna', 'protein', 'unknown']).toContain(result.detectedType);
      });
    });
  });

  describe('Translate Sequence Tool Integration', () => {
    it('should translate DNA sequences via MCP', async () => {
      const request = TestUtils.createMCPRequest('tools/call', {
        name: 'translate_sequence',
        arguments: { 
          path: testFile,
          readingFrame: 1
        }
      }, 11);

      const response = await sendMCPRequest(request);
      
      expect(TestUtils.validateMCPResponse(response)).toBe(true);
      const data = JSON.parse(response.result.content[0].text);
      expect(data.translatedCount).toBe(3);
      expect(data.readingFrame).toBe(1);
      expect(data.sequences).toHaveLength(3);
      
      data.sequences.forEach((seq: any) => {
        expect(TestUtils.validateProteinSequence(seq.sequence)).toBe(true);
        expect(seq.readingFrame).toBe(1);
      });
    });

    it('should handle different reading frames via MCP', async () => {
      const request = TestUtils.createMCPRequest('tools/call', {
        name: 'translate_sequence',
        arguments: { 
          path: testFile,
          readingFrame: -1
        }
      }, 12);

      const response = await sendMCPRequest(request);
      const data = JSON.parse(response.result.content[0].text);
      expect(data.readingFrame).toBe(-1);
    });
  });

  describe('Get Sequence Tool Integration', () => {
    it('should get specific sequence by ID via MCP', async () => {
      const request = TestUtils.createMCPRequest('tools/call', {
        name: 'get_sequence_by_id',
        arguments: { 
          path: testFile,
          id: 'seq2'
        }
      }, 13);

      const response = await sendMCPRequest(request);
      
      expect(TestUtils.validateMCPResponse(response)).toBe(true);
      const data = JSON.parse(response.result.content[0].text);
      expect(data.id).toBe('seq2');
      expect(data.description).toBe('Second sequence');
      expect(data.sequence).toBeDefined();
    });

    it('should handle non-existent sequence ID via MCP', async () => {
      const request = TestUtils.createMCPRequest('tools/call', {
        name: 'get_sequence_by_id',
        arguments: { 
          path: testFile,
          id: 'non_existent_seq'
        }
      }, 14);

      const response = await sendMCPRequest(request);
      expect(response.error).toBeDefined();
    });
  });

  describe('Write FASTA Tool Integration', () => {
    it('should write new FASTA file via MCP', async () => {
      const outputFile = join(testDir, 'output_test.fasta');
      const sequences = [
        { id: 'new_seq1', description: 'Test sequence 1', sequence: 'ATCGATCG' },
        { id: 'new_seq2', description: 'Test sequence 2', sequence: 'GCTAGCTA' }
      ];

      const request = TestUtils.createMCPRequest('tools/call', {
        name: 'write_fasta',
        arguments: { 
          path: outputFile,
          sequences: sequences
        }
      }, 15);

      const response = await sendMCPRequest(request);
      
      expect(TestUtils.validateMCPResponse(response)).toBe(true);
      expect(response.result.content[0].text).toContain('Successfully wrote');
      expect(existsSync(outputFile)).toBe(true);

      // Clean up
      if (existsSync(outputFile)) {
        unlinkSync(outputFile);
      }
    });
  });

  describe('Error handling', () => {
    it('should handle unknown tool calls', async () => {
      const request = TestUtils.createMCPRequest('tools/call', {
        name: 'nonexistent_tool',
        arguments: {}
      }, 16);

      const response = await sendMCPRequest(request);
      expect(response.error).toBeDefined();
      expect(response.error.message).toContain('Unknown tool');
    });

    it('should handle missing arguments', async () => {
      const request = TestUtils.createMCPRequest('tools/call', {
        name: 'load_fasta'
        // Missing arguments
      }, 17);

      const response = await sendMCPRequest(request);
      expect(response.error).toBeDefined();
      expect(response.error.message).toContain('arguments are required');
    });

    it('should handle malformed JSON-RPC requests', async () => {
      const request = {
        // Missing required jsonrpc field
        id: 18,
        method: 'tools/list',
        params: {}
      };

      try {
        await sendMCPRequest(request);
        expect.fail('Should have thrown an error');
      } catch (error) {
        // Expected to fail
        expect(error).toBeDefined();
      }
    });
  });

  describe('Performance and reliability', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => 
        TestUtils.createMCPRequest('tools/call', {
          name: 'load_fasta',
          arguments: { path: testFile }
        }, 100 + i)
      );

      const responses = await Promise.all(
        requests.map(req => sendMCPRequest(req))
      );

      expect(responses).toHaveLength(5);
      responses.forEach((response, i) => {
        expect(response.id).toBe(100 + i);
        expect(response.result).toBeDefined();
      });
    }, 60000);

    it('should handle large file operations', async () => {
      const largeFile = join(testDir, 'large_test.fasta');
      const largeFasta = Array.from({ length: 100 }, (_, i) =>
        `>seq_${i}\n${'ATCGATCGATCGATCG'.repeat(10)}`
      ).join('\n');
      
      writeFileSync(largeFile, largeFasta);

      const request = TestUtils.createMCPRequest('tools/call', {
        name: 'load_fasta',
        arguments: { path: largeFile }
      }, 200);

      const response = await sendMCPRequest(request);
      expect(response.result).toBeDefined();
      
      const data = JSON.parse(response.result.content[0].text);
      expect(data.records).toHaveLength(100);

      unlinkSync(largeFile);
    }, 30000);
  });

  describe('Data consistency', () => {
    it('should produce consistent results with same parameters', async () => {
      const request = TestUtils.createMCPRequest('tools/call', {
        name: 'calculate_gc_content',
        arguments: { path: testFile }
      }, 300);

      const response1 = await sendMCPRequest({ ...request, id: 301 });
      const response2 = await sendMCPRequest({ ...request, id: 302 });

      expect(response1.result.content[0].text).toBe(response2.result.content[0].text);
    });

    it('should maintain data integrity across tool chain', async () => {
      // Load -> Calculate GC -> Reverse Complement pipeline
      const loadRequest = TestUtils.createMCPRequest('tools/call', {
        name: 'load_fasta',
        arguments: { path: testFile }
      }, 400);

      const loadResponse = await sendMCPRequest(loadRequest);
      const loadData = JSON.parse(loadResponse.result.content[0].text);
      const originalCount = loadData.records.length;

      const gcRequest = TestUtils.createMCPRequest('tools/call', {
        name: 'calculate_gc_content',
        arguments: { path: testFile }
      }, 401);

      const gcResponse = await sendMCPRequest(gcRequest);
      const gcData = JSON.parse(gcResponse.result.content[0].text);

      const rcRequest = TestUtils.createMCPRequest('tools/call', {
        name: 'reverse_complement',
        arguments: { path: testFile }
      }, 402);

      const rcResponse = await sendMCPRequest(rcRequest);
      const rcData = JSON.parse(rcResponse.result.content[0].text);

      // All operations should work on same number of sequences
      expect(gcData.overallStats.totalSequences).toBe(originalCount);
      expect(rcData.processedCount).toBe(originalCount);
      
      // Sequence lengths should be preserved
      gcData.sequences.forEach((seq: any, i: number) => {
        expect(rcData.sequences[i].originalLength).toBe(seq.length);
        expect(rcData.sequences[i].processedLength).toBe(seq.length);
      });
    }, 45000);
  });

  describe('Tool parameter validation', () => {
    it('should validate required parameters', async () => {
      const request = TestUtils.createMCPRequest('tools/call', {
        name: 'get_sequence_by_id',
        arguments: { 
          path: testFile
          // Missing required 'id' parameter
        }
      }, 500);

      const response = await sendMCPRequest(request);
      expect(response.error).toBeDefined();
    });

    it('should validate parameter types', async () => {
      const request = TestUtils.createMCPRequest('tools/call', {
        name: 'translate_sequence',
        arguments: { 
          path: testFile,
          readingFrame: 'invalid_frame' // Should be number
        }
      }, 501);

      const response = await sendMCPRequest(request);
      expect(response.error).toBeDefined();
    });

    it('should validate enum parameters', async () => {
      const request = TestUtils.createMCPRequest('tools/call', {
        name: 'validate_sequence',
        arguments: { 
          path: testFile,
          sequenceType: 'invalid_type' // Should be dna, rna, protein, or auto
        }
      }, 502);

      const response = await sendMCPRequest(request);
      expect(response.error).toBeDefined();
    });
  });
});