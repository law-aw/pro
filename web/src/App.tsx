import { Navigate, Route, Routes } from 'react-router-dom';
import KioskHome from './pages/KioskHome';
import KioskDetail from './pages/KioskDetail';
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminNotices from './pages/admin/AdminNotices';
import AdminNoticeForm from './pages/admin/AdminNoticeForm';
import AdminSettings from './pages/admin/AdminSettings';
import AdminUsers from './pages/admin/AdminUsers';
import AdminSync from './pages/admin/AdminSync';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<KioskHome />} />
      <Route path="/notice/:id" element={<KioskDetail />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="notices" element={<AdminNotices />} />
        <Route path="notices/new" element={<AdminNoticeForm />} />
        <Route path="notices/:id/edit" element={<AdminNoticeForm />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="sync" element={<AdminSync />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
