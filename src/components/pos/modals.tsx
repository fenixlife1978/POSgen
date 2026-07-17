
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Product, Client, Provider, Sale, Account, CartItem, User, InventoryMovement } from '@/types/pos';
import { v4 as uuidv4 } from 'uuid';
import { 
  Wallet, Search, Trash2, Save, CreditCard, UserPlus, 
  Shield, Mail, Key, Package, UserCircle, Truck, 
  RefreshCcw, AlertCircle, TrendingUp, DollarSign,
  PlusCircle, MinusCircle, FileText, UserCheck, Plus
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, setDoc, writeBatch, deleteDoc, updateDoc, increment } from 'firebase/firestore';
import { createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth';
import { initializeApp, getApp } from 'firebase/app';

interface ModalsProps {
  activeModal: string | null;
  onClose: () => void;
  onOpenModal: (id: string, dataId?: any) => void;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  providers: Provider[];
  setProviders: React.Dispatch<React.SetStateAction<Provider[]>>;
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  accounts: Account[];
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  presupuestos: any;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  config: any;
  setConfig: React.Dispatch<React.SetStateAction<any>>;
  notify: any;
  selectedRow: number;
  editingId: any;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  movements: InventoryMovement[];
  setMovements: React.Dispatch<React.SetStateAction<InventoryMovement[]>>;
}

export function Modals({ 
  activeModal, onClose, products, setProducts, clients, setClients, 
  providers, setProviders, sales, setSales, accounts, setAccounts, 
  cart, setCart, config, setConfig, notify, editingId, users, setUsers,
  movements, setMovements
}: ModalsProps) {
  
  const methodRef = useRef<HTMLSelectElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  // Form states
  const [productForm, setProductForm] = useState<Product | any>({
    codigo: '', nombre: '', categoria: 'REPUESTOS', marca: 'GENERICO', 
    costoPromedio: 0, utilidadPorcentaje: 30, precio1: 0, precio2: 0, precio3: 0, precio4: 0,
    stock: 0, stockMin: 5, iva: 16, activo: true, isService: false
  });

  const [clientForm, setClientForm] = useState<Client | any>({
    tipoRif: 'V', rifNum: '', nombre: '', telefono: '', email: '', direccion: '', saldo: 0, tipo: 'Contribuyente'
  });

  const [providerForm, setProviderForm] = useState<Provider | any>({
    id: '', rif: '', nombre: '', direccion: '', contacto: '', telefono: ''
  });

  // Estado para Entrada por Compra (Recepción) idéntico a la imagen
  const [entradaHeader, setEntradaHeader] = useState({
    proveedor: '',
    nroFactura: '00021',
    tasaBcv: 36.5,
    tipoCompra: 'Mixto',
    diasCredito: 7,
    pagoContadoUsd: 0,
    pagoContadoBs: 0
  });
  const [entradaSearch, setEntradaSearch] = useState('');
  const [entradaCart, setEntradaCart] = useState<any[]>([]);

  const [inventoryForm, setInventoryForm] = useState({
    codigo: '', cantidad: 0, costo: 0, referencia: '', comentario: ''
  });

  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'Cajero', password: '' });
  const [paymentState, setPaymentState] = useState({ method: 'Efectivo USD', amount: 0, payments: [] as any[], totalPaidUsd: 0 });
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  // Efecto para cargar datos al editar
  useEffect(() => {
    if (activeModal === 'modalProducto' && editingId !== null) {
      setProductForm(products[editingId]);
    } else if (activeModal === 'modalCliente' && editingId !== null) {
      setClientForm(clients[editingId]);
    } else if (activeModal === 'modalProveedor' && editingId !== null) {
      const p = providers.find(prov => prov.id === editingId);
      if (p) setProviderForm(p);
    } else if (activeModal === 'modalProcesar') {
      setPaymentState({ method: 'Efectivo USD', amount: 0, payments: [], totalPaidUsd: 0 });
      setTimeout(() => methodRef.current?.focus(), 100);
    } else if (activeModal === 'modalEntrada') {
      setEntradaHeader({
        proveedor: '',
        nroFactura: '00021',
        tasaBcv: config.tasa || 36.5,
        tipoCompra: 'Mixto',
        diasCredito: 7,
        pagoContadoUsd: 0,
        pagoContadoBs: 0
      });
      setEntradaCart([]);
    } else if (activeModal === 'modalAjuste') {
      setInventoryForm({ codigo: '', cantidad: 0, costo: 0, referencia: '', comentario: '' });
    }
  }, [activeModal, editingId, products, clients, providers, config.tasa]);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'products', productForm.codigo), productForm);
      notify('✅ Producto guardado exitosamente');
      onClose();
    } catch (error) {
      notify('❌ Error al guardar producto', 'error');
    }
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = `${clientForm.tipoRif}-${clientForm.rifNum}`;
    try {
      await setDoc(doc(db, 'clients', id), clientForm);
      notify('✅ Cliente guardado');
      onClose();
    } catch (error) {
      notify('❌ Error al guardar cliente', 'error');
    }
  };

  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = providerForm.rif || uuidv4();
    try {
      await setDoc(doc(db, 'providers', id), { ...providerForm, id });
      notify('✅ Proveedor guardado');
      onClose();
    } catch (error) {
      notify('❌ Error al guardar proveedor', 'error');
    }
  };

  const addToEntrada = (product: Product) => {
    const existing = entradaCart.find(item => item.codigo === product.codigo);
    if (existing) {
      setEntradaCart(entradaCart.map(item => item.codigo === product.codigo ? { ...item, cant: item.cant + 1 } : item));
    } else {
      setEntradaCart([...entradaCart, {
        codigo: product.codigo,
        descripcion: product.nombre,
        cant: 1,
        costoUsd: product.costoPromedio,
        subtotal: product.costoPromedio
      }]);
    }
    setEntradaSearch('');
  };

  const handleProcesarEntrada = async () => {
    if (entradaCart.length === 0) return notify('❌ No hay items en la compra', 'error');
    
    try {
      const batch = writeBatch(db);
      for (const item of entradaCart) {
        const product = products.find(p => p.codigo === item.codigo);
        if (product) {
          const stockPrevio = product.stock;
          const stockNuevo = stockPrevio + item.cant;
          const logId = uuidv4();
          
          batch.update(doc(db, 'products', product.codigo), { 
            stock: stockNuevo,
            costoPromedio: item.costoUsd 
          });
          
          batch.set(doc(db, `products/${product.codigo}/logs`, logId), {
            id: logId,
            fecha: new Date().toISOString(),
            codigoProducto: product.codigo,
            tipo: 'ENTRADA',
            cantidad: item.cant,
            stockPrevio,
            stockNuevo,
            costo: item.costoUsd,
            referencia: entradaHeader.nroFactura,
            comentario: `Entrada por compra - Fact: ${entradaHeader.nroFactura}`,
            usuario: config.vendedor
          });
        }
      }
      await batch.commit();
      notify('✅ Entrada procesada exitosamente');
      onClose();
    } catch (error) {
      notify('❌ Error al procesar entrada', 'error');
    }
  };

  const handleInventoryOperation = async (type: 'AJUSTE') => {
    if (!inventoryForm.codigo || inventoryForm.cantidad === 0) {
      return notify('❌ Datos de inventario inválidos', 'error');
    }

    const product = products.find(p => p.codigo === inventoryForm.codigo);
    if (!product) return notify('❌ Producto no encontrado', 'error');

    try {
      const batch = writeBatch(db);
      const stockPrevio = product.stock;
      const stockNuevo = stockPrevio + inventoryForm.cantidad;
      const logId = uuidv4();

      batch.update(doc(db, 'products', product.codigo), { stock: stockNuevo });
      batch.set(doc(db, `products/${product.codigo}/logs`, logId), {
        id: logId,
        fecha: new Date().toISOString(),
        codigoProducto: product.codigo,
        tipo: type,
        cantidad: inventoryForm.cantidad,
        stockPrevio,
        stockNuevo,
        costo: inventoryForm.costo || product.costoPromedio,
        referencia: inventoryForm.referencia || 'MANUAL',
        comentario: inventoryForm.comentario,
        usuario: config.vendedor
      });

      await batch.commit();
      notify(`✅ Ajuste procesado`);
      onClose();
    } catch (error) {
      notify('❌ Error en operación de inventario', 'error');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      };

      let secondaryApp;
      try { secondaryApp = getApp('SecondaryApp'); } catch (e) { 
        secondaryApp = initializeApp(firebaseConfig, 'SecondaryApp'); 
      }
      
      const secondaryAuth = getAuth(secondaryApp);
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, userForm.email, userForm.password);
      const uid = userCredential.user.uid;

      const newUserProfile = {
        id: uid, name: userForm.name, email: userForm.email, role: userForm.role, 
        active: true, createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', uid), newUserProfile);
      await secondaryAuth.signOut();
      
      notify('✅ Usuario creado exitosamente');
      onClose();
    } catch (error: any) {
      notify(`❌ Error: ${error.message}`, 'error');
    }
  };

  const finalizeSale = async () => {
    const totalUsd = cart.reduce((acc, item) => acc + (item.precioUsd * item.cantidad * (1 + item.iva / 100)), 0);
    const batch = writeBatch(db);
    const saleId = uuidv4();
    const sale: Sale = {
      numero: `FAC-${(sales.length + 1).toString().padStart(6, '0')}`,
      fecha: new Date().toISOString(),
      cliente: 'Consumidor Final',
      rif: 'V-00000000-0',
      vendedor: config.vendedor,
      items: [...cart],
      subtotal: cart.reduce((acc, it) => acc + (it.precioUsd * it.cantidad), 0),
      iva: cart.reduce((acc, it) => acc + (it.precioUsd * it.cantidad * (it.iva / 100)), 0),
      totalUsd: totalUsd,
      totalBs: Math.round(totalUsd * config.tasa * 100) / 100,
      pago: paymentState.payments.map(p => p.method).join(', '),
      detallesPago: [...paymentState.payments],
      recibidoUsd: paymentState.totalPaidUsd,
      recibidoBs: Math.round(paymentState.totalPaidUsd * config.tasa * 100) / 100,
      cambioUsd: Math.max(0, Math.round((paymentState.totalPaidUsd - totalUsd) * 100) / 100),
      referencia: uuidv4().slice(0, 8),
      credito: paymentState.totalPaidUsd < totalUsd,
      estado: 'Completada'
    };

    batch.set(doc(db, 'sales', saleId), sale);
    
    for (const item of cart) {
      const product = products[item.productIndex];
      if (!product.isService) {
        const newStock = product.stock - item.cantidad;
        batch.update(doc(db, 'products', product.codigo), { stock: newStock });
        const logId = uuidv4();
        batch.set(doc(db, `products/${product.codigo}/logs`, logId), {
          id: logId, fecha: sale.fecha, codigoProducto: product.codigo, tipo: 'VENTA', 
          cantidad: -item.cantidad, stockPrevio: product.stock, stockNuevo: newStock, 
          costo: product.costoPromedio, referencia: sale.numero, usuario: config.vendedor
        });
      }
    }

    await batch.commit();
    setLastSale(sale);
    setCart([]);
    notify('✅ Venta procesada');
    onClose();
  };

  if (!activeModal && !lastSale) return null;

  return (
    <div className="modal-overlay active" onClick={() => { if(!lastSale) onClose(); else setLastSale(null); }}>
      
      {/* MODAL FICHA MAESTRA PRODUCTO */}
      {activeModal === 'modalProducto' && (
        <div className="modal-window xlarge" onClick={e => e.stopPropagation()}>
          <div className="modal-titlebar">
            <span className="flex items-center gap-2"><Package size={16}/> FICHA MAESTRA DE ITEM</span>
            <span className="modal-close" onClick={onClose}>✕</span>
          </div>
          <form onSubmit={handleSaveProduct}>
            <div className="modal-body">
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-1 space-y-4">
                  <div className="win-window p-4 bg-gray-300">
                    <div className="form-group">
                      <label>Código Interno:</label>
                      <input type="text" required value={productForm.codigo} onChange={e => setProductForm({...productForm, codigo: e.target.value.toUpperCase()})} className="win-input font-bold" disabled={editingId !== null} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Tipo de Item:</label>
                    <select className="win-input" value={productForm.isService ? 'true' : 'false'} onChange={e => setProductForm({...productForm, isService: e.target.value === 'true'})}>
                      <option value="false">📦 Producto Físico</option>
                      <option value="true">🛠️ Servicio / Mano de Obra</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Marca:</label>
                    <input type="text" value={productForm.marca} onChange={e => setProductForm({...productForm, marca: e.target.value})} className="win-input" />
                  </div>
                  <div className="form-group">
                    <label>Categoría:</label>
                    <select className="win-input" value={productForm.categoria} onChange={e => setProductForm({...productForm, categoria: e.target.value})}>
                      <option value="REPUESTOS">REPUESTOS</option>
                      <option value="LUBRICANTES">LUBRICANTES</option>
                      <option value="ACCESORIOS">ACCESORIOS</option>
                      <option value="SERVICIOS">SERVICIOS</option>
                    </select>
                  </div>
                </div>

                <div className="col-span-2 space-y-4">
                  <div className="form-group">
                    <label>Nombre / Descripción del Artículo:</label>
                    <input type="text" required value={productForm.nombre} onChange={e => setProductForm({...productForm, nombre: e.target.value})} className="win-input font-bold" />
                  </div>
                  
                  <div className="settings-section">
                    <h3>💰 Costos y Precios (USD)</h3>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="form-group">
                        <label>Costo Prom.:</label>
                        <input type="number" step="0.01" value={productForm.costoPromedio} onChange={e => {
                          const costo = parseFloat(e.target.value) || 0;
                          setProductForm({...productForm, costoPromedio: costo, precio1: Math.round(costo * (1 + productForm.utilidadPorcentaje/100) * 100)/100});
                        }} className="win-input" />
                      </div>
                      <div className="form-group">
                        <label>Utilidad %:</label>
                        <input type="number" value={productForm.utilidadPorcentaje} onChange={e => {
                          const util = parseFloat(e.target.value) || 0;
                          setProductForm({...productForm, utilidadPorcentaje: util, precio1: Math.round(productForm.costoPromedio * (1 + util/100) * 100)/100});
                        }} className="win-input" />
                      </div>
                      <div className="form-group">
                        <label>IVA %:</label>
                        <input type="number" value={productForm.iva} onChange={e => setProductForm({...productForm, iva: parseFloat(e.target.value) || 0})} className="win-input" />
                      </div>
                      <div className="form-group">
                        <label>Activo:</label>
                        <select className="win-input" value={productForm.activo ? 'true' : 'false'} onChange={e => setProductForm({...productForm, activo: e.target.value === 'true'})}>
                          <option value="true">SÍ</option>
                          <option value="false">NO</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 mt-2">
                      <div className="form-group">
                        <label>Precio 1:</label>
                        <input type="number" step="0.01" value={productForm.precio1} onChange={e => setProductForm({...productForm, precio1: parseFloat(e.target.value) || 0})} className="win-input font-bold text-blue-800" />
                      </div>
                      <div className="form-group">
                        <label>Precio 2:</label>
                        <input type="number" step="0.01" value={productForm.precio2} onChange={e => setProductForm({...productForm, precio2: parseFloat(e.target.value) || 0})} className="win-input" />
                      </div>
                      <div className="form-group">
                        <label>Precio 3:</label>
                        <input type="number" step="0.01" value={productForm.precio3} onChange={e => setProductForm({...productForm, precio3: parseFloat(e.target.value) || 0})} className="win-input" />
                      </div>
                      <div className="form-group">
                        <label>Precio 4:</label>
                        <input type="number" step="0.01" value={productForm.precio4} onChange={e => setProductForm({...productForm, precio4: parseFloat(e.target.value) || 0})} className="win-input" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="win-window p-3 bg-blue-100">
                      <div className="form-group">
                        <label>Stock Actual:</label>
                        <input type="number" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: parseFloat(e.target.value) || 0})} className="win-input font-bold" disabled={editingId !== null} />
                      </div>
                    </div>
                    <div className="win-window p-3 bg-red-100">
                      <div className="form-group">
                        <label>Stock Mínimo:</label>
                        <input type="number" value={productForm.stockMin} onChange={e => setProductForm({...productForm, stockMin: parseFloat(e.target.value) || 0})} className="win-input" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary font-bold">💾 GUARDAR PRODUCTO</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL CLIENTE */}
      {activeModal === 'modalCliente' && (
        <div className="modal-window" style={{ width: '450px' }} onClick={e => e.stopPropagation()}>
          <div className="modal-titlebar">
            <span className="flex items-center gap-2"><UserCircle size={16}/> DATOS DEL CLIENTE</span>
            <span className="modal-close" onClick={onClose}>✕</span>
          </div>
          <form onSubmit={handleSaveClient}>
            <div className="modal-body space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="form-group">
                  <label>Tipo:</label>
                  <select className="win-input" value={clientForm.tipoRif} onChange={e => setClientForm({...clientForm, tipoRif: e.target.value})}>
                    <option value="V">V - Natural</option>
                    <option value="J">J - Jurídico</option>
                    <option value="G">G - Gub.</option>
                    <option value="E">E - Extranjero</option>
                  </select>
                </div>
                <div className="form-group col-span-2">
                  <label>Número de RIF/Cédula:</label>
                  <input type="text" required value={clientForm.rifNum} onChange={e => setClientForm({...clientForm, rifNum: e.target.value})} className="win-input font-bold" />
                </div>
              </div>
              <div className="form-group">
                <label>Nombre o Razón Social:</label>
                <input type="text" required value={clientForm.nombre} onChange={e => setClientForm({...clientForm, nombre: e.target.value})} className="win-input font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label>Teléfono:</label>
                  <input type="text" value={clientForm.telefono} onChange={e => setClientForm({...clientForm, telefono: e.target.value})} className="win-input" />
                </div>
                <div className="form-group">
                  <label>Email:</label>
                  <input type="email" value={clientForm.email} onChange={e => setClientForm({...clientForm, email: e.target.value})} className="win-input" />
                </div>
              </div>
              <div className="form-group">
                <label>Tipo de Contribuyente:</label>
                <select className="win-input" value={clientForm.tipo} onChange={e => setClientForm({...clientForm, tipo: e.target.value})}>
                  <option value="Contribuyente">Contribuyente Ordinario</option>
                  <option value="Especial">Sujeto Pasivo Especial</option>
                  <option value="Exento">Exento / No Contribuyente</option>
                </select>
              </div>
              <div className="form-group">
                <label>Dirección Fiscal:</label>
                <textarea value={clientForm.direccion} onChange={e => setClientForm({...clientForm, direccion: e.target.value})} className="win-input" rows={2} />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary font-bold">💾 GUARDAR CLIENTE</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL PROVEEDOR */}
      {activeModal === 'modalProveedor' && (
        <div className="modal-window" style={{ width: '450px' }} onClick={e => e.stopPropagation()}>
          <div className="modal-titlebar">
            <span className="flex items-center gap-2"><Truck size={16}/> FICHA DE PROVEEDOR</span>
            <span className="modal-close" onClick={onClose}>✕</span>
          </div>
          <form onSubmit={handleSaveProvider}>
            <div className="modal-body space-y-4">
              <div className="form-group">
                <label>RIF / Identificación:</label>
                <input type="text" required value={providerForm.rif} onChange={e => setProviderForm({...providerForm, rif: e.target.value.toUpperCase()})} className="win-input font-bold" />
              </div>
              <div className="form-group">
                <label>Razón Social:</label>
                <input type="text" required value={providerForm.nombre} onChange={e => setProviderForm({...providerForm, nombre: e.target.value})} className="win-input font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label>Persona Contacto:</label>
                  <input type="text" value={providerForm.contacto} onChange={e => setProviderForm({...providerForm, contacto: e.target.value})} className="win-input" />
                </div>
                <div className="form-group">
                  <label>Teléfono:</label>
                  <input type="text" value={providerForm.telefono} onChange={e => setProviderForm({...providerForm, telefono: e.target.value})} className="win-input" />
                </div>
              </div>
              <div className="form-group">
                <label>Dirección:</label>
                <textarea value={providerForm.direccion} onChange={e => setProviderForm({...providerForm, direccion: e.target.value})} className="win-input" rows={2} />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary font-bold">💾 GUARDAR PROVEEDOR</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL ENTRADA POR COMPRA (RECEPCIÓN) - RESTAURADO IDÉNTICO A LA IMAGEN */}
      {activeModal === 'modalEntrada' && (
        <div className="modal-window xlarge" onClick={e => e.stopPropagation()}>
          <div className="modal-titlebar">
            <span className="flex items-center gap-2"><PlusCircle size={16}/> ENTRADA POR COMPRA (RECEPCIÓN)</span>
            <span className="modal-close" onClick={onClose}>✕</span>
          </div>
          <div className="modal-body" style={{ padding: '15px' }}>
             <div className="win-window p-6 mb-6" style={{ background: '#c0c0c0', border: '2px solid #808080' }}>
                <div className="grid grid-cols-3 gap-6">
                   <div className="form-group">
                      <label className="font-bold">Proveedor:</label>
                      <input 
                        type="text" 
                        value={entradaHeader.proveedor} 
                        onChange={e => setEntradaHeader({...entradaHeader, proveedor: e.target.value})}
                        className="win-input bg-white" 
                      />
                   </div>
                   <div className="form-group">
                      <label className="font-bold">Nro Factura:</label>
                      <input 
                        type="text" 
                        value={entradaHeader.nroFactura} 
                        onChange={e => setEntradaHeader({...entradaHeader, nroFactura: e.target.value})}
                        className="win-input bg-white" 
                      />
                   </div>
                   <div className="form-group">
                      <label className="font-bold">Tasa BCV:</label>
                      <input 
                        type="number" 
                        value={entradaHeader.tasaBcv} 
                        onChange={e => setEntradaHeader({...entradaHeader, tasaBcv: parseFloat(e.target.value) || 0})}
                        className="win-input bg-white" 
                      />
                   </div>
                </div>
                <div className="grid grid-cols-4 gap-6 mt-4">
                   <div className="form-group">
                      <label className="font-bold">Tipo Compra:</label>
                      <select 
                        value={entradaHeader.tipoCompra} 
                        onChange={e => setEntradaHeader({...entradaHeader, tipoCompra: e.target.value})}
                        className="win-input bg-white"
                      >
                        <option value="Mixto">Mixto</option>
                        <option value="Contado">Contado</option>
                        <option value="Crédito">Crédito</option>
                      </select>
                   </div>
                   <div className="form-group">
                      <label className="font-bold">Días Crédito:</label>
                      <input 
                        type="number" 
                        value={entradaHeader.diasCredito} 
                        onChange={e => setEntradaHeader({...entradaHeader, diasCredito: parseInt(e.target.value) || 0})}
                        className="win-input bg-white" 
                      />
                   </div>
                   <div className="form-group">
                      <label className="font-bold">Pago Contado (USD):</label>
                      <input 
                        type="number" 
                        value={entradaHeader.pagoContadoUsd} 
                        onChange={e => setEntradaHeader({...entradaHeader, pagoContadoUsd: parseFloat(e.target.value) || 0})}
                        className="win-input bg-white" 
                      />
                   </div>
                   <div className="form-group">
                      <label className="font-bold">Pago Contado (Bs.):</label>
                      <input 
                        type="number" 
                        value={entradaHeader.pagoContadoBs} 
                        onChange={e => setEntradaHeader({...entradaHeader, pagoContadoBs: parseFloat(e.target.value) || 0})}
                        className="win-input bg-white" 
                      />
                   </div>
                </div>
             </div>

             <div className="toolbar bg-gray-300 p-3 flex gap-3 mb-4 items-center border border-gray-500">
                <button className="btn flex items-center gap-2" onClick={() => onOpenModal('modalProducto')}><Plus size={14}/> NUEVA FICHA</button>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">🔍</span>
                  <input 
                    type="text" 
                    placeholder="Buscar producto por código o nombre..." 
                    className="win-input w-full pl-8 bg-white"
                    value={entradaSearch}
                    onChange={e => setEntradaSearch(e.target.value)}
                  />
                  {entradaSearch && (
                    <div className="search-dropdown active" style={{ top: '100%', left: 0, width: '100%' }}>
                      {products.filter(p => !p.isService && (p.codigo.toLowerCase().includes(entradaSearch.toLowerCase()) || p.nombre.toLowerCase().includes(entradaSearch.toLowerCase()))).map(p => (
                        <div key={p.codigo} className="search-dropdown-item" onClick={() => addToEntrada(p)}>
                          {p.codigo} - {p.nombre} (Stock: {p.stock})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button className="btn flex items-center gap-2"><Plus size={14}/> AÑADIR ITEM</button>
             </div>

             <div className="table-responsive" style={{ height: '300px', background: 'white', border: '2px solid #808080' }}>
                <table className="data-table">
                   <thead>
                      <tr>
                        <th style={{ background: '#c0c0c0' }}>Código</th>
                        <th style={{ background: '#c0c0c0' }}>Descripción</th>
                        <th style={{ background: '#c0c0c0', textAlign: 'center' }}>Cant</th>
                        <th style={{ background: '#c0c0c0', textAlign: 'right' }}>Costo USD</th>
                        <th style={{ background: '#c0c0c0', textAlign: 'right' }}>Subtotal</th>
                        <th style={{ background: '#c0c0c0', textAlign: 'center' }}>Acción</th>
                      </tr>
                   </thead>
                   <tbody>
                      {entradaCart.map((item, i) => (
                        <tr key={i}>
                          <td>{item.codigo}</td>
                          <td className="font-bold">{item.descripcion}</td>
                          <td style={{ textAlign: 'center' }}>
                            <input 
                              type="number" 
                              value={item.cant} 
                              onChange={e => {
                                const val = parseFloat(e.target.value) || 0;
                                setEntradaCart(entradaCart.map((it, idx) => idx === i ? {...it, cant: val, subtotal: val * it.costoUsd} : it));
                              }}
                              className="w-16 text-center border"
                            />
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <input 
                              type="number" 
                              value={item.costoUsd} 
                              onChange={e => {
                                const val = parseFloat(e.target.value) || 0;
                                setEntradaCart(entradaCart.map((it, idx) => idx === i ? {...it, costoUsd: val, subtotal: it.cant * val} : it));
                              }}
                              className="w-20 text-right border"
                            />
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold' }}>${item.subtotal.toFixed(2)}</td>
                          <td style={{ textAlign: 'center' }}>
                             <button onClick={() => setEntradaCart(entradaCart.filter((_, idx) => idx !== i))} className="text-red-600">🗑️</button>
                          </td>
                        </tr>
                      ))}
                      {entradaCart.length === 0 && (
                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: '100px', color: '#808080' }}>No hay items cargados en esta compra</td></tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
          <div className="modal-footer" style={{ padding: '15px' }}>
            <button className="btn" style={{ padding: '8px 25px' }} onClick={onClose}>Cancelar</button>
            <button 
              className="btn font-bold flex items-center gap-2" 
              style={{ background: '#f5f5ff', border: '2px solid #5c5ce0', padding: '8px 25px' }}
              onClick={handleProcesarEntrada}
            >
              <FileText size={16} style={{ color: '#5c5ce0' }}/> PROCESAR ENTRADA
            </button>
          </div>
        </div>
      )}

      {/* MODAL AJUSTE INVENTARIO */}
      {activeModal === 'modalAjuste' && (
        <div className="modal-window" style={{ width: '400px' }} onClick={e => e.stopPropagation()}>
          <div className="modal-titlebar">
            <span className="flex items-center gap-2"><RefreshCcw size={16}/> AJUSTE DE INVENTARIO</span>
            <span className="modal-close" onClick={onClose}>✕</span>
          </div>
          <div className="modal-body space-y-4">
            <div className="form-group">
              <label>Seleccionar Producto:</label>
              <select 
                className="win-input font-bold" 
                value={inventoryForm.codigo} 
                onChange={e => setInventoryForm({...inventoryForm, codigo: e.target.value})}
              >
                <option value="">-- Seleccionar --</option>
                {products.filter(p => !p.isService).map(p => (
                  <option key={p.codigo} value={p.codigo}>{p.codigo} - {p.nombre} (Stock: {p.stock})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label>Cantidad (+/-):</label>
                <input 
                  type="number" 
                  value={inventoryForm.cantidad || ''} 
                  onChange={e => setInventoryForm({...inventoryForm, cantidad: parseFloat(e.target.value) || 0})} 
                  className="win-input text-right font-bold"
                />
              </div>
              <div className="form-group">
                <label>Costo Actual:</label>
                <input 
                  type="number" 
                  value={inventoryForm.costo || ''} 
                  onChange={e => setInventoryForm({...inventoryForm, costo: parseFloat(e.target.value) || 0})} 
                  className="win-input text-right"
                  placeholder="Opcional"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Referencia / Documento:</label>
              <input 
                type="text" 
                value={inventoryForm.referencia} 
                onChange={e => setInventoryForm({...inventoryForm, referencia: e.target.value})} 
                className="win-input"
                placeholder="N° Ajuste, Inventario, etc."
              />
            </div>
            <div className="form-group">
              <label>Comentario:</label>
              <textarea 
                value={inventoryForm.comentario} 
                onChange={e => setInventoryForm({...inventoryForm, comentario: e.target.value})} 
                className="win-input" 
                rows={2} 
              />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={onClose}>Cancelar</button>
            <button 
              className="btn font-bold btn-primary"
              onClick={() => handleInventoryOperation('AJUSTE')}
            >
              🚀 PROCESAR AJUSTE
            </button>
          </div>
        </div>
      )}

      {/* MODAL COBRO POS (PROCESAR) */}
      {activeModal === 'modalProcesar' && (
        <div className="modal-window" style={{ width: '420px' }} onClick={e => e.stopPropagation()}>
          <div className="modal-titlebar">
            <span className="flex items-center gap-2"><CreditCard size={16}/> PROCESAR COBRO</span>
            <span className="modal-close" onClick={onClose}>✕</span>
          </div>
          <div className="modal-body space-y-4">
             <div className="win-window p-4 bg-gray-200 text-center border-b-4 border-primary">
                <div className="text-[10px] font-bold uppercase text-gray-600">Total a Cobrar</div>
                <div className="text-4xl font-black text-primary">${cart.reduce((s, i) => s + (i.precioUsd * i.cantidad * (1 + i.iva/100)), 0).toFixed(2)}</div>
                <div className="text-xs font-bold text-gray-500 mt-1">
                  EQV. BS: { (cart.reduce((s, i) => s + (i.precioUsd * i.cantidad * (1 + i.iva/100)), 0) * config.tasa).toLocaleString('es-VE', {minimumFractionDigits:2}) }
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
               <div className="form-group">
                  <label>Método:</label>
                  <select ref={methodRef} value={paymentState.method} onChange={e => setPaymentState({...paymentState, method: e.target.value})} className="win-input font-bold">
                    <option value="Efectivo USD">💵 Efectivo USD</option>
                    <option value="Efectivo Bs.">💸 Efectivo Bs.</option>
                    <option value="Pagomovil">📲 Pagomovil</option>
                    <option value="Punto de Venta">💳 Punto de Venta</option>
                    <option value="Zelle">🏦 Zelle</option>
                  </select>
               </div>
               <div className="form-group">
                  <label>Monto Recibido:</label>
                  <input 
                    ref={amountRef} type="number" 
                    value={paymentState.amount || ''} 
                    onChange={e => setPaymentState({...paymentState, amount: parseFloat(e.target.value) || 0})} 
                    className="win-input font-bold text-lg text-right" 
                  />
               </div>
             </div>

             <button className="btn btn-primary w-full py-2 font-bold" onClick={() => {
                if (!paymentState.amount) return;
                const usd = paymentState.method.includes('USD') || paymentState.method === 'Zelle' ? paymentState.amount : paymentState.amount / config.tasa;
                const bs = paymentState.method.includes('Bs.') || paymentState.method === 'Pagomovil' || paymentState.method === 'Punto de Venta' ? paymentState.amount : paymentState.amount * config.tasa;
                const newPays = [...paymentState.payments, { method: paymentState.method, usd, bs }];
                setPaymentState({...paymentState, payments: newPays, totalPaidUsd: newPays.reduce((s, p) => s + p.usd, 0), amount: 0});
             }}>➕ REGISTRAR PAGO</button>

             <div className="win-window p-3 bg-gray-300 space-y-2 border-2 border-gray-400">
                <div className="flex justify-between text-lg font-black pt-2">
                  <span>FALTANTE:</span> 
                  <span className={cart.reduce((s, i) => s + (i.precioUsd * i.cantidad * (1 + i.iva/100)), 0) - paymentState.totalPaidUsd > 0 ? "text-red-600" : "text-green-600"}>
                    ${Math.max(0, cart.reduce((s, i) => s + (i.precioUsd * i.cantidad * (1 + i.iva/100)), 0) - paymentState.totalPaidUsd).toFixed(2)}
                  </span>
                </div>
             </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={onClose}>Volver</button>
            <button 
              className="btn btn-success font-black text-lg px-8 py-2" 
              disabled={paymentState.totalPaidUsd < cart.reduce((s, i) => s + (i.precioUsd * i.cantidad * (1 + i.iva/100)), 0) * 0.99}
              onClick={finalizeSale}
            >
              💾 FINALIZAR VENTA
            </button>
          </div>
        </div>
      )}

      {/* MODAL NUEVO USUARIO */}
      {activeModal === 'modalNuevoUsuario' && (
        <div className="modal-window" style={{ width: '400px' }} onClick={e => e.stopPropagation()}>
          <div className="modal-titlebar">
            <span className="flex items-center gap-2"><UserPlus size={16}/> CREAR NUEVO OPERADOR</span>
            <span className="modal-close" onClick={onClose}>✕</span>
          </div>
          <form onSubmit={handleCreateUser}>
            <div className="modal-body space-y-4">
              <div className="form-group">
                <label>Nombre Completo:</label>
                <input type="text" required value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} className="win-input" />
              </div>
              <div className="form-group">
                <label>Email / Correo:</label>
                <input type="email" required value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} className="win-input" />
              </div>
              <div className="form-group">
                <label>Clave Acceso:</label>
                <input type="password" required value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="win-input" />
              </div>
              <div className="form-group">
                <label>Rol:</label>
                <select className="win-input" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}>
                  <option value="Administrador">Administrador</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Cajero">Cajero</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary font-bold">💾 CREAR ACCESO</button>
            </div>
          </form>
        </div>
      )}

      {/* TICKET DE VENTA (LAST SALE) */}
      {lastSale && (
        <div className="modal-window" style={{ width: '300px', background: '#fff' }} onClick={e => e.stopPropagation()}>
          <div className="p-6 font-mono text-[10px] border-4 border-black text-black">
            <div className="text-center mb-4">
              <h2 className="text-sm font-black uppercase leading-none">{config.nombreEmpresa}</h2>
              <p className="text-[8px] mt-1">{config.rifEmpresa}</p>
            </div>
            <div className="border-y-2 border-black border-dashed py-2 mb-2 text-center font-bold">FACTURA: {lastSale.numero}</div>
            <table className="w-full mb-4">
              <tbody>
                {lastSale.items.map((item, i) => (
                  <tr key={i}>
                    <td>{item.descripcion} x{item.cantidad}</td>
                    <td className="text-right">${(item.precioUsd * item.cantidad * (1 + item.iva/100)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t-2 border-black pt-2 space-y-1 font-bold">
              <div className="flex justify-between"><span>TOTAL USD:</span> <span>${lastSale.totalUsd.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>TOTAL BS:</span> <span>{lastSale.totalBs.toFixed(2)}</span></div>
            </div>
            <div className="mt-6 flex flex-col gap-2 no-print">
              <button className="btn btn-primary w-full py-2 font-bold" onClick={() => window.print()}>🖨️ IMPRIMIR</button>
              <button className="btn w-full py-2" onClick={() => setLastSale(null)}>CERRAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
