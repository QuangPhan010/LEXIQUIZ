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
  Award
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
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
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
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleClaimQuest = async (questId: number) => {
    try {
      const res = await api.post(`/quests/${questId}/claim/`);
      setSuccess(`Claimed ${res.data.coins} coins and ${res.data.xp} XP!`);
      // Update local state
      setQuests(quests.map(q => q.id === questId ? { ...q, is_claimed: true } : q));
      refreshUser();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to claim quest', err);
    }
  };

  const handleEquip = async (itemId: number) => {
    try {
      await api.post(`/inventory/${itemId}/equip/`);
      const invRes = await api.get('/inventory/');
      setInventory(invRes.data);
      refreshUser();
      setSuccess('Customization updated!');
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

  const xpProgress = (user?.xp % 100);

  return (
    <div className="min-h-screen bg-mesh text-slate-900">
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-4 pt-32 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Identity & Progress */}
          <div className="lg:col-span-1 space-y-8">
            <Card className="text-center py-10 relative overflow-hidden border-0 shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-500 to-accent-violet" />
              
              <div className="relative inline-block mb-6">
                <UserAvatar user={user} avatarOverride={avatarPreview} size="2xl" />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 bg-white p-2.5 rounded-2xl shadow-xl border border-slate-100 text-primary-600 hover:text-primary-700 transition-all hover:scale-110 active:scale-95 z-20"
                >
                  <Camera className="h-5 w-5" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept="image/*"
                />
              </div>

              <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">{user?.username}</h1>
              <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mb-8">{user?.email}</p>

              <div className="bg-slate-50/80 rounded-3xl p-6 mx-4 border border-slate-100">
                <div className="flex justify-between items-end mb-4">
                  <div className="text-left">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rank</p>
                    <p className="text-2xl font-black text-primary-600">Level {user?.level}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1 justify-end text-accent-amber mb-1">
                      <Zap className="h-4 w-4 fill-accent-amber" />
                      <span className="text-lg font-black">{user?.xp} XP</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{100 - (user?.xp % 100)} XP to Level {user?.level + 1}</p>
                  </div>
                </div>
                
                <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden p-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-primary-500 to-accent-violet rounded-full transition-all duration-1000"
                    style={{ width: `${user?.xp % 100}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 mt-6">
                  <div className="bg-orange-50 rounded-2xl p-3 flex items-center space-x-3 border border-orange-100/50">
                    <div className="bg-orange-500 text-white p-1.5 rounded-lg">
                      <Flame className="h-4 w-4 fill-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest leading-none">Streak</p>
                      <p className="text-sm font-black text-orange-600">{user?.streak_count || 0} Days</p>
                    </div>
                  </div>
                  <div className="bg-amber-50 rounded-2xl p-3 flex items-center space-x-3 border border-amber-100/50">
                    <div className="bg-amber-500 text-white p-1.5 rounded-lg">
                      <Coins className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest leading-none">Coins</p>
                      <p className="text-sm font-black text-amber-600">{user?.coins || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card className="text-center p-6 border-0 shadow-lg">
                <div className="bg-primary-50 w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 text-primary-600">
                  <BookOpen className="h-5 w-5" />
                </div>
                <p className="text-2xl font-black text-slate-900">{stats?.quizzes_created || 0}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Created</p>
              </Card>
              <Card className="text-center p-6 border-0 shadow-lg">
                <div className="bg-accent-violet/10 w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 text-accent-violet">
                  <Activity className="h-5 w-5" />
                </div>
                <p className="text-2xl font-black text-slate-900">{stats?.results_taken || 0}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed</p>
              </Card>
            </div>
            
            <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-slate-900 to-slate-800 text-white">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mastery Level</p>
                <Trophy className="h-5 w-5 text-accent-amber" />
              </div>
              <p className="text-4xl font-black mb-1">{stats?.avg_score || 0}%</p>
              <p className="text-slate-400 text-sm font-medium">Average Accuracy</p>
            </Card>

            {/* Badges Section */}
            <Card className="p-8 border-0 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Achievements</h3>
                <span className="bg-primary-50 text-primary-600 px-2 py-0.5 rounded-lg text-[10px] font-black">{stats?.badges.length || 0}</span>
              </div>
              
              <div className="flex flex-wrap gap-4">
                {stats?.badges && stats.badges.length > 0 ? (
                  stats.badges.map((badge) => {
                    const icons: { [key: string]: any } = {
                      Compass,
                      Shield,
                      Layout,
                      Brain,
                      GraduationCap,
                      Sparkles
                    };
                    const IconComponent = icons[badge.icon] || Trophy;

                    const colorMapObj: { [key: string]: string } = {
                      blue: 'bg-blue-50 text-blue-600 border-blue-100',
                      purple: 'bg-purple-50 text-purple-600 border-purple-100',
                      emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                      rose: 'bg-rose-50 text-rose-500 border-rose-100',
                      amber: 'bg-amber-50 text-amber-600 border-amber-100',
                      indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
                    };
                    const colorClass = colorMapObj[badge.color] || 'bg-slate-50 text-slate-600 border-slate-100';

                    return (
                      <div key={badge.id} className="group relative">
                        <div className={`flex flex-col items-center justify-center h-16 w-16 rounded-2xl border-2 transition-all group-hover:scale-110 ${
                          badge.earned ? colorClass : 'bg-slate-100 text-slate-400 border-slate-200 grayscale opacity-40'
                        }`}>
                          <IconComponent className="h-7 w-7" />
                        </div>
                        
                        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[11px] px-4 py-2.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap z-50 pointer-events-none font-black shadow-2xl translate-y-2 group-hover:translate-y-0 border border-slate-800">
                          <p className="text-white mb-1 tracking-wide">{badge.name}</p>
                          <p className={badge.earned ? 'text-accent-emerald' : 'text-slate-400'}>
                            {badge.earned ? '✓ UNLOCKED' : `🔒 ${badge.requirement.toUpperCase()}`}
                          </p>
                          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45 border-l border-t border-slate-800" />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="w-full text-center py-4 text-slate-400 text-xs font-medium italic">
                    No badges earned yet. Keep playing!
                  </div>
                )}
              </div>
            </Card>

            {/* Skill Tree Summary */}
            <Card className="p-8 border-0 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Skill Mastery</h3>
                <TrendingUp className="h-4 w-4 text-primary-500" />
              </div>
              
              <div className="space-y-6">
                {skillXP.length > 0 ? (
                  skillXP.map((skill) => (
                    <div key={skill.id}>
                      <div className="flex justify-between items-end mb-2">
                        <div>
                          <p className="text-xs font-black text-slate-900">{skill.category_name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Level {skill.level}</p>
                        </div>
                        <p className="text-[10px] font-black text-primary-600">{skill.xp} XP</p>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary-500 rounded-full transition-all duration-1000"
                          style={{ width: `${skill.xp % 100}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-slate-400 text-xs font-medium italic">
                    Take quizzes in different categories to build your skill tree!
                  </div>
                )}
                
                <Link to="/skills" className="block text-center pt-2">
                  <Button variant="outline" size="sm" className="w-full rounded-xl text-[10px] h-9 border-slate-100 hover:bg-slate-50 text-slate-500">
                    View Full Skill Tree <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

          {/* Right Column: Edit Profile */}
          <div className="lg:col-span-2">
            <Card className="h-full border-0 shadow-2xl p-10">
              <div className="flex items-center space-x-4 mb-10">
                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Profile Settings</h2>
                  <p className="text-slate-400 font-medium">Manage your personal information and identity.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {success && (
                  <div className="bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald px-6 py-4 rounded-2xl flex items-center space-x-3 animate-in fade-in slide-in-from-top-4">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-bold">{success}</span>
                  </div>
                )}

                {error && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-500 px-6 py-4 rounded-2xl flex items-center space-x-3 animate-in fade-in slide-in-from-top-4">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-bold">{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <UserIcon className="h-5 w-5" />
                      </div>
                      <Input 
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className="pl-12 h-14 rounded-2xl"
                        placeholder="Enter your username"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
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

                <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="text-slate-400 text-sm">
                    <p className="font-medium">Account Security</p>
                    <p>To change your password, please contact support.</p>
                  </div>
                  <Button 
                    type="submit" 
                    className="h-14 px-8 rounded-2xl text-lg font-bold min-w-[200px]"
                    disabled={updating}
                  >
                    {updating ? (
                      <div className="h-5 w-5 animate-spin border-2 border-white border-t-transparent rounded-full mx-auto" />
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-3" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>

              {/* My Quizzes Section */}
              <div className="mt-16">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900">My Quizzes</h2>
                      <p className="text-slate-400 font-medium">Quizzes you've designed and shared.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {myQuizzes.length > 0 ? (
                    myQuizzes.map((quiz) => (
                      <Link key={quiz.id} to={`/quiz/${quiz.id}`}>
                        <div className="group p-6 rounded-[32px] border-2 border-slate-50 bg-white hover:border-primary-100 hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-300">
                          <div className="flex justify-between items-start mb-4">
                            <div className="bg-slate-50 px-3 py-1 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              {quiz.category_name || 'General'}
                            </div>
                            <div className="flex items-center space-x-1 text-slate-300 group-hover:text-primary-500 transition-colors">
                              <span className="text-xs font-bold">{quiz.questions_count} Qs</span>
                            </div>
                          </div>
                          <h3 className="text-xl font-black text-slate-800 mb-2 group-hover:text-primary-600 transition-colors line-clamp-1">{quiz.title}</h3>
                          <p className="text-slate-500 text-sm line-clamp-2 mb-6 h-10">{quiz.description || 'No description provided.'}</p>
                          <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                              {new Date(quiz.created_at).toLocaleDateString()}
                            </span>
                            <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-primary-600 group-hover:text-white transition-all">
                              <Activity className="h-4 w-4" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="col-span-full py-12 text-center bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-200">
                      <p className="text-slate-400 font-bold mb-4">You haven't created any quizzes yet.</p>
                      <Link to="/create-quiz">
                        <Button variant="outline" className="rounded-xl">Create Your First Quiz</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Avatar Frames / Customization Section */}
              <div className="mt-16 pt-16 border-t border-slate-100">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="h-12 w-12 rounded-2xl bg-accent-violet/10 flex items-center justify-center text-accent-violet">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">Customization</h2>
                    <p className="text-slate-400 font-medium">Equip frames and themes you've unlocked.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {inventory.filter(i => i.item.item_type === 'FRAME').length > 0 ? (
                    inventory.filter(i => i.item.item_type === 'FRAME').map((inv) => (
                      <div key={inv.id} className={`group p-6 rounded-[32px] border-2 transition-all duration-300 ${inv.is_equipped ? 'border-primary-500 bg-primary-50/30' : 'border-slate-50 bg-white hover:border-slate-200'}`}>
                        <div className="flex flex-col items-center text-center">
                          <div className="h-24 w-24 relative mb-4">
                            <UserAvatar user={{ ...user!, equipped_frame: inv.item.image }} size="xl" />
                          </div>
                          <h4 className="font-black text-slate-800 mb-1">{inv.item.name}</h4>
                          <p className="text-xs text-slate-400 mb-6">{inv.item.description}</p>
                          <Button 
                            variant={inv.is_equipped ? "accent" : "outline"} 
                            size="sm" 
                            className="w-full rounded-xl font-bold"
                            onClick={() => handleEquip(inv.id)}
                          >
                            {inv.is_equipped ? 'Unequip' : 'Equip'}
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-12 text-center bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-200">
                      <p className="text-slate-400 font-bold mb-4">No frames unlocked yet.</p>
                      <Link to="/shop">
                        <Button variant="outline" className="rounded-xl">Visit LexiShop</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
