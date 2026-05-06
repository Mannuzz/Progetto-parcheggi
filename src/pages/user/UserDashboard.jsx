import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../supabase'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import CityParkingMap from '../../components/CityParkingMap'

export default function UserDashboard() {
  const { user, generaCodice } = useAuth()
  const [posti, setPosti] = useState([])
  const [postiFiltrati, setPostiFiltrati] = useState([])
  const [veicoli, setVeicoli] = useState([])
  const [prenotazioni, setPrenotazioni] = useState([])
  const [costiLive, setCostiLive] = useState({})
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('mappa')
  const [filtroStato, setFiltroStato] = useState('tutti')
  const [filtroTipo, setFiltroTipo] = useState('tutti')
  const [filtroPagamento, setFiltroPagamento] = useState('tutti')
  const [veicoloSel, setVeicoloSel] = useState('')
  const intervalCosti = useRef(null)
  const intervalScadenze = useRef(null)

  useEffect(() => {
    if (user) { fetchPosti(); fetchVeicoli(); fetchPrenotazioni() }
    return () => {
      clearInterval(intervalCosti.current)
      clearInterval(intervalScadenze.current)
    }
  }, [user])

  // Aggiorna costo live ogni minuto
  useEffect(() => {
    aggiornaCostiLive(prenotazioni)
    clearInterval(intervalCosti.current)
    intervalCosti.current = setInterval(() => aggiornaCostiLive(prenotazioni), 60000)
    return () => clearInterval(intervalCosti.current)
  }, [prenotazioni])

  // Controlla scadenze ogni 30 secondi
  useEffect(() => {
    clearInterval(intervalScadenze.current)
    intervalScadenze.current = setInterval(() => fetchPrenotazioni(), 30000)
    return () => clearInterval(intervalScadenze.current)
  }, [])

  // Filtri mappa
  useEffect(() => {
    let f = [...posti]
    if (filtroStato !== 'tutti') f = f.filter(p => p.stato_mappa === filtroStato)
    if (filtroTipo !== 'tutti') f = f.filter(p => p.tipologia_nome === filtroTipo)
    if (filtroPagamento === 'gratuito') f = f.filter(p => p.gratuito)
    if (filtroPagamento === 'pagamento') f = f.filter(p => p.sempre_a_pagamento)
    if (veicoloSel) {
      const v = veicoli.find(x => x.id.toString() === veicoloSel)
      if (v) {
        if (!v.ha_permesso_disabili) f = f.filter(p => !p.richiede_permesso_disabili)
        if (!v.ha_permesso_residente) f = f.filter(p => !p.richiede_permesso_residente)
        if (v.alimentazione === 'gpl') f = f.filter(p => p.accetta_gpl !== false)
        if (v.alimentazione !== 'elettrica') f = f.filter(p => !p.solo_elettriche)
      }
    }
    setPostiFiltrati(f)
  }, [filtroStato, filtroTipo, filtroPagamento, veicoloSel, posti, veicoli])

  const fetchPosti = async () => {
    const { data } = await supabase.from('v_posti_mappa').select('*')
    setPosti(data || [])
    setLoading(false)
  }

  const fetchVeicoli = async () => {
    const { data } = await supabase.from('veicoli').select('*').eq('user_id', user.id)
    setVeicoli(data || [])
  }

  const fetchPrenotazioni = async () => {
    // Chiama la funzione SQL che gestisce le scadenze automaticamente
    await supabase.rpc('gestisci_scadenze')
    const { data } = await supabase
      .from('prenotazioni')
      .select('id, stato, orario_ingresso, orario_uscita_previsto, costo_totale, posto_id, veicoli(targa), posti(codice_posto, tariffa_oraria, gratuito, zone(nome))')
      .eq('user_id', user.id)
      .eq('stato', 'attiva')
      .order('orario_ingresso', { ascending: false })
    setPrenotazioni(data || [])
    fetchPosti()
  }

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

  const checkout = async (p) => {
    if (!confirm('Confermi il checkout?')) return
    const now = new Date()
    const tariffa = Number(p.posti?.tariffa_oraria) || 0
    const ore = (now - new Date(p.orario_ingresso)) / 3600000
    const oreArr = Math.ceil(Math.max(ore, 0.001))
    const costo = Math.round(oreArr * tariffa * 100) / 100

    await supabase.from('prenotazioni').update({
      orario_uscita_effettivo: now.toISOString(),
      costo_totale: costo,
      stato: 'conclusa'
    }).eq('id', p.id)

    await supabase.from('posti').update({ stato: 'libero' }).eq('id', p.posto_id)

    if (tariffa > 0) {
      await supabase.from('incassi').insert({
        prenotazione_id: p.id,
        importo: costo,
        zona_nome: p.posti?.zone?.nome || '',
        tipo_posto_nome: 'standard',
        codice_posto: p.posti?.codice_posto || ''
      })
    }

    fetchPrenotazioni()
    alert(`Checkout completato!\n⏱ ${Math.floor(ore)}h ${Math.round((ore % 1) * 60)}min → fatturate ${oreArr}h\n💶 Costo: €${costo.toFixed(2)}`)
  }

  const annulla = async (p) => {
    const nonIniziata = new Date(p.orario_ingresso) > new Date()
    if (!nonIniziata) return alert('Prenotazione già iniziata. Usa il checkout per uscire.')
    if (!confirm('Annullare la prenotazione? Il posto tornerà disponibile.')) return
    await supabase.from('prenotazioni').update({ stato: 'annullata' }).eq('id', p.id)
    await supabase.from('posti').update({ stato: 'libero' }).eq('id', p.posto_id)
    fetchPrenotazioni()
  }

  const tempoRimanente = (uscita) => {
    if (!uscita) return null
    const diff = new Date(uscita) - new Date()
    if (diff <= 0) return { testo: 'SCADUTA', colore: '#ef4444' }
    const ore = Math.floor(diff / 3600000)
    const min = Math.floor((diff % 3600000) / 60000)
    const colore = diff < 900000 ? '#ef4444' : diff < 1800000 ? '#f59e0b' : '#10b981'
    return { testo: ore > 0 ? `${ore}h ${min}m rimanenti` : `${min}m rimanenti`, colore }
  }

  const postiLiberi = posti.filter(p => p.stato === 'libero').length

  const s = {
    wrap: { display: 'flex', height: 'calc(100vh - 56px)' },
    panel: { width: '260px', background: 'white', borderRight: '1px solid #e2e8f0', padding: '1rem', overflowY: 'auto', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' },
    main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    tabs: { display: 'flex', borderBottom: '2px solid #e2e8f0', background: 'white', padding: '0 1rem', flexShrink: 0 },
    tab: (a) => ({ padding: '0.6rem 1rem', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', color: a ? '#3b82f6' : '#94a3b8', borderBottom: a ? '2px solid #3b82f6' : 'none', marginBottom: '-2px' }),
    card: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem' },
    titolo: { fontSize: '0.7rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' },
    sel: { padding: '0.35rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', width: '100%', marginBottom: '0.4rem' },
    lbl: { fontSize: '0.78rem', color: '#475569', display: 'block', marginBottom: '0.15rem' },
  }

  return (
    <div style={s.wrap}>
      {/* SIDEBAR */}
      <div style={s.panel}>

        {/* CONTATORE LIVE */}
        <div style={{ ...s.card, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <div style={s.titolo}>Disponibilità live</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#166534' }}>{postiLiberi}</span>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>/ {posti.length} liberi</span>
          </div>
          <div style={{ marginTop: '0.4rem', background: '#e2e8f0', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
            <div style={{ background: '#10b981', height: '100%', width: posti.length > 0 ? (postiLiberi / posti.length * 100) + '%' : '0%', transition: 'width 0.5s' }} />
          </div>
        </div>

        {/* LEGENDA */}
        <div style={s.card}>
          <div style={s.titolo}>Legenda</div>
          {[['#10b981', 'Libero Gratuito'], ['#3b82f6', 'Libero Pagamento'], ['#f59e0b', 'Limitazioni'], ['#ef4444', 'Occupato'], ['#6b7280', 'Manutenzione']].map(([c, l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: c, flexShrink: 0 }} />{l}
            </div>
          ))}
        </div>

        {/* FILTRI */}
        <div style={s.card}>
          <div style={s.titolo}>Filtri</div>
          <label style={s.lbl}>Veicolo</label>
          <select style={s.sel} value={veicoloSel} onChange={e => setVeicoloSel(e.target.value)}>
            <option value="">Nessun veicolo</option>
            {veicoli.map(v => <option key={v.id} value={v.id}>{v.targa} ({v.tipo})</option>)}
          </select>
          <label style={s.lbl}>Stato</label>
          <select style={s.sel} value={filtroStato} onChange={e => setFiltroStato(e.target.value)}>
            <option value="tutti">Tutti</option>
            <option value="libero_gratis">Libero Gratis</option>
            <option value="libero_pagamento">Libero Pagamento</option>
            <option value="libero_limitazioni">Limitazioni</option>
            <option value="occupato">Occupato</option>
            <option value="manutenzione">Manutenzione</option>
          </select>
          <label style={s.lbl}>Tipo</label>
          <select style={s.sel} value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
            <option value="tutti">Tutti</option>
            <option value="standard">Standard</option>
            <option value="elettrico">Elettrico</option>
            <option value="disabili">Disabili</option>
            <option value="residenti">Residenti</option>
            <option value="moto">Moto</option>
          </select>
          <label style={s.lbl}>Costo</label>
          <select style={s.sel} value={filtroPagamento} onChange={e => setFiltroPagamento(e.target.value)}>
            <option value="tutti">Tutti</option>
            <option value="gratuito">Solo Gratuiti</option>
            <option value="pagamento">Solo a Pagamento</option>
          </select>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.4rem' }}>
            Trovati: <strong>{postiFiltrati.length}</strong> posti
          </div>
        </div>

        {/* BOTTONE PRENOTA */}
        <Link to="/prenota" style={{ background: '#10b981', color: 'white', padding: '0.55rem', borderRadius: '6px', textDecoration: 'none', textAlign: 'center', fontWeight: 'bold', fontSize: '0.88rem' }}>
          🅿️ Prenota un posto
        </Link>

        {/* RIQUADRO PRENOTAZIONI NELLA SIDEBAR */}
        <div style={{ ...s.card, border: prenotazioni.length > 0 ? '1px solid #bbf7d0' : '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={s.titolo}>Le mie prenotazioni</div>
            {prenotazioni.length > 0 && (
              <span style={{ background: '#ef4444', color: 'white', borderRadius: '12px', padding: '1px 7px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                {prenotazioni.length}
              </span>
            )}
          </div>

          {/* SEZIONE AZIONI RAPIDE - Eliminazione prenotazioni non ancora iniziate */}
          {prenotazioni.some(p => new Date(p.orario_ingresso) > new Date()) && (
            <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '6px', padding: '0.6rem', marginBottom: '0.6rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#92400e', marginBottom: '0.4rem' }}>
                🗑️ Puoi eliminare queste prenotazioni:
              </div>
              {prenotazioni.filter(p => new Date(p.orario_ingresso) > new Date()).map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem', paddingBottom: '0.3rem', borderBottom: '1px solid #fcd34d' }}>
                  <div style={{ fontSize: '0.7rem', color: '#92400e' }}>
                    {p.posti?.codice_posto} ({p.posti?.zone?.nome})
                  </div>
                  <button 
                    onClick={() => annulla(p)} 
                    style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '0.65rem', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                  >
                    Elimina
                  </button>
                </div>
              ))}
            </div>
          )}

          {prenotazioni.length === 0 ? (
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center', padding: '0.5rem 0' }}>
              Nessuna prenotazione attiva
            </div>
          ) : prenotazioni.map(p => {
            const now = new Date()
            const ingresso = new Date(p.orario_ingresso)
            const nonIniziata = ingresso > now
            const tariffa = Number(p.posti?.tariffa_oraria) || 0
            const tr = tempoRimanente(p.orario_uscita_previsto)

            return (
              <div key={p.id} style={{ borderLeft: `3px solid ${nonIniziata ? '#f59e0b' : '#10b981'}`, paddingLeft: '0.5rem', marginBottom: '0.6rem', paddingBottom: '0.6rem', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#1e293b' }}>
                  {p.posti?.zone?.nome}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  🅿️ {p.posti?.codice_posto} &nbsp;|&nbsp; 🚗 {p.veicoli?.targa}
                </div>
                <div style={{ fontSize: '0.73rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                  {ingresso.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </div>
                {tr && !nonIniziata && (
                  <div style={{ fontSize: '0.72rem', color: tr.colore, fontWeight: 'bold', marginTop: '0.2rem' }}>
                    ⏰ {tr.testo}
                  </div>
                )}
                {tariffa > 0 && !nonIniziata && costiLive[p.id] && (
                  <div style={{ fontSize: '0.73rem', color: '#10b981', fontWeight: 'bold', marginTop: '0.15rem' }}>
                    💶 €{costiLive[p.id].toFixed(2)} accumulati
                  </div>
                )}
                {nonIniziata && (
                  <span style={{ fontSize: '0.7rem', background: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: '8px', display: 'inline-block', marginTop: '0.2rem' }}>
                    Non ancora iniziata
                  </span>
                )}
                <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.4rem' }}>
                  {!nonIniziata && (
                    <button onClick={() => checkout(p)} style={{ flex: 1, background: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', padding: '3px 0', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 'bold' }}>
                      Checkout
                    </button>
                  )}
                  {nonIniziata && (
                    <button onClick={() => annulla(p)} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', borderRadius: '5px', padding: '3px 0', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 'bold' }}>
                      🗑️ Elimina
                    </button>
                  )}
                  <button onClick={() => setTab('prenotazioni')} style={{ background: 'transparent', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '5px', padding: '3px 6px', fontSize: '0.72rem', cursor: 'pointer' }}>
                    Dettagli
                  </button>
                </div>
              </div>
            )
          })}

          {prenotazioni.length > 0 && (
            <button onClick={() => setTab('prenotazioni')} style={{ width: '100%', background: 'transparent', border: '1px solid #e2e8f0', borderRadius: '5px', padding: '0.3rem', fontSize: '0.75rem', color: '#64748b', cursor: 'pointer', marginTop: '0.25rem' }}>
              Vedi tutte →
            </button>
          )}
        </div>

      </div>

      {/* CONTENUTO PRINCIPALE */}
      <div style={s.main}>
        <div style={s.tabs}>
          <button style={s.tab(tab === 'mappa')} onClick={() => setTab('mappa')}>Mappa</button>
          <button style={s.tab(tab === 'prenotazioni')} onClick={() => setTab('prenotazioni')}>
            Le mie Prenotazioni
            {prenotazioni.length > 0 && (
              <span style={{ background: '#ef4444', color: 'white', borderRadius: '12px', padding: '1px 6px', fontSize: '0.7rem', marginLeft: '5px' }}>
                {prenotazioni.length}
              </span>
            )}
          </button>
        </div>

        {/* MAPPA */}
        <div style={{ flex: 1, display: tab === 'mappa' ? 'block' : 'none' }}>
          {loading
            ? <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#64748b' }}>Caricamento mappa...</div>
            : <CityParkingMap posti={postiFiltrati} />
          }
        </div>

        {/* PRENOTAZIONI */}
        {tab === 'prenotazioni' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h5 style={{ margin: 0, fontWeight: 'bold' }}>Prenotazioni Attive ({prenotazioni.length})</h5>
              <Link to="/prenota" style={{ background: '#10b981', color: 'white', padding: '0.4rem 1rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 'bold' }}>
                + Nuova
              </Link>
            </div>

            {prenotazioni.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🅿️</div>
                <p>Nessuna prenotazione attiva.</p>
                <Link to="/prenota" style={{ color: '#3b82f6' }}>Prenota un posto →</Link>
              </div>
            ) : prenotazioni.map(p => {
              const now = new Date()
              const ingresso = new Date(p.orario_ingresso)
              const nonIniziata = ingresso > now
              const tariffa = Number(p.posti?.tariffa_oraria) || 0
              const tr = tempoRimanente(p.orario_uscita_previsto)

              return (
                <div key={p.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderLeft: `4px solid ${nonIniziata ? '#f59e0b' : '#10b981'}`, borderRadius: '8px', padding: '1rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                        <code style={{ fontWeight: 'bold', color: '#10b981', fontSize: '0.82rem' }}>{generaCodice(p.id)}</code>
                        {nonIniziata && (
                          <span style={{ background: '#fef3c7', color: '#92400e', padding: '1px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 'bold' }}>
                            Non ancora iniziata
                          </span>
                        )}
                      </div>
                      <div style={{ fontWeight: 'bold', marginBottom: '0.2rem' }}>
                        {p.posti?.zone?.nome} — {p.posti?.codice_posto}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        🚗 {p.veicoli?.targa} &nbsp;|&nbsp; ⏱ {ingresso.toLocaleString('it-IT')}
                      </div>
                      {p.orario_uscita_previsto && (
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                          Uscita prevista: {new Date(p.orario_uscita_previsto).toLocaleString('it-IT')}
                        </div>
                      )}
                      {tr && !nonIniziata && (
                        <div style={{ marginTop: '0.4rem', display: 'inline-block', background: tr.colore + '20', color: tr.colore, padding: '2px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 'bold' }}>
                          ⏰ {tr.testo}
                        </div>
                      )}
                      {tariffa > 0 && !nonIniziata && (
                        <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: '#64748b' }}>
                          💶 Costo accumulato:{' '}
                          <strong style={{ color: '#10b981', fontSize: '1rem' }}>
                            €{(costiLive[p.id] || 0).toFixed(2)}
                          </strong>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginLeft: '4px' }}>
                            (€{tariffa.toFixed(2)}/h · ore intere)
                          </span>
                        </div>
                      )}
                      {tariffa === 0 && (
                        <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: '#10b981', fontWeight: 'bold' }}>
                          🟢 Posto gratuito
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flexShrink: 0 }}>
                      {!nonIniziata && (
                        <button onClick={() => checkout(p)} style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', padding: '0.4rem 0.8rem', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>
                          Checkout
                        </button>
                      )}
                      {nonIniziata && (
                        <button onClick={() => annulla(p)} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', padding: '0.4rem 0.8rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                          🗑️ Elimina prenotazione
                        </button>
                      )}
                    </div>
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