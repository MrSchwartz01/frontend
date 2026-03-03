  // src/store.js
import { createStore } from 'vuex';

  const HISTORIAL_KEY = 'historial_productos_vistos';
  const VENTANA_MS_48H = 48 * 60 * 60 * 1000;

  function cargarHistorialInicial() {
    try {
      const raw = localStorage.getItem(HISTORIAL_KEY);
      if (!raw) return [];
      const ahora = Date.now();
      const datos = JSON.parse(raw);
      if (!Array.isArray(datos)) return [];
      return datos.filter((item) =>
        typeof item.vistoEn === 'number' &&
        ahora - item.vistoEn <= VENTANA_MS_48H,
      );
    } catch {
      return [];
    }
  }

  function guardarHistorial(historial) {
    try {
      localStorage.setItem(HISTORIAL_KEY, JSON.stringify(historial));
    } catch {
      // ignorar errores de almacenamiento
    }
  }

  let _toastIdCounter = 0;

  const store = createStore({
    state: {
      carrito: [],
      historialProductosVistos: cargarHistorialInicial(),
      toasts: [],
    },
    mutations: {
      agregarToast(state, toast) {
        state.toasts.push(toast);
      },
      eliminarToast(state, id) {
        state.toasts = state.toasts.filter((t) => t.id !== id);
      },
      agregarAlCarrito(state, producto) {
        state.carrito.push(producto);
      },
      eliminarDelCarrito(state, productoCodigo) {
        state.carrito = state.carrito.filter((producto) => producto.codigo !== productoCodigo);
      },
      limpiarCarrito(state) {
        state.carrito = [];
      },
      limpiarHistorial(state) {
        state.historialProductosVistos = [];
        localStorage.removeItem(HISTORIAL_KEY);
      },
      limpiarTodo(state) {
        state.carrito = [];
        state.historialProductosVistos = [];
        localStorage.removeItem(HISTORIAL_KEY);
      },
      registrarProductoVisto(state, producto) {
        const ahora = Date.now();
        const existenteIndex = state.historialProductosVistos.findIndex(
          (p) => p.codigo === producto.codigo,
        );

        const entrada = {
          codigo: producto.codigo,
          producto: producto.producto || '',
          imagen_url: producto.imagen_url || '',
          costoTotal: producto.costoTotal ?? null,
          vistoEn: ahora,
        };

        if (existenteIndex !== -1) {
          state.historialProductosVistos.splice(existenteIndex, 1);
        }

        state.historialProductosVistos.unshift(entrada);

        const limite = 50;
        if (state.historialProductosVistos.length > limite) {
          state.historialProductosVistos = state.historialProductosVistos.slice(0, limite);
        }

        const filtrado = state.historialProductosVistos.filter(
          (p) => ahora - p.vistoEn <= VENTANA_MS_48H,
        );

        state.historialProductosVistos = filtrado;
        guardarHistorial(filtrado);
      },
    },
    actions: {
      mostrarToast({ commit }, { mensaje, tipo = 'info', duracion = 4000 }) {
        const id = ++_toastIdCounter;
        commit('agregarToast', { id, mensaje, tipo });
        setTimeout(() => commit('eliminarToast', id), duracion);
      },
      cerrarToast({ commit }, id) {
        commit('eliminarToast', id);
      },
      agregarAlCarrito({ commit }, producto) {
        commit('agregarAlCarrito', producto);
      },
      eliminarDelCarrito({ commit }, productoCodigo) {
        commit('eliminarDelCarrito', productoCodigo);
      },
      limpiarCarrito({ commit }) {
        commit('limpiarCarrito');
      },
      limpiarHistorial({ commit }) {
        commit('limpiarHistorial');
      },
      limpiarTodo({ commit }) {
        commit('limpiarTodo');
      },
      registrarProductoVisto({ commit }, producto) {
        commit('registrarProductoVisto', producto);
      },
    },
    getters: {
      carrito: (state) => state.carrito,
      historialProductosVistos: (state) => state.historialProductosVistos,
      toasts: (state) => state.toasts,
    },
  });

  export default store;
