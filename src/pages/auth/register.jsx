import React, { useState } from 'react';

const Register = () => {
  const [formData, setFormData] = useState({ nome: '', email: '', password: '', confirm: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirm) return alert("Le password non coincidono");
    alert("Registrazione effettuata! Ora puoi accedere.");
  };

  return (
    <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <div className="card p-4 shadow" style={{ maxWidth: '440px', width: '100%' }}>
        <h2 className="text-center fw-bold text-success mb-4">Registrati</h2>
        <form onSubmit={handleSubmit}>
          <input type="text" className="form-control mb-3" placeholder="Nome e Cognome" onChange={(e) => setFormData({...formData, nome: e.target.value})} />
          <input type="email" className="form-control mb-3" placeholder="Email" onChange={(e) => setFormData({...formData, email: e.target.value})} />
          <input type="password" className="form-control mb-3" placeholder="Password" onChange={(e) => setFormData({...formData, password: e.target.value})} />
          <input type="password" className="form-control mb-4" placeholder="Conferma Password" onChange={(e) => setFormData({...formData, confirm: e.target.value})} />
          <button type="submit" className="btn btn-success w-100">Crea Account</button>
        </form>
      </div>
    </div>
  );
};

export default Register;