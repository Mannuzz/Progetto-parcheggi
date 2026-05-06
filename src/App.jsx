import React from 'react'

import { Routes, Route, Navigate } from 'react-router-dom'

import { useAuth } from './context/AuthContext'

import { supabase } from './supabase'

import CityParkingMap from './components/CityParkingMap'

import Header from './components/layout/header'

import Sidebar from './components/layout/sidebar'

import AdminDashboard from './pages/admin/AdminDashboard'

import GestioneStalli from './pages/admin/GestioneStalli'

import GestioneZone from './pages/admin/GestioneZone'

import GestioneUtenti from './pages/admin/GestioneUtenti'

import Incassi from './pages/admin/incassi'

import BookParking from './pages/user/BookParking'

import Vehicles from './pages/user/vehicles'

import Profile from './pages/user/profile'
 
const s = {

  wrap: { display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', background:'#f1f5f9' },

  box: { background:'white', borderRadius:'12px', padding:'2rem', width:'380px', boxShadow:'0 4px 24px rgba(0,0,0,0.12)' },

  tabs: { display:'flex', borderBottom:'2px solid #e2e8f0', marginBottom:'1.5rem' },

  tab: (a) => ({ flex:1, padding:'0.6rem', border:'none', cursor:'pointer', background:'none', fontWeight:'bold', color:a?'#3b82f6':'#94a3b8', borderBottom:a?'2px solid #3b82f6':'none', marginBottom:'-2px', fontSize:'0.9rem' }),

  inp: { padding:'0.5rem 0.75rem', borderRadius:'6px', border:'1px solid #cbd5e1', fontSize:'0.9rem', width:'100%', marginBottom:'0.75rem', boxSizing:'border-box' },

  btnBlu: { padding:'0.65rem', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'bold', fontSize:'0.9rem', width:'100%', background:'#3b82f6', color:'white' },

  btnVerde: { padding:'0.65rem', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'bold', fontSize:'0.9rem', width:'100%', background:'#10b981', color:'white' },

  err: { color:'#ef4444', fontSize:'0.85rem', textAlign:'center', marginBottom:'0.75rem' },

}
 
function LoginScreen() {

  const [isLogin, setIsLogin] = React.useState(true)

  const [errore, setErrore] = React.useState('')

  const [loading, setLoading] = React.useState(false)

  const { login, register } = useAuth()
 
  const handleLogin = async (e) => {

    e.preventDefault(); setErrore(''); setLoading(true)

    try { await login(e.target.email.value, e.target.password.value) }

    catch { setErrore('Email o password non corretti.') }

    finally { setLoading(false) }

  }
 
  const handleRegister = async (e) => {

    e.preventDefault(); setErrore(''); setLoading(true)

    try {

      await register(e.target.email.value, e.target.password.value, e.target.nome.value, e.target.cognome.value)

      alert('Account creato! Ora accedi.')

      setIsLogin(true)

    } catch (err) { setErrore(err.message || 'Errore durante la registrazione.') }

    finally { setLoading(false) }

  }
 
  return (
<div style={s.wrap}>
<div style={s.box}>
<h2 style={{ textAlign:'center', color:'#1e3a5f', marginBottom:'0.25rem', fontSize:'1.4rem' }}>Parcheggi Brescia</h2>
<p style={{ textAlign:'center', color:'#64748b', fontSize:'0.85rem', marginBottom:'1.5rem' }}>Sistema parcheggi intelligenti</p>
<div style={s.tabs}>
<button style={s.tab(isLogin)} onClick={() => { setIsLogin(true); setErrore('') }}>Accedi</button>
<button style={s.tab(!isLogin)} onClick={() => { setIsLogin(false); setErrore('') }}>Registrati</button>
</div>

        {isLogin ? (
<form onSubmit={handleLogin} autoComplete="on">
<input style={s.inp} type="email" name="email" placeholder="Email" autoComplete="email" required />
<input style={s.inp} type="password" name="password" placeholder="Password" autoComplete="current-password" required />

            {errore && <div style={s.err}>{errore}</div>}
<button style={s.btnBlu} type="submit" disabled={loading}>{loading ? 'Accesso in corso...' : 'Accedi'}</button>
</form>

        ) : (
<form onSubmit={handleRegister} autoComplete="on">
<div style={{ display:'flex', gap:'0.5rem' }}>
<input style={{ ...s.inp, flex:1 }} type="text" name="nome" placeholder="Nome" autoComplete="given-name" required />
<input style={{ ...s.inp, flex:1 }} type="text" name="cognome" placeholder="Cognome" autoComplete="family-name" required />
</div>
<input style={s.inp} type="email" name="email" placeholder="Email" autoComplete="email" required />
<input style={s.inp} type="password" name="password" placeholder="Password" autoComplete="new-password" required />

            {errore && <div style={s.err}>{errore}</div>}
<button style={s.btnVerde} type="submit" disabled={loading}>{loading ? 'Registrazione in corso...' : 'Crea Account'}</button>
</form>

        )}
</div>
</div>

  )

}
 
const stile = {

  body: { display:'flex', height:'calc(100vh - 56px)' },

  sidebar: { width:'280px', background:'white', borderRight:'1px solid #e2e8f0', padding:'1rem', overflowY:'auto', display:'flex', flexDirection:'column', gap:'0.75rem' },

  mappa: { flex:1 },

  card: { background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px', padding:'0.75rem' },

  titolo: { fontSize:'0.75rem', fontWeight:'bold', color:'#64748b', textTransform:'uppercase', marginBottom:'0.5rem' },

  filtroRiga: { display:'flex', flexDirection:'column', gap:'0.3rem', marginBottom:'0.5rem' },

  label: { fontSize:'0.8rem', color:'#475569' },

  select: { padding:'0.4rem', borderRadius:'6px', border:'1px solid #cbd5e1', fontSize:'0.85rem', width:'100%' },

  input: { padding:'0.4rem', borderRadius:'6px', border:'1px solid #cbd5e1', fontSize:'0.85rem', width:'100%' },

  btn: { padding:'0.5rem 1rem', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'bold', fontSize:'0.85rem' },

  btnBlu2: { background:'#3b82f6', color:'white' },

  btnRosso: { background:'#ef4444', color:'white' },

  btnVerde2: { background:'#10b981', color:'white' },

  legenda: { display:'flex', flexDirection:'column', gap:'0.3rem' },

  legendaRiga: { display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.8rem' },

  pallino: (colore) => ({ width:'12px', height:'12px', borderRadius:'50%', background:colore, flexShrink:0 }),

  badge: (col) => ({ background:col, color:'white', padding:'2px 8px', borderRadius:'12px', fontSize:'0.75rem' }),

}
 
function VistaUtente() {

  const { user } = useAuth()

  const [posti, setPosti] = React.useState([])

  const [postiFiltrati, setPostiFiltrati] = React.useState([])

  const [loading, setLoading] = React.useState(true)

  const [veicoli, setVeicoli] = React.useState([])

  const [veicoloSelezionato, setVeicoloSelezionato] = React.useState('')

  const [filtroStato, setFiltroStato] = React.useState('tutti')

  const [filtroTipo, setFiltroTipo] = React.useState('tutti')

  const [filtroPagamento, setFiltroPagamento] = React.useState('tutti')

  const [filtroElettrico, setFiltroElettrico] = React.useState(false)

  const [mostraVeicoli, setMostraVeicoli] = React.useState(false)

  const [nuovaTarga, setNuovaTarga] = React.useState('')

  const [nuovoTipo, setNuovoTipo] = React.useState('auto')

  const [nuovaAlimentazione, setNuovaAlimentazione] = React.useState('benzina')

  const [nuovoHeavy, setNuovoHeavy] = React.useState(false)

  const [nuovoDisabili, setNuovoDisabili] = React.useState(false)

  const [nuovoResidente, setNuovoResidente] = React.useState(false)
 
  // ✅ NUOVO — stati prenotazioni

  const [prenotazioni, setPrenotazioni] = React.useState([])

  const [prenotazioniConcluse, setPrenotazioniConcluse] = React.useState([])

  const [costiLive, setCostiLive] = React.useState({})

  const [vistaMain, setVistaMain] = React.useState('mappa') // 'mappa' | 'storico'

  const intervalCosti = React.useRef(null)
 
  React.useEffect(() => { fetchPosti(); fetchVeicoli(); fetchPrenotazioni(); fetchPrenotazioniConcluse() }, [])
 
  React.useEffect(() => {

    aggiornaCostiLive(prenotazioni)

    clearInterval(intervalCosti.current)

    intervalCosti.current = setInterval(() => aggiornaCostiLive(prenotazioni), 60000)

    return () => clearInterval(intervalCosti.current)

  }, [prenotazioni])
 
  React.useEffect(() => {

    const channel = supabase

      .channel('posti_realtime')

      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'posti' }, () => fetchPosti())

      .on('postgres_changes', { event:'INSERT', schema:'public', table:'prenotazioni' }, () => { fetchPosti(); fetchPrenotazioni() })

      .subscribe()

    return () => supabase.removeChannel(channel)

  }, [])
 
  React.useEffect(() => {

    let f = [...posti]

    if (filtroStato !== 'tutti') f = f.filter(p => p.stato_mappa === filtroStato)

    if (filtroTipo !== 'tutti') f = f.filter(p => p.tipologia_nome === filtroTipo)

    if (filtroPagamento === 'gratuito') f = f.filter(p => p.gratuito)

    if (filtroPagamento === 'pagamento') f = f.filter(p => p.sempre_a_pagamento)

    if (filtroElettrico) f = f.filter(p => p.solo_elettriche)

    if (veicoloSelezionato) {

      const v = veicoli.find(x => x.id.toString() === veicoloSelezionato)

      if (v) {

        if (!v.ha_permesso_disabili) f = f.filter(p => !p.richiede_permesso_disabili)

        if (!v.ha_permesso_residente) f = f.filter(p => !p.richiede_permesso_residente)

        if (v.alimentazione === 'gpl') f = f.filter(p => p.accetta_gpl !== false)

        if (v.alimentazione !== 'elettrica') f = f.filter(p => !p.solo_elettriche)

      }

    }

    setPostiFiltrati(f)

  }, [filtroStato, filtroTipo, filtroPagamento, filtroElettrico, veicoloSelezionato, posti, veicoli])
 
  const fetchPosti = async () => {

    setLoading(true)

    const { data } = await supabase.from('v_posti_mappa').select('*')

    setPosti(data || [])

    setLoading(false)

  }
 
  const fetchVeicoli = async () => {

    const { data } = await supabase.from('veicoli').select('*').eq('user_id', user.id)

    setVeicoli(data || [])

  }
 
  // ✅ NUOVO

  const fetchPrenotazioni = async () => {

    await supabase.rpc('gestisci_scadenze')

    const { data } = await supabase

      .from('prenotazioni')

      .select('id, stato, orario_ingresso, orario_uscita_previsto, costo_totale, posto_id, veicoli(targa), posti(codice_posto, tariffa_oraria, gratuito, zone(nome))')

      .eq('user_id', user.id)

      .eq('stato', 'attiva')

      .order('orario_ingresso', { ascending: false })

    setPrenotazioni(data || [])

  }
 
  // ✅ NUOVO

  const fetchPrenotazioniConcluse = async () => {

    const { data } = await supabase

      .from('prenotazioni')

      .select('id, stato, orario_ingresso, orario_uscita_effettivo, costo_totale, posto_id, veicoli(targa), posti(codice_posto, tariffa_oraria, zone(nome))')

      .eq('user_id', user.id)

      .eq('stato', 'conclusa')

      .order('orario_uscita_effettivo', { ascending: false })

      .limit(20)

    setPrenotazioniConcluse(data || [])

  }
 
  // ✅ NUOVO

  const aggiornaCostiLive = (lista) => {

    const now = new Date()

    const nuovi = {}

    lista.forEach(p => {

      const tariffa = Number(p.posti?.tariffa_oraria) || 0

      if (tariffa === 0) return

      const ingresso = new Date(p.orario_ingresso)

      if (now < ingresso) return

      const ore = (now - ingresso) / 3600000

      nuovi[p.id] = Math.round(Math.ceil(Math.max(ore, 0.001)) * tariffa * 100) / 100

    })

    setCostiLive(nuovi)

  }
 
  // ✅ NUOVO

  const tempoRimanente = (uscita) => {

    if (!uscita) return null

    const diff = new Date(uscita) - new Date()

    if (diff <= 0) return { testo: 'SCADUTA', colore: '#ef4444' }

    const ore = Math.floor(diff / 3600000)

    const min = Math.floor((diff % 3600000) / 60000)

    const colore = diff < 900000 ? '#ef4444' : diff < 1800000 ? '#f59e0b' : '#10b981'

    return { testo: ore > 0 ? `${ore}h ${min}m rimanenti` : `${min}m rimanenti`, colore }

  }
 
  // ✅ NUOVO

  const checkout = async (p) => {

    if (!confirm('Confermi il checkout?')) return

    const now = new Date()

    const tariffa = Number(p.posti?.tariffa_oraria) || 0

    const ore = (now - new Date(p.orario_ingresso)) / 3600000

    const oreArr = Math.ceil(Math.max(ore, 0.001))

    const costo = Math.round(oreArr * tariffa * 100) / 100

    await supabase.from('prenotazioni').update({ orario_uscita_effettivo: now.toISOString(), costo_totale: costo, stato: 'conclusa' }).eq('id', p.id)

    await supabase.from('posti').update({ stato: 'libero' }).eq('id', p.posto_id)

    if (tariffa > 0) {

      await supabase.from('incassi').insert({ prenotazione_id: p.id, importo: costo, zona_nome: p.posti?.zone?.nome || '', tipo_posto_nome: 'standard', codice_posto: p.posti?.codice_posto || '' })

    }

    fetchPrenotazioni(); fetchPrenotazioniConcluse(); fetchPosti()

    alert(`Checkout completato!\n⏱ ${Math.floor(ore)}h ${Math.round((ore % 1) * 60)}min → fatturate ${oreArr}h\n💶 Costo: €${costo.toFixed(2)}`)

  }
 
  // ✅ NUOVO

  const annulla = async (p) => {

    if (!confirm('Annullare la prenotazione? Il posto tornerà disponibile.')) return

    await supabase.from('prenotazioni').update({ stato: 'annullata' }).eq('id', p.id)

    await supabase.from('posti').update({ stato: 'libero' }).eq('id', p.posto_id)

    fetchPrenotazioni(); fetchPosti()

  }
 
  // ✅ NUOVO

  const storna = async (p) => {

    if (!confirm(

      `Stornare questa prenotazione conclusa?\n\n🅿️ ${p.posti?.codice_posto} — ${p.posti?.zone?.nome}\n🚗 ${p.veicoli?.targa}\n💶 €${Number(p.costo_totale || 0).toFixed(2)}\n\nL'incasso verrà eliminato.`

    )) return

    await supabase.from('incassi').delete().eq('prenotazione_id', p.id)

    await supabase.from('prenotazioni').update({ stato: 'annullata' }).eq('id', p.id)

    fetchPrenotazioniConcluse()

    alert('Prenotazione stornata.')

  }
 
  const aggiungiVeicolo = async (e) => {

    e.preventDefault()

    const { error } = await supabase.from('veicoli').insert([{

      user_id: user.id, targa: nuovaTarga.toUpperCase(), tipo: nuovoTipo,

      alimentazione: nuovaAlimentazione, is_heavy: nuovoHeavy,

      ha_permesso_disabili: nuovoDisabili, ha_permesso_residente: nuovoResidente

    }])

    if (error) alert('Errore: ' + error.message)

    else { setNuovaTarga(''); setMostraVeicoli(false); fetchVeicoli() }

  }
 
  const eliminaVeicolo = async (id) => {

    if (!confirm('Eliminare il veicolo?')) return

    await supabase.from('veicoli').delete().eq('id', id)

    fetchVeicoli()

  }
 
  const postiLiberi = posti.filter(p => p.stato === 'libero').length

  const postiTotali = posti.length
 
  return (
<div style={stile.body}>
 
      {/* SIDEBAR */}
<div style={stile.sidebar}>
 
        {/* CONTATORE POSTI */}
<div style={{ ...stile.card, background:'#f0fdf4', border:'1px solid #bbf7d0' }}>
<div style={stile.titolo}>Disponibilità in tempo reale</div>
<div style={{ display:'flex', alignItems:'baseline', gap:'0.4rem' }}>
<span style={{ fontSize:'1.8rem', fontWeight:'bold', color:'#166534' }}>{postiLiberi}</span>
<span style={{ fontSize:'0.85rem', color:'#64748b' }}>/ {postiTotali} posti liberi</span>
</div>
<div style={{ marginTop:'0.4rem', background:'#e2e8f0', borderRadius:'4px', height:'6px', overflow:'hidden' }}>
<div style={{ background:'#10b981', height:'100%', width: postiTotali > 0 ? (postiLiberi/postiTotali*100)+'%' : '0%', transition:'width 0.5s' }} />
</div>
</div>
 
        {/* LEGENDA */}
<div style={stile.card}>
<div style={stile.titolo}>Legenda</div>
<div style={stile.legenda}>

            {[['#10b981','Libero Gratuito'],['#3b82f6','Libero a Pagamento'],['#f59e0b','Limitazioni'],['#ef4444','Occupato'],['#6b7280','Manutenzione']].map(([c,l]) => (
<div key={l} style={stile.legendaRiga}><div style={stile.pallino(c)} /> {l}</div>

            ))}
</div>
</div>
 
        {/* FILTRI */}
<div style={stile.card}>
<div style={stile.titolo}>Filtri</div>
<div style={stile.filtroRiga}>
<span style={stile.label}>Veicolo</span>
<select style={stile.select} value={veicoloSelezionato} onChange={e => setVeicoloSelezionato(e.target.value)}>
<option value="">— Nessun veicolo —</option>

              {veicoli.map(v => <option key={v.id} value={v.id}>{v.targa} ({v.tipo})</option>)}
</select>
</div>
<div style={stile.filtroRiga}>
<span style={stile.label}>Stato</span>
<select style={stile.select} value={filtroStato} onChange={e => setFiltroStato(e.target.value)}>
<option value="tutti">Tutti</option>
<option value="libero_gratis">Libero Gratis</option>
<option value="libero_pagamento">Libero Pagamento</option>
<option value="libero_limitazioni">Limitazioni</option>
<option value="occupato">Occupato</option>
<option value="manutenzione">Manutenzione</option>
</select>
</div>
<div style={stile.filtroRiga}>
<span style={stile.label}>Tipo posto</span>
<select style={stile.select} value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
<option value="tutti">Tutti</option>
<option value="standard">Standard</option>
<option value="elettrico">Elettrico</option>
<option value="disabili">Disabili</option>
<option value="residenti">Residenti</option>
<option value="moto">Moto</option>
<option value="carico_scarico">Carico/Scarico</option>
<option value="temporaneo">Temporaneo</option>
</select>
</div>
<div style={stile.filtroRiga}>
<span style={stile.label}>Costo</span>
<select style={stile.select} value={filtroPagamento} onChange={e => setFiltroPagamento(e.target.value)}>
<option value="tutti">Tutti</option>
<option value="gratuito">Solo Gratuiti</option>
<option value="pagamento">Solo a Pagamento</option>
</select>
</div>
<div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginTop:'0.3rem' }}>
<input type="checkbox" id="elettrico" checked={filtroElettrico} onChange={e => setFiltroElettrico(e.target.checked)} />
<label style={stile.label} htmlFor="elettrico">Solo colonnine ⚡</label>
</div>
<div style={{ marginTop:'0.75rem', display:'flex', gap:'0.5rem', alignItems:'center' }}>
<span style={{ fontSize:'0.8rem', color:'#64748b' }}>Filtrati:</span>
<span style={stile.badge('#3b82f6')}>{postiFiltrati.length} posti</span>
</div>
</div>
 
        {/* VEICOLI */}
<div style={stile.card}>
<div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' }}>
<div style={stile.titolo}>I miei veicoli ({veicoli.length})</div>
<button style={{ ...stile.btn, ...stile.btnBlu2, fontSize:'0.75rem', padding:'0.3rem 0.6rem' }} onClick={() => setMostraVeicoli(!mostraVeicoli)}>

              {mostraVeicoli ? 'Chiudi' : '+ Aggiungi'}
</button>
</div>

          {veicoli.map(v => (
<div key={v.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.3rem 0', borderBottom:'1px solid #f1f5f9' }}>
<span style={{ fontSize:'0.8rem' }}>🚗 <strong>{v.targa}</strong> — {v.tipo} / {v.alimentazione}</span>
<button style={{ ...stile.btn, ...stile.btnRosso, padding:'2px 8px', fontSize:'0.7rem' }} onClick={() => eliminaVeicolo(v.id)}>✕</button>
</div>

          ))}

          {mostraVeicoli && (
<form onSubmit={aggiungiVeicolo} style={{ marginTop:'0.75rem', display:'flex', flexDirection:'column', gap:'0.4rem' }}>
<input style={stile.input} placeholder="Targa (es. AB123CD)" value={nuovaTarga} onChange={e => setNuovaTarga(e.target.value)} required />
<select style={stile.select} value={nuovoTipo} onChange={e => setNuovoTipo(e.target.value)}>
<option value="auto">Auto</option>
<option value="moto">Moto</option>
<option value="furgone">Furgone</option>
</select>
<select style={stile.select} value={nuovaAlimentazione} onChange={e => setNuovaAlimentazione(e.target.value)}>
<option value="benzina">Benzina</option>
<option value="diesel">Diesel</option>
<option value="gpl">GPL</option>
<option value="ibrida">Ibrida</option>
<option value="elettrica">Elettrica</option>
</select>
<label style={{ fontSize:'0.78rem', display:'flex', gap:'0.4rem' }}>
<input type="checkbox" checked={nuovoHeavy} onChange={e => setNuovoHeavy(e.target.checked)} /> Veicolo pesante
</label>
<label style={{ fontSize:'0.78rem', display:'flex', gap:'0.4rem' }}>
<input type="checkbox" checked={nuovoDisabili} onChange={e => setNuovoDisabili(e.target.checked)} /> Permesso disabili ♿
</label>
<label style={{ fontSize:'0.78rem', display:'flex', gap:'0.4rem' }}>
<input type="checkbox" checked={nuovoResidente} onChange={e => setNuovoResidente(e.target.checked)} /> Permesso residente 🏠
</label>
<button style={{ ...stile.btn, ...stile.btnVerde2 }} type="submit">Salva Veicolo</button>
</form>

          )}
</div>
 
        {/* BOTTONE PRENOTA */}
<a href="/prenota" style={{ ...stile.btn, ...stile.btnVerde2, textAlign:'center', textDecoration:'none', display:'block' }}>

          🅿️ Prenota un posto
</a>
 
        {/* ✅ PRENOTAZIONI ATTIVE */}
<div style={{ ...stile.card, border: prenotazioni.length > 0 ? '1px solid #bbf7d0' : '1px solid #e2e8f0' }}>
<div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' }}>
<div style={stile.titolo}>Le mie prenotazioni</div>

            {prenotazioni.length > 0 && (
<span style={{ background:'#ef4444', color:'white', borderRadius:'12px', padding:'1px 7px', fontSize:'0.7rem', fontWeight:'bold' }}>

                {prenotazioni.length}
</span>

            )}
</div>
 
          {prenotazioni.length === 0 ? (
<div style={{ fontSize:'0.78rem', color:'#94a3b8', textAlign:'center', padding:'0.4rem 0' }}>

              Nessuna prenotazione attiva
</div>

          ) : prenotazioni.map(p => {

            const now = new Date()

            const ingresso = new Date(p.orario_ingresso)

            const nonIniziata = ingresso > now

            const tariffa = Number(p.posti?.tariffa_oraria) || 0

            const tr = tempoRimanente(p.orario_uscita_previsto)
 
            return (
<div key={p.id} style={{ borderLeft:`3px solid ${nonIniziata ? '#f59e0b' : '#10b981'}`, paddingLeft:'0.5rem', marginBottom:'0.6rem', paddingBottom:'0.6rem', borderBottom:'1px solid #f1f5f9' }}>
<div style={{ fontSize:'0.78rem', fontWeight:'bold', color:'#1e293b' }}>{p.posti?.zone?.nome}</div>
<div style={{ fontSize:'0.75rem', color:'#64748b' }}>🅿️ {p.posti?.codice_posto} | 🚗 {p.veicoli?.targa}</div>
<div style={{ fontSize:'0.73rem', color:'#94a3b8', marginTop:'0.15rem' }}>

                  {ingresso.toLocaleString('it-IT', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
</div>

                {tr && !nonIniziata && (
<div style={{ fontSize:'0.72rem', color:tr.colore, fontWeight:'bold', marginTop:'0.2rem' }}>⏰ {tr.testo}</div>

                )}

                {tariffa > 0 && !nonIniziata && costiLive[p.id] && (
<div style={{ fontSize:'0.73rem', color:'#10b981', fontWeight:'bold', marginTop:'0.15rem' }}>

                    💶 €{costiLive[p.id].toFixed(2)} accumulati
</div>

                )}

                {nonIniziata && (
<span style={{ fontSize:'0.7rem', background:'#fef3c7', color:'#92400e', padding:'1px 6px', borderRadius:'8px', display:'inline-block', marginTop:'0.2rem' }}>

                    Non ancora iniziata
</span>

                )}
<div style={{ display:'flex', gap:'0.3rem', marginTop:'0.4rem' }}>

                  {!nonIniziata && (
<button onClick={() => checkout(p)} style={{ flex:1, background:'#3b82f6', color:'white', border:'none', borderRadius:'5px', padding:'3px 0', fontSize:'0.72rem', cursor:'pointer', fontWeight:'bold' }}>

                      ✓ Checkout
</button>

                  )}

                  {nonIniziata && (
<button onClick={() => annulla(p)} style={{ flex:1, background:'#ef4444', color:'white', border:'none', borderRadius:'5px', padding:'3px 0', fontSize:'0.72rem', cursor:'pointer' }}>

                      Annulla
</button>

                  )}
</div>
</div>

            )

          })}
 
          {/* Bottone storico */}
<button

            onClick={() => { setVistaMain('storico'); fetchPrenotazioniConcluse() }}

            style={{ width:'100%', marginTop:'0.3rem', background:'transparent', border:'1px solid #e2e8f0', borderRadius:'5px', padding:'0.3rem', fontSize:'0.75rem', color:'#64748b', cursor:'pointer' }}
>

            📋 Storico prenotazioni {prenotazioniConcluse.length > 0 ? `(${prenotazioniConcluse.length})` : ''} →
</button>
</div>
 
      </div>
 
      {/* AREA PRINCIPALE — MAPPA o STORICO */}
<div style={stile.mappa}>
 
        {/* MAPPA */}

        {vistaMain === 'mappa' && (

          loading ? (
<div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100%', color:'#64748b' }}>

              Caricamento mappa in corso...
</div>

          ) : (
<CityParkingMap posti={postiFiltrati} />

          )

        )}
 
        {/* ✅ STORICO */}

        {vistaMain === 'storico' && (
<div style={{ height:'100%', overflowY:'auto', padding:'1.5rem', background:'#f8fafc' }}>
<div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
<h5 style={{ margin:0, fontWeight:'bold' }}>📋 Storico Prenotazioni ({prenotazioniConcluse.length})</h5>
<div style={{ display:'flex', gap:'0.5rem' }}>
<button onClick={fetchPrenotazioniConcluse} style={{ background:'transparent', border:'1px solid #e2e8f0', borderRadius:'6px', padding:'0.35rem 0.8rem', fontSize:'0.8rem', color:'#64748b', cursor:'pointer' }}>

                  🔄 Aggiorna
</button>
<button onClick={() => setVistaMain('mappa')} style={{ background:'#3b82f6', color:'white', border:'none', borderRadius:'6px', padding:'0.35rem 0.8rem', fontSize:'0.8rem', cursor:'pointer', fontWeight:'bold' }}>

                  ← Torna alla mappa
</button>
</div>
</div>
 
            {prenotazioniConcluse.length === 0 ? (
<div style={{ textAlign:'center', padding:'3rem', color:'#94a3b8' }}>
<div style={{ fontSize:'2.5rem', marginBottom:'0.5rem' }}>📋</div>
<p>Nessuna prenotazione conclusa.</p>
</div>

            ) : prenotazioniConcluse.map(p => {

              const ingresso = new Date(p.orario_ingresso)

              const uscita = p.orario_uscita_effettivo ? new Date(p.orario_uscita_effettivo) : null

              const costo = Number(p.costo_totale || 0)

              const oreEffettive = uscita ? ((uscita - ingresso) / 3600000).toFixed(1) : null
 
              return (
<div key={p.id} style={{ background:'white', border:'1px solid #e2e8f0', borderLeft:'4px solid #94a3b8', borderRadius:'8px', padding:'1rem', marginBottom:'0.75rem' }}>
<div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'1rem' }}>
<div style={{ flex:1 }}>
<div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.25rem', flexWrap:'wrap' }}>
<span style={{ background:'#f1f5f9', color:'#64748b', padding:'1px 8px', borderRadius:'12px', fontSize:'0.72rem', fontWeight:'bold' }}>

                          ✓ Conclusa
</span>
</div>
<div style={{ fontWeight:'bold', marginBottom:'0.2rem' }}>{p.posti?.zone?.nome} — {p.posti?.codice_posto}</div>
<div style={{ fontSize:'0.8rem', color:'#64748b' }}>🚗 {p.veicoli?.targa}</div>
<div style={{ fontSize:'0.78rem', color:'#94a3b8', marginTop:'0.2rem' }}>

                        ⏱ Ingresso: {ingresso.toLocaleString('it-IT')}
</div>

                      {uscita && (
<div style={{ fontSize:'0.78rem', color:'#94a3b8' }}>

                          🏁 Uscita: {uscita.toLocaleString('it-IT')}

                          {oreEffettive && <span style={{ marginLeft:'6px', color:'#64748b' }}>({oreEffettive}h)</span>}
</div>

                      )}
<div style={{ marginTop:'0.4rem', fontSize:'0.85rem' }}>

                        {costo > 0

                          ? <span style={{ fontWeight:'bold' }}>💶 Totale: <span style={{ color:'#3b82f6' }}>€{costo.toFixed(2)}</span></span>

                          : <span style={{ color:'#10b981', fontWeight:'bold' }}>🟢 Posto gratuito</span>

                        }
</div>
</div>
<button

                      onClick={() => storna(p)}

                      style={{ background:'transparent', color:'#ef4444', border:'1px solid #ef4444', borderRadius:'6px', padding:'0.4rem 0.8rem', fontSize:'0.78rem', cursor:'pointer', fontWeight:'bold', whiteSpace:'nowrap', flexShrink:0 }}
>

                      🗑️ Storna
</button>
</div>
</div>

              )

            })}
</div>

        )}
 
      </div>
</div>

  )

}
 
