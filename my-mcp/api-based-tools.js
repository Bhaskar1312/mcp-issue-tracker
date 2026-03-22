import { z } from "zod";

export default function apiBasedTools(server) {
    const API_BASED_URL = process.env.API_BASE_URL || "http://localhost:3000/api";

    // helper to make api req
    async function makeRequest(method, url, data=null, options= {}){
        const config = {
            method,
            headers : {
                "Content-Type": "application/json",
                ...options.headers
            },
        };
        // merge other options except headers, which already merged
        const { headers: _, ...otherOptions } = options;
        Object.assign(config, otherOptions);

        if(data) {
            config.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, config);
            const result = await response.text();

            let jsonResult;
            try {
                jsonResult = JSON.parse(result);
            } catch (e) {
                jsonResult = result; // if not JSON, return as text
            }

            return {
                status: response.status,
                data: jsonResult,
                headers: Object.fromEntries(response.headers.entries())
            };
        } catch (error) {
            return {
                status: 0,
                error: error.message,
            };
        }
    }

    server.registerTool(
        'issues-create',
        {
            title: 'Create Issue',
            description: 'Create a new issue in the issue tracker',
            inputSchema: {
                title: z.string().describe("Issue title"),
                description: z.string().optional().describe("Issue description"),
                status: z
                    .enum(["not_started", "in_progress", "done"])
                    .optional()
                    .describe("Issue status"),
                priority: z
                    .enum(["low", "medium", "high", "urgent"])
                    .optional()
                    .describe("Issue priority"),
                assigned_user_id: z.string().optional().describe("Assigned user ID"),
                tag_ids: z.array(z.number()).optional().describe("Array of tag IDs"),
                apiKey: z.string().describe("API key for authentication"),
            },
        },
        async (params) => {
            const { apiKey, ...issueData} = params;

            const result = await makeRequest(
                "POST",
                `${API_BASED_URL}/issues`,
                issueData,
                {
                    headers: { "x-api-key": apiKey },
                }
            );

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            };
        }
    );
}
