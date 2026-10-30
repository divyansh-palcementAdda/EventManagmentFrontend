import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import eventsService from '../../Api-Services/eventsService';
import { ArrowLeft, Calendar, MapPin, Clock, Users, Ticket, Shield, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const EventDetail = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    setLoading(true);
    try {
      const response = await eventsService.getEventById(eventId);
      setEvent(response.data);
    } catch (error) {
      toast.error('Failed to fetch event details');
      console.error('Error fetching event details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      DRAFT: 'bg-yellow-100 text-yellow-700',
      ACTIVE: 'bg-green-100 text-green-700',
      COMPLETED: 'bg-gray-100 text-gray-700',
      CANCELLED: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusStyles[status] || 'bg-gray-100 text-gray-700'}`}>
        {status}
      </span>
    );
  };

  const getActivationPolicyBadge = (policy) => {
    const policyStyles = {
      SELF_SERVICE: 'bg-blue-100 text-blue-700',
      ADMIN_CONTROLLED: 'bg-purple-100 text-purple-700',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${policyStyles[policy] || 'bg-gray-100 text-gray-700'}`}>
        {policy.replace('_', ' ')}
      </span>
    );
  };

  const getCheckInPolicyBadge = (policy) => {
    const policyStyles = {
      SINGLE_ENTRY: 'bg-green-100 text-green-700',
      MULTIPLE_ENTRY: 'bg-orange-100 text-orange-700',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${policyStyles[policy] || 'bg-gray-100 text-gray-700'}`}>
        {policy.replace('_', ' ')}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="text-center py-12">
          <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Event Not Found</h2>
          <p className="text-gray-600 mb-4">The event you're looking for doesn't exist or has been deleted.</p>
          <button
            onClick={() => navigate('/admin/events')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header with Back Button and Heading */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate('/admin/events')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium text-gray-700">Back</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Event Details</h1>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{event.name}</h2>
            <p className="text-gray-600 text-sm mt-1">{event.description || 'No description provided'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {getStatusBadge(event.status)}
          </div>
        </div>
      </div>

      {/* Single Card with All Details */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Ticket className="w-4 h-4 text-blue-600" />
              Basic Information
            </h3>
            <div className="space-y-2">
              <div>
                <label className="text-xs font-medium text-gray-500">Event Code</label>
                <p className="text-gray-900 font-mono text-sm">{event.eventCode || '-'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Pass Series Code</label>
                <p className="text-gray-900 font-mono text-sm">{event.passSeriesCode || '-'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Venue</label>
                <p className="text-gray-900 text-sm flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  {event.venue || '-'}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Timezone</label>
                <p className="text-gray-900 text-sm">{event.timezone || '-'}</p>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Schedule
            </h3>
            <div className="space-y-2">
              <div>
                <label className="text-xs font-medium text-gray-500">Start Date & Time</label>
                <p className="text-gray-900 text-sm flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  {formatDate(event.startsAt)}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">End Date & Time</label>
                <p className="text-gray-900 text-sm flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  {formatDate(event.endsAt)}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Created At</label>
                <p className="text-gray-900 text-sm">{formatDate(event.createdAt)}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Last Updated</label>
                <p className="text-gray-900 text-sm">{formatDate(event.updatedAt)}</p>
              </div>
            </div>
          </div>

          {/* Pass Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Pass Information
            </h3>
            <div className="space-y-2">
              <div>
                <label className="text-xs font-medium text-gray-500">Maximum Passes</label>
                <p className="text-gray-900 text-lg font-semibold">{event.maximumPasses || 0}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Total Passes Generated</label>
                <p className="text-gray-900 text-lg font-semibold">{event.totalPassesGenerated || 0}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Passes Available</label>
                <p className="text-gray-900 text-lg font-semibold">
                  {Math.max(0, (event.maximumPasses || 0) - (event.totalPassesGenerated || 0))}
                </p>
              </div>
            </div>
          </div>

          {/* Policies */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              Policies
            </h3>
            <div className="space-y-2">
              <div>
                <label className="text-xs font-medium text-gray-500">Activation Policy</label>
                <div className="mt-1">
                  {getActivationPolicyBadge(event.activationPolicy)}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Check-in Policy</label>
                <div className="mt-1">
                  {getCheckInPolicyBadge(event.checkInPolicy)}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Event Status</label>
                <div className="mt-1">
                  {getStatusBadge(event.status)}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="space-y-3 md:col-span-2 lg:col-span-2">
              <h3 className="text-sm font-semibold text-gray-900">Description</h3>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{event.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
