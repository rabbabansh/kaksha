/* eslint-disable */
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, CheckCircle2 } from 'lucide-react';

export function AdminQuestionForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form State
  const [year, setYear] = useState('2024');
  const [slot, setSlot] = useState('1');
  const [section, setSection] = useState('QA');
  const [topic, setTopic] = useState('');
  const [subtopic, setSubtopic] = useState('');
  const [questionId, setQuestionId] = useState(''); // Allow manual ID or auto-generate
  
  const [questionHtml, setQuestionHtml] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [answer, setAnswer] = useState('');
  const [explanation, setExplanation] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: questionId || `q_${Date.now()}`,
          year, slot, section, topic, subtopic,
          question_html: questionHtml,
          option_a_html: optA,
          option_b_html: optB,
          option_c_html: optC,
          option_d_html: optD,
          answer,
          explanation_html: explanation
        })
      });

      if (res.ok) {
        setSuccess(true);
        // Clear main fields
        setQuestionHtml(''); setOptA(''); setOptB(''); setOptC(''); setOptD(''); setAnswer(''); setExplanation(''); setQuestionId('');
      } else {
        alert('Failed to add question');
      }
    } catch (err) {
      alert('Error adding question');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Question</CardTitle>
        <CardDescription>Manually insert a question into the Kaksha database.</CardDescription>
      </CardHeader>
      <CardContent>
        {success && (
          <div className="mb-6 p-4 bg-green-50 text-green-700 border border-green-200 rounded-lg flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="h-5 w-5" />
            Question successfully added to database!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Year</Label>
              <Input value={year} onChange={e => setYear(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Slot</Label>
              <Input value={slot} onChange={e => setSlot(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Section</Label>
              <Select value={section} onValueChange={setSection}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="QA">QA</SelectItem>
                  <SelectItem value="DILR">DILR</SelectItem>
                  <SelectItem value="VARC">VARC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Question ID (Optional)</Label>
              <Input value={questionId} onChange={e => setQuestionId(e.target.value)} placeholder="Auto-generated" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Topic</Label>
              <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Algebra" required />
            </div>
            <div className="space-y-2">
              <Label>Subtopic</Label>
              <Input value={subtopic} onChange={e => setSubtopic(e.target.value)} placeholder="e.g. Quadratic Equations" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Question HTML</Label>
            <Textarea value={questionHtml} onChange={e => setQuestionHtml(e.target.value)} className="font-mono text-sm h-32" required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Option A</Label><Input value={optA} onChange={e => setOptA(e.target.value)} /></div>
            <div className="space-y-2"><Label>Option B</Label><Input value={optB} onChange={e => setOptB(e.target.value)} /></div>
            <div className="space-y-2"><Label>Option C</Label><Input value={optC} onChange={e => setOptC(e.target.value)} /></div>
            <div className="space-y-2"><Label>Option D</Label><Input value={optD} onChange={e => setOptD(e.target.value)} /></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Correct Answer</Label>
              <Input value={answer} onChange={e => setAnswer(e.target.value)} placeholder="e.g. A, B, or actual text" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Explanation HTML (Optional)</Label>
            <Textarea value={explanation} onChange={e => setExplanation(e.target.value)} className="font-mono text-sm h-24" />
          </div>

          <Button type="submit" disabled={loading} className="w-full h-12 text-lg">
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Plus className="mr-2 h-5 w-5" />}
            Insert Question
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
