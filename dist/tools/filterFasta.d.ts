export declare const filterFasta: {
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
                minLength: {
                    type: string;
                    description: string;
                };
                maxLength: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    handler({ path, minLength, maxLength }: {
        path: string;
        minLength: number;
        maxLength: number;
    }): Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
};
