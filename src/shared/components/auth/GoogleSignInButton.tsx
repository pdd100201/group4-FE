import { useEffect, useRef, useState } from 'react'
import { useGoogleConfiguration } from '../../hooks/useGoogleConfiguration'

let googleScriptPromise: Promise<void> | null = null

function loadGoogleScript() {
  if (window.google) return Promise.resolve()
  if (googleScriptPromise) return googleScriptPromise
  googleScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-ols-google-signin]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => { existing.remove(); reject(new Error('Google Sign-In unavailable')) }, { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.dataset.olsGoogleSignin = 'true'
    script.onload = () => resolve()
    script.onerror = () => { script.remove(); reject(new Error('Google Sign-In unavailable')) }
    document.head.appendChild(script)
  }).catch(error => { googleScriptPromise = null; throw error })
  return googleScriptPromise
}

export function GoogleSignInButton({ onCredential }: { onCredential: (credential: string) => void }) {
  const container = useRef<HTMLDivElement>(null)
  const callback = useRef(onCredential)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const configuration = useGoogleConfiguration()
  const clientId = configuration.data?.googleClientId.trim()
  callback.current = onCredential

  useEffect(() => {
    if (!clientId) return
    setError('')
    let active = true
    let observer: ResizeObserver | undefined
    loadGoogleScript().then(() => {
      if (!active || !container.current || !window.google) return
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => callback.current(response.credential),
      })
      const target = container.current
      const parent = target.parentElement
      let previousWidth = 0
      const render = () => {
        if (!active || !window.google || !parent) return
        const width = Math.max(200, Math.min(400, Math.floor(parent.clientWidth)))
        if (width === previousWidth) return
        previousWidth = width
        target.replaceChildren()
        window.google.accounts.id.renderButton(target, {
          type: 'standard', theme: 'outline', size: 'large', width, text: 'continue_with',
        })
      }
      render()
      if (parent) {
        observer = new ResizeObserver(render)
        observer.observe(parent)
      }
    }).catch(() => active && setError('Không thể tải Google Sign-In.'))
    return () => { active = false; observer?.disconnect() }
  }, [clientId, attempt])

  const message = configuration.isError ? 'Không tải được cấu hình đăng nhập Google từ server.'
    : configuration.isSuccess && !clientId ? 'Google Sign-In chưa được cấu hình trên server.' : error
  return <div className="google-signin">
    <div ref={container} hidden={!clientId || Boolean(message)} />
    {configuration.isPending && <p role="status">Đang tải đăng nhập Google...</p>}
    {message && <p className="form-error" role="alert">{message}</p>}
    {(configuration.isError || error) && <button type="button" onClick={() => {
      setError(''); setAttempt(value => value + 1); void configuration.refetch()
    }}>Thử lại Google</button>}
  </div>
}
