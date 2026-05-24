import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { Package, Search, AlertTriangle, Calendar, RefreshCcw } from 'lucide-react';

const StockPage = () => {
  const { token } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');

  const api = axios.create({
    baseURL: 'http://localhost:3001/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  const { data: jornada } = useQuery({
    queryKey: ['jornada-hoy'],
    queryFn: async () => {
      const { data } = await api.get('/jornada/hoy');
      return data;
    }
  });

  const { data: stock = [], isLoading, refetch } = useQuery({
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white rounded-apple-xl border border-dashed border-border p-8 text-center">
        <div className="w-20 h-20 bg-brand-soft rounded-full flex items-center justify-center text-brand-primary mb-6">
          <Calendar size={40} />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">No hay una jornada activa</h2>
        <p className="text-text-secondary max-w-md">
          El stock se calcula por jornada. Abre la jornada de hoy para ver las existencias actuales en vitrina.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Package className="text-brand-primary" />
          Stock en Vitrina
        </h2>
        <button 
          onClick={() => refetch()}
          className="bg-white border border-border text-text-secondary px-4 py-2 rounded-apple-lg text-sm font-bold flex items-center gap-2 hover:bg-bg-primary transition-all"
        >
          <RefreshCcw size={16} />
          Actualizar
        </button>
      </div>

      <div className="bg-white p-4 rounded-apple-xl shadow-shadow-sm border border-border flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input 
            type="text" 
            placeholder="Filtrar por nombre de producto..." 
            className="input-pastel w-full pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          <p className="col-span-full text-center py-10 text-text-muted">Cargando inventario...</p>
        ) : filteredStock.length === 0 ? (
          <div className="col-span-full bg-brand-soft/20 p-10 rounded-apple-xl border border-dashed border-brand-accent/20 text-center">
             <AlertTriangle className="mx-auto text-brand-accent mb-4" size={48} />
             <p className="text-text-primary font-bold">No hay stock registrado hoy</p>
             <p className="text-text-secondary text-sm">Registra la producción de hoy para que aparezcan aquí.</p>
          </div>
        ) : filteredStock.map((item) => (
          <div key={item.id} className="card-apple flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="bg-pastel-cyan text-cyan-800 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">
                  {item.categoria}
                </span>
                {item.stock_actual <= 5 && (
                  <span className="flex items-center gap-1 text-[10px] font-black text-red-500 animate-pulse">
                    <AlertTriangle size={12} /> STOCK BAJO
                  </span>
                )}
              </div>
              <h3 className="font-bold text-text-primary leading-tight mb-2">{item.producto_nombre}</h3>
            </div>

            <div className="mt-6 pt-4 border-t border-bg-primary">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">Disponible</span>
                  <span className={`text-3xl font-black tracking-tighter ${
                    item.stock_actual <= 0 ? 'text-red-400' : 'text-text-primary'
                  }`}>
                    {item.stock_actual}
                  </span>
                </div>
                <div className="text-right flex flex-col">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">Inicial</span>
                  <span className="text-sm font-bold text-text-secondary">{item.stock_inicial}</span>
                </div>
              </div>
              
              <div className="w-full bg-bg-secondary h-1.5 rounded-full mt-3 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    item.stock_actual <= 5 ? 'bg-red-400' : 'bg-brand-primary'
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
