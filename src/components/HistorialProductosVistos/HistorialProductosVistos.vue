<template>
  <div class="historial-container" v-if="historial && historial.length">
    <h2 class="historial-titulo">Vistos recientemente</h2>
    <div class="historial-grid">
      <div
        v-for="producto in historial"
        :key="producto.codigo"
        class="historial-card"
        @click="verDetalle(producto.codigo)"
      >
        <img
          class="historial-imagen"
          :src="producto.imagen_url || 'ruta-imagen-default.png'"
          :alt="producto.producto || 'Producto visto recientemente'"
        />
        <div class="historial-info">
          <p class="historial-nombre">{{ producto.producto || 'Producto' }}</p>
          <div v-if="isAuthenticated && producto.costoTotal !== null">
            <p class="historial-precio">
              ${{ formatPrice(producto.costoTotal) }}
            </p>
            <p style="font-size: 0.7em; color: #999; margin: 0;">incluido IVA</p>
          </div>
          <p v-else-if="!isAuthenticated" class="historial-precio">Inicia sesión para ver precio</p>
          <p class="historial-fecha">Visto hace {{ tiempoRelativo(producto.vistoEn) }}</p>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="historial-vacio"></div>
</template>

<script src="./HistorialProductosVistos.js"></script>
<style src="./HistorialProductosVistos.css"></style>
