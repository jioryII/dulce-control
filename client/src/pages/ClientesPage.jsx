import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { Users, Plus, Search, Edit2, Trash2, X, Phone, MapPin, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const ClientesPage = () => {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    direccion: '',
    tipo: 'variable',
    observacion: ''
  });

  const api = axios.create({
    baseURL: 'http://localhost:3001/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const { data } = await api.get('/clientes');
      return data;
    }
  });

  const mutation = useMutation({
    mutationFn: (data) => {
      if (editingCliente) {
        return api.put(`/clientes/${editingCliente.id}`, data);
      }
      return api.post('/clientes', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['clientes']);
      toast.success(editingCliente ? 'Cliente actualizado' : 'Cliente registrado');
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al procesar');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/clientes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['clientes']);
      toast.success('Cliente eliminado');
    }
  });

  const openModal = (cliente = null) => {
    if (cliente) {
      setEditingCliente(cliente);
      setFormData({
        nombre: cliente.nombre,
        telefono: cliente.telefono || '',
        direccion: cliente.direccion || '',
        tipo: cliente.tipo,
        observacion: cliente.observacion || ''
      });
    } else {
      setEditingCliente(null);
      setFormData({
        nombre: '',
        telefono: '',
        direccion: '',
        tipo: 'variable',
        observacion: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCliente(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const filteredClientes = clientes.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.telefono?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Users className="text-brand-primary" />
          Directorio de Clientes
        </h2>
        <button 
          onClick={() => openModal()}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Nuevo Cliente
        </button>
      </div>

      <div className="bg-white p-4 rounded-apple-xl shadow-shadow-sm border border-border flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o teléfono..." 
            className="input-pastel w-full pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <p className="col-span-full text-center py-10 text-text-muted">Cargando clientes...</p>
        ) : filteredClientes.length === 0 ? (
          <p className="col-span-full text-center py-10 text-text-muted">No se encontraron clientes.</p>
        ) : filteredClientes.map((cliente) => (
          <div key={cliente.id} className="card-apple group hover:border-brand-primary transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-apple-lg flex items-center justify-center text-xl font-bold ${
                cliente.tipo === 'fijo' ? 'bg-brand-soft text-brand-primary' : 'bg-bg-secondary text-text-secondary'
              }`}>
                {cliente.nombre.charAt(0)}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openModal(cliente)} className="p-2 text-text-muted hover:text-brand-primary">
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => {
                    if(confirm('¿Eliminar cliente?')) deleteMutation.mutate(cliente.id);
                  }}
                  className="p-2 text-text-muted hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <h3 className="font-bold text-text-primary text-lg truncate mb-1">{cliente.nombre}</h3>
            <div className="flex items-center gap-2 mb-3">
               <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                 cliente.tipo === 'fijo' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
               }`}>
                 {cliente.tipo}
               </span>
            </div>

            <div className="space-y-2 mt-4">
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Phone size={14} className="text-text-muted" />
                <span>{cliente.telefono || 'Sin teléfono'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <MapPin size={14} className="text-text-muted" />
                <span className="truncate">{cliente.direccion || 'Sin dirección'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={closeModal} />
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl z-10 overflow-hidden animate-in zoom-in fade-in duration-300">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="text-xl font-bold text-text-primary">
                {editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h3>
              <button onClick={closeModal} className="text-text-muted hover:text-text-primary">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">Nombre Completo</label>
                <input 
                  type="text" 
                  required
                  className="input-pastel w-full h-12"
                  placeholder="Ej: Juan Pérez"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">Teléfono</label>
                  <input 
                    type="text" 
                    className="input-pastel w-full h-12"
                    placeholder="999..."
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">Tipo</label>
                  <select 
                    className="input-pastel w-full h-12"
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                  >
                    <option value="variable">Variable (Ocasional)</option>
                    <option value="fijo">Fijo (Frecuente)</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">Dirección</label>
                <input 
                  type="text" 
                  className="input-pastel w-full h-12"
                  placeholder="Av. Las Magnolias 123..."
                  value={formData.direccion}
                  onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">Observaciones</label>
                <textarea 
                  className="input-pastel w-full h-24 py-3 resize-none"
                  placeholder="Notas adicionales..."
                  value={formData.observacion}
                  onChange={(e) => setFormData({...formData, observacion: e.target.value})}
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-3 rounded-apple-xl bg-bg-secondary text-text-primary font-bold">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 btn-primary py-3">
                  {editingCliente ? 'Guardar Cambios' : 'Registrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientesPage;
