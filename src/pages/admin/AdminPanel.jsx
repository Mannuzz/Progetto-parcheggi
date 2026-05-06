import { useState } from 'react'
import AdminDashboard from './sections/AdminDashboard'
import GestioneStalli from './sections/GestioneStalli'
import GestioneZone from './sections/GestioneZone'
import GestioneUtenti from './sections/GestioneUtenti'
import incassi from './sections/incassi'
import { useAuth } from '../../context/AuthContext'

export default function AdminPanel() {
  const [tabAttiva, setTabAttiva] = useState('dashboard')
  const { user, profile } = useAuth()

  // Protezione Accesso: Se non è admin, blocca la visualizzazione
  if (profile?.ruolo !== 'admin') {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger text-center">
          <h4>Accesso Negato</h4>
          <p>Non hai i permessi necessari per visualizzare questa pagina.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid">
      <div className="row">
        {/* Sidebar di Navigazione */}
        <nav className="col-md-3 col-lg-2 d-md-block bg-dark sidebar vh-100 p-0 shadow">
          <div className="position-sticky pt-4">
            <div className="px-4 mb-4">
              <h5 className="text-white fw-bold">Smart Parking</h5>
              <small className="text-success text-uppercase">Admin Area</small>
            </div>
            
            <ul className="nav flex-column px-2">
              <li className="nav-item">
                <button 
                  className={`btn w-100 text-start mb-1 ${tabAttiva === 'dashboard' ? 'btn-success' : 'btn-dark'}`}
                  onClick={() => setTabAttiva('dashboard')}
                >
                  📊 Dashboard
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`btn w-100 text-start mb-1 ${tabAttiva === 'zone' ? 'btn-success' : 'btn-dark'}`}
                  onClick={() => setTabAttiva('zone')}
                >
                  📍 Gestione Zone
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`btn w-100 text-start mb-1 ${tabAttiva === 'stalli' ? 'btn-success' : 'btn-dark'}`}
                  onClick={() => setTabAttiva('stalli')}
                >
                  🚗 Gestione Stalli
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`btn w-100 text-start mb-1 ${tabAttiva === 'utenti' ? 'btn-success' : 'btn-dark'}`}
                  onClick={() => setTabAttiva('utenti')}
                >
                  👥 Gestione Utenti
                </button>
              </li>
            </ul>
          </div>
        </nav>

        {/* Area Contenuto Principale */}
        <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 bg-light">
          <div className="pt-3 pb-2 mb-3 border-bottom d-flex justify-content-between align-items-center">
            <h1 className="h4 text-secondary uppercase">
              {tabAttiva === 'dashboard' && 'Dashboard Panoramica'}
              {tabAttiva === 'zone' && 'Amministrazione Zone'}
              {tabAttiva === 'stalli' && 'Controllo Stalli e Tariffe'}
              {tabAttiva === 'utenti' && 'Anagrafica Utenti'}
            </h1>
            <div className="text-muted small">Accesso come: <strong>{profile?.email}</strong></div>
          </div>

          <div className="fade-in">
            {tabAttiva === 'dashboard' && <AdminDashboard />}
            {tabAttiva === 'zone' && <GestioneZone />}
            {tabAttiva === 'stalli' && <GestioneStalli />}
            {tabAttiva === 'utenti' && <GestioneUtenti />}
          </div>
        </main>
      </div>
    </div>
  )
}