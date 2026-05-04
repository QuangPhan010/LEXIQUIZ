import React, { useState, useEffect } from 'react';

interface Choice {
  id: number;
  text: string;
  match_text: string;
}

interface MatchingQuestionProps {
  choices: Choice[];
  onAnswer: (matches: { [key: string]: string }) => void;
  disabled?: boolean;
}

export const MatchingQuestion: React.FC<MatchingQuestionProps> = ({ choices, onAnswer, disabled }) => {
  const [leftItems, setLeftItems] = useState<Choice[]>([]);
  const [rightTexts, setRightTexts] = useState<string[]>([]);
  const [matches, setMatches] = useState<{ [key: number]: string }>({});
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);

  useEffect(() => {
    setLeftItems([...choices]);
    const shuffledRight = [...choices].map(c => c.match_text).sort(() => Math.random() - 0.5);
    setRightTexts(shuffledRight);
    setMatches({});
    setSelectedLeft(null);
  }, [choices]);

  const handleLeftClick = (id: number) => {
    if (disabled) return;
    setSelectedLeft(id);
  };

  const handleRightClick = (text: string) => {
    if (disabled || selectedLeft === null) return;
    
    setMatches(prev => ({
      ...prev,
      [selectedLeft]: text
    }));
    setSelectedLeft(null);
  };

  const handleSubmit = () => {
    if (disabled) return;
    // Check if all matched
    if (Object.keys(matches).length < choices.length) {
      alert('Vui lòng nối hết các cặp!');
      return;
    }
    
    const formattedMatches: { [key: string]: string } = {};
    Object.entries(matches).forEach(([key, val]) => {
      formattedMatches[key] = val;
    });
    onAnswer(formattedMatches);
  };

  const isMatchedRight = (text: string) => Object.values(matches).includes(text);

  return (
    <div className="space-y-6">
      <p className="text-sm font-bold text-slate-500 text-center mb-4">Chọn 1 ô bên trái rồi chọn ô tương ứng bên phải:</p>
      
      <div className="grid grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-3">
          {leftItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleLeftClick(item.id)}
              disabled={disabled}
              className={`w-full p-4 rounded-2xl border-2 text-sm font-bold transition-all text-left flex justify-between items-center ${
                selectedLeft === item.id 
                  ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-md ring-4 ring-primary-500/10' 
                  : matches[item.id]
                    ? 'border-emerald-100 bg-emerald-50/50 text-emerald-700'
                    : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200'
              }`}
            >
              <span>{item.text}</span>
              {matches[item.id] && <span className="text-[10px] px-2 py-0.5 bg-emerald-100 rounded-full ml-2 truncate max-w-[80px]">{matches[item.id]}</span>}
            </button>
          ))}
        </div>

        {/* Right Column */}
        <div className="space-y-3">
          {rightTexts.map((text, idx) => (
            <button
              key={idx}
              onClick={() => handleRightClick(text)}
              disabled={disabled || isMatchedRight(text)}
              className={`w-full p-4 rounded-2xl border-2 text-sm font-bold transition-all text-left ${
                isMatchedRight(text)
                  ? 'border-emerald-100 bg-emerald-100 text-emerald-800 opacity-50'
                  : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200'
              }`}
            >
              {text}
            </button>
          ))}
        </div>
      </div>

      {!disabled && (
        <button
          onClick={handleSubmit}
          className="w-full mt-6 py-4 bg-primary-600 text-white font-black rounded-2xl shadow-lg shadow-primary-500/20 hover:bg-primary-700 active:scale-[0.98] transition-all"
        >
          Xác nhận nối cặp
        </button>
      )}
    </div>
  );
};
