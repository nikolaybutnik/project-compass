import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { HomePage } from '@/features/home/pages/HomePage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { ProjectsPage } from '@/features/projects/pages/ProjectsPage'
import { AppLayout } from '@/shared/layouts/AppLayout'
import { AuthLayout } from '@/shared/layouts/AuthLayout'
import { useAuth } from '@/shared/hooks/useAuth'

const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  // PROJECTS: '/projects',
  PROJECT: '/projects/:projectId',
}

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return null // or return a loading spinner component
  }

  return (
    <Routes>
      {/* Public and authenticated pages with full header */}
      <Route element={<AppLayout />}>
        <Route
          path={ROUTES.HOME}
          element={
            user ? <Navigate to={ROUTES.PROJECT} replace /> : <HomePage />
          }
        />
        <Route
          path={ROUTES.PROJECT}
          element={
            user ? <ProjectsPage /> : <Navigate to={ROUTES.LOGIN} replace />
          }
        />
      </Route>

      {/* Auth pages with minimal branding */}
      <Route element={<AuthLayout />}>
        <Route
          path={ROUTES.LOGIN}
          element={
            user ? <Navigate to={ROUTES.PROJECT} replace /> : <LoginPage />
          }
        />
      </Route>

      {/* Catch-all */}
      <Route path='*' element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  )
}

export default AppRoutes
