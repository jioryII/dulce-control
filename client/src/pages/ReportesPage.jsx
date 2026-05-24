import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { 
  BarChart3, TrendingUp, Calendar, FileText, Download, 
  Filter, Loader2, Package, AlertTriangle, ChevronRight 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line, Cell, PieChart, Pie 
} from 'recharts';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

const ReportesPage = () => {
  const { token } = useAuthStore();
  const [selectedReport, setSelectedReport] = useState(null);
  const [dateRange, setDateRange] = useState({
    desde: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    hasta: new Date().toISOString().split('T')[0]
  });

  const api = axios.create({
    baseURL: 'http://localhost:3001/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  const reportTypes = [
    { id: 'ventas', title: 'Ventas Diarias', icon: TrendingUp, description: 'Ingresos por día.', color: 'bg-pastel-orange dark:bg-orange-900/20', textColor: 'text-orange-700 dark:text-orange-400' },
    { id: 'produccion', title: 'Producción', icon: BarChart3, description: 'Balance de horneado.', color: 'bg-pastel-cyan dark:bg-cyan-900/20', textColor: 'text-cyan-700 dark:text-cyan-400' },
    { id: 'caja', title: 'Cierres de Caja', icon: FileText, description: 'Historial de cuadres.', color: 'bg-pastel-cream dark:bg-yellow-900/20', textColor: 'text-yellow-700 dark:text-yellow-400' },
    { id: 'stock', title: 'Inventario Crítico', icon: AlertTriangle, description: 'Bajo stock.', color: 'bg-pastel-red dark:bg-red-900/20', textColor: 'text-red-700 dark:text-red-400' },
  ];

  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['reporte', selectedReport, dateRange],
    queryFn: async () => {
      if (!selectedReport) return null;
      const { data } = await api.get(`/reportes/${selectedReport}`, { params: dateRange });
      return data;
    },
    enabled: !!selectedReport
  });

  const exportToExcel = () => {
    if (!reportData || reportData.length === 0) return toast.error('No hay datos');
    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte");
    XLSX.writeFile(wb, `Reporte_${selectedReport}.xlsx`);
  };

  const COLORS = ['#FF9F66', '#D1E9F6', '#F6EACB', '#FFC5C5', '#E1AFD1'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-text-primary flex items-center gap-3">
            <div className="p-2 bg-brand-primary/10 rounded-apple-lg"><BarChart3 className="text-brand-primary" size={28} /></div>
            Reportes
          </h2>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-[#1C1C1E] p-2 rounded-apple-xl border border-border shadow-shadow-sm">
          <div className="flex items-center gap-2 px-2 border-r border-border dark:border-gray-800">
            <Calendar size={16} className="text-text-muted" />
            <input type="date" className="text-xs font-bold bg-transparent outline-none text-text-primary" value={dateRange.desde} onChange={(e) => setDateRange({...dateRange, desde: e.target.value})} />
            <span className="text-text-muted text-xs">a</span>
            <input type="date" className="text-xs font-bold bg-transparent outline-none text-text-primary" value={dateRange.hasta} onChange={(e) => setDateRange({...dateRange, hasta: e.target.value})} />
          </div>
          <button onClick={() => refetch()} className="p-2 hover:bg-bg-primary dark:hover:bg-bg-dark rounded-apple-lg transition-colors text-brand-primary"><Filter size={18} /></button>
          <button onClick={exportToExcel} className="btn-primary py-2 px-4 text-xs shadow-lg shadow-brand-primary/20">Exportar</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportTypes.map((report) => (
          <button 
            key={report.id} 
            onClick={() => setSelectedReport(report.id)}
            className={`card-apple text-left transition-all relative overflow-hidden group ${
              selectedReport === report.id ? 'ring-2 ring-brand-primary border-brand-primary' : 'hover:translate-y-[-4px]'
            }`}
          >
            <div className={`w-12 h-12 ${report.color} ${report.textColor} rounded-apple-lg flex items-center justify-center mb-4 shadow-inner`}>
              <report.icon size={24} />
            </div>
            <h3 className="font-bold text-text-primary">{report.title}</h3>
            <p className="text-[10px] text-text-secondary uppercase font-bold">{report.description}</p>
          </button>
        ))}
      </div>

      {!selectedReport ? (
        <div className="bg-white dark:bg-[#1C1C1E] rounded-[40px] border border-border p-12 shadow-shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center">
          <BarChart3 size={48} className="text-text-muted opacity-20 mb-6" />
          <h3 className="text-2xl font-black text-text-primary tracking-tight">Selecciona un reporte</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="lg:col-span-2 card-apple min-h-[400px]">
              <h3 className="text-lg font-bold text-text-primary mb-8">Gráfico de {reportTypes.find(r => r.id === selectedReport)?.title}</h3>
              <div className="h-[300px] w-full">
                {isLoading ? <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-brand-primary" size={32} /></div> : (
                  <ResponsiveContainer width="100%" height="100%">
                    {selectedReport === 'ventas' ? (
                      <LineChart data={reportData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.1} />
                        <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#888'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#888'}} />
                        <Tooltip contentStyle={{borderRadius: '16px', border: 'none', backgroundColor: '#1C1C1E', color: '#fff'}} />
                        <Line type="monotone" dataKey="total" stroke="var(--theme-primary, #E67E43)" strokeWidth={4} dot={{r: 4}} />
                      </LineChart>
                    ) : (
                      <BarChart data={reportData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.1} />
                        <XAxis dataKey={selectedReport === 'produccion' ? 'producto' : 'fecha'} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#888'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#888'}} />
                        <Tooltip contentStyle={{borderRadius: '16px', border: 'none', backgroundColor: '#1C1C1E', color: '#fff'}} />
                        <Bar dataKey={selectedReport === 'produccion' ? 'total' : 'total_esperado'} fill="var(--theme-primary, #E67E43)" radius={[10, 10, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="card-apple overflow-hidden flex flex-col">
              <h3 className="text-lg font-bold text-text-primary mb-6">Detalles</h3>
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black text-text-muted uppercase border-b border-border pb-2">
                      <th className="pb-3">{selectedReport === 'produccion' || selectedReport === 'stock' ? 'Item' : 'Fecha'}</th>
                      <th className="pb-3 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {reportData?.slice(0, 15).map((row, i) => (
                      <tr key={i} className="text-xs hover:bg-bg-primary dark:hover:bg-bg-dark transition-colors">
                        <td className="py-4 font-bold text-text-primary">{row.fecha ? new Date(row.fecha).toLocaleDateString() : (row.producto || row.nombre)}</td>
                        <td className="py-4 text-right font-black text-brand-primary">
                          {selectedReport === 'ventas' || selectedReport === 'caja' ? `S/ ${Number(row.total || row.total_esperado || 0).toFixed(2)}` : row.total || row.stock}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ReportesPage;
