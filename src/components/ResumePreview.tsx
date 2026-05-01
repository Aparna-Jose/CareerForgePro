import { motion } from 'motion/react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Phone, Mail, MapPin, Globe } from 'lucide-react';

interface ResumePreviewProps {
  data: any;
  matchedKeywords?: string[];
  missingKeywords?: string[];
  template?: string;
}

export function ResumePreview({ data, matchedKeywords = [], missingKeywords = [], template = 'standard' }: ResumePreviewProps) {
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

  const ContactItem = ({ icon: Icon, text }: { icon: any, text: string }) => {
    if (!text) return null;
    return (
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className="opacity-70 shrink-0" />
        <span className="text-sm break-all">{text}</span>
      </div>
    );
  };

  if (template === 'modern') {
    // Dark left sidebar (like image 2)
    return (
      <ScrollArea className="h-[calc(100vh-250px)] rounded-2xl border border-black/5 bg-slate-300/50 p-8 backdrop-blur-sm">
        <motion.div id="resume-preview-content" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto resume-sheet flex bg-white p-0 overflow-hidden shadow-sm">
          {/* Left Sidebar */}
          <div className="w-[35%] bg-slate-800 text-white p-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-700 pb-2">Contact</h2>
            <div className="mb-8">
              <ContactItem icon={Phone} text={personal.phone} />
              <ContactItem icon={Mail} text={personal.email} />
              <ContactItem icon={MapPin} text={personal.location} />
              <ContactItem icon={Globe} text={personal.website} />
            </div>

            {education && education.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-700 pb-2">Education</h2>
                {education.map((edu: any, i: number) => (
                  <div key={i} className="mb-4">
                    <h3 className="font-bold text-slate-100 text-sm">{edu.degree}</h3>
                    <div className="text-xs text-slate-300 mb-1">{edu.school}</div>
                    <div className="text-xs text-slate-400">{edu.year}</div>
                  </div>
                ))}
              </div>
            )}

            {skills && skills.length > 0 && (
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-700 pb-2">Skills</h2>
                <ul className="list-disc list-inside text-sm text-slate-200 space-y-1">
                  {skills.map((skill: string, i: number) => (
                    <li key={i}>{skill}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="w-[65%] p-8 bg-white">
            <header className="mb-8 border-b-2 border-slate-100 pb-8">
              <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight uppercase">{personal.name || 'Your Name'}</h1>
              {experience && experience.length > 0 && (
                <div className="text-lg text-indigo-600 font-medium tracking-wide uppercase">{experience[0].role}</div>
              )}
            </header>

            {summary && (
              <section className="mb-8">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-900 mb-3">
                  <div className="w-6 h-6 bg-slate-800 text-white rounded-full flex items-center justify-center text-xs">U</div>
                  About Me
                </h2>
                <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{highlightText(summary)}</p>
              </section>
            )}

            {experience && experience.length > 0 && (
              <section>
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-900 mb-4">
                  <div className="w-6 h-6 bg-slate-800 text-white rounded-full flex items-center justify-center text-xs">E</div>
                  Experience
                </h2>
                <div className="space-y-6">
                  {experience.map((exp: any, i: number) => (
                    <div key={i}>
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="font-bold text-slate-900 text-base">{exp.role}</h3>
                        <span className="text-xs font-bold text-slate-500">{exp.duration}</span>
                      </div>
                      <div className="text-sm font-medium text-indigo-600 mb-2">{exp.company}</div>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{highlightText(exp.description)}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </motion.div>
      </ScrollArea>
    );
  }

  if (template === 'minimal') {
    // Two column clean (like image 1)
    return (
      <ScrollArea className="h-[calc(100vh-250px)] rounded-2xl border border-black/5 bg-slate-300/50 p-8 backdrop-blur-sm">
        <motion.div id="resume-preview-content" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto resume-sheet flex flex-col p-10 bg-white">
          {/* Header */}
          <header className="flex justify-between items-end border-b border-slate-300 pb-6 mb-6">
            <div>
              <h1 className="text-4xl font-light text-slate-900 tracking-widest mb-2 uppercase">{personal.name || 'YOUR NAME'}</h1>
              {experience && experience.length > 0 && (
                <div className="text-sm tracking-[0.2em] text-slate-500 uppercase">{experience[0].role}</div>
              )}
            </div>
            <div className="text-xs text-slate-600 space-y-1 text-right">
              {personal.phone && <div>{personal.phone}</div>}
              {personal.email && <div>{personal.email}</div>}
              {personal.location && <div>{personal.location}</div>}
              {personal.website && <div>{personal.website}</div>}
            </div>
          </header>

          <div className="flex gap-8">
            {/* Left Column (Main Content) */}
            <div className="w-[65%]">
              {summary && (
                <section className="mb-8">
                  <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-900 mb-4 pb-2 border-b border-slate-200">Profile</h2>
                  <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">{highlightText(summary)}</p>
                </section>
              )}

              {experience && experience.length > 0 && (
                <section>
                  <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-900 mb-6 pb-2 border-b border-slate-200">Work Experience</h2>
                  <div className="space-y-6">
                    {experience.map((exp: any, i: number) => (
                      <div key={i} className="relative pl-4 border-l-2 border-slate-300">
                        <div className="absolute w-2 h-2 bg-slate-900 rounded-full -left-[5px] top-1"></div>
                        <div className="text-xs font-bold text-slate-500 mb-1">{exp.duration}</div>
                        <h3 className="text-sm font-bold text-slate-900 mb-1">{exp.role}</h3>
                        <div className="text-xs text-slate-600 mb-2">{exp.company}</div>
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{highlightText(exp.description)}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Right Column (Sidebar) */}
            <div className="w-[35%] pl-8 border-l border-slate-100">
              {education && education.length > 0 && (
                <section className="mb-8">
                  <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-900 mb-4 pb-2 border-b border-slate-200">Education</h2>
                  <div className="space-y-4">
                    {education.map((edu: any, i: number) => (
                      <div key={i}>
                        <div className="text-xs font-bold text-slate-500 mb-1">{edu.year}</div>
                        <h3 className="text-xs font-bold text-slate-900">{edu.school}</h3>
                        <div className="text-xs text-slate-600">{edu.degree}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {skills && skills.length > 0 && (
                <section>
                  <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-900 mb-4 pb-2 border-b border-slate-200">Skills</h2>
                  <ul className="list-disc list-inside text-xs text-slate-600 space-y-1.5">
                    {skills.map((skill: string, i: number) => (
                      <li key={i}>{skill}</li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </div>
        </motion.div>
      </ScrollArea>
    );
  }

  if (template === 'creative') {
    // Teal/Beige color block (like image 3)
    return (
      <ScrollArea className="h-[calc(100vh-250px)] rounded-2xl border border-black/5 bg-slate-300/50 p-8 backdrop-blur-sm">
        <motion.div id="resume-preview-content" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto resume-sheet flex bg-white p-0 overflow-hidden shadow-sm">
          {/* Left Sidebar - Teal */}
          <div className="w-[35%] bg-teal-600 text-white px-8 py-12 flex flex-col">
            <div className="w-24 h-24 bg-white/20 rounded-full mx-auto mb-8 border-4 border-white flex items-center justify-center">
              <span className="text-4xl font-serif text-white">{personal.name ? personal.name.charAt(0).toUpperCase() : 'U'}</span>
            </div>

            {summary && (
              <section className="mb-10">
                <h2 className="text-xs font-bold uppercase tracking-widest text-teal-100 mb-3">Profile</h2>
                <p className="text-sm leading-relaxed text-teal-50 whitespace-pre-wrap">{highlightText(summary)}</p>
              </section>
            )}

            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-teal-100 mb-4">Contact Me</h2>
              <div className="space-y-3">
                <ContactItem icon={Phone} text={personal.phone} />
                <ContactItem icon={Mail} text={personal.email} />
                <ContactItem icon={MapPin} text={personal.location} />
                <ContactItem icon={Globe} text={personal.website} />
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="w-[65%] bg-white flex flex-col">
            {/* Beige Header */}
            <header className="bg-orange-100/60 px-10 py-12 mb-8">
              <h1 className="text-4xl font-bold text-slate-900 mb-2 uppercase tracking-wide">{personal.name || 'YOUR NAME'}</h1>
              {experience && experience.length > 0 && (
                <div className="text-lg text-slate-600 font-serif italic">{experience[0].role}</div>
              )}
            </header>

            <div className="px-10 pb-10">
              {education && education.length > 0 && (
                <section className="mb-8">
                  <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-teal-700 mb-4">
                    <span className="text-xl">›</span> Education
                  </h2>
                  <div className="space-y-4">
                    {education.map((edu: any, i: number) => (
                      <div key={i}>
                        <h3 className="font-bold text-slate-900 uppercase text-sm">{edu.school}</h3>
                        <div className="text-sm text-slate-700">{edu.degree}</div>
                        <div className="text-xs text-slate-500 italic">{edu.year}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {experience && experience.length > 0 && (
                <section className="mb-8">
                  <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-teal-700 mb-4">
                    <span className="text-xl">›</span> Work Experience
                  </h2>
                  <div className="space-y-6">
                    {experience.map((exp: any, i: number) => (
                      <div key={i}>
                        <h3 className="font-bold text-slate-900 uppercase text-sm">{exp.company}</h3>
                        <div className="text-xs text-slate-500 mb-2 italic">{exp.role}, {exp.duration}</div>
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{highlightText(exp.description)}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {skills && skills.length > 0 && (
                <section>
                  <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-teal-700 mb-4">
                    <span className="text-xl">›</span> Professional Skills
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill: string, i: number) => (
                      <span key={i} className="text-sm text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </motion.div>
      </ScrollArea>
    );
  }

  // Standard Template (Fallback)
  return (
    <ScrollArea className="h-[calc(100vh-250px)] rounded-2xl border border-black/5 bg-slate-300/50 p-8 backdrop-blur-sm">
      <motion.div id="resume-preview-content" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto resume-sheet p-10 bg-white shadow-sm">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2 uppercase tracking-wide">{personal.name || 'Your Name'}</h1>
          <div className="text-sm text-slate-600 flex flex-wrap justify-center gap-x-4 gap-y-1">
            {personal.email && <span>{personal.email}</span>}
            {personal.phone && <span>{personal.phone}</span>}
            {personal.location && <span>{personal.location}</span>}
          </div>
        </header>

        {summary && (
          <section className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-600 border-b border-slate-200 pb-1 mb-3">Professional Summary</h2>
            <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{highlightText(summary)}</p>
          </section>
        )}

        {experience && experience.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-600 border-b border-slate-200 pb-1 mb-3">Work Experience</h2>
            <div className="space-y-6">
              {experience.map((exp: any, i: number) => (
                <div key={i}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold text-slate-900 text-base">{exp.company}</h3>
                    <span className="text-xs font-medium text-slate-500">{exp.duration}</span>
                  </div>
                  <div className="text-sm font-medium text-indigo-600 mb-2">{exp.role}</div>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{highlightText(exp.description)}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {skills && skills.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-600 border-b border-slate-200 pb-1 mb-3">Core Competencies</h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill: string, i: number) => (
                <span key={i} className={`text-sm px-2 py-0.5 rounded border ${matchedKeywords.some(kw => kw.toLowerCase() === skill.toLowerCase()) ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'text-slate-700 bg-slate-50 border-slate-100'}`}>{skill}</span>
              ))}
            </div>
          </section>
        )}
      </motion.div>
    </ScrollArea>
  );
}
