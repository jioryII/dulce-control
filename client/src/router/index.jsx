import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import LoginPage from '../pages/Auth/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import ProductsPage from '../pages/ProductsPage';
import ProduccionPage from '../pages/ProduccionPage';
import VentasPage from '../pages/VentasPage';
import MainLayout from '../components/layout/MainLayout';

import ClientesPage from '../pages/ClientesPage';
import VehiculosPage from '../pages/VehiculosPage';
import StockPage from '../pages/StockPage';
import LiquidacionPage from '../pages/LiquidacionPage';
import ReportesPage from '../pages/ReportesPage';
import ConfiguracionPage from '../pages/ConfiguracionPage';
import ContingenciasPage from '../pages/ContingenciasPage';

const AppRouter = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <Routes>
      <Route 
        path="/login" 
        element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} 
      />
      
      <Route 
        path="/" 
        element={
          isAuthenticated ? (
            <MainLayout>
              <DashboardPage />
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        } 
      />

      <Route 
        path="/ventas" 
        element={
          isAuthenticated ? (
            <MainLayout>
              <VentasPage />
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        } 
      />

      <Route 
        path="/stock" 
        element={
          isAuthenticated ? (
            <MainLayout>
              <StockPage />
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        } 
      />

      <Route 
        path="/liquidacion" 
        element={
          isAuthenticated ? (
            <MainLayout>
              <LiquidacionPage />
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        } 
      />

      <Route 
        path="/productos" 
        element={
          isAuthenticated ? (
            <MainLayout>
              <ProductsPage />
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        } 
      />

      <Route 
        path="/vehiculos" 
        element={
          isAuthenticated ? (
            <MainLayout>
              <VehiculosPage />
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        } 
      />

      <Route 
        path="/clientes" 
        element={
          isAuthenticated ? (
            <MainLayout>
              <ClientesPage />
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        } 
      />

      <Route 
        path="/produccion" 
        element={
          isAuthenticated ? (
            <MainLayout>
              <ProduccionPage />
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        } 
      />

      <Route 
        path="/reportes" 
        element={
          isAuthenticated ? (
            <MainLayout>
              <ReportesPage />
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        } 
      />

      <Route 
        path="/configuracion" 
        element={
          isAuthenticated ? (
            <MainLayout>
              <ConfiguracionPage />
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        } 
      />

      <Route 
        path="/contingencias" 
        element={
          isAuthenticated ? (
            <MainLayout>
              <ContingenciasPage />
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        } 
      />

      <Route 
        path="/:module" 
        element={
          isAuthenticated ? (
            <MainLayout>
              <div className="flex flex-col items-center justify-center h-64 text-text-muted bg-white rounded-apple-xl border border-dashed border-border">
                <span className="text-4xl mb-4">🚧</span>
                <p className="text-lg font-medium">Módulo en construcción</p>
                <p className="text-sm">Estamos trabajando para traerte esta funcionalidad pronto.</p>
              </div>
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        } 
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRouter;
