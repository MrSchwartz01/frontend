# Script de diagnóstico para contenedor frontend (Windows PowerShell)
# Ejecuta este script para diagnosticar problemas con el contenedor frontend en el servidor remoto

param(
    [Parameter(Mandatory=$false)]
    [string]$ServerIP = "45.88.188.111",
    
    [Parameter(Mandatory=$false)]
    [string]$User = "root"
)

Write-Host "=================================="
Write-Host "🔍 DIAGNÓSTICO FRONTEND DOCKER (Remoto)"
Write-Host "=================================="
Write-Host ""

Write-Host "📡 Conectando a: $User@$ServerIP" -ForegroundColor Cyan
Write-Host ""

# Verificar que ssh esté disponible
if (!(Get-Command ssh -ErrorAction SilentlyContinue)) {
    Write-Host "❌ SSH no está disponible en este sistema" -ForegroundColor Red
    Write-Host "Alternativas:" -ForegroundColor Yellow
    Write-Host "  1. Usar PuTTY o Windows Terminal" -ForegroundColor Yellow
    Write-Host "  2. Habilitar OpenSSH en Windows" -ForegroundColor Yellow
    exit 1
}

# Script que se ejecutará en el servidor remoto
$RemoteScript = @'
echo "1️⃣ Verificando modo Docker..."
SWARM_STATUS=$(docker info 2>/dev/null | grep "Swarm:" | awk '{print $2}')
if [ "$SWARM_STATUS" == "active" ]; then
    echo "❌ ADVERTENCIA: Docker Swarm está ACTIVO"
    echo "⚠️  Este proyecto NO debe usar Swarm"
    echo "⚠️  Revisa: DOKPLOY_STANDALONE_CONFIG.md"
else
    echo "✅ Docker en modo standalone (correcto)"
fi

# Verificar servicios de Swarm
SERVICE_COUNT=$(docker service ls 2>/dev/null | tail -n +2 | wc -l)
if [ "$SERVICE_COUNT" -gt 0 ]; then
    echo "❌ Se encontraron $SERVICE_COUNT servicios de Swarm"
    docker service ls
else
    echo "✅ No hay servicios de Swarm (correcto)"
fi
echo ""

echo "2️⃣ Verificando imagen..."
docker images | grep "chpc-frontend" || echo "No se encontró imagen"
echo ""

echo "3️⃣ Buscando contenedores..."
docker ps -a | grep "chpc-frontend" || echo "No hay contenedores"
echo ""

# Obtener ID del contenedor
CONTAINER_ID=$(docker ps -aq --filter "ancestor=chpc-frontend-rrp6aj:latest" | head -1)
if [ -z "$CONTAINER_ID" ]; then
    CONTAINER_ID=$(docker ps -aq | xargs -I {} docker inspect --format='{{.Id}} {{.Config.Image}}' {} 2>/dev/null | grep "chpc-frontend" | head -1 | cut -d' ' -f1)
fi

if [ -z "$CONTAINER_ID" ]; then
    echo "❌ No se encontró contenedor del frontend"
    exit 1
fi

echo "📦 Contenedor ID: $CONTAINER_ID"
echo ""

echo "4️⃣ Estado del contenedor:"
docker inspect $CONTAINER_ID --format='Estado: {{.State.Status}} | Health: {{.State.Health.Status}}' 2>/dev/null
echo ""

echo "5️⃣ Últimos 20 logs:"
echo "-----------------------------------"
docker logs --tail 20 $CONTAINER_ID 2>&1
echo ""

echo "6️⃣ Verificando archivos en el contenedor:"
docker exec $CONTAINER_ID ls -la /usr/share/nginx/html 2>/dev/null || echo "No se pudo acceder"
echo ""

echo "7️⃣ Intentando acceder a nginx:"
docker exec $CONTAINER_ID wget -O- http://localhost 2>/dev/null | head -5 || echo "Nginx no responde"
echo ""

STATUS=$(docker inspect --format='{{.State.Status}}' $CONTAINER_ID 2>/dev/null)
echo "=============================="
echo "📋 ESTADO: $STATUS"
echo "=============================="

if [ "$STATUS" == "running" ]; then
    echo "✅ Contenedor corriendo"
    echo ""
    echo "Comandos útiles:"
    echo "  docker logs -f $CONTAINER_ID    # Ver logs en vivo"
    echo "  docker restart $CONTAINER_ID     # Reiniciar"
elif [ "$STATUS" == "exited" ]; then
    echo "❌ Contenedor detenido"
    echo ""
    echo "Ver código de salida:"
    docker inspect --format='{{.State.ExitCode}}' $CONTAINER_ID
    echo ""
    echo "Intentar reiniciar:"
    echo "  docker start $CONTAINER_ID"
fi
'@

# Ejecutar el script en el servidor remoto
try {
    Write-Host "🚀 Ejecutando diagnóstico en el servidor..." -ForegroundColor Green
    Write-Host ""
    
    # Guardar el script temporalmente
    $TempScript = [System.IO.Path]::GetTempFileName() + ".sh"
    $RemoteScript | Out-File -FilePath $TempScript -Encoding ASCII
    
    # Copiar y ejecutar en el servidor remoto
    scp $TempScript "${User}@${ServerIP}:/tmp/diagnostico.sh" 2>$null
    if ($LASTEXITCODE -eq 0) {
        ssh "${User}@${ServerIP}" "bash /tmp/diagnostico.sh && rm /tmp/diagnostico.sh"
    } else {
        # Si falla scp, intentar directamente con ssh
        ssh "${User}@${ServerIP}" $RemoteScript
    }
    
    # Limpiar archivo temporal
    Remove-Item $TempScript -Force -ErrorAction SilentlyContinue
    
} catch {
    Write-Host "❌ Error al conectar al servidor: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Solución alternativa:" -ForegroundColor Yellow
    Write-Host "1. Conecta manualmente por SSH:" -ForegroundColor Yellow
    Write-Host "   ssh $User@$ServerIP" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. Ejecuta el script de diagnóstico:" -ForegroundColor Yellow
    Write-Host "   bash diagnostico-frontend.sh" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "=================================="
Write-Host "Para más información, revisa: DIAGNOSTICO_DOCKER.md"
Write-Host "=================================="
