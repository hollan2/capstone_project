# Use an official Node.js runtime as the base image
FROM node:14-alpine

# Download ImageMagick
RUN apk --no-cache add imagemagick

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and yarn.lock to the working directory
COPY package.json yarn.lock ./

# Install the project dependencies
RUN yarn install

# Copy the rest of the app's source code
COPY . .

# Build the React app
RUN yarn build

# Expose the port that the app will run on
EXPOSE 3000

# Start the app
CMD ["yarn", "start"]
