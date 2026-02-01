import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const { user, loading } = useAuthContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const email = searchParams.get('email') || '';

  useEffect(() => {
    // Handle email verification callback from Supabase
    const handleEmailVerification = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      // Handle various verification types (signup, email, magiclink)
      if (accessToken && refreshToken && (type === 'signup' || type === 'email' || type === 'magiclink')) {
        setIsVerifying(true);
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            toast({
              variant: 'destructive',
              title: 'Verification failed',
              description: error.message,
            });
            setIsVerifying(false);
          } else if (data.session) {
            setIsVerified(true);
            toast({
              title: 'Email verified!',
              description: 'Welcome! Redirecting to your dashboard...',
            });
            // Immediate redirect to dashboard
            navigate('/');
          }
        } catch (err) {
          toast({
            variant: 'destructive',
            title: 'Verification error',
            description: 'Something went wrong. Please try again.',
          });
          setIsVerifying(false);
        }
      }
    };

    handleEmailVerification();
  }, [navigate, toast]);

  // If user is already logged in and verified, redirect to home
  useEffect(() => {
    if (!loading && user && user.email_confirmed_at) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleResendEmail = async () => {
    if (!email) {
      toast({
        variant: 'destructive',
        title: 'No email provided',
        description: 'Please go back and sign up again.',
      });
      return;
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`,
        },
      });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to resend',
          description: error.message,
        });
      } else {
        toast({
          title: 'Email sent!',
          description: 'Please check your inbox for the verification link.',
        });
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Something went wrong. Please try again.',
      });
    }
  };

  if (loading || isVerifying) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">
            {isVerifying ? 'Verifying your email...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary rounded-full">
              <CheckCircle className="h-8 w-8 text-primary-foreground" />
            </div>
            </div>
            <CardTitle className="text-2xl">Email Verified!</CardTitle>
            <CardDescription>
              Your account is now active. Redirecting to dashboard...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary rounded-full">
              <Mail className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
          <CardDescription>
            We've sent a verification link to{' '}
            <span className="font-medium text-foreground">{email || 'your email'}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Click the link in your email to verify your account and get started.
              The link will expire in 24 hours.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleResendEmail}
            >
              Resend verification email
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate('/auth')}
            >
              Back to login
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Didn't receive the email? Check your spam folder or try resending.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
