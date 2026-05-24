import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { Truck, Plus, Search, Edit2, Trash2, X, User, CreditCard, History, Calendar as CalendarIcon, Clock, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const VehiculosPage = () => {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [editingVehiculo, setEditingVehiculo] = useState(null);
  const [selectedVehiculo, setSelectedVehiculo] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '',
    placa: '',
    responsable: ''
  });

  const api = axios.create({
    baseURL: 'http://localhost:3001/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  const { data: vehiculos = [], isLoading } = useQuery({
    queryKey: ['vehiculos'],
    queryFn: async () => {
      const { data } = await api.get('/vehiculos');
      return data;
    }
  });

  const { data: historial = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['vehiculo-historial', selectedVehiculo?.id],
    queryFn: async () => {
      const { data } = await api.get(`/vehiculos/${selectedVehiculo.id}/historial`);
      return data;
    },
    enabled: !!selectedVehiculo && isHistoryModalOpen
  });

  const mutation = useMutation({
    mutationFn: (data) => {
      if (editingVehiculo) {
        return api.put(`/vehiculos/${editingVehiculo.id}`, data);
      }
      return api.post('/vehiculos', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['vehiculos']);
      toast.success(editingVehiculo ? 'Vehículo actualizado' : 'Vehículo registrado');
      closeModal();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/vehiculos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['vehiculos']);
      toast.success('Vehículo eliminado');
    }
  });

  const openModal = (vehiculo = null) => {
    if (vehiculo) {
      setEditingVehiculo(vehiculo);
      setFormData({
        nombre: vehiculo.nombre,
        placa: vehiculo.placa || '',
        responsable: vehiculo.responsable || ''
      });
    } else {
      setEditingVehiculo(null);
      setFormData({
        nombre: '',
        placa: '',
        responsable: ''
      });
    }
    setIsModalOpen(true);
  };

  const openHistory = (vehiculo) => {
    setSelectedVehiculo(vehiculo);
    setIsHistoryModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingVehiculo(null);
  };

  const closeHistory = () => {
    setIsHistoryModalOpen(false);
    setSelectedVehiculo(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const filteredVehiculos = vehiculos.filter(v => 
    v.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.placa?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Truck className="text-brand-primary" />
          Flota de Vehículos
        </h2>
        <button 
          onClick={() => openModal()}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Registrar Vehículo
        </button>
      </div>

      <div className="bg-white p-4 rounded-apple-xl shadow-shadow-sm border border-border flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o placa..." 
            className="input-pastel w-full pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <p className="col-span-full text-center py-10 text-text-muted">Cargando flota...</p>
        ) : filteredVehiculos.length === 0 ? (
          <p className="col-span-full text-center py-10 text-text-muted">No hay vehículos registrados.</p>
        ) : filteredVehiculos.map((vehiculo) => (
          <div key={vehiculo.id} className="card-apple group hover:border-brand-primary transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openModal(vehiculo)} className="p-2 bg-white shadow-sm rounded-full text-text-muted hover:text-brand-primary border border-border">
                  <Edit2 size={14} />
                </button>
                <button 
                  onClick={() => {
                    if(confirm('¿Eliminar vehículo?')) deleteMutation.mutate(vehiculo.id);
                  }}
                  className="p-2 bg-white shadow-sm rounded-full text-text-muted hover:text-red-500 border border-border"
                >
                  <Trash2 size={14} />
                </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-brand-soft rounded-[20px] flex items-center justify-center text-brand-primary">
                <Truck size={32} />
              </div>
              <div>
                <h3 className="font-bold text-text-primary text-lg leading-tight">{vehiculo.nombre}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                   <span className="w-2 h-2 bg-green-500 rounded-full" />
                   <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Activo</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3 bg-bg-primary/50 p-4 rounded-apple-lg border border-bg-secondary">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-text-secondary">
                  <CreditCard size={14} className="text-text-muted" />
                  <span className="font-medium">Placa:</span>
                </div>
                <span className="font-mono font-bold text-text-primary bg-white px-2 py-0.5 rounded border border-border shadow-sm">
                  {vehiculo.placa || '---'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-text-secondary">
                  <User size={14} className="text-text-muted" />
                  <span className="font-medium">Responsable:</span>
                </div>
                <span className="text-text-primary font-bold">
                  {vehiculo.responsable || 'No asignado'}
                </span>
              </div>
            </div>

            <button 
              onClick={() => openHistory(vehiculo)}
              className="w-full mt-4 py-2 text-xs font-bold text-brand-primary hover:bg-brand-soft rounded-apple-md transition-colors border border-transparent hover:border-brand-accent/20 flex items-center justify-center gap-2"
            >
              <History size={14} />
              Ver Historial de Salidas →
            </button>
          </div>
        ))}
      </div>

      {/* Modal Vehiculo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={closeModal} />
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl z-10 overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 border-b border-border flex justify-between items-center bg-bg-primary/30">
              <h3 className="text-xl font-bold text-text-primary">
                {editingVehiculo ? 'Editar Vehículo' : 'Nuevo Vehículo'}
              </h3>
              <button onClick={closeModal} className="text-text-muted hover:text-text-primary">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-secondary uppercase tracking-wider px-1">Nombre / Identificador</label>
                <input 
                  type="text" 
                  required
                  className="input-pastel w-full h-12"
                  placeholder="Ej: Carro 01, Furgoneta Blanca..."
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-secondary uppercase tracking-wider px-1">Nº Placa</label>
                  <input 
                    type="text" 
                    className="input-pastel w-full h-12"
                    placeholder="ABC-123"
                    value={formData.placa}
                    onChange={(e) => setFormData({...formData, placa: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-secondary uppercase tracking-wider px-1">Responsable</label>
                  <input 
                    type="text" 
                    className="input-pastel w-full h-12"
                    placeholder="Nombre del chofer..."
                    value={formData.responsable}
                    onChange={(e) => setFormData({...formData, responsable: e.target.value})}
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-4 rounded-apple-xl bg-bg-secondary text-text-primary font-bold">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 btn-primary py-4">
                  {editingVehiculo ? 'Guardar Cambios' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={closeHistory} />
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl z-10 overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-border flex justify-between items-center bg-bg-primary/30">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-brand-soft rounded-apple-lg flex items-center justify-center text-brand-primary">
                    <History size={24} />
                 </div>
                 <div>
                    <h3 className="text-2xl font-black text-text-primary tracking-tight">Historial de Salidas</h3>
                    <p className="text-xs font-bold text-brand-primary uppercase tracking-widest">{selectedVehiculo?.nombre} • {selectedVehiculo?.placa}</p>
                 </div>
              </div>
              <button onClick={closeHistory} className="text-text-muted hover:text-text-primary transition-colors">
                <X size={28} />
              </button>
            </div>

            <div className="p-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {isLoadingHistory ? (
                <div className="py-20 flex justify-center">
                  <Loader2 className="animate-spin text-brand-primary" size={40} />
                </div>
              ) : historial.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                   <Truck size={48} className="mx-auto text-text-muted opacity-20" />
                   <p className="text-text-muted font-medium">Este vehículo aún no registra movimientos.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {historial.map((mov, i) => (
                    <div key={mov.id} className="relative pl-8 border-l-2 border-border pb-6 last:pb-0">
                       <div className={`absolute left-[-9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                         mov.estado === 'liquidado' ? 'bg-green-500' : 'bg-orange-500 animate-pulse'
                       }`} />
                       
                       <div className="bg-white rounded-apple-xl border border-border p-5 shadow-shadow-sm hover:border-brand-accent/50 transition-all">
                          <div className="flex justify-between items-start mb-4">
                             <div>
                                <div className="flex items-center gap-2 text-text-primary font-bold">
                                   <CalendarIcon size={14} className="text-text-muted" />
                                   {new Date(mov.fecha).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-text-muted font-black uppercase tracking-wider mt-1">
                                   <Clock size={12} />
                                   Salida: {mov.hora_salida}
                                </div>
                             </div>
                             <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                               mov.estado === 'liquidado' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                             }`}>
                                {mov.estado}
                             </span>
                          </div>
                          
                          {mov.estado === 'liquidado' ? (
                            <div className="flex items-center justify-between p-3 bg-bg-primary rounded-apple-lg">
                               <div className="flex items-center gap-2 text-xs font-bold text-text-secondary">
                                  <CheckCircle2 size={14} className="text-green-500" />
                                  Liquidado a las {mov.hora_llegada}
                               </div>
                               <div className="text-right">
                                  <p className="text-[10px] font-black text-text-muted uppercase">Vendido</p>
                                  <p className="text-lg font-black text-brand-primary">S/ {Number(mov.total_vendido).toFixed(2)}</p>
                               </div>
                            </div>
                          ) : (
                            <p className="text-xs text-text-muted italic bg-bg-primary/50 p-3 rounded-apple-lg border border-dashed border-border">
                               Pendiente de retorno y liquidación de ventas.
                            </p>
                          )}
                          
                          {mov.observacion && (
                            <p className="mt-3 text-[11px] text-text-secondary italic">
                               Obs: {mov.observacion}
                            </p>
                          )}
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-8 border-t border-border bg-bg-primary/30 flex justify-between items-center">
               <div className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                  Total Movimientos: {historial.length}
               </div>
               <button onClick={closeHistory} className="px-6 py-2 bg-white border border-border rounded-apple-lg text-xs font-bold text-text-primary hover:bg-bg-primary transition-colors">
                  Cerrar
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehiculosPage;

