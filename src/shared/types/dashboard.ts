export interface DashboardRegistration {
  id: number; studentName: string; studentEmail: string; courseTitle: string
  packageName: string | null; amount: number | null; status: string | null; createdAt: string | null
}
export interface DashboardCourseMetric { courseId: number; courseTitle: string; registrations: number }
export interface DashboardData {
  totalRevenue: number; totalRegistrations: number; activeStudents: number
  activeCourses: number; pendingCourses: number
  recentRegistrations: DashboardRegistration[]; topCourses: DashboardCourseMetric[]
}
