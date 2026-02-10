import { useState, useEffect } from 'react';
import { Leaf } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

export function LifetimeImpactPill() {
  const [statement, setStatement] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchImpact();
  }, []);

  const fetchImpact = async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-lifetime-impact');
      if (fnError || !data?.statement) {
        setError(true);
        return;
      }
      setStatement(data.statement);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (error) return null;

  if (loading) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
        <Leaf className="h-5 w-5 text-primary shrink-0" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
      <Leaf className="h-5 w-5 text-primary shrink-0 mt-0.5" />
      <p className="text-sm text-foreground leading-relaxed">{statement}</p>
    </div>
  );
}
