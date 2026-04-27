import { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';
import { Flame, LogOut, User as UserIcon, LayoutDashboard, CreditCard } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onViewChange: (view: 'dashboard' | 'pricing') => void;
  currentView: 'dashboard' | 'pricing';
  subscriptionStatus: string;
}

export function Navbar({ user, onSignIn, onSignOut, onViewChange, currentView, subscriptionStatus }: NavbarProps) {
  return (
    <nav className="glass-nav">
      <div className="container mx-auto flex h-20 items-center justify-between px-6">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => onViewChange('dashboard')}>
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white shadow-lg shadow-slate-200"
            >
              <Flame size={22} className="fill-white" />
            </motion.div>
            <span className="text-2xl font-display font-bold tracking-tight text-slate-950">
              CareerForge <span className="text-indigo-600">Pro</span>
            </span>
          </div>

          {user && (
            <div className="hidden lg:flex items-center gap-2 p-1.5 bg-slate-100/50 rounded-2xl border border-slate-200/50">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onViewChange('dashboard')}
                className={`px-5 h-9 rounded-xl font-semibold transition-all ${currentView === 'dashboard' ? 'text-indigo-600 bg-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <LayoutDashboard size={16} className="mr-2" />
                Dashboard
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onViewChange('pricing')}
                className={`px-5 h-9 rounded-xl font-semibold transition-all ${currentView === 'pricing' ? 'text-indigo-600 bg-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <CreditCard size={16} className="mr-2" />
                Pricing
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-6">
          {user ? (
            <>
              <div className="hidden items-center gap-3 lg:flex px-4 py-2 rounded-2xl bg-white/50 border border-slate-200">
                <div className="h-8 w-8 overflow-hidden rounded-full border-2 border-white shadow-sm">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || ''} referrerPolicy="no-referrer" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-100">
                      <UserIcon size={16} />
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900 leading-none">{user.displayName}</span>
                  {subscriptionStatus === 'pro' && (
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">Pro Member</span>
                  )}
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onSignOut} 
                className="h-10 w-10 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut size={20} />
              </Button>
            </>
          ) : (
            <Button 
              onClick={onSignIn} 
              className="h-11 px-8 rounded-full bg-slate-950 text-white hover:bg-slate-800 shadow-xl shadow-slate-200 font-bold"
            >
              Get Started
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
