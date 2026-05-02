import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import Dashboard from './pages/Dashboard'
import RoomPage from './pages/RoomPage'
import './App.css'

function App() {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={userInfo ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/login" element={!userInfo ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/register" element={!userInfo ? <RegisterPage /> : <Navigate to="/" />} />
          <Route path="/room/:id" element={userInfo ? <RoomPage /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
