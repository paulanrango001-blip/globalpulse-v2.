
import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Users, 
  Settings, 
  Crown, 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  X, 
  Phone, 
  Languages, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  Coins, 
  ArrowRight,
  Heart,
  AlertCircle,
  RefreshCw,
  Camera,
  Globe,
  Sparkles,
  CheckCircle2,
  PlayCircle,
  CreditCard,
  User,
  FileText,
  ChevronUp
} from 'lucide-react';
import { AppView, UserProfile, Gender } from './types';
import { 
  connectToGeminiLive, 
  createPcmBlob, 
  decode, 
  decodeAudioData, 
  fetchUserLocation, 
  getSocket, 
  rtcConfiguration,
  setupPaymentListener
} from './services/geminiService';
import { supabase } from './src/services/supabaseClient';

// --- Constants & Mock Data ---
const CALL_COST = 10;
const AD_REWARD = 15;

const COUNTRIES = [
  { name: 'Global', flag: '🌎' },
  { name: 'USA', flag: '🇺🇸' },
  { name: 'Colombia', flag: '🇨🇴' },
  { name: 'Brazil', flag: '🇧🇷' },
  { name: 'Mexico', flag: '🇲🇽' },
  { name: 'Russia', flag: '🇷🇺' },
  { name: 'Ukraine', flag: '🇺🇦' },
  { name: 'Italy', flag: '🇮🇹' },
  { name: 'France', flag: '🇫🇷' },
  { name: 'Japan', flag: '🇯🇵' },
  { name: 'Thailand', flag: '🇹🇭' },
  { name: 'Philippines', flag: '🇵🇭' },
  { name: 'Argentina', flag: '🇦🇷' },
  { name: 'Venezuela', flag: '🇻🇪' },
];

