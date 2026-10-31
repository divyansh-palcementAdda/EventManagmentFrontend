import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import attendeesService from '../../../Api-Services/attendeesService';
import AttendeeModal from '../../../Components/Modals/Attendees/AttendeeModal';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Edit,
  Trash2,
  Loader2,
  Shield,
  QrCode,
  GraduationCap,
  Ticket,
} from 'lucide-react';
import { Button } from '../../../Components/reusable';

const AttendeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [attendee, setAttendee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  useEffect(() => {
    fetchAttendeeDetails();
  }, [id]);

  const fetchAttendeeDetails = async () => {
    setLoading(true);
    try {
      const response = await attendeesService.getAttendeeById(id);
      setAttendee(response);
    } catch (error) {
      toast.error('Failed to fetch attendee details');
      console.error('Error fetching attendee details:', error);
      navigate('/admin/attendees');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await attendeesService.deleteAttendee(id);
      toast.success('Attendee deleted successfully');
      navigate('/admin/attendees');
    } catch (error) {
      toast.error('Failed to delete attendee');
      console.error('Error deleting attendee:', error);
    }
  };

  const handleEdit = () => {
    setEditModalOpen(true);
  };

  const handleUpdate = async (formData) => {
    try {
      await attendeesService.updateAttendee(id, formData);
      toast.success('Attendee updated successfully');
      setEditModalOpen(false);
      fetchAttendeeDetails();
    } catch (error) {
      toast.error('Failed to update attendee');
      console.error('Error updating attendee:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      CONFIRMED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusStyles[status] || statusStyles.PENDING}`}>
        {status}
      </span>
    );
  };

  const getCheckInBadge = (status) => {
    const statusStyles = {
      CHECKED_IN: 'bg-green-100 text-green-700',
      NOT_CHECKED_IN: 'bg-gray-100 text-gray-700',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusStyles[status] || statusStyles.NOT_CHECKED_IN}`}>
        {status?.replace('_', ' ')}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-10 w-10 text-purple-600" />
      </div>
    );
  }

  if (!attendee) {
    return (
      <div className="p-8 text-center py-12">
        <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Attendee Not Found</h2>
        <Button
          onClick={() => navigate('/admin/attendees')}
          variant="primary"
        >
          Back to Attendees
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/attendees')}
            className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
              Attendee Details
            </h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
              View and manage attendee information
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleEdit}
            variant="primary"
            className="flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit Attendee
          </Button>
          <Button
            onClick={() => setDeleteModalOpen(true)}
            variant="neutral"
            className="flex items-center gap-2 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Personal Information Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 space-y-4">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <User className="w-4 h-4 text-purple-600" />
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Full Name</label>
            <p className="text-sm font-medium text-gray-900">{attendee.fullName || '-'}</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Email</label>
            <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              {attendee.email || '-'}
            </p>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Mobile Number</label>
            <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              {attendee.mobileNumber || '-'}
            </p>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Organization</label>
            <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-gray-400" />
              {attendee.organization || '-'}
            </p>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Designation</label>
            <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-gray-400" />
              {attendee.designation || '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Registration Information Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 space-y-4">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <Calendar className="w-4 h-4 text-purple-600" />
          Registration Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Registration Status</label>
            <div className="flex items-center gap-2">
              {getStatusBadge(attendee.registrationStatus)}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Check-in Status</label>
            <div className="flex items-center gap-2">
              {getCheckInBadge(attendee.checkInStatus)}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Registered At</label>
            <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              {attendee.registeredAt ? new Date(attendee.registeredAt).toLocaleString() : '-'}
            </p>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Checked In At</label>
            <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-gray-400" />
              {attendee.checkedInAt ? new Date(attendee.checkedInAt).toLocaleString : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Event Information Card */}
      {(attendee.event || attendee.eventName) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4 text-purple-600" />
            Event Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Event Name</label>
              <p className="text-sm font-medium text-gray-900">{attendee.event?.name || attendee.eventName || '-'}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Event Code</label>
              <p className="text-sm font-medium text-gray-900 font-mono">{attendee.event?.eventCode || attendee.eventCode || '-'}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Event Date</label>
              <p className="text-sm font-medium text-gray-900">
                {attendee.event?.startsAt ? new Date(attendee.event.startsAt).toLocaleDateString() : '-'}
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Venue</label>
              <p className="text-sm font-medium text-gray-900">{attendee.event?.venue || '-'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Linked Pass Card */}
      {(attendee.linkedPass || attendee.passNumber) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Ticket className="w-4 h-4 text-emerald-600" />
            Linked Pass Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Pass Number</label>
              <p className="text-sm font-bold text-emerald-700 font-mono">
                {attendee.linkedPass?.passNumber || attendee.passNumber || '-'}
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Pass Sequence</label>
              <p className="text-sm font-medium text-gray-900 font-mono">
                {attendee.linkedPass?.sequenceNumber ?? attendee.sequenceNumber ?? '-'}
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Pass Status</label>
              <p className="text-sm font-medium text-gray-900">
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  (attendee.linkedPass?.status || attendee.passStatus) === 'ACTIVATED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {attendee.linkedPass?.status || attendee.passStatus || '-'}
                </span>
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Pass Category</label>
              <p className="text-sm font-medium text-gray-900">
                {attendee.linkedPass?.category || attendee.passCategory || attendee.category || 'GENERAL'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Academic Details Card if applicable */}
      {(attendee.college || attendee.course || attendee.studentId) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-purple-600" />
            Academic Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-500">College / Institution</label>
              <p className="text-sm font-medium text-gray-900">{attendee.college || '-'}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Course / Program</label>
              <p className="text-sm font-medium text-gray-900">{attendee.course || '-'}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Year / Semester</label>
              <p className="text-sm font-medium text-gray-900">{attendee.yearSemester || '-'}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Student ID / Roll No</label>
              <p className="text-sm font-medium text-gray-900 font-mono">{attendee.studentId || '-'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Check-in History Card */}
      {attendee.checkInHistory && attendee.checkInHistory.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-600" />
            Check-in History
          </h3>
          <div className="space-y-3">
            {attendee.checkInHistory.map((history, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Gate: {history.gateName || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {history.checkedInAt ? new Date(history.checkedInAt).toLocaleString() : '-'}
                    </p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && (
        <AttendeeModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          attendee={attendee}
          onSave={handleUpdate}
          loading={false}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Attendee</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this attendee? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setDeleteModalOpen(false)}
                variant="neutral"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                variant="primary"
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendeeDetail;
