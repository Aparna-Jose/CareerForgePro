import { motion } from 'motion/react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';

interface WeakArea {
  area: string;
  issue: string;
  impact: string;
  fix: string;
}

interface ATSScoreMeterProps {
  score: number;
  suggestions: string[];
  matchedKeywords?: string[];
  missingKeywords?: string[];
  weakAreas?: WeakArea[];
}

export function ATSScoreMeter({ 
  score, 
  suggestions, 
  matchedKeywords = [], 
  missingKeywords = [],
  weakAreas = []
}: ATSScoreMeterProps) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-emerald-500';
    if (s >= 60) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getScoreStroke = (s: number) => {
    if (s >= 80) return 'stroke-emerald-500';
    if (s >= 60) return 'stroke-amber-500';
    return 'stroke-rose-500';
  };

  return (
    <div className="space-y-12">
      {/* Centered Score Card */}
      <div className="glass-card rounded-[3rem] p-12 flex flex-col items-center text-center">
        <div className="flex items-center gap-3 mb-8">
          <TrendingUp size={24} className="text-indigo-600" />
          <h3 className="text-2xl font-display font-bold text-slate-950">ATS Match Score</h3>
        </div>

        <div className="relative flex items-center justify-center mb-8">
          <svg className="h-64 w-64 -rotate-90 transform">
            <circle
              cx="128"
              cy="128"
              r="110"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className="text-slate-100"
            />
            <motion.circle
              cx="128"
              cy="128"
              r="110"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={691.15}
              initial={{ strokeDashoffset: 691.15 }}
              animate={{ strokeDashoffset: 691.15 - (691.15 * score) / 100 }}
              transition={{ duration: 2, ease: "easeOut" }}
              className={getScoreStroke(score)}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className={`text-8xl font-display font-black tracking-tighter ${getScoreColor(score)}`}>{score}</span>
            <Badge variant="outline" className={`${getScoreColor(score)} bg-white/50 border-black/5 px-4 py-1 text-xs font-bold uppercase tracking-widest`}>
              {score >= 80 ? 'Excellent' : score >= 60 ? 'Good Match' : 'Needs Optimization'}
            </Badge>
          </div>
        </div>
        
        <p className="max-w-md text-slate-500 leading-relaxed">
          {score >= 80 
            ? "Your resume is highly optimized for this role. You have a strong chance of passing the ATS filters." 
            : score >= 60 
            ? "Good start! A few more targeted keywords and impact metrics will push you into the top tier." 
            : "Significant gaps identified. Follow the critical fixes below to improve your visibility."}
        </p>
      </div>

      {/* Keyword Analysis (Full Width) */}
      {(matchedKeywords.length > 0 || missingKeywords.length > 0) && (
        <div className="glass-card rounded-[2.5rem] p-10 space-y-8">
          <div className="flex items-center justify-between">
            <h4 className="text-xl font-display font-bold text-slate-950">Keyword Intelligence</h4>
            <div className="flex gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-emerald-600"><div className="h-2 w-2 rounded-full bg-emerald-500" /> Matched</span>
              <span className="flex items-center gap-1.5 text-rose-600"><div className="h-2 w-2 rounded-full bg-rose-500" /> Missing</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {matchedKeywords.map((kw, i) => (
              <Badge key={i} variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 px-4 py-1.5 text-xs font-bold rounded-xl">
                {kw}
              </Badge>
            ))}
            {missingKeywords.map((kw, i) => (
              <Badge key={i} variant="secondary" className="bg-rose-50 text-rose-700 border-rose-100 px-4 py-1.5 text-xs font-bold rounded-xl">
                {kw}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Weak Areas Analysis (Full Width Cards) */}
      {weakAreas.length > 0 && (
        <div className="space-y-8">
          <h4 className="text-2xl font-display font-bold text-slate-950 px-2">Critical Optimization Fixes</h4>
          <div className="grid grid-cols-1 gap-6">
            {weakAreas.map((area, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-8 rounded-[2.5rem] border-rose-100 bg-rose-50/20 hover:bg-rose-50/40 transition-colors"
              >
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="md:w-1/3 space-y-4">
                    <Badge variant="destructive" className="px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {area.area}
                    </Badge>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-rose-600 uppercase tracking-tighter">The Issue</p>
                      <p className="text-slate-950 font-bold text-lg leading-tight">{area.issue}</p>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-6">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Impact on Ranking</p>
                      <p className="text-slate-600 text-sm leading-relaxed">{area.impact}</p>
                    </div>
                    
                    <div className="p-5 bg-white/80 rounded-2xl border border-emerald-100 shadow-sm">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Strategic Fix</p>
                      <p className="text-emerald-800 text-sm font-medium leading-relaxed">{area.fix}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions Section */}
      <div className="glass-card rounded-[2.5rem] p-10 space-y-8">
        <h4 className="text-xl font-display font-bold text-slate-950">Strategic AI Suggestions</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestions.length > 0 ? (
            suggestions.map((s, i) => (
              <div key={i} className="flex gap-4 text-sm text-slate-600 bg-white/60 p-5 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-colors group">
                <div className="h-8 w-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 group-hover:bg-amber-100 transition-colors">
                  <AlertCircle size={18} className="text-amber-500" />
                </div>
                <span className="leading-relaxed">{s}</span>
              </div>
            ))
          ) : (
            <div className="col-span-2 flex flex-col items-center justify-center py-10 text-center space-y-4">
              <div className="h-16 w-16 rounded-3xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 size={32} className="text-emerald-500" />
              </div>
              <div>
                <h5 className="font-bold text-slate-950">Perfectly Optimized</h5>
                <p className="text-sm text-slate-500">Your resume is already performing at its peak for this role.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
