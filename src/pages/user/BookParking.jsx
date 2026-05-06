import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function BookParking() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [veicoli, setVeicoli] = useState([])
  const [posti, setPosti] = useState([])
  const [zone, setZone] = useState([])
  const [prenotazioneAttiva, setPrenotazioneAttiva] = useState(null)
  const [form, setForm] = useState({ veicolo_id:'', posto_id:'', ingresso:'', uscita:'' })
  const [filtroZona, setFiltroZona] = useState('')
  const [costo, setCosto] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingDati, setLoadingDati] = useState(true)

  useEffect(() => { if (user) fetchTutto() }, [user])

 useEffect(() => {
  if (form.ingresso && form.uscita && form.posto_id) {
    const ore = (new Date(form.uscita) - new Date(form.ingresso)) / 3600000
    if (ore > 0) {
      const posto = posti.find(p => p.id.toString() === form.posto_id)
      const tariffa = Number(posto?.tariffa_oraria) || 0
      // Arrotonda per eccesso: 10 min = 1h, 1h 2min = 2h
      const oreArrotondate = Math.ceil(ore)
      setCosto(Math.round(oreArrotondate * tariffa * 100) / 100)
    } else setCosto(0)
  } else setCosto(0)
}, [form, posti])
  // Quando cambia il veicolo, resetta il posto selezionato
  useEffect(() => {
    setForm(f => ({ ...f, posto_id: '' }))
    setFiltroZona('')
  }, [form.veicolo_id])

  const fetchTutto = async () => {
    setLoadingDati(true)
    const [
      { data: vd },
      { data: pd },
      { data: zd },
      { data: prenAttiva }
    ] = await Promise.all([
      supabase.from('veicoli').select('*').eq('user_id', user.id).order('targa'),
      supabase.from('posti').select('*, zone(id,nome,accetta_gpl), tipologie_posto(nome)').eq('stato', 'libero').order('codice_posto'),
      supabase.from('zone').select('id,nome').eq('attiva', true).order('nome'),
      supabase.from('prenotazioni')
        .select('id, stato, orario_ingresso, posti(codice_posto, zone(nome)), veicoli(targa)')
        .eq('user_id', user.id)
        .eq('stato', 'attiva')
        .limit(1)
        .maybeSingle()
    ])
    setVeicoli(vd || [])
    setPosti(pd || [])
    setZone(zd || [])
    setPrenotazioneAttiva(prenAttiva)
    setLoadingDati(false)
  }

  const veicoloSelezionato = veicoli.find(v => v.id.toString() === form.veicolo_id)

  // Filtra i posti compatibili con il veicolo selezionato
  const postiFiltrati = posti.filter(p => {
    // Filtra per zona se selezionata
    if (filtroZona && p.zone?.id?.toString() !== filtroZona) return false

    if (!veicoloSelezionato) return true

    // GPL: se la zona non accetta GPL e il veicolo è GPL, escludi
    if (veicoloSelezionato.alimentazione === 'gpl' && !p.zone?.accetta_gpl) return false

    // Solo elettrici: se il posto richiede elettrico e il veicolo non è elettrico, escludi
    if (p.solo_elettriche && veicoloSelezionato.alimentazione !== 'elettrica') return false

    // Permesso disabili: se il posto richiede il permesso e il veicolo non ce l'ha, escludi
    if (p.richiede_permesso_disabili && !veicoloSelezionato.ha_permesso_disabili) return false

    // Permesso residente: se il posto richiede il permesso e il veicolo non ce l'ha, escludi
    if (p.richiede_permesso_residente && !veicoloSelezionato.ha_permesso_residente) return false

    return true
  })

  const postoSelezionato = posti.find(p => p.id.toString() === form.posto_id)

  const eliminaPrenotazione = async () => {
    const nonIniziata = prenotazioneAttiva && new Date(prenotazioneAttiva.orario_ingresso) > new Date()
    if (!nonIniziata) return alert('Puoi eliminare solo prenotazioni non ancora iniziate.')
    if (!confirm('Eliminare la prenotazione? Il posto tornerà disponibile.')) return

    const { error } = await supabase.from('prenotazioni').update({ stato: 'annullata' }).eq('id', prenotazioneAttiva.id)
    if (error) { alert('Errore: ' + error.message); return }

    await supabase.from('posti').update({ stato: 'libero' }).eq('id', prenotazioneAttiva.posto_id)
    alert('Prenotazione eliminata!')
    fetchTutto()
  }

  const conferma = async (e) => {
    e.preventDefault()
    if (prenotazioneAttiva) return alert('Hai già una prenotazione attiva. Concludila prima di prenotarne un\'altra.')
    if (!form.veicolo_id || !form.posto_id || !form.ingresso) return alert('Compila tutti i campi obbligatori.')
    if (form.uscita && (new Date(form.uscita) - new Date(form.ingresso)) <= 0) return alert('L\'uscita deve essere dopo l\'ingresso.')

    setLoading(true)

    // Controlla che il posto sia ancora libero (doppia verifica)
    const { data: postoCheck } = await supabase.from('posti').select('stato').eq('id', Number(form.posto_id)).single()
    if (postoCheck?.stato !== 'libero') {
      alert('Il posto è stato occupato nel frattempo. Selezionane un altro.')
      setLoading(false)
      fetchTutto()
      return
    }

    const { error } = await supabase.from('prenotazioni').insert({
      user_id: user.id,
      veicolo_id: Number(form.veicolo_id),
      posto_id: Number(form.posto_id),
      orario_ingresso: form.ingresso,
      orario_uscita_previsto: form.uscita || null,
      costo_totale: costo,
      stato: 'attiva'
    })

    if (error) { alert('Errore: ' + error.message); setLoading(false); return }

    await supabase.from('posti').update({ stato: 'occupato' }).eq('id', Number(form.posto_id))

    setLoading(false)
    alert('Prenotazione confermata!')
    navigate('/dashboard')
  }

  if (loadingDati) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'50vh', color:'#64748b' }}>
      Caricamento...
    </div>
  )

  return (
    <div className="container py-4" style={{ maxWidth:'680px' }}>
      <h3 className="fw-bold text-success mb-4">Nuova Prenotazione</h3>

      {/* BLOCCO: prenotazione già attiva */}
      {prenotazioneAttiva && (
        <div className="alert alert-warning mb-4">
          <div className="fw-bold mb-1">⚠️ Hai già una prenotazione attiva</div>
          <div className="small">
            <strong>{prenotazioneAttiva.posti?.zone?.nome}</strong> — posto <strong>{prenotazioneAttiva.posti?.codice_posto}</strong>
            &nbsp;|&nbsp; Veicolo: <strong>{prenotazioneAttiva.veicoli?.targa}</strong>
            &nbsp;|&nbsp; Ingresso: <strong>{new Date(prenotazioneAttiva.orario_ingresso).toLocaleString('it-IT')}</strong>
          </div>
          <div className="mt-2 d-flex gap-2">
            <button className="btn btn-sm btn-warning" onClick={() => navigate('/dashboard')}>
              Vai alle prenotazioni →
            </button>
            {new Date(prenotazioneAttiva.orario_ingresso) > new Date() && (
              <button className="btn btn-sm btn-danger" onClick={eliminaPrenotazione}>
                🗑️ Elimina prenotazione
              </button>
            )}
          </div>
        </div>
      )}

      <div className="card p-4 shadow-sm border-0" style={{ opacity: prenotazioneAttiva ? 0.5 : 1, pointerEvents: prenotazioneAttiva ? 'none' : 'auto' }}>
        <form onSubmit={conferma}>

          {/* STEP 1 — Veicolo */}
          <div className="mb-4">
            <label className="form-label fw-bold">1. Scegli il veicolo</label>
            {veicoli.length === 0 ? (
              <div className="alert alert-warning py-2 small">
                Nessun veicolo registrato.{' '}
                <a href="/veicoli" className="fw-bold">Aggiungi un veicolo</a> prima di prenotare.
              </div>
            ) : (
              <select className="form-select" value={form.veicolo_id} onChange={e => setForm({...form, veicolo_id: e.target.value})} required>
                <option value="">Seleziona veicolo...</option>
                {veicoli.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.targa} — {v.tipo} / {v.alimentazione}
                    {v.ha_permesso_disabili ? ' ♿' : ''}
                    {v.ha_permesso_residente ? ' 🏠' : ''}
                  </option>
                ))}
              </select>
            )}

            {/* Info compatibilità veicolo */}
            {veicoloSelezionato && (
              <div className="mt-2 p-2 rounded small" style={{ background:'#f0fdf4', border:'1px solid #bbf7d0' }}>
                <strong>Compatibilità veicolo:</strong>
                <div className="d-flex flex-wrap gap-2 mt-1">
                  {veicoloSelezionato.alimentazione === 'gpl' && (
                    <span className="badge bg-warning text-dark">Solo zone GPL</span>
                  )}
                  {veicoloSelezionato.alimentazione === 'elettrica' && (
                    <span className="badge bg-primary">Accede a posti elettrici</span>
                  )}
                  {veicoloSelezionato.ha_permesso_disabili && (
                    <span className="badge bg-purple" style={{ background:'#8b5cf6' }}>♿ Permesso disabili</span>
                  )}
                  {veicoloSelezionato.ha_permesso_residente && (
                    <span className="badge bg-warning text-dark">🏠 Permesso residente</span>
                  )}
                  <span className="badge bg-secondary">{postiFiltrati.length} posti compatibili</span>
                </div>
              </div>
            )}
          </div>

          {/* STEP 2 — Posto */}
          <div className="mb-4">
            <label className="form-label fw-bold">2. Scegli il posto</label>
            <select className="form-select mb-2" value={filtroZona} onChange={e => { setFiltroZona(e.target.value); setForm({...form, posto_id:''}) }}>
              <option value="">Tutte le zone</option>
              {zone.map(z => <option key={z.id} value={z.id}>{z.nome}</option>)}
            </select>
            <select className="form-select" value={form.posto_id} onChange={e => setForm({...form, posto_id: e.target.value})} required disabled={!form.veicolo_id}>
              <option value="">{form.veicolo_id ? 'Seleziona posto disponibile...' : 'Seleziona prima un veicolo'}</option>
              {postiFiltrati.map(p => (
                <option key={p.id} value={p.id}>
                  {p.codice_posto} — {p.zone?.nome} ({p.tipologie_posto?.nome})
                  {p.gratuito ? ' — GRATUITO' : p.tariffa_oraria > 0 ? ' — €' + Number(p.tariffa_oraria).toFixed(2) + '/h' : ''}
                  {p.solo_elettriche ? ' ⚡' : ''}
                  {p.richiede_permesso_disabili ? ' ♿' : ''}
                  {p.richiede_permesso_residente ? ' 🏠' : ''}
                </option>
              ))}
            </select>
            {form.veicolo_id && postiFiltrati.length === 0 && (
              <div className="text-danger small mt-1">Nessun posto disponibile compatibile con questo veicolo.</div>
            )}
          </div>

          {/* STEP 3 — Orari */}
          <div className="mb-4">
            <label className="form-label fw-bold">3. Orari</label>
            <div className="row g-2">
              <div className="col-6">
                <label className="form-label small">Ingresso *</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={form.ingresso}
                  onChange={e => setForm({...form, ingresso: e.target.value})}
                  required
                />
              </div>
              <div className="col-6">
                <label className="form-label small">Uscita prevista</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={form.uscita}
                  min={form.ingresso}
                  onChange={e => setForm({...form, uscita: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* RIEPILOGO */}
          {postoSelezionato && (
            <div className="mb-4 p-3 rounded" style={{ background:'#f8fafc', border:'1px solid #e2e8f0' }}>
              <div className="fw-bold mb-2 small text-muted text-uppercase">Riepilogo</div>
              <div className="row small">
                <div className="col-6">
                  <div>📍 <strong>{postoSelezionato.zone?.nome}</strong></div>
                  <div>🅿️ Posto: <strong>{postoSelezionato.codice_posto}</strong></div>
                  <div>🏷️ Tipo: <strong>{postoSelezionato.tipologie_posto?.nome}</strong></div>
                </div>
                <div className="col-6">
                  {postoSelezionato.gratuito ? (
                    <div className="text-success fw-bold">✓ Posto gratuito</div>
                  ) : postoSelezionato.tariffa_oraria > 0 ? (
                    <div>💶 Tariffa: <strong>€{Number(postoSelezionato.tariffa_oraria).toFixed(2)}/h</strong></div>
                  ) : null}
                  {postoSelezionato.limite_minuti && (
                    <div className="text-warning">⏱ Max {postoSelezionato.limite_minuti} min</div>
                  )}
                  {costo > 0 && (
                    <div className="text-success fw-bold fs-5 mt-1">Stima: €{costo.toFixed(2)}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          <button
            className="btn btn-success w-100 py-2 fw-bold"
            type="submit"
            disabled={loading || veicoli.length === 0 || !!prenotazioneAttiva}
          >
            {loading ? 'Prenotazione in corso...' : 'Conferma Prenotazione'}
          </button>
        </form>
      </div>
    </div>
  )
}