import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { calculateGC } from '../../src/tools/calculateGC.js';
import { testFastaData } from '../fixtures/fastaData.js';
import { TestUtils } from '../utils/testHelpers.js';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';

describe('calculateGC Tool', () => {
  const testDir = join(process.cwd(), 'test_files');
  const singleSeqFile = join(testDir, 'single_seq.fasta');
  const multiSeqFile = join(testDir, 'multi_seq.fasta');
  const highGCFile = join(testDir, 'high_gc.fasta');
  const lowGCFile = join(testDir, 'low_gc.fasta');
  const emptyFile = join(testDir, 'empty.fasta');

  beforeAll(() => {
    // Create test directory and files
    if (!existsSync(testDir)) {
      require('fs').mkdirSync(testDir, { recursive: true });
    }

    writeFileSync(singleSeqFile, testFastaData.singleSequence);
    writeFileSync(multiSeqFile, testFastaData.multipleSequences);
    writeFileSync(highGCFile, testFastaData.highGC);
    writeFileSync(lowGCFile, testFastaData.lowGC);
    writeFileSync(emptyFile, '');
  });

  afterAll(() => {
    // Clean up test files
    const files = [singleSeqFile, multiSeqFile, highGCFile, lowGCFile, emptyFile];
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
    it('should calculate GC content for single sequence', async () => {
      const result = await calculateGC.handler({ path: singleSeqFile });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      
      const data = JSON.parse(result.content[0].text);
      expect(data.overallStats.totalSequences).toBe(1);
      expect(data.sequences).toHaveLength(1);
      expect(data.sequences[0].id).toBe('seq1');
      expect(data.sequences[0].length).toBe(16);
      expect(data.sequences[0].gcContent).toBe(50); // ATCGATCGATCGATCG has 50% GC
    });

    it('should calculate GC content for multiple sequences', async () => {
      const result = await calculateGC.handler({ path: multiSeqFile });

      const data = JSON.parse(result.content[0].text);
      expect(data.overallStats.totalSequences).toBe(3);
      expect(data.sequences).toHaveLength(3);
      
      // Check individual sequence calculations
      expect(data.sequences[0].id).toBe('seq1');
      expect(data.sequences[1].id).toBe('seq2');
      expect(data.sequences[2].id).toBe('seq3');
    });

    it('should handle high GC content sequences', async () => {
      const result = await calculateGC.handler({ path: highGCFile });

      const data = JSON.parse(result.content[0].text);
      expect(data.sequences[0].gcContent).toBeGreaterThan(0.7);
      expect(data.sequences[0].atContent).toBeLessThan(0.3);
    });

    it('should handle low GC content sequences', async () => {
      const result = await calculateGC.handler({ path: lowGCFile });

      const data = JSON.parse(result.content[0].text);
      expect(data.sequences[0].gcContent).toBeLessThan(0.3);
      expect(data.sequences[0].atContent).toBeGreaterThan(0.7);
    });
  });

  describe('Nucleotide counting', () => {
    it('should count individual nucleotides correctly', async () => {
      const result = await calculateGC.handler({ path: singleSeqFile });

      const data = JSON.parse(result.content[0].text);
      const counts = data.sequences[0].counts;
      
      expect(counts.A + counts.T + counts.G + counts.C).toBe(16);
      expect(counts.A).toBe(4);
      expect(counts.T).toBe(4);
      expect(counts.G).toBe(4);
      expect(counts.C).toBe(4);
      expect(counts.N).toBe(0);
    });

    it('should handle N bases correctly', async () => {
      const nSequenceFasta = `>seq_with_n
ATCGNATCGN`;
      const nSeqFile = join(testDir, 'n_seq.fasta');
      writeFileSync(nSeqFile, nSequenceFasta);

      const result = await calculateGC.handler({ path: nSeqFile });
      const data = JSON.parse(result.content[0].text);
      
      expect(data.sequences[0].counts.N).toBe(2);
      expect(data.sequences[0].nContent).toBe(20); // 2/10 = 20%
      expect(data.sequences[0].knownBases).toBe(8);

      unlinkSync(nSeqFile);
    });

    it('should calculate percentages correctly', async () => {
      const result = await calculateGC.handler({ path: singleSeqFile });

      const data = JSON.parse(result.content[0].text);
      const seq = data.sequences[0];
      
      expect(seq.gcContent + seq.atContent + seq.nContent).toBeCloseTo(100);
      expect(seq.gcContent).toBe(50);
      expect(seq.atContent).toBe(50);
      expect(seq.nContent).toBe(0);
    });
  });

  describe('Sliding window analysis', () => {
    it('should perform sliding window analysis when windowSize provided', async () => {
      const result = await calculateGC.handler({ 
        path: singleSeqFile, 
        windowSize: 4 
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.windowSize).toBe(4);
      expect(data.sequences[0].slidingWindow).toBeDefined();
      expect(data.sequences[0].slidingWindowStats).toBeDefined();
      
      const windowStats = data.sequences[0].slidingWindowStats;
      expect(windowStats.windowSize).toBe(4);
      expect(windowStats.numberOfWindows).toBeGreaterThan(0);
      expect(windowStats.meanGC).toBeGreaterThanOrEqual(0);
      expect(windowStats.meanGC).toBeLessThanOrEqual(100);
    });

    it('should skip sliding window for sequences shorter than window size', async () => {
      const shortSeqFasta = `>short_seq
ATCG`;
      const shortSeqFile = join(testDir, 'short_seq.fasta');
      writeFileSync(shortSeqFile, shortSeqFasta);

      const result = await calculateGC.handler({ 
        path: shortSeqFile, 
        windowSize: 10 
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.sequences[0].slidingWindow).toBeUndefined();
      expect(data.sequences[0].slidingWindowStats).toBeUndefined();

      unlinkSync(shortSeqFile);
    });

    it('should calculate sliding window statistics correctly', async () => {
      const uniformGCFasta = `>uniform_gc
GCGCGCGCGCGCGCGC`; // 100% GC
      const uniformGCFile = join(testDir, 'uniform_gc.fasta');
      writeFileSync(uniformGCFile, uniformGCFasta);

      const result = await calculateGC.handler({ 
        path: uniformGCFile, 
        windowSize: 4 
      });

      const data = JSON.parse(result.content[0].text);
      const windowStats = data.sequences[0].slidingWindowStats;
      
      expect(windowStats.meanGC).toBe(100);
      expect(windowStats.minGC).toBe(100);
      expect(windowStats.maxGC).toBe(100);
      expect(windowStats.stdDevGC).toBe(0);

      unlinkSync(uniformGCFile);
    });
  });

  describe('Overall statistics', () => {
    it('should calculate overall statistics across all sequences', async () => {
      const result = await calculateGC.handler({ path: multiSeqFile });

      const data = JSON.parse(result.content[0].text);
      const overall = data.overallStats;
      
      expect(overall.totalSequences).toBe(3);
      expect(overall.totalLength).toBeGreaterThan(0);
      expect(overall.meanGC).toBeGreaterThanOrEqual(0);
      expect(overall.meanGC).toBeLessThanOrEqual(100);
      expect(overall.minGC).toBeLessThanOrEqual(overall.meanGC);
      expect(overall.maxGC).toBeGreaterThanOrEqual(overall.meanGC);
    });

    it('should handle single sequence overall statistics', async () => {
      const result = await calculateGC.handler({ path: singleSeqFile });

      const data = JSON.parse(result.content[0].text);
      const overall = data.overallStats;
      
      expect(overall.totalSequences).toBe(1);
      expect(overall.meanGC).toBe(overall.minGC);
      expect(overall.meanGC).toBe(overall.maxGC);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty sequences', async () => {
      const emptySeqFasta = `>empty_seq
>another_empty

`;
      const emptySeqFile = join(testDir, 'empty_sequences.fasta');
      writeFileSync(emptySeqFile, emptySeqFasta);

      const result = await calculateGC.handler({ path: emptySeqFile });
      const data = JSON.parse(result.content[0].text);
      
      expect(data.sequences).toHaveLength(2);
      data.sequences.forEach(seq => {
        expect(seq.length).toBe(0);
        expect(seq.gcContent).toBe(0);
        expect(seq.atContent).toBe(0);
      });

      unlinkSync(emptySeqFile);
    });

    it('should throw error for non-existent file', async () => {
      await expect(calculateGC.handler({ 
        path: 'non_existent_file.fasta' 
      })).rejects.toThrow();
    });

    it('should handle empty file', async () => {
      const result = await calculateGC.handler({ path: emptyFile });
      const data = JSON.parse(result.content[0].text);
      
      expect(data.overallStats.totalSequences).toBe(0);
      expect(data.sequences).toHaveLength(0);
    });

    it('should handle mixed case sequences', async () => {
      const mixedCaseFasta = `>mixed_case
AtCgAtCg`;
      const mixedCaseFile = join(testDir, 'mixed_case.fasta');
      
      if (!existsSync(testDir)) {
        require('fs').mkdirSync(testDir, { recursive: true });
      }
      writeFileSync(mixedCaseFile, mixedCaseFasta);

      const result = await calculateGC.handler({ path: mixedCaseFile });
      const data = JSON.parse(result.content[0].text);
      
      expect(data.sequences[0].gcContent).toBe(50);

      if (existsSync(mixedCaseFile)) {
        unlinkSync(mixedCaseFile);
      }
    });

    it('should handle sequences with only unknown bases', async () => {
      const unknownFasta = `>unknown_bases
NNNNNNNN`;
      const unknownFile = join(testDir, 'unknown.fasta');
      writeFileSync(unknownFile, unknownFasta);

      const result = await calculateGC.handler({ path: unknownFile });
      const data = JSON.parse(result.content[0].text);
      
      expect(data.sequences[0].nContent).toBe(100);
      expect(data.sequences[0].gcContent).toBe(0);
      expect(data.sequences[0].knownBases).toBe(0);

      unlinkSync(unknownFile);
    });
  });

  describe('Tool definition', () => {
    it('should have correct tool definition structure', () => {
      expect(calculateGC.definition.name).toBe('calculate_gc_content');
      expect(calculateGC.definition.description).toContain('GC content');
      expect(calculateGC.definition.inputSchema.type).toBe('object');
      expect(calculateGC.definition.inputSchema.required).toContain('path');
    });

    it('should have proper parameter definitions', () => {
      const props = calculateGC.definition.inputSchema.properties;
      
      expect(props.path.type).toBe('string');
      expect(props.windowSize?.type).toBe('number');
      // windowSize parameter exists but may not have minimum constraint
    });
  });

  describe('Performance and reliability', () => {
    it('should handle large sequences efficiently', async () => {
      const largeSeqFasta = `>large_sequence
${'ATCGATCGATCGATCG'.repeat(1000)}`;
      const largeSeqFile = join(testDir, 'large_seq.fasta');
      writeFileSync(largeSeqFile, largeSeqFasta);

      const { result, timeMs } = await TestUtils.measureExecutionTime(async () => {
        return await calculateGC.handler({ path: largeSeqFile });
      });

      expect(timeMs).toBeLessThan(5000); // Should complete within 5 seconds
      
      const data = JSON.parse(result.content[0].text);
      expect(data.sequences[0].length).toBe(16000);

      unlinkSync(largeSeqFile);
    });

    it('should produce consistent results', async () => {
      const result1 = await calculateGC.handler({ path: singleSeqFile });
      const result2 = await calculateGC.handler({ path: singleSeqFile });

      expect(result1.content[0].text).toBe(result2.content[0].text);
    });
  });
});