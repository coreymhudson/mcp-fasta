import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { loadFasta } from '../../src/tools/loadFasta.js';
import { testFastaData } from '../fixtures/fastaData.js';
import { TestUtils } from '../utils/testHelpers.js';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';

describe('loadFasta Tool', () => {
  const testDir = join(process.cwd(), 'test_files');
  const singleSeqFile = join(testDir, 'single_seq.fasta');
  const multiSeqFile = join(testDir, 'multi_seq.fasta');
  const proteinFile = join(testDir, 'protein.fasta');
  const emptyFile = join(testDir, 'empty.fasta');
  const largeFile = join(testDir, 'large.fasta');

  beforeAll(() => {
    // Create test directory and files
    if (!existsSync(testDir)) {
      require('fs').mkdirSync(testDir, { recursive: true });
    }

    writeFileSync(singleSeqFile, testFastaData.singleSequence);
    writeFileSync(multiSeqFile, testFastaData.multipleSequences);
    writeFileSync(proteinFile, testFastaData.proteinSequence);
    writeFileSync(emptyFile, '');
    writeFileSync(largeFile, testFastaData.largeSequence);
  });

  afterAll(() => {
    // Clean up test files
    const files = [singleSeqFile, multiSeqFile, proteinFile, emptyFile, largeFile];
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
    it('should load single sequence metadata', async () => {
      const result = await loadFasta.handler({ path: singleSeqFile });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      
      const data = JSON.parse(result.content[0].text);
      expect(data.records).toHaveLength(1);
      expect(data.records[0].id).toBe('seq1');
      expect(data.records[0].description).toBe('Single sequence test');
      expect(data.records[0].length).toBe(16);
    });

    it('should load multiple sequence metadata', async () => {
      const result = await loadFasta.handler({ path: multiSeqFile });

      const data = JSON.parse(result.content[0].text);
      expect(data.records).toHaveLength(3);
      
      expect(data.records[0].id).toBe('seq1');
      expect(data.records[0].description).toBe('First sequence');
      expect(data.records[0].length).toBe(16);
      
      expect(data.records[1].id).toBe('seq2');
      expect(data.records[1].description).toBe('Second sequence');
      expect(data.records[1].length).toBe(16);
      
      expect(data.records[2].id).toBe('seq3');
      expect(data.records[2].description).toBe('Third sequence');
      expect(data.records[2].length).toBe(12);
    });

    it('should load protein sequence metadata', async () => {
      const result = await loadFasta.handler({ path: proteinFile });

      const data = JSON.parse(result.content[0].text);
      expect(data.records).toHaveLength(1);
      expect(data.records[0].id).toBe('protein1');
      expect(data.records[0].description).toBe('Sample protein');
      expect(data.records[0].length).toBeGreaterThan(100); // Long protein sequence
    });

    it('should handle large sequences', async () => {
      const result = await loadFasta.handler({ path: largeFile });

      const data = JSON.parse(result.content[0].text);
      expect(data.records).toHaveLength(1);
      expect(data.records[0].id).toBe('large_seq');
      expect(data.records[0].length).toBeGreaterThan(1000);
    });
  });

  describe('Metadata accuracy', () => {
    it('should calculate sequence lengths correctly', async () => {
      const testSeqFasta = `>test_seq
ATCGATCGATCG
ATCGATCGATCG`;
      const testSeqFile = join(testDir, 'test_seq.fasta');
      writeFileSync(testSeqFile, testSeqFasta);

      const result = await loadFasta.handler({ path: testSeqFile });
      const data = JSON.parse(result.content[0].text);
      
      expect(data.records[0].length).toBe(24); // 12 + 12

      unlinkSync(testSeqFile);
    });

    it('should handle wrapped sequences correctly', async () => {
      const result = await loadFasta.handler({ path: largeFile });

      const data = JSON.parse(result.content[0].text);
      // Should count total sequence length regardless of line wrapping
      expect(data.records[0].length).toBeGreaterThanOrEqual(6000);
    });

    it('should preserve sequence IDs and descriptions exactly', async () => {
      const complexHeaderFasta = `>gi|123456|ref|NM_000001.1| Homo sapiens gene (123)
ATCGATCGATCG
>sp|P12345|PROT_HUMAN Protein name with spaces
MSFVAGVIR`;
      const complexHeaderFile = join(testDir, 'complex_header.fasta');
      writeFileSync(complexHeaderFile, complexHeaderFasta);

      const result = await loadFasta.handler({ path: complexHeaderFile });
      const data = JSON.parse(result.content[0].text);
      
      expect(data.records[0].id).toBe('gi|123456|ref|NM_000001.1|');
      expect(data.records[0].description).toBe('Homo sapiens gene (123)');
      expect(data.records[1].id).toBe('sp|P12345|PROT_HUMAN');
      expect(data.records[1].description).toBe('Protein name with spaces');

      unlinkSync(complexHeaderFile);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty file', async () => {
      const result = await loadFasta.handler({ path: emptyFile });

      const data = JSON.parse(result.content[0].text);
      expect(data.records).toHaveLength(0);
    });

    it('should handle empty sequences', async () => {
      const emptySeqFasta = `>empty_seq1
>empty_seq2
>seq_with_content
ATCGATCG`;
      const emptySeqFile = join(testDir, 'empty_sequences.fasta');
      writeFileSync(emptySeqFile, emptySeqFasta);

      const result = await loadFasta.handler({ path: emptySeqFile });
      const data = JSON.parse(result.content[0].text);
      
      expect(data.records).toHaveLength(3);
      expect(data.records[0].length).toBe(0);
      expect(data.records[1].length).toBe(0);
      expect(data.records[2].length).toBe(8);

      unlinkSync(emptySeqFile);
    });

    it('should throw error for non-existent file', async () => {
      await expect(loadFasta.handler({ 
        path: 'non_existent_file.fasta' 
      })).rejects.toThrow();
    });

    it('should handle malformed FASTA gracefully', async () => {
      const malformedFasta = `This is not FASTA
>seq1
ATCGATCG
Invalid line here
>seq2
GCTAGCTA`;
      const malformedFile = join(testDir, 'malformed.fasta');
      writeFileSync(malformedFile, malformedFasta);

      const result = await loadFasta.handler({ path: malformedFile });
      const data = JSON.parse(result.content[0].text);
      
      // Should still parse valid sequences
      expect(data.records).toHaveLength(2);
      expect(data.records[0].id).toBe('seq1');
      expect(data.records[1].id).toBe('seq2');

      unlinkSync(malformedFile);
    });

    it('should handle sequences with whitespace', async () => {
      const whitespaceFasta = `>seq_with_whitespace
  ATCG  
  ATCG  
  `;
      const whitespaceFile = join(testDir, 'whitespace.fasta');
      writeFileSync(whitespaceFile, whitespaceFasta);

      const result = await loadFasta.handler({ path: whitespaceFile });
      const data = JSON.parse(result.content[0].text);
      
      expect(data.records[0].length).toBe(8); // Whitespace should be trimmed

      unlinkSync(whitespaceFile);
    });

    it('should handle mixed case sequences', async () => {
      const mixedCaseFasta = `>mixed_case_seq
AtCgAtCg
ATCGATCG
atcgatcg`;
      const mixedCaseFile = join(testDir, 'mixed_case.fasta');
      writeFileSync(mixedCaseFile, mixedCaseFasta);

      const result = await loadFasta.handler({ path: mixedCaseFile });
      const data = JSON.parse(result.content[0].text);
      
      expect(data.records[0].length).toBe(24);

      unlinkSync(mixedCaseFile);
    });

    it('should handle sequences with special characters', async () => {
      const specialCharFasta = `>seq_with_special_chars
ATCG-NATCG*ATCG`;
      const specialCharFile = join(testDir, 'special_chars.fasta');
      writeFileSync(specialCharFile, specialCharFasta);

      const result = await loadFasta.handler({ path: specialCharFile });
      const data = JSON.parse(result.content[0].text);
      
      expect(data.records[0].length).toBe(15); // Including special characters

      unlinkSync(specialCharFile);
    });
  });

  describe('Data structure validation', () => {
    it('should return valid record structure', async () => {
      const result = await loadFasta.handler({ path: singleSeqFile });
      const data = JSON.parse(result.content[0].text);
      
      expect(data.records).toBeDefined();
      expect(Array.isArray(data.records)).toBe(true);
      
      data.records.forEach(record => {
        expect(record).toHaveProperty('id');
        expect(record).toHaveProperty('description');
        expect(record).toHaveProperty('length');
        expect(typeof record.id).toBe('string');
        expect(typeof record.description).toBe('string');
        expect(typeof record.length).toBe('number');
        expect(record.length).toBeGreaterThanOrEqual(0);
      });
    });

    it('should not include actual sequence data', async () => {
      const result = await loadFasta.handler({ path: singleSeqFile });
      const data = JSON.parse(result.content[0].text);
      
      data.records.forEach(record => {
        expect(record).not.toHaveProperty('sequence');
      });
    });
  });

  describe('Tool definition', () => {
    it('should have correct tool definition structure', () => {
      expect(loadFasta.definition.name).toBe('load_fasta');
      expect(loadFasta.definition.description).toContain('Load');
      expect(loadFasta.definition.inputSchema.type).toBe('object');
      expect(loadFasta.definition.inputSchema.required).toContain('path');
    });

    it('should have proper parameter definitions', () => {
      const props = loadFasta.definition.inputSchema.properties;
      
      expect(props.path.type).toBe('string');
      expect(props.path.description).toBeDefined();
    });
  });

  describe('Performance and reliability', () => {
    it('should handle many sequences efficiently', async () => {
      const manySeqFasta = Array.from({ length: 1000 }, (_, i) => 
        `>seq_${i}\nATCGATCGATCG`
      ).join('\n');
      const manySeqFile = join(testDir, 'many_seq.fasta');
      writeFileSync(manySeqFile, manySeqFasta);

      const { result, timeMs } = await TestUtils.measureExecutionTime(async () => {
        return await loadFasta.handler({ path: manySeqFile });
      });

      expect(timeMs).toBeLessThan(5000); // Should complete within 5 seconds
      
      const data = JSON.parse(result.content[0].text);
      expect(data.records).toHaveLength(1000);

      unlinkSync(manySeqFile);
    });

    it('should produce consistent results', async () => {
      const result1 = await loadFasta.handler({ path: multiSeqFile });
      const result2 = await loadFasta.handler({ path: multiSeqFile });

      expect(result1.content[0].text).toBe(result2.content[0].text);
    });

    it('should handle concurrent access safely', async () => {
      const promises = Array.from({ length: 10 }, () => 
        loadFasta.handler({ path: singleSeqFile })
      );

      const results = await Promise.all(promises);
      
      // All results should be identical
      const firstResult = results[0].content[0].text;
      results.forEach(result => {
        expect(result.content[0].text).toBe(firstResult);
      });
    });
  });

  describe('File format compatibility', () => {
    it('should handle Unix line endings', async () => {
      const unixFasta = testFastaData.singleSequence; // Already Unix format
      const unixFile = join(testDir, 'unix.fasta');
      writeFileSync(unixFile, unixFasta);

      const result = await loadFasta.handler({ path: unixFile });
      const data = JSON.parse(result.content[0].text);
      
      expect(data.records).toHaveLength(1);

      unlinkSync(unixFile);
    });

    it('should handle Windows line endings', async () => {
      const windowsFasta = testFastaData.singleSequence.replace(/\n/g, '\r\n');
      const windowsFile = join(testDir, 'windows.fasta');
      writeFileSync(windowsFile, windowsFasta);

      const result = await loadFasta.handler({ path: windowsFile });
      const data = JSON.parse(result.content[0].text);
      
      expect(data.records).toHaveLength(1);
      expect(data.records[0].length).toBe(16);

      unlinkSync(windowsFile);
    });

    it('should handle mixed line endings', async () => {
      const mixedFasta = `>seq1\r\nATCGATCG\n>seq2\r\nGCTAGCTA\r\n`;
      const mixedFile = join(testDir, 'mixed.fasta');
      
      if (!existsSync(testDir)) {
        require('fs').mkdirSync(testDir, { recursive: true });
      }
      writeFileSync(mixedFile, mixedFasta);

      const result = await loadFasta.handler({ path: mixedFile });
      const data = JSON.parse(result.content[0].text);
      
      expect(data.records).toHaveLength(2);

      if (existsSync(mixedFile)) {
        unlinkSync(mixedFile);
      }
    });
  });
});