import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useAuth } from '../../shared/context/AuthContext'
import { quizService } from './api/quizService'
import { QuizError } from './QuizShared'

export function QuestionPicker({ courseId, value, content, index, onChange }: {
  courseId: number; value: string; content?: string; index: number; onChange: (id: string, content: string) => void
}) {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const query = useQuery({ queryKey: ['quiz-question-bank', user?.id, courseId, search, page],
    queryFn: () => quizService.questionBank(courseId, search, page) })
  return <div className="qm-question-picker">
    <label>Tìm câu hỏi<input aria-label={`Tìm câu hỏi dòng ${index + 1}`} value={search} maxLength={200} onChange={event => { setSearch(event.target.value); setPage(0) }} /></label>
    <label>Câu hỏi<select required aria-label={`Mã câu hỏi dòng ${index + 1}`} value={value} onChange={event => {
      const selected = query.data?.content.find(question => String(question.id) === event.target.value)
      onChange(event.target.value, selected?.content ?? '')
    }}><option value="">Chọn câu hỏi</option>
      {value && !query.data?.content.some(question => String(question.id) === value) && <option value={value}>#{value} · {content ?? 'Câu hỏi đã chọn'}</option>}
      {query.data?.content.map(question => <option key={question.id} value={question.id}>#{question.id} · {question.content}</option>)}
    </select></label>
    {query.isPending && <small role="status">Đang tải câu hỏi...</small>}
    {query.isError && <QuizError error={query.error} retry={() => void query.refetch()} />}
    {query.data && <div className="qm-actions"><small>{query.data.totalElements} câu hỏi</small><button type="button" aria-label={`Câu hỏi trang trước dòng ${index + 1}`} disabled={page === 0 || query.isFetching} onClick={() => setPage(page - 1)}>‹</button><button type="button" aria-label={`Câu hỏi trang sau dòng ${index + 1}`} disabled={page + 1 >= query.data.totalPages || query.isFetching} onClick={() => setPage(page + 1)}>›</button></div>}
  </div>
}
