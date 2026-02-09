// Configuración de la API
// En producción: usa proxy en nginx (URL relativa /api)
// En desarrollo: usa localhost:5000

function getApiBaseUrl() {
  // En desarrollo, usar localhost
  if (process.env.NODE_ENV === 'development') {
    return process.env.VUE_APP_API_URL || 'http://localhost:5000/api';
  }
  
  // En producción con nginx proxy (RECOMENDADO)
  // El nginx.conf redirige /api/* al backend automáticamente
  if (process.env.VUE_APP_API_PROXY === 'true') {
    return '/api';
  }
  
  // En producción sin proxy (usar URL completa de Dokploy)
  // IMPORTANTE: Reemplaza esto con tu URL real del backend
  return process.env.VUE_APP_API_URL || 'https://chpc-backend-mrdcx4-0db854-45-88-188-111.traefik.me/api';
}

const API_BASE_URL = getApiBaseUrl();

// Log para debugging
console.log('📡 API_BASE_URL configurada:', API_BASE_URL);
console.log('🔧 NODE_ENV:', process.env.NODE_ENV);

export { API_BASE_URL };