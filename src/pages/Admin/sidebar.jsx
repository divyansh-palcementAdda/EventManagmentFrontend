import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Calendar,
  Shield,
  LogOut,
  X
} from 'lucide-react'

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeItem, setActiveItem] = useState('dashboard')

  useEffect(() => {
    const routeToItemMap = {
      '/dashboard': 'dashboard',
      '/admin': 'dashboard',
      '/admin/attendees': 'attendees',
      '/admin/events': 'events',
      '/admin/users': 'users',
      '/admin/roles': 'roles'
    }
    const currentRoute = location.pathname
    setActiveItem(routeToItemMap[currentRoute] || 'dashboard')
  }, [location.pathname])

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: '#6366f1', route: '/dashboard' },
    { id: 'attendees', label: 'Attendees', icon: Users, color: '#3b82f6', route: '/admin/attendees' },
    { id: 'events', label: 'Events', icon: Calendar, color: '#10b981', route: '/admin/events' },
    { id: 'users', label: 'Users', icon: Users, color: '#7c3aed', route: '/admin/users' },
    { id: 'roles', label: 'Roles & Permissions', icon: Shield, color: '#f59e0b', route: '/admin/roles' },
  ]

  const handleItemClick = (item) => {
    setActiveItem(item.id)
    navigate(item.route)
    if (onClose) onClose()
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile Sidebar - Fixed, only visible when open */}
      {isOpen && (
        <aside
          className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out translate-x-0"
        >
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-900">Event Management</h1>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 overflow-y-auto">
              <ul className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => handleItemClick(item)}
                        className={`
                          w-full flex items-center gap-3 px-4 py-3 rounded-lg
                          transition-all duration-200
                          ${activeItem === item.id
                            ? 'bg-purple-50 text-purple-700 shadow-sm'
                            : 'text-gray-700 hover:bg-gray-100'
                          }
                        `}
                      >
                        <Icon
                          className="w-5 h-5"
                          style={{ color: activeItem === item.id ? item.color : item.color }}
                        />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200">
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200">
                <LogOut className="w-5 h-5 text-red-500" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Desktop Sidebar - Fixed, always visible on large screens */}
      <aside className="hidden lg:flex lg:flex-col fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 z-30">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Event Management</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleItemClick(item)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-lg
                      transition-all duration-200
                      ${activeItem === item.id
                        ? 'bg-purple-50 text-purple-700 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{ color: activeItem === item.id ? item.color : item.color }}
                    />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200">
            <LogOut className="w-5 h-5 text-red-500" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
