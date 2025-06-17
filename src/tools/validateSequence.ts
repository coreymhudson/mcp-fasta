import { z } from "zod";
import { parseFasta } from "../utils/fastaParser.js";
import { readFile } from "fs/promises";

export const validateSequence = {
  definition: {
    name: "validate_sequence",
    description: "Validate sequences in a FASTA file for proper nucleotide/amino acid composition",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to the FASTA file"
        },
        sequenceType: {
          type: "string",
          enum: ["dna", "rna", "protein", "auto"],
          description: "Type of sequence to validate against"
        }
      },
      required: ["path", "sequenceType"]
    },
  },
  async handler({ path, sequenceType }: { path: string; sequenceType: string }) {
    const raw = await readFile(path, "utf-8");
    const records = parseFasta(raw);
    
    const validationPatterns = {
      dna: /^[ATCGN]*$/i,
      rna: /^[AUCGN]*$/i,
      protein: /^[ACDEFGHIKLMNPQRSTVWY*-]*$/i
    };
    
    const results = records.map(record => {
      const sequence = record.sequence.replace(/\s/g, '').toUpperCase();
      let isValid = false;
      let detectedType = 'unknown';
      
      if (sequenceType === 'auto') {
        // Auto-detect sequence type
        if (validationPatterns.dna.test(sequence)) {
          detectedType = 'dna';
          isValid = true;
        } else if (validationPatterns.rna.test(sequence)) {
          detectedType = 'rna';
          isValid = true;
        } else if (validationPatterns.protein.test(sequence)) {
          detectedType = 'protein';
          isValid = true;
        }
      } else {
        const pattern = validationPatterns[sequenceType as keyof typeof validationPatterns];
        isValid = pattern ? pattern.test(sequence) : false;
        detectedType = sequenceType;
      }
      
      // Find invalid characters
      const invalidChars = sequence.split('').filter(char => {
        const pattern = validationPatterns[detectedType as keyof typeof validationPatterns];
        return pattern && !pattern.test(char);
      });
      
      return {
        id: record.id,
        length: sequence.length,
        isValid,
        detectedType,
        invalidCharacters: [...new Set(invalidChars)]
      };
    });
    
    const summary = {
      totalSequences: results.length,
      validSequences: results.filter(r => r.isValid).length,
      invalidSequences: results.filter(r => !r.isValid).length
    };
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ summary, results }, null, 2)
      }]
    };
  }
};