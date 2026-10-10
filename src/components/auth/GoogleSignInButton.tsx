import { useEffect, useRef, useState } from 'react'

let googleScriptPromise: Promise<void> | null = null

function loadGoogleScript() {
  if (window.google) return Promise.resolve()
  if (googleScriptPromise) return googleScriptPromise
  googleScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-ols-google-signin]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Google Sign-In unavailable')), { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.dataset.olsGoogleSignin = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Google Sign-In unavailable'))
    document.head.appendChild(script)
  })
  return googleScriptPromise
}

export function GoogleSignInButton({ onCredential }: { onCredential: (credential: string) => void }) {
  const container = useRef<HTMLDivElement>(null)
  const callback = useRef(onCredential)
  const [error, setError] = useState('')
  callback.current = onCredential

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) { setError('Google Sign-In chưa được cấu hình.'); return }
    let active = true
    loadGoogleScript().then(() => {
      if (!active || !container.current || !window.google) return
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => callback.current(response.credential),
      })
      container.current.replaceChildren()
      window.google.accounts.id.renderButton(container.current, {
        type: 'standard', theme: 'outline', size: 'large', width: 284, text: 'continue_with',
      })
    }).catch(() => active && setError('Không thể tải Google Sign-In.'))
    return () => { active = false }
  }, [])

  return <div className="google-signin">{error ? <p className="form-error" role="alert">{error}</p> : <div ref={container} />}</div>
}
