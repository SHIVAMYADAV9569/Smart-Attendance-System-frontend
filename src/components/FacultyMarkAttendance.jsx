import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { lectureAPI } from '../api';
import { format } from 'date-fns';

export default function FacultyMarkAttendance() {
  const { lectureId } = useParams();
  const navigate = useNavigate();
  const [lecture, setLecture] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceData, setAttendanceData] = useState({});

  useEffect(() => {
    fetchLectureAndStudents();
  }, [lectureId]);

  const fetchLectureAndStudents = async () => {
    try {
      setLoading(true);
      const [lectureRes, studentsRes] = await Promise.all([
        lectureAPI.getLectureById(lectureId),
        lectureAPI.getLectureStudents(lectureId)
      ]);

      setLecture(lectureRes.data.lecture);
      setStudents(studentsRes.data.students || []);

      // Initialize attendance data
      const initialAttendance = {};
      studentsRes.data.students.forEach(student => {
        initialAttendance[student._id] = student.attendanceStatus || 'absent';
      });
      setAttendanceData(initialAttendance);

      setError('');
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to load lecture data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleMarkAll = (status) => {
    const newAttendance = {};
    filteredStudents.forEach(student => {
      newAttendance[student._id] = status;
    });
    setAttendanceData(prev => ({
      ...prev,
      ...newAttendance
    }));
  };

  const handleSaveAttendance = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Prepare bulk attendance data
      const bulkData = Object.entries(attendanceData).map(([userId, status]) => ({
        userId,
        status,
        notes: ''
      }));

      await lectureAPI.markBulkAttendance(lectureId, { attendanceData: bulkData });
      setSuccess('Attendance saved successfully!');

      // Refresh data
      fetchLectureAndStudents();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving attendance:', err);
      setError(err.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-500 text-white';
      case 'absent': return 'bg-red-500 text-white';
      case 'late': return 'bg-yellow-500 text-white';
      case 'leave': return 'bg-blue-500 text-white';
      default: return 'bg-gray-300 text-gray-700';
    }
  };

  const getStatusButtonClass = (studentId, status) => {
    const currentStatus = attendanceData[studentId];
    const isSelected = currentStatus === status;
    const baseClass = 'flex-1 py-2 px-3 rounded font-bold text-sm transition ';
    
    if (isSelected) {
      return baseClass + getStatusColor(status);
    }
    return baseClass + 'bg-gray-100 text-gray-700 hover:bg-gray-200';
  };

  // Filter students based on search
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.enrollmentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate summary
  const summary = {
    total: filteredStudents.length,
    present: filteredStudents.filter(s => attendanceData[s._id] === 'present').length,
    absent: filteredStudents.filter(s => attendanceData[s._id] === 'absent').length,
    late: filteredStudents.filter(s => attendanceData[s._id] === 'late').length,
    leave: filteredStudents.filter(s => attendanceData[s._id] === 'leave').length
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center py-8">Loading lecture data...</div>
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center py-8 text-red-600">Lecture not found</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">📋 Mark Attendance</h2>
          <h3 className="text-lg text-gray-600">{lecture.title}</h3>
          <p className="text-gray-500 text-sm">
            {format(new Date(lecture.date), 'MMMM dd, yyyy')} | {lecture.startTime} - {lecture.endTime}
          </p>
          {lecture.subject && (
            <p className="text-gray-500 text-sm">Subject: {lecture.subject}</p>
          )}
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition"
        >
          ← Back to Dashboard
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-blue-600 text-xs font-bold">TOTAL</div>
          <div className="text-2xl font-bold text-blue-700">{summary.total}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="text-green-600 text-xs font-bold">PRESENT</div>
          <div className="text-2xl font-bold text-green-700">{summary.present}</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="text-red-600 text-xs font-bold">ABSENT</div>
          <div className="text-2xl font-bold text-red-700">{summary.absent}</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="text-yellow-600 text-xs font-bold">LATE</div>
          <div className="text-2xl font-bold text-yellow-700">{summary.late}</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-blue-600 text-xs font-bold">LEAVE</div>
          <div className="text-2xl font-bold text-blue-700">{summary.leave}</div>
        </div>
      </div>

      {/* Search and Bulk Actions */}
      <div className="mb-6 space-y-4">
        <input
          type="text"
          placeholder="Search by name, enrollment number, or department..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-bold text-gray-700 py-2">Mark All Filtered:</span>
          <button
            onClick={() => handleMarkAll('present')}
            className="bg-green-100 hover:bg-green-200 text-green-700 font-bold py-2 px-4 rounded text-sm transition"
          >
            Present
          </button>
          <button
            onClick={() => handleMarkAll('absent')}
            className="bg-red-100 hover:bg-red-200 text-red-700 font-bold py-2 px-4 rounded text-sm transition"
          >
            Absent
          </button>
          <button
            onClick={() => handleMarkAll('late')}
            className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 font-bold py-2 px-4 rounded text-sm transition"
          >
            Late
          </button>
          <button
            onClick={() => handleMarkAll('leave')}
            className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold py-2 px-4 rounded text-sm transition"
          >
            Leave
          </button>
        </div>
      </div>

      {/* Students List */}
      <div className="space-y-4 max-h-[500px] overflow-y-auto">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'No students found matching your search' : 'No students available'}
          </div>
        ) : (
          filteredStudents.map((student) => (
            <div
              key={student._id}
              className="border rounded-lg p-4 hover:shadow-md transition bg-white"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Student Photo */}
                <div className="flex-shrink-0">
                  {student.faceData ? (
                    <img
                      src={student.faceData}
                      alt={student.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-2xl">
                      👤
                    </div>
                  )}
                </div>

                {/* Student Info */}
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800">{student.name}</h4>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">EN:</span> {student.enrollmentNumber || 'N/A'}
                  </p>
                  {student.department && (
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Dept:</span> {student.department}
                    </p>
                  )}
                </div>

                {/* Attendance Buttons */}
                <div className="flex gap-2 flex-1">
                  <button
                    onClick={() => handleStatusChange(student._id, 'present')}
                    className={getStatusButtonClass(student._id, 'present')}
                  >
                    Present
                  </button>
                  <button
                    onClick={() => handleStatusChange(student._id, 'absent')}
                    className={getStatusButtonClass(student._id, 'absent')}
                  >
                    Absent
                  </button>
                  <button
                    onClick={() => handleStatusChange(student._id, 'late')}
                    className={getStatusButtonClass(student._id, 'late')}
                  >
                    Late
                  </button>
                  <button
                    onClick={() => handleStatusChange(student._id, 'leave')}
                    className={getStatusButtonClass(student._id, 'leave')}
                  >
                    Leave
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Save Button */}
      <div className="mt-6 pt-6 border-t">
        <button
          onClick={handleSaveAttendance}
          disabled={saving}
          className={`w-full font-bold py-3 px-4 rounded-lg transition text-white ${
            saving
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
          }`}
        >
          {saving ? '⏳ Saving...' : '💾 Save Attendance'}
        </button>
      </div>
    </div>
  );
}
