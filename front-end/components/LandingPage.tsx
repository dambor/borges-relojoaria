import React from 'react';
import { Logo } from './Logo';

interface LandingPageProps {
    onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
    return (
        <div className="min-h-screen bg-[#f9fafb] flex flex-col font-sans">
            {/* Navigation */}
            <nav className="px-6 py-6 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
                <Logo size="sm" />
                <button
                    onClick={onStart}
                    className="text-sm font-bold text-[#1f2937] hover:text-black transition-colors uppercase tracking-wider"
                >
                    Entrar
                </button>
            </nav>

            {/* Hero Section */}
            <header className="px-6 pt-16 pb-20 flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-b from-gray-100 to-transparent rounded-full blur-3xl -z-10 opacity-60"></div>

                <span className="inline-block py-1 px-3 rounded-full bg-gray-100 text-[#1f2937] text-[10px] font-bold uppercase tracking-widest mb-6 border border-gray-200">
                    Especialistas em Relojoaria
                </span>

                <h1 className="font-serif text-5xl md:text-6xl text-[#1f2937] font-bold leading-tight mb-6">
                    Relojoaria <br />
                    Borges
                </h1>

                <p className="text-gray-600 text-lg leading-relaxed max-w-md mb-10 font-light">
                    Unimos a tradição da relojoaria artesanal com a precisão da inteligência artificial para diagnósticos rápidos e precisos.
                </p>

                <button
                    onClick={onStart}
                    className="bg-[#1f2937] text-white text-lg font-bold py-4 px-10 rounded-full shadow-xl hover:bg-black hover:scale-105 transition-all active:scale-95"
                >
                    Avaliar Agora
                </button>

                {/* Hero Image / Illustration Placeholder */}
                <div className="mt-16 relative w-full max-w-md aspect-square bg-gray-100 rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white">
                    <img
                        src="https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=2080&auto=format&fit=crop"
                        alt="Luxury Watch Repair"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                    <div className="absolute bottom-6 left-6 text-white text-left">
                        <p className="font-serif text-2xl font-bold">Diagnóstico em Segundos</p>
                        <p className="text-sm opacity-90">Basta uma foto</p>
                    </div>
                </div>
            </header>

            {/* Features Section */}
            <section className="px-6 py-20 bg-white">
                <div className="max-w-md mx-auto">
                    <h2 className="font-serif text-3xl text-[#1f2937] font-bold mb-12 text-center">Como Funciona</h2>

                    <div className="space-y-12">
                        <div className="flex gap-6 items-start">
                            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl border border-gray-100 shrink-0">
                                📸
                            </div>
                            <div>
                                <h3 className="font-bold text-[#1f2937] text-lg mb-2">1. Envie uma Foto</h3>
                                <p className="text-gray-500 leading-relaxed">Tire uma foto do seu relógio. Nossa IA identifica a marca, modelo e características automaticamente.</p>
                            </div>
                        </div>

                        <div className="flex gap-6 items-start">
                            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl border border-gray-100 shrink-0">
                                🔍
                            </div>
                            <div>
                                <h3 className="font-bold text-[#1f2937] text-lg mb-2">2. Análise Inteligente</h3>
                                <p className="text-gray-500 leading-relaxed">Descreva o problema e receba uma pré-avaliação técnica instantânea.</p>
                            </div>
                        </div>

                        <div className="flex gap-6 items-start">
                            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl border border-gray-100 shrink-0">
                                ✨
                            </div>
                            <div>
                                <h3 className="font-bold text-[#1f2937] text-lg mb-2">3. Orçamento Rápido</h3>
                                <p className="text-gray-500 leading-relaxed">Acompanhe o status do conserto em tempo real e fale diretamente com nossos técnicos.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[#1f2937] text-white py-12 px-6 text-center mt-auto">
                <Logo size="sm" color="white" />
                <p className="text-gray-400 text-sm mt-6 mb-6">
                    Tradição e tecnologia para o seu tempo.
                </p>
                <div className="h-px w-20 bg-gray-700 mx-auto mb-6"></div>
                <p className="text-gray-600 text-xs uppercase tracking-widest">
                    © 2024 Borges Relojoaria
                </p>
            </footer>
        </div>
    );
};
