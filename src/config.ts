import fs from "fs-extra";
import * as path from "path";
import * as os from "os";
import { logToFile } from "./index.js";

// Define types for configurations
export interface SmtpServerConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  isDefault: boolean;
}

export interface RateLimitConfig {
  enabled: boolean;
  messagesPerMinute: number;
}

export interface SmtpConfig {
  smtpServers: SmtpServerConfig[];
  rateLimit: RateLimitConfig;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  isDefault: boolean;
}

export interface EmailLogEntry {
  timestamp: string;
  smtpConfig: string;
  templateId?: string;
  recipient: string;
  subject: string;
  success: boolean;
  message?: string;
}

// Define paths for configuration and data storage
export const CONFIG_DIR = path.join(os.homedir(), ".smtp-mcp-server");
export const TEMPLATES_DIR = path.join(CONFIG_DIR, "templates");
export const LOG_FILE = path.join(CONFIG_DIR, "email-logs.json");

/**
 * Parse the SMTP configuration from a base64-encoded environment variable
 */
function parseSmtpConfigFromEnv(): SmtpConfig {
  try {
    const encodedConfig = process.env.SMTP_CONFIG_BASE64;

    if (!encodedConfig) {
      logToFile(
        "No SMTP_CONFIG_BASE64 environment variable found, using default config"
      );
      throw Error("No config in env!");
    }

    logToFile("Found SMTP_CONFIG_BASE64 environment variable");

    // Decode the base64 string to a JSON string
    const jsonString = Buffer.from(encodedConfig, "base64").toString("utf-8");

    // Log a small sample of the decoded string to verify it was decoded correctly
    logToFile(`Decoded config sample: ${jsonString.substring(0, 50)}...`);

    // Parse the JSON string to an object
    const parsedJson = JSON.parse(jsonString);

    // Log the structure of the parsed JSON to debug
    logToFile(`Parsed config keys: ${JSON.stringify(Object.keys(parsedJson))}`);

    // Check if we have the expected property or need to create a properly formatted config
    const config: SmtpConfig = {
      smtpServers: parsedJson.smtpServers || [],
      rateLimit: parsedJson.rateLimit || 30,
    };

    // Validate the config has the required structure
    if (
      !config.smtpServers ||
      !Array.isArray(config.smtpServers) ||
      config.smtpServers.length === 0
    ) {
      logToFile(
        "Invalid SMTP configuration format in environment variable, using default config"
      );
      throw Error("Config not parsed!");
    }

    // Log the first server to help debug
    if (config.smtpServers.length > 0) {
      const firstServer = config.smtpServers[0];
      logToFile(
        `First server: id=${firstServer.id}, name=${firstServer.name}, host=${firstServer.host}`
      );
    }

    // Ensure at least one server is marked as default
    const hasDefault = config.smtpServers.some((server) => server.isDefault);
    if (!hasDefault && config.smtpServers.length > 0) {
      config.smtpServers[0].isDefault = true;
      logToFile(
        `Setting the first server (${config.smtpServers[0].name}) as default`
      );
    }

    logToFile(
      `Successfully parsed SMTP config with ${config.smtpServers.length} server(s)`
    );
    return config;
  } catch (error) {
    logToFile(
      `Error parsing SMTP config from environment: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    if (error instanceof Error && error.stack) {
      logToFile(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

// Cache the parsed config to avoid decoding on every request
let cachedSmtpConfig: SmtpConfig | null = null;

/**
 * Get SMTP configurations
 */
export async function getSmtpConfigs(): Promise<SmtpServerConfig[]> {
  try {
    if (!cachedSmtpConfig) {
      logToFile("Initializing SMTP configuration cache");
      cachedSmtpConfig = parseSmtpConfigFromEnv();
    }

    const configs = cachedSmtpConfig.smtpServers || [];
    logToFile(`Returning ${configs.length} SMTP configurations`);

    if (configs.length === 0) {
      logToFile("WARNING: No SMTP configurations available!");
    }

    return configs;
  } catch (error) {
    logToFile(
      `Error getting SMTP configs: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    throw error;
  }
}

/**
 * Log email activity
 */
export async function logEmailActivity(entry: EmailLogEntry): Promise<boolean> {
  try {
    // Ensure config directory exists
    await fs.ensureDir(CONFIG_DIR);

    let logs: EmailLogEntry[] = [];

    // Read existing logs if file exists
    if (await fs.pathExists(LOG_FILE)) {
      logs = (await fs.readJson(LOG_FILE)) as EmailLogEntry[];
    }

    // Add new log entry
    logs.push(entry);

    // Write updated logs
    await fs.writeJson(LOG_FILE, logs, { spaces: 2 });
    return true;
  } catch (error) {
    logToFile(
      `Error logging email activity: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return false;
  }
}

/**
 * Get email logs
 */
export async function getEmailLogs(): Promise<EmailLogEntry[]> {
  try {
    if (await fs.pathExists(LOG_FILE)) {
      return (await fs.readJson(LOG_FILE)) as EmailLogEntry[];
    }
    return [];
  } catch (error) {
    logToFile(
      `Error reading email logs: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return [];
  }
}
