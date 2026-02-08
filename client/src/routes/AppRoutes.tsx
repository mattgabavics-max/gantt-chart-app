/**
 * App Routes
 * Main routing configuration for the application
 */

import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '../contexts/AuthContext'
import { SharedProjectView } from '../components/Share'

// ==================== Page Components (Placeholders) ====================

// Auth Pages
const LoginPage: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
      <h1 className="text-2xl font-bold mb-6">Login</h1>
      <p className="text-gray-600">Login page implementation goes here</p>
    </div>
  </div>
)

const RegisterPage: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
      <h1 className="text-2xl font-bold mb-6">Register</h1>
      <p className="text-gray-600">Registration page implementation goes here</p>
    </div>
  </div>
)

// Main App Pages
const DashboardPage: React.FC = () => (
  <div className="min-h-screen bg-gray-50 p-8">
    <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
    <p className="text-gray-600">Dashboard implementation goes here</p>
  </div>
)

const ProjectsPage: React.FC = () => (
  <div className="min-h-screen bg-gray-50 p-8">
    <h1 className="text-3xl font-bold mb-6">My Projects</h1>
    <p className="text-gray-600">Projects list implementation goes here</p>
  </div>
)

const ProjectDetailPage: React.FC = () => (
  <div className="min-h-screen bg-gray-50 p-8">
    <h1 className="text-3xl font-bold mb-6">Project Details</h1>
    <p className="text-gray-600">Project detail page with Gantt chart goes here</p>
  </div>
)

const NotFoundPage: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-8">Page not found</p>
      <a
        href="/"
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Go Home
      </a>
    </div>
  </div>
)

// ==================== App Routes Component ====================

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <ProtectedRoute requireAuth={false} redirectTo="/dashboard">
            <LoginPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/register"
        element={
          <ProtectedRoute requireAuth={false} redirectTo="/dashboard">
            <RegisterPage />
          </ProtectedRoute>
        }
      />

      {/* Shared Project Route - No authentication required */}
      <Route path="/share/:token" element={<SharedProjectView />} />

      {/* Protected Routes - Require authentication */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <ProjectsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectId"
        element={
          <ProtectedRoute>
            <ProjectDetailPage />
          </ProtectedRoute>
        }
      />

      {/* Redirect root to dashboard or login */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* 404 Not Found */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRoutes
