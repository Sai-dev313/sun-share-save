import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sun, Diamond, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const roleOptions = [
  {
    role: 'producer' as const,
    icon: Sun,
    title: "For Solar Producers",
    points: [
      "Turn excess solar power into tradable credits",
      "Get visibility on your clean energy impact",
      "Earn passive value from your installation"
    ],
    cta: "I Generate Solar",
    dashboard: "/dashboard"
  },
  {
    role: 'consumer' as const,
    icon: Diamond,
    title: "For Consumers",
    points: [
      "Buy credits to reduce your electricity bill",
      "Support clean energy without installing panels",
      "Track your carbon footprint offset"
    ],
    cta: "I Want Clean Energy",
    dashboard: "/consumer"
  }
];

export default function SelectRole() {
  const { user, loading } = useAuthContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    async function checkExistingRole() {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('role, role_selected')
          .eq('id', user.id)
          .maybeSingle();

        if (data?.role_selected) {
          // User already selected a role, redirect to their dashboard
          if (data.role === 'producer') {
            navigate('/dashboard');
          } else {
            navigate('/consumer');
          }
        } else {
          setCheckingRole(false);
        }
      }
    }

    if (!loading && user) {
      checkExistingRole();
    }
  }, [user, loading, navigate]);

  const handleRoleSelect = async (role: 'producer' | 'consumer', dashboard: string) => {
    if (!user || isUpdating) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role, role_selected: true })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Role selected!",
        description: `You're now set up as a ${role}.`,
      });

      navigate(dashboard);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update role",
        variant: "destructive",
      });
      setIsUpdating(false);
    }
  };

  if (loading || checkingRole) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            How will you use SolarCredit?
          </h1>
          <p className="text-muted-foreground text-lg">
            Choose your role to get started with the right dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roleOptions.map((option) => (
            <Card 
              key={option.role} 
              className="bg-card border cursor-pointer transition-all hover:border-primary hover:shadow-lg"
              onClick={() => handleRoleSelect(option.role, option.dashboard)}
            >
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <option.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{option.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {option.points.map((point, i) => (
                    <li key={i} className="flex items-start gap-3 text-muted-foreground">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-4">
                  <button
                    disabled={isUpdating}
                    className="w-full py-3 px-4 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors font-medium disabled:opacity-50"
                  >
                    {isUpdating ? 'Setting up...' : option.cta}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
