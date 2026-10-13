import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../shared/context/AuthContext'
import { useQuizWorkspace, validId } from '../../../shared/hooks/useQuizManagement'
import { QuizCoursePicker, QuizError, canManageQuiz } from '../../quiz/QuizShared'
import { questionApi, type BankQuestion, type ImportResult } from '../api/questionApi'
import { QuestionForm } from './QuestionForm'
import { SafePostContent } from '../../blog/screens/SafePostContent'
import './questions.css'

export function QuestionBankPage() {
  const { courseId: raw } = useParams()
  const courseId = validId(raw)
  return <main className="qm-page question-bank"><header className="qm-heading"><div><p className="qm-eyebrow">EDUPORTAL · GIẢNG DẠY</p><h1>Ngân hàng câu hỏi</h1></div></header>
    {raw === undefined ? <QuizCoursePicker role="expert" kind="questions" /> : courseId === null ? <p role="alert">Mã khóa học không hợp lệ.</p> : <QuestionWorkspace key={courseId} courseId={courseId} />}
  </main>
}
function QuestionWorkspace({ courseId }: { courseId: number }) {
  const { user } = useAuth()
  const { course } = useQuizWorkspace(courseId)
  const [params, setParams] = useSearchParams()
  const [editing, setEditing] = useState<BankQuestion | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<BankQuestion | null>(null)
  const [message, setMessage] = useState('')
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [templateError, setTemplateError] = useState<unknown>(null)
  const client = useQueryClient()
  const rawPage = Number(params.get('page') ?? 0)
  const page = Number.isSafeInteger(rawPage) && rawPage >= 0 ? rawPage : 0
  const request = new URLSearchParams(params); request.set('page', String(page)); request.set('size', '10')
  const query = useQuery({ queryKey: ['expert-questions', user?.id, courseId, request.toString()], queryFn: () => questionApi.list(courseId, request) })
  const editable = Boolean(course.data && canManageQuiz(course.data.status))
  async function refresh() { await Promise.all([client.invalidateQueries({ queryKey: ['expert-questions'] }), client.invalidateQueries({ queryKey: ['quiz-question-bank'] }), client.invalidateQueries({ queryKey: ['managed-quizzes'] }), client.invalidateQueries({ queryKey: ['managed-quiz'] }), client.invalidateQueries({ queryKey: ['quiz-review'] })]) }
  const action = useMutation({ mutationFn: async (input: { question: BankQuestion; remove?: boolean }) => { if (input.remove) await questionApi.remove(courseId, input.question.id); else await questionApi.status(courseId, input.question.id, !input.question.active) },
    onSuccess: async () => { setDeleting(null); setMessage('Đã cập nhật câu hỏi.'); await refresh() }, onError: refresh })
  const upload = useMutation({ mutationFn: (value: File) => questionApi.importFile(courseId, value), onSuccess: async result => { setImportResult(result); await refresh() } })
  useEffect(() => { if (query.data && page > Math.max(0, query.data.totalPages - 1)) { const next=new URLSearchParams(params); next.set('page', String(Math.max(0, query.data.totalPages-1))); setParams(next, { replace: true }) } }, [query.data, page, params, setParams])
  function filter(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const next=new URLSearchParams(); new FormData(event.currentTarget).forEach((value,key)=>{if(String(value).trim()) next.set(key,String(value).trim())}); setParams(next) }
  function move(value: number) { const next=new URLSearchParams(params); next.set('page',String(value)); setParams(next) }
  async function template() { setTemplateError(null); try { const blob=await questionApi.template(courseId); const url=URL.createObjectURL(blob); const link=document.createElement('a'); link.href=url; link.download='question-template.xlsx'; link.click(); setTimeout(()=>URL.revokeObjectURL(url),1000) } catch(error) { setTemplateError(error) } }
  return <>
    <Link to="/expert/questions">← Chọn khóa học khác</Link>
    {course.isError && <QuizError error={course.error} />}
    <header className="question-heading"><div><h2>{course.data?.title ?? 'Đang tải khóa học...'}</h2><Link to={`/expert/courses/${courseId}/quizzes`}>Quản lý quiz</Link></div>{editable && <div className="qm-actions"><button onClick={() => { setEditing(null); setMessage('') }}>+ Tạo câu hỏi</button><button onClick={() => { setImportOpen(!importOpen); setImportResult(null); upload.reset() }}>Import Excel</button></div>}</header>
    {message && <p role="status" className="qm-feedback qm-success">{message}</p>}
    {!editable && course.data && <p className="qm-feedback">Khóa học hiện chỉ cho phép xem câu hỏi.</p>}
    {importOpen && editable && <section className="question-import"><h2>Import câu hỏi</h2><div className="qm-actions"><button onClick={() => void template()}>Tải file mẫu</button><input type="file" accept=".xlsx" aria-label="File câu hỏi Excel" disabled={upload.isPending} onChange={event => { setFile(event.target.files?.[0] ?? null); setImportResult(null); upload.reset() }} /><button disabled={!file || upload.isPending} onClick={() => file && upload.mutate(file)}>{upload.isPending ? 'Đang import...' : 'Import'}</button></div>
      {templateError != null && <QuizError error={templateError} />}{upload.isError && <QuizError error={upload.error} />}{importResult && <div role="status"><p>Đã nhập {importResult.imported} câu hỏi · {importResult.errors.length} dòng lỗi</p>{importResult.errors.map(error => <p key={error.row}>Dòng {error.row}: {error.message}</p>)}</div>}
    </section>}
    <div className={`question-workspace ${editing !== undefined ? 'with-editor' : ''}`}><section className="question-list">
      <form className="question-filters" onSubmit={filter} key={params.toString()}><label>Nội dung<input name="search" maxLength={200} defaultValue={params.get('search') ?? ''} /></label><label>Loại<select name="type" defaultValue={params.get('type') ?? ''}><option value="">Tất cả</option><option value="SINGLE_CHOICE">Một đáp án</option><option value="MULTIPLE_CHOICE">Nhiều đáp án</option></select></label><label>Trạng thái<select name="active" defaultValue={params.get('active') ?? ''}><option value="">Tất cả</option><option value="true">Hoạt động</option><option value="false">Không hoạt động</option></select></label><button>Lọc</button><button type="button" onClick={() => setParams({})}>Xóa lọc</button></form>
      {query.isPending && <p role="status">Đang tải câu hỏi...</p>}{query.isError && <QuizError error={query.error} retry={() => void query.refetch()} />}{action.isError && <QuizError error={action.error} />}
      {query.data && <>{!query.data.content.length ? <p className="qm-empty">Không có câu hỏi phù hợp.</p> : <div className="qm-table-scroll"><table className="qm-table"><thead><tr><th>Câu hỏi</th><th>Loại</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{query.data.content.map(q => <tr key={q.id}><td><small>#{q.id}</small><div className="question-text"><SafePostContent content={q.content} /></div>{q.imageUrl && <img className="question-thumbnail" src={q.imageUrl} alt="Ảnh câu hỏi" />}</td><td>{q.type === 'SINGLE_CHOICE' ? 'Một đáp án' : q.type === 'MULTIPLE_CHOICE' ? 'Nhiều đáp án' : q.type}</td><td>{q.active ? 'Hoạt động' : 'Không hoạt động'}</td><td><div className="qm-actions"><button onClick={() => setEditing(q)}>{editable ? 'Sửa' : 'Xem'}</button>{editable && <><button disabled={action.isPending} onClick={() => action.mutate({ question: q })}>{q.active ? 'Ngừng hoạt động' : 'Kích hoạt'}</button><button className="qm-danger" disabled={action.isPending} onClick={() => { action.reset(); setDeleting(q) }}>Xóa</button></>}</div></td></tr>)}</tbody></table></div>}
      <nav className="qm-pagination" aria-label="Phân trang câu hỏi"><span>{query.data.totalElements} câu hỏi</span><button aria-label="Trang trước" disabled={page === 0 || query.isFetching} onClick={() => move(page-1)}>‹</button><span>{query.data.totalPages ? page+1 : 0}/{query.data.totalPages}</span><button aria-label="Trang sau" disabled={page+1>=query.data.totalPages || query.isFetching} onClick={() => move(page+1)}>›</button></nav></>}
    </section>{editing !== undefined && <QuestionForm key={editing?.id ?? 'new'} courseId={courseId} initial={editing ?? undefined} readOnly={!editable} onCancel={() => setEditing(undefined)} onSaved={async () => { setEditing(undefined); setMessage('Đã lưu câu hỏi thành công.'); await refresh() }} />}</div>
    {deleting && <section className="qm-feedback" role="alertdialog" aria-labelledby="question-delete"><h2 id="question-delete">Xóa câu hỏi #{deleting.id}?</h2><p className="question-text">{deleting.content}</p><div className="qm-actions"><button disabled={action.isPending} onClick={() => setDeleting(null)}>Hủy</button><button className="qm-danger" disabled={action.isPending} onClick={() => action.mutate({ question: deleting, remove: true })}>Xác nhận xóa</button></div></section>}
  </>
}
