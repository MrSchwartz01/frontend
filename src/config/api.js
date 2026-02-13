// Configuración de la API
// En producción: usa proxy en nginx (URL relativa /api)
// En desarrollo: usa localhost:5000

function getApiBaseUrl() {
  // En desarrollo, usar localhost
  if (process.env.NODE_ENV === 'development') {
    return process.env.VUE_APP_API_URL || 'http://45.88.188.111:5000/api';
  }
  
  // En producción con nginx proxy (RECOMENDADO)
  // El nginx.conf redirige /api/* al backend automáticamente
  if (process.env.VUE_APP_API_PROXY === 'true') {
    return '/api';
  }
  
  // En producción sin proxy (usar URL completa de Easypanel/Dokploy)
  // IMPORTANTE: Configura VUE_APP_API_URL en las variables de entorno
  return process.env.VUE_APP_API_URL || 'https://chpc-web-backend.qut3sg.easypanel.host/api';
}

const API_BASE_URL = getApiBaseUrl();

// Log para debugging
console.log('📡 API_BASE_URL configurada:', API_BASE_URL);
console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
console.log('🔧 VUE_APP_API_URL:', process.env.VUE_APP_API_URL);
console.log('🔧 VUE_APP_API_PROXY:', process.env.VUE_APP_API_PROXY);

/**
 * Convierte una ruta de imagen relativa a una URL completa del backend
 * @param {string} imagePath - Ruta de la imagen (puede ser relativa o absoluta)
 * @returns {string} URL completa de la imagen
 */
function getImageUrl(imagePath) {
  // Si no hay ruta o es placeholder, devolver placeholder
  if (!imagePath || imagePath.includes('placeholder')) {
    return '/Productos/placeholder-product.png';
  }
  
  // Si ya es una URL completa (http/https), devolverla tal cual
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Si la ruta empieza con /uploads/, construir URL completa del backend
  if (imagePath.startsWith('/uploads/')) {
    // Remover /api del final de API_BASE_URL si existe
    const baseUrl = API_BASE_URL.replace(/\/api$/, '');
    return `${baseUrl}${imagePath}`;
  }
  
  // Si es una ruta vieja que empieza con /Productos/, convertir
  if (imagePath.startsWith('/Productos/')) {
    const baseUrl = API_BASE_URL.replace(/\/api$/, '');
    const fileName = imagePath.replace('/Productos/', '');
    return `${baseUrl}/uploads/productos/${fileName}`;
  }
  
  // Para cualquier otra ruta, asumir que es un nombre de archivo
  const baseUrl = API_BASE_URL.replace(/\/api$/, '');
  return `${baseUrl}/uploads/productos/${imagePath}`;
}

export { API_BASE_URL, getImageUrl };