import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Sidebar() {
  const { profilo } = useAuth()
  const isAdmin = profilo?.ruolo === 'admin'

  const linkStyle = ({ isActive }) => ({
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    padding: '0.55rem 0.75rem', borderRadius: '6px', textDecoration: 'none',
    fontWeight: 500, fontSize: '0.88rem', marginBottom: '2px',
    background: isActive ? '#166534' : 'transparent',
    color: isActive ? 'white' : '#374151',
  })

  return (
    <div style={{ width:'230px', minHeight:'100%', background:'white', borderRight:'1px solid #e2e8f0', padding:'1rem 0.75rem', flexShrink:0, display:'flex', flexDirection:'column' }}>
      <div style={{ fontSize:'0.7rem', fontWeight:'bold', color:'#9ca3af', textTransform:'uppercase', padding:'0 0.5rem', marginBottom:'0.5rem' }}>
        {isAdmin ? 'Amministrazione' : 'Area Personale'}
      </div>

      {isAdmin ? (
        <>
          <NavLink to="/admin" end style={linkStyle}>📊 Dashboard</NavLink>
          <NavLink to="/admin/utenti" style={linkStyle}>👥 Utenti</NavLink>
          <NavLink to="/admin/zone" style={linkStyle}>📍 Zone</NavLink>
          <NavLink to="/admin/stalli" style={linkStyle}>🅿️ Stalli & Tariffe</NavLink>
          <NavLink to="/admin/incassi" style={linkStyle}>💶 Incassi</NavLink>
        </>
      ) : (
        <>
          <NavLink to="/dashboard" end style={linkStyle}>🗺️ Mappa</NavLink>
          <NavLink to="/dashboard?tab=prenotazioni" style={linkStyle}>📋 Le mie Prenotazioni</NavLink>
          <NavLink to="/prenota" style={linkStyle}>🅿️ Prenota Posto</NavLink>
          <NavLink to="/veicoli" style={linkStyle}>🚗 I miei Veicoli</NavLink>
          <NavLink to="/profilo" style={linkStyle}>👤 Profilo</NavLink>
        </>
      )}
    </div>
  )
}