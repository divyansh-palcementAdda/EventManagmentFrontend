import React from 'react'
import { 
  Users, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  MoreVertical,
  Calendar
} from 'lucide-react'

const Dashboard = () => {
  const stats = [
    {
      title: 'Total Students',
      value: '1,234',
      change: '+12.5%',
      trend: 'up',
      icon: Users,
      color: '#3b82f6',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Active Events',
      value: '45',
      change: '+8.2%',
      trend: 'up',
      icon: Calendar,
      color: '#10b981',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Revenue',
      value: '$45,678',
      change: '+23.1%',
      trend: 'up',
      icon: DollarSign,
      color: '#f59e0b',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Engagement',
      value: '89.2%',
      change: '-2.4%',
      trend: 'down',
      icon: TrendingUp,
      color: '#ef4444',
      bgColor: 'bg-red-50'
    }
  ]

  const recentActivities = [
    { id: 1, action: 'New student registered', user: 'John Doe', time: '2 min ago', color: 'bg-blue-500' },
    { id: 2, action: 'Event created', user: 'Admin', time: '15 min ago', color: 'bg-green-500' },
    { id: 3, action: 'Payment received', user: 'Jane Smith', time: '1 hour ago', color: 'bg-yellow-500' },
    { id: 4, action: 'Event updated', user: 'Admin', time: '2 hours ago', color: 'bg-purple-500' },
    { id: 5, action: 'Student enrolled', user: 'Mike Johnson', time: '3 hours ago', color: 'bg-pink-500' }
  ]

  const upcomingEvents = [
    { id: 1, name: 'Tech Conference 2024', date: 'Nov 15, 2024', attendees: 250, status: 'Active', color: 'bg-purple-500' },
    { id: 2, name: 'Workshop Series', date: 'Nov 20, 2024', attendees: 100, status: 'Upcoming', color: 'bg-blue-500' },
    { id: 3, name: 'Networking Event', date: 'Nov 25, 2024', attendees: 150, status: 'Upcoming', color: 'bg-green-500' }
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div 
              key={stat.title}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  {stat.change}
                </div>
              </div>
              <h3 className="text-gray-600 text-sm mb-1">{stat.title}</h3>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          )
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                View All
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div 
                  key={activity.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-full ${activity.color} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white font-semibold text-sm">
                      {activity.user.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-500">by {activity.user}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Plus className="w-5 h-5 text-purple-600" />
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div 
                  key={event.id}
                  className="p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 text-sm">{event.name}</h3>
                    <button className="p-1 rounded hover:bg-gray-100">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <CalendarIcon className="w-3 h-3" />
                    {event.date}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Users className="w-3 h-3" />
                      {event.attendees} attendees
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      event.status === 'Active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold mb-2">Create New Event</h2>
            <p className="text-purple-100 text-sm">Start organizing your next event in just a few clicks</p>
          </div>
          <button className="px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create Event
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
