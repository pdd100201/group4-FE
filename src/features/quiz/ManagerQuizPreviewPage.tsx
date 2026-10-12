import { Link, useParams } from 'react-router-dom'
import { useQuizReview, validId } from '../../hooks/useQuizManagement'
import { QuizCoursePicker, QuizError } from './QuizShared'

export function ManagerQuizPreviewPage() {
  const { courseId: rawId } = useParams()
  const courseId = validId(rawId)
  const query = useQuizReview(courseId)
  return <div className="qm-page"><header className="qm-heading"><div><p className="qm-eyebrow">REVIEW KHÓA HỌC</p><h1>Xem trước quiz</h1><p>Kiểm tra nội dung quiz của khóa học đang chờ duyệt.</p></div></header>
    {rawId === undefined ? <QuizCoursePicker role="manager" /> : courseId === null ? <p role="alert">Mã khóa học không hợp lệ.</p> : <>
      <Link to="/manager/courses/review/quizzes">← Khóa học chờ duyệt</Link>
      {query.isPending && <p role="status">Đang tải nội dung review...</p>}
      {query.isError && <QuizError error={query.error} retry={() => { void query.refetch() }} />}
      {query.data && (query.data.status !== 'PENDING_REVIEW' ? <p className="qm-feedback" role="status">Khóa học không còn ở trạng thái Chờ duyệt. Preview quiz chỉ khả dụng trong lúc review.</p> : <>
        <section className="qm-panel"><h2>{query.data.title}</h2><p className="qm-muted">Expert: {query.data.expertName} · Chờ duyệt · Chỉ xem</p></section>
        {query.data.quizzes.length === 0 && <section className="qm-panel qm-empty">Khóa học chưa có quiz.</section>}
        {query.data.quizzes.map(quiz => <section className="qm-panel" key={quiz.id}><h2>{quiz.title} <span className={`qm-badge ${quiz.active ? 'qm-active' : ''}`}>{quiz.active ? 'Hoạt động' : 'Không hoạt động'}</span></h2>
          <dl className="qm-facts"><div><dt>Mã quiz</dt><dd>#{quiz.id}</dd></div><div><dt>Thời lượng</dt><dd>{quiz.durationMinutes ?? '—'} phút</dd></div><div><dt>Tỷ lệ đạt</dt><dd>{quiz.passRate ?? '—'}%</dd></div><div><dt>Số lượt tối đa</dt><dd>{quiz.maxAttempts ?? '—'}</dd></div><div><dt>Câu hỏi</dt><dd>{quiz.questions.length}</dd></div></dl>
          {quiz.questions.length === 0 && <p className="qm-empty">Quiz chưa có câu hỏi.</p>}
          {quiz.questions.map((q, index) => <details key={q.id} className="qm-question"><summary>Câu {index + 1} · #{q.id} · {q.points ?? '—'} điểm</summary><p className="qm-text">{q.content}</p><p className="qm-muted">Loại: {q.type ?? 'Chưa cấu hình'}</p>{q.options.length === 0 ? <p>Chưa có lựa chọn trả lời.</p> : <ul className="qm-options">{q.options.map(o => <li key={o.id} className={o.correct ? 'qm-correct' : ''}><span className="qm-text">{o.content}</span>{o.correct && <strong> ✓ Đáp án đúng</strong>}</li>)}</ul>}<h3>Giải thích</h3><p className="qm-text">{q.explanation || 'Chưa có giải thích.'}</p></details>)}
        </section>)}
      </>)}
    </>}
  </div>
}
