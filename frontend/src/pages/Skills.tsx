import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Navbar } from '../components/Navbar';
import { Card } from '../components/ui/Card';
import { 
  Brain, 
  TrendingUp, 
  Star, 
  Target, 
  Lightbulb, 
  BookOpen, 
  Code, 
  Music, 
  Globe, 
  Beaker
} from 'lucide-react';

interface SkillXP {
  id: number;
  category: number;
  category_name: string;
  xp: number;
  level: number;
}

const Skills: React.FC = () => {
  const { user } = useAuth();
  const [skills, setSkills] = useState<SkillXP[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const res = await api.get('/skills/');
        setSkills(res.data);
      } catch (err) {
        console.error('Failed to fetch skills', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSkills();
  }, []);

  const getIcon = (name: string): any => {
    const n = name.toLowerCase();
    if (n.includes('science') || n.includes('khoa học')) return Beaker;
    if (n.includes('tech') || n.includes('công nghệ') || n.includes('it')) return Code;
    if (n.includes('language') || n.includes('ngôn ngữ')) return Globe;
    if (n.includes('music') || n.includes('âm nhạc')) return Music;
    if (n.includes('math') || n.includes('toán')) return Target;
    if (n.includes('history') || n.includes('lịch sử')) return BookOpen;
    return Brain;
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="h-12 w-12 animate-spin border-4 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-mesh text-slate-900">
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-4 pt-32 pb-20">
        <div className="flex items-center space-x-6 mb-16">
          <div className="h-16 w-16 rounded-[2rem] bg-gradient-to-tr from-accent-emerald to-primary-600 flex items-center justify-center text-white shadow-2xl shadow-emerald-500/20">
            <TrendingUp className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">Skill Tree</h1>
            <p className="text-slate-500 font-medium">Visualize your learning progress across different domains.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {skills.length > 0 ? (
            skills.map((skill) => {
              const Icon = getIcon(skill.category_name);
              const progress = skill.xp % 100;
              
              return (
                <Card key={skill.id} className="p-8 border-0 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Icon className="h-32 w-32 -rotate-12" />
                  </div>
                  
                  <div className="flex items-start justify-between mb-8 relative z-10">
                    <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-primary-600">
                      <Icon className="h-7 w-7" />
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Expertise</p>
                      <div className="flex items-center justify-end space-x-1 text-primary-600">
                        <Star className="h-4 w-4 fill-primary-600" />
                        <span className="text-2xl font-black">Lvl {skill.level}</span>
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-black text-slate-900 mb-2 relative z-10">{skill.category_name}</h3>
                  <div className="flex items-center space-x-2 text-slate-400 font-bold text-xs uppercase tracking-widest mb-8 relative z-10">
                    <Lightbulb className="h-3 w-3" />
                    <span>{skill.xp} Total XP</span>
                  </div>
                  
                  <div className="space-y-3 relative z-10">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className="text-slate-400">Progress</span>
                      <span className="text-primary-600">{progress}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                      <div 
                        className="h-full bg-gradient-to-r from-primary-500 to-accent-emerald rounded-full transition-all duration-1000"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest pt-2">
                      {100 - progress} XP to Level {skill.level + 1}
                    </p>
                  </div>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full py-24 text-center bg-white/50 backdrop-blur-xl rounded-[4rem] border-2 border-dashed border-slate-200">
              <div className="h-20 w-20 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto mb-8 text-slate-200">
                <Brain className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-400 mb-2">No Skills Cultivated Yet</h3>
              <p className="text-slate-400 max-w-sm mx-auto">
                Complete quizzes in specific categories to start growing your skill tree.
              </p>
            </div>
          )}
        </div>

        {/* Global Level Summary */}
        <div className="mt-20 p-12 rounded-[4rem] bg-slate-900 text-white relative overflow-hidden shadow-3xl">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary-500/20 to-transparent" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="text-center md:text-left">
              <h2 className="text-4xl font-black mb-4">Overall Mastery</h2>
              <p className="text-slate-400 max-w-md">Your global level is based on the accumulation of all your skills across the platform.</p>
            </div>
            
            <div className="flex items-center space-x-12">
              <div className="text-center">
                <p className="text-6xl font-black text-primary-500 mb-2">{user?.level}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Level</p>
              </div>
              <div className="h-20 w-px bg-slate-800" />
              <div className="text-center">
                <p className="text-6xl font-black text-white mb-2">{user?.xp}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total XP</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Skills;
