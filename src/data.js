// ====================== CONSTANTS & DATA ======================

export const STORAGE_KEY = 'sb_market_maker_v4';

export const TICKERS = ['TUNA', 'CUTI', 'ALGB'];

export const EMPRESAS = {
  TUNA: {
    nombre: "TUNA S.A.",
    sector: "Tecnología",
    cap: "$820M",
    pe: "28x",
    crecimiento: "+22% YoY",
    dividendo: "No paga",
    vol: "Alta",
    riesgo: "Depende de una sola línea de productos",
    color: "#22d3ee",
    desc: "Fabricante del iTuna Phone, dispositivo hecho con tuna del monte santiagueño. Líder en innovación frutal-tech.",
    origen: "Monte santiagueño",
    logo: "🍎"
  },
  CUTI: {
    nombre: "CutiBurguer S.A.",
    sector: "Gastronomía",
    cap: "$340M",
    pe: "14x",
    crecimiento: "+8% YoY",
    dividendo: "4.2% anual",
    vol: "Baja-Media",
    riesgo: "Precio carne",
    color: "#fb923c",
    desc: "Cadena de hamburguesas artesanales con carne de monte. Flujo de caja estable, modelo franquicia.",
    origen: "Santiago del Estero",
    logo: "🍔"
  },
  ALGB: {
    nombre: "Algarrobo.com",
    sector: "E-commerce / Logística",
    cap: "$1100M",
    pe: "40x",
    crecimiento: "+45% YoY",
    dividendo: "No paga",
    vol: "Muy Alta",
    riesgo: "Guerra de precios",
    color: "#a3e635",
    desc: "Marketplace de productos de algarrobo. Quema caja para ganar mercado. Potencial unicornio o crash.",
    origen: "Logística algarrobense",
    logo: "🌳"
  }
};

export const PRECIOS_INICIALES = { TUNA: 200, CUTI: 100, ALGB: 250 };

export const JUGADORES_DEMO = [
  { id: 'p1', nombre: 'Santiago', capitalInicial: 10000 },
  { id: 'p2', nombre: 'La Banda Trader', capitalInicial: 15000 },
  { id: 'p3', nombre: 'Fondo Algarrobo', capitalInicial: 20000 }
];

export const OPERACIONES_DEMO = [
  { id: 'o1', ronda: 1, jugadorId: 'p1', jugador: 'Santiago', empresa: 'TUNA', tipo: 'Compra', cantidad: 10, precio: 200 },
  { id: 'o2', ronda: 1, jugadorId: 'p2', jugador: 'La Banda Trader', empresa: 'CUTI', tipo: 'Compra', cantidad: 50, precio: 100 },
  { id: 'o3', ronda: 1, jugadorId: 'p3', jugador: 'Fondo Algarrobo', empresa: 'ALGB', tipo: 'Compra', cantidad: 20, precio: 250 }
];

