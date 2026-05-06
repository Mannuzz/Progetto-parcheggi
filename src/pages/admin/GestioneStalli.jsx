import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'

export default function GestioneStalli() {
  const [posti, setPosti] = useState([])
  const [zone, setZone] = useState([])
  const [tipologie, setTipologie] = useState([])
  const [loading, setLoading] = useState(true)
  const [mostraForm, setMostraForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filtroStato, setFiltroStato] = useState('tutti')
  const [filtroZona, setFiltroZona] = useState('tutti')
  const [form, setForm] = useState({
    codice_posto:'', zona_id:'', tipologia_id:'', gratuito:false,
    sempre_a_pagamento:false, richiede_permesso_disabili:false,
    richiede_permesso_residente:false, solo_elettriche:false,
    limite_minuti:'', tariffa_oraria:'0', lat:'', lng:''
  })

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data:pd }, { data:zd }, { data:td }] = await Promise.all([
      supabase.from('posti').select('*, zone(nome), tipologie_posto(nome)').order('codice_posto'),
      supabase.from('zone').select('id,nome').eq('attiva',true).order('nome'),
      supabase.from('tipologie_posto').select('id,nome').order('nome')
    ])
    setPosti(pd||[]); setZone(zd||[]); setTipologie(td||[])
    setLoading(false)
  }

  const apriModifica = (p) => {
    setEditing(p)
    setForm({
      codice_posto: p.codice_posto,
      zona_id: String(p.zona_id),
      tipologia_id: String(p.tipologia_id),
      gratuito: p.gratuito,
      sempre_a_pagamento: p.sempre_a_pagamento,
      richiede_permesso_disabili: p.richiede_permesso_disabili,
      richiede_permesso_residente: p.richiede_permesso_residente,
      solo_elettriche: p.solo_elettriche,
      limite_minuti: p.limite_minuti || '',
      tariffa_oraria: p.tariffa_oraria || '0',
      lat: p.lat || '',
      lng: p.lng || ''
    })
    setMostraForm(true)
    window.scrollTo(0, 0)
  }

  const toggleManutenzione = async (p) => {
    if (p.stato === 'occupato') return alert('Posto occupato, impossibile modificare.')
    const nuovoStato = p.stato === 'manutenzione' ? 'libero' : 'manutenzione'
    await supabase.from('posti').update({ stato:nuovoStato }).eq('id', p.id)
    fetchAll()
  }

  const elimina = async (p) => {
    const { count } = await supabase.from('prenotazioni').select('*', { count:'exact', head:true }).eq('posto_id', p.id).eq('stato','attiva')
    if (count > 0) return alert('Impossibile: il posto ha una prenotazione attiva.')
    if (!confirm('Eliminare il posto ' + p.codice_posto + '?')) return
    await supabase.from('posti').delete().eq('id', p.id)
    fetchAll()
  }

  const salva = async (e) => {
    e.preventDefault()
    if (!form.codice_posto || !form.zona_id || !form.tipologia_id) return alert('Compila tutti i campi obbligatori.')
    const payload = {
      codice_posto: form.codice_posto.toUpperCase(),
      zona_id: Number(form.zona_id),
      tipologia_id: Number(form.tipologia_id),
      gratuito: form.gratuito,
      sempre_a_pagamento: form.sempre_a_pagamento,
      richiede_permesso_disabili: form.richiede_permesso_disabili,
      richiede_permesso_residente: form.richiede_permesso_residente,
      solo_elettriche: form.solo_elettriche,
      limite_minuti: form.limite_minuti ? Number(form.limite_minuti) : null,
      tariffa_oraria: Number(form.tariffa_oraria) || 0,
      lat: form.lat ? Number(form.lat) : null,
      lng: form.lng ? Number(form.lng) : null
    }

    let error
    if (editing) {
      ({ error } = await supabase.from('posti').update(payload).eq('id', editing.id))
    } else {
      ({ error } = await supabase.from('posti').insert({ ...payload, stato:'libero' }))
    }

    if (error) return alert('Errore: ' + error.message)
    setForm({ codice_posto:'', zona_id:'', tipologia_id:'', gratuito:false, sempre_a_pagamento:false, richiede_permesso_disabili:false, richiede_permesso_residente:false, solo_elettriche:false, limite_minuti:'', tariffa_oraria:'0', lat:'', lng:'' })
    setMostraForm(false)
    setEditing(null)
    fetchAll()
  }

  const annullaForm = () => {
    setMostraForm(false)
    setEditing(null)
    setForm({ codice_posto:'', zona_id:'', tipologia_id:'', gratuito:false, sempre_a_pagamento:false, richiede_permesso_disabili:false, richiede_permesso_residente:false, solo_elettriche:false, limite_minuti:'', tariffa_oraria:'0', lat:'', lng:'' })
  }

  const postiFiltrati = posti.filter(p => {
    if (filtroStato !== 'tutti' && p.stato !== filtroStato) return false
    if (filtroZona !== 'tutti' && String(p.zona_id) !== filtroZona) return false
    return true
  })

  const badgeStato = s => s==='libero'?'bg-success':s==='occupato'?'bg-danger':'bg-warning text-dark'

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold mb-0">Stalli & Tariffe ({posti.length})</h3>
        <button className="btn btn-success" onClick={() => mostraForm && !editing ? annullaForm() : (setEditing(null), setMostraForm(true))}>
          {mostraForm && !editing ? 'Chiudi' : '+ Aggiungi Posto'}
        </button>
      </div>

      {mostraForm && (
        <div className="card p-4 mb-4 shadow-sm border-start border-4" style={{ borderColor: editing ? '#f59e0b' : '#10b981' }}>
          <h5 className="mb-3">{editing ? `Modifica — ${editing.codice_posto}` : 'Nuovo Posto'}</h5>
          <form onSubmit={salva}>
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label">Codice *</label>
                <input type="text" className="form-control text-uppercase" value={form.codice_posto}
                  onChange={e => setForm({...form, codice_posto:e.target.value})} required disabled={!!editing} />
              </div>
              <div className="col-md-3">
                <label className="form-label">Zona *</label>
                <select className="form-select" value={form.zona_id} onChange={e => setForm({...form, zona_id:e.target.value})} required>
                  <option value="">Seleziona...</option>
                  {zone.map(z => <option key={z.id} value={z.id}>{z.nome}</option>)}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Tipologia *</label>
                <select className="form-select" value={form.tipologia_id} onChange={e => setForm({...form, tipologia_id:e.target.value})} required>
                  <option value="">Seleziona...</option>
                  {tipologie.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-bold text-success">💶 Tariffa €/h</label>
                <input type="number" className="form-control border-success" step="0.10" min="0"
                  value={form.tariffa_oraria} onChange={e => setForm({...form, tariffa_oraria:e.target.value})} />
              </div>
              <div className="col-md-3">
                <label className="form-label">Limite minuti</label>
                <input type="number" className="form-control" min="1" value={form.limite_minuti}
                  onChange={e => setForm({...form, limite_minuti:e.target.value})} placeholder="Nessun limite" />
              </div>
              <div className="col-md-3">
                <label className="form-label">Latitudine</label>
                <input type="number" className="form-control" step="0.000001" value={form.lat}
                  onChange={e => setForm({...form, lat:e.target.value})} />
              </div>
              <div className="col-md-3">
                <label className="form-label">Longitudine</label>
                <input type="number" className="form-control" step="0.000001" value={form.lng}
                  onChange={e => setForm({...form, lng:e.target.value})} />
              </div>
              <div className="col-12">
                <div className="d-flex flex-wrap gap-3">
                  {[
                    ['gratuito','Gratuito'],
                    ['sempre_a_pagamento','Sempre a pagamento'],
                    ['richiede_permesso_disabili','Solo disabili ♿'],
                    ['richiede_permesso_residente','Solo residenti 🏠'],
                    ['solo_elettriche','Solo elettrici ⚡']
                  ].map(([k,l]) => (
                    <div key={k} className="form-check">
                      <input type="checkbox" className="form-check-input" id={k}
                        checked={form[k]} onChange={e => setForm({...form, [k]:e.target.checked})} />
                      <label className="form-check-label" htmlFor={k}>{l}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="col-12">
                <button type="submit" className={'btn me-2 ' + (editing ? 'btn-warning' : 'btn-success')}>
                  {editing ? 'Salva Modifiche' : 'Aggiungi Posto'}
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={annullaForm}>Annulla</button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="card shadow-sm mb-3 p-3">
        <div className="d-flex gap-3 flex-wrap align-items-center">
          <select className="form-select w-auto" value={filtroStato} onChange={e => setFiltroStato(e.target.value)}>
            <option value="tutti">Tutti gli stati</option>
            <option value="libero">Libero</option>
            <option value="occupato">Occupato</option>
            <option value="manutenzione">Manutenzione</option>
          </select>
          <select className="form-select w-auto" value={filtroZona} onChange={e => setFiltroZona(e.target.value)}>
            <option value="tutti">Tutte le zone</option>
            {zone.map(z => <option key={z.id} value={String(z.id)}>{z.nome}</option>)}
          </select>
          <span className="badge bg-primary">{postiFiltrati.length} posti</span>
        </div>
      </div>

      {loading ? <div className="text-center p-4">Caricamento...</div> : (
        <div className="card shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr><th>Codice</th><th>Zona</th><th>Tipo</th><th>Tariffa</th><th>Limite</th><th>Stato</th><th>Azioni</th></tr>
              </thead>
              <tbody>
                {postiFiltrati.map(p => (
                  <tr key={p.id}>
                    <td className="fw-bold">{p.codice_posto}</td>
                    <td>{p.zone?.nome}</td>
                    <td>{p.tipologie_posto?.nome}</td>
                    <td className="fw-bold text-success">
                      {p.gratuito ? '🟢 Gratuito' : p.tariffa_oraria > 0 ? '€'+Number(p.tariffa_oraria).toFixed(2)+'/h' : '—'}
                    </td>
                    <td className="small text-muted">
                      {p.limite_minuti ? p.limite_minuti+' min' : '—'}
                    </td>
                    <td><span className={'badge '+badgeStato(p.stato)}>{p.stato}</span></td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary me-1"
                        onClick={() => apriModifica(p)}
                        title="Modifica / Cambia tariffa"
                      >✏️</button>
                      <button
                        className={'btn btn-sm me-1 '+(p.stato==='manutenzione'?'btn-warning':'btn-outline-warning')}
                        onClick={() => toggleManutenzione(p)}
                        disabled={p.stato==='occupato'}
                        title={p.stato==='manutenzione'?'Riporta a libero':'Metti in manutenzione'}
                      >🔧</button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => elimina(p)}
                        title="Elimina posto"
                      >🗑️</button>
                    </td>
                  </tr>
                ))}
                {postiFiltrati.length === 0 && (
                  <tr><td colSpan="7" className="text-center text-muted py-3">Nessun posto trovato</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}