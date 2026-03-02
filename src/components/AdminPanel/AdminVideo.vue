<template>
  <div class="admin-video">
    <h2><FontAwesomeIcon :icon="['fas', 'video']" /> Playlist de Videos</h2>
    <p class="description">
      Gestiona la lista de videos que se reproducen en la página principal. Los videos se mostrarán en orden y avanzarán automáticamente.
    </p>

    <div class="video-layout">
      <!-- Columna izquierda: Formulario -->
      <div class="video-form-col">
        <div class="form-section">
          <h3>{{ editingId ? 'Editar Video' : 'Agregar Video' }}</h3>
          <form @submit.prevent="submitVideo" class="video-form">
            <div class="form-group">
              <label>Título del Video:</label>
              <input
                type="text"
                v-model="form.titulo"
                placeholder="Ej: Laptop Gaming RTX 4090"
                required
              />
            </div>

            <div class="form-group">
              <label>URL de Embed (YouTube):</label>
              <input
                type="text"
                v-model="form.url"
                placeholder="https://www.youtube.com/embed/VIDEO_ID"
                required
                @input="previewDirty = true"
              />
              <div class="help-text">
                <strong>Cómo obtener la URL de embed:</strong><br>
                1. Ve al video en YouTube<br>
                2. Click en <em>Compartir → Insertar</em><br>
                3. Copia la URL del atributo <code>src="..."</code><br>
                — o reemplaza <code>watch?v=ID</code> por <code>embed/ID</code>
              </div>
            </div>

            <div class="form-group">
              <label>Duración en pantalla (segundos):</label>
              <div class="duration-input">
                <input
                  type="number"
                  v-model.number="form.duracion_segundos"
                  min="5"
                  max="300"
                  required
                />
                <span class="duration-hint">segundos antes de avanzar al siguiente</span>
              </div>
            </div>

            <!-- Preview -->
            <div v-if="form.url" class="preview-mini">
              <div class="preview-header">
                <span>Vista Previa</span>
                <button type="button" class="btn-refresh-preview" @click="refreshPreview" title="Actualizar vista previa">
                  <FontAwesomeIcon :icon="['fas', 'arrows-rotate']" />
                </button>
              </div>
              <div class="video-wrapper-mini">
                <iframe
                  v-if="previewUrl"
                  :src="previewUrl"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen
                  title="Vista previa"
                ></iframe>
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="saving">
                <FontAwesomeIcon :icon="['fas', editingId ? 'pencil' : 'video']" />
                {{ editingId ? 'Actualizar Video' : 'Agregar a la Lista' }}
              </button>
              <button
                v-if="editingId"
                type="button"
                class="btn btn-secondary"
                @click="cancelEdit"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Columna derecha: Lista -->
      <div class="video-list-col">
        <div class="playlist-section">
          <div class="playlist-header">
            <h3><FontAwesomeIcon :icon="['fas', 'video']" /> Lista de Videos ({{ playlist.length }})</h3>
            <button
              class="btn btn-save"
              @click="guardarPlaylist"
              :disabled="saving || playlist.length === 0"
            >
              <FontAwesomeIcon :icon="['fas', 'gear']" />
              {{ saving ? 'Guardando...' : 'Guardar Orden' }}
            </button>
          </div>

          <div v-if="loading" class="playlist-loading">
            <div class="spinner-small"></div> Cargando playlist...
          </div>

          <div v-else-if="playlist.length === 0" class="playlist-empty">
            <FontAwesomeIcon :icon="['fas', 'video']" class="empty-icon" />
            <p>No hay videos en la lista. Agrega el primero.</p>
          </div>

          <transition-group v-else name="list" tag="ul" class="playlist-list">
            <li
              v-for="(video, index) in playlist"
              :key="video.id"
              :class="['playlist-item', { 'is-active': previewingId === video.id }]"
            >
              <span class="item-order">{{ index + 1 }}</span>

              <div class="item-info">
                <span class="item-titulo">{{ video.titulo }}</span>
                <span class="item-meta">
                  <FontAwesomeIcon :icon="['far', 'eye']" /> {{ video.duracion_segundos }}s
                  &nbsp;·&nbsp;
                  <span class="item-url-short">{{ shortUrl(video.url) }}</span>
                </span>
              </div>

              <div class="item-actions">
                <button
                  type="button"
                  class="btn-icon-sm"
                  title="Vista previa"
                  @click="previewVideo(video)"
                >
                  <FontAwesomeIcon :icon="['far', 'eye']" />
                </button>
                <button
                  type="button"
                  class="btn-icon-sm"
                  title="Editar"
                  @click="editVideo(video)"
                >
                  <FontAwesomeIcon :icon="['fas', 'pencil']" />
                </button>
                <button
                  type="button"
                  class="btn-icon-sm btn-up"
                  title="Subir"
                  :disabled="index === 0"
                  @click="moveUp(index)"
                >
                  ↑
                </button>
                <button
                  type="button"
                  class="btn-icon-sm btn-down"
                  title="Bajar"
                  :disabled="index === playlist.length - 1"
                  @click="moveDown(index)"
                >
                  ↓
                </button>
                <button
                  type="button"
                  class="btn-icon-sm btn-delete"
                  title="Eliminar"
                  @click="removeVideo(index)"
                >
                  <FontAwesomeIcon :icon="['fas', 'trash']" />
                </button>
              </div>
            </li>
          </transition-group>

          <!-- Preview del item seleccionado -->
          <div v-if="previewingVideo" class="selected-preview">
            <div class="selected-preview-header">
              <span>{{ previewingVideo.titulo }}</span>
              <button type="button" class="btn-icon-sm btn-delete" @click="previewingId = null" title="Cerrar">
                ✕
              </button>
            </div>
            <div class="video-wrapper">
              <iframe
                :src="buildEmbedUrl(previewingVideo.url)"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mensaje global -->
    <transition name="fade">
      <div v-if="message" :class="['message', messageType]">
        {{ message }}
      </div>
    </transition>
  </div>
</template>

<script src="./AdminVideo.js"></script>
<style src="./AdminVideo.css"></style>
