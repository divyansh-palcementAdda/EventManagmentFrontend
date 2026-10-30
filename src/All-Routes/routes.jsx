import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import StudentFillForm from '../pages/students/studentFillForm'
import MainLayout from '../Layouts/mainLayout'
import Dashboard from '../pages/Admin/dashboard'
import Attendees from '../pages/Admin/Attendees'
import Events from '../pages/Admin/Events'
import EventDetail from '../pages/Admin/eventDetail'
import AllUsers from '../pages/Admin/allUsers'
import RolesAndPermissions from '../pages/Admin/rolesAndPermissions'
import Login from '../pages/auth/login'
import CheckinScan from '../Components/CheckinScan'


const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StudentFillForm />} />
        <Route path="/dashboard" element={
          <MainLayout>
            <Dashboard />
          </MainLayout>
        } />
        <Route path="/admin" element={
          <MainLayout>
            <Dashboard />
          </MainLayout>
        } />
        <Route path="/admin/attendees" element={
          <MainLayout>
            <Attendees />
          </MainLayout>
        } />
        <Route path="/admin/events" element={
          <MainLayout>
            <Events />
          </MainLayout>
        } />
        <Route path="/admin/events/:eventId" element={
          <MainLayout>
            <EventDetail />
          </MainLayout>
        } />
        <Route path="/admin/checkin" element={
          
            <CheckinScan />
         
        } />
        <Route path="/admin/checkin/:eventId" element={
         
            <CheckinScan />
        } />
        <Route path="/admin/users" element={
          <MainLayout>
            <AllUsers />
          </MainLayout>
        } />
        <Route path="/admin/roles" element={
          <MainLayout>
            <RolesAndPermissions />
          </MainLayout>
        } />
        <Route path="/login" element={<Login />} />
      </Routes>
      
    </BrowserRouter>
  )
}

export default AppRoutes