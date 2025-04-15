import { Tool } from "@modelcontextprotocol/sdk/types.js";
/**
 * Create tool definitions
 */
export function createToolDefinitions(): Record<string, Tool> {
  return {
    "send-email": {
      name: "send-email",
      description: "Send an email to one or more recipients",
      inputSchema: {
        type: "object",
        properties: {
          to: {
            type: "array",
            items: {
              type: "object",
              properties: {
                email: { type: "string" },
                name: { type: "string" },
              },
              required: ["email"],
            },
            description: "Array of recipients",
          },
          subject: {
            type: "string",
            description: "Email subject",
          },
          body: {
            type: "string",
            description: "Email body (HTML supported)",
          },
          from: {
            type: "object",
            properties: {
              email: { type: "string" },
              name: { type: "string" },
            },
            description:
              "Sender information. If not provided, the default SMTP user will be used.",
          },
          cc: {
            type: "array",
            items: {
              type: "object",
              properties: {
                email: { type: "string" },
                name: { type: "string" },
              },
              required: ["email"],
            },
            description: "Array of CC recipients",
          },
          bcc: {
            type: "array",
            items: {
              type: "object",
              properties: {
                email: { type: "string" },
                name: { type: "string" },
              },
              required: ["email"],
            },
            description: "Array of BCC recipients",
          },
          templateId: {
            type: "string",
            description:
              "ID of the email template to use. If not provided, the email will use the subject and body provided.",
          },
          templateData: {
            type: "object",
            description: "Data to be used for template variable substitution",
          },
          smtpConfigId: {
            type: "string",
            description:
              "ID of the SMTP configuration to use. If not provided, the default configuration will be used.",
          },
        },
        required: ["to", "subject", "body"],
      },
    },

    "send-bulk-emails": {
      name: "send-bulk-emails",
      description:
        "Send emails in bulk to multiple recipients with rate limiting",
      inputSchema: {
        type: "object",
        properties: {
          recipients: {
            type: "array",
            items: {
              type: "object",
              properties: {
                email: { type: "string" },
                name: { type: "string" },
              },
              required: ["email"],
            },
            description: "Array of recipients",
          },
          subject: {
            type: "string",
            description: "Email subject",
          },
          body: {
            type: "string",
            description: "Email body (HTML supported)",
          },
          from: {
            type: "object",
            properties: {
              email: { type: "string" },
              name: { type: "string" },
            },
            description:
              "Sender information. If not provided, the default SMTP user will be used.",
          },
          cc: {
            type: "array",
            items: {
              type: "object",
              properties: {
                email: { type: "string" },
                name: { type: "string" },
              },
              required: ["email"],
            },
            description: "Array of CC recipients",
          },
          bcc: {
            type: "array",
            items: {
              type: "object",
              properties: {
                email: { type: "string" },
                name: { type: "string" },
              },
              required: ["email"],
            },
            description: "Array of BCC recipients",
          },
          templateId: {
            type: "string",
            description:
              "ID of the email template to use. If not provided, the email will use the subject and body provided.",
          },
          templateData: {
            type: "object",
            description: "Data to be used for template variable substitution",
          },
          batchSize: {
            type: "number",
            description: "Number of emails to send in each batch (default: 10)",
          },
          delayBetweenBatches: {
            type: "number",
            description:
              "Delay between batches in milliseconds (default: 1000)",
          },
          smtpConfigId: {
            type: "string",
            description:
              "ID of the SMTP configuration to use. If not provided, the default configuration will be used.",
          },
        },
        required: ["recipients", "subject", "body"],
      },
    },

    "get-smtp-configs": {
      name: "get-smtp-configs",
      description: "Get all SMTP configurations",
      inputSchema: {
        type: "object",
        properties: {},
        required: [],
      },
    },

    "get-email-logs": {
      name: "get-email-logs",
      description: "Get logs of all email sending activity",
      inputSchema: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description:
              "Maximum number of log entries to return (most recent first)",
          },
          filterBySuccess: {
            type: "boolean",
            description:
              "Filter logs by success status (true = successful emails, false = failed emails)",
          },
        },
      },
    },
  };
}
