// Ejemplo de integración del sistema de tracking de analytics
// Este archivo sirve como referencia para integrar el tracking en tus componentes

import analyticsService from '@/services/analytics';

// ============================================
// EJEMPLO 1: Tracking en Router Global
// ============================================
// Agrega esto a tu archivo router/index.js

/*
import analyticsService from '@/services/analytics';

const router = new VueRouter({
  routes: [...],
});

// Trackear automáticamente cada cambio de ruta
router.afterEach((to) => {
  // Trackear la nueva página visitada
  analyticsService.trackPageView(to.path);
});

export default router;
*/

// ============================================
// EJEMPLO 2: Tracking en Componente de Producto
// ============================================

export const ProductDetailExample = {
  name: 'ProductDetail',
  data() {
    return {
      producto: null,
    };
  },
  
  async mounted() {
    // Cargar el producto primero
    await this.loadProducto();
    
    // Luego trackear la visita
    if (this.producto) {
      analyticsService.trackProductView(
        this.producto.codigo,
        this.producto.producto,
        this.producto.marca
      );
    }
  },
  
  methods: {
    async loadProducto() {
      // Tu lógica para cargar el producto
      // const response = await api.get(`/productos/${this.codigo}`);
      // this.producto = response.data;
    }
  }
};

// ============================================
// EJEMPLO 3: Tracking en Lista de Productos
// ============================================

export const ProductListExample = {
  name: 'ProductList',
  
  mounted() {
    // Trackear visita a la página de lista
    analyticsService.trackPageView('/productos');
  },
  
  methods: {
    verDetalleProducto(producto) {
      // Trackear click en producto antes de redirigir
      analyticsService.trackProductView(
        producto.codigo,
        producto.producto,
        producto.marca
      );
      
      // Redirigir al detalle
      this.$router.push(`/producto/${producto.codigo}`);
    }
  }
};

// ============================================
// EJEMPLO 4: Tracking en Filtro por Marca
// ============================================

export const BrandFilterExample = {
  name: 'BrandFilter',
  
  methods: {
    async filtrarPorMarca(marca) {
      // Trackear interés en la marca
      await analyticsService.trackBrandView(marca);
      
      // Aplicar el filtro
      this.$emit('filter-changed', { marca });
      
      // O actualizar la URL
      this.$router.push({
        query: { ...this.$route.query, marca }
      });
    }
  }
};

// ============================================
// EJEMPLO 5: Tracking en Búsqueda
// ============================================

export const SearchExample = {
  name: 'SearchComponent',
  
  methods: {
    async buscar(query) {
      // Trackear la búsqueda como visita a página
      await analyticsService.trackPageView(`/buscar?q=${query}`);
      
      // Realizar búsqueda
      const resultados = await this.realizarBusqueda(query);
      
      // Si hay resultados, podrías trackear los productos más relevantes
      if (resultados.length > 0) {
        // Trackear el primer resultado como "visto"
        const primerProducto = resultados[0];
        analyticsService.trackProductView(
          primerProducto.codigo,
          primerProducto.producto,
          primerProducto.marca
        );
      }
    }
  }
};

// ============================================
// EJEMPLO 6: Tracking en Categorías
// ============================================

export const CategoryExample = {
  name: 'CategoryView',
  
  mounted() {
    // Trackear visita a categoría
    const categoria = this.$route.params.categoria;
    analyticsService.trackPageView(`/categoria/${categoria}`);
  },
  
  methods: {
    verProductosDeCategoria(categoria) {
      // Trackear click en categoría
      analyticsService.trackPageView(`/categoria/${categoria}`);
      
      // Navegar
      this.$router.push(`/categoria/${categoria}`);
    }
  }
};

// ============================================
// EJEMPLO 7: Tracking en HomePage
// ============================================

export const HomePageExample = {
  name: 'HomePage',
  
  mounted() {
    // Trackear visita a home
    analyticsService.trackPageView('/home');
  },
  
  methods: {
    verProductoDestacado(producto) {
      // Trackear interés en producto destacado
      analyticsService.trackProductView(
        producto.codigo,
        producto.producto,
        producto.marca
      );
      
      // Ir al detalle
      this.$router.push(`/producto/${producto.codigo}`);
    },
    
    verMarca(marca) {
      // Trackear interés en marca
      analyticsService.trackBrandView(marca);
      
      // Filtrar por marca
      this.$router.push(`/productos?marca=${marca}`);
    }
  }
};

// ============================================
// EJEMPLO 8: Tracking con Vue Composables (Vue 3)
// ============================================

/*
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import analyticsService from '@/services/analytics';

export function usePageTracking() {
  const route = useRoute();
  
  onMounted(() => {
    analyticsService.trackPageView(route.path);
  });
}

// Uso en componente:
export default {
  setup() {
    usePageTracking();
    
    return {
      // ...
    };
  }
}
*/

// ============================================
// EJEMPLO 9: Tracking Batch (múltiples productos)
// ============================================

export const BatchTrackingExample = {
  name: 'CarouselProducts',
  
  methods: {
    async productosVisibles(productos) {
      // Si quieres trackear múltiples productos que están visibles
      // en un carrusel o grid, puedes hacerlo en lote
      
      // Opción 1: Trackear todos al mismo tiempo (no recomendado si son muchos)
      productos.forEach(producto => {
        analyticsService.trackProductView(
          producto.codigo,
          producto.producto,
          producto.marca
        );
      });
      
      // Opción 2: Trackear solo el primero o los más destacados
      if (productos.length > 0) {
        const productoDestacado = productos[0];
        analyticsService.trackProductView(
          productoDestacado.codigo,
          productoDestacado.producto,
          productoDestacado.marca
        );
      }
    }
  }
};

// ============================================
// EJEMPLO 10: Tracking Condicional
// ============================================

export const ConditionalTrackingExample = {
  name: 'ProductCard',
  
  methods: {
    async trackOnHover(producto) {
      // Solo trackear si el usuario pasa el mouse por más de 2 segundos
      this.hoverTimeout = setTimeout(() => {
        analyticsService.trackProductView(
          producto.codigo,
          producto.producto,
          producto.marca
        );
      }, 2000);
    },
    
    cancelTrackOnHover() {
      if (this.hoverTimeout) {
        clearTimeout(this.hoverTimeout);
      }
    }
  }
};

// ============================================
// BUENAS PRÁCTICAS
// ============================================

/*
1. NO SOBRE-TRACKEAR:
   - No hagas tracking en cada pequeña interacción
   - Trackea eventos significativos (visitas, clicks importantes)
   
2. TRACKEAR EN EL MOMENTO CORRECTO:
   - mounted() para visitas a páginas
   - Después de cargar datos para productos
   - En click handlers para interacciones de usuario
   
3. MANEJO DE ERRORES:
   - El servicio ya maneja errores internamente
   - No necesitas try/catch a menos que necesites lógica especial
   
4. PERFORMANCE:
   - Los trackings son asíncronos y no bloquean
   - Usa await solo si necesitas esperar la respuesta
   
5. PRIVACIDAD:
   - El tracking captura IPs pero son para analytics
   - Los session IDs son anónimos
   - Los user IDs solo se capturan si el usuario está autenticado
*/

export default {
  // Exportar todos los ejemplos para referencia
  ProductDetailExample,
  ProductListExample,
  BrandFilterExample,
  SearchExample,
  CategoryExample,
  HomePageExample,
  BatchTrackingExample,
  ConditionalTrackingExample,
};
