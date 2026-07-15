
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
import { AccountsModule } from '@/components/pos/accounts-module';
import { Modals } from '@/components/pos/modals';
import { Product, Client, Sale, Account, CartItem } from '@/types/pos';

export default function POSPage() {
  const [activeModule, setActiveModule] = useState('pos');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  // App State (The DB)
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [posCart, setPosCart] = useState<CartItem[]>([]);
  const [selectedRow, setSelectedRow] = useState(-1);
  const [config, setConfig] = useState({
    tasa: 724.00,
    igtf: 3,
    iva: 16,
    rifEmpresa: 'J-12345678-9',
    nombreEmpresa: 'AutoParts C.A.',
    direccion: 'Av. Principal, Local 5',
    telefono: '0212-5551234',
    vendedor: 'MARIA VERASTEGUI',
    vendedores: ['MARIA VERASTEGUI', 'JUAN PEREZ', 'CARLOS LOPEZ'],
    nextInvoice: 1,
  });

  // Initialization
  useEffect(() => {
    const saved = localStorage.getItem('autoparts_pos_db_v2');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.products) setProducts(data.products);
      if (data.clients) setClients(data.clients);
      if (data.sales) setSales(data.sales);
      if (data.accounts) setAccounts(data.accounts);
      if (data.config) setConfig(data.config);
    } else {
      // Mock some data for demo
      setProducts([
        { codigo: 'ACE-5W30', descripcion: 'ACEITE MOTOR 5W-30 SYNTHETIC 1GL', categoria: 'Lubricante', marca: 'Mobil', modelo: 'Universal', departamento: 'Lubricantes', precioUsd: 28.50, precioBs: 28.50 * 724, costoUsd: 18.00, margen: 36.84, iva: 16, stock: 35, stockMin: 10, unidad: 'Galón', ubicacion: 'C-1', isKit: false, stockPropio: true, activo: true, cpp: 18.00 },
        { codigo: 'FILT-OIL', descripcion: 'FILTRO DE ACEITE UNIVERSAL', categoria: 'Repuesto', marca: 'Fram', modelo: 'Universal', departamento: 'Repuestos', precioUsd: 8.50, precioBs: 8.50 * 724, costoUsd: 4.00, margen: 52.94, iva: 16, stock: 55, stockMin: 15, unidad: 'Unidad', ubicacion: 'D-2', isKit: false, stockPropio: true, activo: true, cpp: 4.00 }
      ]);
      setClients([
        { tipoRif: 'V', rifNum: '00000000-0', nombre: 'Consumidor Final', telefono: '', email: '', direccion: '', tipo: 'Regular', credito: 0, saldo: 0 }
      ]);
    }
  }, []);

  useEffect(() => {
    const data = { products, clients, sales, accounts, config };
    localStorage.setItem('autoparts_pos_db_v2', JSON.stringify(data));
  }, [products, clients, sales, accounts, config]);

  // Handlers
  const notify = (msg: string, type: 'success' | 'error' | 'warning' = 'success') => {
    const el = document.getElementById('notification');
    if (el) {
      el.textContent = msg;
      el.className = `notification show ${type}`;
      setTimeout(() => el.className = 'notification', 3000);
    }
  };

  const openModal = (id: string) => setActiveModal(id);
  const closeModal = () => setActiveModal(null);

  const switchModule = (name: string) => setActiveModule(name);

  return (
    <div id="mainApp">
      <div id="notification" className="notification"></div>

      <div className="dollar-bar">
        <span className="dollar-icon">💲</span>
        <span>DOLAR: <strong id="dolarRate">{config.tasa.toFixed(2)}</strong></span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#555' }}>
          AutoParts POS v2.0 | Repuestos, Lubricantes y Servicios Automotrices
        </span>
      </div>

      <div className="nav-tabs">
        {['pos', 'dashboard', 'productos', 'clientes', 'ventas', 'inventario', 'reportes', 'cuentas', 'config'].map(m => (
          <div key={m} className={`nav-tab ${activeModule === m ? 'active' : ''}`} onClick={() => switchModule(m)}>
            {m === 'pos' ? '️ POS Venta' : 
             m === 'dashboard' ? ' Dashboard' :
             m === 'productos' ? '📦 Productos' :
             m === 'clientes' ? '👥 Clientes' :
             m === 'ventas' ? '🧾 Ventas' :
             m === 'inventario' ? '📋 Inventario' :
             m === 'reportes' ? '📈 Reportes' :
             m === 'cuentas' ? '💰 Cuentas' : '⚙️ Configuración'}
          </div>
        ))}
      </div>

      <PosModule 
        active={activeModule === 'pos'} 
        onOpenModal={openModal} 
        products={products}
        clients={clients}
        cart={posCart}
        setCart={setPosCart}
        config={config}
        notify={notify}
        selectedRow={selectedRow}
        setSelectedRow={setSelectedRow}
      />
      
      <DashboardModule active={activeModule === 'dashboard'} sales={sales} products={products} config={config} />
      
      <ProductsModule 
        active={activeModule === 'productos'} 
        onOpenModal={openModal} 
        products={products}
        tasa={config.tasa}
      />
      
      <ClientsModule active={activeModule === 'clientes'} onOpenModal={openModal} clients={clients} />
      
      <SalesModule active={activeModule === 'ventas'} sales={sales} notify={notify} showInvoice={(s) => { /* logic */ }} />
      
      <InventoryModule active={activeModule === 'inventario'} onOpenModal={openModal} products={products} />
      
      <ReportsModule active={activeModule === 'reportes'} sales={sales} products={products} clients={clients} config={config} />
      
      <AccountsModule active={activeModule === 'cuentas'} accounts={accounts} />
      
      <ConfigModule active={activeModule === 'config'} onOpenModal={openModal} config={config} setConfig={setConfig} notify={notify} />

      <div className="status-bar">
        <span className="status-section"> Usuario: Admin</span>
        <span className="status-section"> Conectado</span>
        <span className="status-section"> DB: LocalStorage</span>
        <span className="status-section" id="statusLastSale">Última Venta: {sales.length > 0 ? sales[sales.length-1].numero : '--'}</span>
      </div>

      <Modals 
        activeModal={activeModal} 
        onClose={closeModal} 
        products={products}
        setProducts={setProducts}
        clients={clients}
        setClients={setClients}
        sales={sales}
        setSales={setSales}
        accounts={accounts}
        setAccounts={setAccounts}
        cart={posCart}
        setCart={setPosCart}
        config={config}
        notify={notify}
        selectedRow={selectedRow}
      />
    </div>
  );
}
