import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { reverseComplement } from '../../src/tools/reverseComplement.js';
import { testFastaData } from '../fixtures/fastaData.js';
import { TestUtils } from '../utils/testHelpers.js';
import { writeFileSync, unlinkSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

describe('reverseComplement Tool', () => {
  const testDir = join(process.cwd(), 'test_files');
  const singleSeqFile = join(testDir, 'single_seq.fasta');
  const multiSeqFile = join(testDir, 'multi_seq.fasta');
  const palindromeFile = join(testDir, 'palindrome.fasta');
  const mixedCaseFile = join(testDir, 'mixed_case.fasta');
  const outputFile = join(testDir, 'output.fasta');

  beforeAll(() => {
    // Create test directory and files
    if (!existsSync(testDir)) {
      require('fs').mkdirSync(testDir, { recursive: true });
    }

    writeFileSync(singleSeqFile, testFastaData.singleSequence);
    writeFileSync(multiSeqFile, testFastaData.multipleSequences);
    writeFileSync(palindromeFile, testFastaData.palindrome);
    writeFileSync(mixedCaseFile, testFastaData.mixedCase);
  });

  afterAll(() => {
    // Clean up test files
    const files = [singleSeqFile, multiSeqFile, palindromeFile, mixedCaseFile, outputFile];
    files.forEach(file => {
      if (existsSync(file)) {
        unlinkSync(file);
      }
    });
    if (existsSync(testDir)) {
      require('fs').rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Basic functionality', () => {
    it('should calculate reverse complement for single sequence', async () => {
      const result = await reverseComplement.handler({ path: singleSeqFile });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      
      const data = JSON.parse(result.content[0].text);
      expect(data.processedCount).toBe(1);
      expect(data.sequences).toHaveLength(1);
      
      const seq = data.sequences[0];
      expect(seq.id).toBe('seq1_rc');
      expect(seq.originalLength).toBe(16);
      expect(seq.processedLength).toBe(16);
      
      // ATCGATCGATCGATCG -> CGATCGATCGATCGAT
      const expected = TestUtils.reverseComplement('ATCGATCGATCGATCG');
      expect(seq.sequence).toBe(expected);
    });

    it('should calculate reverse complement for multiple sequences', async () => {
      const result = await reverseComplement.handler({ path: multiSeqFile });

      const data = JSON.parse(result.content[0].text);
      expect(data.processedCount).toBe(3);
      expect(data.sequences).toHaveLength(3);
      
      data.sequences.forEach((seq, index) => {
        expect(seq.id).toContain('_rc');
        expect(seq.originalLength).toBeGreaterThan(0);
        expect(seq.processedLength).toBe(seq.originalLength);
        expect(TestUtils.validateDNASequence(seq.sequence)).toBe(true);
      });
    });

    it('should handle palindromic sequences correctly', async () => {
      const result = await reverseComplement.handler({ path: palindromeFile });

      const data = JSON.parse(result.content[0].text);
      const seq = data.sequences[0];
      
      // GAATTC should reverse complement to itself
      expect(seq.sequence).toBe('GAATTC');
    });

    it('should preserve case in mixed case sequences', async () => {
      const result = await reverseComplement.handler({ path: mixedCaseFile });

      const data = JSON.parse(result.content[0].text);
      const seq = data.sequences[0];
      
      // Should preserve the original case pattern but complemented and reversed
      expect(seq.sequence).toMatch(/[AtGcAtGc]/); // Mixed case pattern
    });
  });

  describe('File output functionality', () => {
    it('should write reverse complement to output file', async () => {
      const result = await reverseComplement.handler({ 
        path: singleSeqFile,
        outputPath: outputFile 
      });

      expect(result.content[0].text).toContain('Successfully wrote');
      expect(result.content[0].text).toContain('1 reverse complement');
      expect(existsSync(outputFile)).toBe(true);
      
      const outputContent = readFileSync(outputFile, 'utf-8');
      expect(outputContent).toContain('>seq1_rc');
      expect(outputContent).toContain('CGATCGATCGATCGAT');
      
      unlinkSync(outputFile);
    });

    it('should write multiple sequences to output file', async () => {
      const result = await reverseComplement.handler({ 
        path: multiSeqFile,
        outputPath: outputFile 
      });

      expect(result.content[0].text).toContain('3 reverse complement');
      
      const outputContent = readFileSync(outputFile, 'utf-8');
      expect(outputContent).toContain('>seq1_rc');
      expect(outputContent).toContain('>seq2_rc');
      expect(outputContent).toContain('>seq3_rc');
      
      unlinkSync(outputFile);
    });

    it('should format output with proper line wrapping', async () => {
      const longSeqFasta = `>long_seq
${'ATCGATCGATCGATCG'.repeat(10)}`;
      const longSeqFile = join(testDir, 'long_seq.fasta');
      writeFileSync(longSeqFile, longSeqFasta);

      await reverseComplement.handler({ 
        path: longSeqFile,
        outputPath: outputFile 
      });

      const outputContent = readFileSync(outputFile, 'utf-8');
      const lines = outputContent.split('\n');
      
      // Check that sequence lines are wrapped to 80 characters
      const sequenceLines = lines.filter(line => !line.startsWith('>') && line.length > 0);
      sequenceLines.forEach(line => {
        expect(line.length).toBeLessThanOrEqual(80);
      });
      
      unlinkSync(longSeqFile);
      unlinkSync(outputFile);
    });
  });

  describe('Sequence filtering', () => {
    it('should filter specific sequences by ID', async () => {
      const result = await reverseComplement.handler({ 
        path: multiSeqFile,
        sequenceIds: ['seq1', 'seq3']
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.processedCount).toBe(2);
      expect(data.sequences).toHaveLength(2);
      expect(data.sequences[0].id).toBe('seq1_rc');
      expect(data.sequences[1].id).toBe('seq3_rc');
    });

    it('should handle single sequence filter', async () => {
      const result = await reverseComplement.handler({ 
        path: multiSeqFile,
        sequenceIds: ['seq2']
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.processedCount).toBe(1);
      expect(data.sequences[0].id).toBe('seq2_rc');
    });

    it('should handle non-existent sequence IDs gracefully', async () => {
      const result = await reverseComplement.handler({ 
        path: multiSeqFile,
        sequenceIds: ['non_existent_seq']
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.processedCount).toBe(0);
      expect(data.sequences).toHaveLength(0);
    });

    it('should handle empty sequence filter list', async () => {
      const result = await reverseComplement.handler({ 
        path: multiSeqFile,
        sequenceIds: []
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.processedCount).toBe(0);
      expect(data.sequences).toHaveLength(0);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty sequences', async () => {
      const emptySeqFasta = `>empty_seq

>another_seq
ATCG`;
      const emptySeqFile = join(testDir, 'empty_sequences.fasta');
      writeFileSync(emptySeqFile, emptySeqFasta);

      const result = await reverseComplement.handler({ path: emptySeqFile });
      const data = JSON.parse(result.content[0].text);
      
      expect(data.processedCount).toBe(2);
      expect(data.sequences[0].sequence).toBe(''); // Empty sequence remains empty
      expect(data.sequences[1].sequence).toBe('CGAT'); // ATCG -> CGAT

      unlinkSync(emptySeqFile);
    });

    it('should throw error for non-existent file', async () => {
      await expect(reverseComplement.handler({ 
        path: 'non_existent_file.fasta' 
      })).rejects.toThrow();
    });

    it('should handle sequences with N bases', async () => {
      const nSequenceFasta = `>seq_with_n
ATCGNNATCG`;
      const nSeqFile = join(testDir, 'n_seq.fasta');
      writeFileSync(nSeqFile, nSequenceFasta);

      const result = await reverseComplement.handler({ path: nSeqFile });
      const data = JSON.parse(result.content[0].text);
      
      // N should remain N in reverse complement
      expect(data.sequences[0].sequence).toBe('CGATNNCGAT');

      unlinkSync(nSeqFile);
    });

    it('should handle sequences with invalid DNA bases', async () => {
      const invalidFasta = `>invalid_seq
ATCGXYZATCG`;
      const invalidFile = join(testDir, 'invalid.fasta');
      writeFileSync(invalidFile, invalidFasta);

      const result = await reverseComplement.handler({ path: invalidFile });
      const data = JSON.parse(result.content[0].text);
      
      // Invalid bases should be converted to N
      expect(data.sequences[0].sequence).toContain('N');

      unlinkSync(invalidFile);
    });

    it('should handle sequences with gaps and special characters', async () => {
      const gappedFasta = `>gapped_seq
ATCG-NATCG`;
      const gappedFile = join(testDir, 'gapped.fasta');
      writeFileSync(gappedFile, gappedFasta);

      const result = await reverseComplement.handler({ path: gappedFile });
      const data = JSON.parse(result.content[0].text);
      
      // Gaps should be preserved
      expect(data.sequences[0].sequence).toBe('CGATN-CGAT');

      unlinkSync(gappedFile);
    });
  });

  describe('Reverse complement accuracy', () => {
    it('should correctly complement all DNA bases', async () => {
      const allBasesFasta = `>all_bases
ATCGATCG`;
      const allBasesFile = join(testDir, 'all_bases.fasta');
      writeFileSync(allBasesFile, allBasesFasta);

      const result = await reverseComplement.handler({ path: allBasesFile });
      const data = JSON.parse(result.content[0].text);
      
      expect(data.sequences[0].sequence).toBe('CGATCGAT');

      unlinkSync(allBasesFile);
    });

    it('should handle double reverse complement', async () => {
      const originalSequence = 'ATCGATCGATCGATCG';
      
      // First reverse complement
      const result1 = await reverseComplement.handler({ path: singleSeqFile });
      const data1 = JSON.parse(result1.content[0].text);
      const firstRC = data1.sequences[0].sequence;
      
      // Create file with first reverse complement
      const rcFasta = `>rc_seq\n${firstRC}`;
      const rcFile = join(testDir, 'rc.fasta');
      writeFileSync(rcFile, rcFasta);
      
      // Second reverse complement should return to original
      const result2 = await reverseComplement.handler({ path: rcFile });
      const data2 = JSON.parse(result2.content[0].text);
      
      expect(data2.sequences[0].sequence).toBe(originalSequence);

      unlinkSync(rcFile);
    });

    it('should verify reverse complement with test utility', async () => {
      const testSequence = 'ATCGATCGATCGATCG';
      const expected = TestUtils.reverseComplement(testSequence);
      
      const result = await reverseComplement.handler({ path: singleSeqFile });
      const data = JSON.parse(result.content[0].text);
      
      expect(data.sequences[0].sequence).toBe(expected);
    });
  });

  describe('Header and description handling', () => {
    it('should update sequence descriptions correctly', async () => {
      const result = await reverseComplement.handler({ path: singleSeqFile });
      const data = JSON.parse(result.content[0].text);
      
      expect(data.sequences[0].description).toContain('reverse complement');
    });

    it('should handle complex sequence IDs', async () => {
      const complexIdFasta = `>gi|123456|ref|NM_000001.1| Description
ATCGATCG`;
      const complexIdFile = join(testDir, 'complex_id.fasta');
      writeFileSync(complexIdFile, complexIdFasta);

      const result = await reverseComplement.handler({ path: complexIdFile });
      const data = JSON.parse(result.content[0].text);
      
      expect(data.sequences[0].id).toBe('gi|123456|ref|NM_000001.1|_rc');

      unlinkSync(complexIdFile);
    });

    it('should preserve original descriptions in new descriptions', async () => {
      const result = await reverseComplement.handler({ path: singleSeqFile });
      const data = JSON.parse(result.content[0].text);
      
      expect(data.sequences[0].description).toContain('Single sequence test');
    });
  });

  describe('Tool definition', () => {
    it('should have correct tool definition structure', () => {
      expect(reverseComplement.definition.name).toBe('reverse_complement');
      expect(reverseComplement.definition.description).toContain('reverse complement');
      expect(reverseComplement.definition.inputSchema.type).toBe('object');
      expect(reverseComplement.definition.inputSchema.required).toContain('path');
    });

    it('should have proper parameter definitions', () => {
      const props = reverseComplement.definition.inputSchema.properties;
      
      expect(props.path.type).toBe('string');
      expect(props.outputPath?.type).toBe('string');
      expect(props.sequenceIds?.type).toBe('array');
      expect(props.sequenceIds?.items?.type).toBe('string');
    });
  });

  describe('Performance and reliability', () => {
    it('should handle large sequences efficiently', async () => {
      const largeSeqFasta = `>large_sequence
${'ATCGATCGATCGATCG'.repeat(1000)}`;
      const largeSeqFile = join(testDir, 'large_seq.fasta');
      
      if (!existsSync(testDir)) {
        require('fs').mkdirSync(testDir, { recursive: true });
      }
      writeFileSync(largeSeqFile, largeSeqFasta);

      const { result, timeMs } = await TestUtils.measureExecutionTime(async () => {
        return await reverseComplement.handler({ path: largeSeqFile });
      });

      expect(timeMs).toBeLessThan(5000); // Should complete within 5 seconds
      
      const data = JSON.parse(result.content[0].text);
      expect(data.sequences[0].processedLength).toBe(16000);

      if (existsSync(largeSeqFile)) {
        unlinkSync(largeSeqFile);
      }
    });

    it('should produce consistent results', async () => {
      const result1 = await reverseComplement.handler({ path: singleSeqFile });
      const result2 = await reverseComplement.handler({ path: singleSeqFile });

      expect(result1.content[0].text).toBe(result2.content[0].text);
    });

    it('should handle many sequences efficiently', async () => {
      const manySeqFasta = Array.from({ length: 100 }, (_, i) => 
        `>seq_${i}\nATCGATCGATCGATCG`
      ).join('\n');
      const manySeqFile = join(testDir, 'many_seq.fasta');
      
      if (!existsSync(testDir)) {
        require('fs').mkdirSync(testDir, { recursive: true });
      }
      writeFileSync(manySeqFile, manySeqFasta);

      const { result, timeMs } = await TestUtils.measureExecutionTime(async () => {
        return await reverseComplement.handler({ path: manySeqFile });
      });

      expect(timeMs).toBeLessThan(5000);
      
      const data = JSON.parse(result.content[0].text);
      expect(data.processedCount).toBe(100);

      if (existsSync(manySeqFile)) {
        unlinkSync(manySeqFile);
      }
    });
  });
});