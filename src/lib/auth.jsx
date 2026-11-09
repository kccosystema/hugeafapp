import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from './supabase.js'
import { fetchProfile } from './profile.js'

const AuthContext = createContext({
  session: null,
  user: null,
  profile: null,
  loading: true,
  profileLoading: true,
  configured: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  setProfile: () => {},
  refreshProfile: async () => {},
})

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      setProfileLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // Load the profile whenever the signed-in user changes.
  const userId = session?.user?.id
  useEffect(() => {
    if (!userId) {
      setProfile(null)
      setProfileLoading(false)
      return
    }
    setProfileLoading(true)
    fetchProfile(userId).then(({ data }) => {
      setProfile(data)
      setProfileLoading(false)
    })
  }, [userId])

  const refreshProfile = useCallback(async () => {
    if (!userId) return
    const { data } = await fetchProfile(userId)
    setProfile(data)
  }, [userId])

  async function signInWithGoogle() {
    if (!isSupabaseConfigured) {
      alert('Supabase isn’t connected yet. Add your project keys to finish setup.')
      return
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (error) alert(`Sign-in failed: ${error.message}`)
  }

  async function signOut() {
    if (isSupabaseConfigured) await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
  }

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    profileLoading,
    configured: isSupabaseConfigured,
    signInWithGoogle,
    signOut,
    setProfile,
    refreshProfile,
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
