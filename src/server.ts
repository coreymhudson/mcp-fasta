import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
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

const server = new Server(
  {
    name: "mcp-fasta",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

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
      return await loadFasta.handler(args as { path: string });
    case "summarize_fasta":
      return await summarizeFasta.handler(args as { path: string });
    case "get_sequence_by_id":
      return await getSequence.handler(args as { path: string; id: string });
    case "filter_fasta_by_length":
      return await filterFasta.handler(args as { path: string; minLength: number; maxLength: number });
    case "write_fasta":
      return await writeFasta.handler(args as { path: string; sequences: Array<{ id: string; description?: string; sequence: string }> });
    case "validate_sequence":
      return await validateSequence.handler(args as { path: string; sequenceType: string });
    case "reverse_complement":
      return await reverseComplement.handler(args as { path: string; outputPath?: string; sequenceIds?: string[] });
    case "translate_sequence":
      return await translateSequence.handler(args as { path: string; readingFrame: number; geneticCode?: string; outputPath?: string });
    case "search_sequence":
      return await searchSequence.handler(args as { path: string; pattern: string; searchType: string; caseSensitive?: boolean; includeReverseComplement?: boolean });
    case "calculate_gc_content":
      return await calculateGC.handler(args as { path: string; windowSize?: number });
    case "split_fasta":
      return await splitFasta.handler(args as { path: string; splitBy: string; value?: number; outputDir: string; prefix?: string });
    case "merge_fasta":
      return await mergeFasta.handler(args as { inputPaths: string[]; outputPath: string; removeDuplicates?: boolean; addFilePrefix?: boolean });
    case "extract_subsequence":
      return await extractSubsequence.handler(args as { path: string; coordinates: Array<{sequenceId: string; start: number; end: number; name?: string}>; outputPath?: string });
    case "find_duplicates":
      return await findDuplicates.handler(args as { path: string; duplicateType: string; caseSensitive?: boolean; outputDuplicates?: string; outputUnique?: string });
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);