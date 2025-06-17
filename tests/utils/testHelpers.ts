// Test utility functions for FASTA testing

export class TestUtils {
  /**
   * Validates DNA sequence format (only ATGC characters)
   */
  static validateDNASequence(sequence: string): boolean {
    return /^[ATGC]*$/.test(sequence.toUpperCase());
  }

  /**
   * Validates protein sequence format (standard amino acids)
   */
  static validateProteinSequence(sequence: string): boolean {
    return /^[ARNDCQEGHILKMFPSTWYV*]*$/.test(sequence.toUpperCase());
  }

  /**
   * Calculates GC content of a DNA sequence
   */
  static calculateGCContent(sequence: string): number {
    const upperSeq = sequence.toUpperCase();
    const gcCount = (upperSeq.match(/[GC]/g) || []).length;
    return upperSeq.length > 0 ? gcCount / upperSeq.length : 0;
  }

  /**
   * Calculates reverse complement of DNA sequence
   */
  static reverseComplement(sequence: string): string {
    const complement: { [key: string]: string } = {
      'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G',
      'a': 't', 't': 'a', 'g': 'c', 'c': 'g'
    };
    
    return sequence
      .split('')
      .reverse()
      .map(base => complement[base] || base)
      .join('');
  }

  /**
   * Translates DNA sequence to protein using standard genetic code
   */
  static translateDNA(sequence: string): string {
    const geneticCode: { [key: string]: string } = {
      'TTT': 'F', 'TTC': 'F', 'TTA': 'L', 'TTG': 'L',
      'TCT': 'S', 'TCC': 'S', 'TCA': 'S', 'TCG': 'S',
      'TAT': 'Y', 'TAC': 'Y', 'TAA': '*', 'TAG': '*',
      'TGT': 'C', 'TGC': 'C', 'TGA': '*', 'TGG': 'W',
      'CTT': 'L', 'CTC': 'L', 'CTA': 'L', 'CTG': 'L',
      'CCT': 'P', 'CCC': 'P', 'CCA': 'P', 'CCG': 'P',
      'CAT': 'H', 'CAC': 'H', 'CAA': 'Q', 'CAG': 'Q',
      'CGT': 'R', 'CGC': 'R', 'CGA': 'R', 'CGG': 'R',
      'ATT': 'I', 'ATC': 'I', 'ATA': 'I', 'ATG': 'M',
      'ACT': 'T', 'ACC': 'T', 'ACA': 'T', 'ACG': 'T',
      'AAT': 'N', 'AAC': 'N', 'AAA': 'K', 'AAG': 'K',
      'AGT': 'S', 'AGC': 'S', 'AGA': 'R', 'AGG': 'R',
      'GTT': 'V', 'GTC': 'V', 'GTA': 'V', 'GTG': 'V',
      'GCT': 'A', 'GCC': 'A', 'GCA': 'A', 'GCG': 'A',
      'GAT': 'D', 'GAC': 'D', 'GAA': 'E', 'GAG': 'E',
      'GGT': 'G', 'GGC': 'G', 'GGA': 'G', 'GGG': 'G'
    };

    let protein = '';
    const upperSeq = sequence.toUpperCase();
    
    for (let i = 0; i < upperSeq.length - 2; i += 3) {
      const codon = upperSeq.substr(i, 3);
      protein += geneticCode[codon] || 'X';
    }
    
    return protein;
  }

  /**
   * Checks if a value is within tolerance of expected value
   */
  static isWithinTolerance(actual: number, expected: number, tolerance: number): boolean {
    return Math.abs(actual - expected) <= tolerance;
  }

