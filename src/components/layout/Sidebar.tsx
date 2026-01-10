import { Link, useLocation } from 'react-router-dom';
import { Sun, ShoppingCart, User, LogOut, Zap, CreditCard } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  role: 'producer' | 'consumer' | null;
}

export function Sidebar({ role }: SidebarProps) {
  const location = useLocation();
  const { signOut } = useAuthContext();

  const handleSignOut = async () => {
    await signOut();
  };

  const navItems = [
    ...(role === 'producer' ? [
      { path: '/dashboard', label: 'Dashboard', icon: Sun }
    ] : []),
    ...(role === 'consumer' ? [
      { path: '/consumer', label: 'Dashboard', icon: CreditCard }
    ] : []),
    { path: '/marketplace', label: 'Marketplace', icon: ShoppingCart },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 flex-col bg-primary text-primary-foreground">
        <div className="p-6 border-b border-primary/20">
          <Link to="/" className="flex items-center gap-2">
            <Zap className="h-8 w-8" />
            <span className="text-xl font-bold">SolarCredit</span>
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                location.pathname === item.path
                  ? "bg-primary-foreground/20 font-semibold"
                  : "hover:bg-primary-foreground/10"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-primary/20">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-primary text-primary-foreground z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <Zap className="h-6 w-6" />
            <span className="font-bold">SolarCredit</span>
          </Link>
        </div>
        <nav className="flex overflow-x-auto px-2 pb-2 gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors",
                location.pathname === item.path
                  ? "bg-primary-foreground/20 font-semibold"
                  : "hover:bg-primary-foreground/10"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </nav>
      </header>
    </>
  );
}
