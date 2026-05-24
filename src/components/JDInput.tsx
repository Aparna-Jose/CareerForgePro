import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2 } from 'lucide-react';

interface JDInputProps {
  value: string;
  onChange: (val: string) => void;
  onOptimize: () => void;
  isLoading: boolean;
}

export function JDInput({ value, onChange, onOptimize, isLoading }: JDInputProps) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <Label htmlFor="jd" className="text-base font-semibold text-slate-800">Job Description</Label>
        <span className="text-xs text-slate-400">{value.length} characters</span>
      </div>
      <Textarea
        id="jd"
        placeholder="Paste the job description here to tailor your resume..."
        className="min-h-[200px] resize-none border-black/5 bg-white/50 focus:bg-white transition-all focus:ring-indigo-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <Button
        onClick={onOptimize}
        disabled={isLoading || !value}
        className="mt-4 w-full gap-2 bg-indigo-600 text-white hover:bg-indigo-700 h-12 shadow-lg shadow-indigo-100"
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" size={18} />
            Calculating ATS Score...
          </>
        ) : (
          <>
            <Sparkles size={18} />
            Calculate ATS Score
          </>
        )}
      </Button>
    </div>
  );
}
