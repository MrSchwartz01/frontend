# 🔍 Diagnóstico - Contenedor Frontend No Inicia

## ⚠️ IMPORTANTE: Este proyecto NO usa Docker Swarm

Este proyecto utiliza **contenedores Docker standalone** gestionados por Dokploy.  
**NO debe** tener configuraciones de Docker Swarm, servicios, replicas, o stacks.

➡️ **Si encuentras configuraciones de Swarm, revisa**: [DOKPLOY_STANDALONE_CONFIG.md](./DOKPLOY_STANDALONE_CONFIG.md)

---

## Estado Actual
- ✅ Imagen existe: `chpc-frontend-rrp6aj:latest`
- ❌ Contenedor no está corriendo
- ✅ Backend corriendo correctamente

---

## 🔧 Comandos de Diagnóstico

Conéctate al servidor y ejecuta estos comandos para diagnosticar:

```bash
# 0. Verificar que NO es Docker Swarm (IMPORTANTE)
docker info | grep Swarm
# Debe mostrar: "Swarm: inactive"

docker service ls
# Debe dar error o mostrar vacío

# 1. Ver si hay un contenedor detenido del frontend
docker ps -a | grep frontend

# 2. Ver logs del último intento de inicio (reemplaza CONTAINER_ID)
docker logs <CONTAINER_ID>

# 3. Inspeccionar el contenedor para ver el estado
docker inspect <CONTAINER_ID>

# 4. Intentar iniciar manualmente el contenedor
docker start <CONTAINER_ID>

# 5. Ver logs en tiempo real
docker logs -f <CONTAINER_ID>
```

---

## ❌ Problemas Comunes y Soluciones

### 1. **Build Fallido Durante Creación de Imagen**

**Síntoma**: La imagen se crea pero el contenedor no inicia

**Causa Común**: 
- Errores de build de Vue.js no detectados
- Memoria insuficiente durante `npm run build`
- Archivos del `dist/` no se generaron correctamente

**Solución**:
```bash
# Reconstruir la imagen con verbose
docker build -t frontend-test --progress=plain .

# Verificar que dist/ se creó correctamente
docker run --rm -it frontend-test ls -la /usr/share/nginx/html
```

### 2. **Healthcheck Fallando**

**Síntoma**: El contenedor inicia pero se detiene después de 40 segundos

**Causa**: El healthcheck `wget http://localhost/` falla

**Solución en Dokploy**:
- Desactiva temporalmente el healthcheck
- O aumenta el `start-period` a 60s

### 3. **Puerto Ocupado o Mal Mapeado**

**Síntoma**: Error "port is already allocated"

**Causa**: Puerto 80 o el puerto mapeado ya está en uso

**Solución en Dokploy**:
- Verifica el mapeo de puertos en la configuración
- Dokploy debería manejar esto automáticamente con Traefik

### 4. **Error en Nginx Config**

**Síntoma**: Nginx no inicia, logs muestran errores de configuración

**Causa**: Sintaxis incorrecta en `nginx.conf`

**Solución**:
```bash
# Verificar configuración de nginx dentro del contenedor
docker run --rm -it chpc-frontend-rrp6aj:latest nginx -t
```

### 5. **Variables de Entorno Incorrectas**

**Síntoma**: Build falla o app no puede conectar al backend

**Causa**: `VUE_APP_API_URL` mal configurada

**Verificar en Dokploy**:
```
VUE_APP_API_URL=https://chpc-backend-mrdcx4-0db854-45-88-188-111.traefik.me/api
VUE_APP_API_PROXY=false
NODE_ENV=production
```

### 6. **Archivos Faltantes en dist/**

**Síntoma**: Nginx inicia pero muestra 404

**Causa**: La build no generó los archivos correctamente

```bash
# Inspeccionar el contenido del contenedor
docker run --rm -it chpc-frontend-rrp6aj:latest sh
cd /usr/share/nginx/html
ls -la
# Debe mostrar: index.html, favicon.ico, static/, etc.
```

---

## 🚀 Solución Rápida - Rebuild en Dokploy

Si nada funciona, intenta un rebuild completo:

