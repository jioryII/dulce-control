import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Lock, Mail, Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setLogin = useAuthStore((state) => state.setLogin);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:3001/api/auth/login', { email, password });
      setLogin(response.data.user, response.data.token);
      toast.success(`¡Bienvenido, ${response.data.user.nombre}!`);
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pastel-cream via-bg-primary to-pastel-orange/30 p-4 relative overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pastel-cyan/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pastel-red/20 rounded-full blur-[100px]" />

      <div className="max-w-[440px] w-full z-10">
        <div className="bg-white/80 backdrop-blur-xl p-10 rounded-[64px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/50 animate-in fade-in zoom-in duration-700">
          <div className="text-center mb-10">
            <div className="mb-6 transform transition-transform hover:scale-105 duration-300">
              <img src="/multimedia/dulce-logo2_.png" alt="Logo" className="w-32 h-32 mx-auto object-contain" />
            </div>
            <div className="flex items-center justify-center gap-2 text-text-secondary">
              <Sparkles size={16} className="text-brand-accent" />
              <p className="text-lg font-bold tracking-tight text-text-primary">gestión para tu pastelería</p>
            </div>
          </div>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-text-secondary px-1 uppercase tracking-wider">Email Corporativo</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-text-muted transition-colors group-focus-within:text-brand-primary">
                  <Mail size={20} />
                </span>
                <input
                  type="email"
                  required
                  className="w-full bg-white border-2 border-transparent rounded-2xl py-4 pl-12 pr-4 shadow-sm outline-none transition-all focus:border-brand-soft focus:ring-4 focus:ring-brand-soft/20 text-text-primary placeholder:text-text-muted/50"
                  placeholder="admin@dulcecontrol.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-bold text-text-secondary px-1 uppercase tracking-wider">Contraseña de Acceso</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-text-muted transition-colors group-focus-within:text-brand-primary">
                  <Lock size={20} />
                </span>
                <input
                  type="password"
                  required
                  className="w-full bg-white border-2 border-transparent rounded-2xl py-4 pl-12 pr-4 shadow-sm outline-none transition-all focus:border-brand-soft focus:ring-4 focus:ring-brand-soft/20 text-text-primary placeholder:text-text-muted/50"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary text-white font-bold py-4 rounded-2xl shadow-xl shadow-brand-primary/20 hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-3 mt-4"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <span>Entrar al Sistema</span>
                  <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                    <span className="text-xs">→</span>
                  </div>
                </>
              )}
            </button>
          </form>
          
          <div className="mt-10 text-center">
            <div className="h-[1px] bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-6" />
            <p className="text-[11px] text-text-muted font-bold uppercase tracking-[0.2em]">
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
