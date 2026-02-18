import apiClient from '@/services/api';

export default {
  name: 'AdminVideo',
  data() {
    return {
      currentVideoUrl: '',
      newVideoUrl: '',
      autoplay: true,
      muted: true,
      loop: true,
      loading: false,
      message: '',
      messageType: '',
    };
  },
  computed: {
    previewUrl() {
      if (!this.newVideoUrl) return '';
      
      try {
        const url = new URL(this.newVideoUrl);
        const params = new URLSearchParams(url.search);
        
        // Agregar parámetros según las opciones seleccionadas
        if (this.autoplay) {
          params.set('autoplay', '1');
        } else {
          params.delete('autoplay');
        }
        
        if (this.muted) {
          params.set('mute', '1');
        } else {
          params.delete('mute');
        }
        
        if (this.loop) {
          params.set('loop', '1');
          // Para YouTube, el loop requiere el parámetro playlist
          const videoId = this.extractVideoId(this.newVideoUrl);
          if (videoId) {
            params.set('playlist', videoId);
          }
        } else {
          params.delete('loop');
          params.delete('playlist');
        }
        
        url.search = params.toString();
        return url.toString();
      } catch (e) {
        return this.newVideoUrl;
      }
    }
  },
  async mounted() {
    await this.cargarVideoActual();
  },
  methods: {
    async cargarVideoActual() {
      try {
        const response = await apiClient.get('/configuracion/video-destacado/url');
        this.currentVideoUrl = response.data.valor || '';
        this.newVideoUrl = this.extractBaseUrl(this.currentVideoUrl);
        this.parseUrlParameters(this.currentVideoUrl);
      } catch (error) {
        console.error('Error al cargar el video actual:', error);
        this.showMessage('Error al cargar el video actual', 'error');
      }
    },

    extractBaseUrl(url) {
      try {
        const urlObj = new URL(url);
        return `${urlObj.origin}${urlObj.pathname}`;
      } catch (e) {
        return url;
      }
    },

    parseUrlParameters(url) {
      try {
        const urlObj = new URL(url);
        const params = new URLSearchParams(urlObj.search);
        
        this.autoplay = params.get('autoplay') === '1';
        this.muted = params.get('mute') === '1';
        this.loop = params.get('loop') === '1';
      } catch (e) {
        // Usar valores por defecto si hay error
        this.autoplay = true;
        this.muted = true;
        this.loop = true;
      }
    },

    extractVideoId(url) {
      try {
        // Extraer ID del video de YouTube desde URL de embed
        const match = url.match(/\/embed\/([^?&]+)/);
        return match ? match[1] : null;
      } catch (e) {
        return null;
      }
    },

    async actualizarVideo() {
      if (!this.newVideoUrl) {
        this.showMessage('Por favor, ingresa una URL válida', 'error');
        return;
      }

      // Validar que sea una URL de YouTube embed
      if (!this.newVideoUrl.includes('youtube.com/embed/')) {
        this.showMessage('La URL debe ser del formato: https://www.youtube.com/embed/VIDEO_ID', 'error');
        return;
      }

      this.loading = true;
      this.message = '';

      try {
        const videoUrlFinal = this.previewUrl;
        
        await apiClient.post('/configuracion/video-destacado/url', {
          videoUrl: videoUrlFinal
        });

        this.currentVideoUrl = videoUrlFinal;
        this.showMessage('Video actualizado exitosamente', 'success');
        
        // Limpiar el mensaje después de 3 segundos
        setTimeout(() => {
          this.message = '';
        }, 3000);
      } catch (error) {
        console.error('Error al actualizar el video:', error);
        const errorMessage = error.response?.data?.message || 'Error al actualizar el video';
        this.showMessage(errorMessage, 'error');
      } finally {
        this.loading = false;
      }
    },

    resetForm() {
      this.newVideoUrl = this.extractBaseUrl(this.currentVideoUrl);
      this.parseUrlParameters(this.currentVideoUrl);
      this.message = '';
    },

    showMessage(text, type) {
      this.message = text;
      this.messageType = type;
    }
  }
};
