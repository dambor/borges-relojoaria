import React from 'react';
import { ViewState } from '../types';

interface BottomNavProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onCameraClick: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onChangeView, onCameraClick }) => {
  const activeClass = "text-[#1f2937]"; // Dark Slate
  const inactiveClass = "text-[#9ca3af]"; // Silver/Gray

  return (
    <div className="fixed bottom-0 left-0 w-full h-20 bg-white border-t border-gray-200 flex justify-between items-center px-8 pb-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
      
      {/* Tab Esquerda: Meus Concertos */}
      <button 
        onClick={() => onChangeView('HOME')}
        className={`flex flex-col items-center justify-center space-y-1 w-16 ${currentView === 'HOME' ? activeClass : inactiveClass}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
        <span className="text-[10px] font-bold tracking-wide uppercase">Consertos</span>
      </button>

      {/* Tab Central: Camera Action */}
      <div className="relative -top-6">
        <button 
          onClick={onCameraClick}
          className="bg-[#1f2937] text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform border-4 border-white ring-1 ring-gray-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </button>
      </div>

      {/* Tab Direita: Perfil */}
      <button 
        onClick={() => onChangeView('PROFILE')}
        className={`flex flex-col items-center justify-center space-y-1 w-16 ${currentView === 'PROFILE' ? activeClass : inactiveClass}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span className="text-[10px] font-bold tracking-wide uppercase">Perfil</span>
      </button>
    </div>
  );
};