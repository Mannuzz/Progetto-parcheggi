import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { useAuth } from '../../context/AuthContext'

export default function AdminDashboard() {
  const { generaCodice } = useAuth()
  const [stats, setStats] = useState({ prenOggi:0, attive:0, incassoOggi:0, utenti:0 })
  const [prenotazioni, setPrenotazioni] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    aggiornaeTutto()
    const timer = setInterval(() => aggiornaeTutto(), 30000)
    const channel = supabase
      .channel('admin_realtime')
      .on('postgres_changes', { event:'*', schema:'public', table:'incassi' }, () => fetchData())
      .on('postgres_changes', { event:'*', schema:'public', table:'prenotazioni' }, () => fetchData())
      .subscribe()
    return () => { clearInterval(timer); supabase.removeChannel(channel) }
  }, [])

  const aggiornaeTutto = async () => {
    // Prima gestisce le scadenze sul DB, poi aggiorna i dati
    await supabase.rpc('gestisci_scadenze')
    await fetchData()
  }

  const fetchData = async () => {
    const oggi = new Date().toISOString().split('T')[0]
    const [
      { count: prenOggi },
      { count: attive },
      { count: utenti },
      { data: incassiOggi },
      { data: ultime }
    ] = await Promise.all([
      supabase.from('prenotazioni').select('*', { count:'exact', head:true }).gte('created_at', oggi),
      supabase.from('prenotazioni').select('*', { count:'exact', head:true }).eq('stato', 'attiva'),
      supabase.from('profili_utenti').select('*', { count:'exact', head:true }),
      supabase.from('incassi').select('importo').gte('data_incasso', oggi + 'T00:00:00'),
      supabase.from('prenotazioni')
        .select('id, stato, orario_ingresso, orario_uscita_previsto, orario_uscita_effettivo, costo_totale, profili_utenti(nome, cognome), veicoli(targa), posti(codice_posto, zone(nome))')
        .order('created_at', { ascending:false })
        .limit(50)
    ])
    const incassoOggi = incassiOggi?.reduce((s, i) => s + Number(i.importo), 0) || 0
    setStats({ prenOggi: prenOggi||0, attive: attive||0, incassoOggi, utenti: utenti||0 })
    setPrenotazioni(ultime || [])
    setLoading(false)
  }

  const colBadge = {
    attiva:'success', conclusa:'secondary', annullata:'danger', scaduta:'dark'
  }

  const formatData = (data) => {
    if (!data) return '—'
    return new Date(data).toLocaleString('it-IT', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' })
  }

  const annullaPrenotazione = async (p) => {
    const nonIniziata = new Date(p.orario_ingresso) > new Date()
    if (!nonIniziata) return alert('Puoi eliminare solo prenotazioni non ancora iniziate.')
    if (!confirm('Annullare la prenotazione? Il posto tornerà disponibile.')) return
    
    await supabase.from('prenotazioni').update({ stato: 'annullata' }).eq('id', p.id)
    await supabase.from('posti').update({ stato: 'libero' }).eq('id', p.posto_id)
    alert('Prenotazione annullata!')
    aggiornaeTutto()
  }

  if (loading) return <div className="p-4 text-muted">Caricamento...</div>

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-1">
        <h3 className="fw-bold mb-0">Pannello Amministratore</h3>
        <span style={{ fontSize:'0.75rem', color:'#10b981', fontWeight:'bold' }}>● Live</span>
      </div>
      <p className="text-muted small mb-4"></p>

      <div className="row g-3 mb-4">
        {[
          { label:'Prenotazioni Oggi', val:stats.prenOggi, col:'success' },
          { label:'Sessioni Attive', val:stats.attive, col:'primary' },
          { label:'Incasso Oggi', val:'€'+stats.incassoOggi.toFixed(2), col:'warning' },
          { label:'Utenti Totali', val:stats.utenti, col:'info' },
        ].map((s,i) => (
          <div key={i} className="col-6 col-lg-3">
            <div className={'card p-3 border-0 shadow-sm border-start border-4 border-'+s.col}>
              <div className="text-muted small">{s.label}</div>
              <div className="fs-3 fw-bold">{s.val}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card shadow-sm">
        <div className="card-header fw-semibold bg-white d-flex justify-content-between align-items-center">
          <span>Storico Prenotazioni ({prenotazioni.length})</span>
          <button className="btn btn-sm btn-outline-success" onClick={aggiornaeTutto}>↻ Aggiorna ora</button>
        </div>
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle" style={{ fontSize:'0.83rem' }}>
            <thead className="table-light">
              <tr>
                <th>Codice</th>
                <th>Utente</th>
                <th>Targa</th>
                <th>Zona / Posto</th>
                <th>Ingresso</th>
                <th>Uscita prevista</th>
                <th>Uscita effettiva</th>
                <th>Costo</th>
                <th>Stato</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {prenotazioni.map(p => {
                const nonIniziata = new Date(p.orario_ingresso) > new Date()
                return (
                  <tr key={p.id}>
                    <td><code className="text-success fw-bold">{generaCodice(p.id)}</code></td>
                    <td>{p.profili_utenti?.nome} {p.profili_utenti?.cognome}</td>
                    <td>{p.veicoli?.targa}</td>
                    <td>{p.posti?.zone?.nome} — {p.posti?.codice_posto}</td>
                    <td>{formatData(p.orario_ingresso)}</td>
                    <td className="text-muted">{formatData(p.orario_uscita_previsto)}</td>
                    <td>
                      {p.orario_uscita_effettivo
                        ? <span className="text-success fw-bold">{formatData(p.orario_uscita_effettivo)}</span>
                        : p.stato === 'attiva'
                          ? <span className="badge bg-success">In corso</span>
                          : <span className="text-muted">—</span>
                      }
                    </td>
                    <td className="fw-bold text-success">€{Number(p.costo_totale).toFixed(2)}</td>
                    <td><span className={'badge bg-'+(colBadge[p.stato]||'secondary')}>{p.stato}</span></td>
                    <td>
                      {nonIniziata && p.stato === 'attiva' && (
                        <button className="btn btn-sm btn-outline-danger" onClick={() => annullaPrenotazione(p)} title="Elimina prenotazione">
                          🗑️ Elimina
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
              {prenotazioni.length === 0 && (
                <tr><td colSpan="9" className="text-center text-muted py-3">Nessuna prenotazione</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}