FROM node:lts-bullseye-slim

RUN mkdir /app
WORKDIR /app

#RUN apt-get update && apt-get -y install curl git
#RUN git clone https://github.com/pernifin/GPTitor.git .
ADD ./ ./
RUN npm install

ENTRYPOINT [ "npm", "start" ]