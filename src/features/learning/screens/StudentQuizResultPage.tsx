import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../../shared/context/AuthContext'
import { validId } from '../../../shared/hooks/useQuizManagement'
import { SafePostContent } from '../../blog/screens/SafePostContent'
import { QuizError } from '../../quiz/QuizShared'
import { studentQuizApi } from '../api/studentQuizApi'
import './student-quiz.css'

export function StudentQuizResultPage() {
  const { attemptId: raw } = useParams(), id = validId(raw)
  const { user } = useAuth()
  const [filter, setFilter] = useState('all')
  const query = useQuery({ queryKey: ['student-quiz-result', user?.id, id], queryFn: () => studentQuizApi.result(id!), enabled: id !== null, retry: false })
  if (id === null) return <main className="student-quiz"><p role="alert">Mã kết quả không hợp lệ.</p></main>
  if (query.isPending) return <main className="student-quiz"><p role="status">Đang tải kết quả...</p></main>
  if (query.isError) return <main className="student-quiz"><QuizError error={query.error} retry={() => void query.refetch()} /></main>
  const result = query.data
  const wrong = result.totalQuestions - result.correctQuestions
  const duration = `${Math.floor(result.secondsUsed / 60)}:${String(result.secondsUsed % 60).padStart(2, '0')}`
  const lessonPath = `/student/courses/${result.courseId}/${result.lessonId === null ? 'learn' : `lessons/${result.lessonId}`}`
  return <main className="student-quiz quiz-results">
    <span className="quiz-eyebrow result-eyebrow">BÁO CÁO KẾT QUẢ</span><h1>Kết quả: {result.title}</h1><p className="quiz-result-meta">Thời lượng làm bài: {duration} · Mức yêu cầu đạt: {result.passRate}%</p>
    <section className={`quiz-result-heading ${result.passed ? 'passed' : 'failed'}`}><div className="quiz-score-ring"><strong>{result.score}</strong><small>/100</small></div><div><span className="quiz-result-badge">{result.passed ? '✓ ĐÃ ĐẠT' : 'CHƯA ĐẠT'}</span><h2>{result.passed ? 'Chúc mừng bạn đã vượt qua bài kiểm tra!' : 'Tiếp tục cố gắng, bạn sẽ làm tốt hơn!'}</h2><p>Bạn trả lời đúng <b>{result.correctQuestions}/{result.totalQuestions} câu</b>. {result.passed ? 'Hãy tiếp tục hành trình học tập của bạn.' : 'Xem lại phần giải thích bên dưới để củng cố kiến thức.'}</p></div></section>
    <dl className="quiz-summary"><div><dd className="quiz-correct">{result.correctQuestions} câu</dd><dt>✓ Trả lời chính xác</dt></div><div><dd className="quiz-duration">{duration}</dd><dt>◷ Tổng thời gian làm</dt></div><div><dd className="quiz-incorrect">{wrong} câu</dd><dt>× Sai hoặc chưa trả lời</dt></div></dl>
    <div className="quiz-review-toolbar"><h2>Xem lại câu hỏi & giải thích chi tiết:</h2><div className="quiz-result-filters" role="group" aria-label="Lọc kết quả">{[['all', `Tất cả (${result.totalQuestions})`], ['correct', `Đúng (${result.correctQuestions})`], ['incorrect', `Sai (${wrong})`]].map(([value, label]) => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div></div>
    <div className="quiz-review-list">{result.questions.filter(q => filter === 'all' || (filter === 'correct' ? q.correct : !q.correct)).map(q => <article className={`quiz-review-question ${q.correct ? 'review-correct' : 'review-incorrect'}`} key={q.id}><header><h2>CÂU {q.position} {q.correct ? '✓' : '×'}</h2><span className={q.correct ? 'quiz-correct' : 'quiz-incorrect'}>{q.correct ? 'Chính xác' : 'Chưa chính xác'} ({q.awardedPoints}/{q.points} điểm)</span></header>
      <SafePostContent content={q.content} />{q.imageUrl && <img className="quiz-question-image" src={q.imageUrl} alt="Hình câu hỏi" />}
      <ul className="quiz-review-options">{q.options.map((option, i) => <li key={option.id} className={q.correctIds.includes(option.id) ? 'quiz-correct-option' : q.selectedIds.includes(option.id) ? 'quiz-wrong-option' : ''}><span><b>{String.fromCharCode(65 + i)}.</b> {option.content}</span><small>{q.correctIds.includes(option.id) ? '✓ Đáp án đúng' : ''}{q.selectedIds.includes(option.id) ? ' · Bạn đã chọn' : ''}</small></li>)}</ul>
      {q.explanation && <div className="quiz-explanation"><b>💡 Giải thích chi tiết:</b><p>{q.explanation}</p></div>}
    </article>)}</div>
    {result.questions.filter(q => filter === 'all' || (filter === 'correct' ? q.correct : !q.correct)).length === 0 && <p className="quiz-filter-empty">Không có câu hỏi trong mục này.</p>}
    <div className="quiz-exam-actions quiz-result-actions"><Link className="quiz-link-button" to={`/student/quizzes/${result.quizId}`}>↻ Làm lại / xem số lượt</Link><Link className="primary-button quiz-link-button" to={lessonPath}>Tiếp tục bài học →</Link></div>
  </main>
}
