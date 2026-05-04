import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Navbar } from '../components/Navbar';
import { UserAvatar } from '../components/UserAvatar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
  User as UserIcon, 
  Mail, 
  Zap, 
  Trophy, 
  BookOpen, 
  Activity, 
  Camera, 
  Save, 
  ShieldCheck, 
  CheckCircle2,
  AlertCircle,
  Lock,
  KeyRound,
  Compass,
  Shield,
  Layout,
  Brain,
  GraduationCap,
  Sparkles,
  Flame,
  Coins,
  ChevronRight,
  TrendingUp,
  Award,
  PlusCircle,
  ShoppingBag
} from 'lucide-react';

interface Stats {
  quizzes_created: number;
  results_taken: number;
  avg_score: number;
  badges: Badge[];
}

interface Badge {
  id: string;
  name: string;
  icon: string;
  color: string;
  earned: boolean;
  requirement: string;
}

interface Quiz {
  id: number;
  title: string;
  description: string;
  questions_count: number;
  created_at: string;
  category_name: string;
}

const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [myQuizzes, setMyQuizzes] = useState<Quiz[]>([]);
  const [quests, setQuests] = useState<any[]>([]);
  const [skillXP, setSkillXP] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'stats' | 'quizzes' | 'custom'>('profile');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });

  const [passwords, setPasswords] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.avatar) {
      setAvatarPreview(user.avatar);
    }
  }, [user?.avatar]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, quizzesRes, questsRes, skillsRes, inventoryRes] = await Promise.all([
          api.get('/auth/stats/'),
          api.get('/quizzes/my_quizzes/'),
          api.get('/quests/'),
          api.get('/skills/'),
          api.get('/inventory/')
        ]);
        setStats(statsRes.data);
        setMyQuizzes(quizzesRes.data);
        setQuests(questsRes.data);
        setSkillXP(skillsRes.data);
        setInventory(inventoryRes.data);
      } catch (err) {
        console.error('Failed to fetch profile data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new_password !== passwords.confirm_password) {
      setError('Mật khẩu mới không khớp!');
      return;
    }
    setUpdating(true);
    setSuccess(null);
    setError(null);
    try {
      await api.post('/auth/change_password/', {
        old_password: passwords.old_password,
        new_password: passwords.new_password,
      });
      setSuccess('Đổi mật khẩu thành công!');
      setPasswords({ old_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Đổi mật khẩu thất bại');
    } finally {
      setUpdating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setSuccess(null);
    setError(null);

    const data = new FormData();
    data.append('username', formData.username);
    data.append('email', formData.email);
    if (avatarFile) {
      data.append('avatar', avatarFile);
    }

    try {
      await api.patch('/auth/me/', data);
      await refreshUser();
      setSuccess('Cập nhật hồ sơ thành công!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Cập nhật hồ sơ thất bại');
    } finally {
      setUpdating(false);
    }
  };

  const handleEquip = async (itemId: number) => {
    try {
      await api.post(`/inventory/${itemId}/equip/`);
      const invRes = await api.get('/inventory/');
      setInventory(invRes.data);
      refreshUser();
      setSuccess('Đã cập nhật trang bị!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to equip item', err);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="h-12 w-12 animate-spin border-4 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 pt-28 sm:pt-32 pb-20">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Navigation */}
          <aside className="w-full lg:w-80 shrink-0 space-y-6">
            <Card className="p-6 border-0 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-accent-violet" />
              <div className="flex items-center space-x-4 mb-6">
                <UserAvatar user={user} size="lg" />
                <div className="min-w-0">
                  <h2 className="font-black text-slate-900 truncate">{user?.username}</h2>
                  <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest">Cấp {user?.level}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 pt-4 border-t border-slate-50">
                {[
                  { id: 'profile', label: 'Cài đặt hồ sơ', icon: UserIcon },
                  { id: 'stats', label: 'Tiến trình & Kỹ năng', icon: Trophy },
                  { id: 'quizzes', label: 'Kho Quiz cá nhân', icon: BookOpen },
                  { id: 'custom', label: 'Tùy chỉnh & Khung', icon: Sparkles },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
                      activeTab === item.id 
                        ? 'bg-primary-50 text-primary-600 shadow-sm shadow-primary-500/10' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                  >
                    <item.icon className={`h-5 w-5 ${activeTab === item.id ? 'text-primary-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden relative">
              <Zap className="absolute -right-4 -bottom-4 h-24 w-24 text-white/5 rotate-12" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Trạng thái chuỗi</p>
              <div className="flex items-end space-x-3 mb-1">
                <span className="text-4xl font-black">{user?.streak_count || 0}</span>
                <span className="text-xs font-bold text-slate-400 mb-1.5 uppercase">Ngày</span>
              </div>
              <p className="text-xs font-medium text-slate-400">
                {user?.is_streak_active ? 'Hôm nay bạn đã giữ lửa!' : 'Làm quiz ngay để giữ chuỗi!'}
              </p>
            </Card>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            
            {activeTab === 'profile' && (
              <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <Card className="border-0 shadow-2xl p-6 sm:p-10">
                  <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-10 mb-8 sm:mb-12 pb-8 sm:pb-10 border-b border-slate-50">
                    <div className="relative">
                      <UserAvatar user={user} avatarOverride={avatarPreview} size="2xl" />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-2 -right-2 bg-white p-2 sm:p-2.5 rounded-2xl shadow-xl border border-slate-100 text-primary-600 hover:text-primary-700 transition-all hover:scale-110 active:scale-95 z-20"
                      >
                        <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                        accept="image/*"
                      />
                    </div>
                    <div className="text-center md:text-left">
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Thông tin cá nhân</h2>
                      <p className="text-sm sm:text-base text-slate-400 font-medium">Cập nhật ảnh đại diện và thông tin cơ bản.</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-8">
                    {success && (
                      <div className="bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald px-6 py-4 rounded-2xl flex items-center space-x-3">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-bold">{success}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Tên hiển thị</label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            <UserIcon className="h-5 w-5" />
                          </div>
                          <Input 
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            className="pl-12 h-14 rounded-2xl"
                            placeholder="Nhập tên của bạn"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            <Mail className="h-5 w-5" />
                          </div>
                          <Input 
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="pl-12 h-14 rounded-2xl"
                            placeholder="your@email.com"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-8 flex justify-end">
                      <Button 
                        type="submit" 
                        className="h-14 px-10 rounded-2xl text-lg font-bold"
                        disabled={updating}
                      >
                        {updating ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </Button>
                    </div>
                  </form>

                  {/* Password Change Section */}
                  <div className="mt-16 pt-16 border-t border-slate-50">
                    <div className="flex items-center space-x-4 mb-10">
                      <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                        <Lock className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-slate-900">Đổi mật khẩu</h2>
                        <p className="text-slate-400 font-medium">Đảm bảo tài khoản của bạn luôn an toàn.</p>
                      </div>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-6 max-w-2xl">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Mật khẩu hiện tại</label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            <KeyRound className="h-5 w-5" />
                          </div>
                          <Input 
                            name="old_password"
                            type="password"
                            value={passwords.old_password}
                            onChange={handlePasswordChange}
                            className="pl-12 h-14 rounded-2xl bg-slate-50/50"
                            placeholder="••••••••"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Mật khẩu mới</label>
                          <Input 
                            name="new_password"
                            type="password"
                            value={passwords.new_password}
                            onChange={handlePasswordChange}
                            className="h-14 rounded-2xl bg-slate-50/50"
                            placeholder="Tối thiểu 6 ký tự"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Xác nhận mật khẩu</label>
                          <Input 
                            name="confirm_password"
                            type="password"
                            value={passwords.confirm_password}
                            onChange={handlePasswordChange}
                            className="h-14 rounded-2xl bg-slate-50/50"
                            placeholder="Nhập lại mật khẩu mới"
                          />
                        </div>
                      </div>

                      <div className="pt-4">
                        <Button 
                          type="submit" 
                          variant="outline"
                          className="h-14 px-10 rounded-2xl text-lg font-bold"
                          disabled={updating}
                        >
                          {updating ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
                        </Button>
                      </div>
                    </form>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="p-8 border-0 shadow-xl bg-white">
                    <div className="h-12 w-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mb-6">
                      <Flame className="h-6 w-6" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Chuỗi cao nhất</p>
                    <p className="text-3xl font-black text-slate-900">{user?.max_streak || 0} Ngày</p>
                  </Card>
                  <Card className="p-8 border-0 shadow-xl bg-white">
                    <div className="h-12 w-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mb-6">
                      <Trophy className="h-6 w-6" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kinh nghiệm</p>
                    <p className="text-3xl font-black text-slate-900">{user?.xp} XP</p>
                  </Card>
                  <Card className="p-8 border-0 shadow-xl bg-white">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Độ chính xác TB</p>
                    <p className="text-3xl font-black text-slate-900">{stats?.avg_score || 0}%</p>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card className="p-10 border-0 shadow-2xl">
                    <h3 className="text-xl font-black text-slate-900 mb-8">Huy hiệu đạt được</h3>
                    <div className="flex flex-wrap gap-4">
                      {stats?.badges.map((badge) => {
                        const icons: { [key: string]: any } = { Compass, Shield, Layout, Brain, GraduationCap, Sparkles };
                        const IconComponent = icons[badge.icon] || Trophy;
                        return (
                          <div key={badge.id} className="group relative">
                            <div className={`h-16 w-16 rounded-2xl flex items-center justify-center border-2 transition-all group-hover:scale-110 ${badge.earned ? 'bg-primary-50 border-primary-100 text-primary-600' : 'bg-slate-50 border-slate-100 text-slate-300 opacity-40 grayscale'}`}>
                              <IconComponent className="h-8 w-8" />
                            </div>
                            
                            {/* Tooltip */}
                            <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[11px] px-4 py-2.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap z-50 pointer-events-none font-black shadow-2xl translate-y-2 group-hover:translate-y-0 border border-slate-800">
                              <p className="text-white mb-1 tracking-wide">{badge.name}</p>
                              <p className={badge.earned ? 'text-accent-emerald' : 'text-slate-400'}>
                                {badge.earned ? '✓ ĐÃ MỞ KHÓA' : `🔒 ${badge.requirement.toUpperCase()}`}
                              </p>
                              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45 border-l border-t border-slate-800" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  <Card className="p-10 border-0 shadow-2xl">
                    <h3 className="text-xl font-black text-slate-900 mb-8">Kỹ năng thông thạo</h3>
                    <div className="space-y-6">
                      {skillXP.map((skill) => (
                        <div key={skill.id}>
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-sm font-bold text-slate-700">{skill.category_name}</span>
                            <span className="text-xs font-black text-primary-600">Cấp {skill.level}</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-primary-500 rounded-full" style={{ width: `${skill.xp % 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'quizzes' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-black text-slate-900">Quiz của tôi</h2>
                  <Link to="/create-quiz">
                    <Button className="rounded-2xl shadow-lg">
                      <PlusCircle className="h-5 w-5 mr-2" />
                      Tạo Quiz mới
                    </Button>
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {myQuizzes.map((quiz) => (
                    <Link key={quiz.id} to={`/quiz/${quiz.id}`}>
                      <Card className="p-6 hover:shadow-xl hover:border-primary-100 transition-all border-2 border-slate-50">
                        <div className="flex justify-between items-start mb-4">
                          <span className="px-2 py-1 bg-slate-50 rounded text-[10px] font-black text-slate-400 uppercase">{quiz.category_name}</span>
                          <span className="text-xs font-bold text-primary-600">{quiz.questions_count} câu</span>
                        </div>
                        <h3 className="text-xl font-black text-slate-800 mb-2">{quiz.title}</h3>
                        <p className="text-slate-500 text-sm line-clamp-2">{quiz.description}</p>
                      </Card>
                    </Link>
                  ))}
                  {myQuizzes.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                      <p className="text-slate-400 font-bold mb-4">Bạn chưa tạo bộ câu hỏi nào.</p>
                      <Link to="/create-quiz"><Button variant="outline">Tạo ngay</Button></Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'custom' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-black text-slate-900">Tùy chỉnh kho đồ</h2>
                  <Link to="/shop"><Button variant="outline">Cửa hàng</Button></Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {inventory.filter(i => i.item.item_type === 'FRAME').map((inv) => (
                    <Card key={inv.id} className={`p-6 rounded-[2.5rem] border-2 text-center ${inv.is_equipped ? 'border-primary-500 bg-primary-50/30' : 'border-slate-50'}`}>
                      <div className="h-24 w-24 relative mx-auto mb-6">
                        <UserAvatar 
                          user={{ 
                            ...user!, 
                            equipped_frame: inv.item.image,
                            frame_animation: inv.item.config?.animation || '' 
                          }} 
                          size="xl" 
                        />
                      </div>
                      <h4 className="font-black text-slate-800 mb-1">{inv.item.name}</h4>
                      <Button variant={inv.is_equipped ? "accent" : "outline"} className="w-full mt-4" onClick={() => handleEquip(inv.id)}>
                        {inv.is_equipped ? 'Gỡ bỏ' : 'Trang bị'}
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
