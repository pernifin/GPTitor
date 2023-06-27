FROM node:hydrogen-bullseye-slim

RUN apt-get update && apt-get -y install ffmpeg && apt-get clean

RUN mkdir /app
WORKDIR /app

ADD ./ ./
RUN npm install

ENTRYPOINT [ "npm", "start" ]