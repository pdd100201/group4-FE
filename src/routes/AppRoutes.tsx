import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import { DashboardLayout, ExpertLayout, PublicLayout, StudentLayout } from '../components/layout/Layouts'
import { HomePage } from '../features/public/HomePage'
import { CourseDetailPage } from '../features/public/CourseDetailPage'
import { CourseCatalogPage } from '../features/public/CourseCatalogPage'
import { LoginPage } from '../features/auth/LoginPage'
import { ResetPasswordPage } from '../features/auth/ResetPasswordPage'
import { ForgotPasswordPage } from '../features/auth/ForgotPasswordPage'
import { RegisterPage } from '../features/auth/RegisterPage'
import { VerifyEmailPage } from '../features/auth/VerifyEmailPage'
import { DashboardPage } from '../features/management/DashboardPage'
import { PlaceholderPage } from '../features/shared/PlaceholderPage'

export function AppRoutes() {
  return <Routes>
    <Route element={<PublicLayout />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/courses" element={<CourseCatalogPage />} />
      <Route path="/courses/:courseId" element={<CourseDetailPage />} />
      <Route path="/blog" element={<PlaceholderPage title="Bài viết" />} />
      <Route path="/blog/:postId" element={<PlaceholderPage title="Chi tiết bài viết" />} />
    </Route>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/verify-email" element={<VerifyEmailPage />} />
    <Route element={<ProtectedRoute roles={['ROLE_STUDENT']} />}>
      <Route element={<StudentLayout />}>
        <Route path="/student/courses" element={<PlaceholderPage title="Khóa học của tôi" />} />
        <Route path="/student/courses/:courseId/lessons/:lessonId" element={<PlaceholderPage title="Bài học" />} />
        <Route path="/student/registrations" element={<PlaceholderPage title="Đăng ký của tôi" />} />
        <Route path="/student/quizzes/:quizId" element={<PlaceholderPage title="Bài kiểm tra" />} />
        <Route path="/student/quiz-attempts/:attemptId" element={<PlaceholderPage title="Kết quả kiểm tra" />} />
      </Route>
    </Route>
    <Route element={<ProtectedRoute roles={['ROLE_EXPERT']} />}>
      <Route element={<ExpertLayout />}>
        <Route path="/expert/courses" element={<PlaceholderPage title="Quản lý khóa học" />} />
        <Route path="/expert/courses/:courseId" element={<PlaceholderPage title="Chỉnh sửa khóa học" />} />
        <Route path="/expert/questions" element={<PlaceholderPage title="Ngân hàng câu hỏi" />} />
        <Route path="/expert/quizzes" element={<PlaceholderPage title="Quản lý bài kiểm tra" />} />
      </Route>
    </Route>
    <Route element={<ProtectedRoute roles={['ROLE_ADMIN']} />}>
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/admin/registrations" element={<PlaceholderPage title="Danh sách đăng ký" />} />
        <Route path="/admin/transactions" element={<PlaceholderPage title="Giao dịch" />} />
        <Route path="/admin/reports" element={<PlaceholderPage title="Báo cáo" />} />
        <Route path="/admin/accounts" element={<PlaceholderPage title="Quản lý tài khoản" />} />
      </Route>
    </Route>
    <Route element={<ProtectedRoute roles={['ROLE_MANAGER']} />}>
      <Route element={<DashboardLayout />}>
        <Route path="/manager/courses/review" element={<PlaceholderPage title="Duyệt khóa học" />} />
        <Route path="/manager/registrations" element={<PlaceholderPage title="Danh sách đăng ký" />} />
        <Route path="/manager/transactions" element={<PlaceholderPage title="Giao dịch" />} />
        <Route path="/manager/posts" element={<PlaceholderPage title="Quản lý bài viết" />} />
      </Route>
    </Route>
    <Route path="/forbidden" element={<PlaceholderPage title="Bạn không có quyền truy cập" />} />
    <Route path="*" element={<PlaceholderPage title="Không tìm thấy trang" />} />
  </Routes>
}
