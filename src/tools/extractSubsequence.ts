import { z } from "zod";
import { parseFasta } from "../utils/fastaParser.js";
import { readFile } from "fs/promises";

export const extractSubsequence = {
  definition: {
    name: "extract_subsequence",
    description: "Extract subsequences from FASTA sequences by coordinates",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to the FASTA file"
        },
        coordinates: {
          type: "array",
          items: {
            type: "object",
            properties: {
              sequenceId: { type: "string" },
              start: { type: "number" },
              end: { type: "number" },
              name: { type: "string" }
            },
            required: ["sequenceId", "start", "end"]
          },
          description: "Array of extraction coordinates"
        },
        outputPath: {
          type: "string",
          description: "Optional output path for extracted sequences"
        }
      },
      required: ["path", "coordinates"]
    },
  },
  async handler({ path, coordinates, outputPath }: { 
    path: string; 
    coordinates: Array<{
      sequenceId: string;
      start: number;
      end: number;
      name?: string;
    }>;
    outputPath?: string;
  }) {
    const raw = await readFile(path, "utf-8");
    const records = parseFasta(raw);
    
    // Create a map for quick sequence lookup
    const sequenceMap = new Map();
    records.forEach(record => {
      sequenceMap.set(record.id, record);
    });
    
    const extractedSequences = [];
    const errors = [];
    
    for (const coord of coordinates) {
      const record = sequenceMap.get(coord.sequenceId);
      
      if (!record) {
        errors.push({
          sequenceId: coord.sequenceId,
          error: "Sequence not found"
        });
        continue;
      }
      
      const sequence = record.sequence.replace(/\s/g, '');
      const sequenceLength = sequence.length;
      
      // Validate coordinates (1-indexed)
      if (coord.start < 1 || coord.end < 1) {
        errors.push({
          sequenceId: coord.sequenceId,
          coordinates: `${coord.start}-${coord.end}`,
          error: "Coordinates must be 1-indexed (start from 1)"
        });
        continue;
      }
      
      if (coord.start > sequenceLength || coord.end > sequenceLength) {
        errors.push({
          sequenceId: coord.sequenceId,
          coordinates: `${coord.start}-${coord.end}`,
          sequenceLength,
          error: "Coordinates exceed sequence length"
        });
        continue;
      }
      
      if (coord.start > coord.end) {
        errors.push({
          sequenceId: coord.sequenceId,
          coordinates: `${coord.start}-${coord.end}`,
          error: "Start coordinate must be less than or equal to end coordinate"
        });
        continue;
      }
      
      // Extract subsequence (convert to 0-indexed for slicing)
      const subsequence = sequence.slice(coord.start - 1, coord.end);
      const extractedLength = subsequence.length;
      
      const extractedId = coord.name || `${coord.sequenceId}_${coord.start}-${coord.end}`;
      const description = `extracted from ${coord.sequenceId} (${coord.start}-${coord.end}) | ${record.description}`;
      
      extractedSequences.push({
        id: extractedId,
        description,
        sequence: subsequence,
        sourceSequence: coord.sequenceId,
        coordinates: {
          start: coord.start,
          end: coord.end
        },
        length: extractedLength,
        originalLength: sequenceLength
      });
    }
    
    // Write to file if output path provided
    if (outputPath && extractedSequences.length > 0) {
      const { writeFile } = await import("fs/promises");
      const fastaContent = extractedSequences
        .map(seq => {
          const header = `>${seq.id} ${seq.description}`;
          const formattedSequence = seq.sequence.match(/.{1,80}/g)?.join('\n') || seq.sequence;
          return `${header}\n${formattedSequence}`;
        })
        .join('\n');
      
      await writeFile(outputPath, fastaContent + '\n', 'utf-8');
    }
    
    const summary = {
      totalRequests: coordinates.length,
      successfulExtractions: extractedSequences.length,
      errors: errors.length,
      outputFile: outputPath || null
    };
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          summary,
          extractedSequences,
          errors
        }, null, 2)
      }]
    };
  }
};