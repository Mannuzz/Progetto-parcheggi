import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    login(email, 'password123'); // Chiamiamo il login nel context
    navigate('/'); // Mandiamo alla radice, poi App.jsx decide dove smistare
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4 shadow-sm" style={{maxWidth: '400px', width: '100%'}}>
        <h3 className="text-center text-success fw-bold mb-4">Accedi</h3>
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input 
              type="email" 
              className="form-control" 
              placeholder="admin@bresciagreen.it o mario@test.it"
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="btn btn-success w-100">Entra</button>
        </form>
      </div>
    </div>
  );
};

export default Login;