import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Users, Sword, LogIn, UserCircle, AlertCircle, Hash } from 'lucide-react';

const JoinRoom: React.FC = () => {
  const { pin } = useParams<{ pin: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [nickname, setNickname] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const fetchRoom = async () => {
      if (!pin) return;
      try {
        const response = await api.get(`/game-rooms/${pin}/`);
        setRoomInfo(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Phòng không tồn tại hoặc không còn hoạt động.');
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, [pin]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() && !user) return;
    
    setJoining(true);
    const name = user ? user.username : nickname;
    navigate(`/play/${pin}${!user ? `?guest_name=${encodeURIComponent(name)}` : ''}`);
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="h-10 w-10 animate-spin border-4 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="max-w-md mx-auto pt-32 px-4 text-center">
        <div className="bg-rose-100 p-5 rounded-[2rem] border border-rose-200 mb-6 inline-block">
          <AlertCircle className="h-10 w-10 text-rose-500" />
        </div>
        <h1 className="text-2xl font-black mb-2 tracking-tight">Truy cập bị hạn chế</h1>
        <p className="text-slate-500 mb-8 font-medium text-sm leading-relaxed">{error}</p>
        <Button size="lg" className="w-full h-14 rounded-2xl text-lg font-black" onClick={() => navigate('/')}>
          Quay lại
        </Button>
      </main>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-primary-100">
      <Navbar />
      
      <main className="max-w-md mx-auto pt-40 px-4 pb-12">
        <Card className="p-10 border-slate-200 bg-white shadow-xl shadow-slate-200/50 relative overflow-hidden">
          {/* Subtle decoration */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary-100/50 blur-3xl rounded-full pointer-events-none" />

          <div className="text-center mb-10">
            <div className="inline-flex p-4 rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-500/20 mb-6">
              <Sword className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-black mb-1 tracking-tight">Tham gia thi đấu trực tiếp</h1>
            <div className="flex items-center justify-center space-x-2 text-slate-400">
              <Hash className="h-3 w-3" />
              <p className="text-xs font-bold uppercase tracking-widest">Pin: <span className="text-primary-600">{pin}</span></p>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-3xl mb-10 border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Chủ đề bộ câu hỏi</p>
            <h2 className="text-lg font-black mb-0.5 leading-tight text-slate-800">{roomInfo?.quiz_title}</h2>
            <p className="text-xs text-slate-500 font-medium italic">Tổ chức bởi {roomInfo?.host_username}</p>
          </div>

          {!user ? (
            <form onSubmit={handleJoin} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Biệt danh</label>
                <div className="relative">
                  <Input 
                    placeholder="VD: SieuNhanVang" 
                    className="h-14 px-6 rounded-2xl bg-slate-50 border-slate-200 text-lg font-bold focus:border-primary-500 transition-all text-slate-900"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    required
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300">
                    <UserCircle className="h-5 w-5" />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <Button 
                  size="lg" 
                  className="w-full h-14 text-lg rounded-2xl font-black shadow-lg"
                  type="submit"
                  isLoading={joining}
                >
                  <LogIn className="h-5 w-5 mr-2" />
                  Tham gia phòng
                </Button>
                
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100"></div>
                  </div>
                  <div className="relative flex justify-center text-[9px] uppercase tracking-widest font-black">
                    <span className="bg-white px-3 text-slate-300">Hoặc</span>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full h-14 rounded-2xl border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-sm"
                  onClick={() => navigate('/login', { state: { from: `/join/${pin}` } })}
                >
                  Đăng nhập để nhận thêm ưu đãi hồ sơ
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center space-x-4 p-4 rounded-2xl bg-primary-50 border border-primary-100">
                <div className="h-12 w-12 rounded-xl bg-primary-600 flex items-center justify-center text-xl font-black text-white shadow-sm">
                  {user.username[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-[9px] font-black text-primary-500 uppercase tracking-widest mb-0.5">Sẵn sàng dưới tên</p>
                  <p className="text-lg font-black text-slate-800">{user.username}</p>
                </div>
              </div>

              <Button 
                size="lg" 
                className="w-full h-14 text-lg rounded-2xl font-black shadow-lg"
                onClick={handleJoin}
                isLoading={joining}
              >
                <Sword className="h-5 w-5 mr-2" />
                Bắt đầu thi đấu
              </Button>
            </div>
          )}

          <p className="mt-8 text-center text-slate-300 text-[10px] font-bold uppercase tracking-widest">
            Chơi đẹp • Tốc độ • Thắng lớn
          </p>
        </Card>
      </main>
    </div>
  );
};

export default JoinRoom;
