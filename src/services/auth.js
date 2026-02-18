// Servicio de autenticación centralizado
import store from '../store';

/**
 * Servicio de autenticación para manejar login, logout y estado de sesión
 */
const authService = {
  /**
   * Verifica si el usuario está autenticado
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!localStorage.getItem('access_token');
  },

  /**
   * Obtiene el rol del usuario actual
   * @returns {string|null}
   */
  getUserRole() {
    return localStorage.getItem('user_rol');
  },

  /**
   * Obtiene el ID del usuario actual
   * @returns {string|null}
   */
  getUserId() {
    return localStorage.getItem('user_id');
  },

  /**
   * Obtiene el token de acceso
   * @returns {string|null}
   */
  getAccessToken() {
    return localStorage.getItem('access_token');
  },

  /**
   * Guarda los datos de sesión después del login
   * @param {object} loginData - Datos del login (token, userId, rol, etc.)
   */
  setSession(loginData) {
    if (loginData.accessToken || loginData.access_token) {
      localStorage.setItem('access_token', loginData.accessToken || loginData.access_token);
    }
    if (loginData.refreshToken || loginData.refresh_token) {
      localStorage.setItem('refresh_token', loginData.refreshToken || loginData.refresh_token);
    }
    if (loginData.userId || loginData.user_id) {
      localStorage.setItem('user_id', loginData.userId || loginData.user_id);
    }
    if (loginData.rol || loginData.user_rol) {
      localStorage.setItem('user_rol', loginData.rol || loginData.user_rol);
    }
  },

  /**
   * Cierra la sesión del usuario de forma segura
   * - Limpia localStorage y sessionStorage
   * - Limpia el estado de Vuex
   * - Previene navegación hacia atrás mediante caché
   */
  logout() {
    try {
      // 1. Limpiar localStorage (mantener solo datos no sensibles si es necesario)
      const keysToRemove = [
        'access_token',
        'refresh_token',
        'user_id',
        'user_rol',
        'user_email',
        'user_nombre',
        'carrito',
        'historial_productos_vistos'
      ];

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      // 2. Limpiar sessionStorage completamente
      sessionStorage.clear();

      // 3. Limpiar estado de Vuex (carrito e historial)
      if (store) {
        // Limpiar carrito
        store.state.carrito = [];
        
        // Limpiar historial de productos vistos
        store.state.historialProductosVistos = [];
      }

      // 4. Forzar recarga de la página para limpiar cualquier caché en memoria
      // Usamos replaceState para modificar el historial antes de recargar
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', '/login');
      }

      return true;
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      return false;
    }
  },

  /**
   * Cierra sesión y redirige al login
   * @param {object} router - Instancia del router de Vue
   */
  logoutAndRedirect(router) {
    this.logout();
    
    // Usar replace para evitar que el usuario pueda volver atrás
    if (router) {
      router.replace('/login').then(() => {
        // Forzar recarga para limpiar cualquier estado en memoria
        window.location.reload();
      });
    } else {
      // Fallback si no hay router disponible
      window.location.href = '/login';
    }
  },

  /**
   * Verifica si el usuario tiene un rol específico
   * @param {string} rol - Rol a verificar
   * @returns {boolean}
   */
  hasRole(rol) {
    const userRol = this.getUserRole();
    return userRol === rol;
  },

  /**
   * Verifica si el usuario tiene alguno de los roles especificados
   * @param {string[]} roles - Array de roles a verificar
   * @returns {boolean}
   */
  hasAnyRole(roles) {
    const userRol = this.getUserRole();
    return roles.includes(userRol);
  }
};

export default authService;
