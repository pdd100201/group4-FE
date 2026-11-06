import { Navigate, useParams } from 'react-router-dom'
export function QuizEditorPage({ readOnly: _readOnly = false }: { readOnly?: boolean }) {
 const { courseId } = useParams()
 return <Navigate replace to={courseId ? `/expert/courses/${courseId}?step=content&tab=quiz` : '/expert/courses'} />
}
