import { z } from "zod";
import { parseFasta } from "../utils/fastaParser.js";
import { readFile } from "fs/promises";

export const findDuplicates = {
  definition: {
    name: "find_duplicates",
    description: "Find duplicate sequences in FASTA files based on ID or sequence content",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to the FASTA file"
        },
        duplicateType: {
          type: "string",
          enum: ["id", "sequence", "both"],
          description: "Type of duplicates to find"
        },
        caseSensitive: {
          type: "boolean",
          description: "Whether sequence comparison should be case sensitive"
        },
        outputDuplicates: {
          type: "string",
          description: "Optional output path for duplicate sequences"
        },
        outputUnique: {
          type: "string",
          description: "Optional output path for unique sequences"
        }
      },
      required: ["path", "duplicateType"]
    },
  },
  async handler({ path, duplicateType, caseSensitive = false, outputDuplicates, outputUnique }: { 
    path: string; 
    duplicateType: string;
    caseSensitive?: boolean;
    outputDuplicates?: string;
    outputUnique?: string;
  }) {
    const raw = await readFile(path, "utf-8");
    const records = parseFasta(raw);
    
    const idGroups = new Map<string, any[]>();
    const sequenceGroups = new Map<string, any[]>();
    
    // Group sequences
    records.forEach((record, index) => {
      const cleanSequence = record.sequence.replace(/\s/g, '');
      const sequenceKey = caseSensitive ? cleanSequence : cleanSequence.toUpperCase();
      
      // Group by ID
      if (!idGroups.has(record.id)) {
        idGroups.set(record.id, []);
      }
      idGroups.get(record.id)!.push({ ...record, index });
      
      // Group by sequence
      if (!sequenceGroups.has(sequenceKey)) {
        sequenceGroups.set(sequenceKey, []);
      }
      sequenceGroups.get(sequenceKey)!.push({ ...record, index, sequenceKey });
    });
    
    // Find duplicates
    const duplicateIds = Array.from(idGroups.entries())
      .filter(([_, group]) => group.length > 1)
      .map(([id, group]) => ({
        id,
        count: group.length,
        indices: group.map(r => r.index),
        sequences: group
      }));
    
    const duplicateSequences = Array.from(sequenceGroups.entries())
      .filter(([_, group]) => group.length > 1)
      .map(([sequence, group]) => ({
        sequenceHash: sequence.slice(0, 50) + (sequence.length > 50 ? '...' : ''),
        fullSequenceLength: sequence.length,
        count: group.length,
        indices: group.map(r => r.index),
        sequences: group.map(r => ({
          id: r.id,
          description: r.description,
          index: r.index
        }))
      }));
    
    // Determine which duplicates to report
    let duplicates: any[] = [];
    let duplicateIndices = new Set<number>();
    
    switch (duplicateType) {
      case 'id':
        duplicates = duplicateIds;
        duplicateIds.forEach(dup => 
          dup.indices.forEach((idx: number) => duplicateIndices.add(idx))
        );
        break;
      case 'sequence':
        duplicates = duplicateSequences;
        duplicateSequences.forEach(dup => 
          dup.indices.forEach((idx: number) => duplicateIndices.add(idx))
        );
        break;
      case 'both':
        duplicates = [
          ...duplicateIds.map(d => ({ type: 'id', ...d })),
          ...duplicateSequences.map(d => ({ type: 'sequence', ...d }))
        ];
        duplicateIds.forEach(dup => 
          dup.indices.forEach((idx: number) => duplicateIndices.add(idx))
        );
        duplicateSequences.forEach(dup => 
          dup.indices.forEach((idx: number) => duplicateIndices.add(idx))
        );
        break;
    }
    
    // Get unique sequences (first occurrence of each duplicate group)
    const uniqueSequences = records.filter((_, index) => !duplicateIndices.has(index));
    
    // Add first occurrence of each duplicate group to unique set for complete dataset
    if (duplicateType === 'id' || duplicateType === 'both') {
      duplicateIds.forEach(dup => {
        if (dup.sequences.length > 0) {
          uniqueSequences.push(dup.sequences[0]);
        }
      });
    }
    
    if (duplicateType === 'sequence' || duplicateType === 'both') {
      duplicateSequences.forEach(dup => {
        if (dup.sequences.length > 0) {
          const firstSeq = records[dup.indices[0]];
          if (!uniqueSequences.find(s => s.id === firstSeq.id)) {
            uniqueSequences.push(firstSeq);
          }
        }
      });
    }
    
    // Write output files if requested
    const formatSequence = (record: any) => {
      const header = `>${record.id} ${record.description}`;
      const formattedSequence = record.sequence.match(/.{1,80}/g)?.join('\n') || record.sequence;
      return `${header}\n${formattedSequence}\n`;
    };
    
    if (outputDuplicates && duplicateIndices.size > 0) {
      const { writeFile } = await import("fs/promises");
      const duplicateRecords = records.filter((_, index) => duplicateIndices.has(index));
      const content = duplicateRecords.map(formatSequence).join('');
      await writeFile(outputDuplicates, content, 'utf-8');
    }
    
    if (outputUnique && uniqueSequences.length > 0) {
      const { writeFile } = await import("fs/promises");
      const content = uniqueSequences.map(formatSequence).join('');
      await writeFile(outputUnique, content, 'utf-8');
    }
    
    const summary = {
      totalSequences: records.length,
      duplicateType,
      caseSensitive,
      duplicateCount: duplicateIndices.size,
      uniqueCount: uniqueSequences.length,
      duplicateIdGroups: duplicateIds.length,
      duplicateSequenceGroups: duplicateSequences.length
    };
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          summary,
          duplicates
        }, null, 2)
      }]
    };
  }
};