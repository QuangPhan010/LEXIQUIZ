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
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    // Shuffle items initially
    if (items.length === 0) {
      setItems([...choices].sort(() => Math.random() - 0.5));
    }
  }, [choices, items.length]);

  // Automatically report answer whenever items change
  useEffect(() => {
    if (items.length > 0 && !disabled) {
      onAnswer(items.map(item => item.id));
    }
  }, [items, onAnswer, disabled]);

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (disabled) return;
    const newItems = [...items];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    setItems(newItems);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (disabled) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.4';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedIndex(null);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (disabled || draggedIndex === null || draggedIndex === index) return;
    
    moveItem(draggedIndex, index);
    setDraggedIndex(index);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm font-bold text-slate-500 mb-4 text-center">Kéo thả các ô để sắp xếp theo thứ tự đúng:</p>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            draggable={!disabled}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            className={`flex items-center p-4 sm:p-5 bg-white border-2 rounded-2xl shadow-sm transition-all cursor-grab active:cursor-grabbing ${
              draggedIndex === index 
                ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200' 
                : 'border-slate-100 hover:border-primary-200'
            } ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <div className="flex flex-col mr-4 sm:mr-6 shrink-0">
              <button 
                type="button"
                onClick={() => index > 0 && moveItem(index, index - 1)}
                disabled={disabled || index === 0}
                className="text-slate-300 hover:text-primary-500 disabled:opacity-20 p-1"
              >
                ▲
              </button>
              <button 
                type="button"
                onClick={() => index < items.length - 1 && moveItem(index, index + 1)}
                disabled={disabled || index === items.length - 1}
                className="text-slate-300 hover:text-primary-500 disabled:opacity-20 p-1"
              >
                ▼
              </button>
            </div>
            <div className="flex-1 font-bold text-slate-700 text-lg">
              {item.text}
            </div>
            <GripVertical className="h-6 w-6 text-slate-300 ml-2 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};
