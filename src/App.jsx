import React, { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import './App.css'

const AuthPage    = lazy(() => import('./pages/AuthPage'))
const Dashboard   = lazy(() => import('./pages/Dashboard'))
const RoomPage    = lazy(() => import('./pages/RoomPage'))
const AdminPage   = lazy(() => import('./pages/AdminPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

const Spinner = () => (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-9 h-9 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
)

function AppRoutes() {
    const { user } = useAuth()

    return (
        <Routes>
            <Route path="/" element={
                user
                    ? (user.role === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />)
                    : <Dashboard />
            } />
            <Route path="/dashboard/*" element={
                user
                    ? (user.role === 'admin' ? <Navigate to="/admin" replace /> : <Dashboard />)
                    : <Navigate to="/login" replace />
            } />
            <Route path="/login"    element={!user ? <AuthPage /> : <Navigate to="/" replace />} />
            <Route path="/register" element={!user ? <AuthPage /> : <Navigate to="/" replace />} />
            <Route path="/room/:id" element={
                user && user.role !== 'admin' ? <RoomPage /> : <Navigate to="/" replace />
            } />
            <Route path="/admin" element={
                user?.role === 'admin' ? <AdminPage /> : <Navigate to="/" replace />
            } />
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    )
}

function App() {
    return (
        <Router>
            <div className="App">
                <Suspense fallback={<Spinner />}>
                    <AppRoutes />
                </Suspense>
            </div>
        </Router>
    )
}

export default App
