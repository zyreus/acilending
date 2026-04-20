import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import App from './App.jsx'
import ContactPage from './pages/ContactPage.jsx'
import LoanProductsPage from './pages/LoanProductsPage.jsx'
import FeaturesPage from './pages/FeaturesPage.jsx'
import BranchesPage from './pages/BranchesPage.jsx'
import ApplyPage from './pages/ApplyPage.jsx'
import ChattelMortgagePage from './pages/ChattelMortgagePage.jsx'
import RealEstateMortgagePage from './pages/RealEstateMortgagePage.jsx'
import SalaryLoanPage from './pages/SalaryLoanPage.jsx'
import TravelAssistanceLoanPage from './pages/TravelAssistanceLoanPage.jsx'
import SssPensionLoanPage from './pages/SssPensionLoanPage.jsx'
import ApplicationFormLayout from './pages/ApplicationFormLayout.jsx'
import DocumentLoanApplyPage from './pages/DocumentLoanApplyPage.jsx'
import DocumentLoanApplicationsPage from './admin/pages/DocumentLoanApplicationsPage.jsx'
import DocumentLoanApplicationDetailPage from './admin/pages/DocumentLoanApplicationDetailPage.jsx'
import SplashScreen from './components/SplashScreen.jsx'
import { AdminApiAuthProvider } from './admin/context/AdminApiAuthProvider.jsx'
import { ToastProvider } from './admin/context/ToastContext.jsx'
import ProtectedAdminRoute from './admin/ProtectedAdminRoute.jsx'
import AdminLayout from './admin/AdminLayout.jsx'
import { AdminMuiProvider } from './admin/theme/AdminMuiProvider.jsx'
import DashboardPage from './admin/pages/DashboardPage.jsx'
import UsersPage from './admin/pages/UsersPage.jsx'
import RolesPage from './admin/pages/RolesPage.jsx'
import LoansPage from './admin/pages/LoansPage.jsx'
import AdminNewLoanPage from './admin/pages/AdminNewLoanPage.jsx'
import LoanDetailPage from './admin/pages/LoanDetailPage.jsx'
import TravelLoanApplicationsPage from './admin/pages/TravelLoanApplicationsPage.jsx'
import PaymentsPage from './admin/pages/PaymentsPage.jsx'
import SettingsPage from './admin/pages/SettingsPage.jsx'
import ActivityPage from './admin/pages/ActivityPage.jsx'
import NotificationsPage from './admin/pages/NotificationsPage.jsx'
import BorrowersPage from './admin/pages/BorrowersPage.jsx'
import BorrowerDetailPage from './admin/pages/BorrowerDetailPage.jsx'
import ReportsPage from './admin/pages/ReportsPage.jsx'
import AdminChatCRM from './admin/pages/AdminChatCRM.jsx'
import NewsletterPage from './admin/pages/NewsletterPage.jsx'
import LendingChatWidget from './components/LendingChatWidget.jsx'
import UnauthorizedPage from './pages/UnauthorizedPage.jsx'
import { BorrowerAuthProvider } from './borrower/context/BorrowerAuthProvider.jsx'
import BorrowerProtectedRoute from './borrower/BorrowerProtectedRoute.jsx'
import BorrowerLayout from './borrower/BorrowerLayout.jsx'
import BorrowerLoginPage from './borrower/pages/BorrowerLoginPage.jsx'
import BorrowerForgotPasswordPage from './borrower/pages/BorrowerForgotPasswordPage.jsx'
import BorrowerDashboardPage from './borrower/pages/BorrowerDashboardPage.jsx'
import BorrowerPaymentsPage from './borrower/pages/BorrowerPaymentsPage.jsx'
import BorrowerChatPage from './borrower/pages/BorrowerChatPage.jsx'
import BorrowerSecurityPage from './borrower/pages/BorrowerSecurityPage.jsx'
import BorrowerProfilePage from './borrower/pages/BorrowerProfilePage.jsx'
import BorrowerLoanWizardPage from './borrower/pages/BorrowerLoanWizardPage.jsx'
import BorrowerNotificationsPage from './borrower/pages/BorrowerNotificationsPage.jsx'
import BorrowerApplicationsPage from './borrower/pages/BorrowerApplicationsPage.jsx'
import AdminLoginPage from './admin/pages/AdminLoginPage.jsx'
import AdminForgotPasswordPage from './admin/pages/AdminForgotPasswordPage.jsx'
import AdminLoanProductsPage from './admin/pages/AdminLoanProductsPage.jsx'
import ResetPasswordPage from './pages/ResetPasswordPage.jsx'

