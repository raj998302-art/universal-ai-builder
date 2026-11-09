FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3002

ENV NODE_ENV=production
ENV ORCHESTRATOR_PORT=3002

CMD ["node", "dist/index.js"]
