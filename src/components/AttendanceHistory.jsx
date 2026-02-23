import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { attendanceAPI } from '../api';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

export default function AttendanceHistory() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({});
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await attendanceAPI.getMyRecords({ limit: 10, page: 1 });
      setRecords(response.data.records);
      setPagination(response.data.pagination);
      if (response.data.user) {
        setUserInfo(response.data.user);
      }
    } catch (err) {
      setError('Failed to fetch attendance records');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* User Profile Card */}
      {userInfo && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-6">
            {/* User Photo */}
            {userInfo.faceImage ? (
              <div className="flex-shrink-0">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-400 shadow-lg">
                  <img
                    src={userInfo.faceImage}
                    alt={userInfo.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ) : (
              <div className="flex-shrink-0">
                <div className="w-24 h-24 rounded-full bg-gray-300 border-4 border-gray-400 flex items-center justify-center text-4xl">
                  👤
                </div>
              </div>
            )}

            {/* User Info */}
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">{userInfo.name}</h2>
              <p className="text-gray-600">
                <span className="font-semibold">Email:</span> {userInfo.email}
              </p>
              <p className="text-sm text-blue-600 mt-2">
                ✅ Face photo registered and verified
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Attendance History */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">📋 Attendance History</h2>
          <button
            onClick={() => navigate('/mark-attendance')}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition"
          >
            📷 Mark Attendance
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {records.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No attendance records found</p>
            <button
              onClick={() => navigate('/mark-attendance')}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition"
            >
              Mark Your First Attendance
            </button>
          </div>
        ) : (
          <>
            {/* Cards View for Mobile */}
            <div className="hidden md:block">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-200 bg-gray-50">
                      <th className="text-left py-3 px-4 font-bold text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-bold text-gray-700">Check In</th>
                      <th className="text-left py-3 px-4 font-bold text-gray-700">Check Out</th>
                      <th className="text-left py-3 px-4 font-bold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr key={record._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">{format(new Date(record.date), 'MMM dd, yyyy')}</td>
                        <td className="py-3 px-4">
                          {record.checkInTime ? format(new Date(record.checkInTime), 'hh:mm a') : '-'}
                        </td>
                        <td className="py-3 px-4">
                          {record.checkOutTime ? format(new Date(record.checkOutTime), 'hh:mm a') : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              record.status === 'present'
                                ? 'bg-green-100 text-green-800'
                                : record.status === 'late'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {record.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {records.map((record) => (
                <div key={record._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition">
                  <div className="flex items-center justify-between mb-3">
                    {/* Photo Thumbnail */}
                    {record.faceImage && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden shadow-md flex-shrink-0">
                        <img
                          src={record.faceImage}
                          alt={record.userName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        record.status === 'present'
                          ? 'bg-green-100 text-green-800'
                          : record.status === 'late'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {record.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold text-gray-700">
                      📅 {format(new Date(record.date), 'MMM dd, yyyy')}
                    </p>
                    <p className="text-gray-600">
                      🕐 Check In: {record.checkInTime ? format(new Date(record.checkInTime), 'hh:mm a') : '-'}
                    </p>
                    <p className="text-gray-600">
                      🕑 Check Out: {record.checkOutTime ? format(new Date(record.checkOutTime), 'hh:mm a') : '-'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {pagination.pages > 1 && (
          <div className="mt-6 flex justify-between items-center text-sm text-gray-600">
            <span>
              Page {pagination.page} of {pagination.pages} | Total: {pagination.total}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
