# --- Etapa de build ---
# Actualizado a node:20 para cumplir con el requisito de joi >= 20
FROM node:20-alpine AS builder

ENV NODE_OPTIONS="--max-old-space-size=4096"
WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

# Argumentos que Easypanel/Dokploy inyectará
ARG VUE_APP_API_URL
ENV VUE_APP_API_URL=$VUE_APP_API_URL
ENV CI=false
ENV NODE_ENV=production

RUN echo "🔨 Iniciando build..." && \
    echo "📡 VUE_APP_API_URL: $VUE_APP_API_URL" && \
    npm run build && \
    echo "✅ Build completado"

# --- Etapa de producción ---
FROM nginx:alpine AS production

# Instalar curl para el healthcheck (wget no está en nginx:alpine)
RUN apk add --no-cache curl

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

# Verificar configuración de nginx
RUN nginx -t

EXPOSE 80

# HEALTHCHECK reactivado y ajustado para ser más tolerante
# Dokploy puede requerir un healthcheck para marcar el despliegue como exitoso.
# Le damos 2 minutos (120s) antes del primer chequeo.
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=5 \
    CMD curl -f http://localhost/ || exit 1

# Comando de inicio - nginx en primer plano
CMD ["nginx", "-g", "daemon off;"]