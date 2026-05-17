import React from 'react';
import { useNavigate } from 'react-router-dom';

const Consultas = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 max-w-md mx-auto w-full p-4">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full hover:bg-surface-variant transition-colors text-on-surface">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-2xl font-headline font-bold text-on-surface">Consultas</h1>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <span className="material-symbols-outlined text-6xl text-primary/40 mb-4">construction</span>
        <p className="text-on-surface-variant font-body text-lg">Próximamente...</p>
      </div>
    </div>
  );
};

export default Consultas;
