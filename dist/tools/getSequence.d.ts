export declare const getSequence: {
    definition: {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                path: {
                    type: string;
                    description: string;
                };
                id: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    handler({ path, id }: {
        path: string;
        id: string;
    }): Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
};
