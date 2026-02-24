<template>
  <div class="page-layout">
    <HeaderAnth
      :searchQuery="searchQuery"
      :isAuthenticated="isAuthenticated"
      @buscar="buscarProductos"
      @cerrar-sesion="cerrarSesion"
    />

    <!-- Hero Section -->
    <section class="hero-section">
      <h1 class="hero-title">Explora Nuestras Categorías</h1>
      <p class="hero-subtitle">Encuentra los mejores productos organizados para ti</p>
    </section>

    <div class="categorias-container">
      <!-- Sección de categorías -->
      <div class="categorias-section">
        <div class="section-header">
          <span class="section-badge">📦 Categorías</span>
          <h2>Navega por Categoría</h2>
          <p>Selecciona una categoría para explorar productos</p>
        </div>
        <div class="categorias-grid">
          <div
            v-for="categoria in categorias"
            :key="categoria.id"
            class="categoria-card"
            @click="irACategoria(categoria.slug)"
          >
            <div class="categoria-icon-wrapper">
              <div class="categoria-icon" v-html="categoria.icono"></div>
            </div>
            <div class="categoria-info">
              <h3>{{ categoria.nombre }}</h3>
              <span class="producto-count">{{ categoria.cantidad }} productos</span>
            </div>
            <div class="categoria-arrow">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    <FooterAnth />
  </div>
</template>

<script src="./CategoriasProductos.js"></script>
<style src="./CategoriasProductos.css"></style>
