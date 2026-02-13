# 🌐 Configuración de Dominio Personalizado - chpcecuador.com

## Guía completa para conectar GoDaddy con Easypanel

---

## 📋 Resumen

- **Dominio:** chpcecuador.com
- **Frontend:** Easypanel (chpc-web-frontend.qut3sg.easypanel.host)
- **Backend:** Easypanel (chpc-web-backend.qut3sg.easypanel.host)

---

## 🎯 Paso 1: Configurar DNS en GoDaddy

### 1.1 Ingresar a GoDaddy

1. Ve a [GoDaddy](https://www.godaddy.com/)
2. Inicia sesión con tu cuenta
3. Ve a **"Mis Productos"** → **"Dominios"**
4. Haz clic en el dominio **chpcecuador.com**
5. Busca la opción **"Administrar DNS"** o **"DNS"**

### 1.2 Configurar registros DNS

**Elimina** cualquier registro A o CNAME existente para `@` y `www`, luego agrega:

#### Opción A: Usando registro A (IP de Easypanel)

Necesitas obtener la IP de tu servidor Easypanel. Para obtenerla:

```bash
ping chpc-web-frontend.qut3sg.easypanel.host
```

Luego agrega estos registros:

| Tipo | Nombre | Valor | TTL |
|------|--------|-------|-----|
| A    | @      | [IP_DE_EASYPANEL] | 600 |
| CNAME| www    | chpcecuador.com | 600 |

#### Opción B: Usando CNAME (Recomendado si Easypanel lo permite)

| Tipo | Nombre | Valor | TTL |
|------|--------|-------|-----|
| CNAME| @      | chpc-web-frontend.qut3sg.easypanel.host | 600 |
| CNAME| www    | chpc-web-frontend.qut3sg.easypanel.host | 600 |

**Nota:** Algunos proveedores no permiten CNAME en el root (@). Si GoDaddy no lo permite, usa la Opción A.

### 1.3 Guardar cambios

- Haz clic en **"Guardar"**
- Los cambios pueden tardar de **10 minutos a 48 horas** en propagarse (generalmente 1-2 horas)

---

## 🔧 Paso 2: Configurar Dominio en Easypanel

### 2.1 Configurar Frontend

1. Ve a Easypanel → Tu proyecto **chpc-web / frontend**
2. Ve a la pestaña **"Domains"** o **"Dominios"**
3. Haz clic en **"Add Domain"** o **"Agregar Dominio"**
4. Agrega estos dominios:
   ```
   chpcecuador.com
   www.chpcecuador.com
   ```
5. **Habilita HTTPS/SSL** (Easypanel usará Let's Encrypt automáticamente)

### 2.2 Verificar Backend

No necesitas configurar dominio para el backend. El frontend usará la URL de Easypanel directamente.

---

## 🔐 Paso 3: Configurar Variables de Entorno

### 3.1 Variables del Backend

Ve a Easypanel → **chpc-web / backend** → **Environment Variables**

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgres://postgres:Humbug0809@chpc-web_database:5432/webpage?sslmode=disable
CORS_ORIGIN=https://chpcecuador.com,https://www.chpcecuador.com,https://chpc-web-frontend.qut3sg.easypanel.host
FRONTEND_URL=https://chpcecuador.com
JWT_SECRET=3bf9b2179b792bb70fe03a33ac8847ff387fea6ad9ef53dc865072a37f4cf0a79bbf1c35b1a88c6b374838efafc6060d5ea532120536b3393f400e4757577e23
JWT_REFRESH_SECRET=76555b4833f1f558d83d43c44b0933daa592056dc85996a1b87ddb349e537285ebef979a866e2af3adbfc7c3fa4fd76d4f2bcf2c7fbef60303be643c0aa8eacc
```

### 3.2 Variables del Frontend

Ve a Easypanel → **chpc-web / frontend** → **Environment Variables**

```env
VUE_APP_API_URL=https://chpc-web-backend.qut3sg.easypanel.host/api
NODE_ENV=production
```

---

## 🚀 Paso 4: Desplegar Cambios

### 4.1 Hacer Commit y Push

En tu terminal:

```powershell
# Frontend
cd c:\Users\Contabilidad\Documents\GitHub\frontend
git add .
git commit -m "Add support for chpcecuador.com domain"
git push

# Backend
cd c:\Users\Contabilidad\Documents\GitHub\PaginaCHPC\backend-chpc
git add .
git commit -m "Add CORS support for chpcecuador.com"
git push
```

### 4.2 Redeploy en Easypanel

1. **Backend primero:**
   - Ve a Easypanel → backend → Haz clic en **"Deploy"**
   - Espera a que termine (2-5 minutos)

2. **Frontend después:**
   - Ve a Easypanel → frontend → Haz clic en **"Deploy"**
   - Espera a que termine (2-5 minutos)

---

## ✅ Paso 5: Verificar Configuración

### 5.1 Verificar DNS (después de 1-2 horas)

En PowerShell:

```powershell
# Verificar que el dominio apunta a Easypanel
nslookup chpcecuador.com
nslookup www.chpcecuador.com
```

### 5.2 Verificar HTTPS

1. Abre tu navegador en **modo incógnito**
2. Ve a: https://chpcecuador.com
3. Verifica que aparezca el candado 🔒 (HTTPS seguro)
4. Ve a: https://www.chpcecuador.com
5. Verifica que funcione igual

### 5.3 Verificar Backend Connectivity

Abre la consola del navegador (F12) y verifica:

```javascript
// Deberías ver estos logs:
// 📡 API_BASE_URL configurada: https://chpc-web-backend.qut3sg.easypanel.host/api
// 🔧 NODE_ENV: production
```

---

## 🔍 Solución de Problemas

### Problema: "El sitio no es seguro" o "No se puede acceder"

**Solución:**
- Espera 2 horas más para propagación DNS
- Verifica que los registros DNS en GoDaddy estén correctos
- En Easypanel, verifica que el dominio esté agregado y el SSL esté activo

### Problema: Error CORS

**Solución:**
- Verifica que `CORS_ORIGIN` en el backend incluya tu dominio
- Redeploy el backend
- Borra la caché del navegador (Ctrl + Shift + Delete)

### Problema: Error 404 en peticiones API

**Solución:**
- Verifica que `VUE_APP_API_URL` apunte a `https://chpc-web-backend.qut3sg.easypanel.host/api`
- Redeploy el frontend
- Abre en modo incógnito

### Problema: El dominio no resuelve después de 24 horas

**Solución:**
1. Ve a GoDaddy → DNS
2. Usa la **Opción A** (registro A con IP)
3. Para obtener la IP:
   ```powershell
   ping chpc-web-frontend.qut3sg.easypanel.host
   ```
4. Usa esa IP en el registro A

---

## 📊 Arquitectura Final

```
Usuario
  ↓
https://chpcecuador.com (GoDaddy DNS)
  ↓
chpc-web-frontend.qut3sg.easypanel.host (Easypanel)
  ↓
Frontend Vue.js (Nginx)
  ↓
https://chpc-web-backend.qut3sg.easypanel.host/api
  ↓
Backend NestJS
  ↓
PostgreSQL Database
```

---

## 🎉 ¡Listo!

Una vez completados todos los pasos, tu sitio estará disponible en:

- ✅ https://chpcecuador.com
- ✅ https://www.chpcecuador.com

Ambas URLs mostrarán tu frontend y se comunicarán correctamente con el backend.

---

## 📝 Notas Importantes

1. **No cambies el URL del backend** - Debe seguir siendo la URL de Easypanel
2. **Solo el dominio del frontend cambia** - Los usuarios verán chpcecuador.com
3. **El backend acepta peticiones de ambos dominios** - Easypanel y tu dominio personalizado
4. **Los certificados SSL son automáticos** - Easypanel los renueva automáticamente

---

## 🆘 Soporte

Si tienes problemas:

1. Revisa los logs en Easypanel (botón "Logs" en cada servicio)
2. Abre la consola del navegador (F12) para ver errores
3. Verifica las variables de entorno en Easypanel
