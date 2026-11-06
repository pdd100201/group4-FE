import { NotificationBell } from '../../../features/notifications/components/NotificationCenter'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { landingRoute } from '../../utils/roleRoutes'
import './public-layout.css'
import './workspace-layout.css'
import './student-learning-layout.css'

const Logo = ({ admin = false }: { admin?: boolean }) => <Link className="brand" to={admin ? '/dashboard' : '/'}><b>E</b> Edu<span>{admin ? 'Admin' : 'Learn'}</span></Link>

function LogoutButton() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  return <button className="logout" onClick={async () => { await logout(); navigate('/login', { replace: true }) }}><SidebarIcon name="logout" />Đăng xuất</button>
}

export function PublicLayout() {
  const { user } = useAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => setMenuOpen(false), [location.pathname])
  return <div className="public-layout"><header className={`public-header ${menuOpen ? 'menu-open' : ''}`}><Logo/><button className="nav-toggle" aria-label="Mở menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(value => !value)}><span/><span/><span/></button><nav><NavLink to="/" end>Trang chủ</NavLink><NavLink to="/courses">Khóa học</NavLink><NavLink to="/blog">Bài viết</NavLink><NavLink to="/about">Về chúng tôi</NavLink></nav>
    <div className="header-actions">{user ? <><NotificationBell /><Link to="/chat">Trò chuyện</Link><Link to={user.roles.includes('ROLE_STUDENT') ? '/student/courses' : landingRoute(user)}>Không gian của tôi</Link><LogoutButton /></> : <><Link to="/login">Đăng nhập</Link><Link className="primary-button small" to="/register">Đăng ký</Link></>}</div>
  </header><main><Outlet/></main><footer id="about"><Logo/><p>Nền tảng học tập & ôn luyện kiến thức trực tuyến hiện đại.</p><div><b>LIÊN HỆ</b><p>Email: hotro@edulearn.vn · Hotline: 1900 6688</p></div><div><b>KẾT NỐI VỚI CHÚNG TÔI</b><p>© 2026 EduLearn. Bảo lưu mọi quyền.</p></div></footer></div>
}

const SideLink = ({ to, children, end = false }: { to: string; children: React.ReactNode; end?: boolean }) => <NavLink className="side-link" to={to} end={end}>{children}</NavLink>

function Topbar({ onMenu }: { onMenu: () => void }) {
  const { user } = useAuth()
  const roleLabel = user?.roles.includes('ROLE_ADMIN') ? 'Quản trị viên' : user?.roles.includes('ROLE_MANAGER') ? 'Quản lý' : user?.roles.includes('ROLE_EXPERT') ? 'Chuyên gia' : 'Học viên'
  return <header className="topbar"><button className="sidebar-toggle" aria-label="Mở thanh điều hướng" onClick={onMenu}>☰</button><label><span>⌕</span><input placeholder="Tìm kiếm nhanh..."/></label><span className="topbar-spacer" /><NotificationBell />{user && <div className="topbar-profile">{user.avatarUrl ? <img className="avatar" src={user.avatarUrl} alt="Ảnh đại diện" /> : <span className="avatar">{user.fullName?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? 'U'}</span>}<div><b>{user.fullName || user.email}</b><small>{roleLabel}</small></div></div>}</header>
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
  const { pathname } = useLocation()
  const { user } = useAuth()
  if (/^\/student\/courses\/[^/]+\/(learn|lessons)(\/|$)/.test(pathname)) return <Outlet />
  if (pathname === '/student/courses' || pathname === '/certificates' || /^\/student\/(quizzes|quiz-attempts)\//.test(pathname)) {
    return <div className="student-portal"><header className="student-portal-header"><Logo />
      <nav aria-label="Điều hướng học viên"><NavLink to="/courses"><SidebarIcon name="explore" />Khám phá</NavLink><NavLink to="/student/courses"><SidebarIcon name="courses" />Khóa học của tôi</NavLink><NavLink to="/student/registrations"><SidebarIcon name="registration" />Đăng ký của tôi</NavLink><NavLink to="/certificates"><SidebarIcon name="certificate" />Chứng nhận</NavLink><NavLink to="/chat"><SidebarIcon name="chat" />Trò chuyện</NavLink></nav>
      <div className="student-portal-notification-profile"><NotificationBell /><Link className="student-portal-profile" to="/profile"><span className="student-avatar">{user?.fullName?.[0] ?? 'H'}</span><span><b>{user?.fullName || user?.email}</b><small>Học viên</small></span></Link>
    </div></header><Outlet /><div className="student-portal-footer">© 2026 EduLearn. Nền tảng học tập và đánh giá trực tuyến.</div></div>
  }
  return <AppFrame><p className="side-label">HỌC TẬP</p><SideLink to="/student/courses" end><SidebarIcon name="courses" />Khóa học của tôi</SideLink><SideLink to="/certificates"><SidebarIcon name="certificate" />Chứng nhận</SideLink><SideLink to="/student/registrations"><SidebarIcon name="registration" />Đăng ký của tôi</SideLink><p className="side-label">TÀI KHOẢN</p><SideLink to="/chat"><SidebarIcon name="chat" />Trò chuyện</SideLink><SideLink to="/notifications"><SidebarIcon name="bell" />Thông báo</SideLink><SideLink to="/profile"><SidebarIcon name="profile" />Hồ sơ cá nhân</SideLink></AppFrame>
}

