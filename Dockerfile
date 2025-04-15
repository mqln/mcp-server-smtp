FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Check if the build directory exists, if not build the application
RUN if [ ! -d "build" ]; then npm run build; fi

# Create a directory for logs
RUN mkdir -p /root/smtp-mcp-server-logs

# Set the SMTP configuration from a base64-encoded environment variable
# This will be overridden by the actual environment variable when running the container
ENV SMTP_CONFIG_BASE64=""

# Expose the port that your application might need
# Adjust this if your application needs a specific port
EXPOSE 3007

# Start the application
CMD ["node", "build/index.js"]