import { motion } from 'motion/react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ResumePreviewProps {
  data: any;
  matchedKeywords?: string[];
  missingKeywords?: string[];
}

export function ResumePreview({ data, matchedKeywords = [], missingKeywords = [] }: ResumePreviewProps) {
  const { personal, summary, experience, education, skills } = data;

  const highlightText = (text: string) => {
    if (!text || matchedKeywords.length === 0) return text;
    
    let highlighted = text;
    matchedKeywords.forEach(kw => {
      const regex = new RegExp(`(${kw})`, 'gi');
      highlighted = highlighted.replace(regex, '<mark class="bg-indigo-100 text-indigo-900 px-0.5 rounded">$1</mark>');
    });
    return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
  };

  return (
    <ScrollArea className="h-[calc(100vh-250px)] rounded-2xl border border-black/5 bg-slate-300/50 p-8 backdrop-blur-sm">
      <motion.div
        id="resume-preview-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto resume-sheet"
      >
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{personal.name || 'Your Name'}</h1>
          <div className="text-sm text-slate-600 flex flex-wrap justify-center gap-x-4 gap-y-1">
            {personal.email && <span>{personal.email}</span>}
            {personal.phone && <span>{personal.phone}</span>}
            {personal.location && <span>{personal.location}</span>}
          </div>
        </header>

        {/* Summary */}
        {summary && (
          <section className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-600 border-b border-slate-200 pb-1 mb-3">
              Professional Summary
            </h2>
            <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
              {highlightText(summary)}
            </p>
          </section>
        )}

        {/* Experience */}
        {experience && experience.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-600 border-b border-slate-200 pb-1 mb-3">
              Work Experience
            </h2>
            <div className="space-y-6">
              {experience.map((exp: any, i: number) => (
                <div key={i}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold text-slate-900">{exp.company}</h3>
                    <span className="text-xs font-medium text-slate-500">{exp.duration}</span>
                  </div>
                  <div className="text-sm font-medium text-indigo-600 mb-2">{exp.role}</div>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {highlightText(exp.description)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {skills && skills.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-600 border-b border-slate-200 pb-1 mb-3">
              Core Competencies
            </h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill: string, i: number) => (
                <span key={i} className={`text-sm px-2 py-0.5 rounded border ${matchedKeywords.some(kw => kw.toLowerCase() === skill.toLowerCase()) ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'text-slate-700 bg-slate-50 border-slate-100'}`}>
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}
      </motion.div>
    </ScrollArea>
  );
}
