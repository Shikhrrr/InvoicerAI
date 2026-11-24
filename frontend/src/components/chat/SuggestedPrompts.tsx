import React from 'react';
import { Sparkles } from 'lucide-react';

interface SuggestedPromptsProps {
  onSelectPrompt: (prompt: string) => void;
}

export const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({ onSelectPrompt }) => {
  const suggestions = [
    'What were my total sales this month?',
    'Show my recent invoices',
    'Which products appear most frequently in my invoices?',
    'Show total sales for Sharma General Store',
  ];

  return (
    <div className="p-3 border-t-2 border-slate-900 border-dashed bg-white/90">
      <div className="flex items-center gap-1.5 text-xs font-heading font-bold uppercase tracking-wider text-slate-700 mb-2">
        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
        <span>Try Asking</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {suggestions.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onSelectPrompt(prompt)}
            className="text-left text-xs font-sans text-slate-800 bg-white hover:bg-blue-50 border-2 border-slate-900 rounded-md p-2 shadow-[2px_2px_0px_#0f172a] hover:border-blue-600 transition-all hover:translate-x-0.5"
          >
            "{prompt}"
          </button>
        ))}
      </div>
    </div>
  );
};
