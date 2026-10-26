import { useEffect, useState } from 'react'
import type { ChatUser } from '../api/chatApi'

// Use profile images when available; initials also cover missing or broken avatar URLs.
export function ChatAvatar({ person, online = false, community = false }: { person?: Pick<ChatUser, 'fullName' | 'avatarUrl'>; online?: boolean; community?: boolean }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [person?.avatarUrl])
  return <span className={`ms-avatar ${community ? 'community' : ''}`}>
    {person?.avatarUrl && !failed ? <img src={person.avatarUrl} alt="" onError={() => setFailed(true)} /> : <span>{community ? '✦' : person?.fullName.trim().split(/\s+/).slice(-2).map(n => n[0]).join('').toUpperCase() || '?'}</span>}
    {online && <i className="ms-online-dot" aria-label="Đang mở chat" />}
  </span>
}

