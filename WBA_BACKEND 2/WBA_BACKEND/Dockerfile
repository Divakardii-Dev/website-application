# Use official Node.js runtime as the base image
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /usr/src/app

# Copy dependency files first
COPY package*.json ./

# Install production dependencies
RUN npm install

# Copy all project files into the container
COPY . .

# Expose the port your server listens to (check your server.js or .env file)
EXPOSE 5000

# Run the app using the start script we added
CMD ["npm", "start"]
