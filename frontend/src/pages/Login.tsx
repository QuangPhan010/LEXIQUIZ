import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { LogIn, Sparkles } from 'lucide-react';

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
      setError(err.response?.data?.detail || 'Oops! Wrong username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-mesh overflow-hidden relative">
      {/* Playful Floating Elements */}
      <div className="absolute top-10 left-10 h-20 w-20 bg-primary-100 rounded-full blur-3xl opacity-50 animate-pulse" />
      <div className="absolute bottom-10 right-10 h-32 w-32 bg-accent-pink/10 rounded-full blur-3xl opacity-50" />

      <div className="w-full max-w-md relative">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center space-x-2 mb-8 group">
            <div className="bg-primary-600 p-2 rounded-xl group-hover:rotate-12 transition-transform shadow-lg shadow-primary-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              LEXIQUIZ
            </span>
          </Link>
          <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Welcome back!</h1>
          <p className="text-slate-500 font-medium">Ready to continue your learning journey?</p>
        </div>

        <Card className="shadow-2xl shadow-primary-500/10 border-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Username"
              placeholder="Your super nickname"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <div className="space-y-1">
              <Input
                label="Password"
                type="password"
                placeholder="Your secret code"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="flex justify-end">
                <button type="button" className="text-sm font-bold text-primary-600 hover:text-primary-700">Forgot it?</button>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 text-rose-600 text-sm font-bold border border-rose-100 animate-in fade-in zoom-in-95 duration-300">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full py-4 text-lg" isLoading={loading}>
              Let's Go!
              <LogIn className="h-5 w-5 ml-2" />
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-50 text-center">
            <p className="text-slate-500 font-bold">
              New here?{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-700 underline decoration-2 underline-offset-4">
                Join the fun!
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
