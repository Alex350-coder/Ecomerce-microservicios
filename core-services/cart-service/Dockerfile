FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install -g npm@11.2.0
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/package*.json ./
RUN npm install -g npm@11.2.0
RUN npm ci --omit=dev
COPY --from=build --chown=app:app /app/dist ./dist
USER app
EXPOSE 3004
CMD ["node", "dist/main.js"]
