import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { HomePage } from '@/features/home/pages/HomePage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { ProjectsPage } from '@/features/projects/pages/ProjectsPage'
import { AppLayout } from '@/shared/layouts/AppLayout'
import { AuthLayout } from '@/shared/layouts/AuthLayout'
import { useAuth } from '@/shared/hooks/useAuth'

const AppRoutes: React.FC = () => {
  const { user, authLoading } = useAuth()

  if (authLoading) {
    return null // or return a loading spinner component
  }

  return (
    <Routes>
      {/* Public and authenticated pages with full header */}
      <Route element={<AppLayout />}>
        <Route
          path='/'
          element={user ? <Navigate to='/projects' replace /> : <HomePage />}
        />
        <Route
          path='/projects/:projectId'
          element={user ? <ProjectsPage /> : <Navigate to='/login' replace />}
        />
      </Route>

      {/* Auth pages with minimal branding */}
      <Route element={<AuthLayout />}>
        <Route path='/login' element={<LoginPage />} />
      </Route>

      {/* Catch-all */}
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  )
}

export default AppRoutes
