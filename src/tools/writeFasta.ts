import { z } from "zod";
import { writeFile } from "fs/promises";

export const writeFasta = {
  definition: {
    name: "write_fasta",
    description: "Write sequences to a FASTA file",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Output path for the FASTA file"
        },
        sequences: {
          type: "array",
          description: "Array of sequences to write",
          items: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "Sequence identifier"
              },
              description: {
                type: "string",
                description: "Sequence description (optional)"
              },
              sequence: {
                type: "string",
                description: "The DNA/RNA/protein sequence"
              }
            },
            required: ["id", "sequence"]
          }
        }
      },
      required: ["path", "sequences"]
    },
  },
  async handler({ path, sequences }: { 
    path: string; 
    sequences: Array<{ id: string; description?: string; sequence: string }> 
  }) {
    const fastaContent = sequences
      .map(seq => {
        const header = seq.description 
          ? `>${seq.id} ${seq.description}`
          : `>${seq.id}`;
        
        // Format sequence with 80 characters per line (standard FASTA format)
        const formattedSequence = seq.sequence.match(/.{1,80}/g)?.join('\n') || seq.sequence;
        
        return `${header}\n${formattedSequence}`;
      })
      .join('\n');

    await writeFile(path, fastaContent + '\n', 'utf-8');
    
    return {
      content: [{
        type: "text",
        text: `Successfully wrote ${sequences.length} sequences to ${path}`
      }]
    };
  }
};