/** Visitor site chat — hidden in admin and borrower portal (borrower has /borrower/chat). */
function LendingChatWidgetGate() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/admin') || pathname.startsWith('/borrower')) return null
  // Production build without VITE_CHAT_SERVER_URL would otherwise use `window.location.origin` for Socket.IO,
  // but the marketing site is static HTML — no `/socket.io` server → endless failed WebSocket retries.
  const chatConfigured = (import.meta.env.VITE_CHAT_SERVER_URL || '').trim()
  if (import.meta.env.PROD && !chatConfigured) return null
  return <LendingChatWidget />
}

export default function Root() {
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === 'undefined') return true
    const p = window.location.pathname
    if (
      p.startsWith('/admin') ||
      p.startsWith('/borrower') ||
      p === '/login' ||
      p === '/unauthorized' ||
      p === '/reset-password' ||
      p.startsWith('/loans/') ||
      p.startsWith('/apply/documents/') ||
      p.startsWith('/borrower/apply-loan')
    ) {
      return false
    }
    return true
  })

  return (
    <>
      <BrowserRouter>
        <AdminMuiProvider>
          <AdminApiAuthProvider>
            <BorrowerAuthProvider>
              <ToastProvider>
                <Routes>
                <Route path="/admin" element={<Outlet />}>
                <Route path="login" element={<AdminLoginPage />} />
                <Route path="forgot-password" element={<AdminForgotPasswordPage />} />
                <Route element={<ProtectedAdminRoute />}>
                  <Route element={<AdminLayout />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="users" element={<UsersPage />} />
                    <Route path="roles" element={<RolesPage />} />
                    <Route path="borrowers" element={<BorrowersPage />} />
                    <Route path="borrowers/:id" element={<BorrowerDetailPage />} />
                    <Route path="loans" element={<LoansPage />} />
                    <Route path="travel-loans" element={<TravelLoanApplicationsPage />} />
                    <Route path="document-loan-applications" element={<DocumentLoanApplicationsPage />} />
                    <Route path="document-loan-applications/:id" element={<DocumentLoanApplicationDetailPage />} />
                    <Route path="loans/new" element={<AdminNewLoanPage />} />
                    <Route path="loans/:id" element={<LoanDetailPage />} />
                    <Route path="loan-products" element={<AdminLoanProductsPage />} />
                    <Route path="reports" element={<ReportsPage />} />
                    <Route path="leads" element={<Navigate to="/admin/chat-crm?view=leads" replace />} />
                    <Route path="payments" element={<PaymentsPage />} />
                    <Route path="newsletter" element={<NewsletterPage />} />
                    <Route path="cms" element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="activity" element={<ActivityPage />} />
                    <Route path="notifications" element={<NotificationsPage />} />
                    <Route path="chat-crm" element={<AdminChatCRM />} />
                  </Route>
                </Route>
              </Route>
              <Route path="/borrower/login" element={<BorrowerLoginPage />} />
              <Route path="/borrower/forgot-password" element={<BorrowerForgotPasswordPage />} />
              <Route
                path="/borrower"
                element={(
                  <BorrowerProtectedRoute>
                    <BorrowerLayout />
                  </BorrowerProtectedRoute>
                )}
              >
                <Route path="dashboard" element={<BorrowerDashboardPage />} />
                <Route path="applications" element={<BorrowerApplicationsPage />} />
                <Route path="notifications" element={<BorrowerNotificationsPage />} />
                <Route path="payments" element={<BorrowerPaymentsPage />} />
                <Route path="chat" element={<BorrowerChatPage />} />
                <Route path="profile" element={<BorrowerProfilePage />} />
                <Route path="security" element={<BorrowerSecurityPage />} />
                <Route path="apply-loan/:applicationId" element={<BorrowerLoanWizardPage />} />
                <Route path="apply-loan" element={<BorrowerLoanWizardPage />} />
              </Route>
              <Route path="/" element={<App />} />
              <Route path="/products" element={<Navigate to="/loan-products" replace />} />
              <Route path="/loan-products" element={<LoanProductsPage />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/branches" element={<BranchesPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/apply" element={<ApplyPage />} />
              <Route element={<ApplicationFormLayout />}>
                <Route path="/apply/documents/:slug" element={<DocumentLoanApplyPage />} />
                <Route path="/loans/chattel-mortgage" element={<ChattelMortgagePage />} />
                <Route path="/loans/real-estate-mortgage" element={<RealEstateMortgagePage />} />
                <Route path="/loans/salary-loan" element={<SalaryLoanPage />} />
                <Route path="/loans/travel-assistance-loan" element={<TravelAssistanceLoanPage />} />
                <Route path="/loans/sss-pension-loan" element={<SssPensionLoanPage />} />
              </Route>
              <Route path="/login" element={<BorrowerLoginPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
                </Routes>
                <LendingChatWidgetGate />
              </ToastProvider>
            </BorrowerAuthProvider>
          </AdminApiAuthProvider>
        </AdminMuiProvider>
      </BrowserRouter>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
    </>
  )
}
