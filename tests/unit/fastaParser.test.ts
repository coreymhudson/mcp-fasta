import { describe, it, expect } from 'vitest';
import { parseFasta, SequenceRecord } from '../../src/utils/fastaParser.js';
import { testFastaData, malformedFasta } from '../fixtures/fastaData.js';
import { TestUtils } from '../utils/testHelpers.js';

describe('FASTA Parser Utilities', () => {
  describe('parseFasta function', () => {
    it('should parse single sequence correctly', () => {
      const result = parseFasta(testFastaData.singleSequence);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('seq1');
      expect(result[0].description).toBe('Single sequence test');
      expect(result[0].sequence).toBe('ATCGATCGATCGATCG');
    });

    it('should parse multiple sequences correctly', () => {
      const result = parseFasta(testFastaData.multipleSequences);
      
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('seq1');
      expect(result[0].description).toBe('First sequence');
      expect(result[0].sequence).toBe('ATCGATCGATCGATCG');
      
      expect(result[1].id).toBe('seq2');
      expect(result[1].description).toBe('Second sequence');
      expect(result[1].sequence).toBe('GCTAGCTAGCTAGCTA');
      
      expect(result[2].id).toBe('seq3');
      expect(result[2].description).toBe('Third sequence');
      expect(result[2].sequence).toBe('AAATTTCCCGGG');
    });

    it('should handle wrapped sequences correctly', () => {
      const result = parseFasta(testFastaData.wrappedSequences);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('wrapped_seq');
      expect(result[0].description).toBe('Long sequence with line wrapping');
      // Two lines of 60 characters each = 120 total
      expect(result[0].sequence).toBe(
        'ATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCG'
      );
    });

    it('should handle protein sequences correctly', () => {
      const result = parseFasta(testFastaData.proteinSequence);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('protein1');
      expect(result[0].description).toBe('Sample protein');
      expect(TestUtils.validateProteinSequence(result[0].sequence)).toBe(true);
    });

    it('should handle sequences with empty lines', () => {
      const result = parseFasta(testFastaData.emptyLines);
      
      expect(result).toHaveLength(2);
      expect(result[0].sequence).toBe('ATCGATCGATCGATCG');
      expect(result[1].sequence).toBe('GCTAGCTA');
    });

    it('should handle mixed case sequences', () => {
      const result = parseFasta(testFastaData.mixedCase);
      
      expect(result).toHaveLength(1);
      expect(result[0].sequence).toBe('AtCgAtCgAtCgATCGATCGATCGatcgatcgatcg');
    });

    it('should handle special characters in headers', () => {
      const result = parseFasta(testFastaData.specialHeaders);
      
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('seq|1|protein|description');
      expect(result[0].description).toBe('with spaces and symbols (123)');
      
      expect(result[1].id).toBe('gi|123456|ref|NM_000001.1|');
      expect(result[1].description).toBe('Homo sapiens gene');
    });

    it('should handle empty FASTA input', () => {
      const result = parseFasta(malformedFasta.empty);
      expect(result).toHaveLength(0);
    });

    it('should handle malformed FASTA gracefully', () => {
      // Sequence without header should be ignored
      const result = parseFasta(malformedFasta.sequenceOnly);
      expect(result).toHaveLength(0);
    });

    it('should handle headers without sequences', () => {
      const result = parseFasta(malformedFasta.headerOnly);
      
      expect(result).toHaveLength(2);
      expect(result[0].sequence).toBe('');
      expect(result[1].sequence).toBe('');
    });

    it('should preserve sequence IDs with complex formats', () => {
      const complexFasta = `>gi|123456|ref|NM_000001.1|
ATCGATCG
>sp|P12345|PROT_HUMAN Protein name
MSFVAGVIR`;
      
      const result = parseFasta(complexFasta);
      expect(result[0].id).toBe('gi|123456|ref|NM_000001.1|');
      expect(result[1].id).toBe('sp|P12345|PROT_HUMAN');
    });

    it('should handle Windows line endings', () => {
      const windowsFasta = testFastaData.singleSequence.replace(/\n/g, '\r\n');
      const result = parseFasta(windowsFasta);
      
      expect(result).toHaveLength(1);
      expect(result[0].sequence).toBe('ATCGATCGATCGATCG');
    });
  });

  describe('SequenceRecord type validation', () => {
    it('should create valid SequenceRecord objects', () => {
      const record: SequenceRecord = {
        id: 'test_id',
        description: 'test description',
        sequence: 'ATCGATCG'
      };
      
      expect(record.id).toBe('test_id');
      expect(record.description).toBe('test description');
      expect(record.sequence).toBe('ATCGATCG');
    });

    it('should handle empty descriptions', () => {
      const record: SequenceRecord = {
        id: 'test_id',
        description: '',
        sequence: 'ATCGATCG'
      };
      
      expect(record.description).toBe('');
    });
  });

  describe('Parser performance and edge cases', () => {
    it('should handle large sequences efficiently', () => {
      const result = parseFasta(testFastaData.largeSequence);
      
      expect(result).toHaveLength(1);
      expect(result[0].sequence.length).toBeGreaterThan(1000);
      expect(TestUtils.validateDNASequence(result[0].sequence)).toBe(true);
    });

    it('should handle sequences with only whitespace', () => {
      const whitespaceFasta = `>seq1
   
\t\t
>seq2
ATCG`;
      
      const result = parseFasta(whitespaceFasta);
      expect(result).toHaveLength(2);
      expect(result[0].sequence).toBe('');
      expect(result[1].sequence).toBe('ATCG');
    });

    it('should trim whitespace from sequence lines', () => {
      const paddedFasta = `>seq1
  ATCG  
  ATCG  `;
      
      const result = parseFasta(paddedFasta);
      expect(result[0].sequence).toBe('ATCGATCG');
    });

    it('should handle sequences with numbers in headers', () => {
      const numberedFasta = `>seq_123 Description with numbers 456
ATCGATCG`;
      
      const result = parseFasta(numberedFasta);
      expect(result[0].id).toBe('seq_123');
      expect(result[0].description).toBe('Description with numbers 456');
    });
  });

  describe('Error handling and validation', () => {
    it('should handle malformed input gracefully', () => {
      const malformed = `This is not FASTA format
>but this might be
ATCG
Another invalid line`;
      
      const result = parseFasta(malformed);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('but');
      expect(result[0].sequence).toBe('ATCGAnother invalid line');
    });

    it('should preserve original case in sequences', () => {
      const mixedCaseFasta = `>test
AaAaTtTtGgGgCcCc`;
      
      const result = parseFasta(mixedCaseFasta);
      expect(result[0].sequence).toBe('AaAaTtTtGgGgCcCc');
    });

    it('should handle consecutive headers', () => {
      const consecutiveHeaders = `>seq1
>seq2
ATCG
>seq3
GCTA`;
      
      const result = parseFasta(consecutiveHeaders);
      expect(result).toHaveLength(3);
      expect(result[0].sequence).toBe('');
      expect(result[1].sequence).toBe('ATCG');
      expect(result[2].sequence).toBe('GCTA');
    });
  });
});