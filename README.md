# Market Maker Command Center v4

Simulador Bursátil Santiagueño — Vite + React + Tailwind (build, sin CDN).

## Optimizaciones aplicadas

### 1. localStorage: lectura única
**Antes:** `localStorage.getItem(STORAGE_KEY)` se llamaba 6 veces (una por cada `useState`).
**Ahora:** Se lee una sola vez con `useMemo(() => storage.read(), [])` y el resultado se reutiliza en todos los inicializadores.

### 2. noticias.filter envuelto en useMemo
**Antes:** `noticiasFiltradas` y `totalPendientes` se recalculaban en cada render sin memoización.
**Ahora:** Ambos están en `useMemo` con dependencias `[noticias, filtroNoticias]` y `[noticias]` respectivamente.

### 3. evolucion solo cuando tab === 'DASHBOARD'
**Antes:** `evolucion` se calculaba siempre (10 rondas × N jugadores × M operaciones) sin importar el tab activo.
**Ahora:** Retorna `null` inmediatamente si `tab !== 'DASHBOARD'`. El cómputo pesado solo ocurre cuando el usuario está viendo el dashboard.

### 4. preciosChart solo cuando tab === 'PRECIOS'
**Antes:** `preciosChart` se mapeaba en cada render.
**Ahora:** Retorna `null` si `tab !== 'PRECIOS'`. El mapeo solo ocurre en la tab de precios.

### 5. setTimeout de sincronización eliminado
**Antes:** `lanzarNoticia` usaba `setTimeout(150ms)` para esperar a que `setPrecios` terminara antes de calcular el impacto en patrimonio (race condition frágil).
**Ahora:** Los nuevos precios y el impacto en patrimonio se calculan **sincrónicamente** del estado actual, y todas las actualizaciones de estado se disparan en el mismo batch. El `flashRonda` ahora se limpia con `useEffect` + cleanup en lugar de `setTimeout` suelto.

### 6. Sin CDN — todo durante el build
**Antes:** React, ReactDOM, Recharts, Babel y Tailwind se cargaban desde CDN en el navegador (runtime).
**Ahora:** Todo viene de npm y se compila con Vite:
- JSX → esbuild (no Babel standalone)
- React/ReactDOM → `import` de paquetes npm
- Recharts → `import` de paquete npm
- Tailwind → PostCSS en build (no `cdn.tailwindcss.com`)

## Stack

- **Vite 5** — bundler y dev server
- **React 18** — UI (JSX compilado en build)
- **Recharts 2** — gráficos (npm)
- **Tailwind CSS 3** — estilos (PostCSS, no CDN)
- **Space Grotesk / JetBrains Mono** — tipografías (Google Fonts link)

## Estructura

```
market-maker-vite/
├── index.html              # HTML mínimo (#root + script module)
├── vite.config.js          # Vite + plugin React
├── tailwind.config.js      # Tailwind
├── postcss.config.js       # PostCSS (Tailwind + Autoprefixer)
├── package.json
└── src/
    ├── main.jsx            # Entry point (ReactDOM.createRoot + StrictMode)
    ├── App.jsx             # Componente principal (optimizado)
    ├── index.css           # Tailwind directives + estilos custom
    ├── data.js             # Constantes (EMPRESAS, NOTICIAS_BASE, etc.)
    ├── utils.js            # Helpers (parseYouTubeId, fmtMoney, fmtPct, debounce)
    └── lib/
        └── storage.js      # Capa de persistencia (localStorage, un solo read)
```

## Comandos

```bash
npm install      # instalar dependencias
npm run dev      # dev server en http://localhost:3000
npm run build    # build de producción → dist/
npm run preview  # preview del build
```
