import React, { useEffect, useState } from 'react';
import { attendanceAPI } from '../api';
import { format } from 'date-fns';

export default function StudentAttendanceStatus() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStudentsStatus();
  }, []);

  const fetchStudentsStatus = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getStudentsStatusToday();
      setStudents(response.data.students || []);
      setSummary(response.data.summary || {});
      setError('');
    } catch (err) {
      console.error('Error fetching students status:', err);
      setError('Failed to load students attendance status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return '#10b981'; // green
      case 'late':
        return '#f59e0b'; // yellow
      case 'absent':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'present':
        return 'bg-green-50 border-green-300';
      case 'late':
        return 'bg-yellow-50 border-yellow-300';
      case 'absent':
        return 'bg-red-50 border-red-300';
      default:
        return 'bg-gray-50 border-gray-300';
    }
  };

  // Filter students based on search
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.enrollmentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading students attendance...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 rounded-lg shadow p-4 border border-blue-300">
          <div className="text-blue-600 text-sm font-bold">TOTAL STUDENTS</div>
          <div className="text-3xl font-bold text-blue-700 mt-2">{summary?.total || 0}</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4 border border-green-300">
          <div className="text-green-600 text-sm font-bold">PRESENT</div>
          <div className="text-3xl font-bold text-green-700 mt-2">{summary?.present || 0}</div>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-4 border border-yellow-300">
          <div className="text-yellow-600 text-sm font-bold">LATE</div>
          <div className="text-3xl font-bold text-yellow-700 mt-2">{summary?.late || 0}</div>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-4 border border-red-300">
          <div className="text-red-600 text-sm font-bold">ABSENT</div>
          <div className="text-3xl font-bold text-red-700 mt-2">{summary?.absent || 0}</div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name, enrollment number, or department..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student) => (
            <div
              key={student._id}
              className={`rounded-lg shadow-lg p-4 border-l-4 ${getStatusBgColor(student.status)}`}
              style={{ borderLeftColor: getStatusColor(student.status) }}
            >
              {/* Student Photo */}
              <div className="mb-4">
                {student.faceData ? (
                  <img
                    src={student.faceData}
                    alt={student.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400 text-sm">No Photo</span>
                  </div>
                )}
              </div>

              {/* Student Info */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-800">{student.name}</h3>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">EN:</span> {student.enrollmentNumber || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Dept:</span> {student.department || 'N/A'}
                </p>
                {student.checkInTime && (
                  <p className="text-sm text-gray-600 mt-2">
                    <span className="font-semibold">Check In:</span>{' '}
                    {format(new Date(student.checkInTime), 'hh:mm a')}
                  </p>
                )}
              </div>

              {/* Status Buttons */}
              <div className="flex gap-2 justify-center">
                <button
                  className={`flex-1 py-2 px-3 rounded font-bold text-sm transition ${
                    student.status === 'present'
                      ? 'bg-green-500 text-white shadow-md'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  Present
                </button>
                <button
                  className={`flex-1 py-2 px-3 rounded font-bold text-sm transition ${
                    student.status === 'late'
                      ? 'bg-yellow-500 text-white shadow-md'
                      : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  }`}
                >
                  Late
                </button>
                <button
                  className={`flex-1 py-2 px-3 rounded font-bold text-sm transition ${
                    student.status === 'absent'
                      ? 'bg-red-500 text-white shadow-md'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  Absent
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-gray-500">
            {searchTerm ? 'No students found matching your search' : 'No students available'}
          </div>
        )}
      </div>
    </div>
  );
}
