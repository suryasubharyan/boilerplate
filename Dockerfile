# Use Node.js 20.16.0 as the base image
FROM node:20.16.0

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json files first
# to leverage Docker caching and avoid reinstalling dependencies unnecessarily
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files to the container
COPY . .

# Build the production files (runs the "build:clean" script from package.json)
RUN npm run build:clean

# Expose the port your app will run on
EXPOSE 5000

# Define the command to start the server (runs the "start" script from package.json)
CMD ["npm", "run", "start"]
