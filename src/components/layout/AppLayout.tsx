import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { supabase } from '@/integrations/supabase/client';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, loading } = useAuthContext();
  const navigate = useNavigate();
  const [role, setRole] = useState<'producer' | 'consumer' | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    async function fetchRole() {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('role, role_selected')
          .eq('id', user.id)
          .maybeSingle();
        
        // If role hasn't been selected, redirect to role selection
        if (data && !data.role_selected) {
          navigate('/select-role');
          return;
        }
        
        if (data?.role) {
          setRole(data.role as 'producer' | 'consumer');
        }
      }
    }
    fetchRole();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar role={role} />
      <main className="md:ml-64 pt-24 md:pt-8 px-4 md:px-8 pb-8">
        {children}
      </main>
    </div>
  );
}
