import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Navbar } from '../components/Navbar';
import { Trophy, Clock, Play, Sparkles, Book, Tag, ChevronRight, Filter } from 'lucide-react';

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
}

const Home: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

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
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-white mb-6 animate-bounce">
            <Sparkles className="h-4 w-4 text-accent-amber" />
            <span className="text-sm font-bold text-slate-600">Level up your skills today!</span>
          </div>
          <h1 className="text-5xl font-black tracking-tight sm:text-6xl mb-6 bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-transparent">
            Ready for a <span className="text-primary-600 underline decoration-accent-pink/30 decoration-8 underline-offset-4">Challenge?</span>
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed">
            Pick a topic, test your knowledge, and earn your bragging rights! 🚀
          </p>
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
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`h-8 w-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400`}>
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
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
