import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const { user, loading } = useAuthContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const email = searchParams.get('email') || '';

  // Function to check if user is verified
  const checkVerificationStatus = useCallback(async () => {
    try {
      // Refresh the session to get latest user data
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.log('Session refresh error:', error.message);
        return false;
      }
      
      if (session?.user?.email_confirmed_at) {
        setIsVerified(true);
        toast({
          title: 'Email verified!',
          description: 'Welcome! Redirecting to your dashboard...',
        });
        navigate('/');
        return true;
      }
      
      return false;
    } catch (err) {
      console.log('Verification check error:', err);
      return false;
    }
  }, [navigate, toast]);

  // Handle email verification callback from Supabase link
  useEffect(() => {
    const handleEmailVerification = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');

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

  // Auto-check verification every 5 seconds
  useEffect(() => {
    if (isVerified || isVerifying) return;

    const intervalId = setInterval(() => {
      checkVerificationStatus();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [checkVerificationStatus, isVerified, isVerifying]);

  // If user is already logged in and verified, redirect to home
  useEffect(() => {
    if (!loading && user && user.email_confirmed_at) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleIveVerified = async () => {
    setIsCheckingVerification(true);
    
    const verified = await checkVerificationStatus();
    
    if (!verified) {
      toast({
        variant: 'destructive',
        title: 'Email not verified yet',
        description: 'Please check your inbox and click the verification link.',
      });
    }
    
    setIsCheckingVerification(false);
  };

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
          <div className="bg-primary/10 rounded-lg p-4 text-center">
            <Mail className="h-12 w-12 mx-auto mb-3 text-primary" />
            <p className="text-sm text-foreground font-medium">
              📩 Check your email to verify your account
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Click the link in your email, then come back here
            </p>
          </div>

        {/* OTP Display for Visual Effect */}
        <div className="space-y-3">
          <p className="text-center text-sm text-muted-foreground">
            Or enter the verification code from your email
          </p>
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otpValue}
              onChange={setOtpValue}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          <p className="text-xs text-center text-muted-foreground">
            (Demo: Any 6 digits work after clicking email link)
          </p>
        </div>

          <Button
            className="w-full h-12 text-lg"
            onClick={handleIveVerified}
            disabled={isCheckingVerification}
          >
            {isCheckingVerification ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Checking...
              </>
            ) : (
              "I've verified my email"
            )}
          </Button>

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
