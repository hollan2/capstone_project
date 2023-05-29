# Start your image with a node base image
FROM node:18-alpine as build

# The /app directory should act as the main application directory
WORKDIR /app

# Download ImageMagick
RUN apk --no-cache add imagemagick

# Copy the app package and yarn.lock file
COPY package*.json .
COPY yarn.lock .

RUN yarn install

# Copy local directories to the current local directory of our docker image (/app)
COPY . .

RUN yarn build

FROM nginx:1.19.0
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY --from=build /app/build .
ENTRYPOINT ["nginx", "-g", "daemon off;"]