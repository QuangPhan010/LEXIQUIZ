import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import { 
  LogOut, 
  History, 
  BookOpen, 
  PlusCircle, 
  User as UserIcon, 
  Zap, 
  Trophy, 
  ShoppingBag, 
  Brain, 
  Layout, 
  Flame, 
  Target,
  Menu,
  X
} from 'lucide-react';
import { UserAvatar } from './UserAvatar';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
  };

  const navLinks = [
    { to: '/create-quiz', label: 'Tạo mới', icon: PlusCircle, variant: 'accent' as const },
    { to: '/dashboard', label: 'Bảng điều khiển', icon: Layout },
    { to: '/quests', label: 'Nhiệm vụ', icon: Target },
    { to: '/leaderboard', label: 'Xếp hạng', icon: Trophy },
    { to: '/shop', label: 'Cửa hàng', icon: ShoppingBag },
    { to: '/history', label: 'Lịch sử', icon: History },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 h-24 sm:h-28 flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-4 group" onClick={() => setIsMenuOpen(false)}>
            <div className="group-hover:rotate-6 transition-transform">
              <img src="/Lexi_logo.svg" alt="LexiQuiz Logo" className="h-20 w-20 sm:h-24 sm:w-24" />
            </div>
            <span className="text-2xl font-black bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent tracking-tight">
              LexiQuiz
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {user ? (
              <>
                {navLinks.map((link) => (
                  <Link key={link.to} to={link.to}>
                    <Button 
                      variant={link.variant || (isActive(link.to) ? 'primary' : 'ghost')} 
                      size="sm"
                      className={link.variant ? '' : isActive(link.to) ? 'bg-primary-50 text-primary-600' : ''}
                    >
                      <link.icon className="h-4 w-4 mr-2" />
                      {link.label}
                    </Button>
                  </Link>
                ))}
                
                <Link to="/profile" className="flex items-center space-x-2 pl-4 border-l border-slate-100 ml-2 group/avatar">
                  <div className="hidden xl:block text-right">
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
                
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-400 hover:text-rose-500 ml-1">
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

          {/* Mobile Menu Toggle */}
          <div className="flex lg:hidden items-center space-x-4">
            {user && (
              <Link to="/profile" className="flex items-center space-x-2">
                 <UserAvatar user={user} size="sm" />
              </Link>
            )}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="lg:hidden absolute top-20 left-0 right-0 bg-white border-b border-slate-100 shadow-2xl animate-in slide-in-from-top duration-300">
          <div className="px-4 py-6 space-y-3">
            {user ? (
              <>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-slate-50 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cấp độ</p>
                    <p className="text-lg font-black text-slate-900">{user.level || 1}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Chuỗi</p>
                    <div className="flex items-center space-x-1">
                      <Flame className={`h-4 w-4 ${user.is_streak_active ? 'text-orange-500 fill-orange-500' : 'text-slate-300 fill-slate-300'}`} />
                      <p className="text-lg font-black text-slate-900">{user.streak_count || 0}</p>
                    </div>
                  </div>
                </div>

                {navLinks.map((link) => (
                  <Link 
                    key={link.to} 
                    to={link.to} 
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-4 p-4 rounded-2xl transition-all ${
                      isActive(link.to) 
                        ? 'bg-primary-50 text-primary-600 font-bold' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${isActive(link.to) ? 'bg-primary-100' : 'bg-slate-100'}`}>
                      <link.icon className="h-5 w-5" />
                    </div>
                    <span>{link.label}</span>
                  </Link>
                ))}
                
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-4 p-4 rounded-2xl text-rose-500 hover:bg-rose-50 transition-all mt-4 border-t border-slate-50 pt-6"
                >
                  <div className="p-2 rounded-xl bg-rose-100">
                    <LogOut className="h-5 w-5" />
                  </div>
                  <span className="font-bold">Đăng xuất</span>
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block">
                  <Button variant="ghost" className="w-full h-12 justify-center">Đăng nhập</Button>
                </Link>
                <Link to="/register" onClick={() => setIsMenuOpen(false)} className="block">
                  <Button className="w-full h-12 justify-center">Đăng ký</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
