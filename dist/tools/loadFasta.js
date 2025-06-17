import { parseFasta } from "../utils/fastaParser.js";
import { readFile } from "fs/promises";
export const loadFasta = {
    definition: {
        name: "load_fasta",
        description: "Load a FASTA file and parse into sequence records",
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
    async handler({ path }) {
        const raw = await readFile(path, "utf-8");
        const records = parseFasta(raw).map(r => ({
            id: r.id,
            description: r.description,
            length: r.sequence.length
        }));
        return {
            content: [{
                    type: "text",
                    text: JSON.stringify({ records }, null, 2)
                }]
        };
    }
};
