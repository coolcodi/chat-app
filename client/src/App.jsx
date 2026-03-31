import React, { useContext } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import pages from './pages'
import {Toaster} from "react-hot-toast"
import { AuthContext } from '../context/AuthContext'

function App() {
  const {authUser} =useContext(AuthContext)
  return (
    <div className="w-full min-h-screen bg-[url('/src/assets/bgImage.svg')]  bg-cover bg-center bg-no-repeat ">
      <Toaster/>
  <Routes>
    
    <Route path="/" element={authUser ?<pages.HomePage />: <Navigate to="/login"/> }/>
    <Route path="/login" element={!authUser ?<pages.LoginPage />:<Navigate to="/"/> } />
    <Route path="/profile" element={authUser ? <pages.ProfilePage /> : <Navigate to="/login"/>} />
  </Routes>
</div>


  )
}

export default App