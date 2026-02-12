# ⚙️ Configuración Dokploy para Contenedores Standalone

## ✅ Confirmación: NO se usa Docker Swarm

Este proyecto **NO utiliza Docker Swarm**. Dokploy maneja contenedores Docker standalone individuales con Traefik como reverse proxy.

---

## 🔍 Verificación de Configuración en Dokploy

### 1. Tipo de Aplicación

En Dokploy, asegúrate de que el frontend esté configurado como:

```
Tipo: Application (Docker)
```

**NO debe ser**:
- ❌ Docker Compose
- ❌ Docker Stack
- ❌ Docker Service

### 2. Configuración del Frontend

Accede a tu proyecto frontend en Dokploy y verifica:

#### General Settings
```
Name: chpc-frontend
Repository: <tu-repo-git>
Branch: main (o tu rama principal)
Build Type: Dockerfile
```

#### Build Configuration
```
Dockerfile Path: ./Dockerfile
Context Path: .
Build Command: (vacío, usa el Dockerfile)
```

**⚠️ IMPORTANTE**: NO debe tener configuraciones de:
- `replicas`
- `placement`
- `constraints`
- Estas son específicas de Docker Swarm

#### Environment Variables
```
VUE_APP_API_URL=https://chpc-backend-mrdcx4-0db854-45-88-188-111.traefik.me/api
VUE_APP_API_PROXY=false
NODE_ENV=production
```

#### Domains
```
Domain: chpc-frontend-rrp6aj-18e970-45-88-188-111.traefik.me
Port: 80
HTTPS: Enabled
```

#### Resources (Opcional)
Si el servidor tiene recursos limitados, configura límites:
```
Memory Limit: 512MB
CPU Limit: 0.5
```

### 3. Configuración del Backend

Similarmente, el backend debe estar como:

#### General Settings
```
Name: chpc-backend
Build Type: Dockerfile
```

#### Environment Variables
```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://postgres:Humbug0809@chpc-database-sev7k6:5432/chpc-webpage
JWT_SECRET=<tu-secret>
JWT_REFRESH_SECRET=<tu-refresh-secret>
CORS_ORIGIN=https://chpc-frontend-rrp6aj-18e970-45-88-188-111.traefik.me
FRONTEND_URL=https://chpc-frontend-rrp6aj-18e970-45-88-188-111.traefik.me
UPLOAD_DIR=/mnt/multimedia
```

#### Volumes/Mounts
```
Type: Volume Mount
Name: chpc-multimedia
Mount Path: /mnt/multimedia
```

---

## 🐳 Diferencias: Swarm vs Standalone

### Docker Swarm (NO USAR)
```yaml
# Ejemplo de lo que NO debe estar presente
version: '3.8'
services:
  frontend:
    image: chpc-frontend
    deploy:              # ❌ NO debe existir
      replicas: 3        # ❌ Específico de Swarm
      placement:         # ❌ Específico de Swarm
        constraints:
          - node.role == worker
      restart_policy:    # ❌ Formato de Swarm
        condition: on-failure
```

### Docker Standalone (CORRECTO)
```dockerfile
# Tu Dockerfile actual - CORRECTO ✅
FROM node:18-alpine AS builder
WORKDIR /app
# ... build stage

FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 🔧 Comandos de Verificación

Conéctate al servidor y ejecuta:

### 1. Verificar que NO hay servicios de Swarm
```bash
docker service ls
```

**Resultado esperado**:
```
Error: This node is not a swarm manager.
```
O
```
ID   NAME   MODE   REPLICAS   IMAGE   PORTS
(vacío)
```

### 2. Verificar contenedores standalone
```bash
docker ps
```

**Debe mostrar**:
- Contenedores corriendo normalmente
- NO debe decir "replicas" ni mostrar múltiples instancias del mismo contenedor

### 3. Verificar redes
```bash
docker network ls
```

**Debe mostrar**:
- `bridge` (red por defecto)
- Redes de Dokploy (ej: `dokploy_network`)
- **NO debe mostrar**: redes `overlay` (específicas de Swarm)

### 4. Verificar que Traefik está en modo standalone
```bash
docker inspect dokploy-traefik | grep -i swarm
```

**Resultado esperado**: Sin resultados o referencias a Swarm

---

## 🚨 Problemas Comunes en Dokploy Standalone

### Problema 1: Contenedor se detiene inmediatamente

**Síntoma**:
```bash
docker ps -a | grep frontend
# Muestra: Exited (0) o Exited (1)
```

**Causa común**:
- Healthcheck falla muy rápido
- Nginx no encuentra los archivos en `/usr/share/nginx/html`
- Error en la configuración de nginx

**Solución**:
```bash
# Ver logs específicos
docker logs <container-id>

