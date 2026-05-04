import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { UserPlus } from 'lucide-react';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ username, email, password });
      navigate('/login');
    } catch (err: any) {
      setError(Object.values(err.response?.data || {}).join(' ') || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/theme.png')" }}>
      {/* Light overlay for readability */}
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
          <h1 className="text-4xl sm:text-5xl font-black text-[#1e293b] mb-2 tracking-tight">Gia nhập</h1>
          <p className="text-sm sm:text-base text-[#64748b] font-bold">Gia nhập hàng ngũ và bắt đầu cuộc chơi!</p>
        </div>

        <Card className="bg-white border-0 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2.5rem] p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1e293b] ml-1">Biệt danh</label>
              <Input
                placeholder="Biệt danh siêu ngầu của bạn"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-[#f8fafc] border-slate-100 h-14 rounded-2xl"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1e293b] ml-1">Email</label>
              <Input
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#f8fafc] border-slate-100 h-14 rounded-2xl"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1e293b] ml-1">Chìa khóa bí mật</label>
              <Input
                type="password"
                placeholder="Mật mã bí mật của bạn"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[#f8fafc] border-slate-100 h-14 rounded-2xl"
                required
              />
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 text-rose-600 text-sm font-bold border border-rose-100">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-14 rounded-2xl bg-[#6366f1] hover:bg-[#4f46e5] text-lg font-black shadow-xl shadow-indigo-500/20" isLoading={loading}>
              Bắt đầu ngay!
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-500 font-bold flex items-center justify-center space-x-2">
              <span>Bạn đã là thành viên?</span>
              <Link to="/login" className="text-primary-600 hover:text-primary-700 underline decoration-2 underline-offset-4">
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Register;
