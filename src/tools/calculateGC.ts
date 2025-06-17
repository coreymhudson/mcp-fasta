import { z } from "zod";
import { parseFasta } from "../utils/fastaParser.js";
import { readFile } from "fs/promises";

export const calculateGC = {
  definition: {
    name: "calculate_gc_content",
    description: "Calculate GC content and other nucleotide statistics for sequences",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to the FASTA file"
        },
        windowSize: {
          type: "number",
          description: "Window size for sliding window GC analysis (optional)"
        }
      },
      required: ["path"]
    },
  },
  async handler({ path, windowSize }: { path: string; windowSize?: number }) {
    const raw = await readFile(path, "utf-8");
    const records = parseFasta(raw);
    
    const calculateStats = (sequence: string) => {
      const cleanSeq = sequence.replace(/\s/g, '').toUpperCase();
      const length = cleanSeq.length;
      
      const counts = {
        A: (cleanSeq.match(/A/g) || []).length,
        T: (cleanSeq.match(/T/g) || []).length,
        G: (cleanSeq.match(/G/g) || []).length,
        C: (cleanSeq.match(/C/g) || []).length,
        N: (cleanSeq.match(/N/g) || []).length
      };
      
      const gcCount = counts.G + counts.C;
      const atCount = counts.A + counts.T;
      const knownBases = gcCount + atCount;
      
      const gcContent = knownBases > 0 ? (gcCount / knownBases) * 100 : 0;
      const atContent = knownBases > 0 ? (atCount / knownBases) * 100 : 0;
      
      return {
        length,
        counts,
        gcContent: Math.round(gcContent * 100) / 100,
        atContent: Math.round(atContent * 100) / 100,
        nContent: length > 0 ? Math.round((counts.N / length) * 10000) / 100 : 0,
        knownBases
      };
    };
    
    const slidingWindowGC = (sequence: string, windowSize: number) => {
      const cleanSeq = sequence.replace(/\s/g, '').toUpperCase();
      const windows = [];
      
      for (let i = 0; i <= cleanSeq.length - windowSize; i++) {
        const window = cleanSeq.slice(i, i + windowSize);
        const stats = calculateStats(window);
        windows.push({
          position: i + 1,
          gcContent: stats.gcContent
        });
      }
      
      return windows;
    };
    
    const results = records.map(record => {
      const stats = calculateStats(record.sequence);
      const result: any = {
        id: record.id,
        description: record.description,
        ...stats
      };
      
      if (windowSize && windowSize > 0 && windowSize < record.sequence.length) {
        result.slidingWindow = slidingWindowGC(record.sequence, windowSize);
        
        // Calculate sliding window statistics
        const gcValues = result.slidingWindow.map((w: any) => w.gcContent);
        result.slidingWindowStats = {
          windowSize,
          numberOfWindows: gcValues.length,
          meanGC: Math.round((gcValues.reduce((a: number, b: number) => a + b, 0) / gcValues.length) * 100) / 100,
          minGC: Math.min(...gcValues),
          maxGC: Math.max(...gcValues),
          stdDevGC: Math.round(Math.sqrt(gcValues.reduce((sum: number, val: number) => sum + Math.pow(val - (gcValues.reduce((a: number, b: number) => a + b, 0) / gcValues.length), 2), 0) / gcValues.length) * 100) / 100
        };
      }
      
      return result;
    });
    
    // Overall statistics
    const overallStats = {
      totalSequences: results.length,
      meanGC: Math.round((results.reduce((sum, r) => sum + r.gcContent, 0) / results.length) * 100) / 100,
      minGC: Math.min(...results.map(r => r.gcContent)),
      maxGC: Math.max(...results.map(r => r.gcContent)),
      totalLength: results.reduce((sum, r) => sum + r.length, 0)
    };
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          overallStats,
          windowSize,
          sequences: results
        }, null, 2)
      }]
    };
  }
};