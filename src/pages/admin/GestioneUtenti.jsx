import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { useAuth } from '../../context/AuthContext'

export default function GestioneUtenti() {
  const { user } = useAuth()
  const [utenti, setUtenti] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchUtenti() }, [])

  const fetchUtenti = async () => {
    setLoading(true)
    const { data } = await supabase.from('profili_utenti').select('*').order('created_at', { ascending:false })
    setUtenti(data||[])
    setLoading(false)
  }

  const toggleRuolo = async (u) => {
    if (u.id === user.id) return alert('Non puoi modificare il tuo account.')
    const nuovoRuolo = u.ruolo === 'admin' ? 'cittadino' : 'admin'
    if (!confirm('Cambiare ruolo di ' + u.email + ' a ' + nuovoRuolo + '?')) return
    await supabase.from('profili_utenti').update({ ruolo:nuovoRuolo }).eq('id', u.id)
    fetchUtenti()
  }

  const elimina = async (u) => {
    if (u.id === user.id) return alert('Non puoi eliminare il tuo account.')
    if (!confirm('Eliminare ' + (u.email||u.nome) + '?')) return
    await supabase.from('profili_utenti').delete().eq('id', u.id)
    fetchUtenti()
  }

  if (loading) return <div className="p-4 text-muted">Caricamento...</div>

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold mb-0">Gestione Utenti ({utenti.length})</h3>
        <button className="btn btn-sm btn-outline-success" onClick={fetchUtenti}>Aggiorna</button>
      </div>
      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle">
            <thead className="table-light">
              <tr><th>Nome</th><th>Email</th><th>Ruolo</th><th>Registrato</th><th>Azioni</th></tr>
            </thead>
            <tbody>
              {utenti.map(u => (
                <tr key={u.id}>
                  <td className="fw-semibold">
                    {u.nome||'—'} {u.cognome||''}
                    {u.id === user.id && <span className="badge bg-info text-dark ms-1 small">Tu</span>}
                  </td>
                  <td className="text-muted small">{u.email}</td>
                  <td><span className={'badge '+(u.ruolo==='admin'?'bg-dark':'bg-success')}>{u.ruolo}</span></td>
                  <td className="small text-muted">{new Date(u.created_at).toLocaleDateString('it-IT')}</td>
                  <td>
                    {u.id !== user.id && (
                      <>
                        <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => toggleRuolo(u)}>
                          {u.ruolo==='admin'?'→ Cittadino':'→ Admin'}
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => elimina(u)}>🗑️</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="alert alert-warning mt-3 small mb-0">
        ⚠️ L'eliminazione rimuove solo il profilo. Per rimuovere completamente l'accesso vai su Supabase → Authentication → Users.
      </div>
    </div>
  )
}