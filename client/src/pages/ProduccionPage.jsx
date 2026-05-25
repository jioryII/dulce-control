import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { ClipboardList, Plus, Trash2, Calendar, Package, AlertTriangle, Clock, X, Loader2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useIsMobile } from '../hooks/useIsMobile';

const ProduccionPage = () => {
  const isMobile = useIsMobile();
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    producto_id: '',
    cantidad: '',
    observacion: ''
  });

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

  const { data: producciones = [], isLoading } = useQuery({
    queryKey: ['produccion'],
    queryFn: async () => {
      const { data } = await api.get(`/produccion/${jornada.id}`);
      return data;
    },
    enabled: !!jornada?.id
  });

  const { data: productos = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await api.get('/productos');
      return data;
    }
  });

  // Obtener productos con stock bajo
  const { data: stockBajo = [] } = useQuery({
    queryKey: ['stock', 'bajo'],
    queryFn: async () => {
      const { data } = await api.get('/stock/bajo');
      return data;
    },
    refetchInterval: 30000
  });

  const registrarMutation = useMutation({
    mutationFn: (newProduccion) => api.post('/produccion', { ...newProduccion, jornada_id: jornada.id }),
    onSuccess: () => {
      queryClient.invalidateQueries(['produccion', 'stock', 'bajo', 'products']);
      toast.success('Producción registrada y stock actualizado');
      setIsModalOpen(false);
      setFormData({ producto_id: '', cantidad: '', observacion: '' });
    }
  });

  const eliminarMutation = useMutation({
    mutationFn: (id) => api.delete(`/produccion/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['produccion', 'stock', 'bajo', 'products']);
      toast.success('Registro eliminado');
    }
  });

  if (!jornada) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white dark:bg-[#1C1C1E] rounded-apple-xl border border-dashed border-border p-8 text-center animate-in fade-in duration-500">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-brand-soft rounded-full flex items-center justify-center text-brand-primary mb-6">
          <Calendar size={isMobile ? 32 : 40} />
        </div>
        <h2 className="text-xl md:text-2xl font-black text-text-primary mb-2">No hay una jornada abierta</h2>
        <p className="text-sm text-text-secondary mb-8">Debes abrir la jornada desde el Dashboard para registrar producción.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8 pb-20">
      {/* Mobile Stock Bajo Strip */}
      {isMobile && stockBajo.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[11px] font-black text-text-secondary uppercase tracking-[0.2em] px-1 flex items-center gap-2">
            <AlertTriangle size={12} className="text-orange-500" />
            Stock Crítico
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {stockBajo.map(item => (
              <div key={item.id} className="shrink-0 bg-white dark:bg-[#1C1C1E] p-3 px-4 rounded-apple-lg border border-orange-100 dark:border-orange-900/30 flex items-center gap-3 shadow-sm active:scale-95 transition-all">
                <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-500 font-black text-sm">
                  {item.stock_actual}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-text-primary whitespace-nowrap">{item.producto_nombre}</span>
                  <span className="text-[9px] text-text-muted uppercase tracking-wider">{item.categoria}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Sidebar: Low Stock Alerts */}
        {!isMobile && (
          <div className="lg:col-span-1 space-y-6">
            <div className="card-apple h-fit">
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest mb-6 flex items-center gap-2">
                <Package size={16} className="text-brand-accent" />
                Stock Crítico
              </h3>
              
              <div className="space-y-3">
                {stockBajo.length === 0 ? (
                  <p className="text-xs text-text-muted italic bg-bg-primary dark:bg-bg-dark p-4 rounded-apple-lg border border-dashed border-border">
                    Todo el stock está en niveles normales.
                  </p>
                ) : stockBajo.map(item => (
                  <div key={item.id} className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-apple-lg flex justify-between items-center group hover:bg-red-100 transition-colors">
                    <div>
                      <p className="text-xs font-bold text-red-700 dark:text-red-400">{item.producto_nombre}</p>
                      <p className="text-[10px] text-red-500 font-medium uppercase tracking-tighter">{item.categoria}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-red-600 dark:text-red-500">{item.stock_actual}</p>
                      <p className="text-[8px] text-red-400 font-bold uppercase">unid.</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-[10px] text-text-muted leading-relaxed">
                  * Los productos con 5 unidades o menos aparecen aquí para priorizar su horneado.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content: Production List */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl md:text-2xl font-black text-text-primary flex items-center gap-2">
              <ClipboardList className="text-brand-primary" size={isMobile ? 24 : 28} />
              Producción
            </h2>
            {!isMobile && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={20} />
                Registrar Horneado
              </button>
            )}
          </div>

          <div className="bg-brand-soft/30 p-4 rounded-apple-xl border border-brand-soft/50 flex items-center gap-4 animate-in slide-in-from-left duration-500">
            <div className="w-10 h-10 bg-white dark:bg-[#1C1C1E] rounded-apple-lg flex items-center justify-center text-brand-primary shadow-sm border border-brand-soft">
              <Calendar size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-brand-primary font-black uppercase tracking-widest">Jornada Activa</span>
              <span className="text-brand-primary font-bold text-sm">
                {new Date(jornada.fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </div>
          </div>

          {/* Produccion Table/Cards */}
          {isMobile ? (
            <div className="grid grid-cols-1 gap-3">
              {isLoading ? (
                <div className="text-center py-20 text-text-muted">
                  <Loader2 size={32} className="animate-spin mx-auto mb-2" />
                  <p className="text-sm font-bold uppercase tracking-widest">Cargando...</p>
                </div>
              ) : producciones.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-[#1C1C1E] rounded-apple-xl border border-dashed border-border opacity-60">
                  <ClipboardList size={48} className="mx-auto mb-4 text-text-muted" />
                  <p className="text-sm font-bold uppercase tracking-widest text-text-muted">Sin registros para hoy</p>
                </div>
              ) : producciones.map((p) => (
                <div key={p.id} className="bg-white dark:bg-[#1C1C1E] p-4 rounded-apple-xl border border-border shadow-sm flex flex-col gap-4 animate-in slide-in-from-bottom duration-300">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-bg-primary dark:bg-bg-dark rounded-apple-lg flex items-center justify-center text-brand-primary border border-border">
                        <Package size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-text-primary">{p.producto_nombre}</span>
                        <span className="text-[11px] text-text-muted flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        if(confirm('¿Eliminar este registro?')) eliminarMutation.mutate(p.id);
                      }}
                      className="p-2 text-text-muted active:text-red-500"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-text-muted font-black uppercase tracking-widest">Observación</span>
                      <span className="text-xs text-text-secondary italic">{p.observacion || 'Sin notas'}</span>
                    </div>
                    <div className="bg-brand-soft text-brand-primary px-4 py-2 rounded-apple-lg text-sm font-black border border-brand-accent/20">
                      +{p.cantidad} uds
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1C1C1E] rounded-apple-xl shadow-shadow-sm border border-border overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bg-secondary dark:bg-bg-dark text-text-secondary text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Producto</th>
                    <th className="px-6 py-4">Cantidad</th>
                    <th className="px-6 py-4">Observación</th>
                    <th className="px-6 py-4">Hora</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    <tr><td colSpan="5" className="text-center py-10 text-text-muted">Cargando producción...</td></tr>
                  ) : producciones.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-10 text-text-muted">Aún no se ha registrado producción para hoy.</td></tr>
                  ) : producciones.map((p) => (
                    <tr key={p.id} className="hover:bg-bg-primary/50 dark:hover:bg-bg-dark/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-text-primary">{p.producto_nombre}</td>
                      <td className="px-6 py-4">
                        <span className="bg-pastel-orange dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 px-3 py-1 rounded-full text-xs font-bold">
                          +{p.cantidad} unidades
                        </span>
                      </td>
                      <td className="px-6 py-4 text-text-secondary text-sm italic">
                        {p.observacion || '-'}
                      </td>
                      <td className="px-6 py-4 text-xs text-text-muted">
                        {new Date(p.created_at).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => {
                            if(confirm('¿Eliminar este registro? El stock será revertido.')) eliminarMutation.mutate(p.id);
                          }}
                          className="p-2 text-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-apple-md transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* FAB for Mobile */}
      {isMobile && (
        <button 
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-24 right-6 w-16 h-16 bg-brand-primary text-white rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-95 transition-all animate-in slide-in-from-bottom-10 duration-500"
        >
          <Plus size={32} />
        </button>
      )}

      {/* Modal / Bottom Sheet */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className={`bg-white dark:bg-[#1C1C1E] w-full max-w-md rounded-t-[32px] md:rounded-[32px] shadow-2xl z-10 overflow-hidden animate-in ${isMobile ? 'slide-in-from-bottom' : 'zoom-in'} duration-300 border-t md:border border-border flex flex-col max-h-[90vh]`}>
            {isMobile && <div className="w-12 h-1.5 bg-border dark:bg-[#3A3A3C] rounded-full mx-auto mt-4" />}
            
            <div className="p-6 border-b border-border flex justify-between items-center bg-bg-primary/30">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-brand-soft rounded-apple-lg flex items-center justify-center text-brand-primary">
                    <Plus size={20} />
                 </div>
                 <h3 className="text-xl font-bold text-text-primary tracking-tight">Registrar Horneado</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-bg-primary dark:bg-bg-dark rounded-full flex items-center justify-center text-text-muted">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); registrarMutation.mutate(formData); }} className="p-6 md:p-8 space-y-6 overflow-y-auto pb-[calc(24px+env(safe-area-inset-bottom))]">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-text-secondary uppercase tracking-[0.15em] px-1">Producto a Hornear</label>
                  <select 
                    required
                    className="input-pastel w-full h-12 md:h-10 text-base"
                    value={formData.producto_id}
                    onChange={(e) => setFormData({...formData, producto_id: e.target.value})}
                  >
                    <option value="">Selecciona un producto...</option>
                    {productos.map(p => {
                      const isLow = stockBajo.some(s => s.producto_id === p.id);
                      return (
                        <option key={p.id} value={p.id}>
                          {isLow ? `⚠️ ${p.nombre} (Stock Bajo)` : p.nombre}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-text-secondary uppercase tracking-[0.15em] px-1">Cantidad Horneada</label>
                  <input 
                    type="number" 
                    inputMode="numeric"
                    required
                    className="input-pastel w-full h-12 md:h-10 text-base"
                    placeholder="Ej: 24"
                    value={formData.cantidad}
                    onChange={(e) => setFormData({...formData, cantidad: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-text-secondary uppercase tracking-[0.15em] px-1">Observación (Opcional)</label>
                  <textarea 
                    className="input-pastel w-full h-24 md:h-20 text-base resize-none"
                    placeholder="Ej: Salieron más dorados..."
                    value={formData.observacion}
                    onChange={(e) => setFormData({...formData, observacion: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4 flex flex-col md:flex-row gap-3">
                <button 
                  type="submit" 
                  disabled={registrarMutation.isPending}
                  className="w-full btn-primary h-14 font-black text-lg order-1 md:order-2 flex items-center justify-center gap-2"
                >
                  {registrarMutation.isPending ? <Loader2 className="animate-spin" /> : (
                    <>
                      <Check size={20} />
                      Registrar
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="w-full h-14 rounded-apple-xl bg-bg-secondary dark:bg-bg-dark text-text-primary font-bold order-2 md:order-1 transition-all active:scale-95"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProduccionPage;
