import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Calendar,
  Ticket,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  Plus,
  QrCode,
  MapPin,
  Clock,
  Loader2,
} from 'lucide-react';
import eventsService from '../../Api-Services/eventsService';

const Dashboard = () => {
  const navigate = useNavigate();
  const [statsData, setStatsData] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [statsRes, eventsRes] = await Promise.all([
          eventsService.getDashboardStats().catch(() => null),
          eventsService.getEvents(0, 5, ['startsAt,asc']).catch(() => null),
        ]);

        if (statsRes?.data) {
          setStatsData(statsRes.data);
        }
        if (eventsRes?.data?.content) {
          setUpcomingEvents(eventsRes.data.content);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = [
    {
      title: 'Total Events',
      value: statsData?.totalEvents ?? 0,
      subtext: `${statsData?.activeEvents ?? 0} active / ${statsData?.upcomingEvents ?? 0} draft`,
      icon: Calendar,
      color: '#3b82f6',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Passes Generated',
      value: statsData?.totalPassesGenerated ?? 0,
      subtext: 'Across all registered events',
      icon: Ticket,
      color: '#8b5cf6',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Activated Passes',
      value: statsData?.totalPassesActivated ?? 0,
      subtext: `${statsData?.totalAttendees ?? 0} confirmed attendees`,
      icon: Users,
      color: '#10b981',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Check-Ins',
      value: statsData?.totalCheckIns ?? 0,
      subtext: 'Verified gate entries',
      icon: CheckCircle2,
      color: '#f59e0b',
      bgColor: 'bg-amber-50',
    },
  ];

  const formatDate = (iso) => {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Pass & Event Dashboard</h1>
          <p className="text-gray-600">
            Real-time overview of events, pass generation, activations, and gate check-in activity.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/checkin')}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition shadow-sm"
          >
            <QrCode className="w-4 h-4" />
            <span>Launch Scanner</span>
          </button>
          <button
            onClick={() => navigate('/admin/events')}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Manage Events</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700">
                  Live
                </span>
              </div>
              <h3 className="text-gray-500 text-sm font-medium">{stat.title}</h3>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 my-1">
                {loading ? '...' : stat.value.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">{stat.subtext}</p>
            </div>
          );
        })}
      </div>

      {/* Events & Quick Navigation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Events Overview */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Current & Upcoming Events</h2>
            <button
              onClick={() => navigate('/admin/events')}
              className="text-sm font-semibold text-purple-600 hover:text-purple-700"
            >
              View All
            </button>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-sm">
              <Calendar className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              No events registered yet. Click "Manage Events" to create your first event.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => navigate(`/admin/events/${event.id}`)}
                  className="py-3.5 flex items-center justify-between hover:bg-gray-50/80 rounded-lg px-2 cursor-pointer transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm">{event.name}</span>
                      <span className="text-xs font-mono bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-100 font-semibold">
                        {event.eventCode}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {event.venue && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" /> {event.venue}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" /> {formatDate(event.startsAt)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        event.status === 'ACTIVE' || event.status === 'PUBLISHED'
                          ? 'bg-green-100 text-green-700'
                          : event.status === 'DRAFT'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {event.status}
                    </span>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {event.totalPassesGenerated || 0} passes generated
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions & Policy summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
          <h2 className="text-lg font-bold text-gray-900">System Workflow</h2>

          <div className="space-y-3 text-xs text-gray-600">
            <div className="flex items-start gap-3 p-3 bg-purple-50/60 rounded-lg border border-purple-100">
              <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                1
              </span>
              <div>
                <strong className="text-gray-900 block font-semibold">Create Event & Configure Days</strong>
                Define dates, auto-derive sequential days (Day 1, Day 2), and set check-in policies.
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-purple-50/60 rounded-lg border border-purple-100">
              <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                2
              </span>
              <div>
                <strong className="text-gray-900 block font-semibold">Generate Passes</strong>
                Generate sequential pass batches bound to specific event days. Download printable cards with QR codes.
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-purple-50/60 rounded-lg border border-purple-100">
              <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                3
              </span>
              <div>
                <strong className="text-gray-900 block font-semibold">Attendee Public Activation</strong>
                Attendees scan the pass QR code, submit their name & email, and receive transactional email confirmation.
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-purple-50/60 rounded-lg border border-purple-100">
              <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                4
              </span>
              <div>
                <strong className="text-gray-900 block font-semibold">Gatekeeper Entry Check-In</strong>
                Gatekeepers scan QR pass at entrance. Multi-day rules permit Day 1 & Day 2 entries separately while blocking duplicates.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
