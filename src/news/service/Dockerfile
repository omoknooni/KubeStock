# Step 1: Base image
FROM node:18-alpine

# Step 2: Set working directory
WORKDIR /app

# Step 3: Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Step 4: Copy source code
COPY . .

# Step 5: Expose port
EXPOSE 3000

# Step 6: Start the application
CMD ["node", "index.js"]
