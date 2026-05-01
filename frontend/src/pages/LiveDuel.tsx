import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Users, 
  Zap, 
  Trophy, 
  Play, 
  CheckCircle2, 
  Timer, 
  Sword,
  Shield,
  MessageSquare
} from 'lucide-react';

interface Player {
  username: string;
  avatar: string | null;
  score: number;
  finished: boolean;
}

const LiveDuel: React.FC = () => {
  const { roomName } = useParams<{ roomName: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [quiz, setQuiz] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    // In production, use wss://
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const socketUrl = `${protocol}://${window.location.host}/ws/duel/${roomName}/?token=${token}`;
    
    const socket = new WebSocket(socketUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('Connected to Duel WebSocket');
      socket.send(jsonStr({ action: 'join' }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleSocketMessage(data);
    };

    socket.onclose = () => {
      console.log('Disconnected from Duel WebSocket');
    };

    return () => {
      socket.close();
    };
  }, [roomName]);

  const jsonStr = (obj: any) => JSON.stringify(obj);

  const handleSocketMessage = (data: any) => {
    switch (data.type) {
      case 'player_joined':
        setPlayers(prev => ({
          ...prev,
          [data.username]: {
            username: data.username,
            avatar: data.avatar,
            score: 0,
            finished: false
          }
        }));
        break;
      
      case 'game_started':
        setQuiz(data.quiz);
        setGameState('playing');
        setCurrentQuestionIndex(0);
        setScore(0);
        break;

      case 'score_update':
        setPlayers(prev => ({
          ...prev,
          [data.username]: {
            ...prev[data.username],
            score: data.score
          }
        }));
        break;

      case 'player_finished':
        setPlayers(prev => ({
          ...prev,
          [data.username]: {
            ...prev[data.username],
            score: data.score,
            finished: true
          }
        }));
        break;
    }
  };

  const startDuel = (quizId: number) => {
    socketRef.current?.send(jsonStr({
      action: 'start_game',
      quiz_id: quizId
    }));
  };

  const handleAnswer = (isCorrect: boolean) => {
    const newScore = isCorrect ? score + 10 : score;
    setScore(newScore);
    
    socketRef.current?.send(jsonStr({
      action: 'submit_answer',
      score: newScore
    }));

    if (currentQuestionIndex + 1 < quiz.questions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setGameState('finished');
      socketRef.current?.send(jsonStr({
        action: 'finish',
        score: newScore,
        time: 0 // Track time if needed
      }));
    }
  };

  if (gameState === 'playing' && quiz) {
    const question = quiz.questions[currentQuestionIndex];
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 pt-32 pb-20">
          <div className="flex justify-between items-center mb-12">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-2xl bg-primary-600 flex items-center justify-center">
                <Sword className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-black">Duel in Progress</h1>
                <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">
                  Question {currentQuestionIndex + 1} of {quiz.questions.length}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              {Object.values(players).map(p => (
                <div key={p.username} className="text-center">
                  <div className="h-10 w-10 rounded-xl bg-slate-800 mx-auto mb-1 overflow-hidden">
                    {p.avatar ? <img src={p.avatar} alt={p.username} /> : <div className="h-full w-full flex items-center justify-center"><Users className="h-4 w-4" /></div>}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{p.username}</p>
                  <p className="text-sm font-black text-primary-500">{p.score}</p>
                </div>
              ))}
            </div>
          </div>

          <Card className="p-12 border-0 bg-slate-800 shadow-2xl mb-8">
            <h2 className="text-3xl font-black mb-12 text-center leading-tight">{question.text}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {question.choices.map((choice: any) => (
                <Button
                  key={choice.id}
                  variant="outline"
                  onClick={() => handleAnswer(choice.is_correct)}
                  className="h-20 rounded-2xl border-slate-700 hover:bg-primary-600 hover:border-primary-600 text-lg font-bold"
                >
                  {choice.text}
                </Button>
              ))}
            </div>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh text-slate-900">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 pt-32 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Lobby Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-6 mb-12">
              <div className="h-16 w-16 rounded-[2rem] bg-gradient-to-tr from-rose-500 to-primary-600 flex items-center justify-center text-white shadow-2xl shadow-rose-500/20">
                <Sword className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">Battle Room</h1>
                <p className="text-slate-500 font-medium tracking-tight">Room: <span className="font-black text-primary-600 uppercase">{roomName}</span></p>
              </div>
            </div>

            {gameState === 'waiting' ? (
              <div className="space-y-8">
                <Card className="p-12 border-0 shadow-2xl bg-white/80 backdrop-blur-xl text-center">
                  <div className="h-24 w-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center mx-auto mb-8 text-slate-300">
                    <Users className="h-12 w-12" />
                  </div>
                  <h2 className="text-3xl font-black mb-4">Waiting for Opponents</h2>
                  <p className="text-slate-500 mb-10 max-w-md mx-auto">Share the room name with your friends to start a live duel!</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {Object.values(players).map(p => (
                      <div key={p.username} className="animate-in zoom-in duration-500">
                        <div className="h-20 w-20 rounded-3xl bg-gradient-to-tr from-slate-100 to-slate-50 mx-auto mb-3 flex items-center justify-center relative overflow-hidden group shadow-lg">
                          {p.avatar ? <img src={p.avatar} alt={p.username} className="h-full w-full object-cover" /> : <Users className="h-8 w-8 text-slate-200" />}
                          <div className="absolute inset-0 bg-primary-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-xs font-black text-slate-900">{p.username}</p>
                        <span className="text-[10px] font-bold text-accent-emerald uppercase tracking-widest">Ready</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <div className="flex justify-center">
                  <Button 
                    size="lg" 
                    className="h-16 px-12 rounded-[2rem] text-xl font-black shadow-2xl"
                    onClick={() => startDuel(1)} // Hardcoded quiz ID for now, should be chosen in lobby
                  >
                    <Play className="h-6 w-6 mr-3 fill-current" />
                    Commence Battle
                  </Button>
                </div>
              </div>
            ) : (
              <Card className="p-12 border-0 shadow-2xl text-center bg-slate-900 text-white">
                <Trophy className="h-20 w-20 text-accent-amber mx-auto mb-8 drop-shadow-glow" />
                <h2 className="text-4xl font-black mb-2">Battle Concluded!</h2>
                <p className="text-slate-400 mb-12 font-medium">Final standings for the duel.</p>
                
                <div className="space-y-4 max-w-md mx-auto">
                  {Object.values(players).sort((a, b) => b.score - a.score).map((p, idx) => (
                    <div key={p.username} className={`flex items-center justify-between p-6 rounded-3xl border-2 ${idx === 0 ? 'border-accent-amber bg-accent-amber/10' : 'border-slate-800 bg-slate-800/50'}`}>
                      <div className="flex items-center space-x-4">
                        <span className="text-2xl font-black text-slate-500 w-8">{idx + 1}</span>
                        <div className="h-12 w-12 rounded-xl bg-slate-700 overflow-hidden">
                          {p.avatar ? <img src={p.avatar} alt={p.username} /> : <Users className="h-6 w-6 m-3" />}
                        </div>
                        <span className="text-xl font-black">{p.username}</span>
                      </div>
                      <span className="text-2xl font-black text-primary-500">{p.score} pts</span>
                    </div>
                  ))}
                </div>

                <Button 
                  variant="ghost" 
                  className="mt-12 text-slate-400 hover:text-white"
                  onClick={() => navigate('/')}
                >
                  Return to Headquarters
                </Button>
              </Card>
            )}
          </div>

          {/* Side Panel: Rules & Chat */}
          <div className="space-y-8">
            <Card className="p-8 border-0 shadow-xl bg-gradient-to-br from-primary-600 to-accent-violet text-white">
              <h3 className="text-xl font-black mb-6 flex items-center">
                <Shield className="h-6 w-6 mr-3" />
                Battle Rules
              </h3>
              <ul className="space-y-4 text-primary-100 font-medium">
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>Answer questions as fast as you can.</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>Each correct answer awards 10 points.</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>Real-time leaderboard syncs every answer.</span>
                </li>
              </ul>
            </Card>

            <Card className="p-8 border-0 shadow-xl h-[400px] flex flex-col">
              <h3 className="text-xl font-black mb-6 flex items-center text-slate-900">
                <MessageSquare className="h-6 w-6 mr-3 text-primary-600" />
                Battle Chat
              </h3>
              <div className="flex-1 bg-slate-50 rounded-3xl p-6 mb-4 overflow-y-auto">
                <p className="text-slate-400 text-center text-xs font-bold uppercase tracking-widest mt-20">System: Channel Open</p>
              </div>
              <div className="flex space-x-2">
                <input 
                  placeholder="Send a message..." 
                  className="flex-1 h-12 rounded-2xl px-6 bg-slate-50 border-0 text-sm font-medium"
                />
                <Button className="rounded-2xl h-12 w-12 p-0">
                  <Zap className="h-5 w-5 fill-current" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LiveDuel;
