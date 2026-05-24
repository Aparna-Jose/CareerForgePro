import { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { ResumeEditor } from './ResumeEditor';
import { ResumePreview } from './ResumePreview';
import { JDInput } from './JDInput';
import { ATSScoreMeter } from './ATSScoreMeter';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Briefcase, Sparkles, Download, History, Moon, Sun, Save, Loader2, ShieldCheck, Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface DashboardProps {
  user: User;
  subscriptionStatus: string;
  nextBillingDate: string | null;
}

export function Dashboard({ user, subscriptionStatus, nextBillingDate }: DashboardProps) {
  const [resumes, setResumes] = useState<any[]>([]);
  const [activeResume, setActiveResume] = useState<any>(null);
  const [jdText, setJdText] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [coverLetterText, setCoverLetterText] = useState('');
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState('standard');
  const resultsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-save effect
  useEffect(() => {
    if (!activeResume) return;
    
    const timer = setTimeout(async () => {
      setIsSaving(true);
      try {
        const resumeRef = doc(db, 'resumes', activeResume.id);
        await updateDoc(resumeRef, {
          content: activeResume.content,
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `resumes/${activeResume.id}`);
      } finally {
        setIsSaving(false);
      }
    }, 2000); // 2 second debounce

    return () => clearTimeout(timer);
  }, [activeResume?.content]);

  useEffect(() => {
    const q = query(collection(db, 'resumes'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setResumes(docs);
      if (docs.length > 0 && !activeResume) {
        setActiveResume(docs[0]);
      }
    });
    return () => unsubscribe();
  }, [user.uid]);
  const isFreeLimitReached = subscriptionStatus !== 'pro' && resumes.length >= 1;

  const createNewResume = async () => {
    if (isFreeLimitReached) {
      toast.error('Free tier is limited to 1 resume. Upgrade to Pro for unlimited resumes!');
      return;
    }
    try {
      const newResumeData = {
        userId: user.uid,
        title: 'Untitled Resume',
        content: {
          personal: { name: user.displayName || '', email: user.email || '', phone: '', location: '', website: '' },
          experience: [],
          education: [],
          skills: [],
          summary: ''
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'resumes'), newResumeData);
      setActiveResume({ id: docRef.id, ...newResumeData });
      toast.success('New resume created');
    } catch (error) {
      toast.error('Failed to create resume');
    }
  };

  const handleImportPDF = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isFreeLimitReached) {
      toast.error('Free tier is limited to 1 resume. Upgrade to Pro for unlimited resumes!');
      return;
    }
    
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset input so the same file can be selected again
    event.target.value = '';

    setIsImporting(true);
    const toastId = toast.loading('Extracting and analyzing your PDF...');

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await fetch('/api/parse-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to parse PDF');
      }

      const parsedData = await response.json();

      const newResumeData = {
        userId: user.uid,
        title: `${file.name.replace('.pdf', '')} (Imported)`,
        content: {
          personal: parsedData.personal || { name: user.displayName || '', email: user.email || '', phone: '', location: '', website: '' },
          experience: parsedData.experience || [],
          education: parsedData.education || [],
          skills: parsedData.skills || [],
          summary: parsedData.summary || ''
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'resumes'), newResumeData);
      setActiveResume({ id: docRef.id, ...newResumeData });
      
      toast.success('PDF successfully imported!', { id: toastId });
    } catch (error) {
      console.error('PDF Import Error:', error);
      toast.error('Failed to extract text from PDF. Ensure it is not a scanned image.', { id: toastId });
    } finally {
      setIsImporting(false);
    }
  };

  const updateResume = (content: any) => {
    if (!activeResume) return;
    setActiveResume((prev: any) => ({ ...prev, content }));
  };

  const handleOptimize = async () => {
    if (!jdText || !activeResume) {
      toast.error('Please enter a job description and select a resume first');
      return;
    }
    setIsOptimizing(true);
    try {
      toast.info('AI is analyzing and optimizing your resume...');
      
      const resumeText = `
        Name: ${activeResume.content.personal.name}
        Summary: ${activeResume.content.summary}
        Experience: ${activeResume.content.experience.map((e: any) => `${e.role} at ${e.company}: ${e.description}`).join('\n')}
        Education: ${(activeResume.content.education || []).map((e: any) => `${e.degree} from ${e.school} (${e.year})`).join('\n')}
        Skills: ${activeResume.content.skills.join(', ')}
      `;

      const response = await fetch('/api/optimize-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jdText })
      });

      if (!response.ok) throw new Error('Optimization failed');
      const result = await response.json();
      
      // Update the resume in Firestore with the new score and suggestions
      try {
        await updateDoc(doc(db, 'resumes', activeResume.id), {
          atsScore: result.score,
          suggestions: result.suggestions,
          matchedKeywords: result.matched_keywords,
          missingKeywords: result.missing_keywords,
          weakAreas: result.weak_areas,
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `resumes/${activeResume.id}`);
      }

      toast.success(`Resume optimized! ATS Match Score: ${result.score}%`);
      
      // Smooth scroll to results on mobile or if needed
      if (window.innerWidth < 1024 && resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Optimization error:', error);
      toast.error('Optimization failed');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleExportPDF = async () => {
    if (!activeResume) return;
    toast.info('Generating your PDF...');
    try {
      const resumeHtml = document.getElementById('resume-preview-content')?.outerHTML;
      if (!resumeHtml) throw new Error('Preview content not found');

      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: resumeHtml })
      });

      if (!response.ok) throw new Error('PDF generation failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeResume.title.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast.error('Failed to export PDF');
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (subscriptionStatus !== 'pro') {
      toast.error('Cover letters are a Pro feature! Please upgrade.');
      return;
    }
    if (!activeResume) {
      toast.error('Please select a resume first.');
      return;
    }
    
    setIsGeneratingCoverLetter(true);
    const toastId = toast.loading('Generating tailored cover letter...');
    
    try {
      const resumeText = `
        Name: ${activeResume.content.personal.name}
        Summary: ${activeResume.content.summary}
        Experience: ${activeResume.content.experience.map((e: any) => `${e.role} at ${e.company}: ${e.description}`).join('\n')}
        Education: ${(activeResume.content.education || []).map((e: any) => `${e.degree} from ${e.school} (${e.year})`).join('\n')}
        Skills: ${activeResume.content.skills.join(', ')}
      `;

      const response = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jdText })
      });

      if (!response.ok) throw new Error('Generation failed');
      const result = await response.json();
      
      setCoverLetterText(result.coverLetter);
      toast.success('Cover letter generated successfully!', { id: toastId });
    } catch (error) {
      console.error('Cover letter generation error:', error);
      toast.error('Failed to generate cover letter.', { id: toastId });
    } finally {
      setIsGeneratingCoverLetter(false);
    }
  };

  const handleDeleteResume = async (e: React.MouseEvent, resumeId: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this resume? This action cannot be undone.')) return;
    
    try {
      await deleteDoc(doc(db, 'resumes', resumeId));
      if (activeResume?.id === resumeId) {
        setActiveResume(null);
      }
      toast.success('Resume deleted successfully');
    } catch (error) {
      console.error('Error deleting resume:', error);
      toast.error('Failed to delete resume');
    }
  };

  const handleUpgrade = async () => {
    if (isUpgrading || isRedirecting) return;
    
    setIsUpgrading(true);
    const toastId = toast.loading('Preparing your secure checkout session...');
    
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, email: user.email }),
      });
      
      const data = await response.json();
      
      if (data.url) {
        setIsRedirecting(true);
        toast.success('Secure session ready!', { id: toastId });
        setTimeout(() => {
          window.location.href = data.url;
        }, 1200);
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error: any) {
      console.error('Checkout Redirection Error:', error);
      toast.error(error.message || 'An error occurred during checkout', { id: toastId });
      setIsUpgrading(false);
    }
  };

  return (
    <div className={`container mx-auto px-6 py-10 ${isDarkMode ? 'dark' : ''}`}>
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
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-4xl font-display font-extrabold tracking-tight text-slate-950">
              Workspace
            </h2>
            {subscriptionStatus === 'pro' && (
              <Badge className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter">
                Pro
              </Badge>
            )}
          </div>
          <p className="text-slate-500 font-medium">
            {activeResume ? `Editing: ${activeResume.title}` : 'Select a resume to begin your journey.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {isSaving && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100"
              >
                <Save size={12} className="animate-pulse" />
                Changes Saved
              </motion.div>
            )}
          </AnimatePresence>
          <div className="h-10 w-[1px] bg-slate-200 mx-2 hidden sm:block" />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="h-11 w-11 rounded-2xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-all"
          >
            {isDarkMode ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} className="text-slate-600" />}
          </Button>
          <Button 
            variant="outline" 
            onClick={createNewResume} 
            disabled={isFreeLimitReached}
            className="h-11 px-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 font-bold gap-2"
          >
            <FileText size={18} className="text-indigo-600" />
            New
          </Button>
          <input 
            type="file" 
            accept="application/pdf" 
            ref={fileInputRef} 
            onChange={handleImportPDF} 
            className="hidden" 
          />
          <Button 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isImporting || isFreeLimitReached}
            className="h-11 px-6 rounded-2xl bg-indigo-50 border border-indigo-100 shadow-sm hover:bg-indigo-100 text-indigo-700 font-bold gap-2 transition-colors"
          >
            {isImporting ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            Import PDF
          </Button>
          <Button 
            onClick={handleExportPDF}
            className="h-11 px-6 rounded-2xl bg-slate-950 text-white hover:bg-slate-800 shadow-xl shadow-slate-200 font-bold gap-2 group"
          >
            <Download size={18} className="transition-transform group-hover:translate-y-0.5" />
            Export
          </Button>
        </div>
      </motion.div>

      <div className="max-w-5xl mx-auto space-y-12">
        {/* Top Section: Editor & Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <Tabs defaultValue="editor" className="w-full">
            <div className="mb-6 flex items-center justify-between">
              <TabsList className="bg-slate-200/50 p-1.5 rounded-2xl backdrop-blur-sm border border-slate-200/50">
                <TabsTrigger value="editor" className="px-6 py-2 rounded-xl gap-2 font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md transition-all">
                  <FileText size={18} />
                  Editor
                </TabsTrigger>
                <TabsTrigger value="preview" className="px-6 py-2 rounded-xl gap-2 font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md transition-all">
                  <Sparkles size={18} />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="coverLetter" className="px-6 py-2 rounded-xl gap-2 font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md transition-all">
                  <FileText size={18} />
                  Cover Letter <Badge variant="secondary" className="ml-1 bg-amber-100 text-amber-800 border-amber-200">Pro</Badge>
                </TabsTrigger>
              </TabsList>
              
              {/* Premium Template Selector for Preview Tab */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-600">Template:</span>
                <select 
                  value={activeTemplate}
                  onChange={(e) => {
                    if (e.target.value !== 'standard' && subscriptionStatus !== 'pro') {
                      toast.error('Premium templates require a Pro subscription!');
                      return;
                    }
                    setActiveTemplate(e.target.value);
                  }}
                  className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-2"
                >
                  <option value="standard">Standard (Free)</option>
                  <option value="modern">Modern Professional (Pro)</option>
                  <option value="minimal">Minimalist (Pro)</option>
                  <option value="creative">Creative Color Block (Pro)</option>
                </select>
              </div>
            </div>

            <TabsContent value="editor" className="mt-0 focus-visible:outline-none">
              {activeResume ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <ResumeEditor 
                    data={activeResume.content} 
                    onChange={updateResume} 
                  />
                </motion.div>
              ) : (
                <div className="flex h-[400px] flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-white/30 backdrop-blur-sm p-12 text-center">
                  <div className="h-20 w-20 rounded-3xl bg-slate-50 flex items-center justify-center mb-6 shadow-inner">
                    <FileText size={40} className="text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No Resume Selected</h3>
                  <p className="text-slate-500 max-w-xs mb-8">Create a new resume or select one from your library to start optimizing.</p>
                  <Button onClick={createNewResume} size="lg" className="rounded-2xl px-8 bg-indigo-600">
                    Create Your First Resume
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="preview" className="mt-0 focus-visible:outline-none">
              {activeResume ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <ResumePreview 
                    data={activeResume.content} 
                    matchedKeywords={activeResume.matchedKeywords || []}
                    missingKeywords={activeResume.missingKeywords || []}
                    template={activeTemplate}
                  />
                </motion.div>
              ) : (
                <div className="flex h-[400px] items-center justify-center rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-white/30 backdrop-blur-sm">
                  <p className="text-slate-500">Select a resume to see preview.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="coverLetter" className="mt-0 focus-visible:outline-none">
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm min-h-[500px] flex flex-col">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Cover Letter Generator</h2>
                    <p className="text-sm text-slate-500">Uses your active resume and the target job description (if provided in the sidebar).</p>
                  </div>
                  <Button 
                    onClick={handleGenerateCoverLetter} 
                    disabled={isGeneratingCoverLetter}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-2 font-bold"
                  >
                    {isGeneratingCoverLetter ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                    Generate with AI
                  </Button>
                </div>
                
                {coverLetterText ? (
                  <textarea 
                    value={coverLetterText}
                    onChange={(e) => setCoverLetterText(e.target.value)}
                    className="w-full flex-grow p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 whitespace-pre-wrap focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none font-serif text-base leading-relaxed"
                    spellCheck="false"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center flex-grow opacity-50">
                    <FileText size={48} className="text-slate-300 mb-4" />
                    <p className="text-slate-500 font-medium">Click Generate to write your tailored cover letter</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
          {/* Always keep a hidden preview in the DOM for PDF generation */}
          {activeResume && (
            <div className="hidden">
              <ResumePreview 
                data={activeResume.content} 
                matchedKeywords={activeResume.matchedKeywords || []}
                missingKeywords={activeResume.missingKeywords || []}
                template={activeTemplate}
              />
            </div>
          )}
        </motion.div>

        {/* Middle Section: Job Description Input */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-8"
        >
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1 w-full">
              <JDInput value={jdText} onChange={setJdText} onOptimize={handleOptimize} isLoading={isOptimizing} />
            </div>
            
            {/* Subscription Status Card */}
            <div className="w-full md:w-80 glass-card rounded-[2.5rem] p-8 border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 h-24 w-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                    <ShieldCheck size={20} className="text-indigo-600" />
                  </div>
                  <Badge className={`px-3 py-0.5 rounded-full text-[9px] font-black tracking-widest ${subscriptionStatus === 'pro' ? 'bg-indigo-600' : 'bg-slate-400'}`}>
                    {subscriptionStatus.toUpperCase()}
                  </Badge>
                </div>
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-950 text-sm">Account Status</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {subscriptionStatus === 'pro' 
                      ? 'Full premium access enabled.' 
                      : 'Upgrade for unlimited AI power.'}
                  </p>
                  {subscriptionStatus === 'pro' ? (
                    nextBillingDate && (
                      <div className="pt-3 border-t border-indigo-100 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Next Billing</span>
                        <span className="text-xs font-bold text-indigo-600">{new Date(nextBillingDate).toLocaleDateString()}</span>
                      </div>
                    )
                  ) : (
                    <Button 
                      onClick={handleUpgrade}
                      disabled={isUpgrading || isRedirecting}
                      className="w-full mt-2 h-10 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-bold text-xs gap-2 shadow-lg shadow-indigo-100"
                    >
                      {isUpgrading ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          {isRedirecting ? 'Redirecting...' : 'Processing...'}
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} />
                          Upgrade to Pro
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom Section: Results (Full Width) */}
        <div ref={resultsRef} className="relative w-full">
          <AnimatePresence mode="wait">
            {isOptimizing ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card rounded-[2.5rem] p-16 flex flex-col items-center justify-center text-center space-y-8 border-indigo-100"
              >
                <div className="relative">
                  <div className="h-24 w-24 rounded-[2rem] bg-indigo-50 flex items-center justify-center">
                    <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
                  </div>
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -top-3 -right-3 h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shadow-md"
                  >
                    <Sparkles size={20} className="text-amber-500" />
                  </motion.div>
                </div>
                <div>
                  <h4 className="text-3xl font-display font-extrabold text-slate-950 mb-3">Analyzing Your Potential</h4>
                  <p className="text-lg text-slate-500 max-w-md mx-auto leading-relaxed">Our AI is meticulously scanning every bullet point to ensure you stand out from the crowd.</p>
                </div>
              </motion.div>
            ) : activeResume && activeResume.atsScore !== undefined && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-12"
              >
                <div className="text-center space-y-2">
                  <h3 className="text-3xl font-display font-extrabold text-slate-950">Optimization Results</h3>
                  <p className="text-slate-500">Based on your latest resume content and job description.</p>
                </div>
                
                <ATSScoreMeter 
                  score={activeResume.atsScore || 0} 
                  suggestions={activeResume.suggestions || []} 
                  matchedKeywords={activeResume.matchedKeywords || []}
                  missingKeywords={activeResume.missingKeywords || []}
                  weakAreas={activeResume.weakAreas || []}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Library Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-[2.5rem] p-10"
        >
          <div className="flex items-center justify-between mb-10">
            <h3 className="flex items-center gap-4 text-2xl font-display font-extrabold text-slate-950">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                <History size={24} className="text-indigo-600" />
              </div>
              Resume Library
            </h3>
            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{resumes.length} Saved Versions</span>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {resumes.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                onClick={() => {
                  setActiveResume(r);
                  toast.info(`Loaded: ${r.title}`);
                }}
                className={`group relative rounded-[2rem] p-8 text-left transition-all border-2 cursor-pointer ${
                  activeResume?.id === r.id 
                    ? 'bg-slate-950 text-white border-slate-950 shadow-2xl shadow-slate-200 scale-[1.02]' 
                    : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50'
                }`}
              >
                <button 
                  onClick={(e) => handleDeleteResume(e, r.id)}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete Resume"
                >
                  <Trash2 size={16} />
                </button>
                <div className={`mb-6 h-14 w-14 rounded-2xl flex items-center justify-center transition-colors ${
                  activeResume?.id === r.id ? 'bg-white/10' : 'bg-slate-50 group-hover:bg-indigo-50'
                }`}>
                  <FileText size={28} className={activeResume?.id === r.id ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'} />
                </div>
                <div className="font-bold truncate text-xl mb-2">{r.title}</div>
                <div className={`text-sm font-medium ${activeResume?.id === r.id ? 'text-slate-400' : 'text-slate-400'}`}>
                  {r.updatedAt?.seconds ? new Date(r.updatedAt.seconds * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Just now'}
                </div>
                {activeResume?.id === r.id && (
                  <div className="absolute top-6 right-16 h-3 w-3 rounded-full bg-indigo-400 animate-pulse" />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
