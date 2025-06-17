export type SequenceRecord = {
    id: string;
    description: string;
    sequence: string;
};
export declare function parseFasta(raw: string): SequenceRecord[];
