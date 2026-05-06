import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'

export default function GestioneZone() {
  const [zone, setZone] = useState([])
  const [loading, setLoading] = useState(true)
  const [mostraForm, setMostraForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ nome:'', quartiere:'', tipo_area:'superficie', accetta_gpl:true, attiva:true, lat:'', lng:'' })

  useEffect(() => { fetchZone() }, [])

  const fetchZone = async () => {
    setLoading(true)
    const { data:zd } = await supabase.from('zone').select('*').order('nome')
    const { data:pd } = await supabase.from('posti').select('zona_id')
    const conteggio = (pd||[]).reduce((acc,p) => { acc[p.zona_id]=(acc[p.zona_id]||0)+1; return acc }, {})
    setZone((zd||[]).map(z => ({ ...z, n_posti:conteggio[z.id]||0 })))
    setLoading(false)
  }

  const apriForm = (zona=null) => {
    setEditing(zona)
    setForm(zona
      ? { nome:zona.nome, quartiere:zona.quartiere, tipo_area:zona.tipo_area, accetta_gpl:zona.accetta_gpl, attiva:zona.attiva, lat:zona.lat||'', lng:zona.lng||'' }
      : { nome:'', quartiere:'', tipo_area:'superficie', accetta_gpl:true, attiva:true, lat:'', lng:'' }
    )
    setMostraForm(true)
  }

  const salva = async (e) => {
    e.preventDefault()
    const payload = { ...form, lat:form.lat?Number(form.lat):null, lng:form.lng?Number(form.lng):null }
    if (editing) await supabase.from('zone').update(payload).eq('id', editing.id)
    else await supabase.from('zone').insert(payload)
    setMostraForm(false); setEditing(null); fetchZone()
  }

  const toggleAttiva = async (z) => {
    await supabase.from('zone').update({ attiva:!z.attiva }).eq('id', z.id)
    fetchZone()
  }

  if (loading) return <div className="p-4 text-muted">Caricamento...</div>

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold mb-0">Gestione Zone ({zone.length})</h3>
        <button className="btn btn-success" onClick={() => apriForm()}>+ Nuova Zona</button>
      </div>

      {mostraForm && (
        <div className="card p-4 mb-4 shadow-sm">
          <h5 className="mb-3">{editing ? 'Modifica Zona' : 'Nuova Zona'}</h5>
          <form onSubmit={salva}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Nome *</label>
                <input type="text" className="form-control" value={form.nome} onChange={e => setForm({...form, nome:e.target.value})} required />
              </div>
              <div className="col-md-4">
                <label className="form-label">Quartiere *</label>
                <input type="text" className="form-control" value={form.quartiere} onChange={e => setForm({...form, quartiere:e.target.value})} required />
              </div>
              <div className="col-md-4">
                <label className="form-label">Tipo area</label>
                <select className="form-select" value={form.tipo_area} onChange={e => setForm({...form, tipo_area:e.target.value})}>
                  <option value="superficie">Superficie</option>
                  <option value="sotterraneo">Sotterraneo</option>
                  <option value="struttura">Struttura</option>
                  <option value="strada">Strada</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Latitudine</label>
                <input type="number" className="form-control" step="0.000001" value={form.lat} onChange={e => setForm({...form, lat:e.target.value})} />
              </div>
              <div className="col-md-3">
                <label className="form-label">Longitudine</label>
                <input type="number" className="form-control" step="0.000001" value={form.lng} onChange={e => setForm({...form, lng:e.target.value})} />
              </div>
              <div className="col-md-6 d-flex gap-4 align-items-end pb-1">
                <div className="form-check">
                  <input type="checkbox" className="form-check-input" id="gpl" checked={form.accetta_gpl} onChange={e => setForm({...form, accetta_gpl:e.target.checked})} />
                  <label className="form-check-label" htmlFor="gpl">Accetta GPL</label>
                </div>
                <div className="form-check">
                  <input type="checkbox" className="form-check-input" id="attiva" checked={form.attiva} onChange={e => setForm({...form, attiva:e.target.checked})} />
                  <label className="form-check-label" htmlFor="attiva">Zona attiva</label>
                </div>
              </div>
              <div className="col-12">
                <button type="submit" className="btn btn-success me-2">Salva</button>
                <button type="button" className="btn btn-outline-secondary" onClick={() => setMostraForm(false)}>Annulla</button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle">
            <thead className="table-light">
              <tr><th>Nome</th><th>Quartiere</th><th>Tipo</th><th>GPL</th><th>Posti</th><th>Stato</th><th>Azioni</th></tr>
            </thead>
            <tbody>
              {zone.map(z => (
                <tr key={z.id}>
                  <td className="fw-semibold">{z.nome}</td>
                  <td>{z.quartiere}</td>
                  <td><span className="badge bg-secondary">{z.tipo_area}</span></td>
                  <td>{z.accetta_gpl?'✓':'✗'}</td>
                  <td>{z.n_posti}</td>
                  <td><span className={'badge '+(z.attiva?'bg-success':'bg-secondary')}>{z.attiva?'Attiva':'Inattiva'}</span></td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-1" onClick={() => apriForm(z)}>✏️</button>
                    <button className={'btn btn-sm '+(z.attiva?'btn-outline-warning':'btn-outline-success')} onClick={() => toggleAttiva(z)}>
                      {z.attiva?'Disattiva':'Attiva'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}