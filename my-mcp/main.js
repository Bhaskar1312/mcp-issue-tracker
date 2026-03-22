import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import apiBasedTools from "./api-based-tools.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create an MCP server
const server = new McpServer({
    name: "issues-server",
    version: "1.0.0",
});
apiBasedTools(server);

// Register the database schema resource
server.registerResource(
    "database-schema",
    "schema://database",
    // database-schema is the name of the resource
    // schema://database is the URI. This gives it a unique identifier that can be used by programs and LLMs to refer to specific resources.
    // Resource templates (which are dynamic) are really similar. The biggest difference is their URIs have something like schema://database/{table} or something like that and {table} becomes the name of the parameter that can be passed in.
    {
        title: "Database Schema",
        description: "SQLite schema for the issues database",
        mimeType: "text/plain",
    },
    async (uri) => {
        const dbPath = path.join(__dirname, "..", "backend", "database.sqlite");

        const schema = await new Promise((resolve, reject) => {
            const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);

            db.all(
                "SELECT sql FROM sqlite_master WHERE type='table' AND sql IS NOT NULL ORDER BY name",
                (err, rows) => {
                    db.close();
                    if (err) reject(err);
                    else resolve(rows.map((row) => row.sql + ";").join("\n"));
                }
            );
        });

        return {
            contents: [
                {
                    uri: uri.href,
                    mimeType: "text/plain",
                    text: schema,
                },
            ],
        };
    }
);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);

// click the ➕ button in the text box. You should see the ability to attach a resource. Attach the database schema and then ask the LLM
// explain my database schema for my issue to me in plain english

//  you're having Claude help you write some code and you want it to follow a particular style. You could attach the style guide as a resource (which is a perfectly fine way to do it) or we could do it with prompt.