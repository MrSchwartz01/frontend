<template>
  <div class="admin-logs">
    <!-- Encabezado -->
    <div class="logs-header">
      <h2><FontAwesomeIcon :icon="['fas', 'clock-rotate-left']" /> Historial de Actividad</h2>
      <button class="btn-refresh" @click="loadLogs" :disabled="loading" title="Actualizar">
        <FontAwesomeIcon :icon="['fas', 'rotate-right']" :class="{ spinning: loading }" />
        Actualizar
      </button>
    </div>

    <!-- Tarjetas de estadísticas -->
    <div v-if="stats" class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon today"><FontAwesomeIcon :icon="['fas', 'calendar-day']" /></div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.totalHoy }}</span>
          <span class="stat-label">Acciones hoy</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon week"><FontAwesomeIcon :icon="['fas', 'calendar-week']" /></div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.totalSemana }}</span>
          <span class="stat-label">Últimos 7 días</span>
        </div>
      </div>
      <div class="stat-card last-users">
        <div class="stat-icon users"><FontAwesomeIcon :icon="['fas', 'users']" /></div>
        <div class="stat-info">
          <span class="stat-label">Últimos usuarios activos</span>
          <div v-if="stats.ultimosUsuarios?.length" class="last-users-list">
            <span
              v-for="u in stats.ultimosUsuarios"
              :key="u.usuario_username"
              class="user-badge"
              :title="`${u.usuario_nombre} — ${u.modulo}: ${u.descripcion}`"
            >
              <FontAwesomeIcon :icon="['fas', 'circle-user']" />
              {{ u.usuario_username }}
              <small>{{ u.usuario_rol }}</small>
            </span>
          </div>
          <span v-else class="stat-empty">Sin actividad reciente</span>
        </div>
      </div>
      <div class="stat-card modules-card">
        <div class="stat-icon modules"><FontAwesomeIcon :icon="['fas', 'layer-group']" /></div>
        <div class="stat-info">
          <span class="stat-label">Módulos más activos</span>
          <div class="modules-list">
            <span
              v-for="m in stats.porModulo"
              :key="m.modulo"
              class="module-badge"
              :class="'mod-' + m.modulo"
            >
              {{ m.modulo }} <strong>{{ m._count.id }}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="filters-bar">
      <div class="filter-group">
        <label>Módulo</label>
        <select v-model="filters.modulo" @change="resetPage">
          <option value="">Todos</option>
          <option v-for="m in modulosDisponibles" :key="m" :value="m">{{ m }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Acción</label>
        <select v-model="filters.accion" @change="resetPage">
          <option value="">Todas</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
          <option value="UPLOAD">UPLOAD</option>
          <option value="OTHER">OTHER</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Usuario</label>
        <input
          v-model="filters.usuario_username"
          placeholder="Buscar username..."
          @input="debouncedLoad"
          class="filter-input"
        />
      </div>
      <div class="filter-group">
        <label>Desde</label>
        <input type="datetime-local" v-model="filters.desde" @change="resetPage" class="filter-input" />
      </div>
      <div class="filter-group">
        <label>Hasta</label>
        <input type="datetime-local" v-model="filters.hasta" @change="resetPage" class="filter-input" />
      </div>
      <button class="btn-clear" @click="clearFilters" title="Limpiar filtros">
        <FontAwesomeIcon :icon="['fas', 'filter-circle-xmark']" /> Limpiar
      </button>
    </div>

    <!-- Estado de carga / error -->
    <div v-if="loading" class="logs-loading">
      <FontAwesomeIcon :icon="['fas', 'spinner']" spin /> Cargando historial...
    </div>

    <div v-else-if="errorMsg" class="logs-error">
      <FontAwesomeIcon :icon="['fas', 'triangle-exclamation']" /> {{ errorMsg }}
    </div>

    <!-- Tabla de logs -->
    <div v-else-if="logs.length" class="logs-table-wrapper">
      <table class="logs-table">
        <thead>
          <tr>
            <th>Fecha y hora</th>
            <th>Usuario</th>
            <th>Rol</th>
            <th>Módulo</th>
            <th>Acción</th>
            <th>Descripción</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="log in logs"
            :key="log.id"
            :class="['log-row', { 'row-error': !log.exitoso }]"
            @click="toggleDetail(log)"
          >
            <td class="col-fecha">
              <span class="fecha-date">{{ formatDate(log.fecha) }}</span>
              <span class="fecha-time">{{ formatTime(log.fecha) }}</span>
            </td>
            <td class="col-usuario">
              <span class="username">{{ log.usuario_username }}</span>
              <span class="nombre">{{ log.usuario_nombre }}</span>
            </td>
            <td>
              <span class="rol-badge" :class="'rol-' + log.usuario_rol">{{ log.usuario_rol }}</span>
            </td>
            <td>
              <span class="modulo-badge" :class="'mod-' + log.modulo">{{ log.modulo }}</span>
            </td>
            <td>
              <span class="accion-badge" :class="'accion-' + log.accion.toLowerCase()">{{ log.accion }}</span>
            </td>
            <td class="col-desc">{{ log.descripcion }}</td>
            <td>
              <FontAwesomeIcon
                :icon="log.exitoso ? ['fas', 'circle-check'] : ['fas', 'circle-xmark']"
                :class="log.exitoso ? 'icon-ok' : 'icon-fail'"
                :title="log.exitoso ? 'Exitoso' : log.error_detalle"
              />
            </td>
          </tr>

          <!-- Fila de detalle expandible -->
          <template v-for="log in logs" :key="'detail-' + log.id">
            <tr v-if="expandedId === log.id" class="detail-row">
              <td colspan="7">
                <div class="detail-content">
                  <div v-if="log.detalle" class="detail-json">
                    <strong>Detalle:</strong>
                    <pre>{{ JSON.stringify(log.detalle, null, 2) }}</pre>
                  </div>
                  <div v-if="log.ip_address" class="detail-meta">
                    <FontAwesomeIcon :icon="['fas', 'network-wired']" /> IP: {{ log.ip_address }}
                  </div>
                  <div v-if="!log.exitoso && log.error_detalle" class="detail-error">
                    <FontAwesomeIcon :icon="['fas', 'bug']" /> Error: {{ log.error_detalle }}
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>

      <!-- Paginación -->
      <div class="pagination">
        <span class="pagination-info">
          {{ (currentPage - 1) * pageLimit + 1 }}–{{ Math.min(currentPage * pageLimit, totalLogs) }}
          de {{ totalLogs }} registros
        </span>
        <div class="pagination-buttons">
          <button @click="goToPage(1)" :disabled="currentPage === 1">«</button>
          <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1">‹</button>
          <span class="page-indicator">Página {{ currentPage }} / {{ totalPages }}</span>
          <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages">›</button>
          <button @click="goToPage(totalPages)" :disabled="currentPage === totalPages">»</button>
        </div>
        <select v-model.number="pageLimit" @change="resetPage" class="page-size-select">
          <option :value="20">20 / pág</option>
          <option :value="50">50 / pág</option>
          <option :value="100">100 / pág</option>
        </select>
      </div>
    </div>

    <div v-else class="logs-empty">
      <FontAwesomeIcon :icon="['fas', 'inbox']" /> No hay registros con los filtros actuales.
    </div>
  </div>
</template>

<script>
import apiClient from '@/services/api';

export default {
  name: 'AdminLogs',
  data() {
    return {
      logs: [],
      stats: null,
      loading: false,
      errorMsg: '',
      expandedId: null,
      currentPage: 1,
      pageLimit: 50,
      totalLogs: 0,
      totalPages: 1,
      debounceTimer: null,
      filters: {
        modulo: '',
        accion: '',
        usuario_username: '',
        desde: '',
        hasta: '',
      },
      modulosDisponibles: [
        'productos',
        'promociones',
        'banners',
        'logo',
        'usuarios',
        'permisos',
        'garantias',
        'personalizacion',
        'video',
      ],
    };
  },

  mounted() {
    this.loadLogs();
    this.loadStats();
  },

  methods: {
    async loadLogs() {
      this.loading = true;
      this.errorMsg = '';
      try {
        const params = {
          page:  this.currentPage,
          limit: this.pageLimit,
        };
        if (this.filters.modulo)           params.modulo           = this.filters.modulo;
        if (this.filters.accion)           params.accion           = this.filters.accion;
        if (this.filters.usuario_username) params.usuario_username = this.filters.usuario_username;
        if (this.filters.desde)            params.desde            = new Date(this.filters.desde).toISOString();
        if (this.filters.hasta)            params.hasta            = new Date(this.filters.hasta).toISOString();

        const res = await apiClient.get('/audit-log', { params });
        this.logs       = res.data.data;
        this.totalLogs  = res.data.total;
        this.totalPages = res.data.totalPages;
      } catch (e) {
        this.errorMsg = e.response?.data?.message || 'Error al cargar el historial de actividad.';
      } finally {
        this.loading = false;
      }
    },

    async loadStats() {
      try {
        const res = await apiClient.get('/audit-log/stats');
        this.stats = res.data;
      } catch { /* silencioso */ }
    },

    debouncedLoad() {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.resetPage();
      }, 400);
    },

    resetPage() {
      this.currentPage = 1;
      this.loadLogs();
    },

    goToPage(page) {
      if (page < 1 || page > this.totalPages) return;
      this.currentPage = page;
      this.loadLogs();
    },

    clearFilters() {
      this.filters = { modulo: '', accion: '', usuario_username: '', desde: '', hasta: '' };
      this.resetPage();
    },

    toggleDetail(log) {
      this.expandedId = this.expandedId === log.id ? null : log.id;
    },

    formatDate(iso) {
      return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    },

    formatTime(iso) {
      return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    },
  },
};
</script>

