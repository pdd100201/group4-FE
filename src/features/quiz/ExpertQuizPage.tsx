import { Navigate, useParams } from 'react-router-dom'
export function ExpertQuizPage() {
 const { courseId } = useParams()
 return <Navigate replace to={courseId ? `/expert/courses/${courseId}?step=content&tab=quiz` : '/expert/courses'} />
}
