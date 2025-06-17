import { z } from "zod";
import { parseFasta } from "../utils/fastaParser.js";
import { readFile, writeFile, mkdir } from "fs/promises";
import { dirname } from "path";

export const splitFasta = {
  definition: {
    name: "split_fasta",
    description: "Split a FASTA file into multiple files based on various criteria",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to the FASTA file to split"
        },
        splitBy: {
          type: "string",
          enum: ["count", "size", "individual"],
          description: "Split by sequence count, file size, or individual sequences"
        },
        value: {
          type: "number",
          description: "Number of sequences per file (count) or max file size in MB (size)"
        },
        outputDir: {
          type: "string",
          description: "Output directory for split files"
        },
        prefix: {
          type: "string",
          description: "Prefix for output filenames"
        }
      },
      required: ["path", "splitBy", "outputDir"]
    },
  },
  async handler({ path, splitBy, value, outputDir, prefix = "split" }: { 
    path: string; 
    splitBy: string;
    value?: number;
    outputDir: string;
    prefix?: string;
  }) {
    const raw = await readFile(path, "utf-8");
    const records = parseFasta(raw);
    
    // Ensure output directory exists
    try {
      await mkdir(outputDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
    
    const formatSequence = (record: any) => {
      const header = `>${record.id} ${record.description}`;
      const formattedSequence = record.sequence.match(/.{1,80}/g)?.join('\n') || record.sequence;
      return `${header}\n${formattedSequence}\n`;
    };
    
    const writeFiles = async (groups: any[][], names: string[]) => {
      const results = [];
      for (let i = 0; i < groups.length; i++) {
        const filename = `${outputDir}/${prefix}_${names[i]}.fasta`;
        const content = groups[i].map(formatSequence).join('');
        await writeFile(filename, content, 'utf-8');
        results.push({
          filename,
          sequenceCount: groups[i].length,
          sizeKB: Math.round((content.length / 1024) * 100) / 100
        });
      }
      return results;
    };
    
    let files: any[] = [];
    
    switch (splitBy) {
      case 'individual':
        // One sequence per file
        const individualGroups = records.map(record => [record]);
        const individualNames = records.map((record, i) => `${record.id || (i + 1)}`);
        files = await writeFiles(individualGroups, individualNames);
        break;
        
      case 'count':
        // Split by sequence count
        const seqsPerFile = value || 100;
        const countGroups = [];
        const countNames = [];
        
        for (let i = 0; i < records.length; i += seqsPerFile) {
          countGroups.push(records.slice(i, i + seqsPerFile));
          countNames.push(`part${Math.floor(i / seqsPerFile) + 1}`);
        }
        
        files = await writeFiles(countGroups, countNames);
        break;
        
      case 'size':
        // Split by approximate file size
        const maxSizeMB = value || 10;
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        
        const sizeGroups = [];
        const sizeNames = [];
        let currentGroup: any[] = [];
        let currentSize = 0;
        let fileNumber = 1;
        
        for (const record of records) {
          const recordSize = formatSequence(record).length;
          
          if (currentSize + recordSize > maxSizeBytes && currentGroup.length > 0) {
            sizeGroups.push([...currentGroup]);
            sizeNames.push(`part${fileNumber}`);
            currentGroup = [record];
            currentSize = recordSize;
            fileNumber++;
          } else {
            currentGroup.push(record);
            currentSize += recordSize;
          }
        }
        
        if (currentGroup.length > 0) {
          sizeGroups.push(currentGroup);
          sizeNames.push(`part${fileNumber}`);
        }
        
        files = await writeFiles(sizeGroups, sizeNames);
        break;
        
      default:
        throw new Error(`Unknown split method: ${splitBy}`);
    }
    
    const summary = {
      originalFile: path,
      originalSequences: records.length,
      outputDirectory: outputDir,
      splitMethod: splitBy,
      splitValue: value,
      filesCreated: files.length,
      totalSizeKB: Math.round(files.reduce((sum, f) => sum + f.sizeKB, 0) * 100) / 100
    };
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          summary,
          files
        }, null, 2)
      }]
    };
  }
};