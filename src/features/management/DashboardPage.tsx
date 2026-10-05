import { Link } from 'react-router-dom'
import { featuredCourses } from '../public/featuredCourses'

const registrations = [
  ['#REG-9842', 'Nguyễn Văn An', 'Full-Stack Java Web', '899.000 đ', '✓ Thành công'],
  ['#REG-9841', 'Trần Phương Linh', 'Figma & Design Systems', '699.000 đ', '✓ Thành công'],
  ['#REG-9840', 'Lê Hoàng Long', 'Python & Data Science', '1.499.000 đ', '⌛ Chờ duyệt'],
  ['#REG-9839', 'Vũ Minh Đức', 'Lean Startup & BMC', '550.000 đ', '× Đã hủy'],
]

export function DashboardPage() {
  return <div className="dashboard">
    <div className="metric-grid">{[
      ['💰', 'Tổng doanh thu', '428.650.000 đ', '+18.4%'],
      ['📝', 'Đăng ký mới', '1.420 lượt', '+12.2%'],
      ['🏆', 'Học viên đang học', '8.940 người', '+8.6%'],
      ['🎓', 'Tổng khóa học hoạt động', '128 khóa', '+4 Chờ duyệt'],
    ].map(metric => <article key={metric[1]}><span>{metric[0]}</span><small>{metric[1]}</small><h2>{metric[2]}</h2><em>{metric[3]}</em></article>)}</div>
    <div className="dashboard-grid"><article className="chart"><h2>Doanh thu theo thời gian (6 tháng gần nhất)</h2>
      <p>Tổng doanh thu thực nhận qua các cổng thanh toán</p><div className="chart-line"><i /><i /><i /><i /><i /><i /></div>
      <div className="months">Tháng 4　 Tháng 5　 Tháng 6　 Tháng 7　 Tháng 8　 <b>Tháng 9</b></div></article>
      <article className="ranking"><h2>Lượt đăng ký theo khóa học</h2>{featuredCourses.map((course, index) =>
        <div key={course.title}><b>{course.title}</b><span>{[480, 340, 295, 180][index]} lượt</span><i style={{ width: `${[100, 75, 65, 40][index]}%` }} /></div>)}</article></div>
    <article className="table-card"><div className="section-title"><div><h2>Đăng ký khóa học mới nhất</h2>
      <p>Danh sách giao dịch ghi danh và đóng học phí trực tuyến</p></div><Link to="/manager/registrations">Xem toàn bộ 1.420 đơn →</Link></div>
      <table><thead><tr>{['MÃ ĐƠN', 'HỌC VIÊN', 'KHÓA HỌC & GÓI', 'SỐ TIỀN', 'TRẠNG THÁI', 'THAO TÁC'].map(label => <th key={label}>{label}</th>)}</tr></thead>
        <tbody>{registrations.map(row => <tr key={row[0]}>{row.map((cell, index) => <td key={index}>{cell}</td>)}<td><a>Chi tiết</a></td></tr>)}</tbody></table></article>
  </div>
}
