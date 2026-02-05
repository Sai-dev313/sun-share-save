import { useState } from 'react';
import { RefreshCw, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ConvertCreditsPanelProps {
  availableToConvert: number;
  displayValue?: number;
  isConverted?: boolean;
  onCreditsEarned: (creditsEarned: number) => void;
}

export function ConvertCreditsPanel({ 
  availableToConvert, 
  displayValue,
  isConverted = false,
  onCreditsEarned 
}: ConvertCreditsPanelProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const kWhDisplay = displayValue ?? availableToConvert;

  const handleEarnCredits = async () => {
    if (availableToConvert <= 0) return;

    setIsLoading(true);

    const { data, error } = await supabase.rpc('earn_credits');

    if (error || !data?.[0]?.success) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: data?.[0]?.message || error?.message || 'Failed to earn credits'
      });
      setIsLoading(false);
      return;
    }

    const creditsEarned = Number(data[0].credits_earned);
    onCreditsEarned(creditsEarned);
    setIsLoading(false);
    toast({ 
      title: 'Credits Earned!', 
      description: `You earned ${creditsEarned} credits from your solar energy.` 
    });
  };

  return (
    <Card className="border-primary/30 bg-accent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-primary" />
          Convert to Credits
        </CardTitle>
        <CardDescription>Convert your extra power into tradeable credits</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConverted ? (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-primary">Credits Already Earned!</p>
                <p className="text-sm text-muted-foreground">
                  You converted {kWhDisplay} kWh → {kWhDisplay} credits today
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-border">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <ArrowRight className="h-3 w-3" />
                Today's energy: {kWhDisplay} kWh sent to grid
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ✓ Log tomorrow's energy to convert more credits
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg">Available to Convert</p>
              <p className="text-3xl font-bold text-primary">{availableToConvert} kWh</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <ArrowRight className="h-3 w-3" />
                = {availableToConvert} credits (1 kWh = 1 Credit)
              </p>
            </div>
            <Button 
              size="lg"
              onClick={handleEarnCredits} 
              disabled={isLoading || availableToConvert <= 0}
            >
              {isLoading ? 'Converting...' : `Earn ${availableToConvert} Credits`}
            </Button>
          </div>
        )}

        {!isConverted && availableToConvert <= 0 && (
          <p className="text-sm text-muted-foreground text-center border-t border-border pt-4">
            No energy available to convert. Log your energy first to see available kWh.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