function SidebarIcon({ name }: { name: 'courses' | 'create' | 'list' | 'discussion' | 'chat' | 'bell' | 'profile' | 'certificate' | 'registration' | 'dashboard' | 'wallet' | 'report' | 'users' | 'review' | 'post' | 'quiz' | 'logout' | 'explore' }) {
  const paths = {
    certificate: <><circle cx="12" cy="8" r="5" /><path d="m8 12-1 9 5-3 5 3-1-9" /></>,
    registration: <><rect x="4" y="4" width="16" height="17" rx="2" /><path d="M8 2v4m8-4v4M8 11h8m-8 5h5" /></>,
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    wallet: <><path d="M20 7V4H5a2 2 0 0 0 0 4h16v12H5a2 2 0 0 1-2-2V6" /><path d="M21 12h-6v4h6m-3-2h.01" /></>,
    report: <><path d="M4 3h12l4 4v14H4zM16 3v5h4M8 17v-4m4 4v-7m4 7v-2" /></>,
    users: <><circle cx="9" cy="7" r="4" /><path d="M2 21v-2a7 7 0 0 1 14 0v2M16 3a4 4 0 0 1 0 8m3 3a6 6 0 0 1 3 5v2" /></>,
    review: <><path d="M9 4H4v17h16V4h-5" /><rect x="9" y="2" width="6" height="4" rx="1" /><path d="m8 13 3 3 5-6" /></>,
    post: <><path d="M14 3H4v18h16V11M10 14l1-4 8-8 3 3-8 8zM8 17h8" /></>,
    quiz: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="m7 8 1 1 2-2m3 1h4m-10 6 1 1 2-2m3 1h4" /></>,
    logout: <><path d="M9 3H4v18h5m5-14 5 5-5 5m-6-5h13" /></>,
    explore: <><circle cx="12" cy="12" r="9" /><path d="m16 8-3 5-5 3 3-5z" /></>,
    courses: <><path d="M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-3H4z" /><path d="M13 7a3 3 0 0 1 3-3h5v14h-4a4 4 0 0 0-4 3" /></>,
    create: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 12h8m-4-4v8" /></>,
    list: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M10 8h7m-7 4h7m-7 4h7M7 8h.01M7 12h.01M7 16h.01" /></>,
    discussion: <><path d="M21 11a8 8 0 0 1-8 8H7l-4 3V7a4 4 0 0 1 4-4h6a8 8 0 0 1 8 8Z" /><path d="M10 8a2 2 0 1 1 3 1.7c-1 .5-1 1-1 1.8M12 15h.01" /></>,
    chat: <><path d="M21 11a8 8 0 0 1-8 8H7l-4 3V7a4 4 0 0 1 4-4h6a8 8 0 0 1 8 8Z" /><path d="M7 9h10M7 13h7" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
    profile: <><circle cx="12" cy="7" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>,
  }
  return <svg className="sidebar-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function ExpertCourseMenu() {
  const { pathname } = useLocation()
  const inCourses = pathname === '/expert/courses' || pathname.startsWith('/expert/courses/')
  const [expanded, setExpanded] = useState(inCourses)
  useEffect(() => { if (inCourses) setExpanded(true) }, [pathname, inCourses])
  return <div className="expert-course-menu">
    <button className={inCourses ? 'expert-course-menu-toggle active' : 'expert-course-menu-toggle'} aria-expanded={expanded} aria-controls="expert-course-submenu" onClick={() => setExpanded(value => !value)}>
      <span className="sidebar-item-label"><SidebarIcon name="courses" />Quản lý khóa học</span><span aria-hidden="true">{expanded ? '⌃' : '⌄'}</span>
    </button>
    <nav id="expert-course-submenu" className="expert-course-submenu" aria-label="Quản lý khóa học" hidden={!expanded}>
      <SideLink to="/expert/courses/new" end><SidebarIcon name="create" />Tạo khóa học</SideLink>
      <Link className={inCourses && pathname !== '/expert/courses/new' ? 'side-link active' : 'side-link'} to="/expert/courses" aria-current={inCourses && pathname !== '/expert/courses/new' ? 'page' : undefined}><SidebarIcon name="list" />Danh sách khóa học</Link>
    </nav>
  </div>
}

