import axios from 'axios'
import { useState } from 'react'
import { mediaService, type MediaPurpose, type UploadedMedia } from '../services/mediaService'
import './media.css'
export function MediaUpload({ purpose, courseId, disabled, onUploaded, onBusy }: { purpose: MediaPurpose; courseId?: number; disabled?: boolean; onUploaded: (media: UploadedMedia) => void; onBusy?: (busy: boolean) => void }) {
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const video = purpose === 'LESSON_VIDEO'
  async function upload(file: File) {
    setError(''); setMessage('')
    const allowed = video ? ['video/mp4', 'video/webm'] : ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) { setError(video ? 'Chọn video MP4 hoặc WebM.' : 'Chọn ảnh JPG, PNG hoặc WebP.'); return }
    if (file.size > (video ? 100 : 10) * 1024 * 1024) { setError(video ? 'Video tối đa 100 MB.' : 'Ảnh tối đa 10 MB.'); return }
    setBusy(true); onBusy?.(true); setProgress(0)
    try { const result = await mediaService.upload(file, purpose, courseId, setProgress); onUploaded(result); setMessage('Đã tải lên. Hãy lưu thay đổi để gắn tệp vào nội dung.') }
    catch (cause) { setError(axios.isAxiosError<{ message?: string }>(cause) ? cause.response?.data?.message ?? 'Tải lên thất bại. Vui lòng thử lại.' : 'Tải lên thất bại.') }
    finally { setBusy(false); onBusy?.(false) }
  }
  return <div className="media-upload"><label>{video ? 'Tải video lên' : 'Tải ảnh lên'}<input type="file" accept={video ? 'video/mp4,video/webm' : 'image/jpeg,image/png,image/webp'} disabled={disabled || busy} onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file) void upload(file) }} /></label><small>{video ? 'MP4/WebM · tối đa 100 MB' : 'JPG/PNG/WebP · tối đa 10 MB'}</small>{busy && <p role="status">{progress < 99 ? `Đang gửi tệp: ${progress}%` : 'Đang lưu và xử lý tệp…'}</p>}{message && <p role="status">{message}</p>}{error && <p className="form-error" role="alert">{error}</p>}</div>
}
