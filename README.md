# GPTitor
Telegram bot for integration with ChatGPT

## Configuration
There are two settings to be provided via environment

- OPENAI_KEY: `<key>`
- BOT_TOKEN: `<token>`

## How to use:
### For local execution:
1. Set environment variables with proper values
2. Run following commands
```bash
npm install
npm start
```

### Run in docker:
```bash
docker run -e OPENAI_KEY=<key> -e BOT_TOKEN=<token> sergeyfilippov/gptitor
```
or docker compose
```yaml
services:
  gptitor:
    container_name: gptitor
    image: sergeyfilippov/gptitor:latest
    restart: always
    networks:
      - app-tier
    environment:
      OPENAI_KEY: <key>
      BOT_TOKEN: <token>
```
