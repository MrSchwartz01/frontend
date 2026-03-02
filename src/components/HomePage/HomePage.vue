<template>
  <div>
    <!-- Encabezado -->
    <HeaderAnth
      :searchQuery="searchQuery"
      :isAuthenticated="isAuthenticated"
      @buscar="buscarProductos"
      @cerrar-sesion="cerrarSesion"
    />
    <!-- Contenido principal -->
    <div class="home-container">

      <!-- Sección de Banner y Video -->
      <section class="hero-banner-section">
        <div class="banner-video-wrapper">
          <!-- Carrusel de Banners -->
          <div class="banner-container">
            <CarouselBanner :banners="banners" />
          </div>
          <!-- Contenedor de Video / Playlist -->
          <div class="video-featured-container">
            <div class="video-wrapper">
              <iframe
                :key="currentVideoIndex"
                :src="currentVideoEmbedUrl"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
                title="Video destacado"
              ></iframe>
            </div>
            <!-- Controles de playlist (solo si hay más de 1 video) -->
            <div v-if="videoPlaylist.length > 1" class="video-playlist-controls">
              <button class="vp-btn" @click="prevVideo" title="Video anterior">&#8249;</button>
              <div class="vp-info">
                <span class="vp-titulo">{{ currentVideo?.titulo }}</span>
                <span class="vp-pager">{{ currentVideoIndex + 1 }} / {{ videoPlaylist.length }}</span>
              </div>
              <button class="vp-btn" @click="nextVideo" title="Siguiente video">&#8250;</button>
            </div>
          </div>
        
        </div>
      </section>
      <!-- Categorías más visitadas -->
      <section class="categorias-section">
        <h2 class="section-title">Categorías más visitadas</h2>
        <div class="categorias-grid">
          <div
            v-for="categoria in categoriasMasVisitadas"
            :key="categoria.id"
            class="categoria-card"
            @click="filtrarPorCategoria(categoria.nombre)"
          >
            <div class="categoria-icon" v-html="categoria.icon"></div>
            <h3>{{ categoria.nombre }}</h3>
            <p class="categoria-stats">{{ categoria.visitas }} visitas</p>
          </div>
        </div>
      </section>
      <!-- Filtros de precio -->
      <div class="price-filters">
        <span>Filtrar por precio:</span>
        <button
          :class="{ active: selectedPriceRange === '' }"
          @click="cambiarRangoPrecio('')"
        >
          Todos
        </button>
        <button
          :class="{ active: selectedPriceRange === 'low' }"
          @click="cambiarRangoPrecio('low')"
        >
          Menor a $100
        </button>
        <button
          :class="{ active: selectedPriceRange === 'mid' }"
          @click="cambiarRangoPrecio('mid')"
        >
          $101 a $399
        </button>
        <button
          :class="{ active: selectedPriceRange === 'high' }"
          @click="cambiarRangoPrecio('high')"
        >
          Desde $400
        </button>
      </div>
    <!-- Lista de Productos -->
<div class="product-grid">
  <div
    v-for="producto in productosMostrados"
    :key="producto.codigo"
    class="product-card"
    @click="verDetalle(producto.codigo)"
  >
    <!-- Carrusel de imágenes del producto -->
    <ProductImageCarousel
      :images="getProductImages(producto)"
      :alt-text="producto.producto"
      :auto-play="true"
      :auto-play-interval="3000"
      @click="verDetalle(producto.codigo)"
    >
      <template #badge>
        <div v-if="producto.tienePromocion" class="promo-badge">
          -{{ producto.promocion.porcentaje }}%
        </div>
      </template>
    </ProductImageCarousel>
    <!-- Información del producto -->
    <div class="product-info">
      <h3 class="product-title">{{ producto.producto }}</h3>
      <!-- Precio -->
      <div v-if="isAuthenticated" class="product-price">
        <div v-if="producto.tienePromocion">
          <span class="price-original">${{ producto.promocion.precioOriginal }}</span>
          <span class="price-current">${{ producto.promocion.precioConDescuento }}</span>
        </div>
        <div v-else>
          <span class="price-current">${{ producto.costoTotal }}</span>
        </div>
      </div>
      <div v-else class="product-price">
        <span class="price-login">Inicia sesión para ver el precio</span>
      </div>
      <!-- Botón agregar al carrito -->
      <button 
        v-if="isAuthenticated"
        @click.stop="agregarAlCarrito(producto)" 
        class="btn-add-cart"
        :disabled="parseInt(producto.existenciaTotal) <= 0"
      >
        <span v-if="parseInt(producto.existenciaTotal) > 0">AGREGAR AL CARRITO</span>
        <span v-else>SIN STOCK</span>
      </button>
      <button 
        v-else
        @click.stop="redirigirLogin"
        class="btn-add-cart"
      >
        INICIAR SESIÓN
      </button>
    </div>
  </div>
</div>
      <!-- Botón para cargar más productos -->
      <button
        v-if="productosMostrados.length < productos.length && searchQuery.trim() === ''"
        @click="cargarMasProductos"
        class="cargar-mas"
      >
        Cargar más productos
      </button>
      <!-- Mensaje de No Resultados -->
      <div v-if="productosMostrados.length === 0 && searchQuery.trim() !== ''">
        <p>No se encontraron productos que coincidan con "{{ searchQuery }}".</p>
      </div>
      <!-- Historial de productos vistos recientemente -->
      <HistorialProductosVistos />
    </div>
    <!-- Pie de página -->
    <FooterAnth />
    <!-- Mapa de ubicación -->
  </div>
</template>

<script src="./HomePage.js"></script>
<style src="./HomePage.css"></style>