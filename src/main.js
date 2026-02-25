import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from '../store';
import './styles/globals.css';
import './config/axiosConfig';

// Configuración de FontAwesome
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { 
  faBell as farBell 
} from '@fortawesome/free-regular-svg-icons';
import { 
  faPencil, 
  faArrowsRotate, 
  faBell as fasBell,
  faTrash,
  faKey,
  faBan,
  faEye
} from '@fortawesome/free-solid-svg-icons';

// Agregar iconos a la librería
library.add(farBell, faPencil, faArrowsRotate, fasBell, faTrash, faKey, faBan, faEye);

// Importar configuración de Axios con interceptor
// Asegúrate de que esta URL coincida con tu backend
// Manejo de errores globales
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
});

const app = createApp(App);

// Registrar componente FontAwesome globalmente
app.component('FontAwesomeIcon', FontAwesomeIcon);

// Manejo de errores de Vue
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue error:', err, info);
};

app.use(router)
   .use(store)
   .mount('#app');
