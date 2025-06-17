import { defineTool } from "@modelcontextprotocol/sdk";
import { z } from "zod";
import { parseFasta } from "../utils/fastaParser";
import { readFile } from "fs/promises";

export const filterFasta = defineTool({
  name: "filter_fasta_by_length",
  description: "Return all sequences in a file between length range",
  params: z.object({
    path: z.string(),
    minLength: z.number(),
    maxLength: z.number()
  }),
  result: z.object({
    matches: z.array(z.object({
      id: z.string(),
      description: z.string(),
      length: z.number()
    }))
  }),
  async run({ path, minLength, maxLength }) {
    const raw = await readFile(path, "utf-8");
    const records = parseFasta(raw);
    const matches = records
      .filter(r => r.sequence.length >= minLength && r.sequence.length <= maxLength)
      .map(r => ({ id: r.id, description: r.description, length: r.sequence.length }));
    return { matches };
  }
});