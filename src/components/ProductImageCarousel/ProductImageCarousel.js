import { getImageUrl } from '@/config/api';

export default {
  name: 'ProductImageCarousel',
  props: {
    // Array de imágenes del producto (puede ser productImages o array de URLs)
    images: {
      type: Array,
      required: true,
      default: () => []
    },
    // Texto alternativo para accesibilidad
    altText: {
      type: String,
      default: 'Producto'
    },
    // Autoplay activado/desactivado
    autoPlay: {
      type: Boolean,
      default: true
    },
    // Intervalo de autoplay en milisegundos
    autoPlayInterval: {
      type: Number,
      default: 3000
    },
    // Emitir evento click en la imagen
    clickable: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      currentIndex: 0,
      autoPlayTimer: null,
      isAutoPlayPaused: false,
    };
  },
  computed: {
    currentImage() {
      if (!this.images || this.images.length === 0) {
        return '/placeholder_product.jpg';
      }

      const image = this.images[this.currentIndex];
      
      // Si es un objeto con ruta_imagen (productImages)
      if (typeof image === 'object' && image.ruta_imagen) {
        return getImageUrl(image.ruta_imagen);
      }
      
      // Si es una URL directa
      if (typeof image === 'string') {
        return image.startsWith('http') ? image : getImageUrl(image);
      }

      return '/placeholder_product.jpg';
    }
  },
  mounted() {
    if (this.autoPlay && this.images.length > 1) {
      this.startAutoPlay();
    }
  },
  beforeUnmount() {
    this.stopAutoPlay();
  },
  methods: {
    nextSlide() {
      if (this.images.length > 1) {
        this.currentIndex = (this.currentIndex + 1) % this.images.length;
      }
    },
    prevSlide() {
      if (this.images.length > 1) {
        this.currentIndex = this.currentIndex === 0 
          ? this.images.length - 1 
          : this.currentIndex - 1;
      }
    },
    goToSlide(index) {
      this.currentIndex = index;
      // Reiniciar autoplay al seleccionar manualmente
      if (this.autoPlay) {
        this.stopAutoPlay();
        this.startAutoPlay();
      }
    },
    startAutoPlay() {
      if (this.images.length > 1) {
        this.autoPlayTimer = setInterval(() => {
          if (!this.isAutoPlayPaused) {
            this.nextSlide();
          }
        }, this.autoPlayInterval);
      }
    },
    stopAutoPlay() {
      if (this.autoPlayTimer) {
        clearInterval(this.autoPlayTimer);
        this.autoPlayTimer = null;
      }
    },
    pauseAutoPlay() {
      this.isAutoPlayPaused = true;
    },
    resumeAutoPlay() {
      this.isAutoPlayPaused = false;
    },
    handleImageError(event) {
      event.target.src = '/placeholder_product.jpg';
    },
    handleClick() {
      if (this.clickable) {
        this.$emit('click');
      }
    }
  }
};
