FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends libnss3 libatk-bridge2.0-0 libatk1.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 libpango-1.0-0 libcairo2 fonts-dejavu-core ca-certificates gosu && rm -rf /var/lib/apt/lists/*
WORKDIR /app
# Build from repository root: docker build -f artwork-service/Dockerfile .
COPY artwork-service/package*.json ./
RUN npm ci --ignore-scripts --omit=dev
COPY artwork-service/ ./
COPY calculator.html /calculator.html
COPY assets/crosstalk-logo.png /assets/crosstalk-logo.png
RUN node build-public.cjs && chown -R node:node /app
ENTRYPOINT ["sh","/app/docker-entrypoint.sh"]
ENV NODE_ENV=production HOST=0.0.0.0 ARTWORK_DATA_DIR=/data FONTCONFIG_PATH=/etc/fonts
EXPOSE 4310
CMD ["node","src/server.cjs"]
