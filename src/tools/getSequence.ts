import { z } from "zod";
import { parseFasta } from "../utils/fastaParser.js";
import { readFile } from "fs/promises";

export const getSequence = {
  definition: {
    name: "get_sequence_by_id",
    description: "Fetch a single sequence from a FASTA file by ID",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to the FASTA file"
        },
        id: {
          type: "string",
          description: "Sequence ID to fetch"
        }
      },
      required: ["path", "id"]
    },
  },
  async handler({ path, id }: { path: string; id: string }) {
    const raw = await readFile(path, "utf-8");
    const record = parseFasta(raw).find(r => r.id === id);
    if (!record) throw new Error(`Sequence ID ${id} not found`);
    return {
      content: [{
        type: "text",
        text: JSON.stringify(record, null, 2)
      }]
    };
  }
};