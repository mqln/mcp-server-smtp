FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies (including dev dependencies needed for building)
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Prune dev dependencies to reduce image size
RUN npm prune --production

# Create a directory for logs
RUN mkdir -p /root/smtp-mcp-server-logs

# Set the SMTP configuration from a base64-encoded environment variable
ENV SMTP_CONFIG_BASE64=""

# Expose the port your application needs
EXPOSE 3007

# Start the application
CMD ["node", "build/index.js"]