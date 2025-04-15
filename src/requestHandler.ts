import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  Tool,
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { getSmtpConfigs, getEmailLogs, EmailLogEntry } from "./config.js";
import {
  sendEmail,
  sendBulkEmails,
  EmailData,
  BulkEmailData,
  EmailRecipient,
} from "./emailService.js";
import { logToFile } from "./index.js";

/**
 * Setup request handlers for the MCP server
 */
export async function setupRequestHandlers(
  server: Server,
  tools: Record<string, Tool>
): Promise<void> {
  // Handle tool listing
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: Object.values(tools),
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    const toolParams = request.params.arguments || {};

    // Check if the tool exists
    if (!tools[toolName]) {
      throw new Error(`Tool '${toolName}' not found`);
    }

    // Execute the tool based on its name
    switch (toolName) {
      case "send-email":
        return await handleSendEmail(toolParams);

      case "send-bulk-emails":
        return await handleSendBulkEmails(toolParams);

      case "get-smtp-configs":
        return await handleGetSmtpConfigs();

      case "get-email-logs": {
        const { limit, filterBySuccess } = toolParams as {
          limit?: number;
          filterBySuccess?: boolean;
        };

        try {
          let logs = await getEmailLogs();

          // Filter by success status if specified
          if (filterBySuccess !== undefined) {
            logs = logs.filter(
              (log: EmailLogEntry) => log.success === filterBySuccess
            );
          }

          // Sort by timestamp in descending order (newest first)
          logs = logs.sort(
            (a: EmailLogEntry, b: EmailLogEntry) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );

          // Limit the number of results if specified
          if (limit && limit > 0) {
            logs = logs.slice(0, limit);
          }

          return {
            success: true,
            result: logs,
            content: [
              {
                type: "text",
                text: `📋 Retrieved ${logs.length} email log${
                  logs.length !== 1 ? "s" : ""
                }${
                  filterBySuccess !== undefined
                    ? ` (filtered by success=${filterBySuccess})`
                    : ""
                }`,
              },
            ],
          };
        } catch (error) {
          logToFile(`Error getting email logs: ${error}`);
          return {
            success: false,
            message: "Failed to retrieve email logs",
            content: [
              {
                type: "text",
                text: "❌ Failed to retrieve email logs",
              },
            ],
          };
        }
      }

      default:
        throw new Error(
          `Tool '${toolName}' exists but no handler is implemented`
        );
    }
  });
}

/**
 * Handle send-email tool call
 */
async function handleSendEmail(parameters: any) {
  try {
    // If "to" is a single object, convert it to an array
    const to = Array.isArray(parameters.to) ? parameters.to : [parameters.to];

    // Prepare the email data
    const emailData: EmailData = {
      to: to,
      subject: parameters.subject,
      body: parameters.body,
      from: parameters.from,
      cc: parameters.cc,
      bcc: parameters.bcc,
      templateId: parameters.templateId,
      templateData: parameters.templateData,
    };

    // Send the email
    const result = await sendEmail(emailData, parameters.smtpConfigId);

    return {
      success: result.success,
      message: result.message,
      content: [
        {
          type: "text",
          text: result.success
            ? `✅ Email sent successfully`
            : `❌ Failed to send email: ${result.message}`,
        },
      ],
    };
  } catch (error) {
    logToFile("Error in handleSendEmail:");
    logToFile(error instanceof Error ? error.message : "Unknown error");
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      content: [
        {
          type: "text",
          text: `❌ Error sending email: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        },
      ],
    };
  }
}

/**
 * Handle send-bulk-emails tool call
 */
async function handleSendBulkEmails(parameters: any) {
  try {
    // Prepare the bulk email data
    const bulkEmailData: BulkEmailData = {
      recipients: parameters.recipients,
      subject: parameters.subject,
      body: parameters.body,
      from: parameters.from,
      cc: parameters.cc,
      bcc: parameters.bcc,
      templateId: parameters.templateId,
      templateData: parameters.templateData,
      batchSize: parameters.batchSize,
      delayBetweenBatches: parameters.delayBetweenBatches,
    };

    // Send the bulk emails
    const result = await sendBulkEmails(bulkEmailData, parameters.smtpConfigId);

    return {
      success: result.success,
      totalSent: result.totalSent,
      totalFailed: result.totalFailed,
      failures: result.failures,
      message: result.message,
      content: [
        {
          type: "text",
          text: result.success
            ? `✅ Bulk email operation completed: ${result.totalSent} sent, ${result.totalFailed} failed`
            : `⚠️ Bulk email operation completed with issues: ${result.totalSent} sent, ${result.totalFailed} failed. ${result.message}`,
        },
      ],
    };
  } catch (error) {
    logToFile("Error in handleSendBulkEmails:");
    logToFile(error instanceof Error ? error.message : "Unknown error");
    return {
      success: false,
      totalSent: 0,
      totalFailed: parameters.recipients?.length || 0,
      message: error instanceof Error ? error.message : "Unknown error",
      content: [
        {
          type: "text",
          text: `❌ Bulk email operation failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        },
      ],
    };
  }
}

/**
 * Handle get-smtp-configs tool call
 */
async function handleGetSmtpConfigs() {
  try {
    const configs = await getSmtpConfigs();

    return {
      success: true,
      configs: configs,
      content: [
        {
          type: "text",
          text: `📧 Retrieved ${configs.length} SMTP configuration${
            configs.length !== 1 ? "s" : ""
          } \n ${configs.map((config) => JSON.stringify(config))}`,
        },
      ],
    };
  } catch (error) {
    logToFile("Error in handleGetSmtpConfigs:");
    logToFile(error instanceof Error ? error.message : "Unknown error");
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      content: [
        {
          type: "text",
          text: `❌ Failed to retrieve SMTP configurations: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        },
      ],
    };
  }
}
