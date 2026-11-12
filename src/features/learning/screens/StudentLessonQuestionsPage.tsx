import { useEffect, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { validId } from '../../../shared/hooks/useQuizManagement'
import { courseError } from '../../expert/screens/ExpertCoursesPage'
import { learningApi } from '../api/learningApi'
import './student-quiz.css'

export function StudentLessonQuestionsPage() {
 const params = useParams()
 const courseId = validId(params.courseId), lessonId = validId(params.lessonId)
 if (courseId === null || lessonId === null) return <main className="student-quiz"><p role="alert">Khóa học hoặc bài học không hợp lệ.</p><Link to="/student/courses">Khóa học của tôi</Link></main>
 return <PrepareQuestions key={`${courseId}:${lessonId}`} courseId={courseId} lessonId={lessonId} />
}

function PrepareQuestions({ courseId, lessonId }: { courseId: number; lessonId: number }) {
 const navigate = useNavigate()
 const client = useQueryClient()
 const started = useRef(false)
 const prepare = useMutation({ mutationFn: () => learningApi.prepareQuestions(courseId, lessonId), onSuccess: async result => {
  await client.invalidateQueries({ queryKey: ['student-learning'] })
  navigate(`/student/quizzes/${result.quizId}`, { replace: true })
 } })
 const { mutate } = prepare
 useEffect(() => { if (!started.current) { started.current = true; mutate() } }, [mutate])
 return <main className="student-quiz"><Link to={`/student/courses/${courseId}/lessons/${lessonId}`}>← Quay lại bài học</Link>
  {prepare.isError ? <div role="alert"><p>{courseError(prepare.error)}</p><button onClick={() => mutate()}>Thử lại</button></div> : <p role="status">Đang mở câu hỏi của bài học…</p>}
 </main>
}
