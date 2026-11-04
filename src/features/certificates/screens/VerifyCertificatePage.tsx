import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { certificateApi } from '../api/certificateApi'
import { CertificateError, CertificatePreview, CertificateStatus } from '../components/CertificateShared'
export function VerifyCertificatePage() {
 const [params, setParams] = useSearchParams()
 const code = (params.get('code') ?? '').trim().toUpperCase()
 const [draft, setDraft] = useState(code)
 const [invalid, setInvalid] = useState(false)
 useEffect(() => { setDraft(code) }, [code])
 const valid = /^[0-9A-F]{32}$/.test(code)
 const query = useQuery({ queryKey: ['public-certificate', code], queryFn: () => certificateApi.verify(code), enabled: valid, retry: false, staleTime: 0 })
 return <main className="certificates-ui cert-page cert-public">
  <header className="cert-page-heading"><div><span className="cert-eyebrow">XÁC MINH TRỰC TUYẾN</span><h1>Tra cứu chứng nhận</h1><p>Nhập mã trên chứng nhận hoặc mở đường dẫn từ mã QR để kiểm tra.</p></div></header>
  <form className="cert-toolbar" onSubmit={e => { e.preventDefault(); const next = draft.trim().toUpperCase(); setInvalid(!/^[0-9A-F]{32}$/.test(next)); if (/^[0-9A-F]{32}$/.test(next)) { if (next === code) void query.refetch(); else setParams({ code: next }) } }}>
   <label className="cert-sr-only" htmlFor="certificate-code">Mã chứng nhận</label>
   <input id="certificate-code" required maxLength={32} value={draft} onChange={e => setDraft(e.target.value)} placeholder="Mã chứng nhận gồm 32 ký tự" autoCapitalize="characters" spellCheck={false} />
   <button className="cert-primary">Tra cứu</button>
  </form>
  {(invalid || (!!code && !valid)) && <p className="cert-error" role="alert">Mã chứng nhận phải gồm 32 ký tự 0–9 và A–F.</p>}
  {valid && query.isPending && <p role="status">Đang xác minh…</p>}
  {query.isError && <CertificateError error={query.error} retry={() => void query.refetch()} />}
  {query.isSuccess && <><div className="cert-verification-result" role="status"><CertificateStatus status={query.data.status} /><p>{query.data.status === 'ISSUED' ? 'Tìm thấy chứng nhận còn hiệu lực trên hệ thống EduLearn.' : 'Chứng nhận này đã bị thu hồi và không còn hiệu lực.'}</p></div><CertificatePreview certificate={query.data} /></>}
  {!code && <div className="cert-empty"><p>Kết quả xác minh sẽ hiển thị tại đây.</p></div>}
 </main>
}
