import React, { useState } from 'react';
import Sidebar from './Sidebar';
import BottomNavBar from './BottomNavBar';
import MoreMenuSheet from './MoreMenuSheet';
import { Calendar, User as UserIcon, Bell, Package, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useIsMobile } from '../../hooks/useIsMobile';

const MainLayout = ({ children }) => {
  const isMobile = useIsMobile();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const { user, token } = useAuthStore();
  const today = new Date().toLocaleDateString('es-ES', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const api = axios.create({
    baseURL: '/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  const { data: stockBajo = [] } = useQuery({
    queryKey: ['stock-bajo-global'],
    queryFn: async () => {
      const { data } = await api.get('/stock/bajo');
      return data;
    },
    refetchInterval: 60000 // Cada minuto
  });

  return (
    <div className="min-h-screen bg-bg-primary flex relative">
      {/* Marca de Agua Global */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden opacity-[0.03] dark:opacity-[0.02]">
         <img 
           src="/multimedia/dulce-logo2_.png" 
           alt="" 
           className="w-[600px] h-[600px] object-contain"
         />
      </div>

      {!isMobile && <Sidebar />}
      
      <main className={`flex-1 transition-all duration-300 p-4 lg:p-8 relative ${
        isMobile ? 'pb-24' : 'ml-20 md:ml-64'
      }`}>
        {/* Header */}
        <header className="flex items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-xl md:text-3xl font-black text-text-primary tracking-tight">
              {isMobile ? `¡Hola, ${user?.nombre?.split(' ')[0] || '...'}!` : `¡Hola, ${user?.nombre?.split(' ')[0] || 'Usuario'}! 👋`}
            </h1>
            {!isMobile && (
              <p className="text-text-secondary text-sm flex items-center gap-2 mt-1 font-medium italic">
                <Calendar size={14} />
                {today.charAt(0).toUpperCase() + today.slice(1)}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Notifications */}
            <div className="relative group">
               <button className="w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-[#1C1C1E] rounded-apple-lg border border-border flex items-center justify-center text-text-muted hover:text-brand-primary hover:border-brand-primary transition-all shadow-shadow-sm">
                  <Bell size={isMobile ? 18 : 22} />
                  {stockBajo.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-red-500 text-white text-[9px] md:text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                      {stockBajo.length}
                    </span>
                  )}
               </button>
               
               {/* Dropdown simple - Disable hover dropdown on mobile for better UX */}
               {!isMobile && (
                 <div className="absolute right-0 top-14 w-64 bg-white dark:bg-[#1C1C1E] rounded-[24px] shadow-2xl border border-border opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 z-50 overflow-hidden">
                    <div className="p-4 border-b border-border bg-bg-primary/50 dark:bg-bg-dark">
                       <p className="text-xs font-black text-text-primary uppercase tracking-widest">Notificaciones</p>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {stockBajo.length === 0 ? (
                        <p className="p-6 text-center text-xs text-text-muted italic">No tienes alertas pendientes.</p>
                      ) : (
                        stockBajo.map(item => (
                          <Link key={item.id} to="/produccion" className="flex items-center gap-3 p-4 hover:bg-bg-primary dark:hover:bg-bg-dark transition-colors border-b border-border last:border-0">
                             <div className="w-8 h-8 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-500">
                                <AlertCircle size={16} />
                             </div>
                             <div className="flex-1 truncate">
                                <p className="text-xs font-bold text-text-primary truncate">{item.producto_nombre}</p>
                                <p className="text-[10px] text-red-500 font-medium italic">Stock Crítico: {item.stock_actual}</p>
                             </div>
                          </Link>
                        ))
                      )}
                    </div>
                 </div>
               )}
            </div>

            <div className="flex items-center gap-3 md:gap-4 bg-white dark:bg-[#1C1C1E] p-1.5 px-3 md:p-2 md:px-4 rounded-apple-lg shadow-shadow-sm border border-border">
              {!isMobile && (
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold text-text-primary truncate max-w-[150px]">
                    {user?.nombre || 'Cargando...'}
                  </span>
                  <span className="text-[10px] text-text-muted uppercase tracking-widest font-black">
                    {user?.rol || '...'}
                  </span>
                </div>
              )}
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-apple-md bg-brand-soft flex items-center justify-center text-brand-primary font-black border border-brand-accent/20">
                {user?.nombre?.charAt(0) || '?'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>

      {isMobile && (
        <>
          <BottomNavBar onOpenMore={() => setIsMoreOpen(true)} />
          <MoreMenuSheet isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)} />
        </>
      )}
    </div>
  );
};

export default MainLayout;
