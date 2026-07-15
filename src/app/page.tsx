'use client';

import React, { useState, useEffect } from 'react';
import { PosModule } from '@/components/pos/pos-module';
import { DashboardModule } from '@/components/pos/dashboard-module';
import { ProductsModule } from '@/components/pos/products-module';
import { ClientsModule } from '@/components/pos/clients-module';
import { SalesModule } from '@/components/pos/sales-module';
import { InventoryModule } from '@/components/pos/inventory-module';
import { ReportsModule } from '@/components/pos/reports-module';
import { ConfigModule } from '@/components/pos/config-module';
import { Modals } from '@/components/pos/modals';

export default function POSPage() {
  const [activeModule, setActiveModule] = useState('pos');
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const openModal = (id: string) => setActiveModal(id);
  const closeModal = () => setActiveModal(null);

  return (
    <div id="mainApp">
      {/* Notification Placeholder */}
      <div id="notification" className="notification"></div>

      {/* Dollar Bar */}
      <div className="dollar-bar">
        <span className="dollar-icon">💲</span>
        <span>DOLAR: <strong id="dolarRate">724.00</strong></span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#555' }}>
          AutoParts POS v2.0 | Repuestos, Lubricantes y Servicios Automotrices
        </span>
      </div>

      {/* Navigation Tabs */}
      <div className="nav-tabs">
        <div className={`nav-tab ${activeModule === 'pos' ? 'active' : ''}`} onClick={() => setActiveModule('pos')}>️ POS Venta</div>
        <div className={`nav-tab ${activeModule === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveModule('dashboard')}> Dashboard</div>
        <div className={`nav-tab ${activeModule === 'productos' ? 'active' : ''}`} onClick={() => setActiveModule('productos')}>📦 Productos</div>
        <div className={`nav-tab ${activeModule === 'clientes' ? 'active' : ''}`} onClick={() => setActiveModule('clientes')}>👥 Clientes</div>
        <div className={`nav-tab ${activeModule === 'ventas' ? 'active' : ''}`} onClick={() => setActiveModule('ventas')}>🧾 Ventas</div>
        <div className={`nav-tab ${activeModule === 'inventario' ? 'active' : ''}`} onClick={() => setActiveModule('inventario')}>📋 Inventario</div>
        <div className={`nav-tab ${activeModule === 'reportes' ? 'active' : ''}`} onClick={() => setActiveModule('reportes')}>📈 Reportes</div>
        <div className={`nav-tab ${activeModule === 'config' ? 'active' : ''}`} onClick={() => setActiveModule('config')}>⚙️ Configuración</div>
      </div>

      {/* Modules */}
      <PosModule active={activeModule === 'pos'} onOpenModal={openModal} />
      <DashboardModule active={activeModule === 'dashboard'} />
      <ProductsModule active={activeModule === 'productos'} onOpenModal={openModal} />
      <ClientsModule active={activeModule === 'clientes'} onOpenModal={openModal} />
      <SalesModule active={activeModule === 'ventas'} />
      <InventoryModule active={activeModule === 'inventario'} onOpenModal={openModal} />
      <ReportsModule active={activeModule === 'reportes'} />
      <ConfigModule active={activeModule === 'config'} onOpenModal={openModal} />

      {/* Status Bar */}
      <div className="status-bar">
        <span className="status-section"> Usuario: Admin</span>
        <span className="status-section"> Conectado</span>
        <span className="status-section"> DB: LocalStorage</span>
        <span className="status-section">Última Venta: --</span>
      </div>

      {/* Modals Container */}
      <Modals activeModal={activeModal} onClose={closeModal} />
    </div>
  );
}
