import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Layout, ProtectedRoute } from './components/layout'
import { PageWrapper } from './components/layout/PageWrapper'
import { Dashboard, Wiki, Resources, Onboarding, ProgressFormPage, RoleSelection, LeaveFormPage, LeaveStatusPage, AdminPage } from './pages'
import NotFoundPage from './pages/NotFoundPage'

import './styles/variables.css'
import './styles/components.css'
import './styles/layout.css'
import './styles/wiki.css'
import './styles/dashboard.css'
import './styles/admin.css'
import './styles/App.css'

function AnimatedRoutes() {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                {/* Public Routes */}
                <Route path="/role-selection" element={
                    <PageWrapper>
                        <RoleSelection />
                    </PageWrapper>
                } />
                <Route path="/admin" element={
                    <PageWrapper>
                        <Layout />
                    </PageWrapper>
                }>
                    <Route index element={<AdminPage />} />
                </Route>

                {/* Protected Routes (All roles) */}
                <Route element={<ProtectedRoute />}>
                    <Route element={<Layout />}>
                        <Route path="/" element={
                            <PageWrapper>
                                <Dashboard />
                            </PageWrapper>
                        } />
                        <Route path="/progress" element={
                            <PageWrapper>
                                <ProgressFormPage />
                            </PageWrapper>
                        } />
                        <Route path="/leave" element={
                            <PageWrapper>
                                <LeaveFormPage />
                            </PageWrapper>
                        } />
                        <Route path="/leave-status" element={
                            <PageWrapper>
                                <LeaveStatusPage />
                            </PageWrapper>
                        } />

                        {/* More Restricted Routes (Video Editor only) */}
                        <Route element={<ProtectedRoute allowedRoles={['video_editor']} />}>
                            <Route path="/wiki" element={
                                <PageWrapper>
                                    <Wiki />
                                </PageWrapper>
                            } />
                            <Route path="/resources" element={
                                <PageWrapper>
                                    <Resources />
                                </PageWrapper>
                            } />
                            <Route path="/onboarding" element={
                                <PageWrapper>
                                    <Onboarding />
                                </PageWrapper>
                            } />
                        </Route>
                    </Route>
                </Route>

                {/* Fallback */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </AnimatePresence>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AnimatedRoutes />
        </BrowserRouter>
    )
}

export default App
