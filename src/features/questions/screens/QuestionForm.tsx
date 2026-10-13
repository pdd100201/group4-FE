import { useMutation } from '@tanstack/react-query'
import { useRef, useState, type FormEvent } from 'react'
import { MediaUpload } from '../../../shared/components/media/MediaUpload'
import { QuizError } from '../../quiz/QuizShared'
import { SafePostContent } from '../../blog/screens/SafePostContent'
import { questionApi, type BankQuestion, type QuestionInput } from '../api/questionApi'

export function QuestionForm({ courseId, initial, readOnly, onCancel, onSaved }: {
  courseId: number; initial?: BankQuestion; readOnly: boolean; onCancel: () => void; onSaved: () => Promise<void>
}) {
  const [data, setData] = useState<QuestionInput>(() => ({ content: initial?.content ?? '', type: initial?.type ?? 'SINGLE_CHOICE', explanation: initial?.explanation ?? '', active: initial?.active ?? true,
    imageMediaId: initial?.imageMediaId ?? null, options: Array.from({ length: 4 }, (_, index) => ({ content: initial?.options[index]?.content ?? '', correct: initial?.options[index]?.correct ?? false })) }))
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '')
  const [uploading, setUploading] = useState(false)
  const [validation, setValidation] = useState('')
  const [preview, setPreview] = useState(false)
  const textarea = useRef<HTMLTextAreaElement>(null)
  const save = useMutation({ mutationFn: () => initial ? questionApi.update(courseId, initial.id, data) : questionApi.create(courseId, data), onSuccess: onSaved })
  function format(before: string, after = '') {
    const field=textarea.current; if (!field) return
    const start=field.selectionStart, end=field.selectionEnd
    setData(value => ({ ...value, content: value.content.slice(0,start)+before+value.content.slice(start,end)+after+value.content.slice(end) }))
    requestAnimationFrame(() => { field.focus(); field.setSelectionRange(start+before.length,end+before.length) })
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); setValidation(''); save.reset()
    const correct=data.options.filter(o=>o.correct).length
    if (!correct || (data.type==='SINGLE_CHOICE' && correct!==1)) { setValidation('Chọn đáp án đúng theo loại câu hỏi.'); return }
    if (new Set(data.options.map(o=>o.content.trim().toLowerCase())).size!==4) { setValidation('Bốn đáp án không được trùng nhau.'); return }
    await save.mutateAsync().catch(()=>{})
  }
  const disabled=readOnly || save.isPending || uploading
  return <form className="question-editor" onSubmit={event => void submit(event)}><h2>{readOnly ? 'Chi tiết câu hỏi' : initial ? `Sửa câu hỏi #${initial.id}` : 'Tạo câu hỏi'}</h2><fieldset disabled={disabled}>
    <label>Loại câu hỏi<select value={data.type} onChange={event=>setData({ ...data, type:event.target.value as QuestionInput['type'], options:data.options.map(o=>({...o,correct:false})) })}><option value="SINGLE_CHOICE">Một đáp án đúng</option><option value="MULTIPLE_CHOICE">Nhiều đáp án đúng</option></select></label>
    <label>Nội dung câu hỏi<div className="question-toolbar"><button type="button" title="In đậm" aria-label="In đậm" onClick={()=>format('<strong>','</strong>')}><b>B</b></button><button type="button" title="In nghiêng" aria-label="In nghiêng" onClick={()=>format('<em>','</em>')}><i>I</i></button><button type="button" title="Chèn ký hiệu toán" aria-label="Chèn ký hiệu toán" onClick={()=>format('∑')}>∑</button><button type="button" onClick={()=>setPreview(!preview)}>{preview ? 'Soạn' : 'Xem trước'}</button></div><textarea ref={textarea} required maxLength={4000} value={data.content} onChange={event=>setData({...data,content:event.target.value})} /></label>
    {preview && <div className="question-preview"><SafePostContent content={data.content} /></div>}
    {!readOnly && <MediaUpload purpose="QUESTION_IMAGE" courseId={courseId} disabled={save.isPending} onBusy={setUploading} onUploaded={media=>{setData({...data,imageMediaId:media.id});setImageUrl(media.url ?? '')}} />}
    {imageUrl && <div className="question-image"><img src={imageUrl} alt="Ảnh câu hỏi" />{!readOnly && <button type="button" onClick={()=>{setImageUrl('');setData({...data,imageMediaId:null})}}>Bỏ ảnh</button>}</div>}
    <h3>Đáp án</h3>{data.options.map((option,index)=><div className="question-option" key={index}><input aria-label={`Đáp án đúng ${String.fromCharCode(65+index)}`} name="correct-answer" type={data.type==='SINGLE_CHOICE' ? 'radio' : 'checkbox'} checked={option.correct} onChange={event=>setData({...data,options:data.options.map((o,i)=>({...o,correct:i===index ? event.target.checked : data.type==='SINGLE_CHOICE' ? false : o.correct}))})} /><label>Đáp án {String.fromCharCode(65+index)}<input required maxLength={255} value={option.content} onChange={event=>setData({...data,options:data.options.map((o,i)=>i===index?{...o,content:event.target.value}:o)})} /></label></div>)}
    <label>Giải thích<textarea maxLength={255} value={data.explanation} onChange={event=>setData({...data,explanation:event.target.value})} /></label>
    <label className="question-active"><input type="checkbox" checked={data.active} onChange={event=>setData({...data,active:event.target.checked})} />Hoạt động</label>
  </fieldset>{validation && <p role="alert" className="qm-error">{validation}</p>}{save.isError && <QuizError error={save.error} />}<div className="qm-form-actions"><button type="button" disabled={save.isPending || uploading} onClick={onCancel}>{readOnly ? 'Đóng' : 'Hủy'}</button>{!readOnly && <button className="primary-button" disabled={disabled}>{save.isPending?'Đang lưu...':'Lưu câu hỏi'}</button>}</div></form>
}
