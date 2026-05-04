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
    if (selectedLeft === id) {
      setSelectedLeft(null);
      return;
    }
    // If already matched, allow clicking to "unmatch"
    if (matches[id]) {
      const newMatches = { ...matches };
      delete newMatches[id];
      setMatches(newMatches);
      setSelectedLeft(id); // Keep it selected to match with something else
      return;
    }
    setSelectedLeft(id);
  };

  const handleRightClick = (text: string) => {
    if (disabled || selectedLeft === null) return;
    
    // Find if this text was already matched to another left item and remove that match
    const newMatches = { ...matches };
    Object.keys(newMatches).forEach(key => {
      if (newMatches[parseInt(key)] === text) {
        delete newMatches[parseInt(key)];
      }
    });

    setMatches({
      ...newMatches,
      [selectedLeft]: text
    });
    setSelectedLeft(null);
  };

  const handleSubmit = () => {
    if (disabled) return;
    // Check if all matched
    if (Object.keys(matches).length < choices.length) {
      alert('Vui lòng nối hết các cặp trước khi xác nhận!');
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
      <p className="text-sm font-bold text-slate-500 text-center mb-4">
        Mẹo: Chọn ô bên trái rồi chọn ô bên phải tương ứng. Click lại ô đã nối để xóa.
      </p>
      
      <div className="grid grid-cols-2 gap-4 sm:gap-8">
        {/* Left Column */}
        <div className="space-y-3">
          {leftItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleLeftClick(item.id)}
              disabled={disabled}
              className={`w-full p-4 sm:p-5 rounded-2xl border-2 text-sm sm:text-base font-bold transition-all text-left flex justify-between items-center group ${
                selectedLeft === item.id 
                  ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-lg ring-2 ring-primary-200' 
                  : matches[item.id]
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600'
                    : 'border-slate-100 bg-white text-slate-600 hover:border-primary-200 hover:bg-slate-50'
              }`}
            >
              <span className="truncate mr-2">{item.text}</span>
              {matches[item.id] && (
                <span className="shrink-0 text-[10px] px-2 py-1 bg-emerald-100 text-emerald-600 rounded-lg group-hover:bg-rose-100 group-hover:text-rose-600 transition-colors">
                  {matches[item.id].length > 10 ? matches[item.id].substring(0, 8) + '...' : matches[item.id]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Right Column */}
        <div className="space-y-3">
          {rightTexts.map((text, idx) => {
            const isMatched = isMatchedRight(text);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleRightClick(text)}
                disabled={disabled}
                className={`w-full p-4 sm:p-5 rounded-2xl border-2 text-sm sm:text-base font-bold transition-all text-left ${
                  isMatched
                    ? 'border-emerald-100 bg-emerald-100/50 text-emerald-800 opacity-60'
                    : 'border-slate-100 bg-white text-slate-600 hover:border-primary-200 hover:bg-slate-50 shadow-sm'
                } ${selectedLeft !== null && !isMatched ? 'animate-pulse border-primary-200 ring-2 ring-primary-50' : ''}`}
              >
                {text}
              </button>
            );
          })}
        </div>
      </div>

      {!disabled && (
        <button
          onClick={handleSubmit}
          className="w-full mt-6 py-5 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-black text-lg rounded-[1.5rem] shadow-xl shadow-primary-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Xác nhận nối cặp
        </button>
      )}
    </div>
  );
};
