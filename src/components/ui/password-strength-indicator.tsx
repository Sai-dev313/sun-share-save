import { getPasswordStrength } from '@/lib/password-validation';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  if (!password) return null;
  
  const { score, label, color } = getPasswordStrength(password);
  const maxScore = 6;
  const percentage = (score / maxScore) * 100;
  
  return (
    <div className="space-y-1">
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Password strength: <span className="font-medium">{label}</span>
      </p>
    </div>
  );
}
