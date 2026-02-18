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
      marcasMap: {
        1: "ASUS",
        2: "MSI",
        3: "AMD",
        4: "Intel",
        5: "NVIDIA",
        6: "Corsair",
        7: "Kingston",
        8: "Logitech",
        9: "Razer",
        10: "Samsung",
        11: "Western Digital",
        12: "Seagate",
        13: "TP-Link",
        14: "Cisco",
        15: "Sony",
        16: "JBL",
        17: "Dell",
        18: "HP",
        19: "Lenovo",
        20: "Apple",
      },
    };
  },
  async created() {
    this.isAuthenticated = !!localStorage.getItem("access_token");
    const marcaId = this.$route.params.id;
    
    // Obtener nombre de la marca desde el map
    this.nombreMarca = this.marcasMap[marcaId] || "Marca";
    
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
        
        const response = await apiClient.get('/tienda/productos', {
          params: { marca: marca }
        });
        
        // Mapear productos y construir URLs completas de imágenes
        this.productos = response.data.map(producto => {
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
        const marcaId = this.$route.params.id;
        const marca = this.marcasMap[marcaId] || "Marca";
        this.nombreMarca = marca;
        this.cargarProductosPorMarca(marca);
      }
    }
  }
};