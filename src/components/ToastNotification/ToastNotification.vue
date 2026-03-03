<template>
  <transition-group name="toast-list" tag="div" class="toast-container">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="toast"
      :class="`toast--${toast.tipo}`"
      @click="cerrarToast(toast.id)"
    >
      <span class="toast__icon">
        <FontAwesomeIcon :icon="iconoPorTipo(toast.tipo)" />
      </span>
      <span class="toast__mensaje">{{ toast.mensaje }}</span>
      <button class="toast__cerrar" @click.stop="cerrarToast(toast.id)">
        <FontAwesomeIcon :icon="['fas', 'xmark']" />
      </button>
    </div>
  </transition-group>
</template>

<script>
export default {
  name: 'ToastNotification',
  computed: {
    toasts() {
      return this.$store.getters.toasts;
    },
  },
  methods: {
    iconoPorTipo(tipo) {
      const iconos = {
        success: ['fas', 'circle-check'],
        error:   ['fas', 'circle-xmark'],
        warning: ['fas', 'triangle-exclamation'],
        info:    ['fas', 'circle-info'],
      };
      return iconos[tipo] || iconos.info;
    },
    cerrarToast(id) {
      this.$store.dispatch('cerrarToast', id);
    },
  },
};
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 380px;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 10px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.18);
  font-size: 0.9rem;
  font-weight: 500;
  color: #fff;
  cursor: pointer;
  pointer-events: all;
  min-width: 280px;
  line-height: 1.4;
  backdrop-filter: blur(4px);
}

.toast--success { background: #22c55e; }
.toast--error   { background: #ef4444; }
.toast--warning { background: #f59e0b; color: #1a1a1a; }
.toast--info    { background: #3b82f6; }

.toast__icon {
  font-size: 1.15rem;
  flex-shrink: 0;
}

.toast__mensaje {
  flex: 1;
  white-space: pre-line;
}

.toast__cerrar {
  background: transparent;
  border: none;
  cursor: pointer;
  color: inherit;
  font-size: 0.85rem;
  opacity: 0.7;
  flex-shrink: 0;
  padding: 0 2px;
  transition: opacity 0.15s;
}
.toast__cerrar:hover { opacity: 1; }

/* Transiciones */
.toast-list-enter-active,
.toast-list-leave-active {
  transition: all 0.3s ease;
}
.toast-list-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-list-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
.toast-list-move {
  transition: transform 0.3s ease;
}
</style>
