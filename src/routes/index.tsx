import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { HomePage } from '@/pages/Home/HomePage'
import { LoginPage } from '@/pages/Auth/LoginPage'
import { ProjectsPage } from '@/pages/Projects/ProjectsPage'
import { useAuth } from '@/hooks/useAuth'

const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  PROJECTS: '/projects',
  PROJECT_DETAIL: '/projects/:projectId',
}

const AppRoutes: React.FC = () => {
  const { user, authLoading } = useAuth()

  if (authLoading) {
    return null // or return a loading spinner component
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path={ROUTES.HOME}
        element={
          user ? <Navigate to={ROUTES.PROJECTS} replace /> : <HomePage />
        }
      />

      {/* Auth routes */}
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />

      {/* Private/Protected routes */}
      <Route
        path={ROUTES.PROJECT_DETAIL}
        element={
          user ? <ProjectsPage /> : <Navigate to={ROUTES.LOGIN} replace />
        }
      />

      {/* Catch-all route for 404s */}
      <Route path='*' element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  )
}

export default AppRoutes
