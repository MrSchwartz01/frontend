<template>
  <div class="admin-metricas">
    <div class="metricas-header">
      <h2>📊 Métricas de Visitas</h2>
      <div class="periodo-selector">
        <label>Período:</label>
        <select v-model="periodoSeleccionado" @change="loadAllMetrics">
          <option value="7dias">Últimos 7 días</option>
          <option value="30dias">Últimos 30 días</option>
          <option value="3meses">Últimos 3 meses</option>
          <option value="año">Último año</option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Cargando métricas...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p>❌ {{ error }}</p>
      <button @click="loadAllMetrics" class="btn-retry">Reintentar</button>
    </div>

    <!-- Stats Overview -->
    <div v-else class="metricas-content">
      <!-- Cards de Resumen -->
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon">👁️</div>
          <div class="stat-info">
            <h3>{{ overview.totalPageViews?.toLocaleString() || 0 }}</h3>
            <p>Visitas a Páginas</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-info">
            <h3>{{ overview.uniqueVisitors?.toLocaleString() || 0 }}</h3>
            <p>Visitantes Únicos</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🛍️</div>
          <div class="stat-info">
            <h3>{{ overview.totalProductViews?.toLocaleString() || 0 }}</h3>
            <p>Productos Vistos</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🏷️</div>
          <div class="stat-info">
            <h3>{{ overview.totalBrandViews?.toLocaleString() || 0 }}</h3>
            <p>Marcas Vistas</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⚡</div>
          <div class="stat-info">
            <h3>{{ overview.totalInteractions?.toLocaleString() || 0 }}</h3>
            <p>Interacciones Totales</p>
          </div>
        </div>
      </div>

      <!-- Gráfico de Visitas por Fecha -->
      <div class="chart-section" v-if="pageViewsStats.viewsByDate">
        <h3>📈 Visitas por Día</h3>
        <div class="simple-chart">
          <div 
            v-for="(visita, index) in pageViewsStats.viewsByDate.visitas" 
            :key="index"
            class="chart-bar"
            :style="{ height: getBarHeight(visita, Math.max(...pageViewsStats.viewsByDate.visitas)) + '%' }"
            :title="`${pageViewsStats.viewsByDate.labels[index]}: ${visita} visitas`"
          >
            <span class="bar-value">{{ visita }}</span>
          </div>
        </div>
        <div class="chart-labels">
          <span 
            v-for="(label, index) in pageViewsStats.viewsByDate.labels" 
            :key="index"
            class="chart-label"
          >
            {{ label }}
          </span>
        </div>
      </div>

      <!-- Top Páginas Visitadas -->
      <div class="table-section" v-if="pageViewsStats.topPages && pageViewsStats.topPages.length > 0">
        <h3>🌐 Páginas Más Visitadas</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Ruta</th>
              <th>Visitas</th>
              <th>Porcentaje</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(page, index) in pageViewsStats.topPages" :key="index">
              <td>{{ index + 1 }}</td>
              <td class="ruta-cell">{{ page.ruta }}</td>
              <td><strong>{{ page.visitas.toLocaleString() }}</strong></td>
              <td>
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :style="{ width: getPercentage(page.visitas, pageViewsStats.totalViews) + '%' }"
                  ></div>
                  <span class="progress-text">{{ getPercentage(page.visitas, pageViewsStats.totalViews).toFixed(1) }}%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Top Productos Vistos -->
      <div class="table-section" v-if="productViewsStats.topProducts && productViewsStats.topProducts.length > 0">
        <h3>🛍️ Productos Más Vistos</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>ID</th>
              <th>Nombre del Producto</th>
              <th>Visitas</th>
              <th>Porcentaje</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(producto, index) in productViewsStats.topProducts" :key="index">
              <td>{{ index + 1 }}</td>
              <td>{{ producto.producto_id }}</td>
              <td class="producto-cell">{{ producto.producto_nombre }}</td>
              <td><strong>{{ producto.visitas.toLocaleString() }}</strong></td>
              <td>
                <div class="progress-bar">
                  <div 
                    class="progress-fill product" 
                    :style="{ width: getPercentage(producto.visitas, productViewsStats.totalViews) + '%' }"
                  ></div>
                  <span class="progress-text">{{ getPercentage(producto.visitas, productViewsStats.totalViews).toFixed(1) }}%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Top Marcas Vistas -->
      <div class="table-section" v-if="brandViewsStats.topBrands && brandViewsStats.topBrands.length > 0">
        <h3>🏷️ Marcas Más Vistas</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Marca</th>
              <th>Visitas</th>
              <th>Porcentaje</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(marca, index) in brandViewsStats.topBrands" :key="index">
              <td>{{ index + 1 }}</td>
              <td class="marca-cell">{{ marca.marca }}</td>
              <td><strong>{{ marca.visitas.toLocaleString() }}</strong></td>
              <td>
                <div class="progress-bar">
                  <div 
                    class="progress-fill brand" 
                    :style="{ width: getPercentage(marca.visitas, brandViewsStats.totalViews) + '%' }"
                  ></div>
                  <span class="progress-text">{{ getPercentage(marca.visitas, brandViewsStats.totalViews).toFixed(1) }}%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-if="!hasData" class="empty-state">
        <p>📊 No hay datos de métricas disponibles para el período seleccionado.</p>
      </div>
    </div>
  </div>
