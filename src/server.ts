import { createServer } from "@modelcontextprotocol/sdk";
import { loadFasta } from "./tools/loadFasta.js";
import { summarizeFasta } from "./tools/summarizeFasta.js";
import { getSequence } from "./tools/getSequence.js";
import { filterFasta } from "./tools/filterFasta.js";

const server = createServer({
  tools: [loadFasta, summarizeFasta, getSequence, filterFasta]
});

server.listen(3333);