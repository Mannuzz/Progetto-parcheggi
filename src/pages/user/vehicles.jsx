import React, { useState } from 'react';

const Vehicles = () => {
  const [veicoli, setVeicoli] = useState([
    { id_veicolo: 1, targa: 'AB123CD', tipo: 'auto', alimentazione: 'elettrica', is_heavy: false }
  ]);
  const [showAdd, setShowAdd] = useState(false);

  const deleteVeicolo = (id) => {
    if(window.confirm("Rimuovere il veicolo?")) setVeicoli(veicoli.filter(v => v.id_veicolo !== id));
  };

  return (
    <div className="container py-4" style={{ maxWidth: '800px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold text-success"><i className="bi bi-car-front"></i> I miei Veicoli</h3>
        <button className="btn btn-success btn-sm" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? 'Chiudi' : '+ Aggiungi Veicolo'}
        </button>
      </div>

      {showAdd && (
        <div className="card p-4 mb-4 shadow-sm border-0 bg-light">
          <form className="row g-3">
            <div className="col-md-4">
              <input type="text" className="form-control text-uppercase" placeholder="Targa" required />
            </div>
            <div className="col-md-4">
              <select className="form-select">
                <option value="auto">Auto</option>
                <option value="moto">Moto</option>
                <option value="furgone">Furgone</option>
              </select>
            </div>
            <div className="col-md-4">
              <button className="btn btn-success w-100">Salva</button>
            </div>
          </form>
        </div>
      )}

      <div className="row g-3">
        {veicoli.map(v => (
          <div key={v.id_veicolo} className="col-md-6">
            <div className="card p-3 shadow-sm border-0 d-flex flex-row justify-content-between align-items-center">
              <div>
                <span className="fs-5 fw-bold">{v.targa}</span>
                <div className="text-muted small">
                  {v.tipo === 'auto' ? '🚗' : '🏍️'} {v.alimentazione}
                  {v.is_heavy && <span className="text-warning ms-1">· Pesante</span>}
                </div>
              </div>
              <button onClick={() => deleteVeicolo(v.id_veicolo)} className="btn btn-outline-danger btn-sm">
                <i className="bi bi-trash"></i>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Vehicles;