# MCP FASTA

A Model Context Protocol (MCP) server for working with FASTA files in VS Code with Claude. This server provides tools for parsing, analyzing, and manipulating FASTA sequence files commonly used in bioinformatics.

## Features

- **Load FASTA files** - Parse FASTA files and extract sequence metadata
- **Summarize sequences** - Get statistics about sequence lengths and counts
- **Fetch specific sequences** - Retrieve individual sequences by ID
- **Filter by length** - Find sequences within specified length ranges
- **Write FASTA files** - Create new FASTA files from sequence data
- **Validate sequences** - Check sequence format and composition
- **Reverse complement** - Generate reverse complement of DNA sequences
- **Translate sequences** - Convert DNA to protein using genetic codes
- **Search patterns** - Find motifs, patterns, or subsequences
- **Calculate GC content** - Analyze nucleotide composition and GC content
- **Split FASTA files** - Divide large files into smaller chunks
- **Merge FASTA files** - Combine multiple files with duplicate handling
- **Extract subsequences** - Extract regions by coordinates
- **Find duplicates** - Identify duplicate sequences by ID or content

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

5. **`write_fasta`** - Write sequences to a FASTA file
   - **Input**:
     - `path` (string) - Output path for the FASTA file
     - `sequences` (array) - Array of sequence objects with `id`, `sequence`, and optional `description`
   - **Output**: Confirmation message with number of sequences written

6. **`validate_sequence`** - Validate sequences for proper nucleotide/amino acid composition
   - **Input**:
     - `path` (string) - Path to the FASTA file
     - `sequenceType` (enum) - Type to validate: "dna", "rna", "protein", or "auto"
   - **Output**: Validation results with invalid characters and detected types

7. **`reverse_complement`** - Generate reverse complement of DNA sequences
   - **Input**:
     - `path` (string) - Path to the FASTA file
     - `outputPath` (string, optional) - Output file for reverse complement sequences
     - `sequenceIds` (array, optional) - Specific sequence IDs to process
   - **Output**: Reverse complement sequences with statistics

8. **`translate_sequence`** - Translate DNA sequences to protein using genetic code
   - **Input**:
     - `path` (string) - Path to the FASTA file
     - `readingFrame` (number) - Reading frame (1-3 forward, -1 to -3 reverse)
     - `geneticCode` (string, optional) - Genetic code table ("standard", "vertebrate_mitochondrial", "bacterial")
     - `outputPath` (string, optional) - Output file for translated sequences
   - **Output**: Translated protein sequences with statistics

9. **`search_sequence`** - Search for patterns, motifs, or subsequences
   - **Input**:
     - `path` (string) - Path to the FASTA file
     - `pattern` (string) - Search pattern (supports IUPAC codes and regex)
     - `searchType` (enum) - Type: "exact", "regex", or "iupac"
     - `caseSensitive` (boolean, optional) - Case sensitivity
     - `includeReverseComplement` (boolean, optional) - Search reverse strand
   - **Output**: Match positions and context for all sequences

10. **`calculate_gc_content`** - Calculate GC content and nucleotide statistics
    - **Input**:
      - `path` (string) - Path to the FASTA file
      - `windowSize` (number, optional) - Window size for sliding window analysis
    - **Output**: GC content, nucleotide counts, and optional sliding window data

11. **`split_fasta`** - Split FASTA files into multiple files
    - **Input**:
      - `path` (string) - Path to the FASTA file
      - `splitBy` (enum) - Split method: "count", "size", or "individual"
      - `value` (number, optional) - Sequences per file or max size in MB
      - `outputDir` (string) - Output directory
      - `prefix` (string, optional) - Filename prefix
    - **Output**: Information about created files

12. **`merge_fasta`** - Merge multiple FASTA files
    - **Input**:
      - `inputPaths` (array) - Array of input file paths
      - `outputPath` (string) - Output merged file path
      - `removeDuplicates` (boolean, optional) - Remove duplicate sequences
      - `addFilePrefix` (boolean, optional) - Add filename to sequence IDs
    - **Output**: Merge statistics and sequence information

13. **`extract_subsequence`** - Extract subsequences by coordinates
    - **Input**:
      - `path` (string) - Path to the FASTA file
      - `coordinates` (array) - Array of extraction coordinates with sequenceId, start, end
      - `outputPath` (string, optional) - Output file for extracted sequences
    - **Output**: Extracted subsequences with coordinate information

14. **`find_duplicates`** - Find duplicate sequences
    - **Input**:
      - `path` (string) - Path to the FASTA file
      - `duplicateType` (enum) - Type: "id", "sequence", or "both"
      - `caseSensitive` (boolean, optional) - Case sensitivity for sequence comparison
      - `outputDuplicates` (string, optional) - Output file for duplicates
      - `outputUnique` (string, optional) - Output file for unique sequences
    - **Output**: Duplicate analysis and grouping information

### Command Line Claude Usage

To use with command line Claude, simply run the startup script from the project directory:

```bash
./start-claude.sh
```

This script automatically:
- Changes to the correct directory
- Starts Claude with the proper MCP configuration
- Loads all FASTA tools automatically

Alternatively, you can run Claude manually:

```bash
cd "/path/to/mcp-fasta"
claude --mcp-config mcp-config-portable.json
```

### Manual Server Usage

You can also run the MCP server manually for debugging:

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
│   ├── filterFasta.ts    # Filter sequences by length
│   ├── writeFasta.ts     # Write sequences to FASTA files
│   ├── validateSequence.ts # Validate sequence composition
│   ├── reverseComplement.ts # Generate reverse complement
│   ├── translateSequence.ts # Translate DNA to protein
│   ├── searchSequence.ts    # Search patterns and motifs
│   ├── calculateGC.ts       # Calculate GC content
│   ├── splitFasta.ts        # Split FASTA files
│   ├── mergeFasta.ts        # Merge multiple FASTA files
│   ├── extractSubsequence.ts # Extract by coordinates
│   └── findDuplicates.ts     # Find duplicate sequences
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
