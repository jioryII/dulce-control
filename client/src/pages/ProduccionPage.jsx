import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { ClipboardList, Plus, Trash2, Calendar, Package } from 'lucide-react';
import toast from 'react-hot-toast';

const ProduccionPage = () => {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    producto_id: '',
    cantidad: '',
    observacion: ''
  });

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
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white dark:bg-bg-secondary rounded-apple-xl border border-dashed border-border p-8 text-center">
        <div className="w-20 h-20 bg-brand-soft rounded-full flex items-center justify-center text-brand-primary mb-6">
          <Calendar size={40} />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">No hay una jornada abierta</h2>
        <p className="text-text-secondary mb-8">Debes abrir la jornada desde el Dashboard para registrar producción.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Sidebar: Low Stock Alerts */}
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

      {/* Main Content: Production List */}
      <div className="lg:col-span-3 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <ClipboardList className="text-brand-primary" />
            Registro de Producción
          </h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Registrar Horneado
          </button>
        </div>

        <div className="bg-brand-soft/30 p-4 rounded-apple-xl border border-brand-soft flex items-center gap-4">
          <Calendar className="text-brand-primary" size={20} />
          <span className="text-brand-primary font-bold text-sm">
            Jornada activa: {new Date(jornada.fecha).toLocaleDateString()}
          </span>
        </div>

        {/* Produccion Table */}
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
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white dark:bg-bg-dark w-full max-w-md rounded-[32px] shadow-2xl z-10 overflow-hidden animate-in zoom-in fade-in duration-300 border border-border">
            <div className="p-6 border-b border-border flex justify-between items-center bg-bg-primary/30">
              <h3 className="text-xl font-bold text-text-primary">Registrar Producción</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-text-primary">
                <Trash2 size={24} />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); registrarMutation.mutate(formData); }} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">Producto</label>
                <select 
                  required
                  className="input-pastel w-full h-12"
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
                <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">Cantidad Horneada</label>
                <input 
                  type="number" 
                  required
                  className="input-pastel w-full h-12"
                  placeholder="0"
                  value={formData.cantidad}
                  onChange={(e) => setFormData({...formData, cantidad: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">Observación</label>
                <textarea 
                  className="input-pastel w-full h-24 resize-none"
                  placeholder="Opcional..."
                  value={formData.observacion}
                  onChange={(e) => setFormData({...formData, observacion: e.target.value})}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 rounded-apple-xl bg-bg-secondary text-text-primary font-bold">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 btn-primary py-3">
                  Registrar
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
