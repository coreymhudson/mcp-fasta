import { parseFasta } from "../utils/fastaParser.js";
import { readFile } from "fs/promises";
export const filterFasta = {
    definition: {
        name: "filter_fasta_by_length",
        description: "Return all sequences in a file between length range",
        inputSchema: {
            type: "object",
            properties: {
                path: {
                    type: "string",
                    description: "Path to the FASTA file"
                },
                minLength: {
                    type: "number",
                    description: "Minimum sequence length"
                },
                maxLength: {
                    type: "number",
                    description: "Maximum sequence length"
                }
            },
            required: ["path", "minLength", "maxLength"]
        },
    },
    async handler({ path, minLength, maxLength }) {
        const raw = await readFile(path, "utf-8");
        const records = parseFasta(raw);
        const matches = records
            .filter(r => r.sequence.length >= minLength && r.sequence.length <= maxLength)
            .map(r => ({ id: r.id, description: r.description, length: r.sequence.length }));
        return {
            content: [{
                    type: "text",
                    text: JSON.stringify({ matches }, null, 2)
                }]
        };
    }
};
