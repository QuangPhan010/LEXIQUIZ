import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Navbar } from '../components/Navbar';
import { Plus, Trash2, CheckCircle2, Circle, Save, FileText, HelpCircle, Layout, Clock, Globe, Lock, Hash, Zap, Image, Video, Timer, X } from 'lucide-react';

interface Choice {
  text: string;
  is_correct: boolean;
}

interface Question {
  text: string;
  choices: Choice[];
  question_type: 'MCQ' | 'TF';
  time_limit_seconds: number;
  image_file?: File | null;
  image_preview?: string | null;
  video_url: string;
}

interface Category {
  id: number;
  name: string;
  icon: string;
}

const TIMER_OPTIONS = [5, 10, 15, 20, 30, 45, 60, 90, 120];

const CreateQuiz: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [timeLimit, setTimeLimit] = useState('0'); // raw digits string

  // Parse digit string → total seconds
  const parseTimeInput = (digits: string): number => {
    const d = digits.replace(/\D/g, ''); // strip non-digits
    if (!d || d === '0') return 0;
    if (d.length <= 2) return parseInt(d);
    if (d.length <= 4) {
      const mm = parseInt(d.slice(0, d.length - 2));
      const ss = parseInt(d.slice(-2));
      return mm * 60 + ss;
    }
    // 5-6 digits → HHMMSS (pad to 6)
    const padded = d.padStart(6, '0');
    const hh = parseInt(padded.slice(0, 2));
    const mm = parseInt(padded.slice(2, 4));
    const ss = parseInt(padded.slice(4, 6));
    return hh * 3600 + mm * 60 + ss;
  };

  // Format total seconds → human readable string
  const formatTimePreview = (digits: string): string => {
    const d = digits.replace(/\D/g, '');
    if (!d || d === '0') return 'No limit';
    const totalSec = parseTimeInput(digits);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  const [tags, setTags] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  
  const makeEmptyQuestion = (): Question => ({
    text: '',
    question_type: 'MCQ',
    time_limit_seconds: 10,
    image_file: null,
    image_preview: null,
    video_url: '',
    choices: [
      { text: '', is_correct: true },
      { text: '', is_correct: false },
      { text: '', is_correct: false },
      { text: '', is_correct: false },
    ],
  });

  const [questions, setQuestions] = useState<Question[]>([makeEmptyQuestion()]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const docInputRef = React.useRef<HTMLInputElement>(null);
  const [importLoading, setImportLoading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories/');
        setCategories(response.data);
      } catch (err) {
        console.error('Failed to fetch categories', err);
      }
    };
    fetchCategories();
  }, []);

  const handleAIImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAiLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/quizzes/generate_from_file/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const data = response.data;
      setTitle(data.title || '');
      setQuestions(data.questions.map((q: any) => ({
        text: q.text,
        question_type: q.question_type || 'MCQ',
        time_limit_seconds: 10,
        image_file: null,
        image_preview: null,
        video_url: '',
        choices: q.choices.map((c: any) => ({
          text: c.text,
          is_correct: c.is_correct
        }))
      })));
      alert('Quiz generated successfully by AI!');
    } catch (err: any) {
      console.error('AI Import failed', err);
      alert(err.response?.data?.error || 'Failed to generate quiz with AI. Please check your API Key.');
    } finally {
      setAiLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDocImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/quizzes/import_questions/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const newQuestions = response.data.questions.map((q: any) => {
        const base = makeEmptyQuestion();
        const qText = typeof q === 'string' ? q : q.text;
        const qChoices = typeof q === 'object' && Array.isArray(q.choices) ? q.choices : [];
        
        return {
          ...base,
          text: qText,
          choices: qChoices.length > 0 
            ? qChoices.map((c: string, idx: number) => ({ text: c, is_correct: idx === 0 }))
            : base.choices
        };
      });

      if (newQuestions.length === 0) {
        alert('No questions found in the document.');
        return;
      }

      setQuestions(prev => {
        // If we only have one empty question, replace it
        if (prev.length === 1 && !prev[0].text.trim()) {
          return newQuestions;
        }
        return [...prev, ...newQuestions];
      });

      alert(`Successfully imported ${newQuestions.length} questions!`);
    } catch (err: any) {
      console.error('Doc Import failed', err);
      alert(err.response?.data?.error || 'Failed to import questions from file.');
    } finally {
      setImportLoading(false);
      if (docInputRef.current) docInputRef.current.value = '';
    }
  };

  const handleAddQuestion = () => {
    setQuestions([...questions, makeEmptyQuestion()]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index: number, field: keyof Question, value: any) => {
    const newQuestions = [...questions];
    (newQuestions[index] as any)[field] = value;
    setQuestions(newQuestions);
  };

  const handleImageUpload = (qIndex: number, file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const newQuestions = [...questions];
      newQuestions[qIndex].image_file = file;
      newQuestions[qIndex].image_preview = e.target?.result as string;
      setQuestions(newQuestions);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (qIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].image_file = null;
    newQuestions[qIndex].image_preview = null;
    setQuestions(newQuestions);
  };

  const handleChoiceChange = (qIndex: number, cIndex: number, text: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].choices[cIndex].text = text;
    setQuestions(newQuestions);
  };

  const handleCorrectChoice = (qIndex: number, cIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].choices = newQuestions[qIndex].choices.map((c, i) => ({
      ...c,
      is_correct: i === cIndex,
    }));
    setQuestions(newQuestions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return alert('Please enter a title');
    setLoading(true);
    try {
      // First create the quiz with JSON (no images yet)
      const response = await api.post('/quizzes/', {
        title,
        description,
        category: category || null,
        is_public: isPublic,
        time_limit: parseTimeInput(timeLimit),
        tags,
        questions: questions.map((q, index) => ({
          text: q.text,
          order: index,
          question_type: q.question_type,
          time_limit_seconds: q.time_limit_seconds,
          video_url: q.video_url || '',
          choices: q.choices
        })),
      });

      const quizId = response.data.id;
      const createdQuestions: any[] = response.data.questions || [];

      // Upload images for questions that have them
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (q.image_file && createdQuestions[i]) {
          const fd = new FormData();
          fd.append('image', q.image_file);
          await api.patch(`/quizzes/${quizId}/questions/${createdQuestions[i].id}/upload_image/`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' }
          }).catch(() => {}); // best-effort, not blocking
        }
      }

      navigate('/');
    } catch (err) {
      console.error('Failed to create quiz', err);
      alert('Failed to create quiz. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mesh text-slate-900">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 pt-32 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-600 p-3 rounded-2xl shadow-lg shadow-primary-500/20">
              <Plus className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Create New Quiz</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".pdf,.docx" 
              onChange={handleAIImport} 
            />
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()} 
              isLoading={aiLoading}
              className="border-dashed border-2 hover:bg-accent-violet/5 hover:border-accent-violet hover:text-accent-violet transition-all"
            >
              <Zap className={`h-5 w-5 mr-2 ${aiLoading ? 'animate-pulse' : 'text-accent-amber fill-accent-amber'}`} />
              AI Import
            </Button>

            <input 
              type="file" 
              ref={docInputRef} 
              className="hidden" 
              accept=".pdf,.docx" 
              onChange={handleDocImport} 
            />
            <Button 
              variant="outline" 
              onClick={() => docInputRef.current?.click()} 
              isLoading={importLoading}
              className="border-dashed border-2 hover:bg-primary-50 hover:border-primary-500 hover:text-primary-600 transition-all"
            >
              <FileText className={`h-5 w-5 mr-2 ${importLoading ? 'animate-pulse' : 'text-primary-500'}`} />
              Import Docs
            </Button>
            <Button onClick={handleSubmit} isLoading={loading} className="px-10 py-4 shadow-xl">
              <Save className="h-5 w-5 mr-2" />
              Save Quiz
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          <Card className="border-t-4 border-t-accent-pink">
            <div className="flex items-center space-x-2 mb-6">
              <FileText className="h-5 w-5 text-accent-pink" />
              <h2 className="text-xl font-black text-slate-800">Quiz Information</h2>
            </div>
            <div className="space-y-6">
              <Input
                label="Quiz Title"
                placeholder="Give it a catchy name!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 ml-1">Description</label>
                <textarea
                  className="w-full bg-white border-2 border-slate-200 rounded-3xl px-5 py-4 text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all duration-300 placeholder:text-slate-400 min-h-[120px]"
                  placeholder="Tell learners what to expect..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </Card>

          <Card className="border-t-4 border-t-accent-violet">
            <div className="flex items-center space-x-2 mb-6">
              <Layout className="h-5 w-5 text-accent-violet" />
              <h2 className="text-xl font-black text-slate-800">Settings & Organization</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 ml-1">Category</label>
                <select 
                  className="w-full bg-white border-2 border-slate-200 rounded-2xl px-5 py-3 text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all duration-300"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 ml-1 flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-slate-400" />
                  Time Limit (Quiz total)
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0 = no limit  |  30 = 0:30  |  3000 = 30:00"
                  value={timeLimit === '0' ? '' : timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value.replace(/\D/g, '') || '0')}
                />
                <p className="text-xs text-slate-400 ml-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    {formatTimePreview(timeLimit)}
                    {timeLimit !== '0' && timeLimit !== '' && (
                      <span className="text-slate-300 ml-1">= {parseTimeInput(timeLimit)}s</span>
                    )}
                  </span>
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 ml-1 flex items-center">
                  <Hash className="h-4 w-4 mr-1 text-slate-400" />
                  Tags
                </label>
                <Input
                  placeholder="history, logic, science..."
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 ml-1">Visibility</label>
                <div className="flex items-center space-x-4 p-2 bg-slate-50 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setIsPublic(true)}
                    className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-xl transition-all ${isPublic ? 'bg-white shadow-sm text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <Globe className="h-4 w-4" />
                    <span className="text-sm font-bold">Public</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPublic(false)}
                    className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-xl transition-all ${!isPublic ? 'bg-white shadow-sm text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <Lock className="h-4 w-4" />
                    <span className="text-sm font-bold">Private</span>
                  </button>
                </div>
              </div>
            </div>
          </Card>

          <div className="space-y-8">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center space-x-2">
                <HelpCircle className="h-6 w-6 text-primary-500" />
                <h2 className="text-2xl font-black text-slate-900">Questions</h2>
              </div>
              <Button variant="outline" size="sm" onClick={handleAddQuestion} className="rounded-xl border-dashed">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>

            {questions.map((q, qIndex) => (
              <Card key={qIndex} className="relative border-t-4 border-t-primary-500 hover:shadow-2xl transition-all duration-500">
                <div className="absolute top-6 right-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl"
                    onClick={() => handleRemoveQuestion(qIndex)}
                    disabled={questions.length === 1}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Question header */}
                  <div className="flex items-center gap-3">
                    <span className="inline-block px-4 py-1 bg-primary-100 text-primary-700 text-xs font-black uppercase tracking-widest rounded-full">
                      Question {qIndex + 1}
                    </span>
                  </div>

                  {/* Question text */}
                  <Input
                    placeholder="What is your question?"
                    value={q.text}
                    onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                    className="text-xl font-bold bg-white"
                    required
                  />

                  {/* Timer & Media row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Per-question timer */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-600 flex items-center gap-1">
                        <Timer className="h-3.5 w-3.5 text-primary-500" />
                        Question Timer
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {TIMER_OPTIONS.map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => handleQuestionChange(qIndex, 'time_limit_seconds', t)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                              q.time_limit_seconds === t
                                ? 'bg-primary-600 text-white shadow-md'
                                : 'bg-slate-100 text-slate-500 hover:bg-primary-50 hover:text-primary-600'
                            }`}
                          >
                            {t}s
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Image upload */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-600 flex items-center gap-1">
                        <Image className="h-3.5 w-3.5 text-accent-pink" />
                        Image (optional)
                      </label>
                      {q.image_preview ? (
                        <div className="relative w-full h-24 rounded-2xl overflow-hidden border-2 border-accent-pink/30">
                          <img src={q.image_preview} alt="preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(qIndex)}
                            className="absolute top-1.5 right-1.5 bg-rose-500 text-white rounded-full p-1 shadow-lg hover:bg-rose-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-accent-pink/50 hover:bg-accent-pink/5 transition-all">
                          <Image className="h-5 w-5 text-slate-300 mb-1" />
                          <span className="text-xs text-slate-400">Upload image</span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(qIndex, e.target.files?.[0] || null)}
                          />
                        </label>
                      )}
                    </div>

                    {/* Video URL */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-600 flex items-center gap-1">
                        <Video className="h-3.5 w-3.5 text-accent-violet" />
                        Video URL (optional)
                      </label>
                      <Input
                        placeholder="YouTube or video URL..."
                        value={q.video_url}
                        onChange={(e) => handleQuestionChange(qIndex, 'video_url', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  {/* Choices */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {q.choices.map((choice, cIndex) => (
                      <div key={cIndex} className="relative group">
                        <Input
                          placeholder={`Option ${String.fromCharCode(65 + cIndex)}`}
                          value={choice.text}
                          onChange={(e) => handleChoiceChange(qIndex, cIndex, e.target.value)}
                          className={`pr-14 ${choice.is_correct ? 'border-accent-emerald bg-accent-emerald/5 ring-4 ring-accent-emerald/5' : 'bg-white'}`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => handleCorrectChoice(qIndex, cIndex)}
                          className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300 transform hover:scale-110 ${
                            choice.is_correct ? 'text-accent-emerald' : 'text-slate-200 hover:text-slate-400'
                          }`}
                        >
                          {choice.is_correct ? <CheckCircle2 className="h-7 w-7" /> : <Circle className="h-7 w-7" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex justify-center pt-8">
            <Button variant="outline" size="lg" onClick={handleAddQuestion} className="w-full max-w-sm border-dashed border-2 py-6 text-xl rounded-3xl border-primary-200 text-primary-600 hover:bg-primary-50">
              <Plus className="h-6 w-6 mr-3" />
              Add Question
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateQuiz;
