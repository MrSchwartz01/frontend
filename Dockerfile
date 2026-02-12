# --- Etapa de build ---
# Actualizado a node:20 para cumplir con el requisito de joi >= 20
FROM node:20-alpine AS builder

ENV NODE_OPTIONS="--max-old-space-size=4096"
WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

# Argumentos que Dokploy inyectará
ARG VUE_APP_API_URL
ENV VUE_APP_API_URL=$VUE_APP_API_URL
ENV CI=false
ENV NODE_ENV=production

RUN echo "🔨 Iniciando build..." && \
    npm run build && \
    echo "✅ Build completado"

# --- Etapa de producción ---
FROM nginx:alpine AS production
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

# La etiqueta 'error' en Dokploy a veces es solo ruido visual, 
# pero nginx -t confirmará que todo está OK
RUN nginx -t

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["sh", "-c", "echo '🚀 Iniciando Nginx...' && nginx -g 'daemon off;'"]