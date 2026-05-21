FROM node:22-slim

WORKDIR /app

COPY backend/package*.json ./backend/
RUN npm ci --prefix backend --omit=dev

COPY backend ./backend

WORKDIR /app/backend

ENV NODE_ENV=production

EXPOSE 5000

CMD ["npm", "start"]
