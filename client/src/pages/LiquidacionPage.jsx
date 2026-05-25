import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { 
  ClipboardCheck, Truck, Clock, DollarSign, 
  Search, Calendar, Loader2, CheckCircle2, 
  AlertCircle, ArrowRight, Save, X 
} from 'lucide-react';
import toast from 'react-hot-toast';

const LiquidacionPage = () => {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedEnvio, setSelectedEnvio] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    hora_llegada: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    total_vendido: '',
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

  const { data: enviosActivos = [], isLoading } = useQuery({
    queryKey: ['envios-activos', jornada?.id],
    queryFn: async () => {
      const { data } = await api.get(`/vehiculos/envios/activos/${jornada.id}`);
      return data;
    },
    enabled: !!jornada?.id
  });

  const liquidarMutation = useMutation({
    mutationFn: (data) => api.post('/vehiculos/liquidaciones', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['envios-activos', 'dashboard-stats']);
      toast.success('Liquidación registrada correctamente');
      setIsModalOpen(false);
      setSelectedEnvio(null);
      setFormData({ 
        hora_llegada: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }), 
        total_vendido: '', 
        observacion: '' 
      });
    },
    onError: () => toast.error('Error al registrar la liquidación')
  });

  const handleOpenLiquidar = (envio) => {
    setSelectedEnvio(envio);
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    liquidarMutation.mutate({
      envio_id: selectedEnvio.id,
      ...formData
    });
  };

  if (!jornada) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white rounded-apple-xl border border-dashed border-border p-8 text-center">
        <div className="w-20 h-20 bg-brand-soft rounded-full flex items-center justify-center text-brand-primary mb-6">
          <Calendar size={40} />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">No hay una jornada abierta</h2>
        <p className="text-text-secondary mb-8">Debes abrir la jornada para gestionar liquidaciones.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-text-primary tracking-tight flex items-center gap-3">
          <div className="p-2 bg-brand-primary/10 rounded-apple-lg">
            <ClipboardCheck className="text-brand-primary" size={28} />
          </div>
          Liquidación de Repartidores
        </h2>
        <p className="text-text-muted text-sm font-medium">Gestiona el retorno de vehículos y el cuadre de ventas externas.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="card-apple">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Truck size={20} className="text-brand-primary" />
              Vehículos en Ruta ({enviosActivos.length})
            </h3>
            <div className="bg-orange-50 text-orange-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100 flex items-center gap-2">
               <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
               Enviados hoy
            </div>
          </div>

          {isLoading ? (
            <div className="py-20 flex justify-center">
               <Loader2 className="animate-spin text-brand-primary" size={40} />
            </div>
          ) : enviosActivos.length === 0 ? (
            <div className="py-20 text-center bg-bg-primary/30 rounded-apple-xl border-2 border-dashed border-border">
               <CheckCircle2 size={48} className="mx-auto text-green-500 opacity-20 mb-4" />
               <p className="text-text-muted font-medium">No hay envíos pendientes de liquidación.</p>
               <p className="text-[10px] text-text-muted uppercase mt-1 font-bold">Todo en orden</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enviosActivos.map((envio) => (
                <div key={envio.id} className="p-6 bg-white rounded-apple-xl border border-border shadow-shadow-sm hover:border-brand-primary transition-all group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-brand-soft rounded-apple-lg flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform">
                       <Truck size={24} />
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Salida</p>
                       <p className="text-sm font-bold text-text-primary">{envio.hora_salida}</p>
                    </div>
                  </div>
                  
                  <h4 className="text-lg font-bold text-text-primary mb-1">{envio.vehiculo_nombre}</h4>
                  <p className="text-xs font-bold text-brand-primary uppercase tracking-widest bg-brand-soft px-3 py-1 rounded-full w-fit mb-6">
                    {envio.placa}
                  </p>
                  
                  <button 
                    onClick={() => handleOpenLiquidar(envio)}
                    className="w-full py-4 bg-bg-secondary text-text-primary font-bold rounded-apple-xl flex items-center justify-center gap-2 hover:bg-brand-primary hover:text-white transition-all group/btn"
                  >
                    Liquidar Ventas
                    <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Liquidation Modal */}
      {isModalOpen && selectedEnvio && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white w-full max-w-[420px] rounded-[40px] shadow-2xl z-10 overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-border flex justify-between items-center bg-bg-primary/30">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-brand-soft rounded-apple-lg flex items-center justify-center text-brand-primary">
                    <DollarSign size={24} />
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-text-primary tracking-tight">Liquidar Envío</h3>
                    <p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">{selectedEnvio.vehiculo_nombre}</p>
                 </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-text-primary">
                <X size={28} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-6">
               <div className="bg-orange-50 p-4 rounded-apple-xl border border-orange-100 flex gap-3">
                  <AlertCircle className="text-orange-500 shrink-0" size={20} />
                  <p className="text-xs text-orange-700 font-medium">
                    Registra el total de dinero recaudado por el repartidor tras su jornada de venta externa.
                  </p>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-text-muted uppercase tracking-widest px-1">Hora Retorno</label>
                    <div className="relative">
                       <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                       <input 
                         type="time" 
                         required
                         className="input-pastel w-full pl-10"
                         value={formData.hora_llegada}
                         onChange={(e) => setFormData({...formData, hora_llegada: e.target.value})}
                       />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-text-muted uppercase tracking-widest px-1">Monto Recaudado</label>
                    <div className="relative">
                       <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                       <input 
                         type="number" 
                         step="0.01"
                         required
                         className="input-pastel w-full pl-10"
                         placeholder="0.00"
                         value={formData.total_vendido}
                         onChange={(e) => setFormData({...formData, total_vendido: e.target.value})}
                       />
                    </div>
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-black text-text-muted uppercase tracking-widest px-1">Observación (Opcional)</label>
                  <textarea 
                    className="input-pastel w-full h-24 py-3 resize-none"
                    placeholder="Ej: Vendió todo, sobraron 2 panes..."
                    value={formData.observacion}
                    onChange={(e) => setFormData({...formData, observacion: e.target.value})}
                  />
               </div>

               <button 
                 type="submit" 
                 disabled={liquidarMutation.isPending}
                 className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-3 shadow-xl shadow-brand-primary/20"
               >
                 {liquidarMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                 Confirmar Liquidación
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiquidacionPage;
