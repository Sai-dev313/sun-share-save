import { useState, useEffect } from 'react';
import { Coins } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import { ActionIconGrid, PanelType } from '@/components/dashboard/ActionIconGrid';
import { DashboardInfoCard } from '@/components/dashboard/DashboardInfoCard';
import { BuyCreditsPanel } from '@/components/dashboard/panels/BuyCreditsPanel';
import { PaymentHistoryPanel } from '@/components/dashboard/panels/PaymentHistoryPanel';
import { BillPayment } from '@/components/BillPayment';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  credits: number;
  cash: number;
}

export default function ConsumerDashboard() {
  const { user } = useAuthContext();
  const [profile, setProfile] = useState<Profile>({ credits: 0, cash: 0 });
  const [activePanel, setActivePanel] = useState<PanelType>(null);

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
        cash: Number(data.cash) || 0
      });
    }
  };

  const handlePurchaseComplete = (creditsGained: number, cashSpent: number) => {
    setProfile(prev => ({
      credits: prev.credits + creditsGained,
      cash: prev.cash - cashSpent
    }));
  };

  const handlePaymentComplete = (newCredits: number, newCash: number) => {
    setProfile({ credits: newCredits, cash: newCash });
  };

  const renderActivePanel = () => {
    switch (activePanel) {
      case 'buyCredits':
        return (
          <BuyCreditsPanel 
            cash={profile.cash} 
            onPurchaseComplete={handlePurchaseComplete} 
          />
        );
      case 'payBill':
        return (
          <BillPayment 
            credits={profile.credits}
            cash={profile.cash}
            onPaymentComplete={handlePaymentComplete}
            isConsumer={true}
          />
        );
      case 'paymentHistory':
        return <PaymentHistoryPanel />;
      default:
        return null;
    }
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Consumer Dashboard</h1>
          <p className="text-muted-foreground mt-1">Use credits to save on your electricity bill</p>
        </div>

        {/* Status Card - Credits Only (No Cash for Consumer) */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Credits Balance</p>
                <p className="text-3xl font-bold text-primary">{Math.round(profile.credits)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  = ₹{Math.round(profile.credits) * 3} potential savings
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <Coins className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Icons */}
        <ActionIconGrid 
          role="consumer" 
          activePanel={activePanel} 
          onPanelChange={setActivePanel} 
        />

        {/* Info Card */}
        {!activePanel && <DashboardInfoCard role="consumer" />}

        {/* Active Panel */}
        {activePanel && (
          <div className="animate-in slide-in-from-top-2 duration-200">
            {renderActivePanel()}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
