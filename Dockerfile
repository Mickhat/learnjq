FROM node:22-alpine

# jq binary from build context (avoids DNS issues in Docker build)
COPY jq /usr/local/bin/jq
RUN chmod +x /usr/local/bin/jq

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server.js ./
COPY public/ ./public/

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

USER node

CMD ["node", "server.js"]
