import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { loadFasta } from "./tools/loadFasta.js";
import { summarizeFasta } from "./tools/summarizeFasta.js";
import { getSequence } from "./tools/getSequence.js";
import { filterFasta } from "./tools/filterFasta.js";
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
        default:
            throw new Error(`Unknown tool: ${name}`);
    }
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch(console.error);
