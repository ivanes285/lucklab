import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyCbHiXWEe-a1QTIehJ_jBVKDnq-7hpy6r0",
  authDomain: "claude-lot.firebaseapp.com",
  databaseURL: "https://claude-lot-default-rtdb.firebaseio.com",
  projectId: "claude-lot",
  storageBucket: "claude-lot.firebasestorage.app",
  messagingSenderId: "750179480123",
  appId: "1:750179480123:web:4f16cdb38409847441e21e"
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)
