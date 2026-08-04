import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { BrainCircuit } from 'lucide-react';

interface AiTutorFollowupProps {
  onAsk: (query: string) => void;
  isAsking?: boolean;
}

export function AiTutorFollowup({ onAsk, isAsking = false }: AiTutorFollowupProps) {
  const [query, setQuery] = useState('');

  const handleAsk = () => {
    if (query.trim()) {
      onAsk(query.trim());
      setQuery('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAsk();
    }
  };

  return (
    <Card className="mt-6 border-indigo-100 bg-indigo-50/30 overflow-hidden shadow-sm">
      <div className="bg-indigo-100/50 px-4 py-3 flex items-center gap-2 border-b border-indigo-100/50">
        <BrainCircuit className="h-4 w-4 text-indigo-700" />
        <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-800">
          AI Tutor Follow-up
        </h4>
      </div>
      <CardContent className="p-4 flex gap-3 items-center">
        <Input 
          placeholder="Still confused? Ask the AI a specific question..." 
          className="flex-1 bg-white border-indigo-100 focus-visible:ring-indigo-300 rounded-xl"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isAsking}
        />
        <Button 
          onClick={handleAsk} 
          disabled={!query.trim() || isAsking}
          className="bg-indigo-400 hover:bg-indigo-500 text-white font-bold rounded-xl px-6"
        >
          {isAsking ? 'Asking...' : 'Ask'}
        </Button>
      </CardContent>
    </Card>
  );
}
