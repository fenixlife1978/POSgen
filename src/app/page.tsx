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
import { UsersModule } from '@/components/pos/users-module';
import { Modals } from '@/components/pos/modals';
import { Product, Client, Sale, Account, CartItem, Presupuesto, User } from '@/types/pos';

export default function POSPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [activeModule, setActiveModule] = useState('pos');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  // App State
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [users, setUsers] = useState<User[]>([]);
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
    vVendedores: ['MARIA VERASTEGUI', 'JUAN PEREZ', 'CARLOS LOPEZ'],
    nextInvoice: 1,
  });

  // Initialization
  useEffect(() => {
    const saved = localStorage.getItem('autoparts_pos_db_v4');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.products) setProducts(data.products);
      if (data.clients) setClients(data.clients);
      if (data.sales) setSales(data.sales);
      if (data.accounts) setAccounts(data.accounts);
      if (data.presupuestos) setPresupuestos(data.presupuestos);
      if (data.users) setUsers(data.users);
      if (data.config) setConfig(data.config);
    } else {
      // Default Data
      setUsers([
        { id: '1', username: 'Admin', password: '123', name: 'Administrador Principal', role: 'Administrador', active: true }
      ]);
      setProducts([
        { codigo: 'ACE-5W30', descripcion: 'ACEITE MOTOR 5W-30 SYNTHETIC 1GL', nombre: 'Aceite Mobil 5W30', categoria: 'Lubricante', marca: 'Mobil', unidad: 'Galón', moneda: 'base', departamento: 'Lubricantes', precio1: 28.50, precioUsd: 28.50, iva: 16, stock: 35, stockMin: 10, ubicacion: 'C-1', isKit: false, stockPropio: true, activo: true, costoPromedio: 18.00, costoAnterior: 18.00, costoActual: 18.00, utilidadPorcentaje: 36.84, precio2: 25, precio3: 22, precio4: 20, ivaAlicuota: 16, permiteDescuento: true, manejaSeriales: false, manejaLotes: false, manejaTallasColores: false, manejaPeso: false, kitComponents: [] }
      ]);
      setClients([
        { tipoRif: 'V', rifNum: '00000000-0', nombre: 'Consumidor Final', telefono: '', email: '', direccion: '', tipo: 'Regular', credito: 0, saldo: 0 }
      ]);
    }
  }, []);

  useEffect(() => {
    const data = { products, clients, sales, accounts, presupuestos, users, config };
    localStorage.setItem('autoparts_pos_db_v4', JSON.stringify(data));
  }, [products, clients, sales, accounts, presupuestos, users, config]);

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

  const openModal = (id: string) => setActiveModal(id);
  const closeModal = () => setActiveModal(null);

  if (!isLoggedIn) {
    return (
      <div className="login-screen">
        <div className="login-box">
          <div className="login-title">Acceso al Sistema - MarketerPro POS</div>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Usuario:</label>
              <input 
                type="text" 
                required 
                value={loginData.username} 
                onChange={e => setLoginData({...loginData, username: e.target.value})} 
                autoFocus 
              />
            </div>
            <div className="form-group">
              <label>Contraseña:</label>
              <input 
                type="password" 
                required 
                value={loginData.password} 
                onChange={e => setLoginData({...loginData, password: e.target.value})} 
              />
            </div>
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '8px 25px' }}>Entrar</button>
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
        <span style={{ fontSize: '18px' }}>💲</span>
        <span>DOLAR: <strong id="dolarRate">{config.tasa.toFixed(2)}</strong></span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#555' }}>
          AutoParts POS v2.0 | Repuestos, Lubricantes y Servicios Automotrices
        </span>
      </div>

      <div className="nav-tabs">
        {[
          { id: 'pos', label: '️ POS Venta' },
          { id: 'dashboard', label: ' Dashboard' },
          { id: 'productos', label: '📦 Productos' },
          { id: 'clientes', label: '👥 Clientes' },
          { id: 'ventas', label: '🧾 Ventas' },
          { id: 'inventario', label: '📋 Inventario' },
          { id: 'reportes', label: '📈 Reportes' },
          { id: 'cuentas', label: '💰 Cuentas' },
          { id: 'usuarios', label: '👤 Usuarios' },
          { id: 'config', label: '⚙️ Configuración' }
        ].map(m => (
          <div key={m.id} className={`nav-tab ${activeModule === m.id ? 'active' : ''}`} onClick={() => setActiveModule(m.id)}>
            {m.label}
          </div>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
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
        
        <SalesModule active={activeModule === 'ventas'} sales={sales} notify={notify} />
        
        <InventoryModule active={activeModule === 'inventario'} onOpenModal={openModal} products={products} />
        
        <ReportsModule active={activeModule === 'reportes'} sales={sales} products={products} clients={clients} config={config} />
        
        <AccountsModule active={activeModule === 'cuentas'} accounts={accounts} />
        
        <UsersModule active={activeModule === 'usuarios'} users={users} onOpenModal={openModal} />
        
        <ConfigModule active={activeModule === 'config'} onOpenModal={openModal} config={config} setConfig={setConfig} notify={notify} />
      </div>

      <div className="status-bar">
        <span className="status-section"> Usuario: {loginData.username}</span>
        <span className="status-section"> Conectado (Tasa: {config.tasa})</span>
        <span className="status-section"> DB: LocalStorage / MarketerPro</span>
        <span className="status-section">Última Venta: {sales.length > 0 ? sales[sales.length-1].numero : '--'}</span>
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
        presupuestos={presupuestos}
        setPresupuestos={setPresupuestos}
        cart={posCart}
        setCart={setPosCart}
        config={config}
        notify={notify}
        selectedRow={selectedRow}
      />
    </div>
  );
}
