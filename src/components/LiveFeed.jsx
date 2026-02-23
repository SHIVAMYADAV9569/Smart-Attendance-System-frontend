import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../api';

export default function LiveFeed() {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const response = await dashboardAPI.getLiveFeed();
        setFeed(response.data.feed);
      } catch (err) {
        setError('Failed to load live feed');
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
    const interval = setInterval(fetchFeed, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="text-center py-8">Loading live feed...</div>;

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">🔴 Live Attendance Feed</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid gap-4">
        {feed.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No attendance records for today</p>
          </div>
        ) : (
          feed.map((record, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border-l-4 border-blue-500"
            >
              <div className="flex-1">
                <p className="font-bold text-gray-800">{record.name}</p>
                <p className="text-xs text-gray-600">{record.enrollment}</p>
                <p className="text-xs text-gray-500 mt-1">{record.department}</p>
              </div>

              <div className="text-center">
                {record.checkInTime && (
                  <div>
                    <p className="text-lg font-bold text-green-600">{record.checkInTime}</p>
                    <p className="text-xs text-gray-500">Check In</p>
                  </div>
                )}
                {record.checkOutTime && (
                  <div className="mt-2">
                    <p className="text-lg font-bold text-orange-600">{record.checkOutTime}</p>
                    <p className="text-xs text-gray-500">Check Out</p>
                  </div>
                )}
              </div>

              <div className="ml-4">
                <span
                  className={`px-4 py-2 rounded-full text-xs font-bold ${
                    record.status === 'present'
                      ? 'bg-green-200 text-green-800'
                      : record.status === 'late'
                      ? 'bg-yellow-200 text-yellow-800'
                      : 'bg-red-200 text-red-800'
                  }`}
                >
                  {record.status.toUpperCase()}
                </span>
                <p className="text-xs text-gray-500 mt-2">
                  Confidence: {(record.confidence * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