</template>

<script>
import analyticsService from '@/services/analytics';

export default {
  name: 'AdminMetricas',
  data() {
    return {
      periodoSeleccionado: '30dias',
      loading: false,
      error: null,
      overview: {},
      pageViewsStats: {},
      productViewsStats: {},
      brandViewsStats: {},
    };
  },
  computed: {
    hasData() {
      return (
        this.overview.totalPageViews > 0 ||
        this.productViewsStats.topProducts?.length > 0 ||
        this.brandViewsStats.topBrands?.length > 0
      );
    },
  },
  mounted() {
    this.loadAllMetrics();
  },
  methods: {
    async loadAllMetrics() {
      this.loading = true;
      this.error = null;

      try {
        // Cargar todas las métricas en paralelo
        const [overview, pageViews, productViews, brandViews] = await Promise.all([
          analyticsService.getVisitorsOverview(this.periodoSeleccionado),
          analyticsService.getPageViewsStats(this.periodoSeleccionado),
          analyticsService.getProductViewsStats(this.periodoSeleccionado, 20),
          analyticsService.getBrandViewsStats(this.periodoSeleccionado, 20),
        ]);

        this.overview = overview;
        this.pageViewsStats = pageViews;
        this.productViewsStats = productViews;
        this.brandViewsStats = brandViews;
      } catch (err) {
        console.error('Error cargando métricas:', err);
        this.error = 'Error al cargar las métricas. Por favor, intenta de nuevo.';
      } finally {
        this.loading = false;
      }
    },

    getBarHeight(value, max) {
      if (max === 0) return 0;
      return (value / max) * 100;
    },

    getPercentage(value, total) {
      if (total === 0) return 0;
      return (value / total) * 100;
    },
  },
};
</script>

<style scoped>
.admin-metricas {
  padding: 20px;
}

.metricas-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 15px;
}

.metricas-header h2 {
  margin: 0;
  color: #2c3e50;
}

.periodo-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.periodo-selector label {
  font-weight: 600;
  color: #555;
}

.periodo-selector select {
  padding: 8px 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
  cursor: pointer;
  background-color: white;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #666;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Error State */
.error-state {
  text-align: center;
  padding: 40px 20px;
  color: #e74c3c;
}

.btn-retry {
  padding: 10px 20px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  margin-top: 10px;
}

.btn-retry:hover {
  background-color: #2980b9;
}

/* Stats Cards */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 15px;
  color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-3px);
}

.stat-card:nth-child(2) {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-card:nth-child(3) {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-card:nth-child(4) {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-card:nth-child(5) {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.stat-icon {
  font-size: 40px;
}

.stat-info h3 {
  margin: 0 0 5px 0;
  font-size: 28px;
  font-weight: bold;
}

.stat-info p {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

/* Chart Section */
.chart-section {
  background: white;
  padding: 25px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.chart-section h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #2c3e50;
}

.simple-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 200px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 5px;
  gap: 5px;
}

.chart-bar {
  flex: 1;
  background: linear-gradient(to top, #3498db, #5dade2);
  border-radius: 5px 5px 0 0;
  min-height: 10px;
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  transition: all 0.3s ease;
  cursor: pointer;
}

.chart-bar:hover {
  background: linear-gradient(to top, #2980b9, #3498db);
}

.bar-value {
  font-size: 11px;
  font-weight: bold;
  color: white;
  padding: 3px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.chart-labels {
  display: flex;
  justify-content: space-around;
  margin-top: 10px;
  gap: 5px;
}

.chart-label {
  flex: 1;
  text-align: center;
  font-size: 12px;
  color: #666;
}

/* Table Section */
.table-section {
  background: white;
  padding: 25px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.table-section h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #2c3e50;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background-color: #f8f9fa;
}

.data-table th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #555;
  border-bottom: 2px solid #dee2e6;
}

.data-table td {
  padding: 12px;
  border-bottom: 1px solid #dee2e6;
}

.data-table tbody tr:hover {
  background-color: #f8f9fa;
}

.ruta-cell, .producto-cell, .marca-cell {
  font-family: monospace;
  color: #495057;
}

.progress-bar {
  position: relative;
  width: 100%;
  height: 25px;
  background-color: #e9ecef;
  border-radius: 5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.progress-fill.product {
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
}

.progress-fill.brand {
  background: linear-gradient(90deg, #43e97b 0%, #38f9d7 100%);
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  font-weight: bold;
  color: #2c3e50;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 16px;
}

/* Responsive */
@media (max-width: 768px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }

  .metricas-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .chart-label {
    font-size: 10px;
  }

  .data-table {
    font-size: 14px;
  }

  .data-table th,
  .data-table td {
    padding: 8px;
  }
}
</style>
