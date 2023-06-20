FROM node:hydrogen-bullseye-slim

RUN apt-get update && apt-get -y install ffmpeg

RUN mkdir /app
WORKDIR /app

ADD ./ ./
RUN npm install

ENTRYPOINT [ "npm", "start" ]