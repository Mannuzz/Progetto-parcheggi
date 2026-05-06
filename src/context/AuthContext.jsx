import React, { createContext, useState, useContext, useEffect } from 'react'
import { supabase } from '../supabase'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profilo, setProfilo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) caricaProfilo(session.user.id)
      else setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (session?.user) caricaProfilo(session.user.id)
      else { setProfilo(null); setLoading(false) }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const caricaProfilo = async (id) => {
    const { data } = await supabase
      .from('profili_utenti')
      .select('*')
      .eq('id', id)
      .single()
    setProfilo(data)
    setLoading(false)
  }

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const register = async (email, password, nome, cognome) => {
    // Supabase crea l'utente in auth.users con password hashata automaticamente
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error

    // Aggiorna il profilo con nome e cognome (il trigger crea già la riga base)
    if (data.user) {
      await supabase.from('profili_utenti').upsert({
        id: data.user.id,
        email: email,
        nome: nome,
        cognome: cognome,
        ruolo: 'cittadino'
      })
    }
    return data
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfilo(null)
  }

  const generaCodice = (id) => {
    if (!id) return 'BS-000000'
    return 'BS-' + Number(id).toString(36).toUpperCase().padStart(6, '0')
  }

  return (
    <AuthContext.Provider value={{ user, profilo, loading, login, register, logout, generaCodice }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)