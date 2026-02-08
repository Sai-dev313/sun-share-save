import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Home sections
import { Header } from '@/components/home/Header';
import { HeroSection } from '@/components/home/HeroSection';
import { ProblemSection } from '@/components/home/ProblemSection';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';
import { VideoSection } from '@/components/home/VideoSection';
import { AudienceSection } from '@/components/home/AudienceSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { ImpactSection } from '@/components/home/ImpactSection';
import { FAQSection } from '@/components/home/FAQSection';
import { FinalCTASection } from '@/components/home/FinalCTASection';
import { Footer } from '@/components/home/Footer';

export default function Index() {
  const { user, loading } = useAuthContext();
  const navigate = useNavigate();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    async function checkRole() {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('role, role_selected')
          .eq('id', user.id)
          .maybeSingle();

        if (data) {
          // If role hasn't been explicitly selected, go to role selection
          if (!data.role_selected) {
            navigate('/select-role');
            return;
          }
          
          // Role was selected, redirect to appropriate dashboard
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
        <div className="animate-pulse text-muted-foreground" style={{ minHeight: '24px', minWidth: '80px' }}>Loading...</div>
      </div>
    );
  }

  if (user && role) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      <VideoSection />
      <AudienceSection />
      <FeaturesSection />
      <ImpactSection />
      <FAQSection />
      <FinalCTASection />
      <Footer />
    </div>
  );
}
