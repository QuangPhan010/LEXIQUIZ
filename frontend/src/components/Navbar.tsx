import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import { LogOut, History, BookOpen, PlusCircle, User as UserIcon, Zap, Trophy, ShoppingBag, Brain, Layout, Flame, Target } from 'lucide-react';
import { UserAvatar } from './UserAvatar';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="bg-gradient-to-tr from-primary-600 to-accent-violet p-2.5 rounded-2xl group-hover:rotate-6 transition-transform shadow-lg shadow-primary-500/20">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-black bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent tracking-tight">
              LEXIQUIZ
            </span>
          </Link>

          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <Link to="/create-quiz" className="hidden sm:block">
                  <Button variant="accent" size="sm">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Tạo mới
                  </Button>
                </Link>
                <Link to="/dashboard" className="hidden sm:block">
                  <Button variant="ghost" size="sm">
                    <Layout className="h-4 w-4 mr-2" />
                    Bảng điều khiển
                  </Button>
                </Link>
                <Link to="/quests" className="hidden sm:block">
                  <Button variant="ghost" size="sm">
                    <Target className="h-4 w-4 mr-2" />
                    Nhiệm vụ
                  </Button>
                </Link>
                <Link to="/leaderboard" className="hidden sm:block">
                  <Button variant="ghost" size="sm">
                    <Trophy className="h-4 w-4 mr-2" />
                    Xếp hạng
                  </Button>
                </Link>
                <Link to="/shop" className="hidden sm:block">
                  <Button variant="ghost" size="sm">
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Cửa hàng
                  </Button>
                </Link>
                <Link to="/history" className="hidden sm:block">
                  <Button variant="ghost" size="sm">
                    <History className="h-4 w-4 mr-2" />
                    Lịch sử
                  </Button>
                </Link>
                  <Link to="/profile" className="flex items-center space-x-2 pl-4 border-l border-slate-100">
                    <div className="hidden md:block text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <Flame className={`h-3 w-3 ${user.is_streak_active ? 'text-orange-500 fill-orange-500' : 'text-slate-300 fill-slate-300'}`} />
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${user.is_streak_active ? 'text-orange-600' : 'text-slate-400'}`}>
                          Chuỗi {user.streak_count || 0}
                        </p>
                      </div>
                      <p className="text-sm font-black text-slate-900">Cấp {user.level || 1} • {user.xp} XP</p>
                    </div>
                    <UserAvatar user={user} size="md" className="group-hover/avatar:scale-105 transition-transform" />
                  </Link>
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-400 hover:text-rose-500">
                    <LogOut className="h-5 w-5" />
                  </Button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">Đăng nhập</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Đăng ký</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
