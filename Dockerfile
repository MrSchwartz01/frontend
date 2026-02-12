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

# Construir la aplicación con logging mejorado
RUN echo "🔨 Iniciando build de Vue.js..." && \
    npm run build && \
    echo "✅ Build completado" && \
    ls -la dist/ && \
    echo "📁 Verificando archivos críticos..." && \
    test -f dist/index.html || (echo "❌ ERROR: index.html no generado" && exit 1) && \
    echo "✅ Verificación completada"

# --- Etapa de producción con Nginx ---
FROM nginx:alpine AS production

# Copiar configuración personalizada de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar archivos estáticos desde la etapa de build
COPY --from=builder /app/dist /usr/share/nginx/html

# Verificar que los archivos se copiaron correctamente
RUN echo "📦 Verificando archivos copiados..." && \
    ls -la /usr/share/nginx/html && \
    test -f /usr/share/nginx/html/index.html || (echo "❌ ERROR: index.html no encontrado" && exit 1) && \
    echo "✅ Archivos verificados correctamente"

# Verificar configuración de nginx
RUN nginx -t

# Exponer puerto
EXPOSE 80

# Health check mejorado con más tiempo de inicio
# start-period aumentado a 60s para entornos con recursos limitados
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Comando de inicio con logging
CMD ["sh", "-c", "echo '🚀 Iniciando Nginx para CHPC Frontend...' && nginx -g 'daemon off;'"]
    