import { useAuth } from '../../context/AuthContext'

export default function Header() {
  const { user, profilo, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    window.location.href = '/'
  }

  return (
    <nav style={{ background:'#1e3a5f', padding:'0 1.5rem', height:'56px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:1000 }}>
      <span style={{ color:'white', fontWeight:'bold', fontSize:'1.1rem' }}>
        Parcheggi Brescia
      </span>
      <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
        <span style={{ color:'#94a3b8', fontSize:'0.85rem' }}>
          {profilo?.nome ? profilo.nome + ' ' + (profilo.cognome || '') : user?.email}
        </span>
        {profilo?.ruolo === 'admin' && (
          <span style={{ background:'#f59e0b', color:'#1a1a1a', padding:'2px 8px', borderRadius:'12px', fontSize:'0.75rem', fontWeight:'bold' }}>
            Admin
          </span>
        )}
        <button
          onClick={handleLogout}
          style={{ background:'#ef4444', color:'white', border:'none', borderRadius:'6px', padding:'0.4rem 0.9rem', cursor:'pointer', fontWeight:'bold', fontSize:'0.85rem' }}
        >
          Esci
        </button>
      </div>
    </nav>
  )
}