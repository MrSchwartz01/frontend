import apiClient from './api';

class AnalyticsService {
  constructor() {
    this.sessionId = this.getOrCreateSessionId();
  }

  // Generar o recuperar session ID único
  getOrCreateSessionId() {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  // Obtener usuario ID si está autenticado
  getUserId() {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || payload.userId;
      }
    } catch (error) {
      console.error('Error obteniendo user ID:', error);
    }
    return null;
  }

  // Trackear visita a página
  async trackPageView(ruta) {
    try {
      await apiClient.post('/analytics/track/page', {
        ruta,
        referrer: document.referrer,
        session_id: this.sessionId,
        usuario_id: this.getUserId(),
      });
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  }

  // Trackear visita a producto
  async trackProductView(productoId, productoNombre, marca) {
    try {
      await apiClient.post('/analytics/track/product', {
        producto_id: productoId,
        producto_nombre: productoNombre,
        marca: marca,
        session_id: this.sessionId,
        usuario_id: this.getUserId(),
      });
    } catch (error) {
      console.error('Error tracking product view:', error);
    }
  }

  // Trackear visita a marca
  async trackBrandView(marca) {
    try {
      await apiClient.post('/analytics/track/brand', {
        marca,
        session_id: this.sessionId,
        usuario_id: this.getUserId(),
      });
    } catch (error) {
      console.error('Error tracking brand view:', error);
    }
  }

  // Obtener métricas de visitas (solo para admin)
  async getVisitorsOverview(periodo = '30dias') {
    try {
      const response = await apiClient.get('/analytics/visitas/overview', {
        params: { periodo },
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo overview de visitas:', error);
      throw error;
    }
  }

  async getPageViewsStats(periodo = '30dias') {
    try {
      const response = await apiClient.get('/analytics/visitas/paginas', {
        params: { periodo },
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo stats de páginas:', error);
      throw error;
    }
  }

  async getProductViewsStats(periodo = '30dias', limite = 20) {
    try {
      const response = await apiClient.get('/analytics/visitas/productos', {
        params: { periodo, limite },
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo stats de productos:', error);
      throw error;
    }
  }

  async getBrandViewsStats(periodo = '30dias', limite = 20) {
    try {
      const response = await apiClient.get('/analytics/visitas/marcas', {
        params: { periodo, limite },
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo stats de marcas:', error);
      throw error;
    }
  }
}

export default new AnalyticsService();
