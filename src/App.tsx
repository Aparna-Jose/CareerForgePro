import { useEffect, useState } from 'react';
import { auth, db, signInWithGoogle } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Dashboard } from './components/Dashboard';
import { Pricing } from './components/Pricing';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dashboard' | 'pricing'>('dashboard');
  const [subscriptionStatus, setSubscriptionStatus] = useState('free');
  const [nextBillingDate, setNextBillingDate] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Sign in failed:", error);
      toast.error(`Sign in failed: ${error.message || error}`);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // Sync user to Firestore
          const userRef = doc(db, 'users', user.uid);

          // Check if user just returned from a successful Stripe checkout
          const urlParams = new URLSearchParams(window.location.search);
          const sessionId = urlParams.get('session_id');
          if (sessionId) {
            await setDoc(userRef, { subscriptionStatus: 'pro' }, { merge: true });
            window.history.replaceState({}, document.title, window.location.pathname);
          }

          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              subscriptionStatus: 'free',
              createdAt: serverTimestamp(),
            });
            setSubscriptionStatus('free');
            setNextBillingDate(null);
          } else {
            const userData = userSnap.data();
            setSubscriptionStatus(userData.subscriptionStatus || 'free');
            setNextBillingDate(userData.nextBillingDate || null);
          }
          setUser(user);
        } else {
          setUser(null);
          setView('dashboard');
        }
      } catch (error: any) {
        console.error('Error syncing user session with Firestore:', error);
        toast.error(`Database connection error: ${error.message || error}`);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-zinc-50">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-2xl font-bold text-zinc-900"
        >
          CareerForge Pro
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white">
      {!user && (
        <Navbar 
          user={user} 
          onSignIn={handleSignIn} 
          onSignOut={() => auth.signOut()} 
          onViewChange={setView}
          currentView={view}
          subscriptionStatus={subscriptionStatus}
        />
      )}
      <main>
        <AnimatePresence mode="wait">
          {!user ? (
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Hero onGetStarted={handleSignIn} />
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Dashboard 
                user={user} 
                subscriptionStatus={subscriptionStatus} 
                nextBillingDate={nextBillingDate}
                onSignOut={() => auth.signOut()}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Toaster position="top-center" />
    </div>
  );
}
