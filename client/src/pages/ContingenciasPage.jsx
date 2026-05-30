import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { AlertOctagon, Plus, Trash2, Loader2, Calendar, Search, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useIsMobile } from '../hooks/useIsMobile';

const ContingenciasPage = () => {
  const isMobile = useIsMobile();
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    producto_id: '',
    cantidad: '',
    motivo: 'merma',
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

  const { data: productos = [] } = useQuery({
    queryKey: ['productos'],
    queryFn: async () => {
      const { data } = await api.get('/productos');
      return data;
    }
  });

  const { data: contingencias = [], isLoading } = useQuery({
    queryKey: ['contingencias', jornada?.id],
    queryFn: async () => {
      const { data } = await api.get(`/contingencias?jornada_id=${jornada.id}`);
      return data;
    },
    enabled: !!jornada?.id
  });

  const registrarMutation = useMutation({
    mutationFn: (data) => api.post('/contingencias', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contingencias'] });
      queryClient.invalidateQueries({ queryKey: ['stock-diario'] });
      toast.success('Contingencia registrada');
      setIsModalOpen(false);
      setFormData({ producto_id: '', cantidad: '', motivo: 'merma', observacion: '' });
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Error al registrar contingencia')
  });

  const eliminarMutation = useMutation({
    mutationFn: (id) => api.delete(`/contingencias/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contingencias'] });
      queryClient.invalidateQueries({ queryKey: ['stock-diario'] });
      toast.success('Contingencia eliminada');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Error al eliminar')
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    registrarMutation.mutate({
      jornada_id: jornada.id,
      ...formData,
      cantidad: parseInt(formData.cantidad, 10)
    });
  };

  const filteredContingencias = contingencias.filter(c => 
    c.producto_nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!jornada) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white rounded-apple-xl border border-dashed border-border p-8 text-center">
        <div className="w-20 h-20 bg-brand-soft rounded-full flex items-center justify-center text-brand-primary mb-6">
          <Calendar size={40} />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">No hay una jornada abierta</h2>
        <p className="text-text-secondary mb-8">Debes abrir la jornada para gestionar mermas y daños.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-black text-text-primary tracking-tight flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-apple-lg">
              <AlertOctagon className="text-red-500" size={28} />
            </div>
            Contingencias
          </h2>
          <p className="text-text-muted text-sm font-medium">Registra mermas, productos dañados o errores de inventario.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary h-12 px-6 flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20"
        >
          <Plus size={20} />
          Registrar Contingencia
        </button>
      </div>

      <div className="card-apple">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
           <div className="relative w-full md:w-96">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
             <input 
               type="text" 
               placeholder="Buscar registro..." 
               className="input-pastel w-full pl-10"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
           <div className="flex gap-2">
             <span className="px-3 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-full border border-red-100">
               Mermas y Daños
             </span>
           </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="animate-spin text-brand-primary" size={40} />
          </div>
        ) : filteredContingencias.length === 0 ? (
          <div className="py-20 text-center bg-bg-primary/30 rounded-apple-xl border-2 border-dashed border-border">
            <p className="text-text-muted font-medium">No hay registros de contingencias en esta jornada.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-border text-text-muted font-bold uppercase text-[10px] tracking-widest">
                  <th className="p-4 rounded-tl-xl">Hora</th>
                  <th className="p-4">Producto</th>
                  <th className="p-4">Motivo</th>
                  <th className="p-4 text-center">Cantidad</th>
                  <th className="p-4">Observación</th>
                  <th className="p-4 text-center rounded-tr-xl">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredContingencias.map((c) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-bg-primary/50 transition-colors group">
                    <td className="p-4 text-text-secondary font-mono text-xs">
                      {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4 font-bold text-text-primary">
                      {c.producto_nombre}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        c.motivo === 'merma' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {c.motivo}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-black text-red-500 bg-red-50 px-2 py-1 rounded-lg">-{c.cantidad}</span>
                    </td>
                    <td className="p-4 text-text-secondary max-w-[200px] truncate">
                      {c.observacion || '-'}
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => {
                          if (window.confirm('¿Eliminar registro y devolver producto al stock?')) {
                            eliminarMutation.mutate(c.id);
                          }
                        }}
                        className="p-2 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Eliminar registro"
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

      {isModalOpen && (
        <div className="fixed inset-0 z-[3000] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className={`bg-white dark:bg-[#1C1C1E] w-full max-w-[420px] rounded-t-[32px] md:rounded-[32px] shadow-2xl z-10 overflow-hidden animate-in ${isMobile ? 'slide-in-from-bottom' : 'zoom-in'} duration-300 border-t md:border border-border flex flex-col`}>
            {isMobile && <div className="w-12 h-1.5 bg-border dark:bg-[#3A3A3C] rounded-full mx-auto mt-4" />}
            
            <div className="p-6 border-b border-border flex justify-between items-center bg-bg-primary/30">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-red-100 rounded-apple-lg flex items-center justify-center text-red-500">
                    <AlertOctagon size={20} />
                 </div>
                 <h3 className="text-xl font-bold text-text-primary tracking-tight">Registrar Baja</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-bg-primary dark:bg-bg-dark rounded-full flex items-center justify-center text-text-muted">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-text-secondary uppercase tracking-[0.15em] px-1">Producto</label>
                <select 
                  required
                  className="input-pastel w-full h-12"
                  value={formData.producto_id}
                  onChange={(e) => setFormData({...formData, producto_id: e.target.value})}
                >
                  <option value="">Seleccione un producto</option>
                  {productos.filter(p => p.stock_actual > 0).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} (Stock: {p.stock_actual})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-text-secondary uppercase tracking-[0.15em] px-1">Cantidad</label>
                  <input 
                    type="number" 
                    min="1"
                    required
                    className="input-pastel w-full h-12 font-mono font-bold"
                    value={formData.cantidad}
                    onChange={(e) => setFormData({...formData, cantidad: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-text-secondary uppercase tracking-[0.15em] px-1">Motivo</label>
                  <select 
                    className="input-pastel w-full h-12 appearance-none"
                    value={formData.motivo}
                    onChange={(e) => setFormData({...formData, motivo: e.target.value})}
                  >
                    <option value="merma">Merma</option>
                    <option value="daño">Dañado</option>
                    <option value="consumo">Consumo Interno</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-text-secondary uppercase tracking-[0.15em] px-1">Observación</label>
                <textarea 
                  required
                  className="input-pastel w-full h-20 py-2 resize-none text-sm"
                  placeholder="Detalle la razón..."
                  value={formData.observacion}
                  onChange={(e) => setFormData({...formData, observacion: e.target.value})}
                />
              </div>

              <button 
                type="submit" 
                disabled={registrarMutation.isPending}
                className="w-full btn-primary py-4 text-base font-bold shadow-xl shadow-brand-primary/20 flex items-center justify-center gap-2 mt-2 bg-red-500 hover:bg-red-600 border-none text-white"
              >
                {registrarMutation.isPending ? <Loader2 className="animate-spin" /> : (
                  <>
                    <Check size={18} />
                    Confirmar Baja
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContingenciasPage;