  /**
   * Parses FASTA format text into sequence objects
   */
  static parseFasta(fastaText: string): Array<{ id: string; description: string; sequence: string }> {
    const sequences: Array<{ id: string; description: string; sequence: string }> = [];
    const lines = fastaText.split('\n');
    
    let currentSequence: { id: string; description: string; sequence: string } | null = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('>')) {
        // Save previous sequence if exists
        if (currentSequence) {
          sequences.push(currentSequence);
        }
        
        // Start new sequence
        const headerParts = trimmedLine.substring(1).split(' ');
        const id = headerParts[0];
        const description = headerParts.slice(1).join(' ');
        
        currentSequence = { id, description, sequence: '' };
      } else if (trimmedLine && currentSequence) {
        // Add sequence line
        currentSequence.sequence += trimmedLine;
      }
    }
    
    // Add final sequence
    if (currentSequence) {
      sequences.push(currentSequence);
    }
    
    return sequences;
  }

  /**
   * Formats sequences as FASTA text
   */
  static formatAsFasta(sequences: Array<{ id: string; description: string; sequence: string }>, lineLength: number = 80): string {
    return sequences.map(seq => {
      const header = `>${seq.id}${seq.description ? ' ' + seq.description : ''}`;
      const wrappedSequence = this.wrapSequence(seq.sequence, lineLength);
      return `${header}\n${wrappedSequence}`;
    }).join('\n');
  }

  /**
   * Wraps sequence to specified line length
   */
  static wrapSequence(sequence: string, lineLength: number): string {
    const wrapped = [];
    for (let i = 0; i < sequence.length; i += lineLength) {
      wrapped.push(sequence.substr(i, lineLength));
    }
    return wrapped.join('\n');
  }

  /**
   * Counts sequence occurrences for duplicate detection
   */
  static countSequenceOccurrences(sequences: Array<{ sequence: string }>): Map<string, number> {
    const counts = new Map<string, number>();
    
    for (const seq of sequences) {
      const normalizedSeq = seq.sequence.toUpperCase();
      counts.set(normalizedSeq, (counts.get(normalizedSeq) || 0) + 1);
    }
    
    return counts;
  }

  /**
   * Validates FASTA format structure
   */
  static isValidFastaFormat(text: string): boolean {
    const lines = text.trim().split('\n');
    
    if (lines.length === 0) return false;
    
    let hasHeader = false;
    let hasSequence = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('>')) {
        hasHeader = true;
      } else if (trimmedLine.length > 0) {
        if (!hasHeader) return false; // Sequence without header
        hasSequence = true;
      }
    }
    
    return hasHeader && hasSequence;
  }

  /**
   * Measures execution time of a function
   */
  static async measureExecutionTime<T>(fn: () => Promise<T>): Promise<{ result: T; timeMs: number }> {
    const startTime = Date.now();
    const result = await fn();
    const timeMs = Date.now() - startTime;
    
    return { result, timeMs };
  }

  /**
   * Creates temporary file content for testing
   */
  static createTemporaryFastaContent(sequenceCount: number, sequenceLength: number): string {
    const sequences = [];
    
    for (let i = 1; i <= sequenceCount; i++) {
      const id = `temp_seq_${i}`;
      const description = `Temporary sequence ${i} for testing`;
      const sequence = this.generateRandomDNA(sequenceLength);
      
      sequences.push({ id, description, sequence });
    }
    
    return this.formatAsFasta(sequences);
  }

  /**
   * Generates random DNA sequence for testing
   */
  static generateRandomDNA(length: number, seed?: number): string {
    const bases = ['A', 'T', 'G', 'C'];
    let sequence = '';
    
    // Simple seeded random for reproducible tests
    let random = seed ? this.seededRandom(seed) : Math.random;
    
    for (let i = 0; i < length; i++) {
      sequence += bases[Math.floor(random() * bases.length)];
    }
    
    return sequence;
  }

  /**
   * Simple seeded random number generator for reproducible tests
   */
  private static seededRandom(seed: number): () => number {
    let x = Math.sin(seed) * 10000;
    return () => {
      x = Math.sin(x) * 10000;
      return x - Math.floor(x);
    };
  }

  /**
   * Validates JSON-RPC response structure
   */
  static validateMCPResponse(response: any): boolean {
    return (
      response &&
      typeof response === 'object' &&
      response.jsonrpc === '2.0' &&
      ('result' in response || 'error' in response) &&
      'id' in response
    );
  }

  /**
   * Creates mock MCP request for testing
   */
  static createMCPRequest(method: string, params: any, id: number = 1): any {
    return {
      jsonrpc: '2.0',
      id,
      method,
      params
    };
  }
}