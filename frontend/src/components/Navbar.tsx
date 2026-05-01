import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import { LogOut, History, BookOpen, PlusCircle, User as UserIcon } from 'lucide-react';

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
                    Create
                  </Button>
                </Link>
                <Link to="/history" className="hidden sm:block">
                  <Button variant="ghost" size="sm">
                    <History className="h-4 w-4 mr-2" />
                    History
                  </Button>
                </Link>
                <div className="flex items-center space-x-2 pl-4 border-l border-slate-100">
                  <div className="hidden md:block text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Learner</p>
                    <p className="text-sm font-bold text-slate-900">Explorer</p>
                  </div>
                  <div className="h-10 w-10 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-600">
                    <UserIcon className="h-5 w-5" />
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-400 hover:text-rose-500">
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
