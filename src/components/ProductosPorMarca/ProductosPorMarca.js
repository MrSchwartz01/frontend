import HeaderAnth from "../HeaderAnth/HeaderAnth.vue";
import FooterAnth from "../FooterAnth/FooterAnth.vue";
import ContactoAsesor from '../ContactoAsesor/ContactoAsesor.vue';
import ProductImageCarousel from '../ProductImageCarousel/ProductImageCarousel.vue';
import apiClient from '@/services/api';
import { getImageUrl } from '@/config/api';

export default {
  name: "ProductosPorMarca",
  components: {
    HeaderAnth,
    FooterAnth,
    ContactoAsesor,
    ProductImageCarousel,
  },
  data() {
    return {
      productos: [],
      nombreMarca: "",
      isAuthenticated: false,
      cargando: true,
      error: null,
    };
  },
  async created() {
    this.isAuthenticated = !!localStorage.getItem("access_token");
    const marcaParam = this.$route.params.id;
    
    // El parámetro puede ser el nombre de la marca directamente
    // o un ID numérico del sistema antiguo (mantener compatibilidad)
    this.nombreMarca = marcaParam || "Marca";
    
    // Cargar productos reales de la base de datos
    await this.cargarProductosPorMarca(this.nombreMarca);
  },
  methods: {
    cerrarSesion() {
      localStorage.removeItem("access_token");
      this.isAuthenticated = false;
      this.$router.replace("/login");
    },
    verDetalle(codigo) {
      this.$router.push({ name: "ProductoDetalle", params: { id: codigo } });
    },
    async cargarProductosPorMarca(marca) {
      try {
        this.cargando = true;
        this.error = null;
        
        console.log('Cargando productos para marca:', marca);
        
        const response = await apiClient.get('/tienda/productos', {
          params: { marca: marca }
        });
        
        console.log('Respuesta de la API:', response.data);
        
        // La API devuelve { data: [...], total, page, limit, totalPages }
        const productosArray = response.data.data || response.data;
        
        // Mapear productos y construir URLs completas de imágenes
        this.productos = productosArray.map(producto => {
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
        
        console.log('Productos cargados:', this.productos.length);
        
        if (this.productos.length === 0) {
          this.error = `No se encontraron productos de la marca ${marca}`;
        }
      } catch (error) {
        console.error('Error al cargar productos por marca:', error);
        this.error = 'Error al cargar los productos. Por favor, intenta nuevamente.';
        this.productos = [];
      } finally {
        this.cargando = false;
      }
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
    handleImageError(event) {
      // Prevenir loop infinito: solo cambiar si no es ya el placeholder
      if (!event.target.dataset.fallback) {
        event.target.dataset.fallback = 'true';
        event.target.src = '/placeholder_product.jpg';
      }
    },
  },
  mounted() {
    // Scroll hacia arriba al cargar el componente
    window.scrollTo(0, 0);
  },
  watch: {
    '$route.params.id': {
      immediate: false,
      handler() {
        // Scroll hacia arriba cuando cambia la marca
        window.scrollTo(0, 0);
        const marcaParam = this.$route.params.id;
        this.nombreMarca = marcaParam || "Marca";
        this.cargarProductosPorMarca(this.nombreMarca);
      }
    }
  }
};