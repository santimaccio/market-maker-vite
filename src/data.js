// Ticker symbols
export const TICKERS = ['TUNA', 'CUTI', 'ALGB'];

// Companies info
export const EMPRESAS = {
  TUNA: {
    nombre: 'TunaFish Corp',
    sector: 'Pesca',
    logo: '🐟',
    color: '#06b6d4',
    desc: 'Empresa de procesamiento y exportación de atún. Lideran el mercado regional con flota propia y tecnología moderna.',
    cap: '$2.5B',
    pe: '12.5x',
    crecimiento: '+15%',
    dividendo: '2.8%',
    volatilidad: 'Media',
    riesgo: 'Riesgos climáticos, competencia internacional',
    origen: '🇦🇷 Santiago del Estero'
  },
  CUTI: {
    nombre: 'Cutlery & Craft',
    sector: 'Manufactura',
    logo: '🔪',
    color: '#f97316',
    desc: 'Productor de cubiertos y utensilios de cocina premium. Exportan a mercados europeos y asiáticos.',
    cap: '$800M',
    pe: '18.2x',
    crecimiento: '+8%',
    dividendo: '4.2%',
    volatilidad: 'Baja',
    riesgo: 'Dependencia de exportaciones, tipo de cambio',
    origen: '🇦🇷 Santiago del Estero'
  },
  ALGB: {
    nombre: 'Algodón Buenos Aires',
    sector: 'Agroindustria',
    logo: '🌾',
    color: '#84cc16',
    desc: 'Cultivo, procesamiento y comercialización de algodón de alta calidad. Inversión en tecnología sostenible.',
    cap: '$1.2B',
    pe: '14.8x',
    crecimiento: '+12%',
    dividendo: '1.5%',
    volatilidad: 'Alta',
    riesgo: 'Clima, precios internacionales, commodity volátil',
    origen: '🇦🇷 Santiago del Estero'
  }
};

// Initial prices
export const PRECIOS_INICIALES = {
  TUNA: 200,
  CUTI: 100,
  ALGB: 250
};

// Demo players
export const JUGADORES_DEMO = [
  { id: '1', nombre: 'Jefe de Piso', capitalInicial: 10000 },
  { id: '2', nombre: 'Analista Senior', capitalInicial: 12000 },
  { id: '3', nombre: 'Trader Agresivo', capitalInicial: 8000 }
];

// Demo operations
export const OPERACIONES_DEMO = [
  { id: 'op1', ronda: 1, jugador: 'Jefe de Piso', empresa: 'TUNA', tipo: 'Compra', cantidad: 10, precio: 200 },
  { id: 'op2', ronda: 1, jugador: 'Analista Senior', empresa: 'CUTI', tipo: 'Compra', cantidad: 20, precio: 100 },
  { id: 'op3', ronda: 1, jugador: 'Trader Agresivo', empresa: 'ALGB', tipo: 'Compra', cantidad: 5, precio: 250 }
];

// Base news/events
export const NOTICIAS_BASE = [
  {
    id: 'news1',
    titulo: '🎣 Récord de captura: Temporada de atún excepcional',
    tipo: 'alcista',
    empresa: 'TUNA',
    descripcion: 'Reportes de organismos internacionales indican la mejor temporada de atún en 5 años. TunaFish Corp aumentará producción.',
    youtubeUrl: '',
    efectoTexto: 'TUNA +8%',
    efectos: [{ ticker: 'TUNA', pct: 8 }],
    destacada: false,
    lanzada: false,
    rondaLanzamiento: null,
    timestamp: null,
    rondaProgramada: null
  },
  {
    id: 'news2',
    titulo: '⚠️ Crisis hídrica afecta producción agrícola',
    tipo: 'bajista',
    empresa: 'ALGB',
    descripcion: 'Sequía severa en región impacta cultivos de algodón. Proyecciones de menor rendimiento.',
    youtubeUrl: '',
    efectoTexto: 'ALGB -12%',
    efectos: [{ ticker: 'ALGB', pct: -12 }],
    destacada: false,
    lanzada: false,
    rondaLanzamiento: null,
    timestamp: null,
    rondaProgramada: null
  },
  {
    id: 'news3',
    titulo: '🏆 Cutlery gana premio internacional de diseño',
    tipo: 'alcista',
    empresa: 'CUTI',
    descripcion: 'Cutlery & Craft reconocida en feria Europróx por innovación en diseño. Aumentan órdenes de exportación.',
    youtubeUrl: '',
    efectoTexto: 'CUTI +5%',
    efectos: [{ ticker: 'CUTI', pct: 5 }],
    destacada: false,
    lanzada: false,
    rondaLanzamiento: null,
    timestamp: null,
    rondaProgramada: null
  },
  {
    id: 'news4',
    titulo: '💱 Apreciación del dólar favorece exportadores',
    tipo: 'alcista',
    empresa: 'TUNA',
    descripcion: 'Fortalecimiento del USD aumenta rentabilidad de exportaciones. Beneficia a todas las empresas del sector.',
    youtubeUrl: '',
    efectoTexto: 'TUNA +6% · CUTI +4% · ALGB +3%',
    efectos: [{ ticker: 'TUNA', pct: 6 }, { ticker: 'CUTI', pct: 4 }, { ticker: 'ALGB', pct: 3 }],
    destacada: true,
    lanzada: false,
    rondaLanzamiento: null,
    timestamp: null,
    rondaProgramada: null
  },
  {
    id: 'news5',
    titulo: '📉 Volatilidad en commodity: algodón en mínimos',
    tipo: 'bajista',
    empresa: 'ALGB',
    descripcion: 'Precios de algodón caen en mercados internacionales por sobrecapacidad global.',
    youtubeUrl: '',
    efectoTexto: 'ALGB -8%',
    efectos: [{ ticker: 'ALGB', pct: -8 }],
    destacada: false,
    lanzada: false,
    rondaLanzamiento: null,
    timestamp: null,
    rondaProgramada: null
  }
];

// Ticker colors for charts
export const TICKER_COLORS = {
  TUNA: '#06b6d4',
  CUTI: '#f97316',
  ALGB: '#84cc16'
};

// Player colors for charts
export const PLAYER_COLORS = [
  '#3b82f6',
  '#ef4444',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899'
];

// LocalStorage key
export const STORAGE_KEY = 'simulador_bursatil_v4';
