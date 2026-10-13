import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { landingRoute } from '../../utils/roleRoutes'
import './public-layout.css'
import './workspace-layout.css'

const Logo = ({ admin = false }: { admin?: boolean }) => <Link className="brand" to={admin ? '/dashboard' : '/'}><b>E</b> Edu<span>{admin ? 'Admin' : 'Learn'}</span></Link>

function LogoutButton() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  return <button className="logout" onClick={async () => { await logout(); navigate('/login', { replace: true }) }}>Đăng xuất</button>
}

export function PublicLayout() {
  const { user } = useAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => setMenuOpen(false), [location.pathname])
  return <div className="public-layout"><header className={`public-header ${menuOpen ? 'menu-open' : ''}`}><Logo/><button className="nav-toggle" aria-label="Mở menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(value => !value)}><span/><span/><span/></button><nav><NavLink to="/" end>Trang chủ</NavLink><NavLink to="/courses">Khóa học</NavLink><NavLink to="/blog">Bài viết</NavLink><a href="#about">Về chúng tôi</a></nav>
    <div className="header-actions">{user ? <><Link to={user.roles.includes('ROLE_STUDENT') ? '/student/courses' : landingRoute(user)}>Không gian của tôi</Link><LogoutButton /></> : <><Link to="/login">Đăng nhập</Link><Link className="primary-button small" to="/register">Đăng ký</Link></>}</div>
  </header><main><Outlet/></main><footer id="about"><Logo/><p>Nền tảng học tập & ôn luyện kiến thức trực tuyến hiện đại.</p><div><b>LIÊN HỆ</b><p>Email: hotro@edulearn.vn · Hotline: 1900 6688</p></div><div><b>KẾT NỐI VỚI CHÚNG TÔI</b><p>© 2026 EduLearn. Bảo lưu mọi quyền.</p></div></footer></div>
}

const SideLink = ({ to, children, end = false }: { to: string; children: React.ReactNode; end?: boolean }) => <NavLink className="side-link" to={to} end={end}>{children}</NavLink>

function Topbar({ onMenu }: { onMenu: () => void }) {
  const { user } = useAuth()
  const roleLabel = user?.roles.includes('ROLE_ADMIN') ? 'Quản trị viên' : user?.roles.includes('ROLE_MANAGER') ? 'Quản lý' : user?.roles.includes('ROLE_EXPERT') ? 'Chuyên gia' : 'Học viên'
  return <header className="topbar"><button className="sidebar-toggle" aria-label="Mở thanh điều hướng" onClick={onMenu}>☰</button><label><span>⌕</span><input placeholder="Tìm kiếm nhanh..."/></label><span className="topbar-spacer" />{user && <div className="topbar-profile">{user.avatarUrl ? <img className="avatar" src={user.avatarUrl} alt="Ảnh đại diện" /> : <span className="avatar">{user.fullName?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? 'U'}</span>}<div><b>{user.fullName || user.email}</b><small>{roleLabel}</small></div></div>}</header>
}

function AppFrame({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => setMenuOpen(false), [location.pathname])
  return <section className={`app-shell ${menuOpen ? 'menu-open' : ''}`}>
    <button className="sidebar-backdrop" aria-label="Đóng thanh điều hướng" onClick={() => setMenuOpen(false)} />
    <aside className={`sidebar ${admin ? 'admin' : ''}`}><div className="sidebar-header"><Logo admin={admin}/><button aria-label="Đóng menu" onClick={() => setMenuOpen(false)}>×</button></div>{children}<LogoutButton /></aside>
    <section className="app-content"><Topbar onMenu={() => setMenuOpen(true)}/><Outlet/></section>
  </section>
}

export function StudentLayout() {
  return <AppFrame><p className="side-label">HỌC TẬP</p><SideLink to="/student/courses" end>▣ Khóa học của tôi</SideLink><SideLink to="/student/registrations">▤ Đăng ký của tôi</SideLink><p className="side-label">TÀI KHOẢN</p><SideLink to="/profile">Hồ sơ cá nhân</SideLink></AppFrame>
}

export function ExpertLayout() {
  return <AppFrame><p className="side-label">GIẢNG DẠY</p><SideLink to="/expert/courses">▣ Quản lý khóa học</SideLink><SideLink to="/expert/questions">▤ Ngân hàng câu hỏi</SideLink><SideLink to="/expert/quizzes">◫ Quản lý bài kiểm tra</SideLink><p className="side-label">TÀI KHOẢN</p><SideLink to="/profile">Hồ sơ cá nhân</SideLink></AppFrame>
}

export function DashboardLayout() {
  const { user } = useAuth()
  const admin = Boolean(user?.roles.includes('ROLE_ADMIN'))
  return <AppFrame admin={admin}>
    <SideLink to={admin ? '/admin/courses/archived' : '/manager/courses/archived'}>▣ Trạng thái khóa học</SideLink>
    {admin ? <><p className="side-label">TỔNG QUAN HỆ THỐNG</p><SideLink to="/dashboard">▥ Bảng điều khiển</SideLink><SideLink to="/admin/registrations">▧ Quản lý Đăng ký</SideLink><SideLink to="/admin/transactions">▣ Giao dịch & Dòng tiền</SideLink><SideLink to="/admin/reports">◫ Báo cáo & Xuất dữ liệu</SideLink><p className="side-label">QUẢN TRỊ NGƯỜI DÙNG</p><SideLink to="/admin/accounts">♟ Tài khoản & Phân quyền</SideLink></>
      : <><p className="side-label">QUẢN LÝ</p><SideLink to="/manager/courses/review">▤ Duyệt khóa học</SideLink><SideLink to="/manager/registrations">▧ Quản lý Đăng ký</SideLink><SideLink to="/manager/transactions">▣ Giao dịch & Dòng tiền</SideLink><SideLink to="/manager/posts">▤ Quản lý bài viết</SideLink></>}
    {!admin && <SideLink to="/manager/courses/review/quizzes">◫ Xem trước bài kiểm tra</SideLink>}
    <p className="side-label">TÀI KHOẢN</p><SideLink to="/profile">Hồ sơ cá nhân</SideLink>
  </AppFrame>
}

export function ProfileLayout() {
  const { user } = useAuth()
  if (user?.roles.includes('ROLE_STUDENT')) return <StudentLayout />
  if (user?.roles.includes('ROLE_EXPERT')) return <ExpertLayout />
  return <DashboardLayout />
}
