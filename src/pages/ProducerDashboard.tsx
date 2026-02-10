import { useState, useEffect } from 'react';
import { Coins, IndianRupee } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import { ActionIconGrid, PanelType } from '@/components/dashboard/ActionIconGrid';
import { DashboardInfoCard } from '@/components/dashboard/DashboardInfoCard';
import { LogEnergyPanel } from '@/components/dashboard/panels/LogEnergyPanel';
import { ConvertCreditsPanel } from '@/components/dashboard/panels/ConvertCreditsPanel';
import { ProducerMarketplacePanel } from '@/components/dashboard/panels/ProducerMarketplacePanel';
import { PaymentHistoryPanel } from '@/components/dashboard/panels/PaymentHistoryPanel';
import { BillPayment } from '@/components/BillPayment';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  credits: number;
  cash: number;
}

interface EnergyLog {
  generated: number;
  used: number;
  sent_to_grid: number;
  credits_converted: boolean;
}

export default function ProducerDashboard() {
  const { user } = useAuthContext();
  const [profile, setProfile] = useState<Profile>({ credits: 0, cash: 0 });
  const [energyToday, setEnergyToday] = useState<EnergyLog>({ generated: 0, used: 0, sent_to_grid: 0, credits_converted: false });
  const [activePanel, setActivePanel] = useState<PanelType>(null);

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
        cash: Number(profileData.cash) || 0
      });
    }

    // Fetch today's energy log
    const today = new Date().toISOString().split('T')[0];
    const { data: energyData } = await supabase
      .from('energy_logs')
      .select('generated, used, sent_to_grid, credits_converted')
      .eq('user_id', user.id)
      .eq('log_date', today)
      .maybeSingle();

    if (energyData) {
      setEnergyToday({
        generated: Number(energyData.generated) || 0,
        used: Number(energyData.used) || 0,
        sent_to_grid: Number(energyData.sent_to_grid) || 0,
        credits_converted: Boolean(energyData.credits_converted)
      });
    }
  };

  const handleEnergyLogged = (log: EnergyLog) => {
    setEnergyToday({ ...log, credits_converted: false });
  };

  const handleCreditsEarned = (creditsEarned: number) => {
    setProfile(prev => ({ ...prev, credits: prev.credits + creditsEarned }));
    // Mark as converted but keep displaying the sent_to_grid value
    setEnergyToday(prev => ({ ...prev, credits_converted: true }));
  };

  const handleListingCreated = (creditsUsed: number) => {
    setProfile(prev => ({ ...prev, credits: prev.credits - creditsUsed }));
  };

  const handlePaymentComplete = (newCredits: number, newCash: number) => {
    setProfile({ credits: newCredits, cash: newCash });
  };

  const renderActivePanel = () => {
    switch (activePanel) {
      case 'logEnergy':
        return (
          <LogEnergyPanel 
            energyToday={energyToday} 
            onEnergyLogged={handleEnergyLogged} 
          />
        );
      case 'convertCredits':
        return (
          <ConvertCreditsPanel 
            availableToConvert={energyToday.credits_converted ? 0 : energyToday.sent_to_grid}
            displayValue={energyToday.sent_to_grid}
            isConverted={energyToday.credits_converted}
            onCreditsEarned={handleCreditsEarned} 
          />
        );
      case 'marketplace':
        return (
          <ProducerMarketplacePanel 
            credits={profile.credits} 
            onListingCreated={handleListingCreated} 
          />
        );
      case 'payBill':
        return (
          <BillPayment 
            credits={profile.credits}
            cash={profile.cash}
            onPaymentComplete={handlePaymentComplete}
            isConsumer={false}
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
          <h1 className="text-3xl font-bold text-foreground">Producer Dashboard</h1>
          <p className="text-muted-foreground mt-1">Track your solar energy and earn credits</p>
        </div>

        {/* Status Cards - Credits & Cash Only */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Credits Balance</p>
                  <p className="text-3xl font-bold text-primary">{Math.round(profile.credits)}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Coins className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Earned by Credits (₹)</p>
                  <p className="text-3xl font-bold">₹{profile.cash.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <IndianRupee className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Icons */}
        <ActionIconGrid 
          role="producer" 
          activePanel={activePanel} 
          onPanelChange={setActivePanel} 
        />

        {/* Info Card */}
        {!activePanel && <DashboardInfoCard role="producer" />}

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
