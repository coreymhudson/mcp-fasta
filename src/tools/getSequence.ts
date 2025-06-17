import { defineTool } from "@modelcontextprotocol/sdk";
import { z } from "zod";
import { parseFasta } from "../utils/fastaParser";
import { readFile } from "fs/promises";

export const getSequence = defineTool({
  name: "get_sequence_by_id",
  description: "Fetch a single sequence from a FASTA file by ID",
  params: z.object({
    path: z.string(),
    id: z.string()
  }),
  result: z.object({
    id: z.string(),
    description: z.string(),
    sequence: z.string()
  }),
  async run({ path, id }) {
    const raw = await readFile(path, "utf-8");
    const record = parseFasta(raw).find(r => r.id === id);
    if (!record) throw new Error(`Sequence ID ${id} not found`);
    return record;
  }
});