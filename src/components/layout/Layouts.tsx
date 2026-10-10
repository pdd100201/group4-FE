import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { landingRoute } from '../../utils/roleRoutes'

const Logo = ({ admin = false }: { admin?: boolean }) => <Link className="brand" to={admin ? '/dashboard' : '/'}><b>E</b> Edu<span>{admin ? 'Admin' : 'Learn'}</span></Link>

function LogoutButton() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  return <button className="logout" onClick={async () => { await logout(); navigate('/login', { replace: true }) }}>Đăng xuất</button>
}

export function PublicLayout() {
  const { user } = useAuth()
  return <><header className="public-header"><Logo/><nav><NavLink to="/">Trang chủ</NavLink><NavLink to="/courses">Khóa học</NavLink><NavLink to="/blog">Bài viết</NavLink><a href="#about">Về chúng tôi</a></nav><div className="header-actions">{user ? <><Link to={landingRoute(user)}>Không gian của tôi</Link><LogoutButton /></> : <><Link to="/login">Đăng nhập</Link><Link className="primary-button small" to="/register">Đăng ký</Link></>}</div></header><main><Outlet/></main><footer id="about"><Logo/><p>Nền tảng học tập & ôn luyện kiến thức trực tuyến hiện đại.</p><div><b>LIÊN HỆ</b><p>Email: hotro@edulearn.vn · Hotline: 1900 6688</p></div><div><b>KẾT NỐI VỚI CHÚNG TÔI</b><p>© 2026 EduLearn. Bảo lưu mọi quyền.</p></div></footer></>
}

const SideLink = ({ to, children }: { to: string; children: React.ReactNode }) => <NavLink className="side-link" to={to}>{children}</NavLink>

function Topbar() {
  const { user } = useAuth()
  const roleLabel = user?.roles.includes('ROLE_ADMIN') ? 'Quản trị viên' : user?.roles.includes('ROLE_MANAGER') ? 'Quản lý' : user?.roles.includes('ROLE_EXPERT') ? 'Chuyên gia' : 'Học viên'
  return <header className="topbar"><label>⌕ <input placeholder="Tìm kiếm nhanh..."/></label><span className="avatar">{user?.fullName?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'U'}</span><div><b>{user?.fullName || user?.email}</b><small>{roleLabel}</small></div></header>
}

export function StudentLayout() {
  return <section className="app-shell"><aside className="sidebar"><Logo/><p className="side-label">HỌC TẬP</p><SideLink to="/student/courses">▣ Khóa học của tôi</SideLink><SideLink to="/student/registrations">▤ Đăng ký khóa học</SideLink><LogoutButton /></aside><section className="app-content"><Topbar/><Outlet/></section></section>
}

export function ExpertLayout() {
  return <section className="app-shell"><aside className="sidebar"><Logo/><p className="side-label">GIẢNG DẠY</p><SideLink to="/expert/courses">▣ Quản lý khóa học</SideLink><SideLink to="/expert/questions">▤ Ngân hàng câu hỏi</SideLink><SideLink to="/expert/quizzes">◫ Quản lý bài kiểm tra</SideLink><LogoutButton /></aside><section className="app-content"><Topbar/><Outlet/></section></section>
}

export function DashboardLayout() {
  const { user } = useAuth()
  const admin = Boolean(user?.roles.includes('ROLE_ADMIN'))
  return <section className="app-shell"><aside className={admin ? 'sidebar admin' : 'sidebar'}><Logo admin={admin}/>
    {admin ? <><p className="side-label">TỔNG QUAN HỆ THỐNG</p><SideLink to="/dashboard">▥ Bảng điều khiển</SideLink><SideLink to="/admin/registrations">▧ Quản lý Đăng ký</SideLink><SideLink to="/admin/transactions">▣ Giao dịch & Dòng tiền</SideLink><SideLink to="/admin/reports">◫ Báo cáo & Xuất dữ liệu</SideLink><p className="side-label">QUẢN TRỊ NGƯỜI DÙNG</p><SideLink to="/admin/accounts">♟ Tài khoản & Phân quyền</SideLink></>
      : <><p className="side-label">QUẢN LÝ</p><SideLink to="/manager/courses/review">▤ Duyệt khóa học</SideLink><SideLink to="/manager/registrations">▧ Quản lý Đăng ký</SideLink><SideLink to="/manager/transactions">▣ Giao dịch & Dòng tiền</SideLink><SideLink to="/manager/posts">▤ Quản lý bài viết</SideLink></>}
    <LogoutButton /></aside><section className="app-content"><Topbar/><Outlet/></section></section>
}