export const NOTICIAS_BASE = [
  { id: 1,  titulo: "TunaPad bate récord de preventas: la tablet santiagueña se agota en 48 horas", efectoTexto: "TUNA +8%", efectos: [{ ticker: 'TUNA', pct: 8 }], tipo: 'alcista', empresa: 'TUNA' },
  { id: 2,  titulo: "TUNA firma acuerdo de exportación y llevará el iTuna Phone a todo Sudamérica", efectoTexto: "TUNA +10%", efectos: [{ ticker: 'TUNA', pct: 10 }], tipo: 'alcista', empresa: 'TUNA' },
  { id: 3,  titulo: "TUNA inaugura un polo de innovación en Santiago del Estero y anuncia inversión conjunta con Algarrobo.com en logística de última milla", efectoTexto: "TUNA +10% · ALGB +5%", efectos: [{ ticker: 'TUNA', pct: 10 }, { ticker: 'ALGB', pct: 5 }], tipo: 'alcista', empresa: 'TUNA', destacada: true },
  { id: 4,  titulo: "Falta de 'espinas' (componente clave) frena la producción del iTuna Phone", efectoTexto: "TUNA −8%", efectos: [{ ticker: 'TUNA', pct: -8 }], tipo: 'bajista', empresa: 'TUNA' },
  { id: 5,  titulo: "Denuncian fallas de batería en el último lote del iTuna Phone", efectoTexto: "TUNA −10%", efectos: [{ ticker: 'TUNA', pct: -10 }], tipo: 'bajista', empresa: 'TUNA' },
  { id: 6,  titulo: "El Gobierno sube los aranceles a la importación de componentes electrónicos", efectoTexto: "TUNA −6%", efectos: [{ ticker: 'TUNA', pct: -6 }], tipo: 'bajista', empresa: 'TUNA' },
  { id: 7,  titulo: "La Achalay Burger es elegida 'sabor del año' en un certamen gastronómico nacional", efectoTexto: "CUTI +6%", efectos: [{ ticker: 'CUTI', pct: 6 }], tipo: 'alcista', empresa: 'CUTI' },
  { id: 8,  titulo: "CutiBurguer anuncia 15 sucursales nuevas en todo el NOA", efectoTexto: "CUTI +8%", efectos: [{ ticker: 'CUTI', pct: 8 }], tipo: 'alcista', empresa: 'CUTI' },
  { id: 9,  titulo: "CutiBurguer cierra alianza de delivery exclusivo con Algarrobo.com", efectoTexto: "CUTI +8% · ALGB +5%", efectos: [{ ticker: 'CUTI', pct: 8 }, { ticker: 'ALGB', pct: 5 }], tipo: 'alcista', empresa: 'CUTI', destacada: true },
  { id: 10, titulo: "El precio de la carne vacuna sube fuerte y golpea los márgenes de CutiBurguer", efectoTexto: "CUTI −8%", efectos: [{ ticker: 'CUTI', pct: -8 }], tipo: 'bajista', empresa: 'CUTI' },
  { id: 11, titulo: "Escándalo sanitario en una sucursal de La Banda genera caída de ventas", efectoTexto: "CUTI −10%", efectos: [{ ticker: 'CUTI', pct: -10 }], tipo: 'bajista', empresa: 'CUTI' },
  { id: 12, titulo: "Paro de transportistas frena la distribución de insumos a las sucursales", efectoTexto: "CUTI −6% · ALGB −4%", efectos: [{ ticker: 'CUTI', pct: -6 }, { ticker: 'ALGB', pct: -4 }], tipo: 'bajista', empresa: 'CUTI', destacada: true },
  { id: 13, titulo: "Algarrobo.com habilita una nueva ruta comercial hacia el norte y reduce los tiempos de envío", efectoTexto: "ALGB +8%", efectos: [{ ticker: 'ALGB', pct: 8 }], tipo: 'alcista', empresa: 'ALGB' },
  { id: 14, titulo: "Récord de ventas en el 'CyberLunes' regional", efectoTexto: "ALGB +10%", efectos: [{ ticker: 'ALGB', pct: 10 }], tipo: 'alcista', empresa: 'ALGB' },
  { id: 15, titulo: "Algarrobo.com y TUNA lanzan una línea propia de dispositivos co-branded", efectoTexto: "ALGB +8% · TUNA +5%", efectos: [{ ticker: 'ALGB', pct: 8 }, { ticker: 'TUNA', pct: 5 }], tipo: 'alcista', empresa: 'ALGB', destacada: true },
  { id: 16, titulo: "Corte de la ruta nacional por temporal complica la logística de Algarrobo.com", efectoTexto: "ALGB −8%", efectos: [{ ticker: 'ALGB', pct: -8 }], tipo: 'bajista', empresa: 'ALGB' },
  { id: 17, titulo: "Denuncias de demoras en entregas afectan la reputación de la marca", efectoTexto: "ALGB −6%", efectos: [{ ticker: 'ALGB', pct: -6 }], tipo: 'bajista', empresa: 'ALGB' },
  { id: 18, titulo: "Entra al NOA un competidor extra-regional con precios agresivos", efectoTexto: "ALGB −10%", efectos: [{ ticker: 'ALGB', pct: -10 }], tipo: 'bajista', empresa: 'ALGB' }
].map(n => ({
  ...n,
  youtubeUrl: '',
  descripcion: '',
  lanzada: false,
  rondaLanzamiento: null,
  timestamp: null,
  rondaProgramada: null
}));

export const TICKER_COLORS = { TUNA: '#22d3ee', CUTI: '#fb923c', ALGB: '#a3e635' };
export const PLAYER_COLORS = ['#22d3ee', '#fb923c', '#a3e635', '#f87171', '#a78bfa', '#60a5fa', '#f472b6', '#fbbf24'];
