import HeaderAnth from "../HeaderAnth/HeaderAnth.vue";
import FooterAnth from "../FooterAnth/FooterAnth.vue";
import ContactoAsesor from '../ContactoAsesor/ContactoAsesor.vue';
import ProductImageCarousel from '../ProductImageCarousel/ProductImageCarousel.vue';
import apiClient from '@/services/api';
import { getImageUrl } from '@/config/api';

export default {
  name: "ProductosPorCategoria",
  components: {
    HeaderAnth,
    FooterAnth,
    ContactoAsesor,
    ProductImageCarousel,
  },
  data() {
    return {
      searchQuery: "",
      isAuthenticated: false,
      nombreCategoria: "",
      marcaSeleccionada: null,
      productos: [],
      // Control de secciones de filtros abiertas/cerradas
      sectionsOpen: {
        category: true,
        subcategory: true,
        brand: true,
        storage: false,
        bluetooth: false,
      },
    };
  },
  computed: {
    productosFiltrados() {
      if (this.marcaSeleccionada === null) {
        return this.productos;
      }
      return this.productos.filter(
        (p) => p.marca?.toLowerCase() === this.marcaSeleccionada.toLowerCase()
      );
    },
    marcasDisponibles() {
      // Extraer marcas únicas de los productos cargados
      const marcas = [...new Set(this.productos.map(p => p.marca).filter(Boolean))];
      return marcas.map(marca => ({ nombre: marca }));
    },
  },
  created() {
    this.isAuthenticated = !!localStorage.getItem("access_token");
    // El parámetro categoria ahora es el nombre exacto de la categoría (no un slug)
    const categoriaParam = this.$route.params.categoria;
    this.nombreCategoria = categoriaParam;
    this.cargarProductos(categoriaParam);
  },
  methods: {
    cerrarSesion() {
      localStorage.removeItem("access_token");
      this.isAuthenticated = false;
      this.$router.replace("/login");
    },
    buscarProductos(query) {
      this.searchQuery = query;
      // Implementar lógica de búsqueda
    },
    async cargarProductos(nombreCategoria) {
      try {
        console.log('🔍 Cargando productos para categoría:', nombreCategoria);
        
        // Usar el nuevo endpoint con filtro de categoría
        const url = `/tienda/productos?categoria=${encodeURIComponent(nombreCategoria)}`;
        console.log('🌐 URL de petición:', url);
        
        const response = await apiClient.get(url);
        
        // La API devuelve { data: [...], total, page, limit, totalPages }
        const productosArray = response.data.data || response.data;
        
        console.log('✅ Respuesta del servidor:', {
          status: response.status,
          totalProductos: productosArray.length,
          primerProducto: productosArray[0]
        });
        
        this.productos = productosArray.map(producto => {
          // Obtener la ruta de la imagen (principal o primera disponible)
          let rutaImagen = '/Productos/placeholder-product.png';
          if (producto.productImages?.length > 0) {
            const imagenPrincipal = producto.productImages.find(img => img.es_principal);
            rutaImagen = imagenPrincipal?.ruta_imagen || producto.productImages[0].ruta_imagen;
          } else if (producto.imagen_url) {
            rutaImagen = producto.imagen_url;
          }
          
          return {
            ...producto,
            imagen_url: getImageUrl(rutaImagen)
          };
        });
        
        console.log(`✅ Productos cargados para ${nombreCategoria}:`, this.productos.length);
        
        if (this.productos.length === 0) {
          console.warn('⚠️ No se encontraron productos para esta categoría');
        }
      } catch (error) {
        console.error("❌ Error al cargar productos:", error);
        console.error("❌ Detalles del error:", error.response?.data || error.message);
        this.productos = [];
      }
    },
    filtrarPorMarca(marca) {
      this.marcaSeleccionada = marca;
    },
    toggleSection(section) {
      this.sectionsOpen[section] = !this.sectionsOpen[section];
    },
    getProductImages(producto) {
      // Retornar array de imágenes del producto
      if (producto.productImages && producto.productImages.length > 0) {
        // Ordenar para que la imagen principal esté primero
        const imagesSorted = [...producto.productImages].sort((a, b) => {
          if (a.es_principal) return -1;
          if (b.es_principal) return 1;
          return 0;
        });
        return imagesSorted;
      }
      
      // Fallback a imagen_url si no hay productImages
      if (producto.imagen_url) {
        return [producto.imagen_url];
      }
      
      return [];
    },
    verDetalle(codigo) {
      this.$router.push({ name: "ProductoDetalle", params: { id: codigo } });
    },
    obtenerTextoStock(stock) {
      if (stock === 0) {
        return 'Sin stock';
      } else if (stock <= 5) {
        return `${stock} unidades - Quedan pocas unidades`;
      } else {
        return 'Disponible';
      }
    },
  },
};
