# Face Attendance System - Frontend

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Features

### Student Features
- **Face Registration**: Register your face during signup
- **Mark Attendance**: Use face recognition to mark attendance
- **View History**: Check your attendance records
- **Personal Dashboard**: See your attendance statistics

### Faculty/Admin Features
- **Dashboard Overview**: Real-time attendance statistics
- **Live Feed**: See who's checking in/out in real-time
- **Get Reports**: Generate attendance reports for date ranges
- **User Management**: Manage students and faculty

## Page Structure

- `/login` - Login page
- `/register` - Registration page
- `/register-face` - Face registration after signup
- `/attendance` - Mark attendance (Student)
- `/my-records` - View attendance history (Student)
- `/dashboard` - Admin dashboard (Faculty/Admin)
- `/reports` - Generate reports (Faculty/Admin)

## Technology Stack

- **React 18** - UI Framework
- **React Router v6** - Navigation
- **Axios** - API calls
- **React Webcam** - Camera access
- **Recharts** - Data visualization
- **Tailwind CSS** - Styling
- **Date-fns** - Date formatting
