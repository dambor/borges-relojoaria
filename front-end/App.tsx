
import React, { useState, useRef, useEffect } from 'react';
import { Logo } from './components/Logo';
import { BottomNav } from './components/BottomNav';
import { api } from './services/api';
import { ViewState, RepairItem } from './types';

// Mock Data for Login (removed)

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('LOGIN');

  // Login State
  const [loginStep, setLoginStep] = useState<'PHONE' | 'NAME'>('PHONE');
  const [phone, setPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [user, setUser] = useState<any>(null); // Store full user object
  const [loginError, setLoginError] = useState('');

  // App Data State
  const [repairs, setRepairs] = useState<RepairItem[]>([]);
  const [selectedRepair, setSelectedRepair] = useState<RepairItem | null>(null);

  // Add Repair State
  const [newRepairImage, setNewRepairImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [description, setDescription] = useState('');

  // Watch Details State (AI populated, User editable)
  const [brand, setBrand] = useState('');
  const [watchType, setWatchType] = useState('');
  const [features, setFeatures] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Effects ---
  useEffect(() => {
    if (view === 'HOME') {
      loadRepairs();
    }
  }, [view]);

  const loadRepairs = async () => {
    try {
      // Pass phone to backend so it can filter based on role
      const data = await api.getRepairs(phone.replace(/\D/g, ''));
      setRepairs(data);
    } catch (error) {
      console.error('Error loading repairs:', error);
    }
  };

  // --- Handlers ---

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (loginStep === 'PHONE') {
      // 1. Sanitize Phone
      const cleanPhone = phone.replace(/\D/g, '');

      // 2. Validate DDD + Number (10 or 11 digits)
      if (cleanPhone.length < 10 || cleanPhone.length > 11) {
        setLoginError('Digite o número com DDD (Ex: 11999999999)');
        return;
      }

      // 3. Check if user exists via API
      try {
        const user = await api.getUser(cleanPhone);
        if (user) {
          // Existing User -> Login directly
          setCustomerName(user.name);
          setUser(user);
          setView('HOME');
        } else {
          // New User -> Ask for Name
          setLoginStep('NAME');
        }
      } catch (error) {
        console.error("Login error", error);
        setLoginError('Erro ao verificar usuário. Tente novamente.');
      }
    } else {
      // Name Step
      if (customerName.trim().length < 2) {
        setLoginError('Por favor, digite seu nome.');
        return;
      }

      // Register New User -> Login
      try {
        const cleanPhone = phone.replace(/\D/g, '');
        const newUser = await api.createUser({ phone: cleanPhone, name: customerName, role: 'CUSTOMER' });
        setUser(newUser);
        setView('HOME');
        setRepairs([]);
      } catch (error) {
        console.error("Registration error", error);
        setLoginError('Erro ao cadastrar. Tente novamente.');
      }
    }
  };

  const handleCameraClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setNewRepairImage(base64String);
        setView('ADD_REPAIR');

        // Reset fields
        setBrand('');
        setWatchType('');
        setFeatures('');

        // Start Analysis
        setIsAnalyzing(true);
        try {
          // We need to send just the base64 part often, but our backend might handle the prefix.
          // The service.py we wrote expects the prefix to be stripped or handled.
          // Let's check api.ts -> it sends the whole string.
          // Let's check main.py -> it calls analyze_watch_image.
          // Let's check service.py -> it strips "base64," if present.
          // So sending the full data URL is fine.
          const result = await api.analyzeImage(base64String);

          // Populate fields with AI result
          setBrand(result.brand);
          setWatchType(result.type);
          setFeatures(result.features);
        } catch (error) {
          console.error("Analysis failed", error);
          setFeatures("Falha na análise automática.");
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveRepair = async () => {
    if (!newRepairImage) return;

    const newRepair: RepairItem = {
      // ID is optional in our model for creation, but required for the type.
      // We can let the backend generate it, but our frontend type expects a string.
      // For now, let's just pass a temp one, backend will ignore or overwrite if we configured it so.
      // Actually, our backend create_repair takes RepairItem.
      // If we pass ID, Supabase might try to use it.
      // Let's generate a UUID or just use Date.now() as before for optimistic UI,
      // but ideally we wait    const newRepair: RepairItem = {
      id: Date.now().toString(), // Temporary ID, backend will replace or we keep it
      user_phone: phone.replace(/\D/g, ''),
      customerName: customerName,
      description: description,
      status: 'PENDING',
      date: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }),
      imageUrl: newRepairImage,
      analysis: {
        brand: brand,
        type: watchType,
        features: features
      },
    };

    try {
      const createdRepair = await api.createRepair(newRepair);
      setRepairs([createdRepair, ...repairs]);

      // Reset form
      setNewRepairImage(null);
      setDescription('');
      setBrand('');
      setWatchType('');
      setFeatures('');
      setView('HOME');
    } catch (error) {
      console.error("Failed to save repair", error);
      alert("Erro ao salvar pedido.");
    }
  };

  const handleRepairClick = (item: RepairItem) => {
    setSelectedRepair(item);
    setView('REPAIR_DETAILS');
  };

  // --- Views ---

  const renderLogin = () => (
    <div className="min-h-screen bg-[#f9fafb] flex flex-col items-center justify-center p-6 relative overflow-hidden">

      <div className="z-10 w-full max-w-sm flex flex-col items-center transition-all duration-500">
        <Logo size="lg" />

        <form onSubmit={handleLogin} className="mt-8 w-full relative">
          <div className="relative flex items-center shadow-sm rounded-full transition-all duration-300">

            {/* Back button for Name step */}
            {loginStep === 'NAME' && (
              <button
                type="button"
                onClick={() => setLoginStep('PHONE')}
                className="absolute left-2 text-gray-400 hover:text-[#1f2937] p-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
            )}

            <input
              type={loginStep === 'PHONE' ? "tel" : "text"}
              value={loginStep === 'PHONE' ? phone : customerName}
              onChange={(e) => {
                setLoginError('');
                if (loginStep === 'PHONE') setPhone(e.target.value);
                else setCustomerName(e.target.value);
              }}
              placeholder={loginStep === 'PHONE' ? "DDD + Número..." : "Como podemos te chamar?"}
              autoFocus={loginStep === 'NAME'}
              className={`w-full bg-white text-[#1f2937] placeholder-gray-400 border ${loginError ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-300'} rounded-full py-4 ${loginStep === 'NAME' ? 'pl-10' : 'pl-6'} pr-14 text-center text-lg font-serif focus:outline-none focus:border-[#1f2937] focus:ring-1 focus:ring-[#1f2937] transition-all`}
            />

            <button
              type="submit"
              className="absolute right-2 bg-[#1f2937] text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-black active:scale-95 transition-all shadow-md border border-[#1f2937]"
              aria-label="Avançar"
            >
              {loginStep === 'PHONE' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"></path>
                  <path d="M12 5l7 7-7 7"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5"></path>
                </svg>
              )}
            </button>
          </div>

          {/* Error / Status Message */}
          <div className="h-6 mt-3 text-center">
            {loginError ? (
              <span className="text-red-500 text-xs font-bold tracking-wide animate-pulse">{loginError}</span>
            ) : loginStep === 'NAME' ? (
              <span className="text-gray-400 text-xs italic font-serif">Parece que é sua primeira vez aqui!</span>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );

  const renderHome = () => (
    <div className="min-h-screen bg-[#f9fafb] pb-24">
      <div className="bg-white pt-8 pb-4 px-6 sticky top-0 z-10 border-b border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <Logo size="sm" />
          <span className="text-gray-500 font-serif text-sm italic">Olá, {customerName}</span>
        </div>
        <h2 className="font-serif text-3xl text-[#1f2937] font-bold tracking-tight">Meus Consertos</h2>
      </div>

      <div className="px-6 mt-6 space-y-4">
        {repairs.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-2xl text-gray-300">⌚</div>
            <p className="text-gray-400 italic font-serif mb-2">Nenhum conserto registrado.</p>
            <p className="text-xs text-gray-400 uppercase tracking-widest">Toque na câmera para começar</p>
          </div>
        ) : (
          repairs.map((repair) => (
            <div
              key={repair.id}
              onClick={() => handleRepairClick(repair)}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex gap-4 items-start hover:shadow-md transition-shadow cursor-pointer active:scale-98"
            >
              {repair.imageUrl ? (
                <img src={repair.imageUrl} alt="Relógio" className="w-20 h-20 rounded-xl object-cover border border-gray-100 bg-gray-50" />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center text-2xl border border-gray-200">⌚</div>
              )}

              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-serif font-bold text-[#1f2937] text-lg">{repair.analysis?.brand || 'Relógio'}</h3>
                  <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-bold tracking-wider border border-gray-200">
                    {repair.date}
                  </span>
                </div>
                <p className="text-gray-600 text-sm leading-tight mb-3 line-clamp-2 font-light">{repair.description}</p>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${repair.status === 'COMPLETED' ? 'bg-green-600' :
                    repair.status === 'IN_PROGRESS' ? 'bg-amber-500' : 'bg-gray-400'
                    }`}></span>
                  <span className="text-xs uppercase tracking-wide text-gray-500 font-bold">
                    {repair.status === 'COMPLETED' ? 'Pronto' :
                      repair.status === 'IN_PROGRESS' ? 'Em andamento' : 'Pendente'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderRepairDetails = () => {
    if (!selectedRepair) return null;

    return (
      <div className="min-h-screen bg-[#f9fafb] pb-24 flex flex-col">
        <div className="px-6 pt-8 pb-4 bg-white border-b border-gray-100 sticky top-0 z-10 flex items-center justify-between">
          <button onClick={() => setView('HOME')} className="text-gray-500 flex items-center gap-2 hover:text-[#1f2937] transition-colors p-2 -ml-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            <span className="uppercase font-bold text-xs tracking-widest">Voltar</span>
          </button>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Detalhes do Pedido</span>
          <div className="w-8"></div> {/* Spacer for centering */}
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Hero Image */}
          <div className="w-full h-72 bg-gray-100 relative">
            {selectedRepair.imageUrl ? (
              <img src={selectedRepair.imageUrl} alt="Detalhe" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl text-gray-300">⌚</div>
            )}
            <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#f9fafb] to-transparent"></div>
          </div>

          <div className="px-6 -mt-12 relative z-10 space-y-6">

            {/* Header Card */}
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <h2 className="font-serif text-3xl font-bold text-[#1f2937]">{selectedRepair.analysis?.brand || 'Relógio'}</h2>
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${selectedRepair.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' :
                  selectedRepair.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}>
                  {selectedRepair.status === 'COMPLETED' ? 'Pronto para retirada' :
                    selectedRepair.status === 'IN_PROGRESS' ? 'Em bancada' : 'Aguardando avaliação'}
                </div>
              </div>
              <p className="text-gray-500 font-serif italic text-sm mb-4">Entrada: {selectedRepair.date}</p>
              <div className="h-px w-full bg-gray-100 mb-4"></div>
              <p className="text-gray-700 leading-relaxed font-light">{selectedRepair.description}</p>
            </div>

            {/* Technical Details */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                Ficha Técnica
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-500 text-sm">Tipo</span>
                  <span className="text-[#1f2937] font-medium text-sm">{selectedRepair.analysis?.type || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-500 text-sm">Características</span>
                  <span className="text-[#1f2937] font-medium text-sm text-right max-w-[60%]">{selectedRepair.analysis?.features || '-'}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-gray-500 text-sm">Protocolo</span>
                  <span className="text-gray-400 font-mono text-sm">#{String(selectedRepair.id).slice(-6)}</span>
                </div>
              </div>
            </div>

            {/* Contact Action */}
            <button
              onClick={async () => {
                try {
                  const technicianPhone = await api.getAdminPhone();
                  const message = encodeURIComponent(`Olá, gostaria de falar sobre o pedido #${String(selectedRepair.id).slice(-6)} (${selectedRepair.analysis?.brand || 'Relógio'})`);
                  window.open(`https://wa.me/${technicianPhone}?text=${message}`, '_blank');
                } catch (error) {
                  console.error("Failed to get admin phone", error);
                  alert("Erro ao conectar com o técnico.");
                }
              }}
              className="w-full bg-white border border-[#1f2937] text-[#1f2937] font-bold uppercase tracking-widest py-4 rounded-xl hover:bg-gray-50 transition-colors mb-8"
            >
              Falar com Técnico
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAddRepair = () => (
    <div className="min-h-screen bg-[#f9fafb] pb-24 flex flex-col">
      <div className="px-6 pt-8 pb-4 bg-white border-b border-gray-100 sticky top-0 z-10">
        <button onClick={() => setView('HOME')} className="text-gray-500 flex items-center gap-2 mb-4 hover:text-[#1f2937] transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
          <span className="uppercase font-bold text-xs tracking-widest">Voltar</span>
        </button>
        <h2 className="font-serif text-3xl text-[#1f2937] font-bold">Novo Pedido</h2>
      </div>

      <div className="flex-1 px-6 pt-6 overflow-y-auto">
        {/* Image Preview */}
        <div className="w-full h-64 bg-gray-100 rounded-3xl overflow-hidden shadow-inner border border-gray-200 relative mb-8">
          {newRepairImage && (
            <img src={newRepairImage} alt="Preview" className="w-full h-full object-cover" />
          )}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white backdrop-blur-sm">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mb-3"></div>
              <span className="font-serif italic tracking-wide">Analisando relógio...</span>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Detalhes do Relógio</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[#1f2937] text-xs font-bold mb-1 ml-1">Marca</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  disabled={isAnalyzing}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-[#1f2937] focus:outline-none focus:border-[#1f2937] focus:bg-white transition-all disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-[#1f2937] text-xs font-bold mb-1 ml-1">Tipo</label>
                <input
                  type="text"
                  value={watchType}
                  onChange={(e) => setWatchType(e.target.value)}
                  disabled={isAnalyzing}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-[#1f2937] focus:outline-none focus:border-[#1f2937] focus:bg-white transition-all disabled:opacity-50"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[#1f2937] text-xs font-bold mb-1 ml-1">Características</label>
                <input
                  type="text"
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  disabled={isAnalyzing}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-[#1f2937] focus:outline-none focus:border-[#1f2937] focus:bg-white transition-all disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Sobre o Serviço</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[#1f2937] text-xs font-bold mb-1 ml-1">Seu Nome</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-[#1f2937] focus:outline-none focus:border-[#1f2937] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-[#1f2937] text-xs font-bold mb-1 ml-1">Descrição do Problema</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: O relógio parou de funcionar..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-[#1f2937] focus:outline-none focus:border-[#1f2937] focus:bg-white transition-all resize-none"
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSaveRepair}
          disabled={isAnalyzing || !description}
          className="w-full bg-[#1f2937] text-white font-bold tracking-widest uppercase py-4 rounded-xl shadow-lg hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-8 mb-8 border border-[#1f2937]"
        >
          Enviar Pedido
        </button>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="min-h-screen bg-[#f9fafb] flex flex-col items-center justify-center pb-24">
      <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-4xl mb-4 border-4 border-white shadow-md">
        👤
      </div>
      <h2 className="font-serif text-2xl text-[#1f2937] font-bold">{customerName || 'Usuário'}</h2>
      <p className="text-gray-500 mt-1 font-serif">{phone}</p>
      <button
        onClick={() => {
          setView('LOGIN');
          setLoginStep('PHONE');
          setPhone('');
          setCustomerName('');
          setLoginError('');
          setRepairs([]); // Reset data
        }}
        className="mt-8 text-red-500 text-sm font-bold uppercase tracking-widest border border-red-200 px-6 py-2 rounded-full hover:bg-red-50 transition-colors"
      >
        Sair
      </button>
    </div>
  );

  // Hidden File Input for Camera
  const renderHiddenInput = () => (
    <input
      type="file"
      accept="image/*"
      capture="environment" // Forces back camera on mobile
      ref={fileInputRef}
      onChange={handleFileChange}
      className="hidden"
    />
  );

  const handleStatusChange = async (repair: RepairItem, newStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED') => {
    try {
      const updatedRepair = { ...repair, status: newStatus };
      await api.updateRepair(updatedRepair);
      // Update local state
      setRepairs(repairs.map(r => r.id === repair.id ? updatedRepair : r));
      if (selectedRepair?.id === repair.id) {
        setSelectedRepair(updatedRepair);
      }
    } catch (error) {
      console.error("Failed to update status", error);
      alert("Erro ao atualizar status.");
    }
  };

  const renderAdminDashboard = () => (
    <div className="min-h-screen bg-[#f9fafb] pb-24">
      <div className="bg-white pt-8 pb-4 px-6 sticky top-0 z-10 border-b border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold bg-black text-white px-2 py-1 rounded-md uppercase tracking-wider">Admin</span>
            <button onClick={() => setView('PROFILE')} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm">
              👤
            </button>
          </div>
        </div>
        <h2 className="font-serif text-2xl text-[#1f2937] font-bold tracking-tight">Painel de Controle</h2>
      </div>

      <div className="px-6 mt-6 space-y-4">
        {repairs.length === 0 ? (
          <p className="text-center text-gray-400 italic mt-10">Nenhum pedido encontrado.</p>
        ) : (
          repairs.map((repair) => (
            <div key={repair.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  {repair.imageUrl ? (
                    <img src={repair.imageUrl} className="w-12 h-12 rounded-lg object-cover bg-gray-50" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">⌚</div>
                  )}
                  <div>
                    <h3 className="font-bold text-[#1f2937] text-sm">{repair.customerName}</h3>
                    <p className="text-xs text-gray-500">{repair.user_phone}</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-gray-400">#{String(repair.id).slice(-6)}</span>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{repair.description}</p>

              <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl">
                <span className="text-xs font-bold text-gray-500 ml-2">Status:</span>
                <select
                  value={repair.status}
                  onChange={(e) => handleStatusChange(repair, e.target.value as any)}
                  className="bg-white border border-gray-200 text-[#1f2937] text-xs font-bold uppercase tracking-wide py-1 px-3 rounded-lg focus:outline-none focus:border-black transition-colors"
                >
                  <option value="PENDING">Pendente</option>
                  <option value="IN_PROGRESS">Em Andamento</option>
                  <option value="COMPLETED">Concluído</option>
                </select>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <>
      {view === 'LOGIN' && renderLogin()}

      {view !== 'LOGIN' && (
        <>
          {/* Router Logic for Views */}
          {view === 'HOME' && (user?.role === 'ADMIN' ? renderAdminDashboard() : renderHome())}
          {/* Note: In real app, check user.role. For now we check name/phone or we need to store user object in state */}

          {view === 'ADD_REPAIR' && renderAddRepair()}
          {view === 'PROFILE' && renderProfile()}
          {view === 'REPAIR_DETAILS' && renderRepairDetails()}

          {/* Hide bottom nav for Admin or Details */}
          {view !== 'REPAIR_DETAILS' && user?.role !== 'ADMIN' && (
            <BottomNav
              currentView={view}
              onChangeView={setView}
              onCameraClick={handleCameraClick}
            />
          )}
        </>
      )}

      {renderHiddenInput()}
    </>
  );
};

export default App;
