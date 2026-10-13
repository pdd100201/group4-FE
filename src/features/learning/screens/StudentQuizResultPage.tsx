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
  const { attemptId:raw }=useParams(), id=validId(raw)
  const { user }=useAuth()
  const [filter,setFilter]=useState('all')
  const query=useQuery({queryKey:['student-quiz-result',user?.id,id],queryFn:()=>studentQuizApi.result(id!),enabled:id!==null,retry:false})
  if(id===null)return <main className="student-quiz"><p role="alert">Mã kết quả không hợp lệ.</p></main>
  if(query.isPending)return <main className="student-quiz"><p role="status">Đang tải kết quả...</p></main>
  if(query.isError)return <main className="student-quiz"><QuizError error={query.error} retry={()=>void query.refetch()} /></main>
  const result=query.data
  return <main className="student-quiz"><Link to={`/student/courses/${result.courseId}/${result.lessonId===null?'learn':`lessons/${result.lessonId}`}`}>← Quay lại bài học</Link><h1>{result.title}</h1><div className={`quiz-result-heading ${result.passed?'passed':'failed'}`}><strong>{result.score}%</strong><span>{result.passed?'Đạt':'Chưa đạt'} · Tỷ lệ đạt {result.passRate}%</span></div><dl className="quiz-summary"><div><dt>Đúng</dt><dd>{result.correctQuestions}/{result.totalQuestions}</dd></div><div><dt>Sai / chưa trả lời</dt><dd>{result.totalQuestions-result.correctQuestions}</dd></div><div><dt>Thời gian</dt><dd>{Math.floor(result.secondsUsed/60)}:{String(result.secondsUsed%60).padStart(2,'0')}</dd></div></dl><div className="quiz-exam-actions"><Link className="primary-button quiz-link-button" to={`/student/quizzes/${result.quizId}`}>Làm lại / xem số lượt</Link><Link to={`/student/courses/${result.courseId}/learn`}>Tiếp tục học</Link></div>
    <div className="quiz-result-filters" role="group" aria-label="Lọc kết quả">{[['all','Tất cả'],['correct','Đúng'],['incorrect','Sai']].map(([value,label])=><button key={value} aria-pressed={filter===value} onClick={()=>setFilter(value)}>{label}</button>)}</div>
    {result.questions.filter(q=>filter==='all'||(filter==='correct'?q.correct:!q.correct)).map(q=><article className="quiz-review-question" key={q.id}><header><h2>Câu {q.position}</h2><span className={q.correct?'quiz-correct':'quiz-incorrect'}>{q.correct?'Đúng':'Sai / chưa trả lời'} · {q.awardedPoints}/{q.points} điểm</span></header><SafePostContent content={q.content} />{q.imageUrl&&<img className="quiz-question-image" src={q.imageUrl} alt="Hình câu hỏi" />}<ul className="quiz-review-options">{q.options.map(option=><li key={option.id} className={q.correctIds.includes(option.id)?'quiz-correct-option':q.selectedIds.includes(option.id)?'quiz-wrong-option':''}><span>{option.content}</span><small>{q.correctIds.includes(option.id)?'Đáp án đúng':''}{q.selectedIds.includes(option.id)?' · Bạn đã chọn':''}</small></li>)}</ul>{q.explanation&&<p className="quiz-explanation"><b>Giải thích:</b> {q.explanation}</p>}</article>)}
  </main>
}
