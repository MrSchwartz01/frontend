#!/bin/bash
# Script de diagnóstico rápido para el contenedor frontend

echo "=================================="
echo "🔍 DIAGNÓSTICO FRONTEND DOCKER"
echo "=================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 0. Verificar que NO es Docker Swarm
echo "0️⃣ Verificando modo Docker..."
SWARM_STATUS=$(docker info 2>/dev/null | grep "Swarm:" | awk '{print $2}')
if [ "$SWARM_STATUS" == "active" ]; then
    echo -e "${RED}❌ ADVERTENCIA: Docker Swarm está ACTIVO${NC}"
    echo -e "${YELLOW}⚠️  Este proyecto NO debe usar Swarm. Usa contenedores standalone.${NC}"
    echo -e "${YELLOW}⚠️  Revisa: DOKPLOY_STANDALONE_CONFIG.md${NC}"
    echo ""
else
    echo -e "${GREEN}✅ Docker en modo standalone (correcto)${NC}"
fi

# Verificar servicios de Swarm
SERVICES=$(docker service ls 2>/dev/null | wc -l)
if [ "$SERVICES" -gt 1 ]; then
    echo -e "${RED}❌ Se encontraron servicios de Swarm:${NC}"
    docker service ls
    echo -e "${YELLOW}⚠️  No deberían existir. Este proyecto usa contenedores standalone.${NC}"
else
    echo -e "${GREEN}✅ No hay servicios de Swarm (correcto)${NC}"
fi
echo ""

# 1. Verificar si la imagen existe
echo "1️⃣ Verificando imagen..."
if docker images | grep -q "chpc-frontend"; then
    echo -e "${GREEN}✅ Imagen encontrada${NC}"
    docker images | grep "chpc-frontend"
else
    echo -e "${RED}❌ Imagen no encontrada${NC}"
fi
echo ""

# 2. Buscar contenedores del frontend
echo "2️⃣ Buscando contenedores del frontend..."
CONTAINERS=$(docker ps -a | grep "chpc-frontend" || echo "")
if [ -z "$CONTAINERS" ]; then
    echo -e "${RED}❌ No se encontraron contenedores del frontend${NC}"
else
    echo -e "${GREEN}✅ Contenedores encontrados:${NC}"
    docker ps -a | grep "chpc-frontend"
fi
echo ""

# 3. Obtener ID del último contenedor
CONTAINER_ID=$(docker ps -aq --filter "ancestor=chpc-frontend-rrp6aj:latest" | head -1)

if [ -z "$CONTAINER_ID" ]; then
    # Intentar con otro patrón
    CONTAINER_ID=$(docker ps -aq | xargs docker inspect --format='{{.Id}} {{.Config.Image}}' | grep "chpc-frontend" | head -1 | cut -d' ' -f1)
fi

if [ -z "$CONTAINER_ID" ]; then
    echo -e "${YELLOW}⚠️  No se encontró ID del contenedor${NC}"
    echo "Intenta manualmente:"
    echo "  docker ps -a | grep frontend"
    exit 1
fi

echo -e "${GREEN}📦 ID del contenedor: $CONTAINER_ID${NC}"
echo ""

# 4. Estado del contenedor
echo "3️⃣ Estado del contenedor..."
docker inspect $CONTAINER_ID | grep -A 5 "State"
echo ""

# 5. Últimos logs
echo "4️⃣ Últimos 30 logs del contenedor..."
echo "-----------------------------------"
docker logs --tail 30 $CONTAINER_ID 2>&1
echo ""

# 6. Configuración de red
echo "5️⃣ Configuración de red..."
docker inspect $CONTAINER_ID | grep -A 10 "NetworkSettings" | head -15
echo ""

# 7. Variables de entorno
echo "6️⃣ Variables de entorno..."
docker inspect $CONTAINER_ID | grep -A 20 "Env"
echo ""

# 8. Puertos
echo "7️⃣ Mapeo de puertos..."
docker port $CONTAINER_ID 2>/dev/null || echo "No hay puertos mapeados"
echo ""

# 9. Health check
echo "8️⃣ Estado del Health Check..."
docker inspect $CONTAINER_ID | grep -A 5 "Health"
echo ""

# 10. Intentar acceder al contenido
echo "9️⃣ Verificando contenido en /usr/share/nginx/html..."
docker exec $CONTAINER_ID ls -la /usr/share/nginx/html 2>/dev/null || echo -e "${RED}❌ No se pudo acceder al contenedor${NC}"
echo ""

# Resumen
echo "=================================="
echo "📋 RESUMEN"
echo "=================================="

STATUS=$(docker inspect --format='{{.State.Status}}' $CONTAINER_ID 2>/dev/null)
HEALTH=$(docker inspect --format='{{.State.Health.Status}}' $CONTAINER_ID 2>/dev/null)

echo "Estado: $STATUS"
if [ ! -z "$HEALTH" ]; then
    echo "Health: $HEALTH"
fi

if [ "$STATUS" == "running" ]; then
    echo -e "${GREEN}✅ El contenedor está corriendo${NC}"
    echo ""
    echo "🌐 Intenta acceder a:"
    echo "  http://localhost (si estás en el servidor)"
    echo "  https://chpc-frontend-rrp6aj-18e970-45-88-188-111.traefik.me (URL pública)"
elif [ "$STATUS" == "exited" ]; then
    echo -e "${RED}❌ El contenedor está detenido${NC}"
    echo ""
    echo "Intentar reiniciar:"
    echo "  docker start $CONTAINER_ID"
    echo "  docker logs -f $CONTAINER_ID"
else
    echo -e "${YELLOW}⚠️  Estado desconocido: $STATUS${NC}"
fi

echo ""
echo "=================================="
echo "Para más detalles, revisa:"
echo "  DIAGNOSTICO_DOCKER.md"
echo "=================================="
