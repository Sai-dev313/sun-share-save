import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, Sun, Coins, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export default function Index() {
  const { user, loading } = useAuthContext();
  const navigate = useNavigate();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    async function checkRole() {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (data?.role) {
          setRole(data.role);
          if (data.role === 'producer') {
            navigate('/dashboard');
          } else {
            navigate('/consumer');
          }
        }
      }
    }

    if (!loading && user) {
      checkRole();
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (user && role) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-b z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary rounded-lg">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">SolarCredit</span>
          </div>
          <Link to="/auth">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 rounded-full mb-6">
            <Sun className="h-4 w-4" />
            <span className="text-sm font-medium">Solar Energy Marketplace</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Turn Sunlight into{' '}
            <span className="text-primary">Savings</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Earn credits from your solar panels or buy credits to save on your electricity bill. 
            Simple, fair, and sustainable.
          </p>
          <Link to="/auth">
            <Button size="lg" className="gap-2">
              Start Saving Today
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-muted">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-xl shadow-md text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sun className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Generate Power</h3>
              <p className="text-muted-foreground">
                Solar panel owners generate clean energy and log their production
              </p>
            </div>
            <div className="bg-card p-8 rounded-xl shadow-md text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Coins className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Earn Credits</h3>
              <p className="text-muted-foreground">
                Extra power sent to the grid becomes tradeable solar credits
              </p>
            </div>
            <div className="bg-card p-8 rounded-xl shadow-md text-center">
              <div className="w-16 h-16 bg-secondary/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-secondary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Save Money</h3>
              <p className="text-muted-foreground">
                Anyone can buy credits and use them to reduce their electricity bill
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Value Prop */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Simple Pricing</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary rounded-lg shrink-0">
                    <Sun className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold">1 kWh = 1 Credit</h4>
                    <p className="text-muted-foreground">Every unit of extra power becomes one credit</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-secondary rounded-lg shrink-0">
                    <Coins className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold">1 Credit = ₹2 Savings</h4>
                    <p className="text-muted-foreground">Each credit reduces your bill by two rupees</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-accent p-8 rounded-xl">
              <h3 className="text-lg font-semibold mb-4">Example</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Producer generates</span>
                  <span className="font-semibold">100 kWh extra</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lists for sale at</span>
                  <span className="font-semibold">₹0.85 each</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Consumer pays</span>
                  <span className="font-semibold">₹85 total</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="text-muted-foreground">Consumer saves</span>
                  <span className="font-bold text-primary">₹200 on bill</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Join thousands of users trading solar energy credits
          </p>
          <Link to="/auth">
            <Button 
              size="lg" 
              variant="secondary"
              className="gap-2"
            >
              Create Your Account
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>© 2026 SolarCredit. Powered by clean energy.</p>
        </div>
      </footer>
    </div>
  );
}
