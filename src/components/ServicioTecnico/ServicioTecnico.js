import HeaderAnth from "../HeaderAnth/HeaderAnth.vue";
import FooterAnth from "../FooterAnth/FooterAnth.vue";
  
export default {
  name: "ServicioTecnico",
  components: {
    HeaderAnth,
    FooterAnth,
  },
  data() {
    return {
      isAuthenticated: false,
      isModalVisible: false,
      modalImage: "",
      modalType: "image", // 'image' o 'video'
      isSurveyVisible: false,
      surveySubmitted: false,
      survey: {
        quality: 0,
        response: "",
        price: "",
        recommend: "",
        comments: "",
        email: "",
      },
    };
  },
  methods: {
    showImageModal(imageUrl) {
      console.log("Image URL:", imageUrl);
      this.modalImage = imageUrl;
      this.modalType = "image";
      this.isModalVisible = true;
    },
    showVideoModal(videoUrl) {
      console.log("Video URL:", videoUrl);
      this.modalImage = videoUrl;
      this.modalType = "video";
      this.isModalVisible = true;
    },
    hideImageModal() {
      this.isModalVisible = false;
      this.modalImage = "";
      this.modalType = "image";
    },
    showSurvey() {
      this.isSurveyVisible = true;
      this.surveySubmitted = false;
    },
    hideSurvey() {
      this.isSurveyVisible = false;
      this.resetSurvey();
    },
    resetSurvey() {
      this.survey = {
        quality: 0,
        response: "",
        price: "",
        recommend: "",
        comments: "",
        email: "",
      };
    },
    submitSurvey() {
      // Validación básica
      if (this.survey.quality === 0) {
        this.$store.dispatch('mostrarToast', { mensaje: 'Por favor, califica la calidad del servicio', tipo: 'warning' });
        return;
      }
      if (!this.survey.response) {
        this.$store.dispatch('mostrarToast', { mensaje: 'Por favor, responde sobre el tiempo de respuesta', tipo: 'warning' });
        return;
      }
      if (!this.survey.price) {
        this.$store.dispatch('mostrarToast', { mensaje: 'Por favor, responde sobre el precio', tipo: 'warning' });
        return;
      }
      if (!this.survey.recommend) {
        this.$store.dispatch('mostrarToast', { mensaje: 'Por favor, responde si recomendarías nuestros servicios', tipo: 'warning' });
        return;
      }

      // Aquí iría la llamada a tu API backend
      console.log("Datos de encuesta:", this.survey);
      
      // Simulación de envío
      this.surveySubmitted = true;
      setTimeout(() => {
        this.hideSurvey();
      }, 2000);
    },
  },
  async created() {
    this.isAuthenticated = !!localStorage.getItem("access_token");
  },
};