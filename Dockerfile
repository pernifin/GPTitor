FROM node:lts-bullseye-slim

RUN mkdir /app
WORKDIR /app

ADD ./ ./
RUN npm install
RUN npm run build

ENTRYPOINT [ "npm", "run", "launch" ]