
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Product, Client, Provider, Sale, Account, CartItem, User, InventoryMovement, KitComponent } from '@/types/pos';
import { v4 as uuidv4 } from 'uuid';
import { 
  Wallet, Search, Trash2, Save, CreditCard, UserPlus, 
  Shield, Mail, Key, Package, UserCircle, Truck, 
  RefreshCcw, AlertCircle, TrendingUp, DollarSign,
  PlusCircle, MinusCircle, FileText, UserCheck, Plus, Minus, Layers
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
  movements, setMovements, onOpenModal
}: ModalsProps) {
  
  const methodRef = useRef<HTMLSelectElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  // Form states
  const [productForm, setProductForm] = useState<Product | any>({
    codigo: '', nombre: '', categoria: 'Accesorio', marca: 'Toyota', 
    barcode: '', referencia: '', unidad: 'Unidad', departamento: 'Tienda',
    costoPromedio: 0, utilidadPorcentaje: 22.22, precio1: 0, precio2: 0, precio3: 0, precio4: 0,
    stock: 0, stockMin: 5, iva: 16, activo: true, isService: false, isKit: false, stockPropio: true,
    kitComponents: [], ubicacion: ''
  });

  const [kitSearch, setKitSearch] = useState('');

  // Lógica de Recálculo Tridireccional
  const handlePriceUpdate = (type: 'margin' | 'usd' | 'bs' | 'cost', value: number) => {
    let newForm = { ...productForm };
    const cost = type === 'cost' ? value : productForm.costoPromedio;
    const tasa = config.tasa || 1;

    if (type === 'cost') {
      newForm.costoPromedio = value;
      newForm.precio1 = value * (1 + (newForm.utilidadPorcentaje / 100));
    } else if (type === 'margin') {
      newForm.utilidadPorcentaje = value;
      newForm.precio1 = cost * (1 + (value / 100));
    } else if (type === 'usd') {
      newForm.precio1 = value;
      newForm.utilidadPorcentaje = cost > 0 ? ((value / cost) - 1) * 100 : 0;
    } else if (type === 'bs') {
      const usdValue = value / tasa;
      newForm.precio1 = usdValue;
      newForm.utilidadPorcentaje = cost > 0 ? ((usdValue / cost) - 1) * 100 : 0;
    }

    setProductForm(newForm);
  };

  const [clientForm, setClientForm] = useState<Client | any>({
    tipoRif: 'V', rifNum: '', nombre: '', telefono: '', email: '', direccion: '', saldo: 0, tipo: 'Contribuyente'
  });

  const [providerForm, setProviderForm] = useState<Provider | any>({
    id: '', rif: '', nombre: '', direccion: '', contacto: '', telefono: ''
  });

  const [entradaHeader, setEntradaHeader] = useState({
    proveedor: '', nroFactura: '', tasaBcv: 36.5, tipoCompra: 'Mixto', diasCredito: 7, pagoContadoUsd: 0, pagoContadoBs: 0
  });
  const [entradaSearch, setEntradaSearch] = useState('');
  const [entradaCart, setEntradaCart] = useState<any[]>([]);

  const [inventoryForm, setInventoryForm] = useState({
    codigo: '', cantidad: 0, costo: 0, referencia: '', comentario: ''
  });

  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'Cajero', password: '' });
  const [paymentState, setPaymentState] = useState({ method: 'Efectivo USD', amount: 0, payments: [] as any[], totalPaidUsd: 0 });
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  useEffect(() => {
    if (activeModal === 'modalProducto' && editingId !== null) {
      setProductForm(products[editingId]);
    } else if (activeModal === 'modalCliente' && editingId !== null) {
      setClientForm(clients[editingId]);
    } else if (activeModal === 'modalProveedor' && editingId !== null) {
      const p = providers.find(prov => prov.id === editingId);
      if (p) setProviderForm(p);
    }
  }, [activeModal, editingId, products, clients, providers]);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Si es Kit Virtual, forzamos stock a 0
      const finalProduct = { ...productForm };
      if (finalProduct.isKit && !finalProduct.stockPropio) {
        finalProduct.stock = 0;
      }
      await setDoc(doc(db, 'products', finalProduct.codigo), finalProduct);
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

  const addToKit = (product: Product) => {
    if (product.codigo === productForm.codigo) return notify('❌ No puede agregarse a sí mismo', 'error');
    const existing = productForm.kitComponents.find((c: any) => c.codigo === product.codigo);
    if (existing) return;
    
    setProductForm({
      ...productForm,
      kitComponents: [...productForm.kitComponents, { codigo: product.codigo, cantidad: 1, productIndex: products.indexOf(product) }]
    });
    setKitSearch('');
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
      
      // Si es Kit VIRTUAL, descontamos componentes
      if (item.isKit && !item.stockPropio) {
        for (const comp of product.kitComponents) {
          const compProd = products.find(p => p.codigo === comp.codigo);
          if (compProd) {
            const qtyToDeduct = comp.cantidad * item.cantidad;
            const newStock = compProd.stock - qtyToDeduct;
            batch.update(doc(db, 'products', compProd.codigo), { stock: newStock });
            
            const logId = uuidv4();
            batch.set(doc(db, `products/${compProd.codigo}/logs`, logId), {
              id: logId, fecha: sale.fecha, codigoProducto: compProd.codigo, tipo: 'VENTA', 
              cantidad: -qtyToDeduct, stockPrevio: compProd.stock, stockNuevo: newStock, 
              costo: compProd.costoPromedio, referencia: `${sale.numero} (KIT: ${product.codigo})`, usuario: config.vendedor
            });
          }
        }
      } else if (!product.isService) {
        // Venta normal o Kit con Stock Propio
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
    notify('✅ Venta procesada exitosamente');
    onClose();
  };

  if (!activeModal && !lastSale) return null;

  return (
    <div className="modal-overlay active" onClick={() => { if(!lastSale) onClose(); else setLastSale(null); }}>
      
      {activeModal === 'modalProducto' && (
        <div className="modal-window xlarge" onClick={e => e.stopPropagation()} style={{ width: '850px', maxHeight: '90vh' }}>
          <div className="win-titlebar">
            <span className="flex items-center gap-2"><Package size={14}/> FICHA MAESTRA DE PRODUCTO</span>
            <span className="modal-close" onClick={onClose}></span>
          </div>
          <form onSubmit={handleSaveProduct}>
            <div className="modal-body overflow-y-auto" style={{ padding: '15px' }}>
              <div className="grid grid-cols-3 gap-6 mb-6">
                {/* Columna 1: Identificación */}
                <div className="win-window p-4" style={{ background: '#c0c0c0', border: '1px solid #808080' }}>
                   <div className="form-group mb-4">
                      <label className="font-bold">Código Interno:</label>
                      <input type="text" required value={productForm.codigo} onChange={e => setProductForm({...productForm, codigo: e.target.value.toUpperCase()})} className="win-input font-bold" />
                   </div>
                   <div className="form-group mb-4">
                      <label className="font-bold">Código de Barras (Manual/Lector):</label>
                      <div className="flex gap-2">
                        <input type="text" value={productForm.barcode} onChange={e => setProductForm({...productForm, barcode: e.target.value})} className="win-input flex-1" />
                        <button type="button" className="btn px-2"><Search size={14}/></button>
                      </div>
                   </div>
                   <div className="form-group mb-4">
                      <label className="font-bold">Nombre del Producto:</label>
                      <input type="text" required value={productForm.nombre} onChange={e => setProductForm({...productForm, nombre: e.target.value})} className="win-input" />
                   </div>
                   <div className="form-group">
                      <label className="font-bold">Referencia / OEM:</label>
                      <input type="text" value={productForm.referencia} onChange={e => setProductForm({...productForm, referencia: e.target.value})} className="win-input" />
                   </div>
                </div>

                {/* Columna 2: Categorización */}
                <div className="win-window p-4" style={{ background: '#c0c0c0', border: '1px solid #808080' }}>
                   <div className="form-group mb-4">
                      <label className="font-bold">Marca:</label>
                      <div className="flex gap-1">
                        <select className="win-input flex-1" value={productForm.marca} onChange={e => setProductForm({...productForm, marca: e.target.value})}>
                          <option value="Toyota">Toyota</option>
                          <option value="Mazda">Mazda</option>
                          <option value="Ford">Ford</option>
                        </select>
                        <button type="button" className="btn px-2"><Plus size={10}/></button>
                        <button type="button" className="btn px-2"><Minus size={10}/></button>
                      </div>
                   </div>
                   <div className="form-group mb-4">
                      <label className="font-bold">Unidad de Medida:</label>
                      <div className="flex gap-1">
                        <select className="win-input flex-1" value={productForm.unidad} onChange={e => setProductForm({...productForm, unidad: e.target.value})}>
                          <option value="Unidad">Unidad</option>
                          <option value="Litro">Litro</option>
                        </select>
                        <button type="button" className="btn px-2"><Plus size={10}/></button>
                      </div>
                   </div>
                   <div className="form-group mb-4">
                      <label className="font-bold">Categoría:</label>
                      <div className="flex gap-1">
                        <select className="win-input flex-1" value={productForm.categoria} onChange={e => setProductForm({...productForm, categoria: e.target.value})}>
                          <option value="Accesorio">Accesorio</option>
                          <option value="Lubricante">Lubricante</option>
                        </select>
                        <button type="button" className="btn px-2"><Plus size={10}/></button>
                      </div>
                   </div>
                   <div className="form-group">
                      <label className="font-bold">Departamento:</label>
                      <div className="flex gap-1">
                        <select className="win-input flex-1" value={productForm.departamento} onChange={e => setProductForm({...productForm, departamento: e.target.value})}>
                          <option value="Tienda">Tienda</option>
                          <option value="Taller">Taller</option>
                        </select>
                        <button type="button" className="btn px-2"><Plus size={10}/></button>
                      </div>
                   </div>
                </div>

                {/* Columna 3: Finanzas (Tridireccional) */}
                <div className="win-window p-4" style={{ background: '#c0c0c0', border: '1px solid #808080' }}>
                   <div className="form-group mb-4">
                      <label className="font-bold text-red-800">Costo Actual (USD):</label>
                      <input 
                        type="number" step="0.01" value={productForm.costoPromedio} 
                        onChange={e => handlePriceUpdate('cost', parseFloat(e.target.value) || 0)} 
                        className="win-input font-bold" style={{ backgroundColor: '#ffcccc' }}
                      />
                   </div>
                   <div className="form-group mb-4">
                      <label className="font-bold">Ganancia Markup (%):</label>
                      <input 
                        type="number" value={productForm.utilidadPorcentaje} 
                        onChange={e => handlePriceUpdate('margin', parseFloat(e.target.value) || 0)} 
                        className="win-input text-blue-800 font-bold" 
                      />
                   </div>
                   <div className="form-group mb-4">
                      <label className="font-bold">Precio Detal (USD):</label>
                      <input 
                        type="number" step="0.01" value={productForm.precio1} 
                        onChange={e => handlePriceUpdate('usd', parseFloat(e.target.value) || 0)} 
                        className="win-input font-bold" style={{ backgroundColor: '#ffffcc' }}
                      />
                   </div>
                   <div className="form-group">
                      <label className="font-bold">Precio Detal (Bs.):</label>
                      <input 
                        type="number" step="0.01" value={(productForm.precio1 * config.tasa).toFixed(2)} 
                        onChange={e => handlePriceUpdate('bs', parseFloat(e.target.value) || 0)} 
                        className="win-input font-bold" style={{ backgroundColor: '#ffffcc' }}
                      />
                   </div>
                </div>
              </div>

              {/* Secciones Inferiores */}
              <div className="grid grid-cols-2 gap-6">
                 <div className="win-window p-6" style={{ background: '#c0c0c0', border: '1px solid #808080' }}>
                    <h4 className="text-blue-800 font-bold mb-4 uppercase text-xs">STOCK Y TIPO</h4>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="form-group">
                          <label className="font-bold">Stock Mínimo:</label>
                          <input type="number" value={productForm.stockMin} onChange={e => setProductForm({...productForm, stockMin: parseInt(e.target.value) || 0})} className="win-input" />
                       </div>
                       <div className="form-group">
                          <label className="font-bold">Stock Inicial:</label>
                          <input 
                            type="number" value={productForm.stock} 
                            disabled={productForm.isKit && !productForm.stockPropio}
                            onChange={e => setProductForm({...productForm, stock: parseInt(e.target.value) || 0})} 
                            className={`win-input ${productForm.isKit && !productForm.stockPropio ? 'bg-gray-200' : ''}`}
                            style={{ backgroundColor: (productForm.isKit && !productForm.stockPropio) ? '' : '#ffffcc' }}
                          />
                       </div>
                    </div>
                    <div className="form-group mt-4">
                       <label className="font-bold">Ubicación Física:</label>
                       <input type="text" value={productForm.ubicacion} onChange={e => setProductForm({...productForm, ubicacion: e.target.value})} className="win-input" />
                    </div>
                 </div>

                 <div className="win-window p-6" style={{ background: '#c0c0c0', border: '1px solid #808080' }}>
                    <h4 className="text-indigo-800 font-bold mb-4 uppercase text-xs">PRECIOS ALTERNATIVOS</h4>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="form-group">
                          <label className="font-bold text-[10px]">PRECIO MAYOR:</label>
                          <input type="number" step="0.01" value={productForm.precio2} onChange={e => setProductForm({...productForm, precio2: parseFloat(e.target.value) || 0})} className="win-input" />
                       </div>
                       <div className="form-group">
                          <label className="font-bold text-[10px]">PRECIO PROMOCIÓN:</label>
                          <input type="number" step="0.01" value={productForm.precio3} onChange={e => setProductForm({...productForm, precio3: parseFloat(e.target.value) || 0})} className="win-input" />
                       </div>
                    </div>
                    <div className="form-group mt-4">
                       <label className="font-bold text-[10px] text-red-600">PRECIO DE COSTO (REFERENCIAL):</label>
                       <input type="number" step="0.01" value={productForm.precio4} onChange={e => setProductForm({...productForm, precio4: parseFloat(e.target.value) || 0})} className="win-input" />
                    </div>
                 </div>
              </div>

              {/* Sección de Kit Dinámica */}
              <div className="mt-6 flex flex-col gap-4">
                 <div className="flex items-center gap-4">
                    <label className="flex items-center gap-3 font-bold cursor-pointer">
                       <input type="checkbox" checked={productForm.isKit} onChange={e => setProductForm({...productForm, isKit: e.target.checked})} className="size-5" />
                       Es Kit / Combo
                    </label>
                    {productForm.isKit && (
                       <div className="flex items-center gap-4 animate-in slide-in-from-left-2">
                          <label className="flex items-center gap-2 text-xs font-bold">
                             <input type="radio" checked={productForm.stockPropio} onChange={() => setProductForm({...productForm, stockPropio: true})} /> Stock Propio
                          </label>
                          <label className="flex items-center gap-2 text-xs font-bold">
                             <input type="radio" checked={!productForm.stockPropio} onChange={() => setProductForm({...productForm, stockPropio: false, stock: 0})} /> Virtual (Deduce Componentes)
                          </label>
                       </div>
                    )}
                 </div>

                 {productForm.isKit && !productForm.stockPropio && (
                    <div className="win-window p-6 animate-in fade-in" style={{ background: '#dce8f0', border: '2px dashed #808080' }}>
                       <h4 className="font-black text-blue-900 mb-4 flex items-center gap-2"><Layers size={14}/> CONFIGURACIÓN DE COMPONENTES VIRTUALES</h4>
                       <div className="relative mb-4">
                          <input 
                             type="text" placeholder="🔍 Buscar productos para el combo..." 
                             value={kitSearch} onChange={e => setKitSearch(e.target.value)}
                             className="win-input w-full bg-white"
                          />
                          {kitSearch && (
                             <div className="search-dropdown active w-full">
                                {products.filter(p => !p.isKit && p.codigo.toLowerCase().includes(kitSearch.toLowerCase())).map(p => (
                                   <div key={p.codigo} className="search-dropdown-item" onClick={() => addToKit(p)}>
                                      {p.codigo} - {p.nombre} (Stock: {p.stock})
                                   </div>
                                ))}
                             </div>
                          )}
                       </div>
                       <div className="table-responsive bg-white max-h-40 overflow-y-auto border border-gray-400">
                          <table className="data-table">
                             <thead className="bg-gray-200">
                                <tr>
                                   <th>Código</th>
                                   <th>Descripción</th>
                                   <th style={{ textAlign: 'center' }}>Cant. Necesaria</th>
                                   <th style={{ textAlign: 'center' }}>Acción</th>
                                </tr>
                             </thead>
                             <tbody>
                                {productForm.kitComponents.map((c: any, i: number) => (
                                   <tr key={i}>
                                      <td>{c.codigo}</td>
                                      <td>{products.find(p => p.codigo === c.codigo)?.nombre}</td>
                                      <td style={{ textAlign: 'center' }}>
                                         <input 
                                            type="number" value={c.cantidad} 
                                            onChange={e => {
                                               const val = parseInt(e.target.value) || 1;
                                               setProductForm({
                                                  ...productForm,
                                                  kitComponents: productForm.kitComponents.map((item: any, idx: number) => idx === i ? {...item, cantidad: val} : item)
                                               });
                                            }}
                                            className="w-16 text-center border font-bold"
                                         />
                                      </td>
                                      <td style={{ textAlign: 'center' }}>
                                         <button type="button" onClick={() => setProductForm({...productForm, kitComponents: productForm.kitComponents.filter((_: any, idx: number) => idx !== i)})} className="text-red-600">🗑️</button>
                                      </td>
                                   </tr>
                                ))}
                             </tbody>
                          </table>
                       </div>
                    </div>
                 )}
              </div>
            </div>
            <div className="modal-footer" style={{ padding: '15px' }}>
              <button type="button" className="btn px-8" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary px-8 font-bold flex items-center gap-2">
                <Save size={14}/> GUARDAR FICHA MAESTRA
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL PROCESAR COBRO */}
      {activeModal === 'modalProcesar' && (
        <div className="modal-window" style={{ width: '420px' }} onClick={e => e.stopPropagation()}>
          <div className="win-titlebar">
            <span className="flex items-center gap-2"><CreditCard size={14}/> PROCESAR COBRO</span>
            <span className="modal-close" onClick={onClose}></span>
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

             <button type="button" className="btn btn-primary w-full py-2 font-bold" onClick={() => {
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
            <button type="button" className="btn" onClick={onClose}>Volver</button>
            <button 
              type="button"
              className="btn btn-success font-black text-lg px-8 py-2" 
              disabled={paymentState.totalPaidUsd < cart.reduce((s, i) => s + (i.precioUsd * i.cantidad * (1 + i.iva/100)), 0) * 0.99}
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
              <button type="button" className="btn btn-primary w-full py-2 font-bold" onClick={() => window.print()}>🖨️ IMPRIMIR</button>
              <button type="button" className="btn w-full py-2" onClick={() => setLastSale(null)}>CERRAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