# Verificar archivos dentro del contenedor
docker run --rm -it chpc-frontend-rrp6aj:latest ls -la /usr/share/nginx/html

# Verificar configuración de nginx
docker run --rm -it chpc-frontend-rrp6aj:latest nginx -t
```

### Problema 2: Build falla pero no se reporta

**Síntoma**: La imagen se crea pero el contenedor no inicia

**Solución**:
1. En Dokploy, ve a la pestaña **"Logs"** del proyecto frontend
2. Busca errores durante el `npm run build`
3. Verifica que aparezcan los mensajes:
   ```
   🔨 Iniciando build de Vue.js...
   ✅ Build completado
   ```

### Problema 3: Puerto no accesible

**Síntoma**: Traefik no puede enrutar al contenedor

**Solución**:
1. Verifica que el puerto sea `80` (interno del contenedor)
2. Dokploy/Traefik manejan el routing externo automáticamente
3. NO necesitas mapear puertos manualmente (ej: `-p 8080:80`)

### Problema 4: Variables de entorno no se aplican

**Síntoma**: La app no puede conectar al backend

**Solución**:
1. Las variables `VUE_APP_*` deben estar configuradas en Dokploy
2. **IMPORTANTE**: Después de cambiar variables, debes hacer **Rebuild**, no solo Redeploy
3. Las variables se inyectan durante el build, no en runtime

---

## ✅ Checklist de Configuración Correcta

- [ ] Dokploy usa "Application (Docker)", NO "Docker Compose" o "Stack"
- [ ] NO hay referencias a `deploy:`, `replicas`, o `placement` en configuración
- [ ] El servidor NO es parte de un clúster Swarm (`docker info` no muestra "Swarm: active")
- [ ] Traefik está configurado para contenedores standalone
- [ ] Las redes son tipo `bridge`, NO `overlay`
- [ ] El healthcheck tiene suficiente `start-period` (60s)
- [ ] Las variables de entorno están correctamente configuradas en Dokploy
- [ ] El volumen `/mnt/multimedia` está montado correctamente en el backend

---

## 🎯 Configuración Recomendada para Dokploy

### Frontend
```
Type: Application
Build: Dockerfile
Dockerfile Path: ./Dockerfile
Port: 80
Health Check: Enabled (start-period: 60s)
Auto Deploy: Enabled (opcional)
```

### Backend
```
Type: Application
Build: Dockerfile
Dockerfile Path: ./Dockerfile
Port: 5000
Volumes: /mnt/multimedia → chpc-multimedia
Health Check: Disabled (temporalmente para debugging)
Auto Deploy: Enabled (opcional)
```

### Database
```
Type: PostgreSQL (managed by Dokploy)
Name: chpc-database
Port: 5432
Persistent: Yes
```

---

## 🔗 Recursos

- [Dokploy Documentation](https://docs.dokploy.com)
- [Diferencias Swarm vs Standalone](https://docs.docker.com/engine/swarm/)
- [Traefik sin Swarm](https://doc.traefik.io/traefik/providers/docker/)

---

## 📞 Siguiente Paso

Si el frontend sigue sin iniciar y has verificado que NO hay configuraciones de Swarm:

1. **Ejecuta el diagnóstico**:
   ```bash
   bash diagnostico-frontend.sh
   ```

2. **Comparte la salida** de estos comandos:
   ```bash
   docker ps -a | grep frontend
   docker logs <container-id> 2>&1 | tail -30
   docker inspect <container-id> | grep -A 10 "State"
   ```

3. **Verifica en Dokploy**:
   - Ve a Frontend → Logs
   - Ve a Frontend → Settings → Environment Variables
   - Ve a Frontend → Domains

Con esa información podremos identificar el problema exacto.
