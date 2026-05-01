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


        </div>
      </div>
    </div>
  );
}
