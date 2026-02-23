import React, { useEffect, useState } from 'react';
import { lectureAPI } from '../api';
import { format, addDays, subDays, isSameDay, getDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function FacultyLectures() {
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const navigate = useNavigate();

  // Form state for creating lecture
  const [formData, setFormData] = useState({
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '10:00',
    department: '',
    subject: '',
    description: ''
  });

  useEffect(() => {
    fetchLectures();
  }, [selectedDate]);

  const fetchLectures = async () => {
    try {
      setLoading(true);
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await lectureAPI.getMyLectures({ date: dateStr });
      setLectures(response.data.lectures || []);
      setError('');
    } catch (err) {
      console.error('Error fetching lectures:', err);
      setError('Failed to load lectures');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousDay = () => {
    setSelectedDate(subDays(selectedDate, 1));
  };

  const handleNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1));
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const handleDateChange = (e) => {
    setSelectedDate(new Date(e.target.value));
  };

  const isSunday = getDay(selectedDate) === 0;
  const isToday = isSameDay(selectedDate, new Date());

  const handleCreateLecture = async (e) => {
    e.preventDefault();
    try {
      await lectureAPI.createLecture(formData);
      setShowCreateModal(false);
      fetchLectures();
      // Reset form
      setFormData({
        title: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '09:00',
        endTime: '10:00',
        department: '',
        subject: '',
        description: ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create lecture');
    }
  };

  const handleDeleteLecture = async (lectureId) => {
    if (!window.confirm('Are you sure you want to delete this lecture?')) return;
    try {
      await lectureAPI.deleteLecture(lectureId);
      fetchLectures();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete lecture');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ongoing': return 'bg-green-100 text-green-800 border-green-300';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const handleMarkAttendance = (lectureId) => {
    navigate(`/lecture/${lectureId}/attendance`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your lectures...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-lg p-6 mb-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">📚 My Lectures</h1>
              <p className="text-blue-100">Manage your daily lectures and attendance</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-white text-blue-600 hover:bg-blue-50 font-bold py-3 px-6 rounded-lg transition shadow-md"
            >
              + Add New Lecture
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Date Navigation Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Date Navigation */}
            <div className="flex items-center gap-3">
              <button
                onClick={handlePreviousDay}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
                title="Previous Day"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="text-center px-4">
                <p className="text-sm text-gray-500 mb-1">
                  {isToday ? 'Today' : format(selectedDate, 'EEEE')}
                </p>
                <p className="text-2xl font-bold text-gray-800">
                  {format(selectedDate, 'MMM dd, yyyy')}
                </p>
              </div>
              
              <button
                onClick={handleNextDay}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
                title="Next Day"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Date Picker & Today Button */}
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={handleDateChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {!isToday && (
                <button
                  onClick={handleToday}
                  className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold rounded-lg transition"
                >
                  Today
                </button>
              )}
            </div>
          </div>

          {/* Day Status Indicator */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Status:</span>
              {isSunday ? (
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                  🏖️ Holiday (Sunday) - No Lectures
                </span>
              ) : (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  📖 Working Day - {lectures.length} Lecture{lectures.length !== 1 ? 's' : ''} Scheduled
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Lectures List */}
        {isSunday ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🏖️</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Lectures Scheduled</h3>
            <p className="text-gray-600 mb-4">It's Sunday! No lectures are scheduled on Sundays.</p>
            <p className="text-gray-500 text-sm">
              Lectures are scheduled from Monday to Saturday with the following weekly schedule:
            </p>
            <div className="mt-4 bg-blue-50 rounded-lg p-4 max-w-lg mx-auto text-left">
              <p className="text-blue-800 text-sm font-semibold mb-2">📅 Weekly Lecture Schedule:</p>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Mobile Computer: 9:10 AM - 10:00 AM</li>
                <li>• Multimedia: 10:10 AM - 11:00 AM</li>
                <li>• Machine Learning: 11:10 AM - 12:00 PM</li>
                <li>• Software Project Management System: 12:10 PM - 1:00 PM</li>
              </ul>
            </div>
          </div>
        ) : lectures.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Lectures Scheduled</h3>
            <p className="text-gray-600 mb-4">
              There are no lectures scheduled for {format(selectedDate, 'MMMM do, yyyy')}.
            </p>
            <div className="bg-blue-50 rounded-lg p-4 max-w-lg mx-auto">
              <p className="text-blue-800 text-sm font-semibold mb-2">📅 Weekly Lecture Schedule:</p>
              <ul className="text-blue-700 text-sm space-y-1 text-left">
                <li>• Mobile Computer: 9:10 AM - 10:00 AM</li>
                <li>• Multimedia: 10:10 AM - 11:00 AM</li>
                <li>• Machine Learning: 11:10 AM - 12:00 PM</li>
                <li>• Software Project Management System: 12:10 PM - 1:00 PM</li>
              </ul>
              <p className="text-blue-600 text-xs mt-3">
                This schedule repeats every week (Monday-Saturday)
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {lectures.map((lecture, index) => (
              <div
                key={lecture._id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition"
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    {/* Lecture Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-blue-100 text-blue-800 text-sm font-bold px-3 py-1 rounded-full">
                          #{index + 1}
                        </span>
                        <h3 className="text-xl font-bold text-gray-800">{lecture.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(lecture.status)}`}>
                          {lecture.status.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-gray-600">{lecture.startTime} - {lecture.endTime}</span>
                        </div>
                        
                        {lecture.subject && (
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <span className="text-gray-600">{lecture.subject}</span>
                          </div>
                        )}
                        
                        {lecture.department && (
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span className="text-gray-600">{lecture.department}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-gray-600">{format(selectedDate, 'EEEE, MMM dd')}</span>
                        </div>
                      </div>
                      
                      {lecture.description && (
                        <p className="text-gray-500 text-sm mt-3 bg-gray-50 p-3 rounded-lg">
                          {lecture.description}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 min-w-[150px]">
                      <button
                        onClick={() => handleMarkAttendance(lecture._id)}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Mark Attendance
                      </button>
                      <button
                        onClick={() => handleDeleteLecture(lecture._id)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      {/* Create Lecture Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">Create New Lecture</h3>
            
            <form onSubmit={handleCreateLecture} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Lecture Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  placeholder="e.g., Introduction to Computer Science"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  placeholder="e.g., Computer Science"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  placeholder="e.g., Engineering"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  rows="3"
                  placeholder="Lecture description..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
                >
                  Create Lecture
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
