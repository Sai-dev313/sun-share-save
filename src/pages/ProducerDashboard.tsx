import { useState, useEffect } from 'react';
import { Sun, Zap, Battery, Coins, IndianRupee, ArrowRight, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatCard } from '@/components/ui/stat-card';
import { AppLayout } from '@/components/layout/AppLayout';
import { BillPayment } from '@/components/BillPayment';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  credits: number;
  cash: number;
}

interface EnergyLog {
  generated: number;
  used: number;
  sent_to_grid: number;
}

export default function ProducerDashboard() {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile>({ credits: 0, cash: 5000 });
  const [energyToday, setEnergyToday] = useState<EnergyLog>({ generated: 0, used: 0, sent_to_grid: 0 });
  const [generated, setGenerated] = useState('');
  const [used, setUsed] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const simulateSmartMeterFeed = () => {
    // Realistic solar generation: 15-35 kWh (varies by weather/season)
    const randomGenerated = (Math.random() * 20 + 15).toFixed(1);
    // Realistic home usage: 8-20 kWh (typical household)
    const randomUsed = (Math.random() * 12 + 8).toFixed(1);
    setGenerated(randomGenerated);
    setUsed(randomUsed);
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('credits, cash')
      .eq('id', user.id)
      .maybeSingle();

    if (profileData) {
      setProfile({
        credits: Number(profileData.credits) || 0,
        cash: Number(profileData.cash) || 5000
      });
    }

    // Fetch today's energy log
    const today = new Date().toISOString().split('T')[0];
    const { data: energyData } = await supabase
      .from('energy_logs')
      .select('generated, used, sent_to_grid')
      .eq('user_id', user.id)
      .eq('log_date', today)
      .maybeSingle();

    if (energyData) {
      setEnergyToday({
        generated: Number(energyData.generated) || 0,
        used: Number(energyData.used) || 0,
        sent_to_grid: Number(energyData.sent_to_grid) || 0
      });
    }
  };

  const handleLogEnergy = async () => {
    if (!user || !generated || !used) return;
    
    setIsLoading(true);
    const gen = parseFloat(generated);
    const use = parseFloat(used);

    // Client-side validation for immediate feedback
    if (isNaN(gen) || isNaN(use)) {
      toast({
        variant: 'destructive',
        title: 'Invalid input',
        description: 'Please enter valid numbers'
      });
      setIsLoading(false);
      return;
    }

    // Use atomic RPC function with server-side validation
    const { data, error } = await supabase.rpc('log_energy', {
      p_generated: gen,
      p_used: use
    });

    if (error || !data?.[0]?.success) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: data?.[0]?.message || error?.message || 'Failed to log energy'
      });
      setIsLoading(false);
      return;
    }

    const sentToGrid = Number(data[0].sent_to_grid);
    setEnergyToday({ generated: gen, used: use, sent_to_grid: sentToGrid });
    setGenerated('');
    setUsed('');
    setIsLoading(false);
    toast({ title: 'Energy logged successfully!' });
  };

  const handleEarnCredits = async () => {
    if (!user || energyToday.sent_to_grid <= 0) return;

    setIsLoading(true);

    // Use atomic RPC function - auth.uid() used server-side
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
    setProfile(prev => ({ ...prev, credits: prev.credits + creditsEarned }));
    setEnergyToday(prev => ({ ...prev, sent_to_grid: 0 }));
    setIsLoading(false);
    toast({ 
      title: 'Credits Earned!', 
      description: `You earned ${creditsEarned} credits from your solar energy.` 
    });
  };

  const handlePaymentComplete = (newCredits: number, newCash: number) => {
    setProfile({ credits: newCredits, cash: newCash });
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Producer Dashboard</h1>
          <p className="text-muted-foreground mt-1">Track your solar energy and earn credits</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Generated Today"
            value={energyToday.generated}
            suffix="kWh"
            icon={<Sun className="h-6 w-6" />}
          />
          <StatCard
            label="Used at Home"
            value={energyToday.used}
            suffix="kWh"
            icon={<Zap className="h-6 w-6" />}
          />
          <StatCard
            label="Sent to Grid"
            value={energyToday.sent_to_grid}
            suffix="kWh"
            icon={<Battery className="h-6 w-6" />}
          />
          <StatCard
            label="Your Credits"
            value={profile.credits}
            icon={<Coins className="h-6 w-6" />}
            variant="primary"
          />
        </div>

        {/* Wallet */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5" />
              Cash Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">₹{profile.cash.toLocaleString()}</p>
            <p className="text-muted-foreground mt-1">From selling credits on the marketplace</p>
          </CardContent>
        </Card>

        {/* Log Energy */}
        <Card>
          <CardHeader>
            <CardTitle>Log Today's Energy</CardTitle>
            <CardDescription>
              {energyToday.generated > 0 
                ? "You've already logged your energy for today" 
                : "Enter your solar generation and home usage"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {energyToday.generated > 0 ? (
              // Summary when already logged
              <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sun className="h-4 w-4" />
                  <span>Energy logged on {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{energyToday.generated}</p>
                    <p className="text-xs text-muted-foreground">kWh Generated</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{energyToday.used}</p>
                    <p className="text-xs text-muted-foreground">kWh Used at Home</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{energyToday.sent_to_grid}</p>
                    <p className="text-xs text-muted-foreground">kWh Sent to Grid</p>
                  </div>
                </div>
                
                {/* Credit Conversion Info */}
                <div className="border-t border-border pt-3 mt-3">
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <span className="text-muted-foreground">Energy sent to grid:</span>
                    <span className="font-semibold">{energyToday.sent_to_grid} units</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="font-bold text-primary">{energyToday.sent_to_grid} credits</span>
                    <span className="text-xs text-muted-foreground">(1 unit = 1 credit)</span>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground text-center pt-2 border-t border-border">
                  ✓ Today's energy has been logged. Come back tomorrow to log again!
                </p>
              </div>
            ) : (
              // Form when not logged yet
              <>
                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={simulateSmartMeterFeed}
                    type="button"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Simulate Smart Meter Feed
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="generated">Power Generated (kWh)</Label>
                    <Input
                      id="generated"
                      type="number"
                      placeholder="e.g., 25"
                      value={generated}
                      onChange={(e) => setGenerated(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="used">Power Used at Home (kWh)</Label>
                    <Input
                      id="used"
                      type="number"
                      placeholder="e.g., 15"
                      value={used}
                      onChange={(e) => setUsed(e.target.value)}
                    />
                  </div>
                </div>
                {generated && used && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">
                      Extra power to grid: <span className="font-semibold text-primary">
                        {Math.max(0, parseFloat(generated) - parseFloat(used))} kWh
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <ArrowRight className="h-3 w-3" />
                      Equivalent credits: <span className="font-semibold text-primary">
                        {Math.max(0, parseFloat(generated) - parseFloat(used))} credits
                      </span>
                      <span className="text-xs">(1 unit = 1 credit)</span>
                    </p>
                  </div>
                )}
                <Button onClick={handleLogEnergy} disabled={isLoading || !generated || !used}>
                  Log Energy
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Earn Credits */}
        <Card className="border-primary/30 bg-accent">
          <CardHeader>
            <CardTitle>Earn Credits</CardTitle>
            <CardDescription>Convert your extra power into tradeable credits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg">Available to Convert</p>
                <p className="text-3xl font-bold text-primary">{energyToday.sent_to_grid} kWh</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <ArrowRight className="h-3 w-3" />
                  = {energyToday.sent_to_grid} credits (1 kWh = 1 Credit)
                </p>
              </div>
              <Button 
                size="lg"
                onClick={handleEarnCredits} 
                disabled={isLoading || energyToday.sent_to_grid <= 0}
              >
                Earn {energyToday.sent_to_grid} Credits
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bill Payment */}
        <BillPayment 
          credits={profile.credits}
          cash={profile.cash}
          onPaymentComplete={handlePaymentComplete}
          isConsumer={false}
        />

        {/* View Payment History CTA */}
        <Card className="border-border">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Receipt className="h-5 w-5 text-muted-foreground" />
                <span className="text-muted-foreground">View all your bill payments and credit transactions</span>
              </div>
              <Button variant="outline" onClick={() => navigate('/payments')}>
                View History
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
