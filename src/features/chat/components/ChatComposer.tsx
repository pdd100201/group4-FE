import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react'
import type { useChatSocket } from '../../../shared/hooks/useChat'
import { chatApi, type ChatAttachment } from '../api/chatApi'

type Props = {
  peerId: number | null; chat: Pick<ReturnType<typeof useChatSocket>, 'send' | 'connected'>
  onBusyChange: (busy: boolean) => void
}

export function ChatComposer({ peerId, chat, onBusyChange }: Props) {
  const [draft, setDraft] = useState(''), [sending, setSending] = useState(false), [error, setError] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null), [preview, setPreview] = useState('')
  // Keep the same upload and UUID on retry when a socket acknowledgement is lost.
  const uploaded = useRef<ChatAttachment | null>(null), request = useRef({ signature: '', id: '' })
  const picker = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (!selectedFile) { setPreview(''); return }
    const url = URL.createObjectURL(selectedFile); setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [selectedFile])
  const selectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'].includes(file.type)) { setError('Chọn ảnh JPG/PNG/WebP/GIF hoặc video MP4/WebM.'); return }
    if (file.size > (file.type.startsWith('video/') ? 25 : 5) * 1024 * 1024) { setError(file.type.startsWith('video/') ? 'Video tối đa 25 MB.' : 'Ảnh tối đa 5 MB.'); return }
    setSelectedFile(file); uploaded.current = null; setError('')
  }
  const submit = async (event?: FormEvent) => {
    event?.preventDefault()
    const text = draft.trim()
    if ((!text && !selectedFile) || text.length > 2000 || sending || !chat.connected) return
    setSending(true); onBusyChange(true); setError('')
    try {
      if (selectedFile && !uploaded.current) uploaded.current = await chatApi.upload(selectedFile, peerId)
      const signature = JSON.stringify([text, peerId, uploaded.current?.id])
      if (request.current.signature !== signature || !request.current.id) request.current = { signature, id: crypto.randomUUID() }
      await chat.send(peerId, text, request.current.id, uploaded.current?.id)
      setDraft(''); setSelectedFile(null); uploaded.current = null; request.current.id = ''
    } catch (e) {
      const apiError = e as { response?: { data?: { message?: string } } }
      setError(apiError.response?.data?.message ?? (e instanceof Error ? e.message : 'Không gửi được tin nhắn.'))
    } finally { setSending(false); onBusyChange(false) }
  }
  const keyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void submit() }
  }
  return (
      <form className="ms-composer" onSubmit={e => void submit(e)}>
        {error && <p className="ms-error" role="alert">{error}</p>}
        {selectedFile && <div className="ms-preview">{selectedFile.type.startsWith('video/') ? <video src={preview} controls preload="metadata" /> : <img src={preview} alt="Ảnh sắp gửi" />}<div><strong>{selectedFile.name}</strong><small>{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</small></div><button type="button" aria-label="Bỏ tệp đã chọn" disabled={sending} onClick={() => { setSelectedFile(null); uploaded.current = null }}>×</button></div>}
        <div className="ms-compose-row"><input ref={picker} className="ms-file-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" onChange={selectFile} /><button type="button" className="ms-attach" title="Gửi ảnh hoặc video" aria-label="Gửi ảnh hoặc video" disabled={sending} onClick={() => picker.current?.click()}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="4"/><circle cx="8" cy="9" r="1.5"/><path d="m4 17 5-5 4 4 3-3 5 5"/></svg></button><textarea aria-label="Nhập tin nhắn" placeholder="Aa" maxLength={2000} rows={1} value={draft} disabled={sending} onKeyDown={keyDown} onChange={e => setDraft(e.target.value)} /><button className="ms-send" aria-label={sending ? 'Đang gửi' : 'Gửi tin nhắn'} type="submit" disabled={!chat.connected || (!draft.trim() && !selectedFile) || sending}>{sending ? <span>…</span> : <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 3.8c0-.7.7-1.1 1.3-.8l17 8.1a1 1 0 0 1 0 1.8l-17 8.1c-.6.3-1.3-.1-1.3-.8v-6.7L14 12 3 10.5z"/></svg>}</button></div>
        <small className="ms-compose-help">{sending ? 'Đang tải và gửi tin nhắn…' : 'Enter để gửi · Shift + Enter để xuống dòng · Ảnh 5 MB / Video 25 MB'}</small>
      </form>
  )
}
