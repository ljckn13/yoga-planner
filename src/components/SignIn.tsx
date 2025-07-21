import { useState, useEffect } from 'react'
import { useAuthContext } from '../hooks/useAuthContext'

export function SignIn() {
  const { signIn, isLoading, error, clearError } = useAuthContext()
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [showSending, setShowSending] = useState(false)

  // Clear any stale authentication data when component mounts
  useEffect(() => {
    // Clear any stale JWT tokens from localStorage
    localStorage.removeItem('sb-lmwbfbnduhijqmoqhxpi-auth-token')
    localStorage.removeItem('supabase.auth.token')
    
    // Clear sessionStorage as well
    sessionStorage.clear()
    
    // Clear any Supabase-related cookies
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    console.log('🧹 Cleared stale authentication data')
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setShowSending(true)
    clearError()

    // Show "Sending link..." for 1200ms regardless of loading state
    setTimeout(() => {
      setShowSending(false)
    }, 1200)

    const result = await signIn(email.trim())
    
    if (result.success) {
      setIsSubmitted(true)
    } else {
      setIsSubmitted(false)
    }
  }

  return (
    <>
      <style>{`
        @keyframes sunriseBreath {
          0% { filter: brightness(1); }
          50% { filter: brightness(1.06); }
          100% { filter: brightness(1); }
        }
        .sunrise-bg {
          background:
            url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' fill='none'><filter id='noiseFilter'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23noiseFilter)' opacity='0.40'/><rect width='100%' height='100%' fill='%23ffb347' opacity='0.18'/></svg>") repeat,
            linear-gradient(180deg, #ffecd2 0%, #fcb69f 40%, #ffdde1 100%);
          animation: sunriseBreath 8s ease-in-out infinite;
          min-height: 100vh;
          width: 100vw;
        }
      `}</style>
      <div
        className="sunrise-bg min-h-screen w-screen flex items-center justify-center p-0"
      >
        <div className="max-w-md w-full p-8 relative z-2" style={{
          maxWidth: '400px',
          width: '100%',
          padding: '32px',
          position: 'relative',
          zIndex: 2,
        }}>
          <div className="text-center mb-8" style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 className="text-2xl font-semibold text-primary mb-2 font-system" style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#d89468',
              margin: '0 0 8px 0',
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
              canvāsana
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#885050',
                  border: '1px solid var(--color-panel-contrast)',
                  borderRadius: '8px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  transition: 'border-color 0.1s ease',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--color-selected)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--color-panel-contrast)'
                }}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-system" style={{
                padding: '12px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#885050',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={showSending || isLoading || !email.trim()}
              className="btn-primary w-full py-2.5 px-4 text-sm font-medium cursor-pointer font-system shadow-neumorphic opacity-100 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                width: '100%',
                padding: '10px 16px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#885050',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: (showSending || isLoading) ? 'not-allowed' : 'pointer',
                transition: 'all 0.1s ease',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                boxShadow: '-2px -2px 10px rgba(255, 248, 220, 1), 3px 3px 10px rgba(255, 69, 0, 0.4)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                opacity: (showSending || isLoading) ? 0.6 : 1,
                textAlign: 'center',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => {
                if (!showSending && !isLoading) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (!showSending && !isLoading) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }
              }}
            >
              {showSending ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending link...
                </div>
              ) : isSubmitted ? (
                'Link sent. Check your inbox.'
              ) : (
                'Continue'
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  )
} 