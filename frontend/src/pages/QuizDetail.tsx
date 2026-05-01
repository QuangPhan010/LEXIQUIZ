import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Navbar } from '../components/Navbar';
import { ChevronLeft, Info, HelpCircle, BarChart, Sparkles, Trash2, Lock, Globe, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface QuizDetail {
  id: number;
  title: string;
  description: string;
  questions: any[];
  creator: number;
  is_public: boolean;
  category_name: string;
  comments: any[];
  avg_rating: number;
}

const QuizDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await api.get(`/quizzes/${id}/`);
        setQuiz(response.data);
      } catch (err) {
        console.error('Failed to fetch quiz', err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id, navigate]);

  const handleToggleStatus = async () => {
    if (!quiz) return;
    setIsUpdating(true);
    try {
      const response = await api.patch(`/quizzes/${quiz.id}/`, {
        is_public: !quiz.is_public
      });
      setQuiz({ ...quiz, is_public: response.data.is_public });
    } catch (err) {
      console.error('Failed to update quiz status', err);
      alert('Failed to update status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!quiz) return;
    if (!window.confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) return;
    
    setIsDeleting(true);
    try {
      await api.delete(`/quizzes/${quiz.id}/`);
      navigate('/');
    } catch (err) {
      console.error('Failed to delete quiz', err);
      alert('Failed to delete quiz. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await api.post('/comments/', {
        quiz: quiz?.id,
        text: newComment
      });
      if (quiz) {
        setQuiz({
          ...quiz,
          comments: [res.data, ...quiz.comments]
        });
      }
      setNewComment('');
    } catch (err) {
      console.error('Failed to add comment', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleRate = async (rating: number) => {
    setUserRating(rating);
    try {
      await api.post('/ratings/', {
        quiz: quiz?.id,
        rating: rating
      });
      // Refresh quiz to get new average
      const res = await api.get(`/quizzes/${quiz?.id}/`);
      setQuiz(res.data);
    } catch (err) {
      console.error('Failed to rate', err);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="h-12 w-12 animate-spin border-4 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  if (!quiz) return null;

  return (
    <div className="min-h-screen bg-mesh text-slate-900">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 pt-32 pb-12">
        <Link to="/" className="inline-flex items-center text-slate-400 hover:text-primary-600 font-bold mb-10 transition-colors group">
          <ChevronLeft className="h-5 w-5 mr-1 group-hover:-translate-x-1 transition-transform" />
          Back to Explorations
        </Link>

        <Card className="mb-10 relative overflow-hidden border-t-8 border-t-primary-600">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Sparkles className="h-32 w-32" />
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
            <div className="max-w-xl">
              <span className="inline-block px-4 py-1 bg-primary-100 text-primary-700 text-xs font-black uppercase tracking-widest rounded-full mb-6">
                Adventure awaits
              </span>
              <h1 className="text-4xl font-black mb-6 text-slate-900 tracking-tight leading-tight">{quiz.title}</h1>
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex items-center text-accent-amber">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRate(star)}
                      className="hover:scale-125 transition-transform"
                    >
                      <Sparkles className={`h-5 w-5 ${star <= (userRating || Math.round(quiz.avg_rating)) ? 'fill-accent-amber' : 'text-slate-200'}`} />
                    </button>
                  ))}
                  <span className="ml-2 text-slate-400 font-bold text-sm">{quiz.avg_rating} / 5</span>
                </div>
                <div className="h-4 w-px bg-slate-200" />
                <span className="text-slate-400 font-bold text-sm uppercase tracking-widest">{quiz.category_name}</span>
              </div>
              <p className="text-slate-500 text-xl font-medium leading-relaxed">{quiz.description || 'No description provided, but we know you can handle this! Get ready to test your knowledge.'}</p>
            </div>
            <div className="shrink-0">
              <Button 
                size="lg" 
                onClick={() => navigate(`/take/${quiz.id}`)}
                className="w-full md:w-auto px-12 py-6 text-xl rounded-3xl shadow-2xl"
              >
                Start Quiz
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="flex flex-col items-center text-center p-10 hover:border-primary-200 transition-colors">
            <div className="p-4 rounded-3xl bg-blue-50 text-blue-500 mb-6 shadow-sm">
              <HelpCircle className="h-8 w-8" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-2">{quiz.questions.length}</h3>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Questions</p>
          </Card>

          <Card className="flex flex-col items-center text-center p-10 hover:border-accent-emerald/20 transition-colors">
            <div className="p-4 rounded-3xl bg-accent-emerald/10 text-accent-emerald mb-6 shadow-sm">
              <BarChart className="h-8 w-8" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-2">Unlimited</h3>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Retries</p>
          </Card>

          <Card className="flex flex-col items-center text-center p-10 hover:border-accent-amber/20 transition-colors">
            <div className="p-4 rounded-3xl bg-accent-amber/10 text-accent-amber mb-6 shadow-sm">
              <Info className="h-8 w-8" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-2">Instant</h3>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Feedback</p>
          </Card>
        </div>

        <div className="mt-16 bg-white rounded-3xl p-10 border border-slate-100 shadow-sm">
          <h2 className="text-2xl font-black mb-8 flex items-center text-slate-900">
            <Info className="h-6 w-6 mr-3 text-primary-500" />
            Rules of the Game
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-slate-500 font-medium">
            <div className="flex items-start space-x-4">
              <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 text-slate-400 font-bold">1</div>
              <p>Read each question carefully. Precision is key to high scores!</p>
            </div>
            <div className="flex items-start space-x-4">
              <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 text-slate-400 font-bold">2</div>
              <p>Trust your instincts. Your first choice is often the right one.</p>
            </div>
            <div className="flex items-start space-x-4">
              <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 text-slate-400 font-bold">3</div>
              <p>Finish in one sitting. Stay focused and win the trophy!</p>
            </div>
            <div className="flex items-start space-x-4">
              <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 text-slate-400 font-bold">4</div>
              <p>Have fun! This is about learning and growing your brain.</p>
            </div>
          </div>
        </div>
        {/* Creator Controls */}
        {user && quiz.creator === user.id && (
          <div className="mt-12 bg-white rounded-3xl p-10 border-2 border-dashed border-slate-200">
            <h2 className="text-2xl font-black mb-8 flex items-center text-slate-900">
              <Settings className="h-6 w-6 mr-3 text-primary-500" />
              Creator Controls
            </h2>
            <div className="flex flex-wrap gap-4">
              <Button 
                variant="outline" 
                onClick={handleToggleStatus} 
                isLoading={isUpdating}
                className="flex-1 md:flex-none"
              >
                {quiz.is_public ? (
                  <>
                    <Lock className="h-5 w-5 mr-2" />
                    Make Private
                  </>
                ) : (
                  <>
                    <Globe className="h-5 w-5 mr-2" />
                    Make Public
                  </>
                )}
              </Button>
              <Button 
                variant="danger" 
                onClick={handleDelete} 
                isLoading={isDeleting}
                className="flex-1 md:flex-none"
              >
                <Trash2 className="h-5 w-5 mr-2" />
                Delete Quiz
              </Button>
            </div>
            <p className="mt-6 text-sm text-slate-400 font-medium italic">
              {quiz.is_public 
                ? "This quiz is currently public and visible to everyone." 
                : "This quiz is currently private and only you can see it."}
            </p>
          </div>
        )}

        {/* Comments Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-black mb-10 text-slate-900 tracking-tight">Discussion</h2>
          
          {user && (
            <Card className="mb-10 p-6 border-0 shadow-xl bg-slate-50">
              <form onSubmit={handleAddComment} className="space-y-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts on this quiz..."
                  className="w-full h-32 rounded-3xl p-6 bg-white border-0 shadow-inner focus:ring-4 focus:ring-primary-500/10 transition-all resize-none text-slate-700 font-medium"
                />
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={submittingComment || !newComment.trim()}
                    className="rounded-2xl px-8 h-12 font-bold"
                  >
                    Post Comment
                  </Button>
                </div>
              </form>
            </Card>
          )}

          <div className="space-y-6">
            {quiz.comments && quiz.comments.length > 0 ? (
              quiz.comments.map((comment) => (
                <div key={comment.id} className="flex space-x-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="h-14 w-14 rounded-2xl bg-white shadow-lg overflow-hidden shrink-0">
                    {comment.user_avatar ? (
                      <img src={comment.user_avatar} alt={comment.username} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-200 bg-slate-50">
                        <Sparkles className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-black text-slate-900">{comment.username}</p>
                        <p className="text-[10px] font-bold text-slate-300 uppercase">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-slate-600 font-medium leading-relaxed">{comment.text}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-white/50 backdrop-blur-xl rounded-[3rem] border-2 border-dashed border-slate-200">
                <HelpCircle className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-bold">No comments yet. Be the first to start the discussion!</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default QuizDetail;
