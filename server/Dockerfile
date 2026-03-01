FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Create data directory for cached scrape results
RUN mkdir -p /app/data

EXPOSE 3002

CMD ["node", "index.js"]
