import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../api';
import { format } from 'date-fns';

export default function AttendanceReport() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState(
    format(new Date(new Date().setDate(new Date().getDate() - 7)), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getReport({
        startDate,
        endDate,
        groupBy: 'date'
      });
      setReport(response.data);
      setError('');
    } catch (err) {
      setError('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Attendance Report</h2>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          <button
            onClick={fetchReport}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-gray-400"
          >
            {loading ? 'Loading...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {report && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(report.data).map(([date, counts]) => (
              <div key={date} className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-bold text-gray-700 mb-2">{date}</p>
                <div className="space-y-1 text-xs">
                  <p className="text-green-600">
                    ✓ Present: <span className="font-bold">{counts.present}</span>
                  </p>
                  <p className="text-red-600">
                    ✗ Absent: <span className="font-bold">{counts.absent}</span>
                  </p>
                  <p className="text-yellow-600">
                    ⏱ Late: <span className="font-bold">{counts.late}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-700">
              <strong>Total Records:</strong> {report.totalRecords}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Date Range:</strong> {report.dateRange.startDate} to {report.dateRange.endDate}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
