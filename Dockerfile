FROM node:lts-bullseye-slim

RUN mkdir /app
WORKDIR /app

ADD ./ ./
RUN npm install

ENTRYPOINT [ "npm", "start" ]