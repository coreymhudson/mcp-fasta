# MCP FASTA

A Model Context Protocol (MCP) server for working with FASTA files in VS Code with Claude. This server provides tools for parsing, analyzing, and manipulating FASTA sequence files commonly used in bioinformatics.

## Features

- **Load FASTA files** - Parse FASTA files and extract sequence metadata
- **Summarize sequences** - Get statistics about sequence lengths and counts
- **Fetch specific sequences** - Retrieve individual sequences by ID
- **Filter by length** - Find sequences within specified length ranges

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mcp-fasta
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Usage

### With VS Code and Claude

The server is automatically configured for VS Code with Claude. Once built, the MCP server will be available in Claude with the following tools:

#### Available Tools

1. **`load_fasta`** - Load a FASTA file and parse into sequence records
   - **Input**: `path` (string) - Path to the FASTA file
   - **Output**: Array of sequence records with ID, description, and length

2. **`summarize_fasta`** - Summarize number and length of sequences in a FASTA file
   - **Input**: `path` (string) - Path to the FASTA file  
   - **Output**: Statistics including number of sequences, average length, longest, and shortest

3. **`get_sequence_by_id`** - Fetch a single sequence from a FASTA file by ID
   - **Input**: 
     - `path` (string) - Path to the FASTA file
     - `id` (string) - Sequence ID to fetch
   - **Output**: Complete sequence record with ID, description, and sequence

4. **`filter_fasta_by_length`** - Return all sequences in a file between length range
   - **Input**:
     - `path` (string) - Path to the FASTA file
     - `minLength` (number) - Minimum sequence length
     - `maxLength` (number) - Maximum sequence length
   - **Output**: Array of matching sequences with metadata

### Manual Server Usage

You can also run the server manually:

```bash
npm start
```

The server uses stdio transport and communicates via JSON-RPC.

## Development

### Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start the MCP server
- `npm run dev` - Build and start in one command

### Project Structure

```
src/
├── server.ts              # Main MCP server
├── tools/                 # Tool implementations
│   ├── loadFasta.ts      # Load and parse FASTA files
│   ├── summarizeFasta.ts # Generate sequence statistics
│   ├── getSequence.ts    # Fetch sequences by ID
│   └── filterFasta.ts    # Filter sequences by length
└── utils/
    └── fastaParser.ts    # FASTA file parsing utilities
```

## FASTA Format Support

This server supports standard FASTA format files:

```
>sequence_id_1 Description of sequence 1
ATCGATCGATCGATCG
ATCGATCGATCGATCG
>sequence_id_2 Description of sequence 2
GCTAGCTAGCTAGCTA
GCTAGCTAGCTAGCTA
```

## Requirements

- Node.js 18+
- TypeScript 5.1+
- VS Code with Claude extension (for integrated usage)

## License

See LICENSE file for details.
