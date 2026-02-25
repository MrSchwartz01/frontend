export default {
  name: "HistorialProductosVistos",
  data() {
    return {
      isAuthenticated: false,
    };
  },
  created() {
    this.isAuthenticated = !!localStorage.getItem("access_token");
  },
  computed: {
    historial() {
      return this.$store.getters.historialProductosVistos;
    },
  },
  methods: {
    verDetalle(codigo) {
      this.$router.push({ name: "ProductoDetalle", params: { id: codigo } });
    },
    formatPrice(price) {
      const value = Number(price);
      if (Number.isNaN(value)) return "0.00";
      return value.toFixed(2);
    },
    tiempoRelativo(timestamp) {
      const ahora = Date.now();
      const diffMs = ahora - timestamp;
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return "menos de un minuto";
      if (diffMin < 60) return `${diffMin} min`;
      const diffHoras = Math.floor(diffMin / 60);
      if (diffHoras < 24) return `${diffHoras} h`;
      const diffDias = Math.floor(diffHoras / 24);
      return `${diffDias} d`;
    },
    getImageUrl(producto) {
      // Si tiene imagen_url y no está vacía, usarla
      if (producto.imagen_url && producto.imagen_url.trim() !== '') {
        return producto.imagen_url;
      }
      // Fallback a placeholder
      return '/Productos/placeholder-product.png';
    },
    handleImageError(event) {
      // Prevenir loop infinito
      if (!event.target.dataset.fallback) {
        event.target.dataset.fallback = 'true';
        event.target.src = '/Productos/placeholder-product.png';
      }
    },
  },
};
