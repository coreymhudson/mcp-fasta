export declare const loadFasta: {
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
            };
            required: string[];
        };
    };
    handler({ path }: {
        path: string;
    }): Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
};
