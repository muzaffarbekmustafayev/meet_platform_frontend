import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import RoomPage from './pages/RoomPage'
import AdminPage from './pages/AdminPage'
import './App.css'

function App() {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={
            userInfo 
              ? (userInfo.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/dashboard" />) 
              : <Dashboard />
          } />
          <Route path="/dashboard/*" element={
            userInfo 
              ? (userInfo.role === 'admin' ? <Navigate to="/admin" /> : <Dashboard />)
              : <Navigate to="/login" />
          } />
          <Route path="/login" element={!userInfo ? <AuthPage /> : <Navigate to="/" />} />
          <Route path="/register" element={!userInfo ? <AuthPage /> : <Navigate to="/" />} />
          <Route path="/room/:id" element={userInfo && userInfo.role !== 'admin' ? <RoomPage /> : <Navigate to="/" />} />
          <Route path="/admin" element={userInfo?.role === 'admin' ? <AdminPage /> : <Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
