import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Users, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  Timer, 
  Trophy, 
  Sword,
  Target,
  Flame,
  Star,
  Skull
} from 'lucide-react';
import { OrderingQuestion } from '../components/quiz/OrderingQuestion';
import { MatchingQuestion } from '../components/quiz/MatchingQuestion';

interface Player {
  username: string;
  avatar: string | null;
  score: number;
  is_host: boolean;
}

const GamePlay: React.FC = () => {
  const { pin } = useParams<{ pin: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  // States
  const [gameState, setGameState] = useState<'lobby' | 'question' | 'reveal' | 'finished'>('lobby');
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<{ is_correct: boolean; points: number } | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [combo, setCombo] = useState(0);
  const [lastResults, setLastResults] = useState<any>(null);
  
  const socketRef = useRef<WebSocket | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const guestName = new URLSearchParams(location.search).get('guest_name');
    
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const backendHost = window.location.hostname + ':8000';
    let socketUrl = `${protocol}://${backendHost}/ws/game/${pin}/?`;
    if (token) socketUrl += `token=${token}`;
    if (guestName) socketUrl += `&guest_name=${encodeURIComponent(guestName)}`;
    
    const socket = new WebSocket(socketUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ action: 'join' }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleSocketMessage(data);
    };

    return () => {
      socket.close();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [pin, location.search]);

  const handleSocketMessage = (data: any) => {
    switch (data.type) {
      case 'room_state':
      case 'player_joined':
      case 'player_left':
        if (data.players) setPlayers(data.players);
        break;
      
      case 'show_question':
        setGameState('question');
        const question = data.question;
        if (question.choices) {
          question.choices = [...question.choices].sort(() => Math.random() - 0.5);
        }
        setCurrentQuestion(question);
        setQuestionIndex(data.question_index);
        setTotalQuestions(data.total_questions);
        setSelectedChoiceId(null);
        setAnswered(false);
        setAnswerResult(null);
        setTimeLeft(data.question.time_limit_seconds);
        startTimeRef.current = Date.now();
        
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(timerIntervalRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        break;

      case 'answer_received':
        setAnswered(true);
        break;

      case 'reveal_answer':
        setGameState('reveal');
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        setLeaderboard(data.leaderboard);
        setLastResults(data.results);
        break;

      case 'game_finished':
        setGameState('finished');
        setLeaderboard(data.leaderboard);
        break;

      case 'host_left':
        alert('Host đã kết thúc phiên chơi.');
        navigate('/');
        break;

      case 'kicked':
        alert('Bạn đã bị mời ra khỏi phòng.');
        navigate('/');
        break;
    }
  };

  const handleChoiceSelect = (choiceId: number) => {
    if (answered || timeLeft <= 0 || gameState !== 'question') return;
    
    setSelectedChoiceId(choiceId);
    submitAnswer({ choice_id: choiceId });
  };

  const handleOrderingSubmit = (choiceIds: number[]) => {
    if (answered || timeLeft <= 0 || gameState !== 'question') return;
    submitAnswer({ choice_ids: choiceIds });
  };

  const handleMatchingSubmit = (matches: { [key: string]: string }) => {
    if (answered || timeLeft <= 0 || gameState !== 'question') return;
    submitAnswer({ matches: matches });
  };

  const submitAnswer = (payload: any) => {
    const timeTaken = (Date.now() - startTimeRef.current) / 1000;
    
    socketRef.current?.send(JSON.stringify({
      action: 'submit_answer',
      ...payload,
      time_taken: timeTaken
    }));
  };

  if (gameState === 'lobby') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-primary-100">
        <Navbar />
        <main className="max-w-md mx-auto pt-24 px-6 text-center">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 mb-10 relative animate-pulse">
            <Users className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <h1 className="text-2xl font-black mb-1 tracking-tight">Bạn đã vào phòng!</h1>
            <p className="text-slate-500 text-sm font-bold">Đang chờ chủ phòng bắt đầu trận đấu...</p>
          </div>

          <Card className="p-6 border-slate-200 bg-white/80 backdrop-blur-xl">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Người chơi đã tham gia ({players.filter(p => !p.is_host).length})</p>
            <div className="flex flex-wrap justify-center gap-2">
              {players.filter(p => !p.is_host).map(p => (
                <div key={p.username} className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-600">
                  {p.username}
                </div>
              ))}
            </div>
          </Card>
        </main>
      </div>
    );
  }

  if (gameState === 'question' && currentQuestion) {
    return (
      <div className="min-h-screen bg-white text-slate-900 selection:bg-primary-100">
        <Navbar />
        <main className="max-w-4xl mx-auto pt-20 px-4 pb-12">
          <div className="flex justify-between items-center mb-10 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
            <div className="text-left">
              <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em] mb-1">Câu hỏi {questionIndex + 1} / {totalQuestions}</p>
              <h2 className="text-xl font-black tracking-tight">{currentQuestion.text}</h2>
            </div>
            
            <div className={`h-16 w-16 rounded-2xl flex flex-col items-center justify-center border-2 transition-all shrink-0 ${timeLeft <= 5 ? 'border-rose-500 bg-rose-50 text-rose-600 animate-bounce' : 'border-slate-200 bg-white text-slate-900'}`}>
              <span className="text-2xl font-black">{timeLeft}</span>
            </div>
          </div>

          {currentQuestion.image && !answered && (
            <div className="max-w-md mx-auto mb-10 rounded-[2rem] overflow-hidden border-4 border-slate-50 shadow-lg">
              <img src={currentQuestion.image} alt="Question" className="w-full h-auto" />
            </div>
          )}

          {answered ? (
            <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 animate-in zoom-in duration-500">
              <div className="inline-flex p-4 rounded-2xl bg-primary-100 text-primary-600 mb-6">
                <Target className="h-10 w-10 animate-spin-slow" />
              </div>
              <h3 className="text-2xl font-black mb-1">Đã nhận câu trả lời</h3>
              <p className="text-slate-400 text-sm font-medium">Đợi kết quả nhé!</p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              {currentQuestion.type === 'ORDER' ? (
                <OrderingQuestion 
                  choices={currentQuestion.choices} 
                  onAnswer={handleOrderingSubmit} 
                />
              ) : currentQuestion.type === 'MATCH' ? (
                <MatchingQuestion 
                  choices={currentQuestion.choices} 
                  onAnswer={handleMatchingSubmit} 
                />
              ) : (
                <div className={`grid gap-4 ${currentQuestion.type === 'TF' ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
                  {currentQuestion.choices.map((choice: any, idx: number) => {
                    const colors = [
                      'bg-rose-500 hover:bg-rose-600 border-rose-600',
                      'bg-blue-500 hover:bg-blue-600 border-blue-600',
                      'bg-amber-500 hover:bg-amber-600 border-amber-600',
                      'bg-emerald-500 hover:bg-emerald-600 border-emerald-600'
                    ];
                    
                    // For TF, use specific colors if the text matches
                    let colorClass = colors[idx % 4];
                    if (currentQuestion.type === 'TF') {
                      if (choice.text.toLowerCase() === 'đúng' || choice.text.toLowerCase() === 'true') {
                        colorClass = 'bg-emerald-500 hover:bg-emerald-600 border-emerald-600';
                      } else if (choice.text.toLowerCase() === 'sai' || choice.text.toLowerCase() === 'false') {
                        colorClass = 'bg-rose-500 hover:bg-rose-600 border-rose-600';
                      }
                    }

                    return (
                      <button
                        key={choice.id}
                        onClick={() => handleChoiceSelect(choice.id)}
                        className={`relative group h-24 rounded-[1.5rem] p-0.5 overflow-hidden transition-all hover:translate-y-[-2px] active:translate-y-[1px] ${colorClass} border-b-4`}
                      >
                        <div className="h-full w-full bg-white/10 flex items-center px-6">
                          {currentQuestion.type !== 'TF' && (
                            <span className="h-8 w-8 rounded-lg bg-black/10 flex items-center justify-center text-sm font-black mr-4 text-white">{String.fromCharCode(65 + idx)}</span>
                          )}
                          <span className={`text-lg font-black text-white text-left leading-tight ${currentQuestion.type === 'TF' ? 'w-full text-center' : ''}`}>{choice.text}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    );
  }

  if (gameState === 'reveal') {
    const myName = new URLSearchParams(location.search).get('guest_name') || localStorage.getItem('username');
    const myResultData = lastResults && myName ? lastResults[myName] : null;
    const isCorrect = myResultData?.is_correct || false;
    const myScore = leaderboard.find(p => p.username === myName)?.score || 0;
    const myCombo = myResultData?.combo || 0;
    
    return (
      <div className={`min-h-screen text-white flex flex-col ${isCorrect ? 'bg-emerald-500' : 'bg-rose-500'} transition-colors duration-700`}>
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <div className="text-center animate-in zoom-in duration-500">
            <div className="inline-flex p-8 rounded-[2.5rem] bg-white/20 backdrop-blur-xl mb-8 shadow-xl relative">
              {isCorrect ? <Zap className="h-16 w-16 fill-current text-accent-amber" /> : <Skull className="h-16 w-16" />}
              {myCombo >= 3 && (
                <div className="absolute -top-4 -right-4 bg-accent-amber text-slate-900 px-4 py-1 rounded-full text-xs font-black shadow-lg animate-bounce flex items-center">
                  <Flame className="h-3 w-3 mr-1 fill-current" />
                  CHUỖI {myCombo}!
                </div>
              )}
            </div>
            <h1 className="text-5xl font-black mb-2 tracking-tight">{isCorrect ? 'TUYỆT VỜI!' : 'TIẾC QUÁ!'}</h1>
            <p className="text-xl font-bold opacity-80 mb-10">
              {isCorrect 
                ? (myCombo >= 3 ? `Bạn đang thăng hoa! (${myCombo} câu đúng liên tiếp)` : 'Cố gắng phát huy nhé!') 
                : 'Tập trung cho câu tiếp theo nào!'}
            </p>
            
            <div className="bg-white/10 backdrop-blur-md rounded-[2rem] p-6 inline-block px-10 border border-white/20">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">Tổng điểm</p>
              <p className="text-4xl font-black">{myScore}</p>
            </div>
          </div>
        </main>
        
        <div className="bg-black/10 backdrop-blur-2xl p-6">
          <div className="max-w-md mx-auto flex items-center justify-center space-x-3 text-white/70">
            <Flame className="h-4 w-4 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest">Đang tải câu hỏi tiếp theo...</span>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'finished') {
    const myName = new URLSearchParams(location.search).get('guest_name') || players[0]?.username;
    const myResult = leaderboard.find(p => p.username === myName);
    const myRank = leaderboard.findIndex(p => p.username === myName) + 1;
    
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-primary-100">
        <Navbar />
        <main className="max-w-md mx-auto pt-24 px-6 pb-12 text-center">
          <div className="mb-10 animate-in slide-in-from-top-8 duration-700">
            <div className="relative inline-block mb-8">
              <Trophy className={`h-24 w-24 ${myRank === 1 ? 'text-accent-amber' : 'text-slate-300'} drop-shadow-lg`} />
              <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-black shadow-lg ring-4 ring-slate-50">
                #{myRank}
              </div>
            </div>
            <h1 className="text-3xl font-black tracking-tight mb-1">{myRank === 1 ? 'CHIẾN THẮNG!' : 'Hoàn thành!'}</h1>
            <p className="text-slate-400 font-medium text-sm">Bạn đã cố gắng hết sức!</p>
          </div>

          <Card className="p-8 border-slate-200 bg-white mb-10 shadow-sm">
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div>
                <p className="text-3xl font-black text-primary-600">{myResultData?.score || 0}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Điểm số</p>
              </div>
              <div>
                <p className="text-3xl font-black text-slate-900">#{myRank}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thứ hạng</p>
              </div>
            </div>
            
            <div className="space-y-2">
              {leaderboard.slice(0, 3).map((p, i) => (
                <div key={p.username} className={`flex items-center justify-between p-3 rounded-xl ${i === 0 ? 'bg-amber-50 border border-amber-100' : 'bg-slate-50 border border-slate-100'}`}>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-black text-slate-400 w-4">#{i+1}</span>
                    <span className="text-sm font-bold text-slate-700">{p.username}</span>
                  </div>
                  <span className={`text-sm font-black ${i === 0 ? 'text-amber-600' : 'text-slate-500'}`}>{p.score}</span>
                </div>
              ))}
            </div>
          </Card>

          <Button 
            size="lg" 
            className="w-full h-14 rounded-2xl text-lg font-black shadow-lg"
            onClick={() => navigate('/')}
          >
            Về trang chủ
          </Button>
        </main>
      </div>
    );
  }

  return null;
};

export default GamePlay;
