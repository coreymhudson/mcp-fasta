export type SequenceRecord = {
  id: string;
  description: string;
  sequence: string;
};

export function parseFasta(raw: string): SequenceRecord[] {
  const lines = raw.split(/\r?\n/);
  const records: SequenceRecord[] = [];
  let current: SequenceRecord | null = null;

  for (const line of lines) {
    if (line.startsWith(">")) {
      if (current) records.push(current);
      const [id, ...desc] = line.slice(1).split(" ");
      current = { id, description: desc.join(" "), sequence: "" };
    } else if (current) {
      current.sequence += line.trim();
    }
  }

  if (current) records.push(current);
  return records;
}