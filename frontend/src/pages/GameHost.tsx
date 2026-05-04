import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Users, 
  Play, 
  Timer, 
  Crown, 
  Trophy, 
  CheckCircle2, 
  ArrowRight,
  UserX,
  MessageSquare,
  ShieldCheck,
  Award
} from 'lucide-react';

interface Player {
  username: string;
  avatar: string | null;
  score: number;
  is_host: boolean;
}

const GameHost: React.FC = () => {
  const { pin } = useParams<{ pin: string }>();
  const navigate = useNavigate();
  
  const [gameState, setGameState] = useState<'lobby' | 'question' | 'reveal' | 'finished'>('lobby');
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [answerCount, setAnswerCount] = useState({ answered: 0, total: 0 });
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const backendHost = window.location.hostname + ':8000';
    const socketUrl = `${protocol}://${backendHost}/ws/game/${pin}/?token=${token}`;
    
    const socket = new WebSocket(socketUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ action: 'join' }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleSocketMessage(data);
    };

    return () => socket.close();
  }, [pin]);

  const handleSocketMessage = (data: any) => {
    switch (data.type) {
      case 'room_state':
      case 'player_joined':
      case 'player_left':
        if (data.players) setPlayers(data.players);
        break;
      
      case 'show_question':
        setGameState('question');
        setCurrentQuestion(data.question);
        setQuestionIndex(data.question_index);
        setTotalQuestions(data.total_questions);
        setAnswerCount({ answered: 0, total: players.filter(p => !p.is_host).length });
        break;

      case 'answer_count':
        setAnswerCount({ answered: data.answered, total: data.total });
        break;

      case 'reveal_answer':
        setGameState('reveal');
        setLeaderboard(data.leaderboard);
        break;

      case 'game_finished':
        setGameState('finished');
        setLeaderboard(data.leaderboard);
        break;
      
      case 'host_left':
        navigate('/');
        break;
    }
  };

  const startGame = () => {
    socketRef.current?.send(JSON.stringify({ action: 'start_game' }));
  };

  const kickPlayer = (username: string) => {
    socketRef.current?.send(JSON.stringify({ action: 'kick_player', username }));
  };

  // --- RENDERING HELPERS ---

  if (gameState === 'lobby') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-primary-100">
        <Navbar />
        <main className="max-w-5xl mx-auto pt-24 px-4 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-4 mb-8">
                <div className="h-14 w-14 rounded-2xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                  <Crown className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-slate-900">Live Lobby</h1>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Game PIN: <span className="text-primary-600">{pin}</span></p>
                </div>
              </div>

              <Card className="p-8 border-slate-200 bg-white shadow-sm min-h-[400px]">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black">Challengers</h2>
                  <div className="flex items-center space-x-2 bg-slate-100 px-4 py-1.5 rounded-xl border border-slate-200">
                    <Users className="h-4 w-4 text-primary-500" />
                    <span className="text-sm font-black">{players.filter(p => !p.is_host).length}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-5 gap-6">
                  {players.filter(p => !p.is_host).map((p) => (
                    <div key={p.username} className="text-center group relative animate-in zoom-in duration-300">
                      <div className="relative inline-block mb-3">
                        <div className="h-16 w-16 rounded-2xl bg-slate-100 overflow-hidden ring-4 ring-slate-50 group-hover:ring-primary-100 transition-all shadow-sm">
                          {p.avatar ? <img src={p.avatar} alt={p.username} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-xl font-black bg-primary-50 text-primary-600">{p.username[0].toUpperCase()}</div>}
                        </div>
                        <button 
                          onClick={() => kickPlayer(p.username)}
                          className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 shadow-md"
                        >
                          <UserX className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="font-bold text-xs truncate px-1 text-slate-600">{p.username}</p>
                    </div>
                  ))}
                  
                  {players.filter(p => !p.is_host).length === 0 && (
                    <div className="col-span-full py-16 text-center">
                      <p className="text-slate-400 font-black text-sm uppercase tracking-[0.3em] italic">Waiting for challengers...</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="p-6 border-slate-200 bg-white shadow-xl shadow-slate-200/50 rounded-[2rem]">
                <div className="h-12 w-12 rounded-2xl bg-primary-50 flex items-center justify-center mb-4 text-primary-600">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black mb-2 text-slate-900">Host Dashboard</h3>
                <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
                  Ready to launch? Start the quiz once everyone has joined the lobby.
                </p>
                <Button 
                  size="lg" 
                  className="w-full h-14 rounded-2xl text-lg font-black shadow-lg"
                  onClick={startGame}
                  disabled={players.filter(p => !p.is_host).length === 0}
                >
                  <Play className="h-5 w-5 mr-2 fill-current" />
                  Start Battle
                </Button>
              </Card>

              <Card className="p-6 border-slate-200 bg-white rounded-[2rem] shadow-sm">
                <h3 className="text-sm font-black mb-4 flex items-center text-slate-400 uppercase tracking-widest">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Room Info
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600 font-bold">Auto-reveal</span>
                    <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md text-[10px] font-black uppercase">Enabled</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600 font-bold">Difficulty</span>
                    <span className="text-slate-900 font-black">Standard</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (gameState === 'question' && currentQuestion) {
    return (
      <div className="min-h-screen bg-white text-slate-900 selection:bg-primary-100">
        <Navbar />
        <main className="max-w-4xl mx-auto pt-24 px-4 text-center">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
            <div className="text-center md:text-left">
              <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em] mb-1">Question {questionIndex + 1} / {totalQuestions}</p>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">{currentQuestion.text}</h2>
            </div>
            <div className="relative h-20 w-20 flex items-center justify-center shrink-0">
              <svg className="h-full w-full rotate-[-90deg]">
                <circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-200" />
                <circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray="219.8" strokeDashoffset="0" className="text-primary-600 transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black leading-none text-slate-900">{currentQuestion.time_limit_seconds}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <Card className="p-8 border-slate-200 bg-slate-50 shadow-sm">
              <div className="flex items-center justify-center space-x-8 mb-8">
                <div className="text-center">
                  <p className="text-4xl font-black text-primary-600 mb-0.5">{answerCount.answered}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Responses</p>
                </div>
                <div className="h-10 w-px bg-slate-200" />
                <div className="text-center">
                  <p className="text-4xl font-black text-slate-400 mb-0.5">{answerCount.total}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Players</p>
                </div>
              </div>

              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden mb-3">
                <div 
                  className="bg-primary-600 h-full transition-all duration-500" 
                  style={{ width: `${(answerCount.answered / (answerCount.total || 1)) * 100}%` }} 
                />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Awaiting participants...</p>
            </Card>

            {currentQuestion.image && (
              <div className="rounded-[2rem] overflow-hidden border-4 border-slate-100 shadow-lg">
                <img src={currentQuestion.image} alt="Question" className="w-full h-auto max-h-[300px] object-cover" />
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  if (gameState === 'reveal' || gameState === 'finished') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-primary-100">
        <Navbar />
        <main className="max-w-2xl mx-auto pt-24 px-4 pb-12">
          <div className="text-center mb-10">
            <div className="inline-flex p-4 rounded-3xl bg-white shadow-xl shadow-slate-200/50 text-primary-600 mb-6">
              {gameState === 'finished' ? <Trophy className="h-10 w-10" /> : <Award className="h-10 w-10" />}
            </div>
            <h1 className="text-3xl font-black tracking-tight mb-2">{gameState === 'finished' ? 'Final Standings' : 'Round Results'}</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Room: {pin}</p>
          </div>

          <div className="space-y-3 mb-10">
            {leaderboard.map((p, idx) => (
              <div 
                key={p.username} 
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all animate-in slide-in-from-bottom duration-500 shadow-sm`}
                style={{ 
                  animationDelay: `${idx * 100}ms`, 
                  backgroundColor: idx === 0 ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.7)', 
                  borderColor: idx === 0 ? 'rgba(99, 102, 241, 0.2)' : 'rgba(226, 232, 240, 1)' 
                }}
              >
                <div className="flex items-center space-x-4">
                  <span className={`text-lg font-black w-6 ${idx === 0 ? 'text-primary-600' : 'text-slate-400'}`}>
                    {idx + 1}
                  </span>
                  <div className="h-11 w-11 rounded-xl bg-slate-100 overflow-hidden border border-slate-100">
                    {p.avatar ? <img src={p.avatar} alt={p.username} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center font-black bg-primary-50 text-primary-600 text-sm">{p.username[0].toUpperCase()}</div>}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">{p.username}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.score} pts</p>
                  </div>
                </div>
                {idx === 0 && <Crown className="h-5 w-5 text-accent-amber" />}
              </div>
            ))}
          </div>

          {gameState === 'finished' && (
            <Button 
              size="lg" 
              className="w-full h-14 rounded-2xl text-lg font-black shadow-xl"
              onClick={() => navigate('/')}
            >
              Back to Home
            </Button>
          )}

          {gameState === 'reveal' && (
            <div className="text-center p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="flex items-center justify-center space-x-2 text-primary-600 font-black mb-1">
                <ArrowRight className="h-4 w-4 animate-pulse" />
                <span className="uppercase tracking-widest text-[10px]">Next Round Starting Soon</span>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return null;
};

export default GameHost;
