<template>
  <div 
    class="product-image-carousel" 
    @mouseenter="pauseAutoPlay" 
    @mouseleave="resumeAutoPlay"
    @click.stop="handleClick"
  >
    <!-- Imagen actual -->
    <div class="carousel-image-wrapper">
      <transition name="fade" mode="out-in">
        <img
          :key="currentIndex"
          :src="currentImage"
          :alt="altText"
          @error="handleImageError"
          loading="lazy"
          class="carousel-image"
        />
      </transition>

      <!-- Badge de promoción -->
      <slot name="badge"></slot>
    </div>

    <!-- Indicadores de puntos -->
    <div class="carousel-indicators" v-if="images.length > 1">
      <button
        v-for="(image, index) in images"
        :key="index"
        :class="['indicator-dot', { active: index === currentIndex }]"
        @click.stop="goToSlide(index)"
        :aria-label="`Ir a imagen ${index + 1}`"
      ></button>
    </div>

    <!-- Botones de navegación (visibles al hover) -->
    <template v-if="images.length > 1">
      <button 
        class="carousel-nav carousel-nav-prev" 
        @click.stop="prevSlide"
        aria-label="Imagen anterior"
      >
        ‹
      </button>
      <button 
        class="carousel-nav carousel-nav-next" 
        @click.stop="nextSlide"
        aria-label="Imagen siguiente"
      >
        ›
      </button>
    </template>

    <!-- Contador de imágenes -->
    <div class="image-counter" v-if="images.length > 1">
      {{ currentIndex + 1 }} / {{ images.length }}
    </div>
  </div>
</template>

<script src="./ProductImageCarousel.js"></script>
<style src="./ProductImageCarousel.css"></style>
