
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Product, Client, Provider, Sale, Account, CartItem, User, InventoryMovement } from '@/types/pos';
import { v4 as uuidv4 } from 'uuid';
import { Wallet, Search, Trash2, Save, CreditCard, UserPlus, Shield, Mail, Key } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { doc, setDoc, writeBatch, collection } from 'firebase/firestore';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { initializeApp, deleteApp, getApp } from 'firebase/app';

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
  activeModal, onClose, products, clients, providers, sales, accounts, cart, setCart, 
  config, notify, editingId, users, setUsers,
  movements
}: ModalsProps) {
  
  const methodRef = useRef<HTMLSelectElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  // Form states
  const [productForm, setProductForm] = useState<Product | any>({});
  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'Cajero', password: '' });
  const [paymentState, setPaymentState] = useState({ method: 'Efectivo USD', amount: 0, payments: [] as any[], totalPaidUsd: 0 });
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [viewSale, setViewSale] = useState<Sale | null>(null);

  useEffect(() => {
    if (activeModal === 'modalProcesar') {
      setPaymentState({ method: 'Efectivo USD', amount: 0, payments: [], totalPaidUsd: 0 });
      setTimeout(() => methodRef.current?.focus(), 100);
    }
  }, [activeModal]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.email || !userForm.password || !userForm.name) {
      return notify('Todos los campos son obligatorios', 'error');
    }

    try {
      // Configuración de Firebase para instancia secundaria
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      };

      // Usar una app secundaria para crear el usuario sin cerrar la sesión del admin
      let secondaryApp;
      try {
        secondaryApp = getApp('SecondaryApp');
      } catch (e) {
        secondaryApp = initializeApp(firebaseConfig, 'SecondaryApp');
      }
      
      const secondaryAuth = getAuth(secondaryApp);
      
      // 1. Crear usuario en Auth
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, userForm.email, userForm.password);
      const uid = userCredential.user.uid;

      // 2. Crear perfil en Firestore usando el UID como nombre de documento
      const newUserProfile = {
        id: uid,
        name: userForm.name,
        email: userForm.email,
        role: userForm.role,
        active: true,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', uid), newUserProfile);
      
      // Cerrar sesión en la app secundaria y limpiar
      await secondaryAuth.signOut();
      
      notify('✅ Usuario creado exitosamente en Auth y Firestore');
      setUserForm({ name: '', email: '', role: 'Cajero', password: '' });
      onClose();
    } catch (error: any) {
      console.error(error);
      notify(`❌ Error: ${error.message}`, 'error');
    }
  };

  const finalizeSale = async () => {
    const totalUsd = cart.reduce((acc, item) => acc + (item.precioUsd * item.cantidad * (1 + item.iva / 100)), 0);
    if (paymentState.totalPaidUsd < totalUsd && !confirm("El monto pagado es menor al total. ¿Registrar como venta a crédito?")) {
      return;
    }

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
    
    // Actualizar inventario y logs
    for (const item of cart) {
      const product = products[item.productIndex];
      if (!product.isService) {
        const newStock = product.stock - item.cantidad;
        batch.update(doc(db, 'products', product.codigo), { stock: newStock });
        const logId = uuidv4();
        batch.set(doc(db, `products/${product.codigo}/logs`, logId), {
          id: logId, fecha: sale.fecha, codigoProducto: product.codigo, tipo: 'VENTA', cantidad: -item.cantidad, stockPrevio: product.stock, stockNuevo: newStock, costo: product.costoPromedio, referencia: sale.numero, usuario: config.vendedor
        });
      }
    }

    await batch.commit();
    setLastSale(sale);
    setCart([]);
    notify('✅ Venta procesada');
    onClose();
  };

  if (!activeModal && !lastSale && !viewSale) return null;

  return (
    <div className="modal-overlay active" onClick={() => { if(!lastSale && !viewSale) onClose(); else { setLastSale(null); setViewSale(null); } }}>
      
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
                <label className="flex items-center gap-2"><Shield size={14}/> Nombre Completo:</label>
                <input 
                  type="text" 
                  required 
                  value={userForm.name} 
                  onChange={e => setUserForm({...userForm, name: e.target.value})} 
                  className="win-input"
                  placeholder="Ej: Juan Pérez"
                />
              </div>
              <div className="form-group">
                <label className="flex items-center gap-2"><Mail size={14}/> Correo Electrónico:</label>
                <input 
                  type="email" 
                  required 
                  value={userForm.email} 
                  onChange={e => setUserForm({...userForm, email: e.target.value})} 
                  className="win-input"
                  placeholder="juan@sistema.com"
                />
              </div>
              <div className="form-group">
                <label className="flex items-center gap-2"><Key size={14}/> Contraseña:</label>
                <input 
                  type="password" 
                  required 
                  minLength={6}
                  value={userForm.password} 
                  onChange={e => setUserForm({...userForm, password: e.target.value})} 
                  className="win-input"
                  placeholder="Min. 6 caracteres"
                />
              </div>
              <div className="form-group">
                <label>Rol en Sistema:</label>
                <select 
                  value={userForm.role} 
                  onChange={e => setUserForm({...userForm, role: e.target.value})} 
                  className="win-input"
                >
                  <option value="Cajero">Cajero / Vendedor</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Administrador">Administrador</option>
                </select>
              </div>
              <div className="bg-blue-50 p-3 border border-blue-200 rounded text-[10px] text-blue-700">
                INFO: El usuario podrá ingresar usando su correo y la contraseña definida. El perfil se creará automáticamente en Firestore.
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary font-bold">💾 REGISTRAR ACCESO</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL ABONAR CUENTA */}
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
                    ref={amountRef} 
                    type="number" 
                    value={paymentState.amount || ''} 
                    onChange={e => setPaymentState({...paymentState, amount: parseFloat(e.target.value) || 0})} 
                    onKeyPress={e => e.key === 'Enter' && amountRef.current?.blur()}
                    className="win-input font-bold text-lg text-right" 
                  />
               </div>
             </div>

             <div className="flex gap-2">
               <button className="btn btn-primary flex-1 py-3 font-bold" onClick={() => {
                  if (!paymentState.amount) return;
                  const usd = paymentState.method.includes('USD') || paymentState.method === 'Zelle' ? paymentState.amount : paymentState.amount / config.tasa;
                  const bs = paymentState.method.includes('Bs.') || paymentState.method === 'Pagomovil' || paymentState.method === 'Punto de Venta' ? paymentState.amount : paymentState.amount * config.tasa;
                  const newPays = [...paymentState.payments, { method: paymentState.method, usd, bs }];
                  setPaymentState({...paymentState, payments: newPays, totalPaidUsd: newPays.reduce((s, p) => s + p.usd, 0), amount: 0});
               }}>➕ REGISTRAR PAGO</button>
               
               <button className="btn" title="Pago Exacto" onClick={() => {
                 const total = cart.reduce((s, i) => s + (i.precioUsd * i.cantidad * (1 + i.iva/100)), 0);
                 const pending = total - paymentState.totalPaidUsd;
                 const isBs = paymentState.method.includes('Bs.') || paymentState.method === 'Pagomovil' || paymentState.method === 'Punto de Venta';
                 setPaymentState({...paymentState, amount: isBs ? Math.round(pending * config.tasa * 100)/100 : Math.round(pending * 100)/100});
               }}>🎯</button>
             </div>

             <div className="win-window p-4 bg-gray-300 space-y-2 border-2 border-gray-400">
                <div className="flex justify-between text-xs font-bold text-gray-600">
                  <span>ABONADO:</span> 
                  <span>${paymentState.totalPaidUsd.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-black border-t border-gray-400 pt-2">
                  <span>FALTANTE:</span> 
                  <span className={cart.reduce((s, i) => s + (i.precioUsd * i.cantidad * (1 + i.iva/100)), 0) - paymentState.totalPaidUsd > 0 ? "text-red-600" : "text-green-600"}>
                    ${Math.max(0, cart.reduce((s, i) => s + (i.precioUsd * i.cantidad * (1 + i.iva/100)), 0) - paymentState.totalPaidUsd).toFixed(2)}
                  </span>
                </div>
                {paymentState.totalPaidUsd > cart.reduce((s, i) => s + (i.precioUsd * i.cantidad * (1 + i.iva/100)), 0) && (
                  <div className="flex justify-between text-sm font-bold text-blue-700 bg-blue-100 p-1 rounded">
                    <span>VUELTO:</span> 
                    <span>${(paymentState.totalPaidUsd - cart.reduce((s, i) => s + (i.precioUsd * i.cantidad * (1 + i.iva/100)), 0)).toFixed(2)}</span>
                  </div>
                )}
             </div>

             <div className="max-h-24 overflow-y-auto space-y-1">
                {paymentState.payments.map((p, i) => (
                  <div key={i} className="flex justify-between text-[10px] bg-white p-1 border">
                    <span className="font-bold">{p.method}</span>
                    <span>{p.method.includes('USD') || p.method === 'Zelle' ? `$${p.usd.toFixed(2)}` : `Bs. ${p.bs.toFixed(2)}`}</span>
                  </div>
                ))}
             </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={onClose}>Volver</button>
            <button 
              className="btn btn-success font-black text-lg px-8 py-2" 
              disabled={paymentState.totalPaidUsd < cart.reduce((s, i) => s + (i.precioUsd * i.cantidad * (1 + i.iva/100)), 0) * 0.99} // Margen de error 1%
              onClick={finalizeSale}
            >
              💾 FINALIZAR VENTA
            </button>
          </div>
        </div>
      )}

      {/* TICKET DE VENTA (LAST SALE) */}
      {lastSale && (
        <div className="modal-window" style={{ width: '300px', background: '#fff' }} onClick={e => e.stopPropagation()}>
          <div className="p-6 font-mono text-[10px] border-4 border-black text-black">
            <div className="text-center mb-4">
              <h2 className="text-sm font-black uppercase leading-none">{config.nombreEmpresa}</h2>
              <p className="text-[8px] mt-1">{config.rifEmpresa}</p>
              <p className="text-[8px]">{config.direccion}</p>
            </div>
            
            <div className="border-y-2 border-black border-dashed py-2 mb-2">
              <div className="flex justify-between"><span>FACTURA:</span> <span>{lastSale.numero}</span></div>
              <div className="flex justify-between"><span>FECHA:</span> <span>{new Date(lastSale.fecha).toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span>HORA:</span> <span>{new Date(lastSale.fecha).toLocaleTimeString()}</span></div>
              <div className="flex justify-between"><span>CAJERO:</span> <span>{lastSale.vendedor}</span></div>
            </div>

            <table className="w-full mb-4">
              <thead>
                <tr className="border-b border-black">
                  <th className="text-left">DESCRIPCIÓN</th>
                  <th className="text-right">CANT</th>
                  <th className="text-right">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {lastSale.items.map((item, i) => (
                  <tr key={i}>
                    <td className="py-1">{item.descripcion.slice(0, 15)}</td>
                    <td className="text-right">x{item.cantidad}</td>
                    <td className="text-right">${(item.precioUsd * item.cantidad * (1 + item.iva/100)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t-2 border-black pt-2 space-y-1">
              <div className="flex justify-between"><span>SUBTOTAL:</span> <span>${lastSale.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>IVA REC.:</span> <span>${lastSale.iva.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm font-black"><span>TOTAL USD:</span> <span>${lastSale.totalUsd.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold"><span>TOTAL BS:</span> <span>{lastSale.totalBs.toLocaleString('es-VE', {minimumFractionDigits:2})}</span></div>
            </div>

            <div className="mt-4 border-t border-black border-dotted pt-2">
              <div className="text-[8px] font-bold">PAGOS:</div>
              {lastSale.detallesPago?.map((p, i) => (
                <div key={i} className="flex justify-between text-[8px]">
                  <span>{p.method}:</span> 
                  <span>{p.method.includes('USD') || p.method === 'Zelle' ? `$${p.usd.toFixed(2)}` : `Bs. ${p.bs.toFixed(2)}`}</span>
                </div>
              ))}
            </div>

            <div className="text-center mt-8 text-[8px] font-bold">
              GRACIAS POR SU COMPRA<br/>SIN DERECHO A CRÉDITO FISCAL
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
