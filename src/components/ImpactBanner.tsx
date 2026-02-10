import { useState, useEffect } from 'react';
import { Leaf } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ImpactBanner() {
  const [statement, setStatement] = useState('');
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const fetchImpact = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-impact-statement`,
          {
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!res.ok) throw new Error('Failed to fetch');

        const data = await res.json();

        if (!data.statement || data.total_units_sent_to_grid === 0) {
          setHidden(true);
          return;
        }

        setStatement(data.statement);
      } catch {
        setHidden(true);
      } finally {
        setLoading(false);
      }
    };

    fetchImpact();
  }, []);

  if (hidden && !loading) return null;

  return (
    <div className="w-full max-w-md mb-6">
      <div className="bg-gray-900 rounded-xl px-5 py-4 flex items-start gap-4">
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-9 h-9 rounded-full bg-green-500/20 flex items-center justify-center">
            <Leaf className="h-5 w-5 text-green-400" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4 bg-gray-700" />
              <Skeleton className="h-4 w-full bg-gray-700" />
            </div>
          ) : (
            <>
              <p className="text-sm text-white leading-relaxed whitespace-pre-line">
                {statement} 🌱
              </p>
              <p className="text-[11px] text-gray-400 mt-2">Updated moments ago</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
