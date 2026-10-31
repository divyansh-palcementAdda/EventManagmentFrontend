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
import { PermissionProvider, usePermissions } from '../permissionContext/permissionContext.jsx';

// Route guard to protect admin routes
const ProtectedRoute = ({ children }) => {
  const token = sessionStorage.getItem('accessToken');
  const { initialized, loading } = usePermissions();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Show loading state while permissions are being initialized
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-800 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading permissions...</p>
        </div>
      </div>
    );
  }

  return children;
};

const AppRoutes = () => {
  return (
    <PermissionProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Attendee Activation Endpoints */}
          <Route path="/activate/:token" element={<ActivatePass />} />
          <Route path="/activate" element={<ActivatePass />} />
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
    </PermissionProvider>
  );
};

export default AppRoutes;
