import HeaderAnth from "../HeaderAnth/HeaderAnth.vue";
import FooterAnth from "../FooterAnth/FooterAnth.vue";
import apiClient from '@/services/api';

export default {
  name: "ListaMarcas",
  components: {
    HeaderAnth,
    FooterAnth,
  },
  data() {
    return {
      marcas: [],
      cargando: true,
      isAuthenticated: false,
      // Mapeo de logos conocidos (opcional, para marcas que tengan logo)
      logosConocidos: {
        'ASUS': '/Marcas/asus.png',
        'MSI': '/Marcas/msi.png',
        'AMD': '/Marcas/amd.png',
        'Intel': '/Marcas/intel.png',
        'NVIDIA': '/Marcas/nvidia.png',
        'Corsair': '/Marcas/corsair.png',
        'Kingston': '/Marcas/kingston.png',
        'Logitech': '/Marcas/logitech.png',
        'Razer': '/Marcas/razer.png',
        'Samsung': '/Marcas/samsung.png',
        'Western Digital': '/Marcas/wd.png',
        'Seagate': '/Marcas/seagate.png',
        'TP-Link': '/Marcas/tplink.png',
        'Cisco': '/Marcas/cisco.png',
        'Sony': '/Marcas/sony.png',
        'JBL': '/Marcas/jbl.png',
      }
    };
  },
  async created() {
    this.isAuthenticated = !!localStorage.getItem("access_token");
    await this.cargarMarcas();
  },
  methods: {
    async cargarMarcas() {
      try {
        this.cargando = true;
        // Usar el nuevo endpoint para obtener marcas directamente
        const response = await apiClient.get('/tienda/productos/marcas/lista');
        const marcasData = response.data;
        
        // Mapear las marcas con sus imágenes
        this.marcas = marcasData.map((marca, index) => ({
          id: index + 1,
          nombre_marca: marca.nombre_marca,
          total_productos: marca.total_productos,
          imagen_url: this.obtenerLogoMarca(marca.nombre_marca)
        }));
        
        console.log('Marcas cargadas:', this.marcas.length);
        
      } catch (error) {
        console.error('Error al cargar marcas:', error);
        // Fallback al método anterior si el endpoint nuevo falla
        await this.cargarMarcasFallback();
      } finally {
        this.cargando = false;
      }
    },
    async cargarMarcasFallback() {
      try {
        // Método anterior como fallback
        const response = await apiClient.get('/tienda/productos');
        const productosArray = response.data.data || response.data;
        const productos = Array.isArray(productosArray) ? productosArray : [];
        
        // Extraer marcas únicas de los productos
        const marcasSet = new Set();
        productos.forEach(producto => {
          if (producto.marca) {
            const marcaTrimmed = producto.marca.trim();
            if (marcaTrimmed) {
              marcasSet.add(marcaTrimmed);
            }
          }
        });
        
        // Convertir a array de objetos con nombre e imagen
        this.marcas = Array.from(marcasSet).sort().map((nombre, index) => ({
          id: index + 1,
          nombre_marca: nombre,
          imagen_url: this.obtenerLogoMarca(nombre)
        }));
      } catch (fallbackError) {
        console.error('Error en fallback:', fallbackError);
        this.marcas = [];
      }
    },
    obtenerLogoMarca(nombreMarca) {
      // Buscar coincidencia exacta o parcial en los logos conocidos
      const logoKey = Object.keys(this.logosConocidos).find(key => 
        key.toLowerCase() === nombreMarca.toLowerCase() ||
        nombreMarca.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(nombreMarca.toLowerCase())
      );
      
      if (logoKey) {
        return this.logosConocidos[logoKey];
      }
      
      // Si no hay logo conocido, usar un placeholder o generar uno basado en el nombre
      return '/placeholder_product.jpg';
    },
    cerrarSesion() {
      localStorage.removeItem("access_token");
      this.isAuthenticated = false;
      this.$router.replace("/login");
    },
    filtrarPorMarca(nombreMarca) {
      // Usar el nombre de la marca para filtrar (igual que el dropdown del header)
      this.$router.push({ name: "ProductosPorMarca", params: { id: nombreMarca } });
    },
    handleImageError(event) {
      // Prevenir loop infinito: solo cambiar si no es ya el placeholder
      if (!event.target.dataset.fallback) {
        event.target.dataset.fallback = 'true';
        event.target.src = '/placeholder_product.jpg';
      }
    },
  },
};