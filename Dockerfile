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

# Argumentos de build para variables de entorno
ARG VUE_APP_API_URL
ENV VUE_APP_API_URL=${VUE_APP_API_URL}

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

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Comando de inicio
CMD ["nginx", "-g", "daemon off;"]