export function ExpertLayout() {
  return <AppFrame><p className="side-label">GIẢNG DẠY</p><ExpertCourseMenu /><SideLink to="/expert/discussions"><SidebarIcon name="discussion" />Hỏi đáp bài học</SideLink><p className="side-label">TÀI KHOẢN</p><SideLink to="/chat"><SidebarIcon name="chat" />Trò chuyện</SideLink><SideLink to="/notifications"><SidebarIcon name="bell" />Thông báo</SideLink><SideLink to="/profile"><SidebarIcon name="profile" />Hồ sơ cá nhân</SideLink></AppFrame>
}

export function DashboardLayout() {
  const { user } = useAuth()
  const admin = Boolean(user?.roles.includes('ROLE_ADMIN'))
  return <AppFrame admin={admin}>
    <SideLink to={admin ? '/admin/certificates' : '/manager/certificates'}><SidebarIcon name="certificate" />Chứng nhận</SideLink><SideLink to={admin ? '/admin/discussions' : '/manager/discussions'}><SidebarIcon name="discussion" />Hỏi đáp bài học</SideLink><SideLink to={admin ? '/admin/courses/archived' : '/manager/courses/archived'}><SidebarIcon name="courses" />Trạng thái khóa học</SideLink>
    {admin ? <><p className="side-label">TỔNG QUAN HỆ THỐNG</p><SideLink to="/dashboard"><SidebarIcon name="dashboard" />Bảng điều khiển</SideLink><SideLink to="/admin/registrations"><SidebarIcon name="registration" />Quản lý Đăng ký</SideLink><SideLink to="/admin/transactions"><SidebarIcon name="wallet" />Giao dịch & Dòng tiền</SideLink><SideLink to="/admin/reports"><SidebarIcon name="report" />Báo cáo & Xuất dữ liệu</SideLink><p className="side-label">QUẢN TRỊ NGƯỜI DÙNG</p><SideLink to="/admin/accounts"><SidebarIcon name="users" />Tài khoản & Phân quyền</SideLink></>
      : <><p className="side-label">QUẢN LÝ</p><SideLink to="/manager/courses/review"><SidebarIcon name="review" />Duyệt khóa học</SideLink><SideLink to="/manager/registrations"><SidebarIcon name="registration" />Quản lý Đăng ký</SideLink><SideLink to="/manager/transactions"><SidebarIcon name="wallet" />Giao dịch & Dòng tiền</SideLink><SideLink to="/manager/posts"><SidebarIcon name="post" />Quản lý bài viết</SideLink></>}
    {!admin && <SideLink to="/manager/courses/review/quizzes"><SidebarIcon name="quiz" />Xem trước bài kiểm tra</SideLink>}
    <p className="side-label">TÀI KHOẢN</p><SideLink to="/chat"><SidebarIcon name="chat" />Trò chuyện</SideLink><SideLink to="/notifications"><SidebarIcon name="bell" />Thông báo</SideLink><SideLink to="/profile"><SidebarIcon name="profile" />Hồ sơ cá nhân</SideLink>
  </AppFrame>
}

export function ProfileLayout() {
  const { user } = useAuth()
  if (user?.roles.includes('ROLE_STUDENT')) return <StudentLayout />
  if (user?.roles.includes('ROLE_EXPERT')) return <ExpertLayout />
  return <DashboardLayout />
}
