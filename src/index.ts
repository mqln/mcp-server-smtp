#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createToolDefinitions } from "./tools.js";
import { setupRequestHandlers } from "./requestHandler.js";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { CONFIG_DIR, getSmtpConfigs } from "./config.js";

// Set up logging to a file instead of console
const logDir = path.join(os.homedir(), "smtp-mcp-server-logs");
try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
} catch (error) {
  // Silently fail if we can't create the log directory
}

const logFile = path.join(logDir, "smtp-mcp-server.log");

export function logToFile(message: string): void {
  try {
    fs.appendFileSync(logFile, `${new Date().toISOString()} - ${message}\n`);
  } catch (error) {
    // Silently fail if we can't write to the log file
  }
}

/**
 * Main function to run the SMTP MCP server
 */
async function runServer() {
  try {
    // Ensure config directories exist
    try {
      if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
      }
    } catch (error) {
      logToFile(`Error creating config directory: ${error}`);
      // Continue even if we can't create the config directory
    }

    // Initialize the server
    const server = new Server(
      {
        name: "smtp-email-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    // Set error handler
    server.onerror = (error) => logToFile(`[MCP Error] ${error}`);

    // Create tool definitions
    const TOOLS = createToolDefinitions();

    logToFile(`Environment keys: ${Object.keys(process.env).join(", ")}`);

    getSmtpConfigs();

    // Setup request handlers
    await setupRequestHandlers(server, TOOLS);

    // Create transport and connect
    const transport = new StdioServerTransport();
    await server.connect(transport);

    logToFile("SMTP MCP Server started successfully");
  } catch (error) {
    logToFile(`Server failed to start: ${error}`);
    process.exit(1);
  }
}

// Run the server
runServer().catch((error) => {
  logToFile(`Server failed to start: ${error}`);
  process.exit(1);
});
