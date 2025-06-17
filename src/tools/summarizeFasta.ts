import { z } from "zod";
import { parseFasta } from "../utils/fastaParser.js";
import { readFile } from "fs/promises";

export const summarizeFasta = {
  definition: {
    name: "summarize_fasta",
    description: "Summarize number and length of sequences in a FASTA file",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to the FASTA file"
        }
      },
      required: ["path"]
    },
  },
  async handler({ path }: { path: string }) {
    const raw = await readFile(path, "utf-8");
    const records = parseFasta(raw);
    const lengths = records.map(r => r.sequence.length);
    const summary = {
      numSequences: records.length,
      averageLength: lengths.reduce((a, b) => a + b, 0) / lengths.length,
      longest: Math.max(...lengths),
      shortest: Math.min(...lengths)
    };
    return {
      content: [{
        type: "text",
        text: JSON.stringify(summary, null, 2)
      }]
    };
  }
};