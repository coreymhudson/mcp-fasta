import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { loadFasta } from "./tools/loadFasta.js";
import { summarizeFasta } from "./tools/summarizeFasta.js";
import { getSequence } from "./tools/getSequence.js";
import { filterFasta } from "./tools/filterFasta.js";
import { writeFasta } from "./tools/writeFasta.js";
import { validateSequence } from "./tools/validateSequence.js";
import { reverseComplement } from "./tools/reverseComplement.js";
import { translateSequence } from "./tools/translateSequence.js";
import { searchSequence } from "./tools/searchSequence.js";
import { calculateGC } from "./tools/calculateGC.js";
import { splitFasta } from "./tools/splitFasta.js";
import { mergeFasta } from "./tools/mergeFasta.js";
import { extractSubsequence } from "./tools/extractSubsequence.js";
import { findDuplicates } from "./tools/findDuplicates.js";
const server = new Server({
    name: "mcp-fasta",
    version: "0.1.0",
}, {
    capabilities: {
        tools: {},
    },
});
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            loadFasta.definition,
            summarizeFasta.definition,
            getSequence.definition,
            filterFasta.definition,
            writeFasta.definition,
            validateSequence.definition,
            reverseComplement.definition,
            translateSequence.definition,
            searchSequence.definition,
            calculateGC.definition,
            splitFasta.definition,
            mergeFasta.definition,
            extractSubsequence.definition,
            findDuplicates.definition,
        ],
    };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    if (!args) {
        throw new Error("Tool arguments are required");
    }
    switch (name) {
        case "load_fasta":
            return await loadFasta.handler(args);
        case "summarize_fasta":
            return await summarizeFasta.handler(args);
        case "get_sequence_by_id":
            return await getSequence.handler(args);
        case "filter_fasta_by_length":
            return await filterFasta.handler(args);
        case "write_fasta":
            return await writeFasta.handler(args);
        case "validate_sequence":
            return await validateSequence.handler(args);
        case "reverse_complement":
            return await reverseComplement.handler(args);
        case "translate_sequence":
            return await translateSequence.handler(args);
        case "search_sequence":
            return await searchSequence.handler(args);
        case "calculate_gc_content":
            return await calculateGC.handler(args);
        case "split_fasta":
            return await splitFasta.handler(args);
        case "merge_fasta":
            return await mergeFasta.handler(args);
        case "extract_subsequence":
            return await extractSubsequence.handler(args);
        case "find_duplicates":
            return await findDuplicates.handler(args);
        default:
            throw new Error(`Unknown tool: ${name}`);
    }
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch(console.error);
