import { useQuery } from '@tanstack/react-query'
import { mediaApi } from '../../../features/media/api/mediaApi'
import './media.css'
import { useAuth } from '../../context/AuthContext'
export function MediaVideo({ mediaId }: { mediaId: number }) {
  const { user } = useAuth()
  const query = useQuery({ queryKey: ['media-playback', user?.email, mediaId], queryFn: () => mediaApi.playback(mediaId), enabled: !!user, staleTime: 30 * 60 * 1000, gcTime: 0, retry: false })
  if (query.isPending) return <p role="status">Đang tải video…</p>
  if (query.isError) return <div role="alert"><p>Không thể mở video. Vui lòng kiểm tra quyền truy cập hoặc thử lại.</p><button type="button" onClick={() => void query.refetch()}>Thử lại</button></div>
  return <div><video className="media-video" controls preload="metadata" src={query.data}>Trình duyệt không hỗ trợ phát video.</video><button type="button" disabled={query.isFetching} onClick={() => void query.refetch()}>Cập nhật liên kết video</button></div>
}
