import { Sun, RefreshCw, Store, Zap, Receipt, ShoppingCart, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PanelType = 
  | 'logEnergy' 
  | 'convertCredits' 
  | 'marketplace' 
  | 'payBill' 
  | 'paymentHistory' 
  | 'buyCredits'
  | 'solarGPT'
  | null;

interface ActionIconGridProps {
  role: 'producer' | 'consumer';
  activePanel: PanelType;
  onPanelChange: (panel: PanelType) => void;
}

interface ActionItem {
  id: PanelType;
  icon: React.ElementType;
  label: string;
}

const producerActions: ActionItem[] = [
  { id: 'logEnergy', icon: Sun, label: 'Log Energy' },
  { id: 'convertCredits', icon: RefreshCw, label: 'Convert to Credits' },
  { id: 'marketplace', icon: Store, label: 'Marketplace' },
  { id: 'payBill', icon: Zap, label: 'Pay Electricity Bill' },
  { id: 'paymentHistory', icon: Receipt, label: 'Payment History' },
  { id: 'solarGPT', icon: Bot, label: 'SolarGPT' },
];

const consumerActions: ActionItem[] = [
  { id: 'buyCredits', icon: ShoppingCart, label: 'Buy Credits' },
  { id: 'payBill', icon: Zap, label: 'Pay Electricity Bill' },
  { id: 'paymentHistory', icon: Receipt, label: 'Payment History' },
  { id: 'solarGPT', icon: Bot, label: 'SolarGPT' },
];

export function ActionIconGrid({ role, activePanel, onPanelChange }: ActionIconGridProps) {
  const actions = role === 'producer' ? producerActions : consumerActions;

  return (
    <div className={cn(
      "grid gap-4",
      role === 'producer' ? "grid-cols-3 md:grid-cols-6" : "grid-cols-2 md:grid-cols-4"
    )}>
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => onPanelChange(activePanel === action.id ? null : action.id)}
          className={cn(
            "flex flex-col items-center gap-2 p-4 rounded-xl transition-all",
            "hover:bg-muted border-2",
            activePanel === action.id
              ? "border-primary bg-primary/5 text-primary"
              : "border-transparent bg-card hover:border-muted-foreground/20"
          )}
        >
          <div className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center",
            activePanel === action.id
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          )}>
            <action.icon className="h-6 w-6" />
          </div>
          <span className="text-sm font-medium text-center leading-tight">
            {action.label}
          </span>
        </button>
      ))}
    </div>
  );
}
