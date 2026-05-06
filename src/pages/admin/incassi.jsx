import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'

export default function Incassi() {
  const primoMese = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const oggi = new Date().toISOString().split('T')[0]
  const [da, setDa] = useState(primoMese)
  const [a, setA] = useState(oggi)
  const [incassi, setIncassi] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchIncassi() }, [])

  const fetchIncassi = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('incassi')
      .select('*')
      .gte('data_incasso', da+'T00:00:00')
      .lte('data_incasso', a+'T23:59:59')
      .order('data_incasso', { ascending:false })
    setIncassi(data||[])
    setLoading(false)
  }

  const totale = incassi.reduce((s,i) => s+Number(i.importo), 0)
  const perZona = incassi.reduce((acc,i) => {
    const z = i.zona_nome||'Altro'
    acc[z]=(acc[z]||0)+Number(i.importo)
    return acc
  }, {})

  return (
    <div className="p-4">
      <h3 className="fw-bold mb-4">Report Incassi</h3>

      <div className="card p-3 mb-4 shadow-sm">
        <div className="row g-2 align-items-end">
          <div className="col-sm-4">
            <label className="form-label small fw-bold">Dal</label>
            <input type="date" className="form-control" value={da} onChange={e => setDa(e.target.value)} />
          </div>
          <div className="col-sm-4">
            <label className="form-label small fw-bold">Al</label>
            <input type="date" className="form-control" value={a} onChange={e => setA(e.target.value)} />
          </div>
          <div className="col-sm-4">
            <button className="btn btn-success w-100" onClick={fetchIncassi} disabled={loading}>
              {loading?'Caricamento...':'Filtra'}
            </button>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card p-3 text-center border-0 shadow-sm" style={{ background:'#10b981', color:'white' }}>
            <div className="small">Totale Incassato</div>
            <div className="fs-2 fw-bold">€{totale.toFixed(2)}</div>
            <div className="small opacity-75">{incassi.length} transazioni</div>
          </div>
        </div>
        {Object.entries(perZona).slice(0,4).map(([zona,tot]) => (
          <div key={zona} className="col-md-4">
            <div className="card p-3 shadow-sm border-0">
              <div className="text-muted small">{zona}</div>
              <div className="fs-4 fw-bold text-success">€{tot.toFixed(2)}</div>
              <div className="text-muted small">{incassi.filter(i=>i.zona_nome===zona).length} transazioni</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card shadow-sm">
        <div className="card-header fw-semibold bg-white">Dettaglio Transazioni</div>
        <div className="table-responsive">
          <table className="table table-sm table-hover mb-0 align-middle">
            <thead className="table-light">
              <tr><th>Data</th><th>Zona</th><th>Posto</th><th>Tipo</th><th>Importo</th></tr>
            </thead>
            <tbody>
              {incassi.map(i => (
                <tr key={i.id}>
                  <td className="small">{new Date(i.data_incasso).toLocaleString('it-IT')}</td>
                  <td>{i.zona_nome}</td>
                  <td><code>{i.codice_posto}</code></td>
                  <td className="small text-muted">{i.tipo_posto_nome}</td>
                  <td className="fw-bold text-success">€{Number(i.importo).toFixed(2)}</td>
                </tr>
              ))}
              {incassi.length===0 && (
                <tr><td colSpan="5" className="text-center text-muted py-3">Nessun incasso nel periodo</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}