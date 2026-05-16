import React from 'react';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error al cerrar sesión:', error.message);
    }
  };

  const settingsItems = [
    { id: 'export', label: 'Exportar JSON', icon: 'file_export', color: 'text-primary' },
    { id: 'import', label: 'Importar JSON', icon: 'file_upload', color: 'text-primary' },
    { id: 'clear', label: 'Vaciar tickets', icon: 'delete_sweep', color: 'text-error' },
    { id: 'diag', label: 'Diagnóstico técnico', icon: 'terminal', color: 'text-on-surface-variant' },
  ];

  return (
    <div className="flex flex-col animate-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-2xl font-headline font-bold text-on-surface mt-6 mb-2">Ajustes</h1>
      <p className="text-on-surface-variant mb-8 text-sm">Control interno y gestión de datos locales.</p>

      {/* User Info Section */}
      <div className="bg-surface-container-low p-6 rounded-3xl mb-8 border border-outline-variant/10 flex items-center gap-4">
        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center overflow-hidden">
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="material-symbols-outlined text-primary text-3xl">account_circle</span>
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          <h3 className="font-headline font-bold text-on-surface truncate">
            {user?.user_metadata?.full_name || 'Usuario de TicketControl'}
          </h3>
          <p className="text-xs text-on-surface-variant truncate">{user?.email}</p>
        </div>
        <div className="px-2 py-1 bg-primary/10 rounded-md">
          <span className="text-[10px] font-bold text-primary uppercase">PRO</span>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 gap-3">
        {settingsItems.map((item) => (
          <button
            key={item.id}
            className="w-full p-4 bg-surface-container-lowest rounded-2xl flex items-center justify-between hover:bg-surface-container-low transition-colors group border border-outline-variant/5 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <span className={`material-symbols-outlined ${item.color} text-xl`}>{item.icon}</span>
              <span className="font-medium text-on-surface text-sm">{item.label}</span>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant/30 text-lg group-hover:translate-x-1 transition-transform">chevron_right</span>
          </button>
        ))}
      </div>

      <div className="mt-10 pt-10 border-t border-outline-variant/20">
        <button 
          onClick={handleLogout}
          className="w-full p-4 bg-error/10 hover:bg-error/15 text-error rounded-2xl flex items-center justify-center gap-3 font-headline font-bold transition-all active:scale-[0.98]"
        >
          <span className="material-symbols-outlined">logout</span>
          Cerrar sesión
        </button>
      </div>

      {/* App Version Info */}
      <div className="mt-12 text-center text-on-surface-variant/40">
        <p className="text-[10px] font-bold uppercase tracking-widest">TicketControl App</p>
        <p className="text-[10px] mt-1 font-medium">Versión 1.0.0 (Internal Build)</p>
        <p className="text-[10px] mt-4 opacity-50">Logueado como {user?.email}</p>
      </div>
    </div>
  );
};

export default Settings;
