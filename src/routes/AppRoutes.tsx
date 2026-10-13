import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../shared/components/auth/ProtectedRoute'
import { DashboardLayout, ExpertLayout, ProfileLayout, PublicLayout, StudentLayout } from '../shared/components/layout/Layouts'
import { HomePage } from '../features/home/screens/HomePage'
import { BlogListPage } from '../features/blog/screens/BlogListPage'
import { BlogDetailPage } from '../features/blog/screens/BlogDetailPage'
import { CourseDetailPage } from '../features/courses/screens/CourseDetailPage'
import { CourseCatalogPage } from '../features/courses/screens/CourseCatalogPage'
import { LoginPage } from '../features/auth/screens/LoginPage'
import { ResetPasswordPage } from '../features/auth/screens/ResetPasswordPage'
import { ForgotPasswordPage } from '../features/auth/screens/ForgotPasswordPage'
import { RegisterPage } from '../features/auth/screens/RegisterPage'
import { VerifyEmailPage } from '../features/auth/screens/VerifyEmailPage'
import { DashboardPage } from '../features/dashboard/screens/DashboardPage'
import { ManagementRecordsPage, ManagementRecordDetailPage } from '../features/management/screens/ManagementRecordsPage'
import { ExpertCoursesPage } from '../features/expert/screens/ExpertCoursesPage'
import { CourseEditorPage } from '../features/expert/screens/CourseEditorPage'
import { CourseReviewPage } from '../features/management/screens/CourseReviewPage'
import { CourseReviewDetailPage } from '../features/management/screens/CourseReviewDetailPage'
import { ArchivedCoursesPage } from '../features/management/screens/ArchivedCoursesPage'
import { CourseRegistrationPage } from '../features/registrations/screens/CourseRegistrationPage'
import { StudentRegistrationsPage, StudentRegistrationDetailPage } from '../features/registrations/screens/StudentRegistrationsPage'
import { PlaceholderPage } from '../shared/components/ui/PlaceholderPage'
import { ReportsPage } from '../features/reports/screens/ReportsPage'
import { PaymentPage, PaymentResultPage } from '../features/payment/screens/PaymentPage'
import { StudentCoursesPage } from '../features/courses/screens/StudentCoursesPage'
import { AccountsPage } from '../features/accounts/screens/AccountsPage'
import { AccountEditorPage } from '../features/accounts/screens/AccountEditorPage'
import { ProfilePage } from '../features/profile/screens/ProfilePage'
import { ExpertQuizPage } from '../features/quiz/ExpertQuizPage'
import { QuizEditorPage } from '../features/quiz/QuizEditorPage'
import { ManagerQuizPreviewPage } from '../features/quiz/ManagerQuizPreviewPage'
import { QuestionBankPage } from '../features/questions/screens/QuestionBankPage'

