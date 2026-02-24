import HeaderAnth from "../HeaderAnth/HeaderAnth.vue";
import FooterAnth from "../FooterAnth/FooterAnth.vue";
import { API_BASE_URL } from "@/config/api";
import axios from "axios";

export default {
  name: "CategoriasProductos",
  components: {
    HeaderAnth,
    FooterAnth,
  },
  data() {
    return {
      searchQuery: "",
      isAuthenticated: false,
      categorias: [],
      topProductos: [
        {
          id: "top-1",
          ranking: 1,
          nombre: "MacBook Pro 16\" M3",
          marca: "Apple",
          precio: "2499.99",
          imagen_url: "/Productos/placeholder-product.png",
        },
        {
          id: "top-2",
          ranking: 2,
          nombre: "Dell XPS 15",
          marca: "Dell",
          precio: "1899.99",
          imagen_url: "/Productos/placeholder-product.png",
        },
        {
          id: "top-3",
          ranking: 3,
          nombre: "Logitech MX Master 3S",
          marca: "Logitech",
          precio: "99.99",
          imagen_url: "/Productos/placeholder-product.png",
        },
      ],
      cargandoCategorias: false,
    };
  },
  created() {
    this.isAuthenticated = !!localStorage.getItem("access_token");
    this.cargarCategorias();
  },
  methods: {
    /**
     * Obtiene las categorías disponibles desde el backend
     */
    async cargarCategorias() {
      this.cargandoCategorias = true;
      try {
        const response = await axios.get(`${API_BASE_URL}/tienda/productos/categorias/lista`);
        
        // Mapear categorías del backend con iconos
        this.categorias = response.data.map((cat, index) => ({
          id: index + 1,
          nombre: cat.nombre_categoria,
          slug: this.generarSlug(cat.nombre_categoria),
          icono: this.obtenerIconoCategoria(cat.nombre_categoria),
          cantidad: cat.total_productos,
        }));
        
        console.log('Categorías cargadas:', this.categorias);
      } catch (error) {
        console.error('Error al cargar categorías:', error);
        // Usar categorías por defecto en caso de error
        this.categorias = [];
      } finally {
        this.cargandoCategorias = false;
      }
    },
    
    /**
     * Genera un slug a partir del nombre de la categoría
     */
    generarSlug(nombre) {
      return nombre
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remover acentos
        .replace(/\s+/g, '-') // Reemplazar espacios con guiones
        .replace(/[^\w-]+/g, ''); // Remover caracteres especiales
    },
    
    /**
     * Obtiene el icono SVG correspondiente a cada categoría
     */
    obtenerIconoCategoria(nombreCategoria) {
      const iconos = {
        'Laptops': '<svg xmlns="http://www.w3.org/2000/svg" class="categoria-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="2" y1="20" x2="22" y2="20"></line></svg>',
        'Tintas y Toners': '<svg xmlns="http://www.w3.org/2000/svg" class="categoria-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>',
        'Impresoras': '<svg xmlns="http://www.w3.org/2000/svg" class="categoria-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>',
        'Monitores': '<svg xmlns="http://www.w3.org/2000/svg" class="categoria-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>',
        'Accesorios': '<svg xmlns="http://www.w3.org/2000/svg" class="categoria-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="9" width="20" height="12" rx="2" ry="2"></rect><path d="M6 13h.01"></path><path d="M10 13h.01"></path><path d="M14 13h.01"></path><path d="M18 13h.01"></path></svg>',
        'Almacenamiento': '<svg xmlns="http://www.w3.org/2000/svg" class="categoria-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline></svg>',
        'Componentes': '<svg xmlns="http://www.w3.org/2000/svg" class="categoria-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>',
        'Redes': '<svg xmlns="http://www.w3.org/2000/svg" class="categoria-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>',
        'Software': '<svg xmlns="http://www.w3.org/2000/svg" class="categoria-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>',
        'Otros': '<svg xmlns="http://www.w3.org/2000/svg" class="categoria-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
      };
      
      return iconos[nombreCategoria] || iconos['Otros'];
    },
    
    cerrarSesion() {
      localStorage.removeItem("access_token");
      this.isAuthenticated = false;
      this.$router.replace("/login");
    },
    buscarProductos(query) {
      this.searchQuery = query;
      // Implementar lógica de búsqueda
    },
    irACategoria(slug) {
      this.$router.push({ name: "ProductosPorCategoria", params: { categoria: slug } });
    },
    verDetalle(id) {
      this.$router.push({ name: "ProductoDetalle", params: { id } });
    },
  },
};
