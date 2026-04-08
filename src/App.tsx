import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Routers from '@/pages/Routers';
import Vouchers from '@/pages/Vouchers';
import FingerprintDevices from '@/pages/FingerprintDevices';
import DVRCameras from '@/pages/DVRCameras';
import Backgrounds from '@/pages/Backgrounds';
import PrintCards from '@/pages/PrintCards';
import HotspotPages from '@/pages/HotspotPages';
import CreateCards from '@/pages/CreateCards'; // <-- تم إضافة استيراد الصفحة الجديدة هنا
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/routers" element={<Routers />} />
          <Route path="/vouchers" element={<Vouchers />} />
          <Route path="/fingerprint" element={<FingerprintDevices />} />
          <Route path="/dvr" element={<DVRCameras />} />
          <Route path="/backgrounds" element={<Backgrounds />} />
          <Route path="/print-cards" element={<PrintCards />} />
          <Route path="/hotspot-pages" element={<HotspotPages />} />
          <Route path="/create-cards" element={<CreateCards />} /> {/* <-- تم إضافة المسار الجديد هنا */}
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors />
    </AuthProvider>
  );
}

export default App;
