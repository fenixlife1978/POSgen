
'use client';

import React, { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, doc, collectionGroup, query, orderBy, limit, getDoc } from 'firebase/firestore';
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
    vVendedores: ['ADMIN'],
    reportZCounter: 1,
    grandTotalHistory: 0,
    lastZDate: null as string | null,
    terminalId: 'CAJA-01'
  });

  // Suscripción al estado de Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Intentar obtener el perfil del usuario desde Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setCurrentUser(userData);
            setConfig(prev => ({ ...prev, vendedor: userData.name || user.email }));
            setIsLoggedIn(true);
          } else {
            // Si el perfil no existe, pero hay sesión de Auth (bootstrap case)
            setCurrentUser({ email: user.email, role: 'Administrador', name: 'Administrador' });
            setIsLoggedIn(true);
          }
        } catch (error) {
          console.error("Error al cargar perfil de usuario:", error);
          setIsLoggedIn(true); // Permitir acceso básico si hay sesión
        }
      } else {
        setIsLoggedIn(false);
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Suscripción optimizada a Firestore
  useEffect(() => {
    if (!isLoggedIn) return;

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

    const unsubConfig = onSnapshot(doc(db, 'system', 'config'), (snapshot) => {
      if (snapshot.exists()) {
        setConfig(snapshot.data() as any);
      }
    });
    const unsubReportsZ = onSnapshot(collection(db, 'accounting/audit/reportsZ'), (snapshot) => {
      setReportsZ(snapshot.docs.map(doc => doc.data() as ReportZRecord));
    });

    const unsubMovements = onSnapshot(query(collectionGroup(db, 'logs'), orderBy('fecha', 'desc'), limit(200)), (snapshot) => {
      setMovements(snapshot.docs.map(doc => doc.data() as InventoryMovement));
    });

    setIsLoaded(true);
    return () => {
      unsubProducts(); unsubClients(); unsubProviders(); unsubSales();
      unsubAccounts(); unsubUsers(); unsubMovements(); unsubReportsZ(); unsubConfig();
    };
  }, [isLoggedIn]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. Autenticar en Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, loginData.email, loginData.password);
      const user = userCredential.user;

      // 2. Verificar el Rol en Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role !== loginData.role) {
          await signOut(auth);
          notify(`Acceso denegado: El usuario no tiene el rol de ${loginData.role}`, 'error');
          return;
        }
      } else {
        // Permitir primer acceso de admin si no existe perfil en Firestore
        if (loginData.email === 'admin@sistema.com' && loginData.role !== 'Administrador') {
          await signOut(auth);
          notify('El administrador principal debe seleccionar el rol de Administrador', 'error');
          return;
        }
      }

      notify('Acceso concedido. Cargando sistema...');
    } catch (error: any) {
      console.error(error);
      notify('Error de acceso. Verifique sus credenciales y el rol seleccionado.', 'error');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsLoggedIn(false);
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
          <div className="login-title">Acceso Nube - POS Pro</div>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Correo Electrónico:</label>
              <input 
                type="email" 
                required 
                value={loginData.email} 
                onChange={e => setLoginData({...loginData, email: e.target.value})} 
                placeholder="ejemplo@sistema.com"
                autoFocus 
              />
            </div>
            <div className="form-group">
              <label>Rol de Usuario:</label>
              <select 
                value={loginData.role} 
                onChange={e => setLoginData({...loginData, role: e.target.value})}
                className="win-input"
              >
                <option value="Administrador">Administrador</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Cajero">Cajero</option>
              </select>
            </div>
            <div className="form-group">
              <label>Contraseña:</label>
              <input 
                type="password" 
                required 
                value={loginData.password} 
                onChange={e => setLoginData({...loginData, password: e.target.value})} 
                placeholder="••••••••"
              />
            </div>
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button type="submit" className="btn btn-primary">Iniciar Sesión</button>
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
        <span style={{ marginLeft: 'auto', fontSize: '11px' }}>{config.nombreEmpresa} | Sesión: {currentUser?.name || auth.currentUser?.email} ({currentUser?.role})</span>
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
        ].map(m => {
          // Restricción básica de permisos en pestañas
          if (m.id === 'usuarios' && currentUser?.role !== 'Administrador') return null;
          if (m.id === 'config' && currentUser?.role !== 'Administrador') return null;
          
          return (
            <div key={m.id} className={`nav-tab ${activeModule === m.id ? 'active' : ''}`} onClick={() => setActiveModule(m.id)}>
              {m.label}
            </div>
          );
        })}
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
        <UsersModule active={activeModule === 'usuarios'} users={users} onOpenModal={openModal} />
        <ConfigModule active={activeModule === 'config'} onOpenModal={openModal} config={config} setConfig={setConfig} notify={notify} />
      </div>
      <div className="status-bar">
        <span> Usuario: {currentUser?.name || auth.currentUser?.email}</span>
        <span> Tasa: {config.tasa}</span>
        <button onClick={handleLogout} style={{ border:'none', background:'none', color:'red', cursor:'pointer', fontSize:'11px', padding:'0 10px'}}>CERRAR SESIÓN</button>
        <span style={{marginLeft:'auto'}}> Conexión: <span style={{color:'green', fontWeight:'bold'}}>CLOUD SYNC OK</span></span>
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
