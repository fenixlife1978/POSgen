
'use client';

import React, { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, doc, query, orderBy, limit, getDoc } from 'firebase/firestore';
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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loginData, setLoginData] = useState({ email: '', password: '', role: 'Administrador' });
  const [activeModule, setActiveModule] = useState('pos');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalStack, setModalStack] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
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

  const [clientInfo, setClientInfo] = useState({ name: 'Consumidor Final', rif: 'V-00000000-0', saldo: 0, isCredit: false });

  const [config, setConfig] = useState({
    tasa: 36.50, igtf: 3, iva: 16, rifEmpresa: 'J-12345678-9',
    nombreEmpresa: 'AUTOPARTS POS PRO', direccion: 'Av. Principal Local 10, Caracas',
    telefono: '0412-0000000', vendedor: 'ADMIN', vVendedores: ['ADMIN'],
    reportZCounter: 1, grandTotalHistory: 0, lastZDate: null as string | null, terminalId: 'CAJA-01'
  });

  useEffect(() => {
    const handler = (e: any) => openModal(e.detail);
    window.addEventListener('openModal', handler);
    return () => window.removeEventListener('openModal', handler);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setCurrentUser(userData);
            setConfig(prev => ({ ...prev, vendedor: userData.name || user.email || 'OPERADOR', terminalId: userData.terminalId || 'CAJA-01' }));
            setIsLoggedIn(true);
          } else {
            setCurrentUser({ id: user.uid, email: user.email, role: 'Administrador', name: 'Admin Cloud' });
            setIsLoggedIn(true);
          }
        } catch (error) { setIsLoggedIn(true); }
      } else { setIsLoggedIn(false); setCurrentUser(null); }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    const unsubProducts = onSnapshot(collection(db, 'products'), (s) => setProducts(s.docs.map(d => d.data() as Product)));
    const unsubClients = onSnapshot(collection(db, 'clients'), (s) => setClients(s.docs.map(d => d.data() as Client)));
    const unsubProviders = onSnapshot(collection(db, 'providers'), (s) => setProviders(s.docs.map(d => d.data() as Provider)));
    const unsubSales = onSnapshot(query(collection(db, 'sales'), orderBy('fecha', 'desc'), limit(100)), (s) => setSales(s.docs.map(d => d.data() as Sale)));
    const unsubAccounts = onSnapshot(collection(db, 'accounts'), (s) => setAccounts(s.docs.map(d => d.data() as Account)));
    const unsubUsers = onSnapshot(collection(db, 'users'), (s) => setUsers(s.docs.map(d => d.data() as User)));
    const unsubConfig = onSnapshot(doc(db, 'system', 'config'), (s) => s.exists() && setConfig(s.data() as any));
    const unsubReportsZ = onSnapshot(collection(db, 'accounting/audit/reportsZ'), (s) => setReportsZ(s.docs.map(d => d.data() as ReportZRecord)));
    const unsubMovements = onSnapshot(query(collection(db, 'inventory_movements'), orderBy('fecha', 'desc'), limit(200)), (s) => setMovements(s.docs.map(d => d.data() as InventoryMovement)));
    setIsLoaded(true);
    return () => { unsubProducts(); unsubClients(); unsubProviders(); unsubSales(); unsubAccounts(); unsubUsers(); unsubMovements(); unsubReportsZ(); unsubConfig(); };
  }, [isLoggedIn]);

  const handleLogout = async () => { await signOut(auth); setIsLoggedIn(false); };

  const notify = (msg: string, type: 'success' | 'error' | 'warning' = 'success') => {
    const el = document.getElementById('notification');
    if (el) { el.textContent = msg; el.className = `notification show ${type}`; setTimeout(() => el.className = 'notification', 3500); }
  };

  const openModal = (id: string, dataId?: any) => {
    if (activeModal && activeModal !== id) setModalStack(prev => [...prev, activeModal]);
    setEditingId(dataId || null); setActiveModal(id);
  };
  
  const closeModal = () => {
    if (modalStack.length > 0) {
      const prev = modalStack[modalStack.length - 1];
      setModalStack(prevStack => prevStack.slice(0, -1)); setActiveModal(prev);
    } else { setActiveModal(null); setEditingId(null); }
  };

  if (!isLoggedIn) {
    return (
      <div className="login-screen">
        <div className="login-box">
          <div className="login-title">Autoparts POS - Repuestos y Lubricantes</div>
          <form onSubmit={async (e) => { e.preventDefault(); try { await signInWithEmailAndPassword(auth, loginData.email, loginData.password); } catch(e) { notify('Error de acceso', 'error'); } }}>
            <div className="form-group"><label>Email:</label><input type="email" required value={loginData.email} onChange={e => setLoginData({...loginData, email: e.target.value})} className="win-input" /></div>
            <div className="form-group"><label>Clave:</label><input type="password" required value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} className="win-input" /></div>
            <div style={{ marginTop: '20px', textAlign: 'right' }}><button type="submit" className="btn btn-primary">Entrar al Sistema</button></div>
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
        <span style={{ marginLeft: 'auto', fontSize: '11px' }}>{config.nombreEmpresa} | {currentUser?.name} ({currentUser?.role}) | Terminal: {config.terminalId}</span>
      </div>
      <div className="nav-tabs">
        {[
          { id: 'pos', label: 'Venta (POS)' }, 
          { id: 'dashboard', label: 'Resumen' }, 
          { id: 'productos', label: 'Productos' }, 
          { id: 'clientes', label: 'Clientes' }, 
          { id: 'inventario', label: 'Inventario' },
          { id: 'ventas', label: 'Historial' }, 
          { id: 'reportes', label: 'Contabilidad' }, 
          { id: 'cuentas', label: 'Cuentas x Cobrar/Pagar' }, 
          { id: 'usuarios', label: 'Usuarios' },
          { id: 'config', label: 'Ajustes' }
        ].map(m => (
          <div key={m.id} className={`nav-tab ${activeModule === m.id ? 'active' : ''}`} onClick={() => setActiveModule(m.id)}>{m.label}</div>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        <PosModule active={activeModule === 'pos'} onOpenModal={openModal} products={products} clients={clients} cart={posCart} setCart={setPosCart} config={config} notify={notify} selectedRow={selectedRow} setSelectedRow={setSelectedRow} onLogout={handleLogout} clientInfo={clientInfo} setClientInfo={setClientInfo} />
        <DashboardModule active={activeModule === 'dashboard'} sales={sales} products={products} config={config} />
        <ProductsModule active={activeModule === 'productos'} onOpenModal={openModal} products={products} tasa={config.tasa} notify={notify} />
        <ClientsModule active={activeModule === 'clientes'} onOpenModal={openModal} clients={clients} setClients={setClients} notify={notify} />
        <SalesModule active={activeModule === 'ventas'} sales={sales} setSales={setSales} products={products} setProducts={setProducts} movements={movements} setMovements={setMovements} notify={notify} onOpenModal={openModal} config={config} />
        <InventoryModule active={activeModule === 'inventario'} onOpenModal={openModal} products={products} movements={movements} />
        <ReportsModule active={activeModule === 'reportes'} sales={sales} products={products} clients={clients} config={config} setConfig={setConfig} setReportsZ={setReportsZ} reportsZ={reportsZ} onOpenModal={openModal} />
        <AccountsModule active={activeModule === 'cuentas'} accounts={accounts} movements={movements} />
        <UsersModule active={activeModule === 'usuarios'} users={users} onOpenModal={openModal} />
        <ConfigModule active={activeModule === 'config'} onOpenModal={openModal} config={config} setConfig={setConfig} notify={notify} />
      </div>
      <div className="status-bar">
        <span> Tasa actual: {config.tasa}</span>
        <button onClick={() => openModal('modalDevolucion')} style={{ border:'none', background:'none', color:'#000080', cursor:'pointer', fontSize:'11px', marginLeft:'12px'}}>PROCESAR DEVOLUCIÓN</button>
        <span style={{marginLeft:'auto'}}> CLOUD SYNC OK</span>
      </div>
      <Modals 
        activeModal={activeModal} onClose={closeModal} onOpenModal={openModal}
        products={products} setProducts={setProducts} clients={clients} setClients={setClients} 
        providers={providers} setProviders={setProviders} sales={sales} setSales={setSales} 
        accounts={accounts} setAccounts={setAccounts} presupuestos={() => {}} 
        cart={posCart} setCart={setPosCart} config={config} setConfig={setConfig} 
        notify={notify} selectedRow={selectedRow} editingId={editingId} 
        users={users} setUsers={setUsers} movements={movements} setMovements={setMovements}
        clientInfo={clientInfo}
      />
    </div>
  );
}
