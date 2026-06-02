import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyBJEcwfzPJarO9fHq4d_ik-YlUBiJb67Aw",
  authDomain: "lucklab-80466.firebaseapp.com",
  databaseURL: "https://lucklab-80466-default-rtdb.firebaseio.com",
  projectId: "lucklab-80466",
  storageBucket: "lucklab-80466.firebasestorage.app",
  messagingSenderId: "96326408146",
  appId: "1:96326408146:web:6ba2e3b6ce5ff1226e9a0b"
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)
