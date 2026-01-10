import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  variant?: 'default' | 'primary' | 'secondary';
  suffix?: string;
}

export function StatCard({ label, value, icon, variant = 'default', suffix }: StatCardProps) {
  return (
    <Card className={cn(
      "transition-all hover:shadow-lg",
      variant === 'primary' && "bg-primary text-primary-foreground",
      variant === 'secondary' && "bg-secondary text-secondary-foreground"
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className={cn(
              "text-sm font-medium",
              variant === 'default' && "text-muted-foreground"
            )}>{label}</p>
            <p className="text-3xl font-bold mt-2">
              {value}{suffix && <span className="text-lg ml-1">{suffix}</span>}
            </p>
          </div>
          <div className={cn(
            "p-3 rounded-lg",
            variant === 'default' && "bg-accent text-accent-foreground",
            variant === 'primary' && "bg-primary-foreground/20",
            variant === 'secondary' && "bg-secondary-foreground/20"
          )}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