const MOCK_USERS: UserProfile[] = [
  { id: '1', name: 'Elena', age: 24, gender: 'Female', location: 'Madrid, Spain', flag: '🇪🇸', bio: 'Architect & traveler. Let\'s talk about art!', imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=600', isOnline: true, isPremium: false, languages: ['Spanish', 'English'] },
  { id: '2', name: 'Marco', age: 28, gender: 'Male', location: 'Rome, Italy', flag: '🇮🇹', bio: 'Professional chef. I can teach you the real Carbonara.', imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600', isOnline: true, isPremium: true, languages: ['Italian', 'English'] },
  { id: '3', name: 'Yuki', age: 22, gender: 'Female', location: 'Tokyo, Japan', flag: '🇯🇵', bio: 'Anime lover and digital illustrator. 🎨', imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600', isOnline: true, isPremium: false, languages: ['Japanese', 'English'] },
  { id: '4', name: 'Sofia', age: 26, gender: 'Female', location: 'Rio, Brazil', flag: '🇧🇷', bio: 'Samba, sun, and good vibes only! ☀️', imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600', isOnline: true, isPremium: false, languages: ['Portuguese', 'English'] },
  { id: '5', name: 'Liam', age: 30, gender: 'Male', location: 'London, UK', flag: '🇬🇧', bio: 'Tech startup founder. Coffee addict.', imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600', isOnline: true, isPremium: false, languages: ['English'] },
  { id: '6', name: 'Anya', age: 25, gender: 'Female', location: 'Berlin, Germany', flag: '🇩🇪', bio: 'Techno producer. Love the underground scene.', imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600', isOnline: true, isPremium: true, languages: ['German', 'English'] },
  { id: '7', name: 'David', age: 27, gender: 'Male', location: 'New York, USA', flag: '🇺🇸', bio: 'Always on the move. Photography is my passion.', imageUrl: 'https://images.unsplash.com/photo-1492562080023-ab3dbdf9bbbd?auto=format&fit=crop&q=80&w=600', isOnline: true, isPremium: false, languages: ['English'] },
  { id: '8', name: 'Chloe', age: 23, gender: 'Female', location: 'Paris, France', flag: '🇫🇷', bio: 'Fashion student. Looking for inspiration.', imageUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=600', isOnline: true, isPremium: false, languages: ['French', 'English'] },
];

export default function App() {
  const [isLogged, setIsLogged] = useState(false);
  const [view, setView] = useState<AppView>('explore');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [jumpCount, setJumpCount] = useState(() => Number(localStorage.getItem('clickCount')) || 0);
  const [showVipModal, setShowVipModal] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [showWelcomeElite, setShowWelcomeElite] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('onboardingComplete'));
  const [isPremium, setIsPremium] = useState(() => localStorage.getItem('isPremium') === 'true');
  const prevIsPremium = useRef(isPremium);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState(() => {
    const saved = localStorage.getItem('subscriptionInfo');
    return saved ? JSON.parse(saved) : null;
  });
  const [userCoins, setUserCoins] = useState(() => Number(localStorage.getItem('userCoins')) || 40);
  const [genderFilter, setGenderFilter] = useState<Gender | 'All'>('All');
  const [selectedCountry, setSelectedCountry] = useState({ name: 'Global', flag: '🌎' });
  const [paywallMessage, setPaywallMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [currentUserLocation, setCurrentUserLocation] = useState<{country: string, flag: string, city: string} | null>(null);
  const [isCoinsChanging, setIsCoinsChanging] = useState(false);
  const [isSearchingFeedback, setIsSearchingFeedback] = useState(false);
  const [isBlurring, setIsBlurring] = useState(false);
  const simulationVideos = [
    'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-lighting-in-a-dark-room-2106-large.mp4',
    'https://assets.mixkit.co/videos/preview/mixkit-woman-dancing-in-a-nightclub-with-neon-lights-2105-large.mp4'
  ];
  const [simVideoIndex, setSimVideoIndex] = useState(0);
  const simVideoUrl = simulationVideos[simVideoIndex];
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('userProfile');
    return saved ? JSON.parse(saved) : {
      id: 'user_' + Math.random().toString(36).substr(2, 9),
      name: 'Alex Pulse',
      age: 24,
      gender: 'Male',
      imageUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=300'
    };
  });
  const [userStatus, setUserStatus] = useState<'guest' | 'registered'>(() => {
    return (localStorage.getItem('userStatus') as 'guest' | 'registered') || 'guest';
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (isPremium) setIsLogged(true);
  }, [isPremium]);

  useEffect(() => {
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    localStorage.setItem('userStatus', userStatus);
    
    // Sync to Supabase profiles table
    const syncProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            full_name: userProfile.name,
            gender: userProfile.gender,
            avatar_url: userProfile.imageUrl,
            coins: userCoins,
            is_premium: isPremium,
            status: userStatus,
            updated_at: new Date().toISOString()
          });
        if (error) console.error('Error syncing to Supabase profiles:', error);
      }
    };
    syncProfile();
  }, [userProfile, userStatus, userCoins, isPremium]);

  useEffect(() => {
    const loadFromSupabase = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (data && !error) {
          setUserProfile(prev => ({ 
            ...prev, 
            name: data.full_name || prev.name,
            imageUrl: data.avatar_url || prev.imageUrl,
            gender: data.gender || prev.gender
          }));
          setUserCoins(data.coins);
          setIsPremium(data.is_premium);
          setUserStatus(data.status);
        }
      }
    };
    loadFromSupabase();
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { user } = session;
        const fullName = user.user_metadata.full_name || user.user_metadata.name;
        const avatarUrl = user.user_metadata.avatar_url || user.user_metadata.picture;

        setUserProfile(prev => ({
          ...prev,
          name: fullName || prev.name,
          imageUrl: avatarUrl || prev.imageUrl
        }));
        setUserStatus('registered');
        setIsLogged(true);
        setIsAuthModalOpen(false);

        // Fetch coins from profiles table
        const { data: profileData } = await supabase
          .from('profiles')
          .select('coins')
          .eq('id', user.id)
          .single();

        if (profileData) {
          setUserCoins(profileData.coins);
        } else {
          // Create profile if it doesn't exist
          await supabase.from('profiles').upsert({
            id: user.id,
            coins: userCoins,
            full_name: fullName,
            avatar_url: avatarUrl
          });
        }

        if (pendingAction) {
          pendingAction();
          setPendingAction(null);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [pendingAction, userCoins]);

  useEffect(() => {
    fetchUserLocation().then(setCurrentUserLocation);
    
    const cleanup = setupPaymentListener((data) => {
      console.log('Payment success notification received:', data);
      if (data.status === 'VIP ELITE') {
        setIsPremium(true);
        localStorage.setItem('isPremium', 'true');
        showToast("¡Tu pago ha sido confirmado! Ahora eres VIP ELITE.", "success");
        setShowVipModal(false);
        
        // Sync VIP status to Supabase
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) {
            supabase.from('profiles').update({ is_premium: true }).eq('id', user.id);
          }
        });
      } else if (data.coins) {
        const newCoins = userCoins + data.coins;
        updateCoins(newCoins);
        showToast(`¡Tu compra de ${data.coins} monedas ha sido confirmada!`, "success");
      }
    });

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    return cleanup;
  }, []);

  useEffect(() => {
    localStorage.setItem('isPremium', String(isPremium));
    localStorage.setItem('userCoins', String(userCoins));
    localStorage.setItem('clickCount', String(jumpCount));

    if (isPremium && !prevIsPremium.current) {
      triggerWelcomeElite();
    }
    prevIsPremium.current = isPremium;
  }, [isPremium, userCoins, jumpCount]);

  const triggerWelcomeElite = () => {
    setShowWelcomeElite(true);
    // Gold particles effect
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#FFD700', '#FFA500', '#B8860B']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#FFD700', '#FFA500', '#B8860B']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  // Phase 2: Coin Economy
  const spendCoins = async (amount: number) => {
    if (isPremium) return true;
    if (userCoins < amount) {
      showToast("Saldo insuficiente. ¡Recarga para seguir enviando regalos!", 'error');
      setView('premium');
      setIsCalling(false);
      return false;
    }
    
    const newCoins = userCoins - amount;
    await updateCoins(newCoins);
    return true;
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCancelSubscription = () => {
    if (!subscriptionInfo) return;
    
    // Simular señal al servidor
    console.log("Cancelando renovación automática para:", subscriptionInfo.id);
    
    const updatedInfo = {
      ...subscriptionInfo,
      autoRenew: false,
      status: 'Cancelado (Pendiente de vencimiento)'
    };
    
    setSubscriptionInfo(updatedInfo);
    localStorage.setItem('pulse_subscription', JSON.stringify(updatedInfo));
    showToast("Renovación automática cancelada. Seguirás siendo VIP hasta el final del periodo.", "success");
  };

  const handleSecurePayment = (planId: string) => {
    // Paso 2: El Muro de Valor (Interceptar Acción)
    if (userStatus === 'guest') {
      setPendingAction(() => () => handleSecurePayment(planId));
      setIsAuthModalOpen(true);
      return;
    }

    if (!acceptTerms && (planId === 'starter' || planId === 'pro')) {
      showToast("Debes aceptar los términos y la renovación automática.", "error");
      return;
    }
    const clientAccNo = import.meta.env.VITE_CCBILL_CLIENT_ACC_NO || '999999';
    const clientSubAccNo = import.meta.env.VITE_CCBILL_CLIENT_SUB_ACC_NO || '0001';
    const formName = import.meta.env.VITE_CCBILL_FORM_NAME || '101';
    
    let price = "0.00";
    let period = "30";
    if (planId === 'starter') { price = "1.99"; period = "7"; }
    else if (planId === 'pro') { price = "4.99"; period = "30"; }
    else if (planId === 'pack_100') { price = "4.99"; period = "30"; }
    else if (planId === 'pack_500') { price = "9.99"; period = "30"; }
    else if (planId === 'pack_1500') { price = "14.99"; period = "30"; }

    const userId = userProfile.id;
    
    // Construct CCBill URL (FlexForms / JPost simulation)
    const ccbillUrl = `https://bill.ccbill.com/jpost/signup.cgi?clientAccNo=${clientAccNo}&clientSubAccNo=${clientSubAccNo}&formName=${formName}&language=English&allowedTypes=001&subscriptionTypeId=${planId}&initialPrice=${price}&initialPeriod=${period}&userId=${userId}`;
    
    console.log(`Redirigiendo a CCBill: ${ccbillUrl}`);
    showToast("Redirigiendo a pasarela de pago segura de CCBill...", "success");
    
    // Redirigir ventana principal para evitar restricciones de iframe
    window.open(ccbillUrl, '_blank');
  };

  const handleCheckout = (planId: string) => {
    handleSecurePayment(planId);
  };

  const handleStartCall = (user: UserProfile) => {
    if (!isPremium && userCoins < CALL_COST) {
      setView('premium');
      showToast("Insuficiente créditos! Recarga o mira un anuncio.", 'error');
      return;
    }
    setSelectedUser(user);
    setIsCalling(true);
    if (!isPremium) spendCoins(CALL_COST);
  };

  const handleNextUser = () => {
    setIsBlurring(true);
    setIsSearchingFeedback(true);
    
    // Sincronizar video simulado circular
    setSimVideoIndex(prev => (prev + 1) % simulationVideos.length);
    
    setTimeout(() => {
      setIsBlurring(false);
      setIsSearchingFeedback(false);
    }, 400);

    const socket = getSocket();
    // Phase 3: Emit join-queue
    socket.emit("join-queue", {
      userId: "user_" + Math.random().toString(36).substr(2, 9),
      status: isPremium ? "Premium" : "Básico",
      filter: genderFilter,
      country: isPremium ? selectedCountry.name : 'Global' // VIPs have strict country filter
    });

    if (!isPremium) {
      const nextCount = jumpCount + 1;
      setJumpCount(nextCount);
      if (nextCount >= 11) {
        setShowVipModal(true);
        return;
      }
    }

    // Lógica de Match: VIP activa filtro estricto, Gratis es aleatorio
    let onlineUsers = MOCK_USERS.filter(u => u.isOnline && u.id !== selectedUser?.id);
    
    // Si es Premium, aplica filtros estrictos. 
    // Si es Gratis y eligió país, ignora el género (Random).
    if (isPremium) {
      if (selectedCountry.name !== 'Global') {
        onlineUsers = onlineUsers.filter(u => u.location.includes(selectedCountry.name));
      }
      if (genderFilter !== 'All') {
        onlineUsers = onlineUsers.filter(u => u.gender === genderFilter);
      }
    } else {
      // Usuario Gratis
      if (selectedCountry.name !== 'Global') {
        // El emparejamiento por país ignora el género para usuarios gratis
        onlineUsers = onlineUsers.filter(u => u.location.includes(selectedCountry.name));
      }
    }

    const currentIndex = MOCK_USERS.findIndex(u => u.id === selectedUser?.id);
    const nextIndex = (currentIndex + 1) % MOCK_USERS.length;

    const nextUser = onlineUsers.length > 0 
      ? onlineUsers[Math.floor(Math.random() * onlineUsers.length)]
      : MOCK_USERS[nextIndex];
      
    setSelectedUser(nextUser);
  };

  const startRandomMatch = () => {
    if (!isPremium && userCoins < CALL_COST) {
      setView('premium');
      showToast("Necesitas 10 créditos para Global Shuffle.", 'error');
      return;
    }
    setIsMatching(true);
    setTimeout(() => {
      let onlineUsers = MOCK_USERS.filter(u => u.isOnline);
      
      if (isPremium) {
        if (selectedCountry.name !== 'Global') {
          onlineUsers = onlineUsers.filter(u => u.location.includes(selectedCountry.name));
        }
        if (genderFilter !== 'All') {
          onlineUsers = onlineUsers.filter(u => u.gender === genderFilter);
        }
      } else {
        // Usuario Gratis
        if (selectedCountry.name !== 'Global') {
          onlineUsers = onlineUsers.filter(u => u.location.includes(selectedCountry.name));
        }
      }

      const randomUser = onlineUsers.length > 0 
        ? onlineUsers[Math.floor(Math.random() * onlineUsers.length)]
        : MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];

      setIsMatching(false);
      handleStartCall(randomUser);
    }, 3000);
  };

  const updateCoins = async (newCoins: number) => {
    setUserCoins(newCoins);
    setIsCoinsChanging(true);
    setTimeout(() => setIsCoinsChanging(false), 1000);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({ coins: newCoins })
        .eq('id', user.id);
    }
  };

  const handleWatchAd = () => {
    setIsWatchingAd(true);
    let timeLeft = 30;
    const interval = setInterval(() => {
      timeLeft -= 1;
      if (timeLeft <= 0) {
        clearInterval(interval);
        setIsWatchingAd(false);
        const newCoins = userCoins + 15;
        updateCoins(newCoins);
        showToast(`¡Felicidades! Recibiste 15 monedas por ver el anuncio.`, 'success');
      }
    }, 1000);
  };

  const filteredUsers = MOCK_USERS.filter(u => 
    genderFilter === 'All' ? true : u.gender === genderFilter
  );

  // --- Landing Screen ---
  if (!isLogged) {
    return (
      <div className="h-screen w-full bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden p-6">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-rose-600 rounded-full blur-[150px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-500 rounded-full blur-[150px]" />
        </div>
        
        <div className="relative z-10 max-w-lg w-full text-center space-y-12 animate-in fade-in zoom-in-95 duration-700">
          <div className="flex justify-center">
            <div className="w-28 h-28 bg-gradient-to-br from-rose-600 to-rose-800 rounded-[2.5rem] flex items-center justify-center text-white shadow-[0_0_50px_rgba(225,29,72,0.4)] border border-white/10">
              <Zap size={56} fill="currentColor" />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mb-4">
              <Globe size={14} className="text-rose-500" />
              <span>Conectando {currentUserLocation?.country || 'el mundo'}</span>
            </div>
            <h1 className="text-8xl font-black text-white italic tracking-tighter uppercase leading-[0.85]">Global<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-500 to-amber-600">Pulse</span></h1>
            <p className="text-slate-500 text-xl font-bold leading-relaxed max-w-sm mx-auto">
              La red más exclusiva para conocer extraños. <span className="text-white">Sin límites.</span>
            </p>
          </div>

          <div className="space-y-6">
            <button 
              onClick={() => setIsLogged(true)}
              className="w-full py-8 bg-gradient-to-r from-rose-600 to-rose-700 text-white rounded-[2.5rem] font-black text-2xl transition-all shadow-[0_0_40px_rgba(225,29,72,0.4)] hover:scale-[1.02] active:scale-95 flex items-center justify-center space-x-4 border-2 border-white/10 uppercase tracking-tight"
            >
              <span>Entrar al Club</span>
              <ArrowRight size={28} />
            </button>
            
            <div className="flex justify-center items-center space-x-8 text-white/20 text-[10px] font-black uppercase tracking-widest">
              <div className="flex items-center space-x-2">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>Privado</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap size={14} className="text-amber-500" />
                <span>Instantáneo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden md:flex-row">
      {/* Ad Overlay Mock */}
      {isWatchingAd && (
        <div className="fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center p-8 text-center text-white">
          <div className="w-full max-w-sm aspect-video bg-slate-800 rounded-3xl flex items-center justify-center relative overflow-hidden mb-8 border border-white/10">
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-rose-500 animate-pulse opacity-50" />
             <PlayCircle size={64} className="relative z-10 text-white opacity-80" />
          </div>
          <h2 className="text-3xl font-black italic mb-4">MIRA ESTE ANUNCIO</h2>
          <p className="text-slate-400 font-bold mb-8">Obtendrás 15 Pulse Coins gratis al terminar.</p>
          <div className="w-full max-w-xs h-2 bg-slate-800 rounded-full overflow-hidden">
             <div className="h-full bg-rose-500 animate-[progress_5s_linear_infinite]" />
          </div>
          <style>{`
            @keyframes progress {
              from { width: 0%; }
              to { width: 100%; }
            }
          `}</style>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 animate-in slide-in-from-top-4 duration-300 border ${
          toast.type === 'success' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-rose-500 text-white border-rose-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="font-bold">{toast.message}</span>
        </div>
      )}

      {/* Sidebar - Desktop */}
      <nav className="hidden md:flex flex-col w-24 bg-black border-r border-white/5 items-center py-8 space-y-8 shadow-2xl z-50">
        <div 
          onClick={() => setView('explore')}
          className="text-rose-600 mb-6 cursor-pointer hover:scale-110 transition-transform p-3 bg-rose-600/10 rounded-2xl border border-rose-600/20 shadow-[0_0_20px_rgba(225,29,72,0.2)]"
        >
          <Zap size={32} fill="currentColor" />
        </div>
        <NavItem active={view === 'explore'} icon={<Users size={26} />} onClick={() => setView('explore')} label="Explora" />
        <NavItem active={view === 'premium'} icon={<Crown size={26} />} onClick={() => setView('premium')} label="VIP Club" />
        <NavItem active={view === 'profile'} icon={<Settings size={26} />} onClick={() => setView('profile')} label="Ajustes" />
        <NavItem active={false} icon={<FileText size={26} />} onClick={() => setShowLegalModal(true)} label="Legal" />
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden h-full bg-[#050505]">
        {/* Header */}
        <header className="px-8 py-6 flex items-center justify-between bg-black/50 backdrop-blur-xl border-b border-white/5 z-10 sticky top-0">
          <div className="flex items-center space-x-3">
             <div className="md:hidden text-rose-600"><Zap size={24} fill="currentColor" /></div>
             <h1 className="text-3xl font-black bg-gradient-to-r from-rose-500 to-rose-700 bg-clip-text text-transparent italic tracking-tighter uppercase">
              GlobalPulse
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            {/* Mini Avatar */}
            <div 
              onClick={() => setView('profile')}
              className="w-10 h-10 rounded-full border-2 border-white/10 overflow-hidden cursor-pointer hover:border-rose-500 transition-all active:scale-90"
            >
              {userProfile.imageUrl ? (
                <img src={userProfile.imageUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center text-white/40">
                  <User size={20} />
                </div>
              )}
            </div>

            {!isPremium && (
              <div className={`flex items-center space-x-2 px-5 py-2.5 bg-amber-500/10 rounded-2xl text-[10px] font-black text-amber-500 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)] transition-all duration-300 ${isCoinsChanging ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 scale-110' : ''}`}>
                <Coins size={16} className={isCoinsChanging ? 'text-emerald-400' : 'text-amber-500'} />
                <span className="tracking-widest">{userCoins} COINS</span>
              </div>
            )}
            <button 
              onClick={() => setView('premium')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-2xl text-[10px] font-black transition-all uppercase tracking-widest ${
                isPremium 
                ? 'bg-amber-500 text-black shadow-[0_0_25px_rgba(245,158,11,0.4)]' 
                : 'bg-rose-600 text-white shadow-[0_0_25px_rgba(225,29,72,0.3)] hover:scale-105 active:scale-95 border border-white/10'
              }`}
            >
              <Crown size={18} />
              <span className="hidden sm:inline">{isPremium ? 'VIP MEMBER' : 'GET VIP'}</span>
            </button>
          </div>
        </header>

        {/* Dynamic View Content */}
        <div className="flex-1 overflow-y-auto">
          {view === 'explore' && (
            <ExploreView 
              users={filteredUsers} 
              onSelect={setSelectedUser} 
              onFilter={(f: any) => {
                if (f === 'Female') {
                  if (userStatus === 'guest') {
                    setPendingAction(() => () => {
                      setGenderFilter('Female');
                      if (!isPremium) {
                        setPaywallMessage(`🔥 ¡Más de 2,500 mujeres esperando! No las hagas esperar.`);
                        setShowVipModal(true);
                      }
                    });
                    setIsAuthModalOpen(true);
                    return;
                  }
                  if (!isPremium) {
                    setPaywallMessage(`🔥 ¡Más de 2,500 mujeres esperando! No las hagas esperar.`);
                    setShowVipModal(true);
                    return;
                  }
                }
                setGenderFilter(f);
              }} 
              activeFilter={genderFilter}
              onRandom={startRandomMatch}
              onWatchAd={handleWatchAd}
              isPremium={isPremium}
              selectedCountry={selectedCountry}
              setSelectedCountry={(c: any) => {
                setSelectedCountry(c);
              }}
              setShowVipModal={setShowVipModal}
            />
          )}
          {view === 'premium' && (
            <PremiumView 
              onSubscribe={() => { setIsPremium(true); showToast("¡Bienvenido a Elite Pulse!"); }} 
              onBuyCredits={(amount: number) => { setUserCoins(c => c + amount); setIsCoinsChanging(true); setTimeout(() => setIsCoinsChanging(false), 1000); showToast(`¡Añadidos ${amount} Pulse Coins!`); }}
              isPremium={isPremium} 
              handleCheckout={handleCheckout}
            />
          )}
          {view === 'profile' && (
            <ProfileView 
              isPremium={isPremium} 
              credits={userCoins} 
              onLogout={() => {
                setIsPremium(false);
                setIsLogged(false);
                localStorage.removeItem('isPremium');
                localStorage.removeItem('vip_token');
                localStorage.removeItem('subscriptionInfo');
                localStorage.removeItem('onboardingComplete'); // Reset onboarding on logout for testing/demo
                setSubscriptionInfo(null);
              }}
              onBuyCredits={() => setView('premium')}
              setIsPremium={setIsPremium}
              showToast={showToast}
              userProfile={userProfile}
              onEditProfile={() => setShowEditProfile(true)}
              onGoToPayments={() => setView('premium')}
              subscriptionInfo={subscriptionInfo}
              onCancelSubscription={handleCancelSubscription}
              deferredPrompt={deferredPrompt}
              setDeferredPrompt={setDeferredPrompt}
            />
          )}
        </div>

        {showOnboarding && (
          <OnboardingModal 
            onComplete={(data: any) => {
              setUserProfile({ ...userProfile, ...data });
              setShowOnboarding(false);
              setUserStatus('guest');
              localStorage.setItem('onboardingComplete', 'true');
              localStorage.setItem('userStatus', 'guest');
              showToast(`¡Bienvenido ${data.name}! Disfruta de Pulse.`, "success");
            }}
          />
        )}

        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
          onSuccess={() => {
            // Flujo de Éxito: Login de 1-Clic
            setUserStatus('registered');
            setIsAuthModalOpen(false);
            showToast("¡Cuenta vinculada con éxito!", "success");
            
            // Actualizar mini-foto (simulado con una foto de Google)
            setUserProfile(prev => ({
              ...prev,
              imageUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=300'
            }));

            // Ejecutar acción pendiente automáticamente
            if (pendingAction) {
              pendingAction();
              setPendingAction(null);
            }
          }} 
        />

        {showEditProfile && (
          <EditProfileModal 
            profile={userProfile} 
            onClose={() => setShowEditProfile(false)} 
            onSave={(newProfile: any) => {
              setUserProfile(newProfile);
              setShowEditProfile(false);
              showToast("Perfil actualizado correctamente", "success");
            }}
          />
        )}

        {/* Bottom Nav - Mobile */}
        <nav className="md:hidden flex justify-around items-center h-20 bg-black border-t border-white/5 px-6 sticky bottom-0 shadow-2xl">
          <NavItem active={view === 'explore'} icon={<Users size={24} />} onClick={() => setView('explore')} />
          <NavItem active={view === 'premium'} icon={<Crown size={24} />} onClick={() => setView('premium')} />
          <NavItem active={view === 'profile'} icon={<Settings size={24} />} onClick={() => setView('profile')} />
          <NavItem active={false} icon={<FileText size={24} />} onClick={() => setShowLegalModal(true)} />
        </nav>
      </main>

      {/* Video Call Interface */}
      {isCalling && selectedUser && (
        <div className="fixed inset-0 bg-slate-900 z-[100] flex flex-col">
          <VideoCall 
            remoteUser={selectedUser} 
            onClose={() => {
              setIsCalling(false);
              setSelectedUser(null);
            }} 
            onNext={handleNextUser}
            userLocation={currentUserLocation}
            selectedCountry={selectedCountry}
            isPremium={isPremium}
            setShowVipModal={setShowVipModal}
            setPaywallMessage={setPaywallMessage}
            spendCoins={spendCoins}
            isBlurring={isBlurring}
            simVideoUrl={simVideoUrl}
            userStatus={userStatus}
            setPendingAction={setPendingAction}
            setIsAuthModalOpen={setIsAuthModalOpen}
            userProfile={userProfile}
          />
        </div>
      )}

      {/* VIP Modal (Paywall) */}
      {showVipModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[500] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="bg-[#0a0a0a] w-full max-w-md rounded-[3rem] p-10 text-center space-y-8 shadow-[0_0_100px_rgba(245,158,11,0.2)] border border-amber-500/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
            
            <div className="w-24 h-24 bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600 rounded-full flex items-center justify-center mx-auto text-black shadow-[0_0_40px_rgba(245,158,11,0.5)] animate-pulse">
              <Crown size={48} />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-white leading-tight italic tracking-tighter uppercase">🔥 ¡CONEXIÓN VIP DISPONIBLE!</h2>
              <p className="text-slate-400 font-bold text-lg leading-relaxed">
                {paywallMessage ? (
                  <span dangerouslySetInnerHTML={{ __html: paywallMessage.replace('¡Más de 2,500 mujeres esperando!', '<b class="text-amber-500">¡Más de 2,500 mujeres esperando!</b>') }} />
                ) : (
                  <span>Estás a un paso de hablar solo con mujeres en {currentUserLocation?.country || 'tu país'}. Los usuarios Premium tienen un 500% más de matches con chicas.</span>
                )}
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-start space-x-3 text-left bg-white/5 p-4 rounded-2xl border border-white/10">
                <input 
                  type="checkbox" 
                  id="terms" 
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-white/20 bg-black text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="terms" className="text-[10px] font-bold text-slate-400 leading-tight cursor-pointer">
                  Acepto los <button onClick={(e) => { e.stopPropagation(); setShowLegalModal(true); }} className="text-amber-500 underline">Términos de Servicio</button> y la renovación automática.
                </label>
              </div>

              <button 
                onClick={() => handleCheckout('starter')}
                disabled={!acceptTerms}
                className={`w-full py-5 rounded-[2rem] font-black text-lg border transition-all ${
                  acceptTerms 
                  ? 'bg-white/5 text-white border-white/10 hover:bg-white/10' 
                  : 'bg-white/5 text-white/20 border-white/5 cursor-not-allowed'
                }`}
              >
                $1.99 / 7 días
              </button>
              <button 
                onClick={() => handleCheckout('pro')}
                disabled={!acceptTerms}
                className={`w-full py-5 rounded-[2rem] font-black text-lg transition-all shadow-xl ${
                  acceptTerms
                  ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-black hover:scale-[1.02] active:scale-95'
                  : 'bg-amber-500/20 text-black/20 cursor-not-allowed'
                }`}
              >
                $4.99 / Mes
              </button>

              <p className="text-[9px] text-slate-500 font-bold leading-tight px-4">
                Al completar la compra, aceptas que tu suscripción se renovará automáticamente al mismo precio cada periodo. Puedes cancelar en cualquier momento desde tu perfil.
              </p>

              <button 
                onClick={() => {
                  const now = new Date();
                  const expiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                  const info = {
                    id: 'sub_' + Math.random().toString(36).substring(7),
                    plan: 'Plan Pro (Simulado)',
                    expiryDate: expiry.toLocaleDateString(),
                    autoRenew: true,
                    status: 'Activo'
                  };
                  setSubscriptionInfo(info);
                  localStorage.setItem('subscriptionInfo', JSON.stringify(info));
                  setIsPremium(true);
                  setShowVipModal(false);
                  showToast("¡Compra simulada con éxito!", "success");
                }}
                className="w-full py-4 bg-emerald-500/10 text-emerald-500 rounded-[2rem] font-black text-sm uppercase tracking-widest border border-emerald-500/20 hover:bg-emerald-500/20"
              >
                Simular Compra
              </button>
              <button 
                onClick={() => { setShowVipModal(false); setJumpCount(0); }}
                className="w-full py-2 text-slate-600 font-black text-xs uppercase tracking-widest hover:text-slate-400 transition-colors"
              >
                Continuar modo básico
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ad Watching Overlay */}
      {isWatchingAd && (
        <div className="fixed inset-0 bg-black z-[1000] flex flex-col items-center justify-center p-10 space-y-8">
          <div className="w-24 h-24 border-8 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Viendo Anuncio...</h2>
            <p className="text-amber-500 font-bold text-xl animate-pulse">Obteniendo 15 Coins Gratis</p>
          </div>
          <div className="w-full max-w-xs h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 animate-[progress_30s_linear_forwards]" />
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && !isCalling && (
        <UserModal user={selectedUser} onClose={() => setSelectedUser(null)} onCall={handleStartCall} isPremium={isPremium} />
      )}

      {/* Legal Modal */}
      {showLegalModal && (
        <LegalModal onClose={() => setShowLegalModal(false)} />
      )}

      {/* Welcome Elite Modal */}
      {showWelcomeElite && (
        <div className="fixed inset-0 bg-black/98 backdrop-blur-3xl z-[1000] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-500">
          <div className="bg-[#050505] w-full max-w-lg rounded-[3.5rem] p-12 text-center space-y-10 shadow-[0_0_120px_rgba(245,158,11,0.3)] border-2 border-amber-500/30 relative overflow-hidden">
            {/* Animated Gold Border Glow */}
            <div className="absolute inset-0 border-4 border-amber-500/10 rounded-[3.5rem] animate-pulse" />
            
            <div className="relative space-y-8">
              <div className="w-32 h-32 bg-gradient-to-br from-amber-200 via-amber-500 to-amber-700 rounded-full flex items-center justify-center mx-auto text-black shadow-[0_0_60px_rgba(245,158,11,0.6)]">
                <Crown size={64} />
              </div>
              
              <div className="space-y-6">
                <h2 className="text-5xl font-black text-white leading-tight italic tracking-tighter uppercase bg-gradient-to-b from-amber-200 to-amber-600 bg-clip-text text-transparent">
                  👑 ¡ERES UN MIEMBRO ELITE!
                </h2>
                <p className="text-slate-300 font-bold text-xl leading-relaxed">
                  Tu pase VIP ha sido activado con éxito. Ahora tienes acceso total a las más de <span className="text-amber-500">2,500 mujeres</span> en línea. ¡Disfruta de la experiencia sin límites!
                </p>
              </div>
              
              <button 
                onClick={() => {
                  setShowWelcomeElite(false);
                  handleNextUser();
                }}
                className="w-full py-7 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black rounded-[2.5rem] font-black text-2xl hover:scale-[1.03] active:scale-95 transition-all shadow-[0_0_40px_rgba(245,158,11,0.4)] uppercase tracking-tighter italic"
              >
                EMPEZAR A CONECTAR 🔥
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LegalModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[600] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-[#0a0a0a] w-full max-w-2xl rounded-[3rem] p-10 border border-white/10 shadow-2xl space-y-8 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between">
          <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Legal - Términos de Servicio</h3>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white transition-colors">
            <X size={32} />
          </button>
        </div>
        
        <div className="space-y-8 text-slate-300">
          <section className="space-y-3">
            <h4 className="text-amber-500 font-black uppercase tracking-widest text-sm">GlobalPulse - Términos de Servicio</h4>
            <p className="text-lg font-bold">Edad Mínima: Debes tener al menos 18 años para entrar al club y utilizar los servicios de videochat.</p>
          </section>

          <section className="space-y-3">
            <h4 className="text-amber-500 font-black uppercase tracking-widest text-sm">Suscripciones</h4>
            <p className="leading-relaxed">Los planes Starter de $1.99 (7 días) y Pro de $4.99 (Mensual) son cargos recurrentes procesados de forma segura por CCBill.</p>
          </section>

          <section className="space-y-3">
            <h4 className="text-amber-500 font-black uppercase tracking-widest text-sm">Contenido y Conducta</h4>
            <p className="leading-relaxed">El usuario es el único responsable de su comportamiento durante las transmisiones. El acoso, la grabación sin consentimiento o actividades ilegales resultarán en la expulsión inmediata sin reembolso.</p>
          </section>

          <section className="space-y-3">
            <h4 className="text-amber-500 font-black uppercase tracking-widest text-sm">Política de Reembolsos</h4>
            <p className="leading-relaxed">Debido a que el acceso VIP se otorga de manera instantánea, todas las ventas son finales y no se ofrecen reembolsos una vez que el servicio ha sido activado.</p>
          </section>
        </div>

        <button 
          onClick={onClose}
          className="w-full py-5 bg-white/5 text-white rounded-2xl font-black uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-all"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}

// --- Specific Components ---

function NavItem({ active, icon, onClick, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`group relative flex flex-col items-center p-3 transition-all duration-300 ${
        active ? 'text-white' : 'text-white/20 hover:text-white/40'
      }`}
    >
      <div className={`p-4 rounded-3xl transition-all ${
        active ? 'bg-white/5 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] border border-white/10' : 'group-hover:bg-white/5'
      }`}>
        {icon}
      </div>
      {label && <span className={`text-[9px] font-black mt-2 uppercase tracking-[0.2em] transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`}>{label}</span>}
    </button>
  );
}

function UserModal({ user, onClose, onCall, isPremium }: any) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300">
        <div className="relative h-[28rem]">
          <img src={user.imageUrl} className="w-full h-full object-cover" alt={user.name} />
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-3 bg-black/20 text-white rounded-full hover:bg-black/40 backdrop-blur-md transition-all"
          >
            <X size={20} />
          </button>
          <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 to-transparent text-white">
            <div className="flex items-center space-x-2 mb-2">
              <h2 className="text-4xl font-black">{user.name}, {user.age}</h2>
              {user.isPremium && <Crown size={24} className="text-amber-400" />}
            </div>
            <p className="flex items-center space-x-2 text-slate-200 font-bold opacity-80 uppercase tracking-widest text-xs">
              <Globe size={14} className="text-rose-400" /> {user.location}
            </p>
          </div>
        </div>
        <div className="p-8 space-y-6">
          <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Bio</h4>
              <p className="text-slate-700 leading-relaxed font-semibold italic text-lg">"{user.bio}"</p>
          </div>
          <div className="flex space-x-4">
            <button 
              onClick={() => onCall(user)}
              className="flex-1 flex items-center justify-center space-x-3 py-5 bg-rose-500 text-white rounded-[2rem] font-black text-lg hover:bg-rose-600 active:scale-95 transition-all shadow-xl shadow-rose-200"
            >
              <Video size={24} fill="white" />
              <span>Llamar Ahora</span>
            </button>
            <button className="p-5 bg-slate-50 text-rose-500 rounded-[2rem] hover:bg-rose-100 transition-all border border-slate-100">
              <Heart size={24} fill="currentColor" />
            </button>
          </div>
          {!isPremium && <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Costo de llamada: 10 Pulse Coins</p>}
        </div>
      </div>
    </div>
  );
}

function ExploreView({ users, onSelect, onFilter, activeFilter, onRandom, onWatchAd, isPremium, selectedCountry, setSelectedCountry, setShowVipModal }: any) {
  const [showCountryModal, setShowCountryModal] = useState(false);

  return (
    <div className="p-6 md:p-12 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-7xl mx-auto">
      {showCountryModal && (
        <CountrySelectorModal 
          onClose={() => setShowCountryModal(false)} 
          onSelect={(c: any) => {
            setSelectedCountry(c);
            setShowCountryModal(false);
          }}
          isPremium={isPremium}
        />
      )}
      {/* Hero Shuffle */}
      <section 
        className="relative h-[22rem] md:h-[28rem] bg-black rounded-[3.5rem] overflow-hidden group cursor-pointer shadow-[0_0_50px_rgba(225,29,72,0.2)] border border-white/5"
        onClick={onRandom}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-rose-700 via-rose-600 to-black opacity-90" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-10 space-y-8">
          <div className="bg-white/10 backdrop-blur-3xl p-8 rounded-full border border-white/20 group-hover:scale-110 transition-transform duration-700 shadow-2xl relative">
            <div className="absolute inset-0 bg-rose-500 blur-2xl opacity-20 animate-pulse" />
            <Sparkles size={64} className="text-white relative z-10" fill="white" />
          </div>
          <div className="space-y-3">
            <h2 className="text-6xl md:text-8xl font-black text-white italic tracking-tighter uppercase leading-none">GLOBAL SHUFFLE</h2>
            <p className="text-rose-200 font-black uppercase tracking-[0.4em] text-[10px] opacity-60">Encuentra tu match perfecto ahora</p>
          </div>
        </div>
        
        <div className="absolute bottom-10 right-10 flex items-center space-x-4 text-white/40 font-black text-[10px] uppercase tracking-[0.4em]">
          <span>INICIAR ESCANEO</span>
          <div className="w-12 h-0.5 bg-rose-500 rounded-full shadow-[0_0_10px_rgba(225,29,72,1)]" />
        </div>
      </section>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-white/5 p-6 rounded-[2.5rem] border border-white/5">
        <div className="flex items-center space-x-2 bg-black/20 p-2 rounded-2xl">
          <button
            onClick={() => setShowCountryModal(true)}
            className={`px-8 py-3 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest flex items-center space-x-2 cursor-pointer ${
              selectedCountry.name !== 'Global' 
              ? 'bg-rose-600 text-white shadow-lg' 
              : 'text-white/20 hover:text-white/40'
            }`}
          >
            <span>{selectedCountry.flag}</span>
            <span>{selectedCountry.name === 'Global' ? 'GLOBAL' : selectedCountry.name.toUpperCase()}</span>
            <Globe size={12} className="ml-1" />
          </button>

          <button
            onClick={() => {
              onFilter('Female');
            }}
            className={`px-8 py-3 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest flex items-center space-x-2 cursor-pointer ${
              activeFilter === 'Female' 
              ? 'bg-rose-600 text-white shadow-lg' 
              : 'text-white/20 hover:text-white/40'
            }`}
          >
            <Zap size={12} className="text-amber-500" />
            <span>SOLO MUJERES</span>
          </button>
        </div>
      </div>

      {/* Ad Promotion */}
      {!isPremium && (
        <div 
          onClick={onWatchAd}
          className="bg-gradient-to-r from-amber-500 to-amber-600 p-8 rounded-[2.5rem] flex items-center justify-between text-black cursor-pointer hover:scale-[1.01] active:scale-95 transition-all shadow-[0_0_30px_rgba(245,158,11,0.2)] border border-white/10"
        >
          <div className="flex items-center space-x-6">
             <div className="bg-black/10 p-4 rounded-2xl"><PlayCircle size={36} /></div>
             <div>
               <p className="text-xl font-black italic uppercase tracking-tight">¿Sin créditos?</p>
               <p className="text-sm font-bold opacity-70">Mira un video corto y recibe +15 COINS gratis.</p>
             </div>
          </div>
          <div className="px-8 py-4 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Ver Ahora</div>
        </div>
      )}

      {/* User Listing */}
      <div className="space-y-10">
        <div className="flex flex-col space-y-6 md:flex-row md:items-end md:justify-between md:space-y-0 px-4">
          <div>
            <h2 className="text-5xl font-black text-white tracking-tighter italic uppercase">En Línea</h2>
            <p className="text-rose-500 font-black mt-1 text-[10px] uppercase tracking-[0.3em]">Usuarios verificados ahora</p>
          </div>
          
          <div className="flex space-x-2 bg-white/5 p-2 rounded-2xl border border-white/5">
            {['All', 'Male', 'Female'].map((f) => (
              <button
                key={f}
                onClick={() => onFilter(f)}
                className={`px-8 py-3 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${
                  activeFilter === f 
                  ? 'bg-white/10 text-white shadow-lg border border-white/10' 
                  : 'text-white/20 hover:text-white/40'
                }`}
              >
                {f === 'All' ? 'Todos' : f === 'Male' ? 'Hombres' : 'Mujeres'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-20">
          {users.map((user: UserProfile) => (
            <div 
              key={user.id} 
              onClick={() => onSelect(user)}
              className="group relative bg-black rounded-[3rem] overflow-hidden shadow-2xl transition-all duration-500 cursor-pointer transform hover:-translate-y-2 border border-white/5"
            >
              <div className="aspect-[4/5] overflow-hidden relative">
                <img src={user.imageUrl} className="w-full h-full object-cover transition duration-700 group-hover:scale-110 grayscale-[0.2] group-hover:grayscale-0" alt={user.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="absolute top-6 left-6">
                <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-2xl backdrop-blur-md border ${user.isOnline ? 'bg-rose-600 text-white border-white/20' : 'bg-white/5 text-white/40 border-white/5'}`}>
                  {user.isOnline && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                  <span>{user.isOnline ? 'LIVE' : 'OFFLINE'}</span>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <div className="flex items-center space-x-2 mb-1">
                  <p className="text-2xl font-black italic uppercase tracking-tighter">{user.name}, {user.age}</p>
                  {user.isPremium && <Crown size={18} className="text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />}
                </div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{user.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CountrySelectorModal({ onClose, onSelect, isPremium }: any) {
  const countries = [
    { name: 'Global', flag: '🌎' },
    { name: 'USA', flag: '🇺🇸' },
    { name: 'Colombia', flag: '🇨🇴' },
    { name: 'Brazil', flag: '🇧🇷' },
    { name: 'Mexico', flag: '🇲🇽' },
    { name: 'Russia', flag: '🇷🇺' },
    { name: 'Ukraine', flag: '🇺🇦' },
    { name: 'Italy', flag: '🇮🇹' },
    { name: 'France', flag: '🇫🇷' },
    { name: 'Japan', flag: '🇯🇵' },
    { name: 'Thailand', flag: '🇹🇭' },
    { name: 'Philippines', flag: '🇵🇭' },
    { name: 'Argentina', flag: '🇦🇷' },
    { name: 'Venezuela', flag: '🇻🇪' },
  ];

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[600] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-[#0a0a0a] w-full max-w-md rounded-[3rem] p-8 border border-white/10 shadow-2xl space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Seleccionar País</h3>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white"><X size={24} /></button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {countries.map(c => (
            <button 
              key={c.name}
              onClick={() => onSelect(c)}
              className="flex flex-col items-center justify-center p-6 bg-white/5 hover:bg-white/10 rounded-3xl group transition-all border border-white/5 space-y-3"
            >
              <span className="text-5xl group-hover:scale-125 transition-transform duration-300">{c.flag}</span>
              <span className="text-[10px] font-black text-white/60 uppercase tracking-widest group-hover:text-white">{c.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PremiumView({ onSubscribe, onBuyCredits, isPremium, handleCheckout }: any) {
  const packs = [
    { id: 'pack_100', coins: 100, price: '$4.99', desc: 'Starter Pulse' },
    { id: 'pack_500', coins: 500, price: '$9.99', desc: 'Popular Shuffle', popular: true },
    { id: 'pack_1500', coins: 1500, price: '$14.99', desc: 'Global VIP' },
  ];

  const plans = [
    { id: 'starter', name: 'Plan Starter', price: '$1.99', duration: '7 días', color: 'from-rose-500 to-rose-600' },
    { id: 'pro', name: 'Plan Pro', price: '$4.99', duration: '30 días', color: 'from-amber-400 to-amber-600', popular: true },
  ];

  return (
    <div className="max-w-5xl mx-auto p-8 md:p-16 space-y-20 animate-in fade-in slide-in-from-bottom-10">
      <div className="text-center space-y-6">
        <div className="inline-block p-6 bg-amber-500/10 rounded-[2rem] border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
          <Crown size={64} className="text-amber-500 animate-pulse" />
        </div>
        <h2 className="text-7xl font-black text-white tracking-tighter italic uppercase leading-none">VIP CLUB</h2>
        <p className="text-slate-500 text-xl font-bold max-w-xl mx-auto">Acceso exclusivo. Filtros avanzados. Conexiones ilimitadas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Subscription Plans */}
        <div className="space-y-6">
          <h3 className="text-3xl font-black text-white px-4 italic uppercase tracking-tighter">Planes VIP</h3>
          {plans.map(plan => (
            <div 
              key={plan.id}
              className={`bg-black rounded-[2.5rem] p-8 text-white flex flex-col shadow-2xl relative overflow-hidden border ${plan.popular ? 'border-amber-500/50' : 'border-white/5'}`}
            >
              {plan.popular && <div className="absolute top-0 right-0 bg-amber-500 text-black px-4 py-1 text-[8px] font-black uppercase tracking-widest rounded-bl-xl">Más Popular</div>}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="text-2xl font-black italic uppercase tracking-tighter">{plan.name}</h4>
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">{plan.duration}</p>
                </div>
                <div className="text-right">
                  <p className={`text-3xl font-black bg-gradient-to-r ${plan.color} bg-clip-text text-transparent`}>{plan.price}</p>
                </div>
              </div>
              <button 
                onClick={() => handleCheckout(plan.id)}
                disabled={isPremium}
                className={`w-full py-5 rounded-2xl font-black text-sm transition-all shadow-xl uppercase tracking-widest ${
                  isPremium 
                  ? 'bg-white/5 text-white/20' 
                  : `bg-gradient-to-r ${plan.color} text-white hover:scale-[1.02] active:scale-95`
                }`}
              >
                {isPremium ? 'ACTIVO' : 'SUSCRIBIRSE'}
              </button>
            </div>
          ))}
          
          <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
             <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Beneficios VIP:</p>
             <ul className="grid grid-cols-2 gap-3">
                {['Video Ilimitado', 'Filtro Mujeres', 'Traducción IA', 'Sin Ads'].map(f => (
                  <li key={f} className="flex items-center space-x-2 text-[9px] font-bold text-slate-400 uppercase">
                    <CheckCircle2 size={12} className="text-amber-500" />
                    <span>{f}</span>
                  </li>
                ))}
             </ul>
          </div>
        </div>

        {/* Credit Packs */}
        <div className="space-y-8 flex flex-col justify-center">
           <h3 className="text-3xl font-black text-white flex items-center space-x-3 px-4 italic uppercase tracking-tighter">
             <Coins className="text-amber-500" /> <span>Comprar Monedas</span>
           </h3>
           <div className="space-y-4">
             {packs.map(p => (
                <div 
                   key={p.coins} 
                   onClick={() => handleCheckout(p.id)}
                   className={`group p-8 bg-white/5 rounded-[2.5rem] border transition-all flex items-center justify-between ${
                    p.popular ? 'border-amber-500/50 bg-amber-500/5 shadow-[0_0_30px_rgba(245,158,11,0.1)]' : 'border-white/5 hover:border-white/10'
                  }`}
               >
                 <div className="flex items-center space-x-6">
                    <div className="w-16 h-16 bg-black rounded-3xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform border border-white/5">
                       <Coins size={36} />
                    </div>
                    <div>
                      <p className="text-3xl font-black text-white italic">{p.coins} <span className="text-[10px] uppercase text-white/20 not-italic tracking-widest ml-1">Coins</span></p>
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{p.desc}</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="text-2xl font-black text-amber-500">{p.price}</p>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mt-1 group-hover:text-amber-500 transition-colors">Comprar →</p>
                 </div>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
}

function ProfileView({ isPremium, credits, onLogout, onBuyCredits, setIsPremium, showToast, userProfile, onEditProfile, onGoToPayments, subscriptionInfo, onCancelSubscription, deferredPrompt, setDeferredPrompt }: any) {
  const [showSubscriptionDetails, setShowSubscriptionDetails] = useState(false);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      showToast("La app ya está instalada o tu navegador no lo soporta.", "error");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 py-16 animate-in fade-in slide-in-from-bottom-6">
      <div className="bg-black p-12 rounded-[4rem] shadow-2xl border border-white/5 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600" />
        <div className="relative inline-block mb-10">
          <div className="w-48 h-48 rounded-full overflow-hidden border-8 border-[#0a0a0a] shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <img src={userProfile.imageUrl} alt="Me" className="grayscale-[0.2] w-full h-full object-cover" />
          </div>
          {isPremium && (
            <div className="absolute bottom-2 right-2 bg-amber-500 p-4 rounded-full border-4 border-[#0a0a0a] shadow-xl">
              <Crown size={28} className="text-black" />
            </div>
          )}
        </div>
        <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter">{userProfile.name}</h2>
        <p className="text-white/20 font-black uppercase tracking-[0.3em] text-[10px] mt-3">ID: VIP-PULSE-2026-X82 • {userProfile.age} AÑOS</p>

        <div className="grid grid-cols-2 gap-6 mt-12">
            <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 shadow-inner">
               <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-2">Status</p>
               <p className={`text-2xl font-black italic uppercase ${isPremium ? 'text-amber-500' : 'text-white/40'}`}>{isPremium ? 'VIP Elite' : 'Básico'}</p>
            </div>
            <div onClick={onBuyCredits} className="p-8 bg-amber-500/5 rounded-[2.5rem] border border-amber-500/10 shadow-inner cursor-pointer hover:bg-amber-500/10 transition-colors">
               <p className="text-[9px] font-black text-amber-500/40 uppercase tracking-widest mb-2">Coins</p>
               <p className="text-2xl font-black text-amber-500">{credits}</p>
            </div>
        </div>

        <div className="mt-12 space-y-4">
           <div className="grid grid-cols-2 gap-4">
             <button 
               onClick={onEditProfile}
               className="flex flex-col items-center justify-center p-8 bg-white/5 rounded-3xl space-y-3 border border-white/5 hover:bg-white/10 transition-all group cursor-pointer"
             >
                <User className="text-white/20 group-hover:text-white transition-colors" />
                <span className="font-black text-[9px] uppercase text-white/40 tracking-widest">Editar Perfil</span>
             </button>
             <button 
               onClick={() => setShowSubscriptionDetails(!showSubscriptionDetails)}
               className={`flex flex-col items-center justify-center p-8 rounded-3xl space-y-3 border transition-all group cursor-pointer ${showSubscriptionDetails ? 'bg-amber-500/10 border-amber-500/20' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
             >
                <CreditCard className={`${showSubscriptionDetails ? 'text-amber-500' : 'text-white/20 group-hover:text-white'} transition-colors`} />
                <span className={`font-black text-[9px] uppercase tracking-widest ${showSubscriptionDetails ? 'text-amber-500' : 'text-white/40'}`}>Pagos</span>
             </button>
           </div>

           {showSubscriptionDetails && (
             <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 text-left space-y-6 animate-in fade-in zoom-in-95 duration-300">
               <div className="flex items-center justify-between">
                 <h4 className="text-xs font-black text-white uppercase tracking-widest">Detalles de Suscripción</h4>
                 <div className="px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20 text-[8px] font-black text-amber-500 uppercase tracking-widest">
                   {subscriptionInfo?.status || (isPremium ? 'Activo' : 'Inactivo')}
                 </div>
               </div>
               
               <div className="space-y-4">
                 <div className="flex justify-between items-center">
                   <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Plan Actual</span>
                   <span className="text-sm font-black text-white">{subscriptionInfo?.plan || (isPremium ? 'VIP Elite' : 'Ninguno')}</span>
                 </div>
                 {isPremium && (
                   <div className="flex justify-between items-center">
                     <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Próximo Cobro</span>
                     <span className="text-sm font-black text-amber-500">{subscriptionInfo?.expiryDate || 'N/A'}</span>
                   </div>
                 )}
               </div>

               {isPremium && subscriptionInfo?.autoRenew !== false && (
                 <button 
                   onClick={onCancelSubscription}
                   className="w-full py-4 bg-rose-600/10 text-rose-500 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-rose-500/20 hover:bg-rose-600/20 transition-all"
                 >
                   CANCELAR RENOVACIÓN AUTOMÁTICA
                 </button>
               )}
               
               {!isPremium && (
                 <button 
                   onClick={onGoToPayments}
                   className="w-full py-4 bg-amber-500 text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-all"
                 >
                   Activar VIP Ahora
                 </button>
               )}
             </div>
           )}

           <button 
             onClick={handleInstall}
             className="w-full py-7 bg-amber-500/10 text-amber-500 rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-amber-500/20 flex items-center justify-center space-x-3 transition-all border border-amber-500/20 cursor-pointer"
           >
             <span>Instalar GlobalPulse en mi celular</span>
             <ArrowRight size={16} />
           </button>
           <button onClick={onLogout} className="w-full py-7 bg-rose-600/10 text-rose-500 rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-rose-600/20 flex items-center justify-center space-x-3 transition-all border border-rose-500/20 cursor-pointer">
             <span>Cerrar Sesión</span>
             <X size={16} />
           </button>
           
           {/* Botón Oculto de Reset VIP para Pruebas */}
           <div className="pt-12 opacity-0 hover:opacity-100 transition-opacity space-y-4">
             <button 
               onClick={() => {
                 setIsPremium(!isPremium);
                 localStorage.setItem('isPremium', String(!isPremium));
                 showToast(`Modo ${!isPremium ? 'VIP' : 'Básico'} activado para pruebas`, 'success');
               }}
               className="w-full py-3 bg-amber-500/10 text-amber-500 rounded-2xl font-black text-[10px] uppercase tracking-widest cursor-pointer border border-amber-500/20"
             >
               [ PRUEBA DE FLUJO: TOGGLE VIP ]
             </button>
             <button 
               onClick={() => {
                 setIsPremium(false);
                 localStorage.setItem('isPremium', 'false');
                 localStorage.removeItem('vip_token');
                 window.location.reload();
               }}
               className="text-[8px] text-slate-800 font-black uppercase tracking-widest cursor-pointer hover:text-rose-900"
             >
               [ RESET VIP DEBUG MODE ]
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}

function OnboardingModal({ onComplete }: { onComplete: (data: any) => void }) {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('Male');
  const [isAdult, setIsAdult] = useState(false);

  const handleFinish = () => {
    if (!name.trim()) return alert("Por favor, ingresa tu apodo.");
    if (!isAdult) return alert("Debes confirmar que eres mayor de 18 años.");
    onComplete({ name, gender });
  };

  return (
    <div className="fixed inset-0 bg-black z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-700">
      <div className="bg-[#0a0a0a] w-full max-w-md rounded-[3rem] p-10 border border-white/10 shadow-2xl space-y-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-600 to-rose-800" />
        
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-rose-600 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(225,29,72,0.4)]">
            <Zap size={40} className="text-white" fill="currentColor" />
          </div>
          <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Bienvenido a Pulse</h2>
          <p className="text-slate-400 font-bold">Configura tu perfil para empezar a conectar.</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-4">Tu Apodo</label>
            <input 
              type="text" 
              placeholder="Ej. Alex"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold focus:outline-none focus:border-rose-500 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-4">Tu Género</label>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setGender('Male')}
                className={`py-4 rounded-2xl font-black uppercase tracking-widest transition-all border ${gender === 'Male' ? 'bg-rose-600 border-rose-500 text-white' : 'bg-white/5 border-white/10 text-white/40'}`}
              >
                Hombre
              </button>
              <button 
                onClick={() => setGender('Female')}
                className={`py-4 rounded-2xl font-black uppercase tracking-widest transition-all border ${gender === 'Female' ? 'bg-rose-600 border-rose-500 text-white' : 'bg-white/5 border-white/10 text-white/40'}`}
              >
                Mujer
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-3 bg-white/5 p-4 rounded-2xl border border-white/10">
            <input 
              type="checkbox" 
              id="adult"
              checked={isAdult}
              onChange={(e) => setIsAdult(e.target.checked)}
              className="w-5 h-5 accent-rose-600 rounded"
            />
            <label htmlFor="adult" className="text-xs font-bold text-white/60 cursor-pointer">Confirmo que soy mayor de 18 años</label>
          </div>
        </div>

        <button 
          onClick={handleFinish}
          className="w-full py-6 bg-gradient-to-r from-rose-600 to-rose-700 text-white rounded-3xl font-black text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest"
        >
          Empezar Ahora
        </button>
      </div>
    </div>
  );
}

function AuthModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    // Paso 3: Login de 1-Clic (Google Auth)
    const { error } = await supabase.auth.signInWithOAuth({ 
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) console.error('Error signing in with Google:', error.message);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[1100] flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-[#0a0a0a] w-full max-w-md rounded-[3rem] p-10 border border-white/10 shadow-2xl space-y-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-rose-600" />
        
        <button onClick={onClose} className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors">
          <X size={24} />
        </button>

        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto border border-amber-500/20">
            <Crown size={40} className="text-amber-500" fill="currentColor" />
          </div>
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Crea tu cuenta VIP gratis</h2>
          <p className="text-slate-400 font-bold">Asegura tus compras y guarda tu perfil para siempre.</p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={handleGoogleLogin}
            className="w-full py-5 bg-white text-black rounded-3xl font-black text-sm flex items-center justify-center space-x-4 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest shadow-xl"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            <span>Continuar con Google</span>
          </button>
          
          <p className="text-[8px] text-center text-white/20 font-bold uppercase tracking-widest">
            Al continuar, aceptas nuestros términos de servicio y política de privacidad.
          </p>
        </div>
      </div>
    </div>
  );
}

function EditProfileModal({ profile, onSave, onClose }: any) {
  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(profile.age);
  const [gender, setGender] = useState(profile.gender || 'Male');
  const [imageUrl, setImageUrl] = useState(profile.imageUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[600] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-[#0a0a0a] w-full max-w-md rounded-[3rem] p-8 border border-white/10 shadow-2xl space-y-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Editar Perfil</h3>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white"><X size={24} /></button>
        </div>
        
        <div className="flex flex-col items-center space-y-4">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-amber-500 shadow-xl relative group">
            <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Camera size={24} className="text-white" />
            </div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2 bg-white/5 text-white rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-all"
          >
            Subir Foto de Galería
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-4">Nombre</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold focus:outline-none focus:border-rose-500 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-4">Edad</label>
            <input 
              type="number" 
              value={age} 
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold focus:outline-none focus:border-rose-500 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-4">Género</label>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setGender('Male')}
                className={`py-4 rounded-2xl font-black uppercase tracking-widest transition-all border ${gender === 'Male' ? 'bg-rose-600 border-rose-500 text-white' : 'bg-white/5 border-white/10 text-white/40'}`}
              >
                Hombre
              </button>
              <button 
                onClick={() => setGender('Female')}
                className={`py-4 rounded-2xl font-black uppercase tracking-widest transition-all border ${gender === 'Female' ? 'bg-rose-600 border-rose-500 text-white' : 'bg-white/5 border-white/10 text-white/40'}`}
              >
                Mujer
              </button>
            </div>
          </div>
        </div>

        <button 
          onClick={() => onSave({ ...profile, name, age, gender, imageUrl })}
          className="w-full py-6 bg-gradient-to-r from-rose-600 to-rose-700 text-white rounded-3xl font-black text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest"
        >
          Guardar Cambios
        </button>
      </div>
    </div>
  );
}

// --- Video Call Logic (Permissions & Gemini) ---

function VideoCall({ remoteUser, onClose, onNext, userLocation, selectedCountry, isPremium, setShowVipModal, setPaywallMessage, spendCoins, isBlurring, simVideoUrl, userStatus, setPendingAction, setIsAuthModalOpen, userProfile }: { remoteUser: UserProfile, onClose: () => void, onNext: () => void, userLocation: any, selectedCountry: any, isPremium: boolean, setShowVipModal: (v: boolean) => void, setPaywallMessage: (m: string) => void, spendCoins: (a: number) => boolean | Promise<boolean>, isBlurring: boolean, simVideoUrl: string, userStatus: string, setPendingAction: any, setIsAuthModalOpen: any, userProfile: any }) {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isAiTranslatorOn, setIsAiTranslatorOn] = useState(true);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'global' | 'women'>(isPremium ? 'women' : 'global');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [transcriptions, setTranscriptions] = useState<{text: string, type: 'input' | 'output'}[]>([]);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [showFlashDiscount, setShowFlashDiscount] = useState(false);
  const [isSocketError, setIsSocketError] = useState(false);
  const [isSearchingFeedback, setIsSearchingFeedback] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [isSlidingUp, setIsSlidingUp] = useState(false);
  const [isLongSearch, setIsLongSearch] = useState(false);
  const touchStartRef = useRef<number | null>(null);

  // WebRTC States
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const searchStartTimeRef = useRef<number>(0);
  
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const socket = getSocket();

  useEffect(() => {
    socket.on("connect_error", () => setIsSocketError(true));
    socket.on("connect", () => setIsSocketError(false));
    return () => {
      socket.off("connect_error");
      socket.off("connect");
    };
  }, [socket]);

  const [giftAnimations, setGiftAnimations] = useState<{id: number, emoji: string}[]>([]);

  const createOffer = async (pc: RTCPeerConnection, roomId: string) => {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("signal-data", {
      roomId: roomId,
      signal: offer
    });
  };

  const handleAnswer = async (pc: RTCPeerConnection, answer: RTCSessionDescriptionInit) => {
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
  };

  const addIceCandidate = async (pc: RTCPeerConnection, candidate: RTCIceCandidateInit) => {
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  };

  const startMedia = React.useCallback(async () => {
    if (streamRef.current) {
      if (localVideoRef.current && !localVideoRef.current.srcObject) {
        localVideoRef.current.srcObject = streamRef.current;
      }
      return;
    }
    setPermissionError(null);
    setIsConnecting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 }, 
        audio: true 
      });
      streamRef.current = stream;
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      inputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const session = await connectToGeminiLive(
        async (base64) => {
          if (!outputAudioCtxRef.current) return;
          const ctx = outputAudioCtxRef.current;
          nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
          const buffer = await decodeAudioData(decode(base64), ctx, 24000, 1);
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          source.addEventListener('ended', () => sourcesRef.current.delete(source));
          source.start(nextStartTimeRef.current);
          nextStartTimeRef.current += buffer.duration;
          sourcesRef.current.add(source);
        },
        (text, type) => {
          setTranscriptions(prev => [...prev.slice(-4), { text, type }]);
        }
      );
      sessionRef.current = session;

      const sourceNode = inputAudioCtxRef.current.createMediaStreamSource(stream);
      const scriptProcessor = inputAudioCtxRef.current.createScriptProcessor(4096, 1, 1);
      scriptProcessor.onaudioprocess = (e) => {
        if (!isAiTranslatorOn || !isMicOn || !sessionRef.current) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBlob = createPcmBlob(inputData);
        sessionRef.current.sendRealtimeInput({ media: pcmBlob });
      };
      sourceNode.connect(scriptProcessor);
      scriptProcessor.connect(inputAudioCtxRef.current.destination);

      setTimeout(() => setIsConnecting(false), 2000);

    } catch (err: any) {
      console.error("Media error:", err);
      setIsConnecting(false);
      setPermissionError(err.name === 'NotAllowedError' ? "Acceso denegado: Necesitamos permisos de cámara y micrófono." : `Error: ${err.message}`);
    }
  }, [isAiTranslatorOn, isMicOn]); // Reduced dependencies to prevent flicker

  const handleNextUser = () => {
    setIsSlidingUp(true);
    // TikTok style: immediate transition
    setTimeout(() => {
      setIsSlidingUp(false);
      setIsFading(true);
      setIsLongSearch(false);
      
      // Faster reset for zero-latency feel
      setTimeout(() => {
        setIsSearchingFeedback(true);
        setTimeout(() => setIsSearchingFeedback(false), 1000);

        if (peerConnection) {
          peerConnection.close();
          setPeerConnection(null);
        }

        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
        }

        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
        }

        setIsSearching(true);
        searchStartTimeRef.current = Date.now();
        setShowFlashDiscount(false);

        // Socket Matchmaking
        socket.emit("join-queue", {
          userId: "user_" + Math.random().toString(36).substr(2, 9),
          status: isPremium ? "Premium" : "Básico",
          genderFilter: activeFilter,
          country: selectedCountry.name
        });
        
        // Simulation Fallback: If no match in 5s, simulate one
        setTimeout(() => {
          if (isSearching) {
            console.log("Using simulation mode (Sofia/Elena)...");
            setIsSearching(false);
            setIsFading(false);
            onNext();
          }
        }, 5000);
      }, 500);
    }, 300);
  };

  useEffect(() => {
    startMedia();
  }, []); // Empty dependency array as requested to stabilize camera

  useEffect(() => {
    if (!isSearching) {
      setIsLongSearch(false);
      return;
    }

    const longSearchTimeout = setTimeout(() => {
      setIsLongSearch(true);
    }, 1000);

    const interval = setInterval(() => {
      const elapsed = Date.now() - searchStartTimeRef.current;
      if (elapsed > 10000 && activeFilter === 'women' && !isPremium) {
        setShowFlashDiscount(true);
        clearInterval(interval);
      }
    }, 1000);

    return () => {
      clearTimeout(longSearchTimeout);
      clearInterval(interval);
    };
  }, [isSearching, activeFilter, isPremium]);

  // Battery Optimization & Swipe Handler
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isSearching) {
        console.log("App minimized, stopping search for battery optimization.");
        setIsSearching(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isSearching]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    const touchEnd = e.changedTouches[0].clientY;
    const diff = touchStartRef.current - touchEnd;

    // Swipe Up detection (threshold 50px)
    if (diff > 50) {
      handleNextUser();
    }
    touchStartRef.current = null;
  };

  useEffect(() => {
    const onMatchFound = (data: any) => {
      console.log("Match found:", data);
      setCurrentRoomId(data.roomId);
      setIsSearching(false);
      onNext(); 
      
      const pc = new RTCPeerConnection(rtcConfiguration);
      
      // Add local tracks
      streamRef.current?.getTracks().forEach(track => {
        pc.addTrack(track, streamRef.current!);
      });

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("signal-data", {
            roomId: data.roomId,
            signal: { candidate: event.candidate }
          });
        }
      };

      setPeerConnection(pc);

      // Start 10s timeout for re-match
      if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = setTimeout(() => {
        if (pc.connectionState !== 'connected') {
          console.log("WebRTC connection timeout, re-matching...");
          handleNextUser();
        }
      }, 10000);

      // If we are the initiator (e.g., based on data.initiator)
      if (data.initiator) {
        createOffer(pc, data.roomId);
      }
    };

    socket.on("match-found", onMatchFound);
    return () => {
      socket.off("match-found", onMatchFound);
    };
  }, [onNext]); // onNext is stable from props

  const sendGift = async (cost: number, emoji: string) => {
    if (spendCoins(cost)) {
      const id = Date.now();
      setGiftAnimations(prev => [...prev, { id, emoji }]);
      
      // Sistema de Regalos en Tiempo Real (Supabase Broadcast)
      await supabase.channel(`room_${currentRoomId}`).send({
        type: 'broadcast',
        event: 'gift_sent',
        payload: { emoji, from: userProfile.name }
      });

      setTimeout(() => {
        setGiftAnimations(prev => prev.filter(g => g.id !== id));
      }, 3000);

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f43f5e', '#fbbf24', '#ffffff']
      });
    }
  };

  useEffect(() => {
    if (!peerConnection) return;

    const onSignalData = async (data: any) => {
      if (data.signal.type === 'offer') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit("signal-data", {
          roomId: data.roomId || currentRoomId,
          signal: answer
        });
      } else if (data.signal.type === 'answer') {
        await handleAnswer(peerConnection, data.signal);
      } else if (data.signal.candidate) {
        await addIceCandidate(peerConnection, data.signal.candidate);
      }
    };

    socket.on("signal-data", onSignalData);
    return () => {
      socket.off("signal-data", onSignalData);
    };
  }, [peerConnection, currentRoomId]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      sessionRef.current?.close();
      inputAudioCtxRef.current?.close();
      outputAudioCtxRef.current?.close();
      peerConnection?.close();
      if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
    };
  }, []);

  useEffect(() => { if (localStream) localStream.getAudioTracks().forEach(t => t.enabled = isMicOn); }, [isMicOn, localStream]);
  useEffect(() => { if (localStream) localStream.getVideoTracks().forEach(t => t.enabled = isCamOn); }, [isCamOn, localStream]);

  if (permissionError) {
    return (
      <div className="fixed inset-0 bg-slate-950 z-[110] flex flex-col items-center justify-center p-8 text-center text-white space-y-8 animate-in fade-in duration-300">
        <Camera size={64} className="text-rose-500 animate-bounce" />
        <h2 className="text-4xl font-black italic tracking-tighter">PERMISOS REQUERIDOS</h2>
        <p className="text-slate-400 font-bold max-w-sm">{permissionError}</p>
        <div className="flex gap-4 w-full max-w-sm">
          <button onClick={startMedia} className="flex-1 py-5 bg-rose-500 text-white rounded-[2rem] font-black text-lg flex items-center justify-center space-x-2">
            <RefreshCw size={20} /> <span>Reintentar</span>
          </button>
          <button onClick={onClose} className="flex-1 py-5 bg-slate-800 text-white rounded-[2rem] font-black text-lg">Volver</button>
        </div>
      </div>
    );
  }

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`flex-1 flex flex-col h-full bg-black relative overflow-hidden animate-in fade-in duration-500 ${isFading ? 'opacity-0' : 'opacity-100'} ${isSlidingUp ? '-translate-y-full' : 'translate-y-0'} transition-all duration-500`}
    >
      {/* Blur Transition Overlay */}
      <div className={`absolute inset-0 z-[150] backdrop-blur-3xl bg-black/20 pointer-events-none transition-opacity duration-300 ${isBlurring ? 'opacity-100' : 'opacity-0'}`} />
      {/* Remote Video - Full Screen */}
      <div className="absolute inset-0 z-0">
        {isConnecting || isSearching || isSocketError ? (
           <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 relative overflow-hidden">
              {/* Partner Simulation Video */}
              <video 
                src={isSocketError ? 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-lighting-in-a-dark-room-2106-large.mp4' : simVideoUrl} 
                autoPlay 
                loop 
                muted 
                playsInline
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${isLongSearch || isSocketError ? 'opacity-80 grayscale-0 blur-0' : 'opacity-40 grayscale blur-sm'}`}
              />
              
              {/* Radar Scan Effect */}
              <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${isLongSearch ? 'opacity-40' : 'opacity-100'}`}>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(244,63,94,0.1)_180deg,rgba(244,63,94,0.4)_360deg)] animate-[spin_4s_linear_infinite]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-rose-500/20 rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-rose-500/10 rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] border border-rose-500/5 rounded-full" />
              </div>
 
              <div className="relative z-10 flex flex-col items-center space-y-8">
                <div className={`w-32 h-32 border-8 border-rose-500 border-t-transparent rounded-full animate-spin shadow-[0_0_50px_rgba(244,63,94,0.4)] transition-transform duration-500 ${isLongSearch ? 'scale-75' : 'scale-100'}`} />
                <div className="text-center">
                  <p className="text-rose-500 font-black tracking-[0.3em] text-2xl animate-pulse uppercase italic">
                    {isSocketError ? 'RECONECTANDO CON EL SERVIDOR GLOBAL...' : (isSearching 
                      ? (activeFilter === 'women' 
                          ? 'BUSCANDO CHICAS DISPONIBLES...' 
                          : `CONECTANDO CON ${selectedCountry.flag} ${selectedCountry.name.toUpperCase()}...`) 
                      : `CONECTANDO CON ${remoteUser.name}...`)}
                  </p>
                  <p className="text-slate-600 font-bold mt-2 uppercase tracking-widest text-xs">GlobalPulse Matchmaking</p>
                  
                  {(showFlashDiscount || isSocketError) && (
                    <div className="mt-8 p-6 bg-amber-500 rounded-3xl animate-bounce shadow-[0_0_30px_rgba(245,158,11,0.5)] border-4 border-white pointer-events-auto cursor-pointer" onClick={() => setShowVipModal(true)}>
                      <p className="text-black font-black text-xs uppercase tracking-widest">⚡ {isSocketError ? 'MODO OFFLINE' : 'OFERTA RELÁMPAGO!'} ⚡</p>
                      <p className="text-black font-bold text-lg italic">
                        {isSocketError ? 'Servidor no disponible. Prueba la interfaz VIP ahora.' : 'Desbloquea VIP por solo $1.99 y conecta al instante.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
           </div>
        ) : (
          <div className="relative w-full h-full">
            {/* Simulation of remote video using image with blur and overlay */}
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className="absolute inset-0 w-full h-full object-cover" 
            />
            {!remoteVideoRef.current?.srcObject && (
              <img 
                src={remoteUser.imageUrl} 
                className="absolute inset-0 w-full h-full object-cover blur-sm" 
                alt="Remote User" 
              />
            )}
            <div className="absolute inset-0 bg-black/20" />
            
            {/* Gifts Panel */}
            <div className="absolute right-10 top-1/2 -translate-y-1/2 z-40 flex flex-col space-y-4 animate-in slide-in-from-right-10 duration-700">
              <GiftButton emoji="🌹" cost={5} onClick={() => sendGift(5, "🌹")} />
              <GiftButton emoji="💎" cost={20} onClick={() => sendGift(20, "💎")} />
              <GiftButton emoji="👑" cost={50} onClick={() => sendGift(50, "👑")} />
            </div>

            {/* Floating Label over Remote Video */}
            <div className="absolute top-10 left-10 z-20 animate-in slide-in-from-left-10 duration-500">
              <div className="px-6 py-4 bg-black/40 backdrop-blur-3xl rounded-3xl border border-white/20 text-white flex items-center space-x-4 shadow-2xl">
                <span className="text-4xl drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{remoteUser.flag}</span>
                <div>
                  <p className="text-2xl font-black italic tracking-tight">{remoteUser.name}, {remoteUser.age}</p>
                  <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em]">{remoteUser.gender} • {remoteUser.location}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Local Video - Floating Window */}
      <div className="absolute top-10 right-10 w-48 md:w-64 aspect-[3/4] bg-slate-900 rounded-[2.5rem] overflow-hidden border-4 border-white/10 shadow-2xl z-30 ring-8 ring-black/20 transition-all hover:scale-105">
        {isCamOn ? (
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-700 bg-slate-900">
            <VideoOff size={48} />
          </div>
        )}
        <div className="absolute bottom-4 left-4 flex flex-col space-y-1">
          <div className="flex items-center space-x-2 bg-black/60 backdrop-blur px-3 py-1.5 rounded-xl border border-white/10">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-black text-white uppercase tracking-widest">Tú</span>
          </div>
          {userLocation && (
            <div className="flex items-center space-x-1 bg-black/40 backdrop-blur px-2 py-1 rounded-lg border border-white/5">
              <span className="text-xs">{userLocation.flag}</span>
              <span className="text-[8px] font-bold text-white/70 uppercase tracking-tighter">{userLocation.country}</span>
            </div>
          )}
        </div>
      </div>

      {/* AI Translation Overlay */}
      {isAiTranslatorOn && !isConnecting && !isSearching && transcriptions.length > 0 && (
        <div className="absolute bottom-48 left-1/2 -translate-x-1/2 w-full max-w-2xl p-8 flex flex-col space-y-4 z-30 pointer-events-none">
          {transcriptions.map((t, i) => (
            <div 
              key={i} 
              className={`p-5 rounded-[2rem] text-sm font-bold shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 border backdrop-blur-3xl ${
                t.type === 'input' 
                  ? 'self-end bg-white/5 text-white/60 border-white/5' 
                  : 'self-start bg-rose-500 text-white border-rose-400 shadow-rose-900/40'
              }`}
            >
              {t.text}
            </div>
          ))}
        </div>
      )}

      {/* Gift Animations Overlay */}
      <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden">
        {giftAnimations.map(g => (
          <div 
            key={g.id}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 text-8xl animate-bounce-up"
          >
            {g.emoji}
          </div>
        ))}
      </div>

      {/* TikTok Style Swipe Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center animate-bounce opacity-40 pointer-events-none">
        <ChevronUp size={24} className="text-white" />
        <span className="text-[8px] font-black text-white uppercase tracking-widest">Desliza para el siguiente</span>
      </div>

      {/* Searching Feedback Overlay */}
      {isSearchingFeedback && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
          <div className="px-10 py-5 bg-rose-600 text-white rounded-full font-black text-2xl shadow-2xl animate-bounce">
            Buscando pareja...
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-10 flex flex-col items-center space-y-8 z-40 bg-gradient-to-t from-black to-transparent">
        
        {/* Filter UI */}
        <div className="flex items-center space-x-4 animate-in slide-in-from-bottom-4 duration-500">
          <button 
            onClick={() => setActiveFilter('global')}
            className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border cursor-pointer ${
              activeFilter === 'global' 
              ? 'bg-white/10 text-white border-white/20 shadow-lg' 
              : 'text-white/40 border-transparent hover:text-white/60'
            }`}
          >
            🌎 Global
          </button>
          <button 
            onClick={() => {
              if (userStatus === 'guest') {
                setPendingAction(() => () => {
                  setActiveFilter('women');
                  handleNextUser();
                });
                setIsAuthModalOpen(true);
              } else if (!isPremium) {
                setPaywallMessage(`🔥 ¡Más de 2,500 mujeres esperando! No las hagas esperar.`);
                setShowVipModal(true);
              } else {
                setActiveFilter('women');
                handleNextUser(); 
              }
            }}
            className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center space-x-2 cursor-pointer ${
              activeFilter === 'women' 
              ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]' 
              : 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20'
            }`}
          >
            <span>👩 Solo Mujeres</span>
            {!isPremium && <Crown size={14} fill="currentColor" />}
          </button>
        </div>

        <div className="flex items-center space-x-6">
          <ControlButton active={isMicOn} icon={isMicOn ? <Mic size={24} /> : <MicOff size={24} />} onClick={() => setIsMicOn(!isMicOn)} />
          
          <button 
            onClick={handleNextUser}
            className="px-14 py-7 bg-gradient-to-r from-rose-600 to-rose-700 text-white rounded-[2.5rem] font-black text-2xl transition-all shadow-[0_0_50px_rgba(225,29,72,0.6)] hover:scale-110 active:scale-95 flex items-center space-x-3 group border-2 border-white/10 cursor-pointer animate-pulse"
          >
            <span>SIGUIENTE</span>
            <span className="group-hover:animate-bounce">🔥</span>
          </button>

          <ControlButton active={isCamOn} icon={isCamOn ? <Video size={24} /> : <VideoOff size={24} />} onClick={() => setIsCamOn(!isCamOn)} />
        </div>

        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setIsAiTranslatorOn(!isAiTranslatorOn)}
            className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
              isAiTranslatorOn ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-slate-900 text-slate-500'
            }`}
          >
            <Languages size={16} />
            <span>Traducción IA {isAiTranslatorOn ? 'ON' : 'OFF'}</span>
          </button>
          
          <button 
            onClick={onClose}
            className="px-6 py-3 bg-white/5 hover:bg-rose-600/20 text-white/40 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border border-white/5"
          >
            Finalizar
          </button>
        </div>
      </div>
    </div>
  );
}

function ControlButton({ active, icon, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`p-6 rounded-full transition-all duration-300 shadow-2xl border ${
        active 
        ? 'bg-slate-800 text-white hover:bg-slate-700 border-white/10 shadow-black/40' 
        : 'bg-rose-500/10 text-rose-500 ring-4 ring-rose-500/10 border-rose-500/20'
      }`}
    >
      {icon}
    </button>
  );
}

function GiftButton({ emoji, cost, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="w-16 h-16 bg-black/40 backdrop-blur-3xl rounded-2xl border border-white/10 flex flex-col items-center justify-center hover:scale-110 active:scale-95 transition-all group cursor-pointer"
    >
      <span className="text-2xl group-hover:animate-bounce">{emoji}</span>
      <span className="text-[8px] font-black text-amber-500 mt-1">{cost}</span>
    </button>
  );
}
