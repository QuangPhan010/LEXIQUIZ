import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { GripVertical } from 'lucide-react';

interface Choice {
  id: number;
  text: string;
}

interface OrderingQuestionProps {
  choices: Choice[];
  onAnswer: (choiceIds: number[]) => void;
  disabled?: boolean;
}

export const OrderingQuestion: React.FC<OrderingQuestionProps> = ({ choices, onAnswer, disabled }) => {
  const [items, setItems] = useState<Choice[]>([]);

  useEffect(() => {
    // Shuffle items initially
    setItems([...choices].sort(() => Math.random() - 0.5));
  }, [choices]);

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (disabled) return;
    const newItems = [...items];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    setItems(newItems);
  };

  const handleSubmit = () => {
    if (disabled) return;
    onAnswer(items.map(item => item.id));
  };

  return (
    <div className="space-y-4">
      <p className="text-sm font-bold text-slate-500 mb-4">Kéo thả để sắp xếp theo thứ tự đúng:</p>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`flex items-center p-4 bg-white border-2 border-slate-100 rounded-2xl shadow-sm transition-all ${disabled ? 'opacity-70' : 'hover:border-primary-300'}`}
          >
            <div className="flex flex-col mr-4">
              <button 
                onClick={() => index > 0 && moveItem(index, index - 1)}
                disabled={disabled || index === 0}
                className="text-slate-300 hover:text-primary-500 disabled:opacity-30"
              >
                ▲
              </button>
              <button 
                onClick={() => index < items.length - 1 && moveItem(index, index + 1)}
                disabled={disabled || index === items.length - 1}
                className="text-slate-300 hover:text-primary-500 disabled:opacity-30"
              >
                ▼
              </button>
            </div>
            <div className="flex-1 font-bold text-slate-700">
              {item.text}
            </div>
            <GripVertical className="h-5 w-5 text-slate-300 ml-2" />
          </div>
        ))}
      </div>
      
      {!disabled && (
        <button
          onClick={handleSubmit}
          className="w-full mt-6 py-4 bg-primary-600 text-white font-black rounded-2xl shadow-lg shadow-primary-500/20 hover:bg-primary-700 active:scale-[0.98] transition-all"
        >
          Xác nhận thứ tự
        </button>
      )}
    </div>
  );
};
