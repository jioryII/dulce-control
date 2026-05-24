import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { Package, Search, AlertTriangle, Calendar, RefreshCcw, Loader2 } from 'lucide-react';
import { useIsMobile } from '../hooks/useIsMobile';

const StockPage = () => {
  const isMobile = useIsMobile();
  const { token } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');

  const api = axios.create({
    baseURL: '/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  const { data: jornada } = useQuery({
    queryKey: ['jornada-hoy'],
    queryFn: async () => {
      const { data } = await api.get('/jornada/hoy');
      return data;
    }
  });

  const { data: stock = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['stock-diario', jornada?.id],
    queryFn: async () => {
      if (!jornada?.id) return [];
      const { data } = await api.get(`/stock/${jornada.id}`);
      return data;
    },
    enabled: !!jornada?.id
  });

  const filteredStock = stock.filter(s => 
    s.producto_nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!jornada) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white dark:bg-[#1C1C1E] rounded-apple-xl border border-dashed border-border p-8 text-center animate-in fade-in duration-500">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-brand-soft rounded-full flex items-center justify-center text-brand-primary mb-6">
          <Calendar size={isMobile ? 32 : 40} />
        </div>
        <h2 className="text-xl md:text-2xl font-black text-text-primary mb-2 tracking-tight">No hay una jornada activa</h2>
        <p className="text-sm text-text-secondary max-w-xs md:max-w-md font-medium">
          El stock se calcula por jornada. Abre la jornada de hoy para ver las existencias actuales en vitrina.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl md:text-2xl font-black text-text-primary flex items-center gap-2">
          <Package className="text-brand-primary" size={isMobile ? 24 : 28} />
          {isMobile ? 'Stock Vitrina' : 'Stock en Vitrina'}
        </h2>
        <button 
          onClick={() => refetch()}
          disabled={isRefetching}
          className="bg-white dark:bg-[#1C1C1E] border border-border text-text-secondary px-4 h-10 md:h-11 rounded-apple-lg text-xs md:text-sm font-black flex items-center gap-2 hover:bg-bg-primary active:scale-95 transition-all shadow-sm"
        >
          {isRefetching ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
          {!isMobile && 'Actualizar'}
        </button>
      </div>

      <div className="bg-white dark:bg-[#1C1C1E] p-1.5 md:p-4 rounded-apple-xl shadow-sm border border-border flex items-center gap-4 sticky top-0 md:static z-20">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input 
            type="text" 
            placeholder={isMobile ? "Buscar..." : "Filtrar por nombre de producto..."}
            className="input-pastel w-full pl-12 h-12 md:h-11 text-base md:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 text-center">
            <Loader2 size={32} className="animate-spin mx-auto mb-4 text-brand-primary" />
            <p className="text-xs font-black uppercase tracking-widest text-text-muted">Cargando inventario...</p>
          </div>
        ) : filteredStock.length === 0 ? (
          <div className="col-span-full bg-brand-soft/20 dark:bg-brand-soft/5 p-10 rounded-apple-xl border border-dashed border-brand-accent/30 text-center">
             <AlertTriangle className="mx-auto text-brand-accent mb-4" size={48} />
             <p className="text-text-primary font-black uppercase tracking-tight">Sin stock hoy</p>
             <p className="text-text-secondary text-xs mt-1">Registra producción para ver existencias.</p>
          </div>
        ) : filteredStock.map((item) => (
          <div key={item.id} className="card-apple p-4 md:p-6 flex flex-col justify-between group active:scale-[0.98] transition-all relative overflow-hidden">
            <div>
              <div className="flex justify-between items-start mb-3 md:mb-4">
                <span className="bg-pastel-cyan dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-400 text-[8px] md:text-[10px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-full border border-cyan-100 dark:border-cyan-900/20">
                  {item.categoria}
                </span>
                {item.stock_actual <= 5 && (
                  <div className="flex items-center gap-1 text-[8px] md:text-[10px] font-black text-red-500 bg-red-50 dark:bg-red-900/10 px-1.5 rounded-full border border-red-100 animate-pulse">
                    <AlertTriangle size={10} />
                  </div>
                )}
              </div>
              <h3 className="font-black text-text-primary text-xs md:text-base leading-tight md:mb-2 line-clamp-2">{item.producto_nombre}</h3>
            </div>

            <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-border/50">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[8px] md:text-[10px] font-black text-text-muted uppercase tracking-widest">En Vitrina</span>
                  <span className={`text-2xl md:text-3xl font-black tracking-tighter ${
                    item.stock_actual <= 0 ? 'text-red-500' : item.stock_actual <= 5 ? 'text-orange-500' : 'text-text-primary'
                  }`}>
                    {item.stock_actual}
                  </span>
                </div>
                <div className="text-right flex flex-col">
                  <span className="text-[8px] md:text-[10px] font-black text-text-muted uppercase tracking-widest">Total</span>
                  <span className="text-xs md:text-sm font-bold text-text-secondary font-mono">{item.stock_inicial}</span>
                </div>
              </div>
              
              <div className="w-full bg-bg-secondary dark:bg-bg-dark h-1 md:h-1.5 rounded-full mt-2 md:mt-3 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    item.stock_actual <= 0 ? 'w-0' : item.stock_actual <= 5 ? 'bg-orange-500' : 'bg-brand-primary'
                  }`}
                  style={{ width: `${Math.min(100, (item.stock_actual / (item.stock_inicial || 1)) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StockPage;
