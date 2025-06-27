import React, { useState } from 'react'
import { useAuthContext } from './AuthProvider'

export function SignIn() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const { signIn, error, clearError } = useAuthContext()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setMessage('Please enter your email address')
      return
    }

    setIsSubmitting(true)
    setMessage('')
    clearError()

    const result = await signIn(email.trim())
    
    if (result.error) {
      setMessage(result.error)
    } else {
      setMessage('Check your email for the magic link!')
      setEmail('')
    }
    
    setIsSubmitting(false)
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
        <div className="glass-container max-w-md w-full rounded-xl p-8 relative z-2" style={{
          maxWidth: '400px',
          width: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '-2px -2px 10px rgba(255, 248, 220, 1), 3px 3px 10px rgba(255, 69, 0, 0.4)',
          position: 'relative',
          zIndex: 2,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}>
          <div className="text-center mb-8" style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 className="text-2xl font-semibold text-primary mb-2 font-system" style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#885050',
              margin: '0 0 8px 0',
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
              Sign in to Yoga Flow Planner
            </h2>
            <p className="text-sm text-primary font-system" style={{
              fontSize: '14px',
              color: '#885050',
              margin: '0',
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
              Enter your email to receive a magic link
            </p>
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
                disabled={isSubmitting}
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

            {message && !error && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-primary font-system" style={{
                padding: '12px',
                backgroundColor: '#ffe5d0',
                border: '1px solid #fcb69f',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#885050',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
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
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.1s ease',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                boxShadow: '-2px -2px 10px rgba(255, 248, 220, 1), 3px 3px 10px rgba(255, 69, 0, 0.4)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                opacity: isSubmitting ? 0.6 : 1,
                textAlign: 'center',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }
              }}
            >
              {isSubmitting ? 'Sending...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
} 