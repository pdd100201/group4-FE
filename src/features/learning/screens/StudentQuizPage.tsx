import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../shared/context/AuthContext'
import { validId } from '../../../shared/hooks/useQuizManagement'
import { QuizError } from '../../quiz/QuizShared'
import { SafePostContent } from '../../blog/screens/SafePostContent'
import { studentQuizApi, type QuizAttempt, type QuizAnswer } from '../api/studentQuizApi'
import './student-quiz.css'

export function StudentQuizPage() {
  const { quizId: rawId } = useParams()
  const [params] = useSearchParams()
  const id = validId(rawId), attemptId = validId(params.get('attemptId'))
  const { user } = useAuth()
  const navigate = useNavigate()
  const info = useQuery({ queryKey: ['student-quiz-info', user?.id, id], queryFn: () => studentQuizApi.info(id!), enabled: id !== null, retry: false })
  const start = useMutation({ mutationFn: () => studentQuizApi.start(id!), onSuccess: result => navigate(`/student/quizzes/${id}?attemptId=${result.id}`, { replace: true }) })
  if (id === null) return <main className="student-quiz"><p role="alert">Mã bài kiểm tra không hợp lệ.</p></main>
  if (params.has('attemptId') && attemptId === null) return <main className="student-quiz"><p role="alert">Mã lượt làm bài không hợp lệ.</p></main>
  if (attemptId !== null) return <QuizAttemptLoader key={attemptId} attemptId={attemptId} quizId={id} />
  if (info.isPending) return <main className="student-quiz"><p role="status">Đang tải bài kiểm tra...</p></main>
  if (info.isError) return <main className="student-quiz"><QuizError error={info.error} retry={() => void info.refetch()} /></main>
  const data=info.data, pending=data.history.find(a=>a.submittedAt===null)
  return <main className="student-quiz"><Link to={`/student/courses/${data.courseId}/learn`}>← Quay lại khóa học</Link><h1>{data.title}</h1><p>{data.courseTitle}</p><dl className="quiz-summary"><div><dt>Thời lượng</dt><dd>{data.durationMinutes} phút</dd></div><div><dt>Tỷ lệ đạt</dt><dd>{data.passRate}%</dd></div><div><dt>Số lượt còn lại</dt><dd>{Math.max(0,data.maxAttempts-data.attemptsUsed)}/{data.maxAttempts}</dd></div></dl>
    {start.isError && <QuizError error={start.error} />}<button className="primary-button" disabled={start.isPending || !pending && data.attemptsUsed>=data.maxAttempts} onClick={()=>start.mutate()}>{start.isPending?'Đang mở bài...':pending?'Tiếp tục làm bài':'Bắt đầu làm bài'}</button>
    {!!data.history.length && <section className="quiz-history"><h2>Lịch sử làm bài</h2>{data.history.map(a=><div key={a.id}><span>Lượt #{a.id}</span>{a.submittedAt ? <><span>{a.score}% · {a.passed?'Đạt':'Chưa đạt'}</span><Link to={`/student/quiz-attempts/${a.id}`}>Xem kết quả</Link></> : <Link to={`/student/quizzes/${id}?attemptId=${a.id}`}>Đang làm · Tiếp tục</Link>}</div>)}</section>}
  </main>
}
function QuizAttemptLoader({ attemptId, quizId }: { attemptId:number;quizId:number }) {
  const { user }=useAuth()
  const query=useQuery({queryKey:['student-quiz-attempt',user?.id,attemptId],queryFn:()=>studentQuizApi.attempt(attemptId),retry:false})
  if(query.isPending)return <main className="student-quiz"><p role="status">Đang tải câu hỏi...</p></main>
  if(query.isError)return <main className="student-quiz"><QuizError error={query.error} retry={()=>void query.refetch()} /></main>
  if(query.data.quizId!==quizId)return <main className="student-quiz"><p role="alert">Lượt làm bài không thuộc bài kiểm tra này.</p></main>
  if(query.data.submittedAt)return <Navigate replace to={`/student/quiz-attempts/${attemptId}`} />
  return <QuizAttemptForm key={attemptId} attempt={query.data} />
}
function QuizAttemptForm({ attempt }: { attempt:QuizAttempt }) {
  const navigate=useNavigate()
  const [index,setIndex]=useState(0)
  const [answers,setAnswers]=useState<Record<number,number[]>>(()=>Object.fromEntries(attempt.questions.map(q=>[q.id,q.selectedIds])))
  const [confirm,setConfirm]=useState(false)
  const [expiry]=useState(()=>Date.now()+new Date(attempt.deadline).getTime()-new Date(attempt.serverTime).getTime())
  const [seconds,setSeconds]=useState(()=>Math.max(0,Math.ceil((expiry-Date.now())/1000)))
  const autoSent=useRef(false)
  const autosave=useMutation({mutationFn:(answer:QuizAnswer)=>studentQuizApi.answer(attempt.id,answer),onSuccess:data=>{if(data.submittedAt)navigate(`/student/quiz-attempts/${attempt.id}`,{replace:true})}})
  const submit=useMutation({mutationFn:(values:QuizAnswer[])=>studentQuizApi.submit(attempt.id,values),onSuccess:()=>navigate(`/student/quiz-attempts/${attempt.id}`,{replace:true})})
  const values=()=>attempt.questions.map(q=>({questionId:q.id,optionIds:answers[q.id]??[]}))
  useEffect(()=>{const interval=setInterval(()=>setSeconds(Math.max(0,Math.ceil((expiry-Date.now())/1000))),500);return()=>clearInterval(interval)},[expiry])
  useEffect(()=>{if(seconds===0&&!autoSent.current){autoSent.current=true;submit.mutate([])}},[seconds,submit])
  const question=attempt.questions[index], answered=attempt.questions.filter(q=>answers[q.id]?.length).length
  if(!question)return <main className="student-quiz"><p role="alert">Bài kiểm tra không có câu hỏi.</p></main>
  const disabled=seconds===0||autosave.isPending||submit.isPending
  function choose(id:number,checked:boolean){const current=answers[question.id]??[];const selected=question.type==='SINGLE_CHOICE'?[id]:checked?[...current,id]:current.filter(value=>value!==id);setAnswers({...answers,[question.id]:selected});autosave.mutate({questionId:question.id,optionIds:selected})}
  return <main className="student-quiz"><header className="quiz-exam-heading"><div><h1>{attempt.title}</h1><p>{answered}/{attempt.questions.length} câu đã trả lời</p></div><div className={`quiz-timer ${seconds<60?'quiz-timer-warning':''}`} role="timer" aria-label="Thời gian còn lại">{Math.floor(seconds/60)}:{String(seconds%60).padStart(2,'0')}</div></header><progress className="quiz-answer-progress" max={attempt.questions.length} value={answered} aria-label="Tiến độ trả lời" />
    <div className="quiz-exam-layout"><section className="quiz-question-surface"><small>Câu {index+1}/{attempt.questions.length} · {question.points} điểm</small><SafePostContent content={question.content} />{question.imageUrl&&<img className="quiz-question-image" src={question.imageUrl} alt="Hình câu hỏi" />}<fieldset disabled={disabled} className="quiz-options"><legend>{question.type==='MULTIPLE_CHOICE'?'Chọn các đáp án đúng':'Chọn một đáp án'}</legend>{question.options.map((option,i)=><label key={option.id} className={answers[question.id]?.includes(option.id)?'selected':''}><input type={question.type==='SINGLE_CHOICE'?'radio':'checkbox'} name={`question-${question.id}`} checked={answers[question.id]?.includes(option.id)??false} onChange={event=>choose(option.id,event.target.checked)} /><span className="quiz-option-letter">{String.fromCharCode(65+i)}</span><span>{option.content}</span></label>)}</fieldset>
      {autosave.isPending&&<p role="status">Đang lưu đáp án...</p>}{autosave.isError&&<QuizError error={autosave.error} />}{submit.isError&&<><QuizError error={submit.error} /><button onClick={()=>submit.mutate(values())}>Thử nộp lại</button></>}
      <nav className="quiz-exam-actions"><button disabled={index===0} onClick={()=>setIndex(index-1)}>← Câu trước</button><button disabled={index===attempt.questions.length-1} onClick={()=>setIndex(index+1)}>Câu tiếp →</button><button className="primary-button" disabled={disabled} onClick={()=>setConfirm(true)}>Nộp bài</button></nav>
      {confirm&&<div className="quiz-submit-confirm" role="alertdialog" aria-labelledby="quiz-submit-heading"><h2 id="quiz-submit-heading">Xác nhận nộp bài</h2><p>{attempt.questions.length-answered} câu chưa trả lời.</p><div className="quiz-exam-actions"><button disabled={submit.isPending} onClick={()=>setConfirm(false)}>Tiếp tục làm bài</button><button className="primary-button" disabled={disabled} onClick={()=>submit.mutate(values())}>Xác nhận nộp</button></div></div>}
    </section><aside className="quiz-question-index"><h2>Câu hỏi</h2><div>{attempt.questions.map((q,i)=><button key={q.id} aria-label={`Đến câu ${i+1}`} aria-current={index===i?'step':undefined} className={answers[q.id]?.length?'answered':''} onClick={()=>setIndex(i)}>{i+1}</button>)}</div></aside></div>
  </main>
}
