import { defineTool } from "@modelcontextprotocol/sdk";
import { z } from "zod";
import { parseFasta } from "../utils/fastaParser";
import { readFile } from "fs/promises";

export const loadFasta = defineTool({
  name: "load_fasta",
  description: "Load a FASTA file and parse into sequence records",
  params: z.object({
    path: z.string()
  }),
  result: z.object({
    records: z.array(z.object({
      id: z.string(),
      description: z.string(),
      length: z.number()
    }))
  }),
  async run({ path }) {
    const raw = await readFile(path, "utf-8");
    const records = parseFasta(raw).map(r => ({
      id: r.id,
      description: r.description,
      length: r.sequence.length
    }));
    return { records };
  }
});