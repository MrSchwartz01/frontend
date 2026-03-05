import apiClient from '@/services/api';
import { getImageUrl } from '@/config/api';

export default {
  name: 'AdminProductos',
  data() {
    return {
      productos: [],
      productosFiltrados: [],
      imagenes: [],
      cargando: true,
      cargandoImagenes: false,
      guardando: false,
      subiendoImagen: false,
      showEditModal: false,
      showCreateModal: false,
      showImagenesModal: false,
      editando: false,
      productoActual: null,
      archivoSeleccionado: null,
      imagenPrincipal: false,
      formProducto: this.getEmptyForm(),
      // Filtros
      filtros: {
        busqueda: '',
        tipoBusqueda: 'todos',
        marca: '',
        medida: '',
        stock: '',
      },
      // Opciones disponibles para filtros
      marcasDisponibles: [],
      medidasDisponibles: [],
      // Paginación
      paginaActual: 1,
      productosPorPagina: 20,
      paginaInput: null,
    };
  },
  computed: {
    placeholderBusqueda() {
      const placeholders = {
        todos: 'Nombre, código o marca...',
        nombre: 'Buscar por nombre...',
        marca: 'Buscar por marca...',
        codigo: 'Buscar por código...',
      };
      return placeholders[this.filtros.tipoBusqueda] || 'Buscar...';
    },
    totalPaginas() {
      return Math.ceil(this.productosFiltrados.length / this.productosPorPagina);
    },
    productosPaginados() {
      const inicio = (this.paginaActual - 1) * this.productosPorPagina;
      const fin = inicio + this.productosPorPagina;
      return this.productosFiltrados.slice(inicio, fin);
    },
    indiceInicio() {
      return (this.paginaActual - 1) * this.productosPorPagina + 1;
    },
    indiceFin() {
      return Math.min(this.paginaActual * this.productosPorPagina, this.productosFiltrados.length);
    },
    paginasVisibles() {
      const total = this.totalPaginas;
      const actual = this.paginaActual;
      const paginas = [];

      // Si hay 7 o menos páginas, mostrar todas
      if (total <= 7) {
        for (let i = 1; i <= total; i++) {
          paginas.push(i);
        }
        return paginas;
      }

      // Siempre mostrar primera página
      paginas.push(1);

      // Calcular rango alrededor de la página actual
      let inicio = Math.max(2, actual - 1);
      let fin = Math.min(total - 1, actual + 1);

      // Ajustar si estamos cerca del inicio
      if (actual <= 3) {
        fin = 5;
      }

      // Ajustar si estamos cerca del final
      if (actual >= total - 2) {
        inicio = total - 4;
      }

      // Agregar puntos suspensivos al inicio si es necesario
      if (inicio > 2) {
        paginas.push('...');
      }

      // Agregar páginas del rango
      for (let i = inicio; i <= fin; i++) {
        if (i > 1 && i < total) {
          paginas.push(i);
        }
      }

      // Agregar puntos suspensivos al final si es necesario
      if (fin < total - 1) {
        paginas.push('...');
      }

      // Siempre mostrar última página
      if (total > 1) {
        paginas.push(total);
      }

      return paginas;
    },
  },
  async mounted() {
    await this.cargarProductos();
  },
  methods: {
    handleImageError(event) {
      // Prevenir loop infinito: solo cambiar si no es ya el placeholder
      if (!event.target.dataset.fallback) {
        event.target.dataset.fallback = 'true';
        event.target.src = '/placeholder_product.jpg';
      }
    },
    
    getEmptyForm() {
      return {
        codigo: '',
        producto: '',
        marca: '',
        medida: '',
        almacen: '',
        garantia: '',
        costoTotal: 0,
        existenciaTotal: '0',
      };
    },

    async cargarProductos() {
      try {
        this.cargando = true;
        // El interceptor de apiClient ya agrega el token automáticamente
        // y manejará errores 401 (incluyendo refresh token y redirección al login)
        const response = await apiClient.get('/tienda/productos/admin/todos');
        // La API devuelve { data: [...], total, page, limit, totalPages }
        // Mostrar todos los productos, incluso sin stock o sin precio
        const productosArray = response.data.data || response.data;
        
        // Procesar URLs de imágenes para que funcionen correctamente
        this.productos = productosArray.map(producto => ({
          ...producto,
          imagen_url: getImageUrl(producto.imagen_url)
        }));
        
        this.productosFiltrados = [...this.productos];
        this.extraerOpcionesFiltros();
      } catch (error) {
        console.error('Error al cargar productos:', error);
        // Solo mostrar mensaje si no es error 401 (el interceptor ya lo maneja)
        if (error.response?.status !== 401) {
          this.$store.dispatch('mostrarToast', { mensaje: 'Error al cargar productos: ' + (error.response?.data?.message || error.message), tipo: 'error' });
        }
      } finally {
        this.cargando = false;
      }
    },

    extraerOpcionesFiltros() {
      // Extraer marcas únicas
      const marcasSet = new Set();
      this.productos.forEach(p => {
        if (p.marca) marcasSet.add(p.marca);
      });
      this.marcasDisponibles = Array.from(marcasSet).sort();

      // Extraer medidas únicas
      const medidasSet = new Set();
      this.productos.forEach(p => {
        if (p.medida) medidasSet.add(p.medida);
      });
      this.medidasDisponibles = Array.from(medidasSet).sort();
    },

    aplicarFiltros() {
      let resultado = [...this.productos];

      // Filtro por búsqueda de texto
      if (this.filtros.busqueda) {
        const busqueda = this.filtros.busqueda.toLowerCase();
        switch (this.filtros.tipoBusqueda) {
          case 'nombre':
            resultado = resultado.filter(p =>
              p.producto && p.producto.toLowerCase().includes(busqueda)
            );
            break;
          case 'marca':
            resultado = resultado.filter(p =>
              p.marca && p.marca.toLowerCase().includes(busqueda)
            );
            break;
          case 'codigo':
            resultado = resultado.filter(p =>
              p.codigo && p.codigo.toString().toLowerCase().includes(busqueda)
            );
            break;
          default: // 'todos'
            resultado = resultado.filter(p =>
              (p.producto && p.producto.toLowerCase().includes(busqueda)) ||
              (p.codigo && p.codigo.toString().toLowerCase().includes(busqueda)) ||
              (p.marca && p.marca.toLowerCase().includes(busqueda))
            );
        }
      }

      // Filtro por marca
      if (this.filtros.marca) {
        resultado = resultado.filter(p => p.marca === this.filtros.marca);
      }

      // Filtro por medida
      if (this.filtros.medida) {
        resultado = resultado.filter(p => p.medida === this.filtros.medida);
      }

      // Filtro por stock
      if (this.filtros.stock) {
        resultado = resultado.filter(p => {
          const stock = parseInt(p.existenciaTotal) || 0;
          switch (this.filtros.stock) {
            case 'con-stock':
              return stock > 0;
            case 'sin-stock':
              return stock === 0;
            case 'bajo-stock':
              return stock > 0 && stock < 10;
            default:
              return true;
          }
        });
      }

      this.productosFiltrados = resultado;
      // Resetear a la primera página al aplicar filtros
      this.paginaActual = 1;
    },

    limpiarFiltros() {
      this.filtros = {
        busqueda: '',
        tipoBusqueda: 'todos',
        marca: '',
        medida: '',
        stock: '',
      };
      this.productosFiltrados = [...this.productos];
      this.paginaActual = 1;
    },

    irAPagina(pagina) {
      if (pagina >= 1 && pagina <= this.totalPaginas) {
        this.paginaActual = pagina;
        // Scroll al inicio de la lista de productos
        const element = document.querySelector('.productos-grid');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    },

    paginaSiguiente() {
      if (this.paginaActual < this.totalPaginas) {
        this.irAPagina(this.paginaActual + 1);
      }
    },

    paginaAnterior() {
      if (this.paginaActual > 1) {
        this.irAPagina(this.paginaActual - 1);
      }
    },

    irAPaginaInput() {
      if (this.paginaInput && this.paginaInput >= 1 && this.paginaInput <= this.totalPaginas) {
        this.irAPagina(this.paginaInput);
        this.paginaInput = null; // Limpiar el input después de navegar
      } else if (this.paginaInput) {
        this.$store.dispatch('mostrarToast', { mensaje: `Por favor ingresa un número entre 1 y ${this.totalPaginas}`, tipo: 'warning' });
      }
    },

    editarProducto(producto) {
      this.editando = true;
      this.productoActual = producto;
      // Solo copiar los campos editables del formulario
      this.formProducto = {
        codigo: producto.codigo,
        producto: producto.producto || '',
        marca: producto.marca || '',
        medida: producto.medida || '',
        almacen: producto.almacen || '',
        garantia: producto.garantia || '',
        costoTotal: producto.costoTotal || 0,
        existenciaTotal: producto.existenciaTotal || '0',
      };
      this.showEditModal = true;
    },

    async guardarProducto() {
      try {
        this.guardando = true;
        const token = localStorage.getItem('access_token');
        const headers = { Authorization: `Bearer ${token}` };

        // Preparar solo los campos válidos para el backend
        const datosProducto = {
          producto: this.formProducto.producto,
          marca: this.formProducto.marca,
          medida: this.formProducto.medida,
          almacen: this.formProducto.almacen,
          garantia: this.formProducto.garantia,
          costoTotal: parseFloat(this.formProducto.costoTotal) || 0,
          existenciaTotal: this.formProducto.existenciaTotal?.toString() || '0',
        };

        if (this.editando) {
          // Actualizar producto existente
          await apiClient.put(
            `/tienda/productos/${this.productoActual.codigo}`,
            datosProducto,
            { headers }
          );
          this.$store.dispatch('mostrarToast', { mensaje: 'Producto actualizado correctamente', tipo: 'success' });
        } else {
          // Crear nuevo producto
          await apiClient.post('/tienda/productos', this.formProducto, {
            headers,
          });
          this.$store.dispatch('mostrarToast', { mensaje: 'Producto creado correctamente', tipo: 'success' });
        }

        await this.cargarProductos();
        this.cerrarEditModal();
      } catch (error) {
        console.error('Error al guardar producto:', error);
        this.$store.dispatch('mostrarToast', { mensaje: 'Error al guardar producto: ' + (error.response?.data?.message || error.message), tipo: 'error' });
      } finally {
        this.guardando = false;
      }
    },

    async toggleActivo(producto) {
      const accion = producto.activo ? 'desactivar' : 'activar';
      if (!confirm(`¿Está seguro de ${accion} este producto?`)) return;

      try {
        const token = localStorage.getItem('access_token');
        await apiClient.put(
          `/tienda/productos/${producto.id}`,
          { activo: !producto.activo },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        await this.cargarProductos();
        this.$store.dispatch('mostrarToast', { mensaje: `Producto ${accion === 'desactivar' ? 'desactivado' : 'activado'} correctamente`, tipo: 'success' });
      } catch (error) {
        console.error('Error al cambiar estado:', error);
        this.$store.dispatch('mostrarToast', { mensaje: 'Error al cambiar estado del producto', tipo: 'error' });
      }
    },

    async gestionarImagenes(producto) {
      this.productoActual = producto;
      this.showImagenesModal = true;
      await this.cargarImagenes(producto.codigo);
    },

    async cargarImagenes(productoCodigo) {
      try {
        this.cargandoImagenes = true;
        const response = await apiClient.get(`/images/producto/${productoCodigo}`);
        // Procesar URLs de imágenes
        this.imagenes = response.data.map(imagen => ({
          ...imagen,
          ruta_imagen: getImageUrl(imagen.ruta_imagen)
        }));
      } catch (error) {
        console.error('Error al cargar imágenes:', error);
        this.imagenes = [];
      } finally {
        this.cargandoImagenes = false;
      }
    },

    handleFileSelected(event) {
      const file = event.target.files[0];
      if (file) {
        // Validar tipo
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          this.$store.dispatch('mostrarToast', { mensaje: 'Solo se permiten archivos JPG, PNG o WEBP', tipo: 'warning' });
          return;
        }

        // Validar tamaño (5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
          this.$store.dispatch('mostrarToast', { mensaje: 'El archivo no debe superar 5MB', tipo: 'warning' });
          return;
        }

        this.archivoSeleccionado = file;
      }
    },

    async subirImagen() {
      if (!this.archivoSeleccionado || !this.productoActual) return;

      try {
        this.subiendoImagen = true;
        const formData = new FormData();
        
        // Agregar archivo - probar con diferentes nombres de campo comunes
        formData.append('file', this.archivoSeleccionado);
        formData.append('es_principal', this.imagenPrincipal ? 'true' : 'false');
        formData.append('orden', (this.imagenes.length + 1).toString());
        
        // Debug: mostrar contenido del FormData
        console.log('📦 FormData contenido:');
        for (let [key, value] of formData.entries()) {
          console.log(`   ${key}:`, value);
        }
        console.log('📦 Producto Codigo:', this.productoActual.codigo);

        const response = await apiClient.post(`/images/upload/${this.productoActual.codigo}`,
          formData
        );
        
        console.log('✅ Respuesta:', response.data);

        this.$store.dispatch('mostrarToast', { mensaje: 'Imagen subida correctamente', tipo: 'success' });
        this.archivoSeleccionado = null;
        this.imagenPrincipal = false;
        this.$refs.fileInput.value = '';
        await this.cargarImagenes(this.productoActual.codigo);
      } catch (error) {
        console.error('Error al subir imagen:', error);
        console.error('Respuesta del servidor:', error.response?.data);
        this.$store.dispatch('mostrarToast', { mensaje: 'Error al subir imagen: ' + (error.response?.data?.message || error.response?.data?.detail || error.message), tipo: 'error' });
      } finally {
        this.subiendoImagen = false;
      }
    },

    async marcarPrincipal(imagen) {
      try {
        const token = localStorage.getItem('access_token');
        await apiClient.put(
          `/images/${imagen.id}/principal`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        await this.cargarImagenes(this.productoActual.codigo);
        this.$store.dispatch('mostrarToast', { mensaje: 'Imagen marcada como principal', tipo: 'success' });
      } catch (error) {
        console.error('Error al marcar imagen principal:', error);
        this.$store.dispatch('mostrarToast', { mensaje: 'Error al marcar imagen como principal', tipo: 'error' });
      }
    },

    async eliminarImagen(imagenId) {
      if (!confirm('¿Está seguro de eliminar esta imagen?')) return;

      try {
        // imagenId es el ID directo que se pasa desde el template
        await apiClient.delete(`/images/${imagenId}`);
        await this.cargarImagenes(this.productoActual.codigo);
        this.$store.dispatch('mostrarToast', { mensaje: 'Imagen eliminada correctamente', tipo: 'success' });
      } catch (error) {
        console.error('Error al eliminar imagen:', error);
        const errorMsg = error.response?.data?.message || 'Error desconocido';
        this.$store.dispatch('mostrarToast', { mensaje: `Error al eliminar imagen: ${errorMsg}`, tipo: 'error' });
      }
    },

    cerrarEditModal() {
      this.showEditModal = false;
      this.showCreateModal = false;
      this.editando = false;
      this.productoActual = null;
      this.formProducto = this.getEmptyForm();
    },

    cerrarImagenesModal() {
      this.showImagenesModal = false;
      this.productoActual = null;
      this.imagenes = [];
      this.archivoSeleccionado = null;
      this.imagenPrincipal = false;
    },
  },
  watch: {
    showCreateModal(val) {
      if (val) {
        this.editando = false;
        this.productoActual = null;
        this.formProducto = this.getEmptyForm();
        this.showEditModal = true;
      }
    },
  },
};
