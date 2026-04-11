import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Loader2 } from 'lucide-react';

const Login = lazy(() => import('@/pages/Login'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Routers = lazy(() => import('@/pages/Routers'));
const Vouchers = lazy(() => import('@/pages/Vouchers'));
const FingerprintDevices = lazy(() => import('@/pages/FingerprintDevices'));
const DVRCameras = lazy(() => import('@/pages/DVRCameras'));
const Backgrounds = lazy(() => import('@/pages/Backgrounds'));
const PrintCards = lazy(() => import('@/pages/PrintCards'));
const HotspotPages = lazy(() => import('@/pages/HotspotPages'));
const CreateCards = lazy(() => import('@/pages/CreateCards'));
const Settings = lazy(() => import('@/pages/Settings'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-gray-500 text-sm">جاري التحميل...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
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
              <Route path="/create-cards" element={<CreateCards />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster position="top-center" richColors />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
