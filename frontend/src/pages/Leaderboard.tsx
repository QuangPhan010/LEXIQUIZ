import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Card } from '../components/ui/Card';
import { Navbar } from '../components/Navbar';
import { UserAvatar } from '../components/UserAvatar';
import { Trophy, Medal, Zap, Crown, User as UserIcon } from 'lucide-react';

interface LeaderboardEntry {
  username: string;
  xp: number;
  level: number;
  avatar?: string | null;
  equipped_frame?: string | null;
}

const Leaderboard: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await api.get('/leaderboard/');
        setEntries(response.data);
      } catch (err) {
        console.error('Failed to fetch leaderboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="h-12 w-12 animate-bounce flex items-center justify-center bg-primary-600 rounded-2xl shadow-xl shadow-primary-500/20">
        <div className="h-2 w-2 bg-white rounded-full animate-ping" />
      </div>
    </div>
  );

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="min-h-screen bg-mesh text-slate-900">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 pt-32 pb-12">
        <div className="text-center mb-16">
          <div className="inline-flex p-4 bg-white rounded-3xl shadow-lg shadow-slate-200/50 mb-6 animate-bounce">
            <Trophy className="h-10 w-10 text-accent-amber" />
          </div>
          <h1 className="text-5xl font-black tracking-tight mb-4 text-slate-900">Global Champions</h1>
          <p className="text-xl text-slate-500">The brightest minds in the LEXIQUIZ universe.</p>
        </div>

        {/* Podium for Top 3 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 items-end">
          {/* 2nd Place */}
          {top3[1] && (
            <div className="order-2 md:order-1">
              <Card className="text-center pb-8 pt-12 relative border-t-4 border-t-slate-300">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-100 text-slate-500 p-3 rounded-2xl shadow-md">
                  <Medal className="h-6 w-6" />
                </div>
                <UserAvatar user={top3[1]} size="lg" className="mx-auto mb-4" />
                <h3 className="text-xl font-black text-slate-800">{top3[1].username}</h3>
                <p className="text-slate-400 font-bold text-sm mb-4">Level {top3[1].level}</p>
                <div className="inline-flex items-center space-x-2 bg-slate-50 px-4 py-2 rounded-xl text-slate-600 font-black">
                  <Zap className="h-4 w-4 text-accent-amber fill-accent-amber" />
                  <span>{top3[1].xp} XP</span>
                </div>
              </Card>
            </div>
          )}

          {/* 1st Place */}
          {top3[0] && (
            <div className="order-1 md:order-2">
              <Card className="text-center pb-12 pt-16 relative border-t-8 border-t-accent-amber transform md:scale-110 shadow-2xl z-10">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-accent-amber text-white p-5 rounded-3xl shadow-xl animate-pulse">
                  <Crown className="h-10 w-10 fill-current" />
                </div>
                <UserAvatar user={top3[0]} size="xl" className="mx-auto mb-4" />
                <h3 className="text-2xl font-black text-slate-900">{top3[0].username}</h3>
                <p className="text-primary-500 font-black text-base mb-6">Level {top3[0].level}</p>
                <div className="inline-flex items-center space-x-2 bg-accent-amber/20 px-6 py-3 rounded-2xl text-accent-amber font-black text-lg">
                  <Zap className="h-5 w-5 fill-accent-amber" />
                  <span>{top3[0].xp} XP</span>
                </div>
              </Card>
            </div>
          )}

          {/* 3rd Place */}
          {top3[2] && (
            <div className="order-3 md:order-3">
              <Card className="text-center pb-8 pt-12 relative border-t-4 border-t-accent-amber/40">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-orange-50 text-orange-400 p-3 rounded-2xl shadow-md">
                  <Medal className="h-6 w-6" />
                </div>
                <UserAvatar user={top3[2]} size="lg" className="mx-auto mb-4" />
                <h3 className="text-xl font-black text-slate-800">{top3[2].username}</h3>
                <p className="text-slate-400 font-bold text-sm mb-4">Level {top3[2].level}</p>
                <div className="inline-flex items-center space-x-2 bg-slate-50 px-4 py-2 rounded-xl text-slate-600 font-black">
                  <Zap className="h-4 w-4 text-accent-amber fill-accent-amber" />
                  <span>{top3[2].xp} XP</span>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Rest of the leaderboard */}
        <Card className="p-0 overflow-hidden border-0 shadow-xl">
          <div className="bg-slate-50/50 px-8 py-4 border-b border-slate-100 grid grid-cols-12 gap-4 text-xs font-black text-slate-400 uppercase tracking-widest">
            <div className="col-span-1">Rank</div>
            <div className="col-span-7">User</div>
            <div className="col-span-2 text-center">Level</div>
            <div className="col-span-2 text-right">Experience</div>
          </div>
          <div className="divide-y divide-slate-50">
            {rest.map((entry, index) => (
              <div key={index} className="px-8 py-6 grid grid-cols-12 gap-4 items-center hover:bg-slate-50/50 transition-colors">
                <div className="col-span-1 font-black text-slate-300 text-lg">#{index + 4}</div>
                <div className="col-span-7 flex items-center space-x-4">
                  <UserAvatar user={entry} size="md" />
                  <span className="font-bold text-slate-800 text-lg">{entry.username}</span>
                </div>
                <div className="col-span-2 text-center font-black text-primary-600">
                  Lvl {entry.level}
                </div>
                <div className="col-span-2 text-right">
                  <div className="inline-flex items-center space-x-1.5 font-black text-slate-900">
                    <Zap className="h-3 w-3 text-accent-amber fill-accent-amber" />
                    <span>{entry.xp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Leaderboard;
