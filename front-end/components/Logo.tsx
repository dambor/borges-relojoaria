import React from 'react';

export const Logo: React.FC<{ size?: 'sm' | 'lg' }> = ({ size = 'lg' }) => {
  // Nota: O usuário deve colocar o arquivo de imagem 'logo.png' na pasta public.
  // Caso a imagem não carregue, um fallback estilizado será mostrado.
  
  // Aumentado de w-48 para w-64 (~30% maior)
  const imgSize = size === 'lg' ? 'w-64' : 'w-12';

  return (
    <div className="flex flex-col items-center justify-center select-none">
      {/* Container da Imagem */}
      <div className={`${imgSize} flex items-center justify-center`}>
        <img 
          src="/logo.png" 
          alt="Relojoaria Borges" 
          className="w-full h-auto object-contain drop-shadow-md"
          onError={(e) => {
            // Fallback caso a imagem não exista
            e.currentTarget.style.display = 'none';
            e.currentTarget.parentElement!.innerHTML = `<div class="text-center"><span class="text-4xl">🛡️</span><h1 class="font-serif font-bold uppercase text-[#1f2937]">Borges</h1></div>`;
          }}
        />
      </div>
    </div>
  );
};