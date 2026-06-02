import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// 🔥 REEMPLAZA ESTOS VALORES CON LOS DE TU PROYECTO FIREBASE
// Ve a https://console.firebase.google.com → Tu proyecto → Configuración → Aplicaciones web
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROJECT_ID.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_PROJECT_ID.appspot.com",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