export function AppRoutes() {
  return <Routes>
    <Route element={<PublicLayout />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/courses" element={<CourseCatalogPage />} />
      <Route path="/courses/:courseId" element={<CourseDetailPage />} />
      <Route element={<ProtectedRoute roles={['ROLE_STUDENT']} />}>
        <Route path="/student/courses/:courseId/register" element={<CourseRegistrationPage />} />
        <Route path="/student/registrations/:id/payment" element={<PaymentPage />} />
        <Route path="/payment/result" element={<PaymentResultPage />} />
      </Route>
      <Route path="/blog" element={<BlogListPage />} />
      <Route path="/blog/:postId" element={<BlogDetailPage />} />
    </Route>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/verify-email" element={<VerifyEmailPage />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<ProfileLayout />}><Route path="/profile" element={<ProfilePage />} /></Route>
    </Route>
    <Route element={<ProtectedRoute roles={['ROLE_STUDENT']} />}>
      <Route element={<StudentLayout />}>
        <Route path="/student/courses" element={<StudentCoursesPage />} />
        <Route path="/student/courses/:courseId/lessons/:lessonId" element={<PlaceholderPage title="Bài học" />} />
        <Route path="/student/registrations" element={<StudentRegistrationsPage />} />
        <Route path="/student/registrations/:id" element={<StudentRegistrationDetailPage />} />
        <Route path="/student/quizzes/:quizId" element={<PlaceholderPage title="Bài kiểm tra" />} />
        <Route path="/student/quiz-attempts/:attemptId" element={<PlaceholderPage title="Kết quả kiểm tra" />} />
      </Route>
    </Route>
    <Route element={<ProtectedRoute roles={['ROLE_EXPERT']} />}>
      <Route element={<ExpertLayout />}>
        <Route path="/expert/courses" element={<ExpertCoursesPage />} />
        <Route path="/expert/courses/new" element={<CourseEditorPage />} />
        <Route path="/expert/courses/:courseId" element={<CourseEditorPage />} />
        <Route path="/expert/questions" element={<QuestionBankPage />} />
        <Route path="/expert/courses/:courseId/questions" element={<QuestionBankPage />} />
        <Route path="/expert/quizzes" element={<ExpertQuizPage />} />
        <Route path="/expert/courses/:courseId/quizzes" element={<ExpertQuizPage />} />
        <Route path="/expert/courses/:courseId/quizzes/new" element={<QuizEditorPage />} />
        <Route path="/expert/courses/:courseId/quizzes/:quizId" element={<QuizEditorPage readOnly />} />
        <Route path="/expert/courses/:courseId/quizzes/:quizId/edit" element={<QuizEditorPage />} />
      </Route>
    </Route>
    <Route element={<ProtectedRoute roles={['ROLE_ADMIN']} />}>
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/admin/courses/archived" element={<ArchivedCoursesPage role="admin" />} />
        <Route path="/admin/registrations" element={<ManagementRecordsPage kind="registrations" />} />
        <Route path="/admin/registrations/:id" element={<ManagementRecordDetailPage kind="registrations" />} />
        <Route path="/admin/transactions" element={<ManagementRecordsPage kind="transactions" />} />
        <Route path="/admin/transactions/:id" element={<ManagementRecordDetailPage kind="transactions" />} />
        <Route path="/admin/reports" element={<ReportsPage />} />
        <Route path="/admin/accounts" element={<AccountsPage />} />
        <Route path="/admin/accounts/new" element={<AccountEditorPage create />} />
        <Route path="/admin/accounts/:id" element={<AccountEditorPage />} />
      </Route>
    </Route>
    <Route element={<ProtectedRoute roles={['ROLE_MANAGER']} />}>
      <Route element={<DashboardLayout />}>
        <Route path="/manager/courses/review" element={<CourseReviewPage />} />
        <Route path="/manager/courses/archived" element={<ArchivedCoursesPage role="manager" />} />
        <Route path="/manager/courses/:courseId/review" element={<CourseReviewDetailPage />} />
        <Route path="/manager/registrations" element={<ManagementRecordsPage kind="registrations" />} />
        <Route path="/manager/registrations/:id" element={<ManagementRecordDetailPage kind="registrations" />} />
        <Route path="/manager/transactions" element={<ManagementRecordsPage kind="transactions" />} />
        <Route path="/manager/transactions/:id" element={<ManagementRecordDetailPage kind="transactions" />} />
        <Route path="/manager/courses/review/quizzes" element={<ManagerQuizPreviewPage />} />
        <Route path="/manager/courses/:courseId/review/quizzes" element={<ManagerQuizPreviewPage />} />
        <Route path="/manager/posts" element={<PlaceholderPage title="Quản lý bài viết" />} />
      </Route>
    </Route>
    <Route path="/forbidden" element={<PlaceholderPage title="Bạn không có quyền truy cập" />} />
    <Route path="*" element={<PlaceholderPage title="Không tìm thấy trang" />} />
  </Routes>
}
