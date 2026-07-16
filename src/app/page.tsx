
'use client';

import React, { useState, useEffect } from 'react';
import { PosModule } from '@/components/pos/pos-module';
import { DashboardModule } from '@/components/pos/dashboard-module';
import { ProductsModule } from '@/components/pos/products-module';
import { ClientsModule } from '@/components/pos/clients-module';
import { ProvidersModule } from '@/components/pos/providers-module';
import { SalesModule } from '@/components/pos/sales-module';
import { InventoryModule } from '@/components/pos/inventory-module';
import { ReportsModule } from '@/components/pos/reports-module';
import { ConfigModule } from '@/components/pos/config-module';
import { AccountsModule } from '@/components/pos/accounts-module';
import { UsersModule } from '@/components/pos/users-module';
import { Modals } from '@/components/pos/modals';
import { Product, Client, Provider, Sale, Account, CartItem, Presupuesto, User, InventoryMovement } from '@/types/pos';

const DB_KEY = 'autoparts_pos_db_v2';

export default function POSPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [activeModule, setActiveModule] = useState('pos');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // App State
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [posCart, setPosCart] = useState<CartItem[]>([]);
  const [selectedRow, setSelectedRow] = useState(-1);
  const [editingId, setEditingId] = useState<any>(null);

  const [config, setConfig] = useState({
    tasa: 36.50,
    igtf: 3,
    iva: 16,
    rifEmpresa: 'J-12345678-9',
    nombreEmpresa: 'SISTEMA POS REAL',
    direccion: 'Av. Principal',
    telefono: '0412-0000000',
    vendedor: 'ADMIN',
    vVendedores: ['ADMIN'],
    nextInvoice: 1,
  });

  // Initialization - Load from LocalStorage safely
  useEffect(() => {
    const saved = localStorage.getItem(DB_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.products) setProducts(data.products);
        if (data.clients) setClients(data.clients);
        if (data.providers) setProviders(data.providers);
        if (data.sales) setSales(data.sales);
        if (data.accounts) setAccounts(data.accounts);
        if (data.presupuestos) setPresupuestos(data.presupuestos);
        if (data.users) setUsers(data.users);
        if (data.config) setConfig(data.config);
        if (data.movements) setMovements(data.movements);
      } catch (error) {
        console.error("Error parsing local database:", error);
      }
    } else {
      // Default users if first time
      setUsers([
        { id: '1', username: 'Admin', password: '123', name: 'Administrador', role: 'Administrador', active: true }
      ]);
    }
    setIsLoaded(true);
  }, []);

  // Save to LocalStorage safely only after load
  useEffect(() => {
    if (isLoaded) {
      const data = { products, clients, providers, sales, accounts, presupuestos, users, config, movements };
      localStorage.setItem(DB_KEY, JSON.stringify(data));
    }
  }, [products, clients, providers, sales, accounts, presupuestos, users, config, movements, isLoaded]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.username.toLowerCase() === loginData.username.toLowerCase() && u.password === loginData.password);
    if (user) {
      setIsLoggedIn(true);
      notify(`Bienvenido, ${user.name}`);
    } else {
      notify('Usuario o contraseña incorrectos', 'error');
    }
  };

  const notify = (msg: string, type: 'success' | 'error' | 'warning' = 'success') => {
    const el = document.getElementById('notification');
    if (el) {
      el.textContent = msg;
      el.className = `notification show ${type}`;
      setTimeout(() => el.className = 'notification', 3000);
    }
  };

  const openModal = (id: string, dataId?: any) => {
    setEditingId(dataId || null);
    setActiveModal(id);
  };
  const closeModal = () => {
    setActiveModal(null);
    setEditingId(null);
  };

  if (!isLoggedIn) {
    return (
      <div className="login-screen">
        <div className="login-box">
          <div className="login-title">Acceso al Sistema - POS Pro</div>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Usuario:</label>
              <input type="text" required value={loginData.username} onChange={e => setLoginData({...loginData, username: e.target.value})} autoFocus />
            </div>
            <div className="form-group">
              <label>Contraseña:</label>
              <input type="password" required value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} />
            </div>
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button type="submit" className="btn btn-primary">Entrar</button>
            </div>
          </form>
          <div id="notification" className="notification"></div>
        </div>
      </div>
    );
  }

  return (
    <div id="mainApp">
      <div id="notification" className="notification"></div>
      <div className="dollar-bar">
        <span>💲 TASA BCV: <strong>{config.tasa.toFixed(2)}</strong></span>
        <span style={{ marginLeft: 'auto', fontSize: '11px' }}>{config.nombreEmpresa} | Sistema de Gestión Integral</span>
      </div>
      <div className="nav-tabs">
        {[
          { id: 'pos', label: 'POS Venta' },
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'productos', label: 'Productos' },
          { id: 'clientes', label: 'Clientes' },
          { id: 'proveedores', label: 'Proveedores' },
          { id: 'ventas', label: 'Ventas' },
          { id: 'inventario', label: 'Inventario' },
          { id: 'reportes', label: 'Reportes' },
          { id: 'cuentas', label: 'Cuentas' },
          { id: 'usuarios', label: 'Usuarios' },
          { id: 'config', label: 'Configuración' }
        ].map(m => (
          <div key={m.id} className={`nav-tab ${activeModule === m.id ? 'active' : ''}`} onClick={() => setActiveModule(m.id)}>
            {m.label}
          </div>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        <PosModule active={activeModule === 'pos'} onOpenModal={openModal} products={products} clients={clients} cart={posCart} setCart={setPosCart} config={config} notify={notify} selectedRow={selectedRow} setSelectedRow={setSelectedRow} />
        <DashboardModule active={activeModule === 'dashboard'} sales={sales} products={products} config={config} />
        <ProductsModule active={activeModule === 'productos'} onOpenModal={openModal} products={products} tasa={config.tasa} notify={notify} />
        <ClientsModule active={activeModule === 'clientes'} onOpenModal={openModal} clients={clients} setClients={setClients} notify={notify} />
        <ProvidersModule active={activeModule === 'proveedores'} onOpenModal={openModal} providers={providers} setProviders={setProviders} notify={notify} />
        <SalesModule active={activeModule === 'ventas'} sales={sales} setSales={setSales} products={products} setProducts={setProducts} movements={movements} setMovements={setMovements} notify={notify} onOpenModal={openModal} config={config} />
        <InventoryModule active={activeModule === 'inventario'} onOpenModal={openModal} products={products} movements={movements} />
        <ReportsModule active={activeModule === 'reportes'} sales={sales} products={products} clients={clients} config={config} />
        <AccountsModule active={activeModule === 'cuentas'} accounts={accounts} movements={movements} />
        <UsersModule active={activeModule === 'usuarios'} users={users} setUsers={setUsers} onOpenModal={openModal} notify={notify} />
        <ConfigModule active={activeModule === 'config'} onOpenModal={openModal} config={config} setConfig={setConfig} notify={notify} />
      </div>
      <div className="status-bar">
        <span> Usuario: {loginData.username}</span>
        <span> Tasa: {config.tasa}</span>
        <span> Ventas: {sales.filter(s => s.estado === 'Completada').length}</span>
        <span> Último Doc: {sales.length > 0 ? sales[sales.length-1].numero : '--'}</span>
      </div>
      <Modals 
        activeModal={activeModal} 
        onClose={closeModal} 
        onOpenModal={openModal}
        products={products} 
        setProducts={setProducts} 
        clients={clients} 
        setClients={setClients} 
        providers={providers}
        setProviders={setProviders}
        sales={sales} 
        setSales={setSales} 
        accounts={accounts} 
        setAccounts={setAccounts} 
        presupuestos={setPresupuestos} 
        cart={posCart} 
        setCart={setPosCart} 
        config={config} 
        setConfig={setConfig} 
        notify={notify} 
        selectedRow={selectedRow} 
        editingId={editingId} 
        users={users} 
        setUsers={setUsers}
        movements={movements} 
        setMovements={setMovements}
      />
    </div>
  );
}
