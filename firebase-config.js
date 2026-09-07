// Importation des fonctions nécessaires du SDK Firebase Web (v10)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Remplacez ces valeurs par les clés de VOTRE projet Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCMT9ucNdHruknBQLxzqZlLPUs1LFixwx4",
  authDomain: "smartjuice.firebaseapp.com",
  projectId: "smartjuice",
  storageBucket: "smartjuice.firebasestorage.app",
  messagingSenderId: "500853757724",
  appId: "1:500853757724:web:6c6395c0d65150dab44cd9"
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);

// Exporter l'instance de la base de données Firestore pour l'utiliser dans admin.js et app.js
export const db = getFirestore(app);