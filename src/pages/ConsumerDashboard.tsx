import { useState, useEffect } from 'react';
import { Coins, IndianRupee, Receipt, TrendingDown, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { AppLayout } from '@/components/layout/AppLayout';
import { BillPayment } from '@/components/BillPayment';
import { TransactionHistory } from '@/components/TransactionHistory';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface Profile {
  credits: number;
  cash: number;
}

export default function ConsumerDashboard() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile>({ credits: 0, cash: 5000 });

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

  const handlePaymentComplete = (newCredits: number, newCash: number) => {
    setProfile({ credits: newCredits, cash: newCash });
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

        {/* Buy Credits CTA */}
        {profile.credits === 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <ShoppingCart className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">No credits yet?</h3>
                    <p className="text-muted-foreground">Buy credits from producers to start saving on your electricity bills!</p>
                  </div>
                </div>
                <Button onClick={() => navigate('/marketplace')} className="whitespace-nowrap">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Go to Marketplace
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bill Payment - PhonePe Style */}
        <BillPayment 
          credits={profile.credits}
          cash={profile.cash}
          onPaymentComplete={handlePaymentComplete}
          isConsumer={true}
        />

        {/* Transaction History */}
        <TransactionHistory />
      </div>
    </AppLayout>
  );
}
