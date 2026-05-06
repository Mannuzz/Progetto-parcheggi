import React, { useState } from 'react';
import { useAuth } from '/src/context/AuthContext';
const Profile = () => {
  const { user } = useAuth();
  const [nome, setNome] = useState(user?.nome || '');
  const [email, setEmail] = useState(user?.email || '');

  return (
    <div className="container py-4" style={{ maxWidth: '600px' }}>
      <h3 className="fw-bold text-success mb-4">Mio Profilo</h3>
      
      <div className="card p-4 mb-4 shadow-sm">
        <h5 className="mb-3">Dati Personali</h5>
        <div className="mb-3">
          <label className="form-label">Nome e Cognome</label>
          <input type="text" className="form-control" value={nome} onChange={e => setNome(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <button className="btn btn-success">Salva Modifiche</button>
      </div>

      <div className="card p-4 shadow-sm border-0 bg-light">
        <h5 className="mb-3">Sicurezza</h5>
        <button className="btn btn-outline-success btn-sm">Cambia Password</button>
      </div>
    </div>
  );
};

export default Profile;