<style scoped>
/* ===== Layout ===== */
.admin-logs { padding: 1rem; }

.logs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.2rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.logs-header h2 {
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
}

/* ===== Botón Actualizar ===== */
.btn-refresh {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.9rem;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.2s;
}
.btn-refresh:hover:not(:disabled) { background: #1d4ed8; }
.btn-refresh:disabled { opacity: 0.6; cursor: not-allowed; }
.spinning { animation: spin 0.8s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }

/* ===== Stats Grid ===== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.9rem;
  margin-bottom: 1.4rem;
}

.stat-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  box-shadow: 0 1px 4px rgba(0,0,0,.06);
}

.last-users, .modules-card { grid-column: span 2; }

.stat-icon {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
}
.stat-icon.today   { background: #dbeafe; color: #2563eb; }
.stat-icon.week    { background: #d1fae5; color: #059669; }
.stat-icon.users   { background: #ede9fe; color: #7c3aed; }
.stat-icon.modules { background: #fef3c7; color: #d97706; }

.stat-info { display: flex; flex-direction: column; gap: 0.2rem; overflow: hidden; }

.stat-value {
  font-size: 1.6rem;
  font-weight: 700;
  line-height: 1;
  color: #111827;
}

.stat-label { font-size: 0.78rem; color: #6b7280; }
.stat-empty { font-size: 0.8rem; color: #9ca3af; font-style: italic; }

.last-users-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.3rem;
}

.user-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: #ede9fe;
  color: #5b21b6;
  border-radius: 20px;
  padding: 0.2rem 0.6rem;
  font-size: 0.78rem;
  cursor: default;
}
.user-badge small { color: #7c3aed; opacity: 0.8; }

.modules-list { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.3rem; }

.module-badge {
  border-radius: 20px;
  padding: 0.2rem 0.6rem;
  font-size: 0.75rem;
  background: #fef3c7;
  color: #92400e;
}

/* ===== Filtros ===== */
.filters-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
  align-items: flex-end;
  margin-bottom: 1rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.8rem 1rem;
}

