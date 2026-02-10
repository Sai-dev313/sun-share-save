import { useState } from 'react';
import { Bot, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const QUESTIONS = [
  { id: 1, label: 'How did I earn these credits?' },
  { id: 2, label: "What's my lifetime impact?" },
  { id: 3, label: 'What happens if I sell vs use credits?' },
  { id: 4, label: 'How can I increase my contribution?' },
  { id: 5, label: 'Where did my solar energy go?' },
];

export function SolarGPTPanel() {
  const [activeQuestion, setActiveQuestion] = useState<number | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleQuestionClick = async (questionId: number) => {
    if (loading) return;

    if (activeQuestion === questionId) {
      setActiveQuestion(null);
      setAnswer(null);
      return;
    }

    setActiveQuestion(questionId);
    setAnswer(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('solargpt', {
        body: { question_id: questionId },
      });

      if (error) {
        toast({
          title: 'Error',
          description: 'Could not fetch answer. Please try again.',
          variant: 'destructive',
        });
        setActiveQuestion(null);
        return;
      }

      setAnswer(data?.answer || 'No answer available.');
    } catch {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
      setActiveQuestion(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Bot className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">SolarGPT Insights</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Tap a question to get a personalized explanation based on your real data.
        </p>

        <div className="grid gap-2">
          {QUESTIONS.map((q) => (
            <button
              key={q.id}
              onClick={() => handleQuestionClick(q.id)}
              disabled={loading && activeQuestion !== q.id}
              className={`text-left px-4 py-3 rounded-lg border transition-all text-sm font-medium ${
                activeQuestion === q.id
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border bg-card hover:bg-muted hover:border-muted-foreground/20'
              } disabled:opacity-50`}
            >
              {q.label}
            </button>
          ))}
        </div>

        {(loading || answer) && (
          <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            ) : (
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{answer}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
