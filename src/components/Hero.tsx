import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';
import { CheckCircle2, Sparkles, Zap, ArrowRight, Star } from 'lucide-react';

interface HeroProps {
  onGetStarted: () => void;
}

export function Hero({ onGetStarted }: HeroProps) {
  return (
    <div className="relative overflow-hidden pt-20 pb-32">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center gap-2 rounded-full bg-white/50 backdrop-blur-sm px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-600 border border-indigo-100 shadow-sm"
          >
            <div className="flex -space-x-1 mr-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-5 w-5 rounded-full border-2 border-white bg-slate-200" />
              ))}
            </div>
            <span>Trusted by 50,000+ Job Seekers</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.8 }}
            className="max-w-5xl font-display text-6xl font-extrabold tracking-tight sm:text-8xl text-slate-950 leading-[1.1]"
          >
            Land Your Dream Job with <span className="text-gradient">AI Precision.</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mt-8 max-w-2xl text-lg text-slate-600 sm:text-xl leading-relaxed"
          >
            CareerForge Pro is the ultimate AI engine for modern professionals. We don't just fix your resume—we engineer it to beat the ATS and impress recruiters.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-12 flex flex-col items-center gap-6 sm:flex-row"
          >
            <Button 
              size="lg" 
              onClick={onGetStarted} 
              className="h-16 px-10 text-lg bg-slate-900 text-white hover:bg-slate-800 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 group"
            >
              Start Forging Now
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/50 border border-slate-200 text-slate-600 font-medium">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              <span>4.9/5 Rating</span>
            </div>
          </motion.div>

          {/* Floating Preview Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="mt-24 relative w-full max-w-5xl"
          >
            <div className="glass-card rounded-3xl p-4 shadow-2xl border-white/40 overflow-hidden group">
              <div className="rounded-2xl bg-slate-100/50 aspect-[16/9] flex items-center justify-center overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10" />
                <div className="relative z-10 w-3/4 h-3/4 bg-white rounded-xl shadow-2xl p-8 flex flex-col gap-4 animate-float">
                  <div className="h-8 w-1/3 bg-slate-100 rounded-lg" />
                  <div className="h-4 w-full bg-slate-50 rounded-lg" />
                  <div className="h-4 w-5/6 bg-slate-50 rounded-lg" />
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="h-32 bg-indigo-50/50 rounded-xl border border-indigo-100" />
                    <div className="h-32 bg-slate-50 rounded-xl border border-slate-100" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute -top-12 -left-12 h-24 w-24 bg-indigo-500/20 rounded-full blur-2xl animate-pulse" />
            <div className="absolute -bottom-12 -right-12 h-32 w-32 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
