import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Navbar } from '../components/Navbar';
import { Plus, Trash2, CheckCircle2, Circle, Save, FileText, HelpCircle, Layout, Clock, Globe, Lock, Hash } from 'lucide-react';

interface Choice {
  text: string;
  is_correct: boolean;
}

interface Question {
  text: string;
  choices: Choice[];
  question_type: 'MCQ' | 'TF';
}

interface Category {
  id: number;
  name: string;
  icon: string;
}

const CreateQuiz: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [timeLimit, setTimeLimit] = useState('0');
  const [tags, setTags] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [questions, setQuestions] = useState<Question[]>([
    {
      text: '',
      question_type: 'MCQ',
      choices: [
        { text: '', is_correct: true },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
      ],
    },
  ]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: '',
        question_type: 'MCQ',
        choices: [
          { text: '', is_correct: true },
          { text: '', is_correct: false },
          { text: '', is_correct: false },
          { text: '', is_correct: false },
        ],
      },
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index: number, text: string) => {
    const newQuestions = [...questions];
    newQuestions[index].text = text;
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
    setLoading(true);
    try {
      await api.post('/quizzes/', {
        title,
        description,
        category: category || null,
        is_public: isPublic,
        time_limit: parseInt(timeLimit) || 0,
        tags,
        questions: questions.map((q, index) => ({
          text: q.text,
          order: index,
          question_type: q.question_type,
          choices: q.choices
        })),
      });
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
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-600 p-3 rounded-2xl shadow-lg shadow-primary-500/20">
              <Plus className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Create New Quiz</h1>
          </div>
          <Button onClick={handleSubmit} isLoading={loading} className="px-10 py-4 shadow-xl">
            <Save className="h-5 w-5 mr-2" />
            Save Quiz
          </Button>
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
                  Time Limit (seconds)
                </label>
                <Input
                  type="number"
                  placeholder="0 for no limit"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value)}
                />
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

                <div className="space-y-8">
                  <div>
                    <span className="inline-block px-4 py-1 bg-primary-100 text-primary-700 text-xs font-black uppercase tracking-widest rounded-full mb-4">
                      Question {qIndex + 1}
                    </span>
                    <Input
                      placeholder="What is your question?"
                      value={q.text}
                      onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
                      className="text-xl font-bold bg-white"
                      required
                    />
                  </div>

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
