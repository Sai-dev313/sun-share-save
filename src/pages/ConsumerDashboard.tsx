import { useState, useEffect } from 'react';
import { Coins, IndianRupee, Receipt, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatCard } from '@/components/ui/stat-card';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  credits: number;
  cash: number;
}

export default function ConsumerDashboard() {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile>({ credits: 0, cash: 5000 });
  const [creditsToUse, setCreditsToUse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const savingsPerCredit = 2; // ₹2 per credit
  const maxSavings = profile.credits * savingsPerCredit;

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('credits, cash')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      setProfile({
        credits: Number(data.credits) || 0,
        cash: Number(data.cash) || 5000
      });
    }
  };

  const handleSaveOnBill = async () => {
    if (!user) return;
    
    const credits = parseFloat(creditsToUse);
    if (!credits || credits <= 0 || credits > profile.credits) {
      toast({
        variant: 'destructive',
        title: 'Invalid amount',
        description: 'Please enter a valid number of credits'
      });
      return;
    }

    setIsLoading(true);

    // Use atomic RPC function instead of direct update
    const { data, error } = await supabase.rpc('redeem_credits', {
      p_user_id: user.id,
      p_credits: credits
    });

    if (error || !data?.[0]?.success) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: data?.[0]?.message || error?.message || 'Failed to redeem credits'
      });
      setIsLoading(false);
      return;
    }

    const savings = Number(data[0].savings);
    setProfile(prev => ({
      credits: prev.credits - credits,
      cash: prev.cash + savings
    }));
    setCreditsToUse('');
    setIsLoading(false);

    toast({
      title: 'Bill Reduced!',
      description: `You saved ₹${savings} on your electricity bill.`
    });
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Consumer Dashboard</h1>
          <p className="text-muted-foreground mt-1">Use credits to save on your electricity bill</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Your Credits"
            value={profile.credits}
            icon={<Coins className="h-6 w-6" />}
            variant="primary"
          />
          <StatCard
            label="Cash Balance"
            value={`₹${profile.cash.toLocaleString()}`}
            icon={<IndianRupee className="h-6 w-6" />}
          />
          <StatCard
            label="Potential Savings"
            value={`₹${maxSavings.toLocaleString()}`}
            icon={<TrendingDown className="h-6 w-6" />}
            variant="secondary"
          />
        </div>

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              How Credits Work
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-3xl font-bold text-primary">1</p>
                <p className="text-lg font-semibold mt-2">Buy Credits</p>
                <p className="text-sm text-muted-foreground">Purchase from producers on the marketplace</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-3xl font-bold text-primary">2</p>
                <p className="text-lg font-semibold mt-2">Use Credits</p>
                <p className="text-sm text-muted-foreground">Redeem credits to reduce your bill</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-3xl font-bold text-primary">₹2</p>
                <p className="text-lg font-semibold mt-2">Per Credit</p>
                <p className="text-sm text-muted-foreground">Each credit saves ₹2 on your bill</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save on Bill */}
        <Card className="border-primary/30 bg-accent">
          <CardHeader>
            <CardTitle>Save on Your Bill</CardTitle>
            <CardDescription>Use your credits to reduce your electricity bill</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="credits">Credits to Use</Label>
                  <Input
                    id="credits"
                    type="number"
                    placeholder="e.g., 50"
                    value={creditsToUse}
                    onChange={(e) => setCreditsToUse(e.target.value)}
                    max={profile.credits}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Available: <span className="font-semibold">{profile.credits} credits</span>
                </p>
              </div>
              <div className="flex flex-col justify-center items-center p-6 rounded-lg bg-background">
                <p className="text-sm text-muted-foreground">You will save</p>
                <p className="text-4xl font-bold text-primary">
                  ₹{((parseFloat(creditsToUse) || 0) * savingsPerCredit).toLocaleString()}
                </p>
                <Button 
                  className="mt-4 w-full"
                  onClick={handleSaveOnBill}
                  disabled={isLoading || !creditsToUse || parseFloat(creditsToUse) <= 0 || parseFloat(creditsToUse) > profile.credits}
                >
                  Save on Bill
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
