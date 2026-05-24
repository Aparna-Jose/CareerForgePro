import { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { ResumeEditor } from './ResumeEditor';
import { ResumePreview } from './ResumePreview';
import { JDInput } from './JDInput';
import { ATSScoreMeter } from './ATSScoreMeter';
import { Pricing } from './Pricing';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Briefcase, Sparkles, Download, History, Moon, Sun, Save, Loader2, ShieldCheck, Upload, Trash2, Search, LogOut, User as UserIcon, ArrowLeft, Plus, Layout, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface DashboardProps {
  user: User;
  subscriptionStatus: string;
  nextBillingDate: string | null;
  onSignOut: () => void;
}

export function Dashboard({ user, subscriptionStatus, nextBillingDate, onSignOut }: DashboardProps) {
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
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'resumes' | 'ats' | 'cover-letter' | 'history' | 'pricing'>('resumes');
  const [workspaceMode, setWorkspaceMode] = useState<'editor' | 'preview'>('editor');
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isMobile, setIsMobile] = useState(false);
  const isResizingSidebar = useRef(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverLetterRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize cover letter textarea to prevent inner scrolling
  useEffect(() => {
    if (activeTab === 'cover-letter' && coverLetterRef.current) {
      coverLetterRef.current.style.height = 'auto';
      coverLetterRef.current.style.height = `${coverLetterRef.current.scrollHeight}px`;
    }
  }, [coverLetterText, activeTab]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);



  const startResizingSidebar = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    isResizingSidebar.current = true;
    
    // Add global body styles to lock resize cursor and prevent selection
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    
    const handleMouseMove = (mouseMoveEvent: MouseEvent) => {
      if (!isResizingSidebar.current) return;
      
      const newWidthPx = mouseMoveEvent.clientX;
      if (newWidthPx >= 200 && newWidthPx <= 400) {
        setSidebarWidth(newWidthPx);
      }
    };

    const handleMouseUp = () => {
      isResizingSidebar.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

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

  const filteredResumes = resumes.filter(r => 
    r.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navItems = [
    { id: 'resumes', label: 'My Resumes', icon: FileText },
    { id: 'ats', label: 'ATS Score', icon: ShieldCheck },
    { id: 'cover-letter', label: 'Cover Letter', icon: Sparkles },
    { id: 'history', label: 'History', icon: History },
    { id: 'pricing', label: 'Pricing', icon: CreditCard }
  ];

  return (
    <div className={`flex min-h-screen bg-zinc-50 text-zinc-900 font-sans ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : ''}`}>
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

      {/* LEFT SIDEBAR */}
      <aside 
        style={{ width: isMobile ? '256px' : `${sidebarWidth}px` }}
        className="border-r border-slate-200/80 bg-white/70 backdrop-blur-xl flex flex-col shrink-0 sticky top-0 h-screen overflow-y-auto"
      >
        <div className="h-20 flex items-center gap-2.5 px-6 border-b border-slate-200/60">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white shadow-md shadow-slate-200">
            <Layout size={18} className="fill-white" />
          </div>
          <span className="text-xl font-display font-bold tracking-tight text-slate-950">
            CareerForge <span className="text-indigo-600">Pro</span>
          </span>
        </div>

        <nav className="flex-grow p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                }}
                className={`w-full flex items-center gap-3.5 px-4.5 py-3 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100/50' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/80'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {subscriptionStatus !== 'pro' && (
          <div className="p-4 border-t border-slate-100 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 m-4 rounded-2xl border border-indigo-100/50 relative overflow-hidden group">
            <div className="absolute -right-2 -top-2 h-16 w-16 bg-indigo-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10 space-y-3">
              <h4 className="font-bold text-slate-950 text-xs flex items-center gap-1.5">
                <Sparkles size={12} className="text-indigo-600 animate-pulse" />
                Upgrade to Pro
              </h4>
              <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                Get 10x more interviews with unlimited resumes and cover letters.
              </p>
              <Button 
                size="sm"
                onClick={() => setActiveTab('pricing')}
                className="w-full h-8 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-bold text-[10px] gap-1 shadow-md shadow-indigo-100 cursor-pointer"
              >
                Upgrade Now
              </Button>
            </div>
          </div>
        )}
      </aside>

      {/* SIDEBAR RESIZE DIVIDER */}
      <div
        onMouseDown={startResizingSidebar}
        className="hidden lg:flex w-2 cursor-col-resize self-stretch select-none relative z-50"
        style={{ marginLeft: '-4px', marginRight: '-4px' }}
      />

      {/* MAIN CONTENT AREA */}
      <div className="flex-grow flex flex-col min-w-0 min-h-screen">
        {/* HEADER */}
        <header className="h-20 border-b border-slate-200/80 bg-white/70 backdrop-blur-xl flex items-center justify-between px-8 shrink-0 sticky top-0 z-40">
          {activeTab === 'resumes' && activeResume !== null ? (
            /* Editing Resume Header */
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setActiveResume(null)}
                className="h-10 w-10 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <ArrowLeft size={20} className="text-slate-600" />
              </Button>
              <input
                type="text"
                value={activeResume.title}
                onChange={async (e) => {
                  const newTitle = e.target.value;
                  setActiveResume((prev: any) => ({ ...prev, title: newTitle }));
                  try {
                    await updateDoc(doc(db, 'resumes', activeResume.id), {
                      title: newTitle,
                      updatedAt: serverTimestamp()
                    });
                  } catch (error) {
                    handleFirestoreError(error, OperationType.UPDATE, `resumes/${activeResume.id}`);
                  }
                }}
                className="text-lg font-display font-extrabold text-slate-950 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-500 outline-none px-1 py-0.5 rounded transition-all w-60"
              />
            </div>
          ) : activeTab === 'resumes' && activeResume === null ? (
            /* Standard Dashboard Header - Only visible on My Resumes page */
            <div className="relative w-72">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search resumes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
              />
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-4">
            {/* User Account / Profile block */}
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 shadow-sm">
              <div className="h-7 w-7 overflow-hidden rounded-full border border-slate-200">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || ''} referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-100">
                    <UserIcon size={12} />
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900 leading-none">{user.displayName}</span>
                {subscriptionStatus === 'pro' && (
                  <span className="text-[8px] font-black text-indigo-600 uppercase tracking-tighter mt-0.5">Pro Member</span>
                )}
              </div>
            </div>

            {/* Sign Out Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onSignOut} 
              className="h-10 w-10 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
            >
              <LogOut size={18} />
            </Button>
          </div>
        </header>

        {/* WORKSPACE / BODY */}
        <main className="flex-grow p-8 overflow-y-auto">
          {activeTab === 'resumes' ? (
            /* RESUMES VIEW */
            activeResume !== null ? (
              /* ACTIVE RESUME split screen workspace */
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
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
                          Auto-saving...
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setIsDarkMode(!isDarkMode)}
                      className="h-10 w-10 rounded-xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      {isDarkMode ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} className="text-slate-600" />}
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
                      size="sm"
                      onClick={() => fileInputRef.current?.click()} 
                      disabled={isImporting || isFreeLimitReached}
                      className="h-10 px-4 rounded-xl bg-indigo-50 border border-indigo-100 shadow-sm hover:bg-indigo-100 text-indigo-700 font-bold gap-2 transition-colors cursor-pointer"
                    >
                      {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                      Import PDF
                    </Button>
                    <Button 
                      size="sm"
                      onClick={handleExportPDF}
                      className="h-10 px-4 rounded-xl bg-slate-950 text-white hover:bg-slate-800 shadow-lg shadow-slate-200 font-bold gap-2 group cursor-pointer"
                    >
                      <Download size={16} className="transition-transform group-hover:translate-y-0.5" />
                      Export PDF
                    </Button>
                  </div>
                </div>

                {/* WORKSPACE MODE TABS */}
                <div className="flex border-b border-slate-200/80 mb-6 gap-2">
                  <button
                    onClick={() => setWorkspaceMode('editor')}
                    className={`pb-3 px-6 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                      workspaceMode === 'editor'
                        ? 'border-indigo-600 text-indigo-600 font-extrabold'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Resume Content Editor
                  </button>
                  <button
                    onClick={() => setWorkspaceMode('preview')}
                    className={`pb-3 px-6 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                      workspaceMode === 'preview'
                        ? 'border-indigo-600 text-indigo-600 font-extrabold'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Live Preview
                  </button>
                </div>

                <div className="w-full">
                  {workspaceMode === 'editor' ? (
                    /* EDITOR PANEL */
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm max-w-5xl mx-auto">
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-slate-100 pb-2 text-slate-900">
                        <FileText size={18} className="text-indigo-600" />
                        Resume Content Editor
                      </h3>
                      <ResumeEditor data={activeResume.content} onChange={updateResume} />
                    </div>
                  ) : (
                    /* PREVIEW PANEL */
                    <div className="max-w-5xl mx-auto space-y-4">
                      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4">
                          <span className="flex items-center gap-2 font-bold text-slate-900">
                            <Sparkles size={18} className="text-indigo-600 animate-pulse" />
                            Live Preview
                          </span>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500">Design Template:</span>
                            <select 
                              value={activeTemplate}
                              onChange={(e) => {
                                if (e.target.value !== 'standard' && subscriptionStatus !== 'pro') {
                                    toast.error('Premium templates require a Pro subscription!');
                                    return;
                                }
                                setActiveTemplate(e.target.value);
                              }}
                              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-1.5 outline-none font-bold"
                            >
                              <option value="standard">Standard (Free)</option>
                              <option value="modern">Modern Professional (Pro)</option>
                              <option value="minimal">Minimalist (Pro)</option>
                              <option value="creative">Creative Color Block (Pro)</option>
                            </select>
                          </div>
                        </div>

                        <div className="border border-slate-100 rounded-2xl bg-slate-50/50 p-6 flex justify-center">
                          <ResumePreview 
                            data={activeResume.content} 
                            matchedKeywords={activeResume.matchedKeywords || []}
                            missingKeywords={activeResume.missingKeywords || []}
                            template={activeTemplate}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* RESUMES DIRECTORY GRID (Home Screen) */
              <div className="space-y-10">
                {/* Greetings and summary panel */}
                <div>
                  <h2 className="text-3xl font-display font-extrabold tracking-tight text-slate-950">
                    Welcome, {user.displayName?.split(' ')[0] || 'User'}
                  </h2>
                  <p className="text-slate-500 font-medium">Manage and optimize your professional resumes below.</p>
                </div>

                {/* Dashboard stats cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                      <FileText size={24} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Resumes</span>
                      <span className="text-2xl font-black text-slate-900">{resumes.length}</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                      <Save size={24} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Drafts</span>
                      <span className="text-2xl font-black text-slate-900">
                        {resumes.filter(r => r.atsScore === undefined).length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Resumes Grid */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">Your Resumes</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Create New resume dashed card */}
                    <div 
                      onClick={createNewResume}
                      className={`rounded-[2rem] p-8 border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-white/40 hover:bg-indigo-50/20 text-center flex flex-col items-center justify-center min-h-[220px] transition-all cursor-pointer ${
                        isFreeLimitReached ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <div className="h-12 w-12 rounded-2xl bg-slate-50 hover:bg-indigo-100/50 flex items-center justify-center text-slate-400 hover:text-indigo-600 mb-4 shadow-inner">
                        <Plus size={24} />
                      </div>
                      <span className="font-bold text-slate-900 block text-base mb-1">Create New Resume</span>
                      <span className="text-xs text-slate-400 font-medium">
                        {isFreeLimitReached ? 'Upgrade for Unlimited' : 'Draft from scratch'}
                      </span>
                    </div>

                    {/* Active resumes */}
                    {filteredResumes.map((r, i) => (
                      <motion.div
                        key={r.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * i }}
                        onClick={() => {
                          setActiveResume(r);
                          toast.info(`Loaded: ${r.title}`);
                        }}
                        className="group relative rounded-[2rem] p-8 text-left bg-white border-2 border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50/50 transition-all cursor-pointer min-h-[220px] flex flex-col justify-between"
                      >
                        <button 
                          onClick={(e) => handleDeleteResume(e, r.id)}
                          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete Resume"
                        >
                          <Trash2 size={14} />
                        </button>
                        <div>
                          <div className="mb-4 h-12 w-12 rounded-2xl bg-slate-50 group-hover:bg-indigo-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                            <FileText size={24} />
                          </div>
                          <div className="font-bold truncate text-lg text-slate-900 mb-1">{r.title}</div>
                        </div>

                        <div className="flex items-center justify-between mt-6">
                          <span className="text-xs text-slate-400 font-medium">
                            {r.updatedAt?.seconds ? new Date(r.updatedAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                          </span>
                          {r.atsScore !== undefined && (
                            <Badge className="bg-indigo-500 text-white text-[9px] font-black tracking-wide rounded-full px-2 py-0.5">
                              ATS: {r.atsScore}%
                            </Badge>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )
          ) : activeTab === 'ats' ? (
            /* ATS SCORE VIEW */
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-display font-extrabold text-slate-950">ATS Score Optimizer</h3>
                <p className="text-slate-500">Scan and align your resume with a specific job description to maximize recruiter impact.</p>
              </div>
              
              {!activeResume ? (
                <div className="flex h-[300px] flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-slate-200 bg-white/30 p-8 text-center">
                  <FileText size={40} className="text-slate-300 mb-4" />
                  <h4 className="text-lg font-bold text-slate-900 mb-1">No Active Resume</h4>
                  <p className="text-sm text-slate-500 max-w-xs mb-6">Select or create a resume under "My Resumes" first to optimize.</p>
                  <Button onClick={() => setActiveTab('resumes')} className="bg-indigo-600 rounded-xl cursor-pointer">
                    Go to Resumes
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <JDInput 
                      value={jdText} 
                      onChange={setJdText} 
                      onOptimize={handleOptimize} 
                      isLoading={isOptimizing} 
                    />
                  </div>
                  
                  <div>
                    {isOptimizing ? (
                      <div className="glass-card rounded-[2rem] p-12 flex flex-col items-center justify-center text-center space-y-6 border-indigo-50 min-h-[400px]">
                        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
                        <div>
                          <h4 className="text-xl font-bold text-slate-950 mb-2">Analyzing Match Score</h4>
                          <p className="text-sm text-slate-500 max-w-xs leading-relaxed">Scanning keywords and alignment details...</p>
                        </div>
                      </div>
                    ) : activeResume.atsScore !== undefined ? (
                      <ATSScoreMeter 
                        score={activeResume.atsScore || 0} 
                        suggestions={activeResume.suggestions || []} 
                        matchedKeywords={activeResume.matchedKeywords || []}
                        missingKeywords={activeResume.missingKeywords || []}
                        weakAreas={activeResume.weakAreas || []}
                      />
                    ) : (
                      <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-slate-200 bg-white/30 p-8 text-center">
                        <ShieldCheck size={48} className="text-slate-300 mb-4 animate-pulse" />
                        <h4 className="text-lg font-bold text-slate-900 mb-1">Ready for Scan</h4>
                        <p className="text-sm text-slate-500 max-w-xs">Enter a job description on the left and click Optimize to run the scan.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'cover-letter' ? (
            /* COVER LETTER VIEW */
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-display font-extrabold text-slate-950">AI Cover Letter Generator</h3>
                <p className="text-slate-500">Draft a tailored cover letter referencing your achievements and the target job description.</p>
              </div>
              
              {!activeResume ? (
                <div className="flex h-[300px] flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-slate-200 bg-white/30 p-8 text-center">
                  <FileText size={40} className="text-slate-300 mb-4" />
                  <h4 className="text-lg font-bold text-slate-900 mb-1">No Active Resume</h4>
                  <p className="text-sm text-slate-500 max-w-xs mb-6">Select a resume under "My Resumes" to base your cover letter on.</p>
                  <Button onClick={() => setActiveTab('resumes')} className="bg-indigo-600 rounded-xl cursor-pointer">
                    Go to Resumes
                  </Button>
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm min-h-[500px] flex flex-col">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">Tailored Cover Letter</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Drafted for: {activeResume.title}</p>
                    </div>
                    <Button 
                      onClick={handleGenerateCoverLetter} 
                      disabled={isGeneratingCoverLetter}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-2 font-bold self-end sm:self-auto cursor-pointer"
                    >
                      {isGeneratingCoverLetter ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                      Generate with AI
                    </Button>
                  </div>
                  
                  {coverLetterText ? (
                    <textarea 
                      ref={coverLetterRef}
                      value={coverLetterText}
                      onChange={(e) => setCoverLetterText(e.target.value)}
                      className="w-full flex-grow p-5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 whitespace-pre-wrap focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none font-serif text-base leading-relaxed overflow-hidden min-h-[300px]"
                      spellCheck="false"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center flex-grow py-12 opacity-50">
                      <FileText size={48} className="text-slate-300 mb-4" />
                      <p className="text-slate-500 font-medium font-sans">Click Generate to write your tailored cover letter</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : activeTab === 'history' ? (
            /* HISTORY VIEW */
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-display font-extrabold text-slate-950">Activity History</h3>
                <p className="text-slate-500">Review your past resume optimizations, downloads, and AI generations.</p>
              </div>
              
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full border-collapse text-left text-sm text-slate-500">
                  <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-700 border-b border-slate-100">
                    <tr>
                      <th scope="col" className="px-6 py-4">Activity</th>
                      <th scope="col" className="px-6 py-4">Resource</th>
                      <th scope="col" className="px-6 py-4">Details</th>
                      <th scope="col" className="px-6 py-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 border-t border-slate-100">
                    {resumes.map((r) => {
                      const hasAts = r.atsScore !== undefined;
                      return (
                        <tr key={r.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-semibold text-slate-900 flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${hasAts ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
                            {hasAts ? 'ATS Optimization' : 'Resume Created'}
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-700">{r.title}</td>
                          <td className="px-6 py-4 font-bold text-slate-600">
                            {hasAts ? `Match Score: ${r.atsScore}%` : 'Standard Template'}
                          </td>
                          <td className="px-6 py-4">
                            {r.updatedAt?.seconds ? new Date(r.updatedAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                          </td>
                        </tr>
                      );
                    })}
                    {resumes.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                          No activity history found. Start by creating a resume!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* PRICING VIEW */
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-display font-extrabold text-slate-950">Upgrade Account</h3>
                <p className="text-slate-500">Enable premium templates, AI-guided cover letters, and unlimited resume optimization scans.</p>
              </div>
              <div className="bg-white rounded-3xl p-2 border border-slate-200 shadow-sm max-w-4xl">
                <Pricing 
                  userId={user.uid}
                  email={user.email || ''}
                  currentStatus={subscriptionStatus}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