### Opción 1: Rebuild con Cache Limpio

1. En Dokploy, ve a tu aplicación frontend
2. Click en **"Rebuild"**
3. Activa la opción **"Clear Build Cache"** si está disponible
4. Espera a que termine el build
5. Verifica los logs del build

### Opción 2: Rebuild Manual desde SSH

```bash
# Conectar al servidor
ssh usuario@45.88.188.111

# Ir al directorio del proyecto (si está clonado)
cd /ruta/al/frontend

# Rebuilder la imagen manualmente
docker build -t chpc-frontend-test .

# Probar el contenedor manualmente
docker run -d -p 8080:80 --name frontend-test chpc-frontend-test

# Ver logs
docker logs -f frontend-test

# Si funciona, el problema está en la configuración de Dokploy
```

---

## 📋 Checklist de Verificación

- [ ] La imagen `chpc-frontend-rrp6aj:latest` existe (`docker images`)
- [ ] No hay contenedores detenidos del frontend (`docker ps -a`)
- [ ] Los logs del contenedor no muestran errores (`docker logs`)
- [ ] El puerto está correctamente mapeado en Dokploy
- [ ] Las variables de entorno son correctas
- [ ] El healthcheck no está fallando prematuramente
- [ ] Nginx config es válida (`nginx -t`)
- [ ] Los archivos están en `/usr/share/nginx/html`
- [ ] El dominio Traefik está configurado correctamente

---

## 🔍 Verificación Paso a Paso

### Paso 1: Encontrar el Contenedor

```bash
docker ps -a | grep frontend
```

**Esperado**: Debe mostrar un contenedor, ya sea:
- `Up X minutes` → Corriendo ✅
- `Exited (0)` → Detenido normalmente
- `Exited (1)` → Error ❌

### Paso 2: Ver Logs

```bash
# Reemplaza con el ID del contenedor
docker logs <CONTAINER_ID>
```

**Posibles salidas**:
- ✅ Si ves: `start worker process` → Nginx inició correctamente
- ❌ Si ves: `nginx: [emerg]` → Error de configuración
- ❌ Si está vacío → El contenedor crasheó inmediatamente

### Paso 3: Verificar Configuración de Dokploy

En Dokploy, verifica:

**General**:
- ✅ Build Command: (vacío, usa Dockerfile)
- ✅ Dockerfile Path: `./Dockerfile`
- ✅ Context Path: `.`

**Environment Variables**:
```
VUE_APP_API_URL=https://chpc-backend-mrdcx4-0db854-45-88-188-111.traefik.me/api
VUE_APP_API_PROXY=false
NODE_ENV=production
```

**Domains**:
- ✅ Dominio Traefik: `chpc-frontend-rrp6aj-18e970-45-88-188-111.traefik.me`
- ✅ Puerto interno: `80`
- ✅ SSL habilitado

**Health Check** (si está habilitado):
- Path: `/`
- Port: `80`
- Initial Delay: `40s`
- Timeout: `10s`

---

## 💡 Solución Recomendada

Basándome en el diagnóstico, el problema más probable es:

### **Teoría 1: Healthcheck muy estricto**

El healthcheck actual tiene `start-period=40s`. Si la build es pesada o el servidor tiene recursos limitados, Nginx podría no estar listo a tiempo.

**Solución**: Aumentar el start-period o desactivar temporalmente.

### **Teoría 2: Build fallido silenciosamente**

La build de Vue podría estar fallando pero la imagen se crea igual.

**Solución**: Ver logs de build en Dokploy.

### **Teoría 3: Configuración de Dokploy**

El puerto o el dominio podrían estar mal configurados.

**Solución**: Verificar configuración de puertos y dominios.

---

## 📞 Siguiente Paso

**Ejecuta este comando en el servidor y comparte el resultado**:

```bash
docker ps -a | grep frontend && \
docker logs $(docker ps -aq --filter "ancestor=chpc-frontend-rrp6aj:latest" | head -1) 2>&1 | tail -50
```

Esto me mostrará:
1. El estado del contenedor
2. Los últimos 50 logs del contenedor

Con esa información podré darte una solución exacta.
