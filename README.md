# 🧪 LuckLab

Aplicación React + TypeScript + Firebase para registrar y analizar combinaciones históricas del Euromillón — bajo el nombre LuckLab.

## 🚀 Setup

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Crea un proyecto → Activa **Firestore Database** (modo producción o test)
3. Ve a **Configuración del proyecto → Aplicaciones web** y copia las credenciales
4. Edita `src/firebase.ts` y reemplaza los valores de `firebaseConfig`

**Reglas de Firestore recomendadas (para uso personal):**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 3. Configurar vite.config.ts

Cambia el `base` al nombre de tu repo:
```ts
base: '/lucklab/',
```

### 4. Desarrollo local
```bash
npm run dev
```

### 5. Deploy a GitHub Pages

```bash
# Instalar gh-pages (ya está en devDependencies)
npm install

# Asegúrate de que tu repo tiene GitHub Pages habilitado (rama gh-pages)
npm run deploy
```

## 🧠 Estrategias de predicción

| Estrategia | Descripción |
|------------|-------------|
| 🔥 Números Calientes | Los más frecuentes históricamente |
| ❄️ Números Fríos | Los que llevan más tiempo sin salir |
| ⚖️ Balance Par/Impar | Mezcla óptima según histórico |
| 📊 Balance Alto/Bajo | Distribución 1-25 vs 26-50 |
| 🔗 Pares Frecuentes | Co-ocurrencia de números |
| 📐 Método Delta | Espaciado promedio entre consecutivos |
| 🔟 Distribución por Décadas | Frecuencia por rangos de 10 |
| 🚫 Sin Repetición Reciente | Evita los últimos 5 sorteos |

## 📁 Estructura

```
src/
├── firebase.ts        # Configuración Firebase
├── types/index.ts     # Tipos TypeScript
├── hooks/useDraws.ts  # CRUD Firestore
├── utils/analysis.ts  # Motor de análisis
└── App.tsx            # UI principal
```
