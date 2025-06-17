import { defineTool } from "@modelcontextprotocol/sdk";
import { z } from "zod";
import { parseFasta } from "../utils/fastaParser";
import { readFile } from "fs/promises";

export const summarizeFasta = defineTool({
  name: "summarize_fasta",
  description: "Summarize number and length of sequences in a FASTA file",
  params: z.object({
    path: z.string()
  }),
  result: z.object({
    numSequences: z.number(),
    averageLength: z.number(),
    longest: z.number(),
    shortest: z.number()
  }),
  async run({ path }) {
    const raw = await readFile(path, "utf-8");
    const records = parseFasta(raw);
    const lengths = records.map(r => r.sequence.length);
    return {
      numSequences: records.length,
      averageLength: lengths.reduce((a, b) => a + b, 0) / lengths.length,
      longest: Math.max(...lengths),
      shortest: Math.min(...lengths)
    };
  }
});