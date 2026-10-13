import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../shared/context/AuthContext'
import { quizService } from './api/quizService'
import { canManageQuiz, QuizError } from './QuizShared'
import type { QuizListItem } from '../../shared/types/quiz'

export function QuizList() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const client = useQueryClient()
  const [deleting, setDeleting] = useState<QuizListItem | null>(null)
  const [message, setMessage] = useState('')
  const rawPage = Number(params.get('page') ?? 0)
  const page = Number.isSafeInteger(rawPage) && rawPage >= 0 ? rawPage : 0
  const request = new URLSearchParams(params)
  request.set('page', String(page)); request.set('size', '10')
  const query = useQuery({ queryKey: ['expert-quiz-list', user?.id, request.toString()], queryFn: () => quizService.search(request) })
  useEffect(() => {
    if (query.data && page > Math.max(0, query.data.totalPages - 1)) {
      const next = new URLSearchParams(params)
      next.set('page', String(Math.max(0, query.data.totalPages - 1)))
      setParams(next, { replace: true })
    }
  }, [query.data, page, params, setParams])
  const remove = useMutation({ mutationFn: (quiz: QuizListItem) => quizService.remove(quiz.courseId, quiz.id),
    onSuccess: async () => {
      setDeleting(null); setMessage('Đã xóa quiz thành công.')
      await client.invalidateQueries({ queryKey: ['expert-quiz-list'] })
      await client.invalidateQueries({ queryKey: ['managed-quizzes'] })
    }, onError: async () => { await client.invalidateQueries({ queryKey: ['expert-quiz-list'] }) } })
  function filter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = new URLSearchParams()
    new FormData(event.currentTarget).forEach((value, key) => { if (String(value).trim()) next.set(key, String(value).trim()) })
    setParams(next)
  }
  function move(nextPage: number) { const next = new URLSearchParams(params); next.set('page', String(nextPage)); setParams(next) }
  const start = Math.max(0, Math.min(page - 2, (query.data?.totalPages ?? 0) - 5))
  return <section className="qm-panel">
    <form className="qm-filters qm-list-filters" onSubmit={filter} key={params.toString()}>
      <label className="qm-grow">Tên quiz<input name="search" maxLength={200} defaultValue={params.get('search') ?? ''} placeholder="Tìm bài kiểm tra..." /></label>
      <label>Mã khóa học<input name="courseId" type="number" min={1} step={1} defaultValue={params.get('courseId') ?? ''} /></label>
      <label>Danh mục khóa học<input name="category" maxLength={255} defaultValue={params.get('category') ?? ''} /></label>
      <label>Trạng thái<select name="active" defaultValue={params.get('active') ?? ''}><option value="">Tất cả</option><option value="true">Hoạt động</option><option value="false">Không hoạt động</option></select></label>
      <button type="submit">Lọc</button><button type="button" onClick={() => setParams({})}>Xóa lọc</button>
    </form>
    {message && <p role="status" className="qm-feedback qm-success">{message}</p>}
    {query.isPending && <p role="status">Đang tải quiz...</p>}
    {query.isError && <QuizError error={query.error} retry={() => void query.refetch()} />}
    {query.data && <>
      {!query.data.content.length ? <p className="qm-empty">Không có quiz phù hợp.</p> : <div className="qm-table-scroll"><table className="qm-table"><thead><tr><th>Quiz</th><th>Khóa học</th><th>Danh mục</th><th>Câu hỏi</th><th>Thời lượng</th><th>Tỷ lệ đạt</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>
        {query.data.content.map(quiz => <tr key={quiz.id}><td><strong>{quiz.title}</strong><small>#{quiz.id}</small></td><td>{quiz.courseTitle}<small>#{quiz.courseId}</small></td><td>{quiz.category}</td><td>{quiz.questionCount}</td><td>{quiz.durationMinutes ?? '—'} phút</td><td>{quiz.passRate ?? '—'}%</td><td><span className={`qm-badge ${quiz.active ? 'qm-active' : ''}`}>{quiz.active ? 'Hoạt động' : 'Không hoạt động'}</span>{quiz.retained && <small>Đã có lượt làm bài</small>}</td><td><div className="qm-actions"><Link to={`/expert/courses/${quiz.courseId}/quizzes/${quiz.id}`}>Xem</Link>{canManageQuiz(quiz.courseStatus) && !quiz.retained && <><Link to={`/expert/courses/${quiz.courseId}/quizzes/${quiz.id}/edit`}>Sửa</Link><button className="qm-danger" onClick={() => { remove.reset(); setDeleting(quiz) }}>Xóa</button></>}</div></td></tr>)}
      </tbody></table></div>}
      <nav className="qm-pagination" aria-label="Phân trang danh sách quiz"><span>{query.data.totalElements} quiz</span><button aria-label="Trang trước" disabled={page === 0 || query.isFetching} onClick={() => move(page - 1)}>‹</button>{Array.from({ length: Math.min(5, query.data.totalPages) }, (_, i) => start + i).map(value => <button key={value} aria-current={page === value ? 'page' : undefined} disabled={query.isFetching} onClick={() => move(value)}>{value + 1}</button>)}<button aria-label="Trang sau" disabled={page + 1 >= query.data.totalPages || query.isFetching} onClick={() => move(page + 1)}>›</button></nav>
    </>}
    {deleting && <div className="qm-feedback" role="alertdialog" aria-modal="false" aria-labelledby="quiz-list-delete"><h2 id="quiz-list-delete">Xóa quiz “{deleting.title}”?</h2>{remove.isError && <QuizError error={remove.error} />}<div className="qm-actions"><button disabled={remove.isPending} onClick={() => setDeleting(null)}>Hủy</button><button className="qm-danger" disabled={remove.isPending} onClick={() => remove.mutate(deleting)}>{remove.isPending ? 'Đang xóa...' : 'Xác nhận xóa'}</button></div></div>}
  </section>
}
