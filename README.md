# frontend-chpc

Frontend de la aplicación CHPC construido con Vue.js 3 y desplegado con Docker + Nginx.

## 🚀 Desarrollo Local

### Project setup
```bash
npm install
```

### Compiles and hot-reloads for development
```bash
npm run serve
```

### Compiles and minifies for production
```bash
npm run build
```

### Lints and fixes files
```bash
npm run lint
```

## 🐳 Docker

### Construcción de la imagen
```bash
docker build -t chpc-frontend .
```

### Ejecutar contenedor localmente
```bash
docker run -d -p 8080:80 chpc-frontend
```

Acceder en: http://localhost:8080

## 🔍 Diagnóstico de Problemas

Si el contenedor no inicia en el servidor:

### Opción 1: Script de diagnóstico (en el servidor)
```bash
bash diagnostico-frontend.sh
```

### Opción 2: Script de diagnóstico (desde Windows)
```powershell
.\diagnostico-frontend.ps1
```

### Opción 3: Manual
Ver documentación completa en [DIAGNOSTICO_DOCKER.md](./DIAGNOSTICO_DOCKER.md)

## 📝 Variables de Entorno

Para configurar en Dokploy:

```bash
VUE_APP_API_URL=https://chpc-backend-mrdcx4-0db854-45-88-188-111.traefik.me/api
VUE_APP_API_PROXY=false
NODE_ENV=production
```

## 🌐 Despliegue

El proyecto está configurado para desplegarse en Dokploy con:
- **Nginx** como servidor web
- **Docker multi-stage build** para optimización
- **Health checks** automáticos
- **Compresión gzip** habilitada
- **Cache** para assets estáticos

## 📚 Documentación

- [DIAGNOSTICO_DOCKER.md](./DIAGNOSTICO_DOCKER.md) - Solución de problemas con Docker
- [MIGRACION_API_CLIENT.md](./MIGRACION_API_CLIENT.md) - Guía de migración de API

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
