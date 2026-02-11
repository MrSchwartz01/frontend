# Dockerfile para Frontend Vue.js - CHPC
# Optimizado para Dokploy

# --- Etapa de build ---
FROM node:18-alpine AS builder

# Aumentar memoria para Node
ENV NODE_OPTIONS="--max-old-space-size=4096"

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias (usar npm install para mayor compatibilidad)
RUN npm install --legacy-peer-deps

# Copiar código fuente
COPY . .

# Variables de entorno para build
# En Dokploy: usar URL directa al backend (NO proxy nginx)
# Estas se pueden sobreescribir con build args en Dokploy
ARG VUE_APP_API_URL=https://chpc-backend-mrdcx4-0db854-45-88-188-111.traefik.me/api
ARG VUE_APP_API_PROXY=false
ENV VUE_APP_API_PROXY=$VUE_APP_API_PROXY
ENV VUE_APP_API_URL=$VUE_APP_API_URL

# Desactivar errores de ESLint durante build
ENV CI=false
ENV NODE_ENV=production

# Construir la aplicación
RUN npm run build

# --- Etapa de producción con Nginx ---
FROM nginx:alpine AS production

# Copiar configuración personalizada de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar archivos estáticos desde la etapa de build
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponer puerto
EXPOSE 80

# Health check - wget viene por defecto en nginx:alpine
# start-period aumentado para dar tiempo al contenedor en entornos con recursos limitados
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=5 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Comando de inicio
CMD ["nginx", "-g", "daemon off;"]
    