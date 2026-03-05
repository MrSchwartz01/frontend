<template>
  <div class="admin-panel">
    <div class="panel-header">
      <button class="back-button" @click="goToHome" title="Volver al Inicio">
        ← Volver al Inicio
      </button>
      <h1>Panel de Administración</h1>
      <div class="spacer"></div>
      <!-- Campana de notificaciones -->
      <NotificationsBell v-if="isAuthenticated" />
    </div>

    <div class="panel-body">
      <!-- Sidebar de navegación compacto -->
      <nav class="sidebar-nav">
        <button
          v-for="tab in visibleTabs"
          :key="tab.id"
          :class="['nav-item', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
          :title="tab.label"
        >
          <span class="nav-icon"><FontAwesomeIcon :icon="tab.icon" /></span>
          <span class="nav-label">{{ tab.label }}</span>
        </button>
      </nav>

      <div class="tab-content">
      <!-- Tab de Notificaciones -->
      <div v-if="activeTab === 'notificaciones'" class="tab-panel">
        <NotificationsPanel />
      </div>

      <!-- Tab de Actividad (Audit Log) -->
      <div v-if="activeTab === 'actividad'" class="tab-panel">
        <AdminLogs />
      </div>

      <!-- Tab de Productos -->
      <div v-if="activeTab === 'productos'" class="tab-panel">
        <AdminProductos />
      </div>

      <!-- Tab de Garantías -->
      <div v-if="activeTab === 'garantias'" class="tab-panel">
        <AdminGarantias />
      </div>
      
      <!-- Tab de Promociones -->
      <div v-if="activeTab === 'promociones'" class="tab-panel">
        <h2>Gestión de Promociones</h2>
        
        <!-- Alerta para vendedores -->
        <div v-if="isVendedor && !permisosVendedor.promociones" class="info-message">
          ℹ️ <strong>Modo Solo Lectura:</strong> Como vendedor, puedes visualizar las promociones pero no crear, editar o eliminar.
        </div>
        <div v-if="isVendedor && permisosVendedor.promociones" class="info-message success">
          ✅ <strong>Permiso Temporal Activo:</strong> Tienes acceso para gestionar promociones.
        </div>
        
        <div v-if="puedeEditarPromocion()" class="form-section">
          <h3>{{ editingPromotion ? 'Editar Promoción' : 'Nueva Promoción' }}</h3>
          <form @submit.prevent="submitPromotion" class="promotion-form">
            <div class="form-group">
              <label>Producto:</label>
              <div class="product-search-container">
                <input 
                  type="text" 
                  v-model="busquedaProductoPromocion" 
                  placeholder="Buscar por código o nombre..."
                  class="search-input"
                  @focus="mostrarListaProductosPromo = true"
                />
                <div class="select-with-close">
                  <select 
                    v-model="promotionForm.producto_id" 
                    required 
                    @focus="mostrarListaProductosPromo = true"
                    @blur="cerrarSelectorPromocionDespuesDeDelay"
                    @change="cerrarSelectorPromocion"
                    :size="mostrarListaProductosPromo ? 8 : 1"
                  >
                    <option value="">Seleccione un producto</option>
                    <option 
                      v-for="producto in productosFiltradosPromocion" 
                      :key="producto.codigo" 
                      :value="producto.codigo"
                    >
                      [{{ producto.codigo }}] {{ producto.producto }} - ${{ producto.precioUnitario?.precioA || producto.costoTotal || 0 }}
                    </option>
                  </select>
                  <button 
                    v-if="mostrarListaProductosPromo" 
                    type="button" 
                    class="btn-close-selector"
                    @click="cerrarSelectorPromocion"
                    title="Cerrar selector"
                  >
                    ✕
                  </button>
                </div>
                <small class="helper-text">
                  {{ productosFiltradosPromocion.length }} productos encontrados
                </small>
              </div>
            </div>

            <div class="form-group">
              <label>Porcentaje de Descuento (%):</label>
              <input
                type="number"
                v-model.number="promotionForm.porcentaje_descuento"
                min="0"
                max="100"
                step="0.01"
                required
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Fecha Inicio:</label>
                <input
                  type="datetime-local"
                  v-model="promotionForm.fecha_inicio"
                  required
                />
              </div>

              <div class="form-group">
                <label>Fecha Fin:</label>
                <input
                  type="datetime-local"
                  v-model="promotionForm.fecha_fin"
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label>
                <input type="checkbox" v-model="promotionForm.activa" />
                Promoción Activa
              </label>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary">
                {{ editingPromotion ? 'Actualizar' : 'Crear' }} Promoción
              </button>
              <button
                v-if="editingPromotion"
                type="button"
                class="btn btn-secondary"
                @click="cancelEditPromotion"
              >
                Cancelar
              </button>
            </div>

            <div v-if="promotionMessage" :class="['message', promotionMessageType]">
              {{ promotionMessage }}
            </div>
          </form>
        </div>

        <div class="promotions-list">
          <h3>Promociones Existentes</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Producto</th>
                <th>Descuento</th>
                <th>Precio Original</th>
                <th>Precio con Descuento</th>
                <th>Fecha Inicio</th>
                <th>Fecha Fin</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="promo in promociones" :key="promo.id">
                <td>{{ promo.id }}</td>
                <td>{{ promo.producto?.producto }}</td>
                <td>{{ promo.porcentaje_descuento }}%</td>
                <td>${{ promo.producto?.costoTotal || 0 }}</td>
                <td>${{ calcularPrecioConDescuento(promo.producto?.costoTotal || 0, promo.porcentaje_descuento) }}</td>
                <td>{{ formatDate(promo.fecha_inicio) }}</td>
                <td>{{ formatDate(promo.fecha_fin) }}</td>
                <td>
                  <span :class="['status-badge', promo.activa ? 'active' : 'inactive']">
                    {{ promo.activa ? 'Activa' : 'Inactiva' }}
                  </span>
                </td>
                <td class="actions">
                  <button v-if="puedeEditarPromocion()" @click="editPromotion(promo)" class="btn-icon" title="Editar"><FontAwesomeIcon :icon="['fas', 'pencil']" /></button>
                  <button v-if="puedeEditarPromocion()" @click="deletePromotion(promo.id)" class="btn-icon" title="Eliminar"><FontAwesomeIcon :icon="['fas', 'trash']" /></button>
                  <span v-if="isVendedor && !permisosVendedor.promociones" class="readonly-badge"><FontAwesomeIcon :icon="['fas', 'eye']" /> Solo lectura</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab de Banners -->
      <div v-if="activeTab === 'banners'" class="tab-panel">
        <h2>Gestión de Banners</h2>
        
        <div v-if="isVendedor && !permisosVendedor.banners" class="info-message">
          ℹ️ <strong>Modo Solo Lectura:</strong> Como vendedor, puedes visualizar los banners pero no modificarlos.
        </div>
        <div v-if="isVendedor && permisosVendedor.banners" class="info-message success">
          ✅ <strong>Permiso Temporal Activo:</strong> Tienes acceso para gestionar banners.
        </div>

        <div v-if="puedeEditarBanner()" class="form-section">
          <h3>{{ editingBanner ? 'Editar Banner' : 'Nuevo Banner' }}</h3>
          <form @submit.prevent="submitBanner" class="banner-form">
            <div class="form-group">
              <label>Título:</label>
              <input type="text" v-model="bannerForm.titulo" required />
            </div>

            <div class="form-group">
              <label>URL de la Imagen:</label>
              <input type="text" v-model="bannerForm.imagen_url" required />
            </div>

            <div class="form-group">
              <label>Producto Asociado (opcional):</label>
              <div class="product-search-container">
                <input 
                  type="text" 
                  v-model="busquedaProductoBanner" 
                  placeholder="Buscar por código o nombre..."
                  class="search-input"
                  @focus="mostrarListaProductos = true"
                />
                <div class="select-with-close">
                  <select 
                    v-model="bannerForm.producto_id" 
                    @focus="mostrarListaProductos = true"
                    @blur="cerrarSelectorBannerDespuesDeDelay"
                    @change="cerrarSelectorBanner"
                    :size="mostrarListaProductos ? 8 : 1"
                  >
                    <option :value="null">Sin asociar</option>
                    <option 
                      v-for="producto in productosFiltradosBanner" 
                      :key="producto.codigo" 
                      :value="producto.codigo"
                    >
                      [{{ producto.codigo }}] {{ producto.producto }}
                    </option>
                  </select>
                  <button 
                    v-if="mostrarListaProductos" 
                    type="button" 
                    class="btn-close-selector"
                    @click="cerrarSelectorBanner"
                    title="Cerrar selector"
                  >
                    ✕
                  </button>
                </div>
                <small class="helper-text">
                  {{ productosFiltradosBanner.length }} productos encontrados
                </small>
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary">
                {{ editingBanner ? 'Actualizar' : 'Crear' }} Banner
              </button>
              <button
                v-if="editingBanner"
                type="button"
                class="btn btn-secondary"
                @click="cancelEditBanner"
              >
                Cancelar
              </button>
            </div>

            <div v-if="bannerMessage" :class="['message', bannerMessageType]">
              {{ bannerMessage }}
            </div>
          </form>
        </div>

        <div class="banners-list">
          <h3>Banners Existentes</h3>
          <div class="banners-grid">
            <div v-for="banner in banners" :key="banner.id" class="banner-card">
              <img :src="banner.imagen_url" :alt="banner.titulo" />
              <div class="banner-info">
                <h4>{{ banner.titulo }}</h4>
                <div v-if="banner.producto" class="banner-producto-info">
                  <span class="producto-codigo">
                    <FontAwesomeIcon :icon="['fas', 'tag']" />
                    {{ banner.producto.codigo }}
                  </span>
                  <span class="producto-nombre">{{ banner.producto.producto }}</span>
                </div>
                <p v-else class="banner-sin-producto">Sin producto asociado</p>
                <div class="banner-actions">
                  <button v-if="puedeEditarBanner()" @click="editBanner(banner)" class="btn-small">Editar</button>
                  <button v-if="puedeEditarBanner()" @click="deleteBanner(banner.id)" class="btn-small btn-danger">Eliminar</button>
                  <span v-if="isVendedor && !permisosVendedor.banners" class="readonly-badge">👁️ Solo lectura</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab de Video -->
      <div v-if="activeTab === 'video'" class="tab-panel">
        <AdminVideo />
      </div>

      <!-- Tab de Logo -->
      <div v-if="activeTab === 'logo'" class="tab-panel">
        <h2>Configuración del Logo</h2>
        
        <div v-if="isVendedor && !permisosVendedor.logo" class="info-message">
          ℹ️ <strong>Acceso Restringido:</strong> Como vendedor, no tienes permisos para cambiar el logo del sitio.
        </div>
        <div v-if="isVendedor && permisosVendedor.logo" class="info-message success">
          ✅ <strong>Permiso Temporal Activo:</strong> Tienes acceso para actualizar el logo.
        </div>
        
        <div v-if="puedeEditarLogo()" class="form-section">
          <form @submit.prevent="submitLogo" class="logo-form">
            <!-- Vista previa del logo actual -->
            <div class="logo-preview" v-if="currentLogo || logoLoadError">
              <h3>Logo Actual:</h3>
              <img
                v-if="currentLogo && !logoLoadError"
                :src="currentLogo"
                alt="Logo actual"
                class="current-logo"
                @error="logoLoadError = true"
              />
              <div v-if="logoLoadError" class="logo-load-error">
                No se pudo cargar la imagen del logo. Verifica que la URL o el archivo sean accesibles.
              </div>
            </div>

            <!-- Selector de modo -->
            <div class="logo-mode-selector">
              <button
                type="button"
                :class="['mode-btn', { active: logoInputMode === 'url' }]"
                @click="logoInputMode = 'url'; logoFile = null; logoFilePreview = ''"
              >
                🔗 Enlace URL
              </button>
              <button
                type="button"
                :class="['mode-btn', { active: logoInputMode === 'archivo' }]"
                @click="logoInputMode = 'archivo'; logoForm.logo_url = ''"
              >
                📁 Subir Archivo
              </button>
            </div>

            <!-- Modo URL -->
            <div v-if="logoInputMode === 'url'" class="form-group">
              <label>URL del Logo:</label>
              <input
                type="url"
                v-model="logoForm.logo_url"
                placeholder="https://ejemplo.com/logo.png"
                :required="logoInputMode === 'url'"
              />
              <small class="form-hint">Ingresa el enlace directo a la imagen del logo.</small>
              <div v-if="logoForm.logo_url" class="logo-url-preview">
                <p>Vista previa:</p>
                <img :src="logoForm.logo_url" alt="Vista previa URL" class="preview-img" @error="$event.target.style.display='none'" />
              </div>
            </div>

            <!-- Modo Archivo -->
            <div v-if="logoInputMode === 'archivo'" class="form-group">
              <label>Seleccionar Archivo:</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                @change="handleLogoFileChange"
                :required="logoInputMode === 'archivo'"
              />
              <small class="form-hint">Formatos aceptados: JPG, PNG, WebP, GIF. Tamaño máximo: 5 MB.</small>
              <div v-if="logoFilePreview" class="logo-url-preview">
                <p>Vista previa:</p>
                <img :src="logoFilePreview" alt="Vista previa del archivo" class="preview-img" />
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary">Actualizar Logo</button>
            </div>

            <div v-if="logoMessage" :class="['message', logoMessageType]">
              {{ logoMessage }}
            </div>
          </form>
        </div>
      </div>

      <!-- Tab de Personalización -->
      <div v-if="activeTab === 'personalizacion' && isAdmin" class="tab-panel">
        <AdminPersonalizacion />
      </div>

      <!-- Tab de Métricas -->
      <div v-if="activeTab === 'metricas' && isAdmin" class="tab-panel">
        <AdminMetricas />
      </div>

      <!-- Tab de Usuarios -->
      <div v-if="activeTab === 'usuarios' && isAdmin" class="tab-panel">
        <h2>Gestión de Usuarios</h2>
        
        <div class="form-section">
          <h3>{{ editingUser ? 'Editar Usuario' : 'Nuevo Usuario' }}</h3>
          <form @submit.prevent="submitUser" class="user-form">
            <div class="form-row">
              <div class="form-group">
                <label>Nombre:</label>
                <input
                  type="text"
                  v-model="userForm.nombre"
                  required
                  minlength="2"
                  maxlength="50"
                />
              </div>

              <div class="form-group">
                <label>Apellido:</label>
                <input
                  type="text"
                  v-model="userForm.apellido"
                  required
                  minlength="2"
                  maxlength="50"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Username:</label>
                <input
                  type="text"
                  v-model="userForm.username"
                  required
                  minlength="3"
                  maxlength="30"
                  pattern="[a-zA-Z0-9_]+"
                  :disabled="editingUser"
                />
              </div>

              <div class="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  v-model="userForm.email"
                  required
                />
              </div>
            </div>

            <div class="form-row">
              <div v-if="!editingUser" class="form-group">
                <label>Contraseña:</label>
                <input
                  type="password"
                  v-model="userForm.password"
                  required
                  minlength="6"
                />
              </div>

              <div class="form-group">
                <label>Teléfono:</label>
                <input
                  type="text"
                  v-model="userForm.telefono"
                  pattern="[0-9+\-\s()]+"
                  title="Solo números, espacios y caracteres: + - ( )"
                  placeholder="+593 99 999 9999 o 0999999999"
                />
                <small class="field-help">Ejemplo: +593 99 999 9999 o (02) 234-5678</small>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Rol:</label>
                <select v-model="userForm.rol" required>
                  <option value="">Seleccione un rol</option>
                  <option value="administrador">Administrador</option>
                  <option value="vendedor">Vendedor</option>
                  <option value="tecnico">Técnico</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>Dirección:</label>
              <textarea
                v-model="userForm.direccion"
                rows="2"
                maxlength="200"
              ></textarea>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary">
                {{ editingUser ? 'Actualizar' : 'Crear' }} Usuario
              </button>
              <button
                v-if="editingUser"
                type="button"
                class="btn btn-secondary"
                @click="cancelEditUser"
              >
                Cancelar
              </button>
            </div>

            <div v-if="userMessage" :class="['message', userMessageType]">
              {{ userMessage }}
            </div>
          </form>
        </div>

        <div class="users-list">
          <h3>Usuarios Registrados</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre Completo</th>
                <th>Username</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Fecha Creación</th>
                <th>Último Acceso</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in usuarios" :key="user.id">
                <td>{{ user.id }}</td>
                <td>{{ user.nombre }} {{ user.apellido }}</td>
                <td>{{ user.username }}</td>
                <td>{{ user.email }}</td>
                <td>
                  <span :class="['role-badge', getRoleClass(user.rol)]">
                    {{ getRoleLabel(user.rol) }}
                  </span>
                </td>
                <td>{{ formatDate(user.fecha_creacion) }}</td>
                <td>{{ user.ultimo_acceso ? formatDate(user.ultimo_acceso) : 'Nunca' }}</td>
                <td class="actions">
                  <button v-if="isAdmin" @click="editUser(user)" class="btn-icon" title="Editar"><FontAwesomeIcon :icon="['fas', 'pencil']" /></button>
                  <button 
                    v-if="isAdmin && !isCurrentUser(user.id)" 
                    @click="openResetPasswordModal(user)" 
                    class="btn-icon btn-warning" 
                    title="Resetear Contraseña"
                  ><FontAwesomeIcon :icon="['fas', 'key']" /></button>
                  <button 
                    v-if="isAdmin && !isCurrentUser(user.id)" 
                    @click="deleteUser(user.id)" 
                    class="btn-icon" 
                    title="Eliminar"
                  ><FontAwesomeIcon :icon="['fas', 'trash']" /></button>
                  <span v-if="isCurrentUser(user.id)" class="readonly-badge">👤 Tú</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab de Permisos Temporales -->
      <div v-if="activeTab === 'permisos' && isAdmin" class="tab-panel">
        <h2>Permisos Temporales para Vendedores</h2>
        
        <div class="form-section">
          <h3>{{ editingPermiso ? 'Editar Permiso' : 'Otorgar Nuevo Permiso' }}</h3>
          <form @submit.prevent="submitPermiso" class="permiso-form">
            <div class="form-row">
              <div class="form-group">
                <label>Vendedor:</label>
                <select v-model="permisoForm.user_id" required :disabled="editingPermiso">
                  <option value="">Seleccione un vendedor</option>
                  <option 
                    v-for="vendedor in vendedores" 
                    :key="vendedor.id" 
                    :value="vendedor.id"
                  >
                    {{ vendedor.nombre }} {{ vendedor.apellido }} (@{{ vendedor.username }})
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label>Tipo de Permiso:</label>
                <select v-model="permisoForm.tipo_permiso" required :disabled="editingPermiso">
                  <option value="">Seleccione tipo</option>
                  <option value="banners">Banners</option>
                  <option value="promociones">Promociones</option>
                  <option value="logo">Logo</option>
                  <option value="all">Todos los permisos</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Fecha de Expiración:</label>
                <input
                  type="datetime-local"
                  v-model="permisoForm.fecha_expiracion"
                  required
                  :min="getCurrentDateTime()"
                />
              </div>

              <div v-if="editingPermiso" class="form-group">
                <label>Estado:</label>
                <select v-model="permisoForm.activo">
                  <option :value="true">Activo</option>
                  <option :value="false">Inactivo</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>Razón del Permiso:</label>
              <textarea
                v-model="permisoForm.razon"
                rows="3"
                placeholder="Ej: Permiso para actualizar banners durante campaña de fin de año"
              ></textarea>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary">
                {{ editingPermiso ? 'Actualizar' : 'Otorgar' }} Permiso
              </button>
              <button
                v-if="editingPermiso"
                type="button"
                class="btn btn-secondary"
                @click="cancelEditPermiso"
              >
                Cancelar
              </button>
            </div>

            <div v-if="permisoMessage" :class="['message', permisoMessageType]">
              {{ permisoMessage }}
            </div>
          </form>
        </div>

        <div class="permisos-list">
          <h3>Permisos Otorgados</h3>
          
          <div class="filter-tabs">
            <button 
              :class="{ active: permisoFilter === 'all' }"
              @click="permisoFilter = 'all'"
            >
              Todos
            </button>
            <button 
              :class="{ active: permisoFilter === 'activos' }"
              @click="permisoFilter = 'activos'"
            >
              Activos
            </button>
            <button 
              :class="{ active: permisoFilter === 'expirados' }"
              @click="permisoFilter = 'expirados'"
            >
              Expirados/Revocados
            </button>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Vendedor</th>
                <th>Tipo Permiso</th>
                <th>Fecha Expiración</th>
                <th>Estado</th>
                <th>Otorgado Por</th>
                <th>Razón</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="permiso in permisosFiltrados" :key="permiso.id">
                <td>{{ permiso.id }}</td>
                <td>
                  {{ permiso.usuario.nombre }} {{ permiso.usuario.apellido }}<br>
                  <small>@{{ permiso.usuario.username }}</small>
                </td>
                <td>
                  <span :class="['permiso-badge', getPermisoBadgeClass(permiso.tipo_permiso)]">
                    {{ getPermisoLabel(permiso.tipo_permiso) }}
                  </span>
                </td>
                <td>{{ formatDate(permiso.fecha_expiracion) }}</td>
                <td>
                  <span :class="['status-badge', getPermisoStatusClass(permiso)]">
                    {{ getPermisoStatus(permiso) }}
                  </span>
                </td>
                <td>{{ permiso.otorgado_por || 'N/A' }}</td>
                <td>
                  <span class="razon-text" :title="permiso.razon">
                    {{ permiso.razon ? truncateText(permiso.razon, 30) : 'Sin razón' }}
                  </span>
                </td>
                <td class="actions">
                  <button 
                    v-if="isAdmin && permiso.activo && !isPermisoExpirado(permiso)"
                    @click="editPermiso(permiso)" 
                    class="btn-icon" 
                    title="Editar"
                  ><FontAwesomeIcon :icon="['fas', 'pencil']" /></button>
                  <button 
                    v-if="isAdmin && permiso.activo && !isPermisoExpirado(permiso)"
                    @click="revocarPermiso(permiso.id)" 
                    class="btn-icon btn-warning" 
                    title="Revocar"
                  ><FontAwesomeIcon :icon="['fas', 'ban']" /></button>
                  <button 
                    v-if="isAdmin"
                    @click="deletePermiso(permiso.id)" 
                    class="btn-icon" 
                    title="Eliminar"
                  ><FontAwesomeIcon :icon="['fas', 'trash']" /></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </div><!-- /.panel-body -->

    <!-- Modal para Resetear Contraseña -->
    <div v-if="showResetPasswordModal" class="modal-overlay" @click.self="closeResetPasswordModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>🔑 Resetear Contraseña</h3>
          <button class="modal-close" @click="closeResetPasswordModal">×</button>
        </div>
        <div class="modal-body">
          <p class="warning-text">
            Vas a resetear la contraseña del usuario:
            <strong>{{ resetPasswordUser?.nombre }} {{ resetPasswordUser?.apellido }}</strong>
            ({{ resetPasswordUser?.username }})
          </p>
          
          <form @submit.prevent="submitResetPassword" class="reset-password-form">
            <div class="form-group">
              <label>Nueva Contraseña: <span class="required">*</span></label>
              <input
                type="password"
                v-model="resetPasswordForm.nuevaPassword"
                placeholder="Mínimo 6 caracteres"
                required
                minlength="6"
              />
              <small class="help-text">
                La contraseña debe tener al menos 6 caracteres, una letra, un número y un carácter especial (@$!%*?&.,-_:)
              </small>
            </div>

            <div class="form-group">
              <label>Confirmar Nueva Contraseña: <span class="required">*</span></label>
              <input
                type="password"
                v-model="resetPasswordForm.confirmarPassword"
                placeholder="Repite la contraseña"
                required
                minlength="6"
              />
            </div>

            <div v-if="resetPasswordMessage" :class="['message', resetPasswordMessageType]">
              {{ resetPasswordMessage }}
            </div>

            <div class="modal-actions">
              <button type="submit" class="btn btn-primary" :disabled="resettingPassword">
                {{ resettingPassword ? 'Reseteando...' : '🔑 Resetear Contraseña' }}
              </button>
              <button type="button" class="btn btn-secondary" @click="closeResetPasswordModal" :disabled="resettingPassword">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./AdminPanel.js"></script>
<style scoped src="./AdminPanel.css"></style>
