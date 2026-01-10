import { useState, useEffect } from 'react';
import { Sun, Zap, Battery, Coins, IndianRupee } from 'lucide-react';
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

interface EnergyLog {
  generated: number;
  used: number;
  sent_to_grid: number;
}

export default function ProducerDashboard() {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile>({ credits: 0, cash: 5000 });
  const [energyToday, setEnergyToday] = useState<EnergyLog>({ generated: 0, used: 0, sent_to_grid: 0 });
  const [generated, setGenerated] = useState('');
  const [used, setUsed] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
    const sentToGrid = Math.max(0, gen - use);

    const today = new Date().toISOString().split('T')[0];

    // Check if log exists for today
    const { data: existing } = await supabase
      .from('energy_logs')
      .select('id')
      .eq('user_id', user.id)
      .eq('log_date', today)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('energy_logs')
        .update({ generated: gen, used: use, sent_to_grid: sentToGrid })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('energy_logs')
        .insert({
          user_id: user.id,
          generated: gen,
          used: use,
          sent_to_grid: sentToGrid,
          log_date: today
        });
    }

    setEnergyToday({ generated: gen, used: use, sent_to_grid: sentToGrid });
    setGenerated('');
    setUsed('');
    setIsLoading(false);
    toast({ title: 'Energy logged successfully!' });
  };

  const handleEarnCredits = async () => {
    if (!user || energyToday.sent_to_grid <= 0) return;

    setIsLoading(true);
    const creditsToEarn = energyToday.sent_to_grid;

    await supabase
      .from('profiles')
      .update({ credits: profile.credits + creditsToEarn })
      .eq('id', user.id);

    // Reset sent_to_grid after earning
    const today = new Date().toISOString().split('T')[0];
    await supabase
      .from('energy_logs')
      .update({ sent_to_grid: 0 })
      .eq('user_id', user.id)
      .eq('log_date', today);

    setProfile(prev => ({ ...prev, credits: prev.credits + creditsToEarn }));
    setEnergyToday(prev => ({ ...prev, sent_to_grid: 0 }));
    setIsLoading(false);
    toast({ 
      title: 'Credits Earned!', 
      description: `You earned ${creditsToEarn} credits from your solar energy.` 
    });
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
            <CardDescription>Enter your solar generation and home usage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <p className="text-sm text-muted-foreground">
                Extra power to grid: <span className="font-semibold text-primary">
                  {Math.max(0, parseFloat(generated) - parseFloat(used))} kWh
                </span>
              </p>
            )}
            <Button onClick={handleLogEnergy} disabled={isLoading || !generated || !used}>
              Log Energy
            </Button>
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
                <p className="text-sm text-muted-foreground">1 kWh = 1 Credit</p>
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
      </div>
    </AppLayout>
  );
}
