import apiClient from '@/services/api';

export default {
  name: 'AdminVideo',
  data() {
    return {
      // Playlist
      playlist: [],
      loading: false,
      saving: false,

      // Formulario de agregar / editar
      editingId: null,
      form: {
        titulo: '',
        url: '',
        duracion_segundos: 30,
      },
      previewDirty: false,
      previewUrl: '',

      // Preview del item de la lista
      previewingId: null,

      // Mensaje global
      message: '',
      messageType: '',
    };
  },

  computed: {
    previewingVideo() {
      if (!this.previewingId) return null;
      return this.playlist.find((v) => v.id === this.previewingId) || null;
    },
  },

  async mounted() {
    await this.cargarPlaylist();
  },

  methods: {
    // ===== CARGA =====
    async cargarPlaylist() {
      this.loading = true;
      try {
        const res = await apiClient.get('/configuracion/video-playlist');
        this.playlist = res.data.valor || [];
      } catch (err) {
        console.error('Error al cargar playlist:', err);
        this.showMessage('Error al cargar la lista de videos', 'error');
      } finally {
        this.loading = false;
      }
    },

    // ===== FORMULARIO =====
    submitVideo() {
      if (!this.form.url.includes('youtube.com/embed/')) {
        this.showMessage('La URL debe ser del formato: https://www.youtube.com/embed/VIDEO_ID', 'error');
        return;
      }

      if (this.editingId) {
        const idx = this.playlist.findIndex((v) => v.id === this.editingId);
        if (idx !== -1) {
          this.playlist[idx] = {
            ...this.playlist[idx],
            titulo: this.form.titulo,
            url: this.cleanEmbedUrl(this.form.url),
            duracion_segundos: this.form.duracion_segundos,
          };
        }
        this.cancelEdit();
      } else {
        this.playlist.push({
          id: String(Date.now()),
          titulo: this.form.titulo,
          url: this.cleanEmbedUrl(this.form.url),
          duracion_segundos: this.form.duracion_segundos,
        });
        this.resetForm();
      }

      this.showMessage('Video agregado a la lista. Pulsa "Guardar Orden" para confirmar.', 'success');
    },

    editVideo(video) {
      this.editingId = video.id;
      this.form = {
        titulo: video.titulo,
        url: video.url,
        duracion_segundos: video.duracion_segundos,
      };
      this.refreshPreview();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    cancelEdit() {
      this.editingId = null;
      this.resetForm();
    },

    resetForm() {
      this.form = { titulo: '', url: '', duracion_segundos: 30 };
      this.previewUrl = '';
      this.previewDirty = false;
    },

    // ===== LISTA =====
    removeVideo(index) {
      const titulo = this.playlist[index].titulo;
      if (!confirm(`¿Eliminar "${titulo}" de la lista?`)) return;
      const removed = this.playlist[index];
      this.playlist.splice(index, 1);
      if (this.previewingId === removed.id) this.previewingId = null;
      this.showMessage('Video eliminado. Pulsa "Guardar Orden" para confirmar.', 'success');
    },

    moveUp(index) {
      if (index === 0) return;
      const tmp = this.playlist[index - 1];
      this.playlist.splice(index - 1, 1, this.playlist[index]);
      this.playlist.splice(index, 1, tmp);
    },

    moveDown(index) {
      if (index === this.playlist.length - 1) return;
      const tmp = this.playlist[index + 1];
      this.playlist.splice(index + 1, 1, this.playlist[index]);
      this.playlist.splice(index, 1, tmp);
    },

    // ===== PREVIEW =====
    previewVideo(video) {
      this.previewingId = this.previewingId === video.id ? null : video.id;
    },

    refreshPreview() {
      if (!this.form.url) return;
      this.previewUrl = this.buildEmbedUrl(this.form.url);
      this.previewDirty = false;
    },

    buildEmbedUrl(baseUrl) {
      try {
        const url = new URL(baseUrl);
        url.searchParams.set('autoplay', '1');
        url.searchParams.set('mute', '1');
        const videoId = baseUrl.match(/\/embed\/([^?&]+)/)?.[1];
        if (videoId) {
          url.searchParams.set('playlist', videoId);
        }
        return url.toString();
      } catch {
        return baseUrl;
      }
    },

    cleanEmbedUrl(url) {
      try {
        const u = new URL(url);
        return `${u.origin}${u.pathname}`;
      } catch {
        return url;
      }
    },

    shortUrl(url) {
      const match = url.match(/\/embed\/([^?&]{4,12})/);
      return match ? match[1] : url.slice(0, 28) + '…';
    },

    // ===== GUARDAR =====
    async guardarPlaylist() {
      if (this.playlist.length === 0) {
        this.showMessage('La lista está vacía', 'error');
        return;
      }
      this.saving = true;
      try {
        await apiClient.post(
          '/configuracion/video-playlist',
          { videos: this.playlist },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('access_token')}`,
            },
          }
        );
        this.showMessage('¡Playlist guardada exitosamente!', 'success');
      } catch (err) {
        console.error('Error al guardar playlist:', err);
        this.showMessage('Error al guardar la playlist', 'error');
      } finally {
        this.saving = false;
      }
    },

    // ===== MENSAJES =====
    showMessage(text, type) {
      this.message = text;
      this.messageType = type;
      setTimeout(() => { this.message = ''; }, 4000);
    },
  },
};
