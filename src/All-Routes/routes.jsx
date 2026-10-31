import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../Layouts/mainLayout';
import Dashboard from '../pages/Admin/dashboard';
import Attendees from '../pages/Admin/Attendees';
import AttendeeDetail from '../pages/Admin/Attendees/AttendeeDetail';
import Events from '../pages/Admin/Events';
import EventDetail from '../pages/Admin/eventDetail';
import AllUsers from '../pages/Admin/allUsers';
import RolesAndPermissions from '../pages/Admin/rolesAndPermissions';
import Login from '../pages/auth/login';
import CheckinScan from '../Components/CheckinScan';
import ActivatePass from '../pages/public/ActivatePass';

// Route guard to protect admin routes
const ProtectedRoute = ({ children }) => {
  const token = sessionStorage.getItem('accessToken');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Attendee Activation Endpoints */}
        <Route path="/activate/:token" element={<ActivatePass />} />
        <Route path="/activate" element={<ActivatePass />} />
        <Route path="/pass/scan/:token" element={<ActivatePass />} />
        <Route path="/pass/scan" element={<ActivatePass />} />
        <Route path="/student-fill-form" element={<ActivatePass />} />

        {/* Authentication Endpoints */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Login />} />

        {/* Protected Admin & Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/events"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Events />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/events/:eventId"
          element={
            <ProtectedRoute>
              <MainLayout>
                <EventDetail />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/attendees"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Attendees />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/attendees/:id"
          element={
            <ProtectedRoute>
              <MainLayout>
                <AttendeeDetail />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <MainLayout>
                <AllUsers />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/roles"
          element={
            <ProtectedRoute>
              <MainLayout>
                <RolesAndPermissions />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Gatekeeper Checkin Scanner Routes */}
        <Route
          path="/admin/checkin"
          element={
            <ProtectedRoute>
              <CheckinScan />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/checkin/:eventId"
          element={
            <ProtectedRoute>
              <CheckinScan />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
