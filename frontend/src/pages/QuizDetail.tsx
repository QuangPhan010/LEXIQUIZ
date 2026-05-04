import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Navbar } from '../components/Navbar';
import { UserAvatar } from '../components/UserAvatar';
import { ChevronLeft, Info, HelpCircle, BarChart, Sparkles, Trash2, Lock, Globe, Settings, Play, Share2, X, Copy, CheckCircle2 } from 'lucide-react';
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
  
  // Host Room States
  const [showHostModal, setShowHostModal] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [roomPin, setRoomPin] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
      alert('Cập nhật trạng thái thất bại. Vui lòng thử lại.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!quiz) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa bộ câu hỏi này không? Hành động này không thể hoàn tác.')) return;
    
    setIsDeleting(true);
    try {
      await api.delete(`/quizzes/${quiz.id}/`);
      navigate('/');
    } catch (err) {
      console.error('Failed to delete quiz', err);
      alert('Xóa bộ câu hỏi thất bại. Vui lòng thử lại.');
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

  const handleHostLive = async () => {
    if (!quiz) return;
    setIsCreatingRoom(true);
    try {
      const response = await api.post(`/quizzes/${quiz.id}/create_room/`);
      setRoomPin(response.data.pin);
      setShowHostModal(true);
    } catch (err) {
      console.error('Failed to create room', err);
      alert('Tạo phòng thi đấu thất bại. Chỉ người tạo mới có thể tổ chức.');
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const copyJoinLink = () => {
    if (!roomPin) return;
    const link = `${window.location.origin}/join/${roomPin}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          Quay lại Khám phá
        </Link>

        <Card className="mb-10 relative overflow-hidden border-t-8 border-t-primary-600">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Sparkles className="h-32 w-32" />
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
            <div className="max-w-xl">
              <span className="inline-block px-4 py-1 bg-primary-100 text-primary-700 text-xs font-black uppercase tracking-widest rounded-full mb-6">
                Cuộc phiêu lưu đang chờ
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
              <p className="text-slate-500 text-xl font-medium leading-relaxed">{quiz.description || 'Người này có vẻ lười, không có ghi mô tả gì hết.'}</p>
            </div>
            <div className="shrink-0 flex flex-col gap-4">
              <Button 
                size="lg" 
                onClick={() => navigate(`/take/${quiz.id}`)}
                className="w-full md:w-auto px-12 py-6 text-xl rounded-3xl shadow-2xl"
              >
                <Play className="h-6 w-6 mr-3 fill-current" />
                Bắt đầu
              </Button>

              {user && quiz.creator === user.id && (
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={handleHostLive}
                  isLoading={isCreatingRoom}
                  className="w-full md:w-auto px-12 py-6 text-xl rounded-3xl border-2 border-primary-600 text-primary-600 hover:bg-primary-50"
                >
                  <Share2 className="h-6 w-6 mr-3" />Tạo phòng
                </Button>
              )}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="flex flex-col items-center text-center p-10 hover:border-primary-200 transition-colors">
            <div className="p-4 rounded-3xl bg-blue-50 text-blue-500 mb-6 shadow-sm">
              <HelpCircle className="h-8 w-8" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-2">{quiz.questions.length}</h3>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Câu hỏi</p>
          </Card>

          <Card className="flex flex-col items-center text-center p-10 hover:border-accent-emerald/20 transition-colors">
            <div className="p-4 rounded-3xl bg-accent-emerald/10 text-accent-emerald mb-6 shadow-sm">
              <BarChart className="h-8 w-8" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-2">Không giới hạn</h3>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Lượt làm lại</p>
          </Card>

          <Card className="flex flex-col items-center text-center p-10 hover:border-accent-amber/20 transition-colors">
            <div className="p-4 rounded-3xl bg-accent-amber/10 text-accent-amber mb-6 shadow-sm">
              <Info className="h-8 w-8" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-2">Tức thì</h3>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Phản hồi</p>
          </Card>
        </div>

        <div className="mt-16 bg-white rounded-3xl p-10 border border-slate-100 shadow-sm">
          <h2 className="text-2xl font-black mb-8 flex items-center text-slate-900">
            <Info className="h-6 w-6 mr-3 text-primary-500" />
            Quy tắc trò chơi
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-slate-500 font-medium">
            <div className="flex items-start space-x-4">
              <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 text-slate-400 font-bold">1</div>
              <p>Đọc kỹ từng câu hỏi. Sự chính xác là chìa khóa để đạt điểm cao!</p>
            </div>
            <div className="flex items-start space-x-4">
              <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 text-slate-400 font-bold">2</div>
              <p>Tin vào bản năng của bạn. Lựa chọn đầu tiên thường là đúng nhất.</p>
            </div>
            <div className="flex items-start space-x-4">
              <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 text-slate-400 font-bold">3</div>
              <p>Hoàn thành trong một lần làm. Hãy tập trung và giành lấy cúp vô địch!</p>
            </div>
            <div className="flex items-start space-x-4">
              <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 text-slate-400 font-bold">4</div>
              <p>Chúc bạn vui vẻ! Đây là để học tập và phát triển trí tuệ.</p>
            </div>
          </div>
        </div>

        {/* Creator Controls */}
        {user && quiz.creator === user.id && (
          <div className="mt-12 bg-white rounded-3xl p-10 border-2 border-dashed border-slate-200">
            <h2 className="text-2xl font-black mb-8 flex items-center text-slate-900">
              <Settings className="h-6 w-6 mr-3 text-primary-500" />
              Điều khiển của người tạo
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
                    Chuyển sang Riêng tư
                  </>
                ) : (
                  <>
                    <Globe className="h-5 w-5 mr-2" />
                    Chuyển sang Công khai
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
                Xóa Quiz
              </Button>
            </div>
            <p className="mt-6 text-sm text-slate-400 font-medium italic">
              {quiz.is_public 
                ? "Quiz này hiện đang công khai và mọi người đều có thể thấy." 
                : "Quiz này hiện đang riêng tư và chỉ bạn mới có thể thấy."}
            </p>
          </div>
        )}

        {/* Comments Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-black mb-10 text-slate-900 tracking-tight">Thảo luận</h2>
          
          {user && (
            <Card className="mb-10 p-6 border-0 shadow-xl bg-slate-50">
              <form onSubmit={handleAddComment} className="space-y-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Chia sẻ suy nghĩ của bạn về bộ câu hỏi này..."
                  className="w-full h-32 rounded-3xl p-6 bg-white border-0 shadow-inner focus:ring-4 focus:ring-primary-500/10 transition-all resize-none text-slate-700 font-medium"
                />
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={submittingComment || !newComment.trim()}
                    className="rounded-2xl px-8 h-12 font-bold"
                  >
                    Đăng bình luận
                  </Button>
                </div>
              </form>
            </Card>
          )}

          <div className="space-y-6">
            {quiz.comments && quiz.comments.length > 0 ? (
              quiz.comments.map((comment) => (
                <div key={comment.id} className="flex space-x-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <UserAvatar 
                    user={{ 
                      username: comment.username, 
                      avatar: comment.user_avatar, 
                      equipped_frame: comment.user_equipped_frame 
                    }} 
                    size="sm" 
                  />
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
                <p className="text-slate-400 font-bold">Chưa có bình luận nào. Hãy là người đầu tiên bắt đầu cuộc thảo luận!</p>
              </div>
            )}
          </div>
        </div>

        {/* Host Live Modal */}
        {showHostModal && roomPin && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <Card className="w-full max-w-sm p-8 border-0 shadow-2xl relative animate-in zoom-in-95 duration-300 bg-white">
              <button 
                onClick={() => setShowHostModal(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="text-center">
                <div className="inline-flex p-3 rounded-2xl bg-primary-50 text-primary-600 mb-4">
                  <Share2 className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-black mb-1 text-slate-900 tracking-tight">Mở phòng thách đấu</h2>
                <p className="text-slate-500 mb-6 text-sm font-medium">Anh em đã sẵn sàng chưa?</p>

                <div className="bg-slate-50 p-6 rounded-[2rem] mb-6 flex flex-col items-center border border-slate-100">
                  <div className="bg-white p-4 rounded-2xl shadow-sm mb-4 border border-slate-100">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/join/${roomPin}`)}`} 
                      alt="Join QR Code"
                      className="w-[150px] h-[150px]"
                    />
                  </div>
                  
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Game PIN</p>
                    <p className="text-4xl font-black text-primary-600 tracking-tighter">{roomPin}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button 
                    size="lg"
                    className="w-full h-14 text-lg rounded-2xl shadow-md"
                    onClick={() => navigate(`/host/${roomPin}`)}
                  >
                    Vào sảnh chờ
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full h-12 rounded-xl border-slate-200 font-bold text-sm"
                    onClick={copyJoinLink}
                  >
                    {copied ? <CheckCircle2 className="h-4 w-4 mr-2 text-accent-emerald" /> : <Copy className="h-4 w-4 mr-2 text-slate-400" />}
                    {copied ? 'Đã lấy link thành công!' : 'Lấy link rủ bạn bè'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default QuizDetail;
