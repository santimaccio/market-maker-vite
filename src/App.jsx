import { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

import {
  TICKERS, EMPRESAS, PRECIOS_INICIALES,
  JUGADORES_DEMO, OPERACIONES_DEMO, NOTICIAS_BASE,
  TICKER_COLORS, PLAYER_COLORS, STORAGE_KEY
} from './data.js';
import { parseYouTubeId, fmtMoney, fmtPct } from './utils.js';
import { storage } from './lib/storage.js';

// ====================== DEFAULT STATE ======================
function defaultPrecios() {
  return Array.from({ length: 10 }, (_, i) => ({
    ronda: i + 1,
    TUNA: i === 0 ? 200 : null,
    CUTI: i === 0 ? 100 : null,
    ALGB: i === 0 ? 250 : null,
    mod: {}
  }));
}

function defaultLog() {
  return [{ ts: Date.now(), msg: '🚀 Sistema iniciado. Ronda 1 — TUNA $200 · CUTI $100 · ALGB $250', tipo: 'INFO' }];
}

// ====================== COMPONENT ======================
export default function App() {
  // --- OPTIMIZATION 1: Read localStorage ONCE ---
  const saved = useMemo(() => storage.read(), []);

  const [rondaActual, setRondaActual] = useState(saved?.rondaActual ?? 1);
  const [estadoMercado, setEstadoMercado] = useState(saved?.estadoMercado ?? 'Abierto');
  const [precios, setPrecios] = useState(() => saved?.precios ?? defaultPrecios());
  const [jugadores, setJugadores] = useState(() => saved?.jugadores ?? JUGADORES_DEMO);
  const [operaciones, setOperaciones] = useState(() => saved?.operaciones ?? OPERACIONES_DEMO);
  const [noticias, setNoticias] = useState(() => {
    if (saved?.noticias) {
      return NOTICIAS_BASE.map(base => {
        const ex = saved.noticias.find(p => p.id === base.id);
        return ex ? { ...base, ...ex, efectos: base.efectos, efectoTexto: base.efectoTexto } : base;
      });
    }
    return NOTICIAS_BASE;
  });
  const [log, setLog] = useState(() => saved?.log ?? defaultLog());

  const [tab, setTab] = useState('NOTICIAS');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(null);
  const [showImpacto, setShowImpacto] = useState(null);
  const [filtroNoticias, setFiltroNoticias] = useState('TODAS');
  const [nuevoJugador, setNuevoJugador] = useState({ nombre: '', capital: 10000 });
  const [nuevaOp, setNuevaOp] = useState({ ronda: 1, jugador: '', empresa: 'TUNA', tipo: 'Compra', cantidad: 1, precio: '' });
  const [modoProyeccion, setModoProyeccion] = useState(false);
  const [showCustomNoticia, setShowCustomNoticia] = useState(false);
  const [customNoticia, setCustomNoticia] = useState({ titulo: '', empresa: 'TUNA', tipo: 'alcista', youtubeUrl: '', descripcion: '', pctTUNA: 0, pctCUTI: 0, pctALGB: 0 });
  const [flashRonda, setFlashRonda] = useState(null);

  // ---- Persist ----
  useEffect(() => {
    storage.write({ precios, jugadores, operaciones, noticias, log, rondaActual, estadoMercado });
  }, [precios, jugadores, operaciones, noticias, log, rondaActual, estadoMercado]);

  useEffect(() => {
    setNuevaOp(o => ({ ...o, ronda: rondaActual, precio: getPrecioParaRonda(rondaActual, o.empresa) || '' }));
  }, [rondaActual]);

  // Clear flashRonda via effect (no setTimeout for sync)
  useEffect(() => {
    if (flashRonda == null) return;
    const id = setTimeout(() => setFlashRonda(null), 600);
    return () => clearTimeout(id);
  }, [flashRonda]);

  // ---- Price helpers ----
  function getPrecioParaRonda(ronda, ticker) {
    for (let i = ronda - 1; i >= 0; i--) {
      if (precios[i] && precios[i][ticker] != null) return precios[i][ticker];
    }
    return PRECIOS_INICIALES[ticker];
  }
  function getPrecioActual(ticker) { return getPrecioParaRonda(rondaActual, ticker); }

  // ---- Calculated players ----
  const jugadoresCalc = useMemo(() => {
    return jugadores.map(j => {
      const ops = operaciones.filter(o => o.jugador === j.nombre && o.ronda <= rondaActual);
      let efectivo = j.capitalInicial;
      let acc = { TUNA: 0, CUTI: 0, ALGB: 0 };
      ops.forEach(o => {
        const total = o.cantidad * o.precio;
        if (o.tipo === 'Compra') { efectivo -= total; acc[o.empresa] += o.cantidad; }
        else { efectivo += total; acc[o.empresa] -= o.cantidad; }
      });
      const pT = getPrecioActual('TUNA'), pC = getPrecioActual('CUTI'), pA = getPrecioActual('ALGB');
      const valorCartera = acc.TUNA * pT + acc.CUTI * pC + acc.ALGB * pA;
      const patrimonio = efectivo + valorCartera;
      const rendimiento = ((patrimonio / j.capitalInicial) - 1) * 100;
      const divCUTI = acc.CUTI > 0 ? acc.CUTI * pC * 0.042 : 0;
      return { ...j, efectivo, ...acc, valorCartera, patrimonio, rendimiento, divCUTI };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jugadores, operaciones, precios, rondaActual]);

  // --- OPTIMIZATION 3: evolucion ONLY when tab === 'DASHBOARD' ---
  const evolucion = useMemo(() => {
    if (tab !== 'DASHBOARD') return null;
    return Array.from({ length: 10 }, (_, i) => i + 1).map(r => {
      const obj = { ronda: r };
      jugadores.forEach(j => {
        const ops = operaciones.filter(o => o.jugador === j.nombre && o.ronda <= r);
        let efectivo = j.capitalInicial; let aT = 0, aC = 0, aA = 0;
        ops.forEach(o => {
          const tot = o.cantidad * o.precio;
          if (o.tipo === 'Compra') {
            efectivo -= tot;
            if (o.empresa === 'TUNA') aT += o.cantidad;
            if (o.empresa === 'CUTI') aC += o.cantidad;
            if (o.empresa === 'ALGB') aA += o.cantidad;
          } else {
            efectivo += tot;
            if (o.empresa === 'TUNA') aT -= o.cantidad;
            if (o.empresa === 'CUTI') aC -= o.cantidad;
            if (o.empresa === 'ALGB') aA -= o.cantidad;
          }
        });
        const pT = getPrecioParaRonda(r, 'TUNA'), pC = getPrecioParaRonda(r, 'CUTI'), pA = getPrecioParaRonda(r, 'ALGB');
        obj[j.nombre] = efectivo + aT * pT + aC * pC + aA * pA;
      });
      return obj;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, jugadores, operaciones, precios]);

  // --- OPTIMIZATION 4: preciosChart ONLY when tab === 'PRECIOS' ---
  const preciosChart = useMemo(() => {
    if (tab !== 'PRECIOS') return null;
    return precios.map(p => ({
      ronda: 'R' + p.ronda,
      TUNA: getPrecioParaRonda(p.ronda, 'TUNA'),
      CUTI: getPrecioParaRonda(p.ronda, 'CUTI'),
      ALGB: getPrecioParaRonda(p.ronda, 'ALGB')
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, precios]);

  // --- OPTIMIZATION 2: noticias.filter wrapped in useMemo ---
  const noticiasFiltradas = useMemo(() => {
    return noticias.filter(n => {
      if (filtroNoticias === 'TODAS') return true;
      if (filtroNoticias === 'PENDIENTES') return !n.lanzada;
      if (filtroNoticias === 'LANZADAS') return n.lanzada;
      return n.empresa === filtroNoticias;
    });
  }, [noticias, filtroNoticias]);

  const totalPendientes = useMemo(() => noticias.filter(n => !n.lanzada).length, [noticias]);

  // --- OPTIMIZATION 5: lanzarNoticia WITHOUT setTimeout ---
  // Computes new prices + patrimonio impact synchronously, then sets all state at once.
  function lanzarNoticia(noticia) {
    const rondaLanzamiento = noticia.rondaProgramada || rondaActual;
    const impactos = [];

    // Compute new prices synchronously from current state (no setState callback needed)
    const nuevosPrecios = precios.map(p => {
      if (p.ronda !== rondaLanzamiento) return p;
      let updated = { ...p };
      noticia.efectos.forEach(eff => {
        const base = p[eff.ticker] ?? getPrecioParaRonda(rondaLanzamiento, eff.ticker);
        const nuevo = Math.round(base * (1 + eff.pct / 100) * 100) / 100;
        impactos.push({ ticker: eff.ticker, pct: eff.pct, viejo: base, nuevo });
        updated = { ...updated, [eff.ticker]: nuevo, mod: { ...updated.mod, [eff.ticker]: noticia.id } };
      });
      return updated;
    });

    // Compute patrimonio impact synchronously using current jugadoresCalc
    const impactosPatrimonio = jugadoresCalc.map(j => {
      let delta = 0;
      impactos.forEach(imp => { delta += (j[imp.ticker] || 0) * (imp.nuevo - imp.viejo); });
      return { jugador: j.nombre, delta, patrimonioAntes: j.patrimonio, patrimonioDespues: j.patrimonio + delta };
    });

    // Single batch of state updates — no setTimeout, no derived-state race
    setPrecios(nuevosPrecios);
    setShowImpacto({ noticia, ronda: rondaLanzamiento, impactos, impactosPatrimonio });
    setLog(l => [{
      ts: Date.now(),
      tipo: noticia.tipo === 'alcista' ? 'ALCISTA' : 'BAJISTA',
      msg: `📰 R${rondaLanzamiento} "${noticia.titulo.substring(0, 60)}${noticia.titulo.length > 60 ? '...' : ''}" → ${impactos.map(i => `${i.ticker} ${i.pct > 0 ? '+' : ''}${i.pct}% ${i.viejo}→${i.nuevo}`).join(' · ')} | ${impactosPatrimonio.map(ip => `${ip.jugador} ${ip.delta >= 0 ? '+' : ''}${fmtMoney(ip.delta)}`).join(', ')}`
    }, ...l]);
    setNoticias(prev => prev.map(n => n.id === noticia.id ? { ...n, lanzada: true, rondaLanzamiento, timestamp: Date.now() } : n));
    setShowVideoModal(noticia);
    setFlashRonda(rondaLanzamiento);
  }

  function crearNoticiaCustom() {
    const efectos = [];
    const partes = [];
    if (customNoticia.pctTUNA != 0) { efectos.push({ ticker: 'TUNA', pct: customNoticia.pctTUNA }); partes.push(`TUNA ${customNoticia.pctTUNA > 0 ? '+' : ''}${customNoticia.pctTUNA}%`); }
    if (customNoticia.pctCUTI != 0) { efectos.push({ ticker: 'CUTI', pct: customNoticia.pctCUTI }); partes.push(`CUTI ${customNoticia.pctCUTI > 0 ? '+' : ''}${customNoticia.pctCUTI}%`); }
    if (customNoticia.pctALGB != 0) { efectos.push({ ticker: 'ALGB', pct: customNoticia.pctALGB }); partes.push(`ALGB ${customNoticia.pctALGB > 0 ? '+' : ''}${customNoticia.pctALGB}%`); }
    if (efectos.length === 0) efectos.push({ ticker: customNoticia.empresa, pct: 0 });

    const nueva = {
      id: 'custom_' + Date.now(), titulo: customNoticia.titulo,
      efectoTexto: partes.join(' · ') || 'Neutro', efectos,
      tipo: customNoticia.tipo, empresa: customNoticia.empresa,
      youtubeUrl: customNoticia.youtubeUrl, descripcion: customNoticia.descripcion,
      destacada: efectos.length > 1,
      lanzada: false, rondaLanzamiento: null, timestamp: null, rondaProgramada: null
    };
    setNoticias(prev => [...prev, nueva]);
    setLog(l => [{ ts: Date.now(), tipo: 'INFO', msg: `📝 Noticia custom creada: "${customNoticia.titulo.substring(0, 50)}..."` }, ...l]);
    setCustomNoticia({ titulo: '', empresa: 'TUNA', tipo: 'alcista', youtubeUrl: '', descripcion: '', pctTUNA: 0, pctCUTI: 0, pctALGB: 0 });
    setShowCustomNoticia(false);
  }

  function eliminarNoticia(id) {
    setNoticias(prev => prev.filter(n => n.id !== id));
    setLog(l => [{ ts: Date.now(), tipo: 'INFO', msg: '🗑 Noticia eliminada' }, ...l]);
  }

  function revertirNoticia(noticia) {
    const ronda = noticia.rondaLanzamiento;
    setPrecios(prev => {
      const copia = [...prev];
      const idx = copia.findIndex(p => p.ronda === ronda);
      if (idx === -1) return prev;
      noticia.efectos.forEach(eff => {
        const actual = copia[idx][eff.ticker];
        if (actual != null) {
          const revertido = Math.round(actual / (1 + eff.pct / 100) * 100) / 100;
          const newMod = { ...copia[idx].mod };
          delete newMod[eff.ticker];
          copia[idx] = { ...copia[idx], [eff.ticker]: revertido, mod: newMod };
        }
      });
      return copia;
    });
    setNoticias(prev => prev.map(n => n.id === noticia.id ? { ...n, lanzada: false, rondaLanzamiento: null, timestamp: null } : n));
    setLog(l => [{ ts: Date.now(), tipo: 'INFO', msg: `↩ Noticia revertida: "${noticia.titulo.substring(0, 50)}..."` }, ...l]);
    setShowImpacto(null);
  }

  function handleReset() {
    setPrecios(defaultPrecios());
    setJugadores(JUGADORES_DEMO);
    setOperaciones(OPERACIONES_DEMO);
    setLog([{ ts: Date.now(), tipo: 'INFO', msg: '🔄 Partida reseteada a estado demo. Ronda 1 — 200/100/250' }]);
    setNoticias(NOTICIAS_BASE);
    setRondaActual(1); setShowResetModal(false); setResetConfirm(false);
  }

  function actualizarPrecio(ronda, ticker, valor) {
    setPrecios(prev => prev.map(p => p.ronda === ronda ? { ...p, [ticker]: valor === '' || valor == null ? null : parseFloat(valor) } : p));
  }

  function exportData() {
    const data = JSON.stringify({ precios, jugadores, operaciones, noticias, log, rondaActual, estadoMercado }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `simulador_bursatil_${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(url);
  }

  function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.precios) setPrecios(data.precios);
        if (data.jugadores) setJugadores(data.jugadores);
        if (data.operaciones) setOperaciones(data.operaciones);
        if (data.noticias) setNoticias(data.noticias);
        if (data.log) setLog(data.log);
        if (data.rondaActual) setRondaActual(data.rondaActual);
        if (data.estadoMercado) setEstadoMercado(data.estadoMercado);
        setLog(l => [{ ts: Date.now(), tipo: 'INFO', msg: '📥 Datos importados correctamente' }, ...l]);
      } catch { alert('Error al importar: archivo inválido'); }
    };
    reader.readAsText(file);
  }

  // ====================== RENDER ======================
  return (
    <div className="min-h-screen pb-20">
      {/* HEADER */}
      <div className="sticky top-0 z-30 border-b border-slate-800 bg-[#0a0e14]/95 backdrop-blur-md">
        <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 via-emerald-400 to-lime-400 flex items-center justify-center font-bold text-black text-sm shadow-lg shadow-cyan-500/20">SB</div>
            <div>
              <div className="font-bold tracking-wider text-sm">SIMULADOR BURSÁTIL SANTIAGUEÑO <span className="text-slate-500">// v4 FUSION</span></div>
              <div className="flex items-center gap-2 text-xs mono mt-0.5">
                <span className={`px-2 py-0.5 rounded ${estadoMercado === 'Abierto' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>● {estadoMercado}</span>
                <span className="text-slate-500">RONDA {rondaActual}/10</span>
                <span className="text-slate-600">|</span>
                <span className="text-cyan-400">TUNA ${getPrecioActual('TUNA')}</span>
                <span className="text-orange-400">CUTI ${getPrecioActual('CUTI')}</span>
                <span className="text-lime-400">ALGB ${getPrecioActual('ALGB')}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-[#151b26] rounded-lg p-1 border border-slate-800">
              <button onClick={() => setRondaActual(r => Math.max(1, r - 1))} className="px-2 py-1 text-xs hover:bg-slate-700 rounded transition">◀</button>
              <span className="px-3 mono text-sm font-bold">R{rondaActual}</span>
              <button onClick={() => setRondaActual(r => Math.min(10, r + 1))} className="px-2 py-1 text-xs hover:bg-slate-700 rounded transition">▶</button>
            </div>
            <button onClick={() => setEstadoMercado(s => s === 'Abierto' ? 'Pausa' : s === 'Pausa' ? 'Cerrado' : 'Abierto')} className="px-3 py-1.5 text-xs rounded-lg bg-[#151b26] border border-slate-700 hover:border-slate-600 transition">Estado: {estadoMercado}</button>
            <button onClick={() => setModoProyeccion(!modoProyeccion)} className="px-3 py-1.5 text-xs rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition">📺 Proyección</button>
            <button onClick={exportData} className="px-3 py-1.5 text-xs rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition">📥 Exportar</button>
            <label className="px-3 py-1.5 text-xs rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition cursor-pointer">
              📤 Importar
              <input type="file" accept=".json" onChange={importData} className="hidden" />
            </label>
            <button onClick={() => setShowResetModal(true)} className="px-3 py-1.5 text-xs rounded-lg bg-red-500/10 border border-red-500/40 text-red-400 hover:bg-red-500/20 transition">🗑 RESET</button>
          </div>
        </div>
        {/* TABS */}
        <div className="flex gap-1 px-4 py-2 bg-[#0f141f] border-b border-slate-800 overflow-x-auto scrollbar-thin">
          {['NOTICIAS', 'PRECIOS', 'JUGADORES', 'OPERACIONES', 'DASHBOARD', 'FICHAS'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 text-xs font-semibold rounded-lg border whitespace-nowrap transition ${tab === t ? 'bg-white text-black border-white' : 'bg-[#151b26] border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'}`}>
              {t} {t === 'NOTICIAS' && totalPendientes > 0 ? `(${totalPendientes})` : ''}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 max-w-[1600px] mx-auto">
        {/* ===== TAB NOTICIAS ===== */}
        {tab === 'NOTICIAS' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-[#151b26] border border-amber-500/20 rounded-xl p-3 flex gap-3 items-start">
              <div className="text-amber-400 text-lg">⚡</div>
              <div className="text-xs leading-relaxed text-slate-300 flex-1">
                <b className="text-amber-400">Impacto automático v4:</b> Al lanzar una noticia, los precios se actualizan solos y el patrimonio se recalcula al instante. Noticias multi-ticker afectan ambos precios. Pega URLs de YouTube para proyección con video. También podés crear noticias custom y revertir lanzamientos.
              </div>
              <button onClick={() => setShowCustomNoticia(!showCustomNoticia)} className="px-3 py-1.5 text-xs rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 transition whitespace-nowrap">➕ Noticia custom</button>
            </div>

            {showCustomNoticia && (
              <div className="bg-[#151b26] border border-amber-500/30 rounded-xl p-4 animate-slide-up space-y-3">
                <div className="font-bold text-sm text-amber-400">📝 CREAR NOTICIA PERSONALIZADA</div>
                <input value={customNoticia.titulo} onChange={e => setCustomNoticia({ ...customNoticia, titulo: e.target.value })} placeholder="Título de la noticia..." className="w-full px-3 py-2 rounded-lg bg-[#0a0e14] border border-slate-700 text-sm focus:border-amber-500/50 outline-none" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <select value={customNoticia.empresa} onChange={e => setCustomNoticia({ ...customNoticia, empresa: e.target.value })} className="px-2 py-2 rounded bg-[#0a0e14] border border-slate-700 text-xs">
                    <option value="TUNA">TUNA</option><option value="CUTI">CUTI</option><option value="ALGB">ALGB</option>
                  </select>
                  <select value={customNoticia.tipo} onChange={e => setCustomNoticia({ ...customNoticia, tipo: e.target.value })} className="px-2 py-2 rounded bg-[#0a0e14] border border-slate-700 text-xs">
                    <option value="alcista">Alcista 📈</option><option value="bajista">Bajista 📉</option>
                  </select>
                  <input value={customNoticia.youtubeUrl} onChange={e => setCustomNoticia({ ...customNoticia, youtubeUrl: e.target.value })} placeholder="YouTube URL (opcional)" className="px-2 py-2 rounded bg-[#0a0e14] border border-slate-700 text-xs mono" />
                </div>
                <textarea value={customNoticia.descripcion} onChange={e => setCustomNoticia({ ...customNoticia, descripcion: e.target.value })} placeholder="Descripción / guión del market maker (opcional)" className="w-full px-3 py-2 rounded-lg bg-[#0a0e14] border border-slate-700 text-xs resize-none" rows={2} />
                <div className="grid grid-cols-3 gap-2">
                  <label className="block"><span className="text-[10px] text-cyan-400 mono">TUNA %</span><input type="number" value={customNoticia.pctTUNA} onChange={e => setCustomNoticia({ ...customNoticia, pctTUNA: parseFloat(e.target.value) || 0 })} className="w-full px-2 py-1.5 rounded bg-[#0a0e14] border border-slate-700 text-xs mono" /></label>
                  <label className="block"><span className="text-[10px] text-orange-400 mono">CUTI %</span><input type="number" value={customNoticia.pctCUTI} onChange={e => setCustomNoticia({ ...customNoticia, pctCUTI: parseFloat(e.target.value) || 0 })} className="w-full px-2 py-1.5 rounded bg-[#0a0e14] border border-slate-700 text-xs mono" /></label>
                  <label className="block"><span className="text-[10px] text-lime-400 mono">ALGB %</span><input type="number" value={customNoticia.pctALGB} onChange={e => setCustomNoticia({ ...customNoticia, pctALGB: parseFloat(e.target.value) || 0 })} className="w-full px-2 py-1.5 rounded bg-[#0a0e14] border border-slate-700 text-xs mono" /></label>
                </div>
                <div className="flex gap-2">
                  <button onClick={crearNoticiaCustom} disabled={!customNoticia.titulo.trim()} className="px-4 py-2 rounded-lg bg-white text-black font-bold text-xs disabled:opacity-30 hover:bg-slate-100 transition">✓ Crear noticia</button>
                  <button onClick={() => setShowCustomNoticia(false)} className="px-4 py-2 rounded-lg bg-[#0a0e14] border border-slate-700 text-xs hover:border-slate-600 transition">Cancelar</button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex gap-2 flex-wrap">
                {['TODAS', 'PENDIENTES', 'LANZADAS', 'TUNA', 'CUTI', 'ALGB'].map(f => (
                  <button key={f} onClick={() => setFiltroNoticias(f)} className={`px-3 py-1 text-xs rounded-full border transition ${filtroNoticias === f ? 'bg-white text-black border-white' : 'bg-[#151b26] border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'}`}>{f}</button>
                ))}
              </div>
              <div className="text-xs mono text-slate-500">{noticiasFiltradas.length} noticias · {noticias.filter(n => n.lanzada).length} lanzadas · {totalPendientes} pendientes</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {noticiasFiltradas.map(noticia => {
                const ytId = parseYouTubeId(noticia.youtubeUrl);
                return (
                  <div key={noticia.id} className={`rounded-xl border p-3 bg-[#151b26] transition-all ${noticia.lanzada ? 'border-slate-700 opacity-60' : 'border-slate-700 hover:border-slate-600'} ${noticia.destacada ? 'ring-1 ring-amber-500/20' : ''}`}>
                    <div className="flex gap-1.5 flex-wrap mb-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${noticia.empresa === 'TUNA' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : noticia.empresa === 'CUTI' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' : 'bg-lime-500/10 text-lime-400 border-lime-500/30'}`}>{noticia.empresa}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${noticia.tipo === 'alcista' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{noticia.efectoTexto}</span>
                      {noticia.destacada && <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30">⚡ COMBO</span>}
                      {String(noticia.id).startsWith('custom_') && <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-400 border border-purple-500/30">CUSTOM</span>}
                    </div>
                    <div className="text-sm font-semibold leading-snug mb-2">{noticia.titulo}</div>
                    {noticia.descripcion && <div className="text-xs text-slate-500 mb-2 italic">{noticia.descripcion}</div>}
                    {ytId && (
                      <div className="relative mb-2 rounded-lg overflow-hidden border border-slate-700" style={{ aspectRatio: '16/9' }}>
                        <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} className="w-full h-full object-cover" alt="thumbnail" />
                        <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[9px] mono">▶ YouTube</div>
                      </div>
                    )}
                    <div className="mb-2">
                      <div className="text-[10px] text-slate-500 mb-1">YOUTUBE URL</div>
                      <div className="flex gap-1">
                        <input value={noticia.youtubeUrl} onChange={e => setNoticias(prev => prev.map(n => n.id === noticia.id ? { ...n, youtubeUrl: e.target.value } : n))} placeholder="https://youtube.com/watch?v=..." className="flex-1 px-2 py-1.5 rounded-lg bg-[#0a0e14] border border-slate-700 text-xs mono outline-none focus:border-cyan-500/50 transition" />
                        {ytId && <div className="w-10 h-7 rounded overflow-hidden border border-slate-700"><img src={`https://img.youtube.com/vi/${ytId}/default.jpg`} className="w-full h-full object-cover" /></div>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button disabled={noticia.lanzada} onClick={() => lanzarNoticia(noticia)} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition ${noticia.lanzada ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-white text-black hover:bg-slate-100'}`}>
                        {noticia.lanzada ? `✓ LANZADA R${noticia.rondaLanzamiento}` : '▶ LANZAR + IMPACTO'}
                      </button>
                      {noticia.lanzada && <button onClick={() => revertirNoticia(noticia)} className="px-3 py-2.5 rounded-lg text-xs bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition" title="Revertir">↩</button>}
                      {String(noticia.id).startsWith('custom_') && !noticia.lanzada && <button onClick={() => eliminarNoticia(noticia.id)} className="px-3 py-2.5 rounded-lg text-xs bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition" title="Eliminar">🗑</button>}
                    </div>
                    {noticia.lanzada && <div className="mt-2 text-[10px] mono text-slate-500">R{noticia.rondaLanzamiento} · {noticia.timestamp ? new Date(noticia.timestamp).toLocaleTimeString() : ''}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== TAB PRECIOS ===== */}
        {tab === 'PRECIOS' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 animate-fade-in">
            <div className="xl:col-span-2 bg-[#151b26] rounded-xl border border-slate-800 p-4">
              <div className="font-bold text-sm mb-3">📊 PRECIOS POR RONDA — Auto-actualizados por noticias 📰</div>
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-xs mono">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-800">
                      <th className="text-left p-2">R</th>
                      <th className="text-left p-2 text-cyan-400">TUNA</th>
                      <th className="text-left p-2 text-orange-400">CUTI</th>
                      <th className="text-left p-2 text-lime-400">ALGB</th>
                    </tr>
                  </thead>
                  <tbody>
                    {precios.map(p => (
                      <tr key={p.ronda} className={`border-b border-slate-800/50 transition ${p.ronda === rondaActual ? 'bg-cyan-500/5' : ''} ${flashRonda === p.ronda ? 'animate-flash' : ''}`}>
                        <td className="p-2 font-bold">{p.ronda}{p.ronda === rondaActual ? ' ●' : ''}</td>
                        {TICKERS.map(t => (
                          <td key={t} className="p-1">
                            <div className="flex items-center gap-1">
                              <input type="number" value={p[t] ?? ''} onChange={e => actualizarPrecio(p.ronda, t, e.target.value)} className="w-20 px-2 py-1 rounded bg-[#0a0e14] border border-slate-700 focus:border-cyan-500/50 outline-none transition" />
                              {p.mod?.[t] && <span title={`Noticia #${p.mod[t]}`}>📰</span>}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-[#151b26] rounded-xl border border-slate-800 p-4">
                <div className="text-xs font-bold mb-3">📈 EVOLUCIÓN PRECIOS</div>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={preciosChart ?? []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="ronda" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip contentStyle={{ background: '#0a0e14', border: '1px solid #334155', borderRadius: '8px' }} />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Line type="monotone" dataKey="TUNA" stroke={TICKER_COLORS.TUNA} strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="CUTI" stroke={TICKER_COLORS.CUTI} strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="ALGB" stroke={TICKER_COLORS.ALGB} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-[#151b26] rounded-xl border border-slate-800 p-3">
                <div className="text-xs font-bold mb-2">📋 LOG DE ACTIVIDAD</div>
                <div className="h-[220px] overflow-y-auto space-y-1 mono text-[10px] scrollbar-thin">
                  {log.map((l, i) => (
                    <div key={i} className={`border-b border-slate-800/50 py-1 ${l.tipo === 'ALCISTA' ? 'text-emerald-400' : l.tipo === 'BAJISTA' ? 'text-red-400' : 'text-slate-400'}`}>
                      {l.ts ? new Date(l.ts).toLocaleTimeString() : ''} {l.msg}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== TAB JUGADORES ===== */}
        {tab === 'JUGADORES' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-[#151b26] rounded-xl border border-slate-800 p-4 flex gap-2 flex-wrap">
              <input value={nuevoJugador.nombre} onChange={e => setNuevoJugador({ ...nuevoJugador, nombre: e.target.value })} placeholder="Nombre del jugador" className="flex-1 min-w-[200px] px-3 py-2 rounded-lg bg-[#0a0e14] border border-slate-700 text-sm focus:border-cyan-500/50 outline-none transition" onKeyDown={e => { if (e.key === 'Enter' && nuevoJugador.nombre.trim()) { setJugadores(j => [...j, { id: Date.now().toString(), nombre: nuevoJugador.nombre.trim(), capitalInicial: parseFloat(nuevoJugador.capital) || 10000 }]); setNuevoJugador({ nombre: '', capital: 10000 }); } }} />
              <input type="number" value={nuevoJugador.capital} onChange={e => setNuevoJugador({ ...nuevoJugador, capital: e.target.value })} className="w-32 px-3 py-2 rounded-lg bg-[#0a0e14] border border-slate-700 text-sm mono focus:border-cyan-500/50 outline-none transition" />
              <button onClick={() => { if (!nuevoJugador.nombre.trim()) return; setJugadores(j => [...j, { id: Date.now().toString(), nombre: nuevoJugador.nombre.trim(), capitalInicial: parseFloat(nuevoJugador.capital) || 10000 }]); setNuevoJugador({ nombre: '', capital: 10000 }); setLog(l => [{ ts: Date.now(), tipo: 'INFO', msg: `👤 Jugador agregado: ${nuevoJugador.nombre}` }, ...l]); }} className="px-4 py-2 rounded-lg bg-white text-black font-bold text-sm hover:bg-slate-100 transition">+ Agregar</button>
            </div>
            <div className="bg-[#151b26] rounded-xl border border-slate-800 overflow-x-auto scrollbar-thin">
              <table className="w-full text-xs mono">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800">
                    <th className="text-left p-3">Jugador</th>
                    <th className="text-right p-3">Cap. Inicial</th>
                    <th className="text-right p-3">Efectivo</th>
                    <th className="text-right p-3 text-cyan-400">TUNA</th>
                    <th className="text-right p-3 text-orange-400">CUTI</th>
                    <th className="text-right p-3 text-lime-400">ALGB</th>
                    <th className="text-right p-3">Cartera</th>
                    <th className="text-right p-3">Div CUTI</th>
                    <th className="text-right p-3">Patrimonio</th>
                    <th className="text-right p-3">Rendimiento</th>
                  </tr>
                </thead>
                <tbody>
                  {jugadoresCalc.map(j => (
                    <tr key={j.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition">
                      <td className="p-3 font-bold">{j.nombre}</td>
                      <td className="p-3 text-right text-slate-400">{fmtMoney(j.capitalInicial)}</td>
                      <td className="p-3 text-right text-emerald-400">{fmtMoney(j.efectivo)}</td>
                      <td className="p-3 text-right">{j.TUNA}</td>
                      <td className="p-3 text-right">{j.CUTI}</td>
                      <td className="p-3 text-right">{j.ALGB}</td>
                      <td className="p-3 text-right">{fmtMoney(j.valorCartera)}</td>
                      <td className="p-3 text-right text-amber-400">{j.divCUTI > 0 ? fmtMoney(j.divCUTI) : '—'}</td>
                      <td className="p-3 text-right font-bold text-base">{fmtMoney(j.patrimonio)}</td>
                      <td className={`p-3 text-right font-bold ${j.rendimiento >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmtPct(j.rendimiento)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-xs text-slate-500 mono">
              💡 Efectivo = CapitalInicial − Σ(compras) + Σ(ventas) hasta ronda actual. Dividendos CUTI: 4.2% sobre tenencia valuada. Patrimonio = Efectivo + Cartera valuada a precio actual.
            </div>
          </div>
        )}

        {/* ===== TAB OPERACIONES ===== */}
        {tab === 'OPERACIONES' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 animate-fade-in">
            <div className="bg-[#151b26] rounded-xl border border-slate-800 p-4">
              <div className="text-xs font-bold mb-3">⚡ CARGAR OPERACIÓN</div>
              <div className="space-y-2">
                <select value={nuevaOp.jugador} onChange={e => setNuevaOp({ ...nuevaOp, jugador: e.target.value })} className="w-full px-2 py-2 rounded bg-[#0a0e14] border border-slate-700 text-xs focus:border-cyan-500/50 outline-none">
                  <option value="">Seleccionar jugador...</option>
                  {jugadores.map(j => <option key={j.id} value={j.nombre}>{j.nombre}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <select value={nuevaOp.empresa} onChange={e => setNuevaOp({ ...nuevaOp, empresa: e.target.value, precio: getPrecioParaRonda(parseInt(nuevaOp.ronda), e.target.value) })} className="px-2 py-2 rounded bg-[#0a0e14] border border-slate-700 text-xs focus:border-cyan-500/50 outline-none">
                    <option value="TUNA">TUNA</option><option value="CUTI">CUTI</option><option value="ALGB">ALGB</option>
                  </select>
                  <select value={nuevaOp.tipo} onChange={e => setNuevaOp({ ...nuevaOp, tipo: e.target.value })} className="px-2 py-2 rounded bg-[#0a0e14] border border-slate-700 text-xs focus:border-cyan-500/50 outline-none">
                    <option value="Compra">Compra</option><option value="Venta">Venta</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" value={nuevaOp.cantidad} onChange={e => setNuevaOp({ ...nuevaOp, cantidad: e.target.value })} placeholder="Cantidad" className="px-2 py-2 rounded bg-[#0a0e14] border border-slate-700 text-xs mono focus:border-cyan-500/50 outline-none" />
                  <input type="number" value={nuevaOp.precio} onChange={e => setNuevaOp({ ...nuevaOp, precio: e.target.value })} placeholder="Precio unit." className="px-2 py-2 rounded bg-[#0a0e14] border border-slate-700 text-xs mono focus:border-cyan-500/50 outline-none" />
                </div>
                <div className="text-[10px] mono text-slate-500">Total: {fmtMoney((parseInt(nuevaOp.cantidad) || 0) * (parseFloat(nuevaOp.precio) || 0))}</div>
                <button onClick={() => {
                  if (!nuevaOp.jugador) return alert('⚠ Seleccioná un jugador');
                  const op = { id: Date.now().toString(), ronda: parseInt(rondaActual), jugador: nuevaOp.jugador, empresa: nuevaOp.empresa, tipo: nuevaOp.tipo, cantidad: parseInt(nuevaOp.cantidad) || 1, precio: parseFloat(nuevaOp.precio) || getPrecioParaRonda(rondaActual, nuevaOp.empresa) };
                  setOperaciones(o => [...o, op]);
                  setLog(l => [{ ts: Date.now(), tipo: 'INFO', msg: `💼 R${rondaActual} ${op.tipo} ${op.jugador}: ${op.cantidad} ${op.empresa} @ $${op.precio}` }, ...l]);
                }} className="w-full py-2.5 rounded-lg bg-white text-black font-bold text-sm hover:bg-slate-100 transition">Cargar operación</button>
              </div>
            </div>
            <div className="xl:col-span-2 bg-[#151b26] rounded-xl border border-slate-800 p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="text-xs font-bold">📋 OPERACIONES ({operaciones.length})</div>
                {operaciones.length > 0 && <button onClick={() => { if (confirm('¿Borrar todas las operaciones?')) { setOperaciones([]); setLog(l => [{ ts: Date.now(), tipo: 'INFO', msg: '🗑 Todas las operaciones eliminadas' }, ...l]); } }} className="text-xs text-red-400 hover:text-red-300 transition">Limpiar todas</button>}
              </div>
              <div className="max-h-[500px] overflow-y-auto scrollbar-thin">
                <table className="w-full text-[11px] mono">
                  <thead><tr className="text-slate-500 sticky top-0 bg-[#151b26]"><th className="text-left p-1">R</th><th className="text-left p-1">Jugador</th><th className="text-left p-1">Emp</th><th className="text-left p-1">Tipo</th><th className="text-right p-1">Cant</th><th className="text-right p-1">Precio</th><th className="text-right p-1">Total</th><th className="p-1"></th></tr></thead>
                  <tbody>
                    {[...operaciones].reverse().map(op => (
                      <tr key={op.id} className={`border-b border-slate-800/30 hover:bg-slate-800/20 transition ${op.tipo === 'Compra' ? 'text-emerald-400/80' : 'text-orange-400/80'}`}>
                        <td className="p-1">{op.ronda}</td>
                        <td className="p-1">{op.jugador}</td>
                        <td className="p-1">{op.empresa}</td>
                        <td className="p-1">{op.tipo}</td>
                        <td className="p-1 text-right">{op.cantidad}</td>
                        <td className="p-1 text-right">${op.precio}</td>
                        <td className="p-1 text-right">{fmtMoney(op.cantidad * op.precio)}</td>
                        <td className="p-1"><button onClick={() => setOperaciones(o => o.filter(x => x.id !== op.id))} className="text-red-400/50 hover:text-red-400 transition text-[10px]">✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===== TAB DASHBOARD ===== */}
        {tab === 'DASHBOARD' && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: '👥 Total jugadores', val: jugadores.length },
                { label: '💰 Patrimonio total', val: fmtMoney(jugadoresCalc.reduce((s, j) => s + j.patrimonio, 0)) },
                { label: '🏆 Líder', val: [...jugadoresCalc].sort((a, b) => b.patrimonio - a.patrimonio)[0]?.nombre || '—' },
                { label: '📊 Ronda actual', val: `R${rondaActual} · $${getPrecioActual('TUNA')}/${getPrecioActual('CUTI')}/${getPrecioActual('ALGB')}` }
              ].map((k, i) => (
                <div key={i} className="bg-[#151b26] border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition">
                  <div className="text-[10px] text-slate-500">{k.label}</div>
                  <div className="font-bold mono mt-1 text-lg">{k.val}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="bg-[#151b26] border border-slate-800 rounded-xl p-4">
                <div className="text-xs font-bold mb-2">🏆 RANKING PATRIMONIO</div>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[...jugadoresCalc].sort((a, b) => b.patrimonio - a.patrimonio)}>
                      <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                      <XAxis dataKey="nombre" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip contentStyle={{ background: '#0a0e14', border: '1px solid #334155', borderRadius: '8px' }} />
                      <Bar dataKey="patrimonio" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-[#151b26] border border-slate-800 rounded-xl p-4">
                <div className="text-xs font-bold mb-2">📈 EVOLUCIÓN DEL PATRIMONIO</div>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={evolucion ?? []}>
                      <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                      <XAxis dataKey="ronda" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip contentStyle={{ background: '#0a0e14', border: '1px solid #334155', borderRadius: '8px' }} />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      {jugadores.map((j, i) => (
                        <Line key={j.nombre} type="monotone" dataKey={j.nombre} stroke={PLAYER_COLORS[i % PLAYER_COLORS.length]} strokeWidth={2} dot={false} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="bg-[#151b26] border border-slate-800 rounded-xl p-4">
              <div className="text-xs font-bold mb-3">🥇 TABLA DE POSICIONES</div>
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-xs mono">
                  <thead><tr className="text-slate-500 border-b border-slate-800"><th className="text-left p-2">#</th><th className="text-left p-2">Jugador</th><th className="text-right p-2">Patrimonio</th><th className="text-right p-2">Rendimiento</th><th className="text-right p-2">Efectivo</th><th className="text-right p-2">Cartera</th></tr></thead>
                  <tbody>
                    {[...jugadoresCalc].sort((a, b) => b.patrimonio - a.patrimonio).map((j, i) => (
                      <tr key={j.id} className={`border-b border-slate-800/50 ${i === 0 ? 'bg-amber-500/5' : ''}`}>
                        <td className="p-2 font-bold">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
                        <td className="p-2 font-bold">{j.nombre}</td>
                        <td className="p-2 text-right font-bold">{fmtMoney(j.patrimonio)}</td>
                        <td className={`p-2 text-right font-bold ${j.rendimiento >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmtPct(j.rendimiento)}</td>
                        <td className="p-2 text-right text-emerald-400">{fmtMoney(j.efectivo)}</td>
                        <td className="p-2 text-right">{fmtMoney(j.valorCartera)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===== TAB FICHAS ===== */}
        {tab === 'FICHAS' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
            {TICKERS.map(t => {
              const emp = EMPRESAS[t];
              return (
                <div key={t} className="bg-[#151b26] border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl" style={{ backgroundColor: emp.color + '15', border: `1px solid ${emp.color}30` }}>{emp.logo}</div>
                    <div>
                      <div className="font-bold text-lg" style={{ color: emp.color }}>{emp.nombre}</div>
                      <div className="text-xs text-slate-500">{t} · {emp.sector}</div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">{emp.desc}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-[#0a0e14] rounded-lg p-2 border border-slate-800"><div className="text-[10px] text-slate-500">Precio actual</div><div className="font-bold mono mt-0.5" style={{ color: emp.color }}>${getPrecioActual(t)}</div></div>
                    <div className="bg-[#0a0e14] rounded-lg p-2 border border-slate-800"><div className="text-[10px] text-slate-500">Market Cap</div><div className="font-bold mono mt-0.5">{emp.cap}</div></div>
                    <div className="bg-[#0a0e14] rounded-lg p-2 border border-slate-800"><div className="text-[10px] text-slate-500">P/E Ratio</div><div className="font-bold mono mt-0.5">{emp.pe}</div></div>
                    <div className="bg-[#0a0e14] rounded-lg p-2 border border-slate-800"><div className="text-[10px] text-slate-500">Crecimiento</div><div className="font-bold mono mt-0.5 text-emerald-400">{emp.crecimiento}</div></div>
                    <div className="bg-[#0a0e14] rounded-lg p-2 border border-slate-800"><div className="text-[10px] text-slate-500">Dividendo</div><div className="font-bold mono mt-0.5">{emp.dividendo}</div></div>
                    <div className="bg-[#0a0e14] rounded-lg p-2 border border-slate-800"><div className="text-[10px] text-slate-500">Volatilidad</div><div className="font-bold mono mt-0.5">{emp.vol}</div></div>
                  </div>
                  <div className="mt-3 bg-red-500/5 border border-red-500/20 rounded-lg p-2">
                    <div className="text-[10px] text-red-400 font-bold">⚠ RIESGO</div>
                    <div className="text-xs text-slate-400 mt-0.5">{emp.riesgo}</div>
                  </div>
                  <div className="mt-2 text-[10px] text-slate-600 mono">📍 {emp.origen}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RESET MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowResetModal(false)}>
          <div className="bg-[#151b26] border border-slate-700 rounded-xl p-6 max-w-md w-full animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="font-bold text-lg mb-2">¿Borrar toda la partida?</div>
            <div className="text-xs text-slate-400 mb-4">Restaura jugadores demo, operaciones demo, precios (R1 200/100/250), log y noticias. Los links de YouTube se resetean.</div>
            <label className="flex gap-2 text-xs mb-4 cursor-pointer"><input type="checkbox" checked={resetConfirm} onChange={e => setResetConfirm(e.target.checked)} /> Entiendo que se perderán todos los cambios</label>
            <div className="flex gap-2">
              <button onClick={() => setShowResetModal(false)} className="flex-1 py-2 rounded-lg bg-[#0a0e14] border border-slate-700 text-sm hover:border-slate-600 transition">Cancelar</button>
              <button disabled={!resetConfirm} onClick={handleReset} className="flex-1 py-2 rounded-lg bg-red-500 text-white font-bold text-sm disabled:opacity-30 hover:bg-red-600 transition">Resetear</button>
            </div>
          </div>
        </div>
      )}

      {/* VIDEO MODAL */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col animate-fade-in">
          <div className="p-3 flex justify-between items-center border-b border-slate-800 bg-[#0a0e14]">
            <div className="flex gap-2 items-center min-w-0">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-black whitespace-nowrap">{showVideoModal.efectoTexto}</span>
              <span className="text-sm font-bold truncate">{showVideoModal.titulo}</span>
            </div>
            <button onClick={() => setShowVideoModal(null)} className="px-3 py-1 rounded bg-slate-800 text-xs hover:bg-slate-700 transition">✕ Cerrar</button>
          </div>
          <div className="flex-1 bg-black flex items-center justify-center p-4">
            {parseYouTubeId(showVideoModal.youtubeUrl) ? (
              <iframe width="100%" height="100%" style={{ maxWidth: '1100px', aspectRatio: '16/9' }} src={`https://www.youtube.com/embed/${parseYouTubeId(showVideoModal.youtubeUrl)}?autoplay=1`} frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen></iframe>
            ) : (
              <div className="text-center text-slate-400">
                <div className="text-6xl mb-4">📺</div>
                <div className="text-lg font-bold mb-2">{showVideoModal.titulo}</div>
                <div className="text-sm">Sin video cargado. Pega el link YouTube en la tarjeta.</div>
                <div className="text-xs mt-3 text-emerald-400">✓ El precio ya fue actualizado automáticamente.</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* IMPACT MODAL */}
      {showImpacto && (
        <div className="fixed bottom-4 right-4 z-40 w-[380px] max-w-[calc(100vw-2rem)] bg-[#151b26] border border-emerald-500/30 rounded-xl shadow-2xl p-4 animate-slide-up">
          <div className="flex justify-between mb-2">
            <div className="font-bold text-sm">💥 Impacto aplicado — R{showImpacto.ronda}</div>
            <button onClick={() => setShowImpacto(null)} className="text-slate-500 hover:text-white transition">✕</button>
          </div>
          <div className="text-xs text-slate-300 mb-3">{showImpacto.noticia.titulo}</div>
          <div className="space-y-1 mb-3">
            {showImpacto.impactos.map((imp, i) => (
              <div key={i} className="flex justify-between text-xs mono bg-[#0a0e14] rounded p-2 border border-slate-800">
                <span style={{ color: TICKER_COLORS[imp.ticker] }}>{imp.ticker} {imp.pct > 0 ? '+' : ''}{imp.pct}%</span>
                <span className="text-slate-400">${imp.viejo} → <span className="font-bold text-white">${imp.nuevo}</span></span>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-slate-500 mb-1">IMPACTO EN PATRIMONIO:</div>
          {showImpacto.impactosPatrimonio.map(ip => (
            <div key={ip.jugador} className="flex justify-between text-xs mono py-0.5">
              <span className="text-slate-300">{ip.jugador}</span>
              <span className={ip.delta >= 0 ? 'text-emerald-400' : 'text-red-400'}>{ip.delta >= 0 ? '+' : ''}{fmtMoney(ip.delta)}</span>
            </div>
          ))}
          <button onClick={() => revertirNoticia(showImpacto.noticia)} className="w-full mt-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition">↩ Revertir esta noticia</button>
        </div>
      )}

      {/* PROJECTION MODE */}
      {modoProyeccion && (
        <div className="fixed inset-0 z-[60] bg-[#0a0e14] p-6 overflow-auto animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <div className="text-2xl font-bold">
              RONDA {rondaActual} —
              <span className="text-cyan-400"> TUNA ${getPrecioActual('TUNA')}</span>
              <span className="text-orange-400"> | CUTI ${getPrecioActual('CUTI')}</span>
              <span className="text-lime-400"> | ALGB ${getPrecioActual('ALGB')}</span>
            </div>
            <button onClick={() => setModoProyeccion(false)} className="px-4 py-2 rounded bg-white text-black font-bold hover:bg-slate-100 transition">✕ Salir</button>
          </div>
          <div className="grid grid-cols-1 gap-3 max-w-3xl mx-auto">
            {[...jugadoresCalc].sort((a, b) => b.patrimonio - a.patrimonio).map((j, i) => (
              <div key={j.id} className={`flex justify-between items-center p-5 rounded-xl border transition ${i === 0 ? 'bg-amber-500/5 border-amber-500/30' : 'bg-[#151b26] border-slate-800'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
                  <span className="font-bold text-lg">{j.nombre}</span>
                </div>
                <div className="text-right">
                  <div className="mono text-xl font-bold">{fmtMoney(j.patrimonio)}</div>
                  <div className={`text-sm mono ${j.rendimiento >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmtPct(j.rendimiento)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
