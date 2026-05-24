import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from './store/authStore';
import AppRouter from './router';
import './index.css';

const queryClient = new QueryClient();

function App() {
  const { token, user, setUser, setLogout } = useAuthStore();

  useEffect(() => {
    // Restaurar Tema de Color (Identidad Visual)
    const savedTheme = localStorage.getItem('theme-color');
    if (savedTheme) {
      try {
        const { primary, accent, soft } = JSON.parse(savedTheme);
        document.documentElement.style.setProperty('--theme-primary', primary);
        document.documentElement.style.setProperty('--theme-accent', accent);
        document.documentElement.style.setProperty('--theme-soft', soft);
      } catch (e) {
        console.error("Error al cargar tema guardado", e);
      }
    }

    // Restaurar Modo Oscuro
    const isDark = localStorage.getItem('theme') === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const checkAuth = async () => {
      if (token && !user) {
        try {
          const { data } = await axios.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(data);
        } catch (error) {
          console.error('Error verificando sesión:', error);
          setLogout();
        }
      }
    };

    checkAuth();
  }, [token, user, setUser, setLogout]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRouter />
        <Toaster position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
