import { z } from "zod";
import { parseFasta } from "../utils/fastaParser.js";
import { readFile } from "fs/promises";

export const translateSequence = {
  definition: {
    name: "translate_sequence",
    description: "Translate DNA sequences to protein using genetic code",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to the FASTA file containing DNA sequences"
        },
        readingFrame: {
          type: "number",
          enum: [1, 2, 3, -1, -2, -3],
          description: "Reading frame (1-3 for forward, -1 to -3 for reverse)"
        },
        geneticCode: {
          type: "string",
          enum: ["standard", "vertebrate_mitochondrial", "bacterial"],
          description: "Genetic code table to use"
        },
        outputPath: {
          type: "string",
          description: "Optional output path for translated sequences"
        }
      },
      required: ["path", "readingFrame"]
    },
  },
  async handler({ path, readingFrame, geneticCode = "standard", outputPath }: { 
    path: string; 
    readingFrame: number;
    geneticCode?: string;
    outputPath?: string;
  }) {
    const raw = await readFile(path, "utf-8");
    const records = parseFasta(raw);
    
    // Standard genetic code
    const geneticCodes = {
      standard: {
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
      }
    };
    
    const codonTable = geneticCodes[geneticCode as keyof typeof geneticCodes] || geneticCodes.standard;
    
    const reverseComplement = (seq: string) => {
      const complementMap: { [key: string]: string } = {
        'A': 'T', 'T': 'A', 'C': 'G', 'G': 'C', 'N': 'N'
      };
      return seq.split('').reverse().map(base => complementMap[base.toUpperCase()] || 'N').join('');
    };
    
    const translateDNA = (dnaSeq: string, frame: number) => {
      let sequence = dnaSeq.toUpperCase().replace(/[^ATCGN]/g, 'N');
      
      // Handle reverse frames
      if (frame < 0) {
        sequence = reverseComplement(sequence);
        frame = Math.abs(frame);
      }
      
      // Adjust for reading frame (0-indexed)
      sequence = sequence.slice(frame - 1);
      
      let protein = '';
      for (let i = 0; i < sequence.length - 2; i += 3) {
        const codon = sequence.slice(i, i + 3);
        if (codon.length === 3) {
          protein += (codonTable as any)[codon] || 'X';
        }
      }
      
      return protein;
    };
    
    const translatedSequences = records.map(record => {
      const protein = translateDNA(record.sequence, readingFrame);
      const stopCodons = (protein.match(/\*/g) || []).length;
      
      return {
        id: record.id + `_frame${readingFrame}`,
        description: `${record.description} (translated frame ${readingFrame})`,
        sequence: protein,
        originalLength: record.sequence.length,
        proteinLength: protein.length,
        stopCodons,
        readingFrame,
        geneticCode
      };
    });
    
    if (outputPath) {
      const { writeFile } = await import("fs/promises");
      const fastaContent = translatedSequences
        .map(seq => {
          const header = `>${seq.id} ${seq.description}`;
          const formattedSequence = seq.sequence.match(/.{1,80}/g)?.join('\n') || seq.sequence;
          return `${header}\n${formattedSequence}`;
        })
        .join('\n');
      
      await writeFile(outputPath, fastaContent + '\n', 'utf-8');
      
      return {
        content: [{
          type: "text",
          text: `Successfully translated ${translatedSequences.length} sequences to ${outputPath}`
        }]
      };
    }
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          translatedCount: translatedSequences.length,
          readingFrame,
          geneticCode,
          sequences: translatedSequences
        }, null, 2)
      }]
    };
  }
};