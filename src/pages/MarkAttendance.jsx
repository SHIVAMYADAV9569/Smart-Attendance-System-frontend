import React from 'react';
import Header from '../components/Header';
import FaceRecognition from '../components/FaceRecognition';

export default function MarkAttendance() {
  return (
    <div>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <FaceRecognition />
          </div>
          <div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4 text-gray-800">📋 Instructions</h3>
              <ul className="text-gray-600 text-sm space-y-3">
                <li>✓ Position your face clearly in the frame</li>
                <li>✓ Ensure good lighting</li>
                <li>✓ Click "Mark Attendance" button</li>
                <li>✓ Wait for face recognition</li>
                <li>✓ Your attendance will be recorded</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
