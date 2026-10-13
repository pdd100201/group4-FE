import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { dashboardApi } from '../api/dashboardApi'
import './dashboard.css'

const money = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)
const date = (value: string | null) => value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(value)) : 'Chưa lưu'
const statusLabels: Record<string, string> = { ACTIVE: 'Đang hoạt động', PENDING_PAYMENT: 'Chờ thanh toán', CANCELLED: 'Đã hủy', EXPIRED: 'Hết hạn', FAILED: 'Thất bại' }

export function DashboardPage() {
  const query = useQuery({ queryKey: ['admin-dashboard'], queryFn: dashboardApi.read, retry: false })
  if (query.isLoading) return <main className="dashboard"><p role="status">Đang tải bảng điều khiển...</p></main>
  if (query.error || !query.data) return <main className="dashboard"><div role="alert" className="dashboard-error">Không tải được số liệu. <button onClick={() => void query.refetch()}>Thử lại</button></div></main>
  const data = query.data
  const maximum = Math.max(1, ...data.topCourses.map(course => course.registrations))
  const metrics = [
    ['Doanh thu hợp lệ', money(data.totalRevenue), 'Thanh toán thành công'],
    ['Tổng đăng ký', data.totalRegistrations.toLocaleString('vi-VN'), 'Đăng ký đã ghi nhận'],
    ['Học viên hoạt động', data.activeStudents.toLocaleString('vi-VN'), 'Đã kích hoạt, không bị khóa'],
    ['Khóa học hoạt động', data.activeCourses.toLocaleString('vi-VN'), `${data.pendingCourses.toLocaleString('vi-VN')} khóa chờ duyệt`],
  ]
  return <main className="dashboard"><header className="dashboard-heading"><div><span>EduAdmin</span><h1>Bảng điều khiển</h1></div><button onClick={() => void query.refetch()} disabled={query.isFetching}>{query.isFetching ? 'Đang làm mới...' : 'Làm mới'}</button></header>
    <div className="metric-grid">{metrics.map(metric => <article key={metric[0]}><small>{metric[0]}</small><h2>{metric[1]}</h2><p>{metric[2]}</p></article>)}</div>
    <section className="dashboard-grid"><article className="ranking"><h2>Lượt đăng ký theo khóa học</h2>{data.topCourses.length ? data.topCourses.map(course => <div key={course.courseId}><b>{course.courseTitle}</b><span>{course.registrations.toLocaleString('vi-VN')} lượt</span><i style={{ width: `${Math.max(4, course.registrations * 100 / maximum)}%` }} /></div>) : <p className="dashboard-empty">Chưa có dữ liệu đăng ký.</p>}</article>
      <article className="dashboard-summary"><h2>Truy cập nhanh</h2><Link to="/admin/accounts">Quản lý tài khoản</Link><Link to="/admin/reports">Báo cáo và xuất dữ liệu</Link><Link to="/admin/registrations">Danh sách đăng ký</Link><Link to="/admin/transactions">Giao dịch và dòng tiền</Link></article></section>
    <article className="table-card"><div className="section-title"><div><h2>Đăng ký mới nhất</h2><p>Dữ liệu đăng ký thực tế gần nhất trong hệ thống</p></div><Link to="/admin/registrations">Xem toàn bộ {data.totalRegistrations.toLocaleString('vi-VN')} đơn</Link></div>
      {data.recentRegistrations.length ? <table><thead><tr><th>MÃ</th><th>HỌC VIÊN</th><th>KHÓA HỌC / GÓI</th><th>SỐ TIỀN</th><th>TRẠNG THÁI</th><th>NGÀY TẠO (UTC)</th></tr></thead><tbody>{data.recentRegistrations.map(row => <tr key={row.id}><td>#{row.id}</td><td>{row.studentName}<small>{row.studentEmail}</small></td><td>{row.courseTitle}<small>{row.packageName ?? 'Chưa lưu gói'}</small></td><td>{row.amount == null ? 'Chưa lưu' : money(row.amount)}</td><td>{row.status ? statusLabels[row.status] ?? row.status : 'Chưa lưu'}</td><td>{date(row.createdAt)}</td></tr>)}</tbody></table> : <p className="dashboard-empty">Chưa có đăng ký.</p>}</article>
  </main>
}
