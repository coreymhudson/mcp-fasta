import { z } from "zod";
import { parseFasta } from "../utils/fastaParser.js";
import { readFile } from "fs/promises";

export const reverseComplement = {
  definition: {
    name: "reverse_complement",
    description: "Generate reverse complement of DNA sequences in a FASTA file",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to the FASTA file"
        },
        outputPath: {
          type: "string",
          description: "Optional output path for reverse complement sequences"
        },
        sequenceIds: {
          type: "array",
          items: { type: "string" },
          description: "Optional array of sequence IDs to process (if not provided, processes all)"
        }
      },
      required: ["path"]
    },
  },
  async handler({ path, outputPath, sequenceIds }: { 
    path: string; 
    outputPath?: string; 
    sequenceIds?: string[] 
  }) {
    const raw = await readFile(path, "utf-8");
    const records = parseFasta(raw);
    
    const complementMap: { [key: string]: string } = {
      'A': 'T', 'T': 'A', 'C': 'G', 'G': 'C',
      'a': 't', 't': 'a', 'c': 'g', 'g': 'c',
      'N': 'N', 'n': 'n', '-': '-'
    };
    
    const processedSequences = records
      .filter(record => !sequenceIds || sequenceIds.includes(record.id))
      .map(record => {
        const reverseComp = record.sequence
          .split('')
          .reverse()
          .map(base => complementMap[base] || 'N')
          .join('');
        
        return {
          id: record.id + "_rc",
          description: record.description + " (reverse complement)",
          sequence: reverseComp,
          originalLength: record.sequence.length,
          processedLength: reverseComp.length
        };
      });
    
    if (outputPath) {
      const { writeFile } = await import("fs/promises");
      const fastaContent = processedSequences
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
          text: `Successfully wrote ${processedSequences.length} reverse complement sequences to ${outputPath}`
        }]
      };
    }
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          processedCount: processedSequences.length,
          sequences: processedSequences
        }, null, 2)
      }]
    };
  }
};