import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { LogIn, Sparkles, UserIcon } from 'lucide-react';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ username, password });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Sai tên đăng nhập hoặc mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/theme.png')" }}>
      {/* Light overlay for readability without darkening the vibrant colors */}
      <div className="absolute inset-0 bg-white/10" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6 px-4">
          <div className="inline-flex items-center space-x-2 mb-6">
            <div className="hover:rotate-6 transition-transform">
              <img src="/Lexi_logo.svg" alt="LexiQuiz Logo" className="h-20 w-20 sm:h-24 sm:w-24" />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-[#1e293b] tracking-tight">
              LexiQuiz
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-[#1e293b] mb-2 tracking-tight">Chào mừng trở lại!</h1>
          <p className="text-sm sm:text-base text-[#64748b] font-bold">Sẵn sàng tiếp tục hành trình học tập của bạn?</p>
        </div>

        <Card className="bg-white border-0 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2.5rem] p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1e293b] ml-1">Tên đăng nhập</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-500">
                  <UserIcon className="h-5 w-5" />
                </div>
                <Input
                  placeholder="Biệt danh siêu ngầu của bạn"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-12 bg-[#f8fafc] border-slate-100 h-14 rounded-2xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1e293b] ml-1">Mật khẩu</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-500">
                  <LogIn className="h-5 w-5" />
                </div>
                <Input
                  type="password"
                  placeholder="Chìa khóa bí mật của bạn"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 bg-[#f8fafc] border-slate-100 h-14 rounded-2xl"
                  required
                />
              </div>
              <div className="flex justify-end pr-1">
                <button type="button" className="text-xs font-bold text-primary-600 hover:text-primary-700">Quên chìa khóa bí mật?</button>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 text-rose-600 text-sm font-bold border border-rose-100">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-14 rounded-2xl bg-[#6366f1] hover:bg-[#4f46e5] text-lg font-black shadow-xl shadow-indigo-500/20" isLoading={loading}>
              Let's Go! <span className="ml-1">→</span>
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-500 font-bold flex items-center justify-center space-x-2">
              <span>Chưa có tài khoản?</span>
              <Link to="/register" className="text-primary-600 hover:text-primary-700 underline decoration-2 underline-offset-4">
                Tham gia ngay!
              </Link>
              <span className="text-amber-400">
                <svg width="20" height="10" viewBox="0 0 20 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 8C5 2 8 2 11 8C14 14 17 2 18 2" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
