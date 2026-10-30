import React from 'react'
import { 
  Bell, 
  Search, 
  User, 
  Menu,
  Sun,
  Moon
} from 'lucide-react'

const Navbar = ({ onMenuClick }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 z-20 sticky top-0">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Menu button and Search */}
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>

            <h1 className="text-xl font-bold text-gray-900">Event Management System</h1>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Search button for mobile */}
            {/* <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors sm:hidden">
              <Search className="w-5 h-5 text-gray-700" />
            </button> */}

            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Bell className="w-5 h-5 text-blue-500" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Theme Toggle */}
            {/* <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Sun className="w-5 h-5 text-yellow-500" />
            </button> */}

            {/* User Profile */}
            <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-gray-200">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-gray-900">Admin User</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
