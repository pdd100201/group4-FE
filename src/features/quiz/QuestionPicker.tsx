import type { QuestionChoice } from '../../shared/types/quiz'

export function QuestionPicker({ choices, value, content, index, selectedIds, loading, onChange }: {
  choices: QuestionChoice[]; value: string; content?: string; index: number; selectedIds: string[]; loading: boolean; onChange: (id: string, content: string) => void
}) {
  const selected = choices.find(question => String(question.id) === value)
  const available = choices.filter(question => String(question.id) !== value && !selectedIds.includes(String(question.id)))
  return <div className="qm-question-picker"><label>Câu hỏi<select required aria-label={`Mã câu hỏi dòng ${index + 1}`} value={value} onChange={event => {
    const question = choices.find(item => String(item.id) === event.target.value)
    onChange(event.target.value, question?.content ?? '')
  }}><option value="">{loading ? 'Đang tìm câu hỏi...' : 'Chọn câu hỏi từ kết quả tìm kiếm'}</option>
    {value && <optgroup label="Câu hỏi đã chọn"><option value={value}>#{value} · {selected?.content ?? content ?? 'Câu hỏi đã chọn'}</option></optgroup>}
    {available.length > 0 && <optgroup label="Kết quả tìm kiếm">{available.map(question => <option key={question.id} value={question.id}>#{question.id} · {question.content}</option>)}</optgroup>}
  </select></label></div>
}