.filter-group { display: flex; flex-direction: column; gap: 0.25rem; }

.filter-group label { font-size: 0.75rem; color: #6b7280; font-weight: 600; }

.filter-group select,
.filter-input {
  padding: 0.35rem 0.6rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.82rem;
  background: #fff;
  min-width: 130px;
}

.btn-clear {
  padding: 0.35rem 0.8rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.82rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: #374151;
  transition: background 0.15s;
  align-self: flex-end;
}
.btn-clear:hover { background: #e5e7eb; }

/* ===== Estados ===== */
.logs-loading, .logs-empty, .logs-error {
  text-align: center;
  padding: 2.5rem;
  color: #6b7280;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
.logs-error { color: #dc2626; }

/* ===== Tabla ===== */
.logs-table-wrapper { overflow-x: auto; border-radius: 8px; border: 1px solid #e5e7eb; }

.logs-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.83rem;
}

.logs-table thead {
  background: #f3f4f6;
  position: sticky;
  top: 0;
  z-index: 1;
}

.logs-table th {
  padding: 0.65rem 0.8rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
  white-space: nowrap;
}

.logs-table td {
  padding: 0.55rem 0.8rem;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}

.log-row { cursor: pointer; transition: background 0.12s; }
.log-row:hover { background: #f0f9ff; }
.log-row.row-error { background: #fff5f5; }
.log-row.row-error:hover { background: #fed7d7; }

/* ===== Columnas especiales ===== */
.col-fecha { white-space: nowrap; }
.fecha-date { display: block; font-weight: 500; color: #111827; }
.fecha-time { display: block; font-size: 0.75rem; color: #6b7280; }

.col-usuario { white-space: nowrap; }
.username { display: block; font-weight: 600; color: #1d4ed8; }
.nombre  { display: block; font-size: 0.75rem; color: #6b7280; }

.col-desc { max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ===== Badges ===== */
.rol-badge, .modulo-badge, .accion-badge {
  display: inline-block;
  border-radius: 20px;
  padding: 0.15rem 0.55rem;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  white-space: nowrap;
}

/* Roles */
.rol-administrador { background: #dbeafe; color: #1e40af; }
.rol-vendedor       { background: #d1fae5; color: #065f46; }
.rol-tecnico        { background: #fef3c7; color: #78350f; }

/* Módulos */
.mod-productos     { background: #ede9fe; color: #5b21b6; }
.mod-promociones   { background: #fce7f3; color: #831843; }
.mod-banners       { background: #dbeafe; color: #1e40af; }
.mod-logo          { background: #fef9c3; color: #713f12; }
.mod-usuarios      { background: #dcfce7; color: #14532d; }
.mod-permisos      { background: #fee2e2; color: #7f1d1d; }
.mod-garantias     { background: #e0f2fe; color: #075985; }
.mod-personalizacion { background: #f3e8ff; color: #581c87; }
.mod-video         { background: #fef08a; color: #713f12; }

/* Acciones */
.accion-create { background: #dcfce7; color: #14532d; }
.accion-update { background: #dbeafe; color: #1e40af; }
.accion-delete { background: #fee2e2; color: #7f1d1d; }
.accion-upload { background: #fef3c7; color: #78350f; }
.accion-other  { background: #f3f4f6; color: #374151; }

/* Íconos de estado */
.icon-ok   { color: #16a34a; font-size: 1rem; }
.icon-fail { color: #dc2626; font-size: 1rem; }

/* ===== Detalle expandible ===== */
.detail-row td { background: #f8fafc; padding: 0; }

.detail-content {
  padding: 0.8rem 1.2rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
}

.detail-json pre {
  background: #1e293b;
  color: #e2e8f0;
  border-radius: 6px;
  padding: 0.7rem;
  font-size: 0.75rem;
  max-height: 180px;
  overflow: auto;
  margin: 0.3rem 0 0;
}

.detail-meta, .detail-error {
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #374151;
}
.detail-error { color: #dc2626; }

/* ===== Paginación ===== */
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.7rem 1rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
}

.pagination-info { font-size: 0.8rem; color: #6b7280; }

.pagination-buttons {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.pagination-buttons button {
  padding: 0.3rem 0.6rem;
  border: 1px solid #d1d5db;
  border-radius: 5px;
  background: #fff;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.15s;
}
.pagination-buttons button:hover:not(:disabled) { background: #e5e7eb; }
.pagination-buttons button:disabled { opacity: 0.4; cursor: not-allowed; }

.page-indicator { font-size: 0.82rem; color: #374151; padding: 0 0.3rem; white-space: nowrap; }

.page-size-select {
  padding: 0.3rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 5px;
  font-size: 0.8rem;
  background: #fff;
}

/* ===== Responsive ===== */
@media (max-width: 768px) {
  .last-users, .modules-card { grid-column: span 1; }
  .logs-table { font-size: 0.75rem; }
  .col-desc { max-width: 160px; }
}
</style>
