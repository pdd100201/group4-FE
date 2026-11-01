import { useEffect, useState } from 'react'
import { chatApi, type ChatAttachment } from '../api/chatApi'

export function ChatMedia({ file, onLoaded }: { file: ChatAttachment; onLoaded?: () => void }) {
  const [url, setUrl] = useState(''), [error, setError] = useState(false), [retry, setRetry] = useState(0)
  useEffect(() => {
    // Fetch through the authenticated API; revoke blob URLs when this conversation leaves the view.
    const controller = new AbortController(); let objectUrl = ''
    setError(false); setUrl('')
    void chatApi.attachment(file.id, controller.signal).then(blob => {
      if (!controller.signal.aborted) { objectUrl = URL.createObjectURL(blob); setUrl(objectUrl) }
    }).catch(() => { if (!controller.signal.aborted) setError(true) })
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [file.id, retry])
  if (error) return <button className="ms-media-error" onClick={() => setRetry(n => n + 1)}>Không tải được tệp. Thử lại</button>
  if (!url) return <div className="ms-media-loading">Đang tải {file.contentType.startsWith('video/') ? 'video' : 'ảnh'}…</div>
  return <figure className="ms-media">{file.contentType.startsWith('video/')
    ? <video src={url} controls playsInline preload="metadata" aria-label={file.name} onLoadedMetadata={onLoaded} onError={() => setError(true)} />
    : <a href={url} target="_blank" rel="noreferrer" aria-label={`Mở ảnh ${file.name}`}><img src={url} alt={file.name} loading="lazy" onLoad={onLoaded} onError={() => setError(true)} /></a>}
    <figcaption>{file.name} · {(file.bytes / 1024 / 1024).toFixed(1)} MB</figcaption>
  </figure>
}
