import { z } from "zod";
import { parseFasta } from "../utils/fastaParser.js";
import { readFile, writeFile } from "fs/promises";

export const mergeFasta = {
  definition: {
    name: "merge_fasta",
    description: "Merge multiple FASTA files into a single file",
    inputSchema: {
      type: "object",
      properties: {
        inputPaths: {
          type: "array",
          items: { type: "string" },
          description: "Array of FASTA file paths to merge"
        },
        outputPath: {
          type: "string",
          description: "Output path for merged FASTA file"
        },
        removeDuplicates: {
          type: "boolean",
          description: "Remove duplicate sequences based on ID"
        },
        addFilePrefix: {
          type: "boolean",
          description: "Add filename prefix to sequence IDs to avoid conflicts"
        }
      },
      required: ["inputPaths", "outputPath"]
    },
  },
  async handler({ inputPaths, outputPath, removeDuplicates = false, addFilePrefix = false }: { 
    inputPaths: string[];
    outputPath: string;
    removeDuplicates?: boolean;
    addFilePrefix?: boolean;
  }) {
    const allRecords: any[] = [];
    const fileStats: any[] = [];
    const seenIds = new Set<string>();
    
    for (const inputPath of inputPaths) {
      try {
        const raw = await readFile(inputPath, "utf-8");
        const records = parseFasta(raw);
        
        const filename = inputPath.split('/').pop()?.replace(/\\.fasta$/, '') || 'unknown';
        let addedCount = 0;
        let duplicateCount = 0;
        
        for (const record of records) {
          let id = record.id;
          
          // Add file prefix if requested
          if (addFilePrefix) {
            id = `${filename}_${record.id}`;
          }
          
          // Check for duplicates if requested
          if (removeDuplicates) {
            if (seenIds.has(id)) {
              duplicateCount++;
              continue;
            }
            seenIds.add(id);
          }
          
          allRecords.push({
            ...record,
            id,
            sourceFile: inputPath
          });
          addedCount++;
        }
        
        fileStats.push({
          file: inputPath,
          originalCount: records.length,
          addedCount,
          duplicateCount
        });
        
      } catch (error) {
        fileStats.push({
          file: inputPath,
          error: `Failed to read file: ${error}`
        });
      }
    }
    
    // Write merged file
    const fastaContent = allRecords
      .map(record => {
        const header = `>${record.id} ${record.description}`;
        const formattedSequence = record.sequence.match(/.{1,80}/g)?.join('\n') || record.sequence;
        return `${header}\n${formattedSequence}`;
      })
      .join('\n');
    
    await writeFile(outputPath, fastaContent + '\n', 'utf-8');
    
    // Generate statistics
    const summary = {
      inputFiles: inputPaths.length,
      outputFile: outputPath,
      totalSequences: allRecords.length,
      removeDuplicates,
      addFilePrefix,
      duplicatesRemoved: removeDuplicates ? inputPaths.reduce((sum, _, i) => sum + (fileStats[i]?.duplicateCount || 0), 0) : 0
    };
    
    // Calculate sequence length statistics
    const lengths = allRecords.map(r => r.sequence.length);
    const lengthStats = {
      mean: Math.round((lengths.reduce((a, b) => a + b, 0) / lengths.length) * 100) / 100,
      min: Math.min(...lengths),
      max: Math.max(...lengths),
      total: lengths.reduce((a, b) => a + b, 0)
    };
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          summary,
          lengthStats,
          fileDetails: fileStats
        }, null, 2)
      }]
    };
  }
};