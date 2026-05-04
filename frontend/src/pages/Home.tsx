import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Navbar } from '../components/Navbar';
import { Trophy, Clock, Play, Sparkles, Book, Tag, ChevronRight, Filter, Sword, X, Plus, Hash, Zap } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  icon: string;
  quizzes_count: number;
}

interface Quiz {
  id: number;
  title: string;
  description: string;
  questions_count: number;
  created_at: string;
  category_name?: string;
  tags?: string;
  creator_username?: string;
  creator_avatar?: string | null;
}

const Home: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDuelModal, setShowDuelModal] = useState(false);
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [quizzesRes, categoriesRes] = await Promise.all([
          api.get('/quizzes/'),
          api.get('/categories/')
        ]);
        setQuizzes(quizzesRes.data);
        setCategories(categoriesRes.data);
      } catch (err) {
        console.error('Failed to fetch data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreateRoom = () => {
    // Generate a random 6-digit room code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    navigate(`/duel/${code}`);
  };

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      navigate(`/duel/${roomId.trim()}`);
    }
  };

  const filteredQuizzes = selectedCategory 
    ? quizzes.filter(q => q.category_name === categories.find(c => c.id === selectedCategory)?.name)
    : quizzes;

  const accents = [
    'border-t-accent-pink',
    'border-t-accent-amber',
    'border-t-accent-emerald',
    'border-t-primary-500',
    'border-t-accent-violet'
  ];

  return (
    <div className="min-h-screen bg-mesh text-slate-900">
      <Navbar />

      {/* Live Duel Modal */}
      {showDuelModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowDuelModal(false); }}
        >
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            {/* Header */}
            <div className="relative bg-primary-600 p-6 text-white overflow-hidden">
              <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" />
              <div className="absolute -right-2 -bottom-8 h-24 w-24 rounded-full bg-white/10" />
              <button
                onClick={() => setShowDuelModal(false)}
                className="absolute top-4 right-4 h-6 w-6 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
              <div className="relative">
                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                  <Sword className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black tracking-tight">Live Duel</h2>
                <p className="text-primary-100 text-xs mt-1">Real-time battle awaits!</p>
              </div>
            </div>

            {/* Body */}
            <div className="p-8 space-y-4">
              {/* Create Room */}
              <button
                onClick={handleCreateRoom}
                className="w-full group p-5 rounded-2xl border-2 border-slate-100 hover:border-rose-200 hover:bg-rose-50/50 transition-all duration-200 text-left flex items-center space-x-4"
              >
                <div className="h-12 w-12 rounded-xl bg-rose-100 group-hover:bg-rose-200 flex items-center justify-center text-rose-500 transition-colors shrink-0">
                  <Plus className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-black text-slate-900">Create a Room</p>
                  <p className="text-sm text-slate-400">Get a code and invite your friends</p>
                </div>
                <Zap className="h-5 w-5 text-rose-400 ml-auto group-hover:text-rose-500 transition-colors" />
              </button>

              {/* Divider */}
              <div className="flex items-center space-x-3">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">or join</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              {/* Join Room */}
              <div className="p-5 rounded-2xl border-2 border-slate-100 space-y-3">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="h-12 w-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-500 shrink-0">
                    <Hash className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-black text-slate-900">Join a Room</p>
                    <p className="text-sm text-slate-400">Enter the room code below</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                    placeholder="Room code (e.g. AB12CD)"
                    maxLength={8}
                    className="flex-1 h-12 px-4 rounded-xl border-2 border-slate-100 focus:border-primary-400 outline-none font-bold tracking-widest text-slate-800 placeholder:font-normal placeholder:tracking-normal bg-slate-50"
                    autoFocus
                  />
                  <Button
                    onClick={handleJoinRoom}
                    disabled={!roomId.trim()}
                    className="h-12 px-6 rounded-xl font-bold shrink-0"
                  >
                    Join
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-white mb-6 animate-bounce">
            <Sparkles className="h-4 w-4 text-accent-amber" />
            <span className="text-sm font-bold text-slate-600">Level up your skills today!</span>
          </div>
          <h1 className="text-5xl font-black tracking-tight sm:text-6xl mb-6 bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-transparent">
            Ready for a <span className="text-primary-600 underline decoration-accent-pink/30 decoration-8 underline-offset-4">Challenge?</span>
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed mb-10">
            Pick a topic, test your knowledge, and earn your bragging rights! 🚀
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16">
            <Link to="/create-quiz" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto rounded-2xl h-16 px-10 text-lg shadow-xl shadow-primary-500/10">
                Create Quiz
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full sm:w-auto rounded-2xl h-16 px-10 text-lg border-2 border-slate-100 hover:border-rose-500/20 hover:bg-rose-50/50 transition-all"
              onClick={() => { setRoomId(''); setShowDuelModal(true); }}
            >
              <Sword className="h-5 w-5 mr-3 text-rose-500" />
              Live Duel
            </Button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="mb-12 overflow-x-auto pb-4 hide-scrollbar">
          <div className="flex items-center space-x-4 min-w-max px-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-6 py-3 rounded-2xl font-bold transition-all duration-300 flex items-center space-x-2 ${
                selectedCategory === null 
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' 
                : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>All Quizzes</span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-6 py-3 rounded-2xl font-bold transition-all duration-300 flex items-center space-x-2 ${
                  selectedCategory === cat.id 
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' 
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
                }`}
              >
                <span>{cat.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedCategory === cat.id ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {cat.quizzes_count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-72 rounded-3xl bg-white border border-slate-100 animate-pulse" />
            ))}
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <Card className="text-center py-24 bg-white/50 border-dashed border-2">
            <Trophy className="h-20 w-20 text-slate-200 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-slate-800">No quizzes found</h3>
            <p className="text-slate-500 mt-2">Try selecting another category or create your own!</p>
            <Link to="/create-quiz" className="mt-8 inline-block">
              <Button variant="accent">Create a Quiz</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredQuizzes.map((quiz, index) => (
              <Card key={quiz.id} className={`flex flex-col h-full group hover:-translate-y-2 border-t-4 ${accents[index % accents.length]}`}>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                        {quiz.category_name || 'General'}
                      </div>
                      <div className="flex items-center space-x-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                        <Book className="h-4 w-4" />
                        <span>{quiz.questions_count} Qs</span>
                      </div>
                    </div>
                    <div className="flex items-center text-slate-400 text-[10px] font-medium">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(quiz.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <h2 className="text-2xl font-black mb-3 text-slate-800 group-hover:text-primary-600 transition-colors leading-tight">
                    {quiz.title}
                  </h2>
                  <p className="text-slate-500 text-base line-clamp-3 mb-6">
                    {quiz.description || 'Time to show what you know! Jump in and take this challenge.'}
                  </p>
                  
                  {quiz.tags && (
                    <div className="flex flex-wrap gap-2 mb-8">
                      {quiz.tags.split(',').map((tag, i) => (
                        <span key={i} className="flex items-center text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                          <Tag className="h-2 w-2 mr-1" />
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                  {/* Author */}
                  <div className="flex items-center space-x-2">
                    {quiz.creator_avatar ? (
                      <img
                        src={quiz.creator_avatar}
                        alt={quiz.creator_username}
                        className="h-8 w-8 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-400 to-accent-violet flex items-center justify-center text-white text-[11px] font-black shadow-sm">
                        {(quiz.creator_username?.[0] ?? '?').toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-[11px] text-slate-400 leading-none">by</p>
                      <p className="text-xs font-bold text-slate-600 leading-tight">{quiz.creator_username ?? 'Unknown'}</p>
                    </div>
                  </div>
                  <Link to={`/quiz/${quiz.id}`}>
                    <Button variant="primary" size="sm" className="rounded-xl group/btn">
                      Start Quiz
                      <Play className="h-4 w-4 ml-2 fill-current group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
