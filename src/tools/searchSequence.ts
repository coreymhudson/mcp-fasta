import { z } from "zod";
import { parseFasta } from "../utils/fastaParser.js";
import { readFile } from "fs/promises";

export const searchSequence = {
  definition: {
    name: "search_sequence",
    description: "Search for patterns, motifs, or subsequences in FASTA sequences",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to the FASTA file"
        },
        pattern: {
          type: "string",
          description: "Pattern to search for (supports IUPAC codes and regex)"
        },
        searchType: {
          type: "string",
          enum: ["exact", "regex", "iupac"],
          description: "Type of search to perform"
        },
        caseSensitive: {
          type: "boolean",
          description: "Whether search should be case sensitive"
        },
        includeReverseComplement: {
          type: "boolean",
          description: "Search reverse complement as well (DNA only)"
        }
      },
      required: ["path", "pattern", "searchType"]
    },
  },
  async handler({ path, pattern, searchType, caseSensitive = false, includeReverseComplement = false }: { 
    path: string; 
    pattern: string;
    searchType: string;
    caseSensitive?: boolean;
    includeReverseComplement?: boolean;
  }) {
    const raw = await readFile(path, "utf-8");
    const records = parseFasta(raw);
    
    // IUPAC nucleotide codes
    const iupacCodes: { [key: string]: string } = {
      'R': '[AG]', 'Y': '[CT]', 'S': '[GC]', 'W': '[AT]',
      'K': '[GT]', 'M': '[AC]', 'B': '[CGT]', 'D': '[AGT]',
      'H': '[ACT]', 'V': '[ACG]', 'N': '[ACGT]'
    };
    
    const convertIupacToRegex = (iupacPattern: string): string => {
      let regexPattern = iupacPattern.toUpperCase();
      Object.entries(iupacCodes).forEach(([code, replacement]) => {
        regexPattern = regexPattern.replace(new RegExp(code, 'g'), replacement);
      });
      return regexPattern;
    };
    
    const reverseComplement = (seq: string): string => {
      const complementMap: { [key: string]: string } = {
        'A': 'T', 'T': 'A', 'C': 'G', 'G': 'C', 'N': 'N'
      };
      return seq.split('').reverse().map(base => complementMap[base.toUpperCase()] || 'N').join('');
    };
    
    let searchRegex: RegExp;
    
    switch (searchType) {
      case 'exact':
        const flags = caseSensitive ? 'g' : 'gi';
        searchRegex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
        break;
      case 'regex':
        const regexFlags = caseSensitive ? 'g' : 'gi';
        searchRegex = new RegExp(pattern, regexFlags);
        break;
      case 'iupac':
        const iupacPattern = convertIupacToRegex(pattern);
        const iupacFlags = caseSensitive ? 'g' : 'gi';
        searchRegex = new RegExp(iupacPattern, iupacFlags);
        break;
      default:
        throw new Error(`Unknown search type: ${searchType}`);
    }
    
    const searchResults = records.map(record => {
      const sequence = record.sequence.replace(/\\s/g, '');
      const matches: Array<{
        position: number;
        match: string;
        strand: string;
        context?: string;
      }> = [];
      
      // Search forward strand
      let match;
      const forwardSequence = caseSensitive ? sequence : sequence.toUpperCase();
      while ((match = searchRegex.exec(forwardSequence)) !== null) {
        const contextStart = Math.max(0, match.index - 10);
        const contextEnd = Math.min(sequence.length, match.index + match[0].length + 10);
        const context = sequence.slice(contextStart, contextEnd);
        
        matches.push({
          position: match.index + 1, // 1-indexed
          match: match[0],
          strand: 'forward',
          context
        });
        
        // Prevent infinite loop for zero-length matches
        if (match.index === searchRegex.lastIndex) {
          searchRegex.lastIndex++;
        }
      }
      
      // Search reverse complement if requested
      if (includeReverseComplement) {
        const rcSequence = reverseComplement(sequence);
        const rcSearchSequence = caseSensitive ? rcSequence : rcSequence.toUpperCase();
        searchRegex.lastIndex = 0; // Reset regex
        
        while ((match = searchRegex.exec(rcSearchSequence)) !== null) {
          const rcPosition = sequence.length - match.index - match[0].length + 1;
          const contextStart = Math.max(0, match.index - 10);
          const contextEnd = Math.min(rcSequence.length, match.index + match[0].length + 10);
          const context = rcSequence.slice(contextStart, contextEnd);
          
          matches.push({
            position: rcPosition,
            match: match[0],
            strand: 'reverse',
            context
          });
          
          if (match.index === searchRegex.lastIndex) {
            searchRegex.lastIndex++;
          }
        }
      }
      
      return {
        id: record.id,
        description: record.description,
        sequenceLength: sequence.length,
        matchCount: matches.length,
        matches: matches.sort((a, b) => a.position - b.position)
      };
    });
    
    const totalMatches = searchResults.reduce((sum, result) => sum + result.matchCount, 0);
    const sequencesWithMatches = searchResults.filter(result => result.matchCount > 0).length;
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          searchPattern: pattern,
          searchType,
          caseSensitive,
          includeReverseComplement,
          summary: {
            totalSequences: searchResults.length,
            sequencesWithMatches,
            totalMatches
          },
          results: searchResults
        }, null, 2)
      }]
    };
  }
};