<template>
  <div class="admin-video">
    <h2>Configuración del Video Destacado</h2>
    <p class="description">
      Gestiona el video que se muestra en la página principal del sitio
    </p>

    <!-- Sección de previsualización -->
    <div class="video-preview-section">
      <h3>Vista Previa Actual</h3>
      <div class="video-wrapper">
        <iframe
          v-if="currentVideoUrl"
          :src="currentVideoUrl"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          title="Video destacado"
        ></iframe>
        <div v-else class="no-video">
          <p>No hay video configurado</p>
        </div>
      </div>
    </div>

    <!-- Formulario de edición -->
    <div class="form-section">
      <h3>Actualizar Video</h3>
      <form @submit.prevent="actualizarVideo" class="video-form">
        <div class="form-group">
          <label for="videoUrl">URL del Video (YouTube Embed):</label>
          <input
            id="videoUrl"
            type="text"
            v-model="newVideoUrl"
            placeholder="https://www.youtube.com/embed/..."
            required
          />
          <p class="help-text">
            💡 <strong>Cómo obtener la URL de embed:</strong><br>
            1. Ve al video en YouTube<br>
            2. Click derecho en el video → "Copiar código de inserción"<br>
            3. Copia la URL que aparece en <code>src="..."</code><br>
            O simplemente toma la URL del video y reemplaza <code>/watch?v=</code> por <code>/embed/</code>
          </p>
        </div>

        <div class="form-group">
          <label>
            <input
              type="checkbox"
              v-model="autoplay"
            />
            Reproducir automáticamente
          </label>
        </div>

        <div class="form-group">
          <label>
            <input
              type="checkbox"
              v-model="muted"
            />
            Silenciado por defecto
          </label>
        </div>

        <div class="form-group">
          <label>
            <input
              type="checkbox"
              v-model="loop"
            />
            Repetir en bucle
          </label>
        </div>

        <!-- Vista previa de la nueva URL -->
        <div v-if="previewUrl" class="preview-container">
          <h4>Vista Previa del Nuevo Video:</h4>
          <div class="video-wrapper">
            <iframe
              :src="previewUrl"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
              title="Vista previa"
            ></iframe>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
          <button 
            type="button" 
            class="btn btn-secondary" 
            @click="resetForm"
            :disabled="loading"
          >
            Cancelar
          </button>
        </div>

        <div v-if="message" :class="['message', messageType]">
          {{ message }}
        </div>
      </form>
    </div>
  </div>
</template>

<script src="./AdminVideo.js"></script>
<style src="./AdminVideo.css"></style>
