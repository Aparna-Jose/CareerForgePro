import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Sparkles, Zap, ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface PricingProps {
  userId: string;
  email: string;
  currentStatus: string;
}

export function Pricing({ userId, email, currentStatus }: PricingProps) {
  const [loading, setLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleUpgrade = async () => {
    if (loading || isRedirecting) return;
    
    setLoading(true);
    const toastId = toast.loading('Preparing your secure checkout session...');
    
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email }),
      });
      
      const data = await response.json();
      
      if (data.url) {
        setIsRedirecting(true);
        toast.success('Secure session ready!', { id: toastId });
        // Small delay to let the user see the success state before redirect
        setTimeout(() => {
          window.location.href = data.url;
        }, 1200);
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error: any) {
      console.error('Checkout Redirection Error:', error);
      toast.error(error.message || 'An error occurred during checkout', { id: toastId });
      setLoading(false);
    }
  };

  const plans = [
    {
      name: 'Free',
      price: '₹0',
      description: 'Perfect for trying out CareerForge Pro.',
      features: [
        '1 Resume Draft',
        'Basic AI Optimization',
        'ATS Score Analysis',
        'Standard PDF Export',
      ],
      cta: 'Current Plan',
      disabled: true,
      highlight: false,
    },
    {
      name: 'Pro',
      price: '₹199',
      period: '/month',
      description: 'Everything you need for a successful job hunt.',
      features: [
        'Unlimited Resumes',
        'Advanced AI Rewrite Engine',
        'Cover Letter Generator',
        'Premium PDF Templates',
        'Priority AI Processing',
        'Version History',
      ],
      cta: currentStatus === 'pro' ? 'Current Plan' : 'Upgrade to Pro',
      disabled: currentStatus === 'pro',
      highlight: true,
    },
  ];

  return (
    <div className="py-20 relative">
      <AnimatePresence>
        {isRedirecting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-8 p-16 rounded-[4rem] bg-white shadow-[0_0_100px_rgba(79,70,229,0.3)] border border-white/20 text-center max-w-md mx-6"
            >
              <div className="relative">
                <div className="h-32 w-32 rounded-full border-4 border-indigo-50 border-t-indigo-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="h-16 w-16 rounded-3xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-200"
                  >
                    <ShieldCheck className="h-8 w-8 text-white" />
                  </motion.div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl font-display font-black text-slate-950 tracking-tight">Securing Your Session</h3>
                <p className="text-slate-500 leading-relaxed font-medium">
                  We're establishing a bank-grade encrypted connection to Stripe. Please do not refresh the page.
                </p>
                <div className="pt-4 flex items-center justify-center gap-2">
                  <div className="h-1 w-12 rounded-full bg-indigo-600 animate-pulse" />
                  <div className="h-1 w-12 rounded-full bg-indigo-400 animate-pulse delay-75" />
                  <div className="h-1 w-12 rounded-full bg-indigo-200 animate-pulse delay-150" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black uppercase tracking-widest mb-6 border border-indigo-100"
        >
          <Zap size={14} className="fill-indigo-600" />
          Pricing Plans
        </motion.div>
        <h2 className="text-5xl font-display font-extrabold tracking-tight text-slate-950 sm:text-6xl mb-6">
          Invest in Your <span className="text-gradient">Future.</span>
        </h2>
        <p className="max-w-2xl mx-auto text-lg text-slate-600 leading-relaxed">
          Choose the plan that fits your career goals. Unlock the full power of AI to land your dream job faster.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2 max-w-5xl mx-auto px-6">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.8 }}
          >
            <Card className={`relative flex flex-col h-full rounded-[2.5rem] overflow-hidden transition-all duration-500 ${
              plan.highlight 
                ? 'border-indigo-600 shadow-2xl shadow-indigo-100 ring-1 ring-indigo-600 scale-[1.02] z-10' 
                : 'glass-card border-slate-200 shadow-xl shadow-slate-100'
            }`}>
              {plan.highlight && (
                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-black px-6 py-2 rounded-bl-3xl flex items-center gap-2 tracking-tighter">
                  <Sparkles size={14} />
                  MOST POPULAR
                </div>
              )}
              <CardHeader className="p-10 pb-6">
                <CardTitle className="text-3xl font-display font-bold text-slate-950 mb-2">{plan.name}</CardTitle>
                <CardDescription className="text-slate-500 text-base">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="px-10 flex-1">
                <div className="mb-10 flex items-baseline gap-1">
                  <span className="text-6xl font-display font-black text-slate-950">{plan.price}</span>
                  {plan.period && <span className="text-xl font-bold text-slate-400">{plan.period}</span>}
                </div>
                <ul className="space-y-5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-4 text-sm font-medium text-slate-600 group">
                      <div className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        plan.highlight ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <span className="group-hover:text-slate-900 transition-colors">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="p-10 pt-6">
                <Button
                  className={`w-full h-16 text-lg font-bold rounded-2xl transition-all active:scale-95 ${
                    plan.highlight 
                      ? 'bg-slate-950 text-white hover:bg-slate-800 shadow-2xl shadow-slate-200' 
                      : 'bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                  disabled={plan.disabled || loading || isRedirecting}
                  onClick={plan.name === 'Pro' ? handleUpgrade : undefined}
                >
                  {loading && plan.name === 'Pro' ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>{isRedirecting ? 'Redirecting...' : 'Processing...'}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {plan.cta}
                      {!plan.disabled && <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />}
                    </div>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>


    </div>
  );
}
