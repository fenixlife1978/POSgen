
'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, collectionGroup, query, orderBy, limit } from 'firebase/firestore';
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
import { Product, Client, Provider, Sale, Account, CartItem, User, InventoryMovement, ReportZRecord } from '@/types/pos';

export default function POSPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', username: '', password: '' });
  const [activeModule, setActiveModule] = useState('pos');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // App State
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [reportsZ, setReportsZ] = useState<ReportZRecord[]>([]);
  const [posCart, setPosCart] = useState<CartItem[]>([]);
  const [selectedRow, setSelectedRow] = useState(-1);
  const [editingId, setEditingId] = useState<any>(null);

  const [config, setConfig] = useState({
    tasa: 36.50,
    igtf: 3,
    iva: 16,
    rifEmpresa: 'J-12345678-9',
    nombreEmpresa: 'AUTOPARTS POS PRO',
    direccion: 'Av. Principal Local 10, Caracas',
    telefono: '0412-0000000',
    vendedor: 'ADMIN',
    vVendedores: ['ADMIN', 'CAJERO 01', 'CAJERO 02'],
    reportZCounter: 1,
    grandTotalHistory: 0,
    lastZDate: null as string | null,
    terminalId: 'CAJA-01'
  });

  // Suscripción optimizada a Firestore
  useEffect(() => {
    // Colecciones Principales
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(doc => doc.data() as Product));
    });
    const unsubClients = onSnapshot(collection(db, 'clients'), (snapshot) => {
      setClients(snapshot.docs.map(doc => doc.data() as Client));
    });
    const unsubProviders = onSnapshot(collection(db, 'providers'), (snapshot) => {
      setProviders(snapshot.docs.map(doc => doc.data() as Provider));
    });
    const unsubSales = onSnapshot(query(collection(db, 'sales'), orderBy('fecha', 'desc'), limit(100)), (snapshot) => {
      setSales(snapshot.docs.map(doc => doc.data() as Sale));
    });
    const unsubAccounts = onSnapshot(collection(db, 'accounts'), (snapshot) => {
      setAccounts(snapshot.docs.map(doc => doc.data() as Account));
    });
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => doc.data() as User));
    });

    // Auditoría y Configuración (Optimizado en sub-rutas)
    const unsubConfig = onSnapshot(doc(db, 'system', 'config'), (snapshot) => {
      if (snapshot.exists()) {
        setConfig(snapshot.data() as any);
      }
    });
    const unsubReportsZ = onSnapshot(collection(db, 'accounting/audit/reportsZ'), (snapshot) => {
      setReportsZ(snapshot.docs.map(doc => doc.data() as ReportZRecord));
    });

    // Movimientos Globales (Ajustes) - Usando Collection Group para ver todos los logs de todos los productos
    const unsubMovements = onSnapshot(query(collectionGroup(db, 'logs'), orderBy('fecha', 'desc'), limit(200)), (snapshot) => {
      setMovements(snapshot.docs.map(doc => doc.data() as InventoryMovement));
    });

    setIsLoaded(true);
    return () => {
      unsubProducts(); unsubClients(); unsubProviders(); unsubSales();
      unsubAccounts(); unsubUsers(); unsubMovements(); unsubReportsZ(); unsubConfig();
    };
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => 
      (u.email || "").toLowerCase().trim() === loginData.email.toLowerCase().trim() &&
      (u.username || "").toLowerCase().trim() === loginData.username.toLowerCase().trim() && 
      u.password === loginData.password
    );

    const isAdminDefault = loginData.email === 'admin@sistema.com' && loginData.username === 'Admin' && loginData.password === '123';

    if (user || isAdminDefault) {
      setIsLoggedIn(true);
      notify(`Bienvenido, ${user ? user.name : 'Administrador'}`);
    } else {
      notify('Credenciales incorrectas. Verifique Email, Usuario y Contraseña.', 'error');
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
              <label>Email:</label>
              <input 
                type="email" 
                required 
                value={loginData.email} 
                onChange={e => setLoginData({...loginData, email: e.target.value})} 
                placeholder="admin@sistema.com"
                autoFocus 
              />
            </div>
            <div className="form-group">
              <label>Usuario:</label>
              <input 
                type="text" 
                required 
                value={loginData.username} 
                onChange={e => setLoginData({...loginData, username: e.target.value})} 
                placeholder="Admin"
              />
            </div>
            <div className="form-group">
              <label>Contraseña:</label>
              <input 
                type="password" 
                required 
                value={loginData.password} 
                onChange={e => setLoginData({...loginData, password: e.target.value})} 
                placeholder="123"
              />
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
        <span style={{ marginLeft: 'auto', fontSize: '11px' }}>{config.nombreEmpresa} | Sistema POS Nube (Firestore Optimizado)</span>
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
        <ReportsModule active={activeModule === 'reportes'} sales={sales} products={products} clients={clients} config={config} setConfig={setConfig} setReportsZ={setReportsZ} reportsZ={reportsZ} />
        <AccountsModule active={activeModule === 'cuentas'} accounts={accounts} movements={movements} />
        <UsersModule active={activeModule === 'usuarios'} users={users} setUsers={setUsers} onOpenModal={openModal} notify={notify} />
        <ConfigModule active={activeModule === 'config'} onOpenModal={openModal} config={config} setConfig={setConfig} notify={notify} />
      </div>
      <div className="status-bar">
        <span> Usuario: {loginData.username}</span>
        <span> Tasa: {config.tasa}</span>
        <span> Ventas Hoy: {sales.filter(s => new Date(s.fecha).toDateString() === new Date().toDateString() && s.estado === 'Completada').length}</span>
        <span> Conexión: <span style={{color:'green', fontWeight:'bold'}}>CLOUD SYNC OK</span></span>
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
        presupuestos={() => {}} 
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
