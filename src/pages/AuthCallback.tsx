import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userStr = params.get('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        localStorage.setItem('sira_token', token);
        localStorage.setItem('sira_user', JSON.stringify(user));
        window.location.replace('/dashboard');
      } catch {
        navigate('/login?error=invalid_callback');
      }
    } else {
      navigate('/login?error=missing_token');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f172a]" dir="rtl">
      <Loader2 className="w-12 h-12 text-orange-400 animate-spin mb-4" />
      <p className="text-gray-300 text-lg">جاري تسجيل الدخول بـ Replit...</p>
    </div>
  );
}
