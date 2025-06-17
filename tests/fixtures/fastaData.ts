// Test FASTA data and expected results for comprehensive testing

export const testFastaData = {
  // Basic FASTA sequences
  singleSequence: `>seq1 Single sequence test
ATCGATCGATCGATCG`,

  multipleSequences: `>seq1 First sequence
ATCGATCGATCGATCG
>seq2 Second sequence
GCTAGCTAGCTAGCTA
>seq3 Third sequence
AAATTTCCCGGG`,

  // Sequences with different line lengths
  wrappedSequences: `>wrapped_seq Long sequence with line wrapping
ATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCG
ATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCG`,

  // Protein sequences
  proteinSequence: `>protein1 Sample protein
MSFVAGVIRRLDETVVNRIAAGEVIQRPANAIKEMIENCLDAKSTSIQVIVKEGGLKLIQIQDNGTGIRKEDLDIVCERFTTSKLQSFEDLASISTYGFRGEALASISHVAHVTITTKTADGKCAYRASYSDGKLKAPPKQEYFHKQKLDTVDKLQNYDLDHQVLKAAPEDEHGPGQLQGSTPVHSYFQSTTK
NVLSEIAKRDLQSGGDGISQIVAADKLLAKDLVLQFRQALPPQNRVQVSNILMWLQKLLNFPQKYVTDFKSKGKLFKKLFSLM
KGALKQELIANKDLQEQFQKSLLALQKYQMKIERKFNQSLQKNYQSAKFQQNQAAQQKQSFEEHKQSKEQLQKQEQLYQSNKEQYKQNQK`,

  // Edge cases
  emptyLines: `>seq_with_empty_lines
ATCGATCG

ATCGATCG

>seq2
GCTAGCTA`,

  // Invalid sequences (for error testing)
  invalidDNA: `>invalid_dna Contains invalid nucleotides
ATCGXYZATCG`,

  invalidProtein: `>invalid_protein Contains invalid amino acids
MSFVABJXZ`,

  // Mixed case sequences
  mixedCase: `>mixed_case_seq
AtCgAtCgAtCg
ATCGATCGATCG
atcgatcgatcg`,

  // Special characters in headers
  specialHeaders: `>seq|1|protein|description with spaces and symbols (123)
ATCGATCGATCG
>gi|123456|ref|NM_000001.1| Homo sapiens gene
GCTAGCTAGCTA`,

  // Large sequences for performance testing
  largeSequence: `>large_seq Performance test sequence
${'ATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCG'.repeat(100)}`,

  // Sequences for GC content testing
  highGC: `>high_gc_seq GC content ~80%
GCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGC`,

  lowGC: `>low_gc_seq GC content ~20%
ATATATATATATATATATATATATATATATATATATATATATATATATATATATATATATATAT`,

  // Sequences for reverse complement testing
  palindrome: `>palindrome Self-complementary sequence
GAATTC`,

  reverseComplement: `>original
ATCGATCG
>expected_reverse_complement  
CGATCGAT`,

  // Duplicate sequences for testing
  duplicates: `>seq1
ATCGATCG
>seq2
GCTAGCTA
>seq3_duplicate_of_seq1
ATCGATCG
>seq4
AAATTTCCC
>seq5_duplicate_of_seq1
ATCGATCG`,

  // Translation testing
  codingSequence: `>coding_seq Start codon to stop codon
ATGAAACGCATTAGCACCACCATTACCACCACCATCACCATTACCACAGGTAACGGTGCGGGCTGACGCGTACAGGAAACACAGAAAAAAGCCCGCACCTGACAGTGCGGGCTTTTTTTTCGACCAAAGTCATGAAGTAG`,

  // Expected results for validation
  expectedResults: {
    singleSequenceLength: 16,
    multipleSequenceCount: 3,
    highGCContent: 0.8,
    lowGCContent: 0.2,
    palindromeReverseComplement: 'GAATTC',
    originalReverseComplement: 'CGATCGAT',
    duplicateCount: 3, // seq1 appears 3 times
    codingSequenceProtein: 'MKRISTTITTTITTTGTGAGADRYKQHRKKLRTVRALFSTKSMK*'
  }
};

export const malformedFasta = {
  // Missing header
  noHeader: `ATCGATCGATCG
GCTAGCTAGCTA`,

  // Empty file
  empty: '',

  // Header without sequence
  headerOnly: `>seq1 Header without sequence
>seq2 Another header`,

  // Sequence without header
  sequenceOnly: `ATCGATCGATCG
GCTAGCTAGCTA`,
};

export const testFiles = {
  // File paths for file-based testing
  singleSequenceFile: 'test_single.fasta',
  multipleSequenceFile: 'test_multiple.fasta',
  largeSequenceFile: 'test_large.fasta',
  invalidFile: 'test_invalid.fasta',
  emptyFile: 'test_empty.fasta',
  nonExistentFile: 'does_not_exist.fasta',
};