function AppLayoutAdmin({ children }) {

  return (
<div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>
<Header />
<div style={{ display:'flex', flex:1, overflow:'hidden' }}>
<Sidebar />
<main style={{ flex:1, overflowY:'auto', background:'#f1f5f9' }}>

          {children}
</main>
</div>
</div>

  )

}
 
function AppLayoutUtente({ children }) {

  return (
<div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>
<Header />
<div style={{ flex:1, overflow:'hidden' }}>

        {children}
</div>
</div>

  )

}
 
export default function App() {

  const { user, profilo, loading } = useAuth()
 
  if (loading) return (
<div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', color:'#64748b' }}>

      Caricamento...
</div>

  )
 
  if (!user) return <LoginScreen />
 
  if (!profilo) return (
<div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', color:'#64748b' }}>

      Caricamento profilo...
</div>

  )
 
  const isAdmin = profilo.ruolo === 'admin'
 
  if (isAdmin) {

    return (
<AppLayoutAdmin>
<Routes>
<Route path="/admin" element={<AdminDashboard />} />
<Route path="/admin/stalli" element={<GestioneStalli />} />
<Route path="/admin/zone" element={<GestioneZone />} />
<Route path="/admin/utenti" element={<GestioneUtenti />} />
<Route path="/admin/incassi" element={<Incassi />} />
<Route path="*" element={<Navigate to="/admin" replace />} />
</Routes>
</AppLayoutAdmin>

    )

  }
 
  return (
<AppLayoutUtente>
<Routes>
<Route path="/dashboard" element={<VistaUtente />} />
<Route path="/prenota" element={<BookParking />} />
<Route path="/veicoli" element={<Vehicles />} />
<Route path="/profilo" element={<Profile />} />
<Route path="*" element={<Navigate to="/dashboard" replace />} />
</Routes>
</AppLayoutUtente>

  )

}
 