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
import { db, auth } from '@/lib/firebase';
import { doc, setDoc, writeBatch, deleteDoc, updateDoc, increment } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';

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
  const [productForm, setProductForm] = useState<any>({
    codigo: '', nombre: '', categoria: 'Accesorio', marca: 'Toyota', 
    barcode: '', referencia: '', unidad: 'Unidad', departamento: 'Tienda',
    costoPromedio: '0', utilidadPorcentaje: '0', precio1: '0', precio2: '0', precio3: '0', precio4: '0',
    stock: '0', stockMin: '5', iva: 16, exento: false, activo: true, isService: false, isKit: false, stockPropio: true,
    kitComponents: [], ubicacion: ''
  });

  const [kitSearch, setKitSearch] = useState('');

  const [clientForm, setClientForm] = useState<Client | any>({
    tipoRif: 'V', rifNum: '', nombre: '', telefono: '', email: '', direccion: '', saldo: 0, tipo: 'Contribuyente'
  });

  const [providerForm, setProviderForm] = useState<Provider | any>({
    id: '', rif: '', nombre: '', direccion: '', contacto: '', telefono: ''
  });

  const [entradaHeader, setEntradaHeader] = useState({
    proveedor: '', nroFactura: '', tasaBcv: config.tasa, tipoCompra: 'Mixto', diasCredito: 7, pagoContadoUsd: 0, pagoContadoBs: 0
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
      const p = products[editingId];
      if (p) {
        setProductForm({
          ...p,
          costoPromedio: p.costoPromedio?.toString() || '0',
          utilidadPorcentaje: p.utilidadPorcentaje?.toString() || '0',
          precio1: p.precio1?.toString() || '0',
          precio2: p.precio2?.toString() || '0',
          precio3: p.precio3?.toString() || '0',
          precio4: p.precio4?.toString() || '0',
          stock: p.stock?.toString() || '0',
          stockMin: p.stockMin?.toString() || '0'
        });
      }
    } else if (activeModal === 'modalProducto' && editingId === null) {
      setProductForm({
        codigo: '', nombre: '', categoria: 'Accesorio', marca: 'Toyota', 
        barcode: '', referencia: '', unidad: 'Unidad', departamento: 'Tienda',
        costoPromedio: '0', utilidadPorcentaje: '0', precio1: '0', precio2: '0', precio3: '0', precio4: '0',
        stock: '0', stockMin: '5', iva: 16, exento: false, activo: true, isService: false, isKit: false, stockPropio: true,
        kitComponents: [], ubicacion: ''
      });
    } else if (activeModal === 'modalCliente' && editingId !== null) {
      setClientForm(clients[editingId]);
    } else if (activeModal === 'modalProveedor' && editingId !== null) {
      const p = providers.find(prov => prov.id === editingId);
      if (p) setProviderForm(p);
    } else if (activeModal === 'modalProveedor' && editingId === null) {
      setProviderForm({ id: '', rif: '', nombre: '', direccion: '', contacto: '', telefono: '' });
    }
  }, [activeModal, editingId, products, clients, providers]);

  const handlePriceUpdate = (type: 'margin' | 'usd' | 'bs' | 'cost' | 'iva' | 'exento', rawValue: any) => {
    let newForm = { ...productForm };
    const numValue = (type === 'iva' || type === 'exento') ? rawValue : parseFloat(rawValue);
    const costNum = type === 'cost' ? numValue : parseFloat(newForm.costoPromedio);
    const tasa = config.tasa || 1;

    if (type === 'cost') newForm.costoPromedio = rawValue;
    if (type === 'margin') newForm.utilidadPorcentaje = rawValue;
    if (type === 'usd') newForm.precio1 = rawValue;
    if (type === 'bs') {
      const usdVal = isNaN(numValue) ? 0 : numValue / tasa;
      newForm.precio1 = usdVal.toString();
    }

    if (type === 'exento') {
      newForm.exento = rawValue;
      newForm.iva = rawValue ? 0 : 16;
    } else if (type === 'iva') {
      newForm.iva = rawValue;
      newForm.exento = rawValue === 0;
    } else if (!isNaN(numValue) || rawValue === "") {
      const effectiveNum = isNaN(numValue) ? 0 : numValue;
      const effectiveCost = isNaN(costNum) ? 0 : costNum;

      if (type === 'cost') {
        const marginNum = parseFloat(newForm.utilidadPorcentaje) / 100;
        const p1 = marginNum < 1 ? effectiveNum / (1 - marginNum) : effectiveNum;
        newForm.precio1 = p1.toFixed(4);
      } else if (type === 'margin') {
        const marginNum = effectiveNum / 100;
        const p1 = marginNum < 1 ? effectiveCost / (1 - marginNum) : effectiveCost;
        newForm.precio1 = p1.toFixed(4);
      } else if (type === 'usd') {
        newForm.utilidadPorcentaje = effectiveNum > 0 ? ((1 - (effectiveCost / effectiveNum)) * 100).toFixed(2) : "0";
      } else if (type === 'bs') {
        const usdVal = effectiveNum / tasa;
        newForm.utilidadPorcentaje = usdVal > 0 ? ((1 - (effectiveCost / usdVal)) * 100).toFixed(2) : "0";
      }
    }

    setProductForm(newForm);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, userForm.email, userForm.password);
      const newUser = userCredential.user;
      await setDoc(doc(db, 'users', newUser.uid), {
        id: newUser.uid,
        name: userForm.name,
        email: userForm.email,
        role: userForm.role,
        active: true
      });
      notify('✅ Usuario creado exitosamente');
      onClose();
    } catch (error: any) {
      notify(`❌ Error: ${error.message}`, 'error');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const finalProduct = { 
        ...productForm,
        costoPromedio: parseFloat(productForm.costoPromedio) || 0,
        utilidadPorcentaje: parseFloat(productForm.utilidadPorcentaje) || 0,
        precio1: parseFloat(productForm.precio1) || 0,
        precio2: parseFloat(productForm.precio2) || 0,
        precio3: parseFloat(productForm.precio3) || 0,
        precio4: parseFloat(productForm.precio4) || 0,
        stock: parseInt(productForm.stock) || 0,
        stockMin: parseInt(productForm.stockMin) || 0,
      };
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

  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const id = providerForm.id || uuidv4();
      await setDoc(doc(db, 'providers', id), { ...providerForm, id });
      notify('✅ Proveedor guardado');
      onClose();
    } catch (error) {
      notify('❌ Error al guardar proveedor', 'error');
    }
  };

  const handleEntradaPayment = (type: 'usd' | 'bs', value: number) => {
    const tasa = entradaHeader.tasaBcv || 1;
    if (type === 'usd') {
      setEntradaHeader({
        ...entradaHeader,
        pagoContadoUsd: value,
        pagoContadoBs: Number((value * tasa).toFixed(2))
      });
    } else {
      setEntradaHeader({
        ...entradaHeader,
        pagoContadoBs: value,
        pagoContadoUsd: Number((value / tasa).toFixed(4))
      });
    }
  };

  const addToKit = (product: Product) => {
    if (product.codigo === productForm.codigo) return notify('❌ No puede agregarse a sí mismo', 'error');
    const existing = productForm.kitComponents.find((c: any) => c.codigo === product.codigo);
    if (existing) return;
    
    setProductForm({
      ...productForm,
      kitComponents: [...productForm.kitComponents, { codigo: product.codigo, cantidad: 1 }]
    });
    setKitSearch('');
  };

  const handleProcessEntrada = async () => {
    if (!entradaHeader.proveedor || entradaCart.length === 0) {
      notify('❌ Complete los datos del proveedor e items', 'warning');
      return;
    }
    const batch = writeBatch(db);
    const fecha = new Date().toISOString();
    for (const item of entradaCart) {
      const product = products.find(p => p.codigo === item.codigo);
      if (product) {
        const stockPrev = product.stock;
        const newStock = stockPrev + item.cantidad;
        const newCostoPromedio = ((product.costoPromedio * stockPrev) + (item.costo * item.cantidad)) / newStock;
        batch.update(doc(db, 'products', product.codigo), {
          stock: newStock,
          costoPromedio: newCostoPromedio,
          costoActual: item.costo
        });
        const logId = uuidv4();
        batch.set(doc(db, `products/${product.codigo}/logs`, logId), {
          id: logId, fecha, codigoProducto: product.codigo, tipo: 'ENTRADA',
          cantidad: item.cantidad, stockPrevio: stockPrev, stockNuevo: newStock,
          costo: item.costo, referencia: entradaHeader.nroFactura,
          comentario: `Recepción - Fact: ${entradaHeader.nroFactura}`,
          usuario: config.vendedor
        });
      }
    }
    const totalFactUsd = entradaCart.reduce((s, it) => s + (it.costo * it.cantidad), 0);
    const saldoPendiente = totalFactUsd - entradaHeader.pagoContadoUsd;
    if (saldoPendiente > 0.0001) {
      const accId = uuidv4();
      batch.set(doc(db, 'accounts', accId), {
        id: accId, entidad: entradaHeader.proveedor, montoTotal: totalFactUsd, montoPagado: entradaHeader.pagoContadoUsd,
        fechaEmision: fecha, estado: 'Pendiente', referencia: entradaHeader.nroFactura, tipo: 'CXP'
      });
    }
    await batch.commit();
    notify('✅ Entrada procesada exitosamente');
    onClose();
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

  const totalFacturaUsd = entradaCart.reduce((s, it) => s + (it.costo * it.cantidad), 0);
  const equivBs = totalFacturaUsd * entradaHeader.tasaBcv;

  if (!activeModal && !lastSale) return null;

  return (
    <div className="modal-overlay active" onClick={() => { if(!lastSale) onClose(); else setLastSale(null); }}>
      
      {activeModal === 'modalProducto' && (
        <div className="modal-window xlarge" onClick={e => e.stopPropagation()} style={{ width: '850px', maxHeight: '95vh', overflowY: 'auto' }}>
          <div className="win-titlebar">
            <span className="flex items-center gap-2"><Package size={14}/> FICHA MAESTRA DE PRODUCTO</span>
            <span className="modal-close" onClick={onClose}></span>
          </div>
          <form onSubmit={handleSaveProduct}>
            <div className="modal-body p-6">
              <div className="grid grid-cols-3 gap-6 mb-6">
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

                <div className="win-window p-4" style={{ background: '#c0c0c0', border: '1px solid #808080' }}>
                   <div className="form-group mb-4">
                      <label className="font-bold text-red-800">Costo Actual (USD):</label>
                      <input 
                        type="text" value={productForm.costoPromedio} 
                        onChange={e => handlePriceUpdate('cost', e.target.value)} 
                        className="win-input font-bold" style={{ backgroundColor: '#ffcccc' }}
                      />
                   </div>
                   <div className="form-group mb-4">
                      <label className="font-bold">Ganancia Markup (%):</label>
                      <input 
                        type="text" value={productForm.utilidadPorcentaje} 
                        onChange={e => handlePriceUpdate('margin', e.target.value)} 
                        className="win-input text-blue-800 font-bold" 
                      />
                   </div>
                   <div className="form-group mb-4">
                      <label className="font-bold">Precio Detal (USD):</label>
                      <input 
                        type="text" value={productForm.precio1} 
                        onChange={e => handlePriceUpdate('usd', e.target.value)} 
                        className="win-input font-bold" style={{ backgroundColor: '#ffffcc' }}
                      />
                   </div>
                   <div className="form-group">
                      <label className="font-bold">Precio Detal (Bs.):</label>
                      <input 
                        type="text" value={(parseFloat(productForm.precio1) * config.tasa).toFixed(2)} 
                        onChange={e => handlePriceUpdate('bs', e.target.value)} 
                        className="win-input font-bold" style={{ backgroundColor: '#ffffcc' }}
                      />
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="win-window p-6" style={{ background: '#c0c0c0', border: '1px solid #808080' }}>
                    <h4 className="text-blue-800 font-bold mb-4 uppercase text-xs">STOCK Y TIPO</h4>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="form-group">
                          <label className="font-bold">Stock Mínimo:</label>
                          <input type="text" value={productForm.stockMin} onChange={e => setProductForm({...productForm, stockMin: e.target.value})} className="win-input" />
                       </div>
                       <div className="form-group">
                          <label className="font-bold">Stock Inicial:</label>
                          <input 
                            type="text" value={productForm.stock} 
                            disabled={editingId !== null || (productForm.isKit && !productForm.stockPropio)}
                            onChange={e => setProductForm({...productForm, stock: e.target.value})} 
                            className={`win-input ${ (editingId !== null || (productForm.isKit && !productForm.stockPropio)) ? 'bg-gray-200' : ''}`}
                            style={{ backgroundColor: (editingId !== null || (productForm.isKit && !productForm.stockPropio)) ? '' : '#ffffcc' }}
                          />
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                       <div className="form-group">
                          <label className="font-bold">IVA (%):</label>
                          <select className="win-input font-bold" value={productForm.iva} onChange={e => handlePriceUpdate('iva', parseInt(e.target.value) || 0)}>
                            <option value={16}>16% (General)</option>
                            <option value={8}>8% (Reducido)</option>
                            <option value={0}>0% (Exento)</option>
                          </select>
                       </div>
                       <div className="form-group flex items-end">
                          <label className="flex items-center gap-2 font-bold cursor-pointer h-10 win-input bg-white border border-gray-400">
                             <input type="checkbox" checked={productForm.exento} onChange={e => handlePriceUpdate('exento', e.target.checked)} className="size-4" />
                             ITEM EXENTO
                          </label>
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
                          <input type="text" value={productForm.precio2} onChange={e => setProductForm({...productForm, precio2: e.target.value})} className="win-input" />
                       </div>
                       <div className="form-group">
                          <label className="font-bold text-[10px]">PRECIO PROMOCIÓN:</label>
                          <input type="text" value={productForm.precio3} onChange={e => setProductForm({...productForm, precio3: e.target.value})} className="win-input" />
                       </div>
                    </div>
                    <div className="form-group mt-4">
                       <label className="font-bold text-[10px] text-red-600">PRECIO DE COSTO (REFERENCIAL):</label>
                       <input type="text" value={productForm.precio4} onChange={e => setProductForm({...productForm, precio4: e.target.value})} className="win-input" />
                    </div>
                 </div>
              </div>

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
                             <input type="radio" checked={!productForm.stockPropio} onChange={() => setProductForm({...productForm, stockPropio: false, stock: '0'})} /> Virtual (Deduce Componentes)
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
            <div className="modal-footer p-6">
              <button type="button" className="btn px-8" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary px-8 font-bold flex items-center gap-2">
                <Save size={14}/> GUARDAR FICHA MAESTRA
              </button>
            </div>
          </form>
        </div>
      )}

      {activeModal === 'modalCliente' && (
        <div className="modal-window" style={{ width: '500px' }} onClick={e => e.stopPropagation()}>
          <div className="win-titlebar">
            <span className="flex items-center gap-2"><UserCircle size={14}/> FICHA DE CLIENTE</span>
            <span className="modal-close" onClick={onClose}></span>
          </div>
          <form onSubmit={handleSaveClient}>
            <div className="modal-body space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="form-group">
                  <label className="font-bold">Tipo:</label>
                  <select className="win-input" value={clientForm.tipoRif} onChange={e => setClientForm({...clientForm, tipoRif: e.target.value})}>
                    <option value="V">V</option>
                    <option value="J">J</option>
                    <option value="G">G</option>
                    <option value="E">E</option>
                  </select>
                </div>
                <div className="form-group col-span-2">
                  <label className="font-bold">RIF / Cédula:</label>
                  <input type="text" required value={clientForm.rifNum} onChange={e => setClientForm({...clientForm, rifNum: e.target.value})} className="win-input" />
                </div>
              </div>
              <div className="form-group">
                <label className="font-bold">Nombre o Razón Social:</label>
                <input type="text" required value={clientForm.nombre} onChange={e => setClientForm({...clientForm, nombre: e.target.value})} className="win-input" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="font-bold">Teléfono:</label>
                  <input type="text" value={clientForm.telefono} onChange={e => setClientForm({...clientForm, telefono: e.target.value})} className="win-input" />
                </div>
                <div className="form-group">
                  <label className="font-bold">Email:</label>
                  <input type="email" value={clientForm.email} onChange={e => setClientForm({...clientForm, email: e.target.value})} className="win-input" />
                </div>
              </div>
              <div className="form-group">
                <label className="font-bold">Dirección:</label>
                <input type="text" value={clientForm.direccion} onChange={e => setClientForm({...clientForm, direccion: e.target.value})} className="win-input" />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary font-bold">GUARDAR CLIENTE</button>
            </div>
          </form>
        </div>
      )}

      {activeModal === 'modalProveedor' && (
        <div className="modal-window" style={{ width: '500px' }} onClick={e => e.stopPropagation()}>
          <div className="win-titlebar">
            <span className="flex items-center gap-2"><Truck size={14}/> FICHA DE PROVEEDOR</span>
            <span className="modal-close" onClick={onClose}></span>
          </div>
          <form onSubmit={handleSaveProvider}>
            <div className="modal-body space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="font-bold">RIF / Identificación:</label>
                  <input type="text" required value={providerForm.rif} onChange={e => setProviderForm({...providerForm, rif: e.target.value.toUpperCase()})} className="win-input" />
                </div>
                <div className="form-group">
                  <label className="font-bold">Nombre / Razón Social:</label>
                  <input type="text" required value={providerForm.nombre} onChange={e => setProviderForm({...providerForm, nombre: e.target.value})} className="win-input" />
                </div>
              </div>
              <div className="form-group">
                <label className="font-bold">Dirección Fiscal:</label>
                <input type="text" value={providerForm.direccion} onChange={e => setProviderForm({...providerForm, direccion: e.target.value})} className="win-input" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="font-bold">Persona de Contacto:</label>
                  <input type="text" value={providerForm.contacto} onChange={e => setProviderForm({...providerForm, contacto: e.target.value})} className="win-input" />
                </div>
                <div className="form-group">
                  <label className="font-bold">Teléfono:</label>
                  <input type="text" value={providerForm.telefono} onChange={e => setProviderForm({...providerForm, telefono: e.target.value})} className="win-input" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary font-bold">GUARDAR PROVEEDOR</button>
            </div>
          </form>
        </div>
      )}

      {activeModal === 'modalNuevoUsuario' && (
        <div className="modal-window" style={{ width: '400px' }} onClick={e => e.stopPropagation()}>
          <div className="win-titlebar">
            <span className="flex items-center gap-2"><UserPlus size={14}/> REGISTRO DE NUEVO USUARIO</span>
            <span className="modal-close" onClick={onClose}></span>
          </div>
          <form onSubmit={handleCreateUser}>
            <div className="modal-body space-y-4">
              <div className="form-group">
                <label className="font-bold">Nombre Completo:</label>
                <input 
                  type="text" required value={userForm.name} 
                  onChange={e => setUserForm({...userForm, name: e.target.value})} 
                  className="win-input" placeholder="Ej: Juan Pérez"
                />
              </div>
              <div className="form-group">
                <label className="font-bold">Correo Electrónico (Email):</label>
                <input 
                  type="email" required value={userForm.email} 
                  onChange={e => setUserForm({...userForm, email: e.target.value})} 
                  className="win-input" placeholder="usuario@sistema.com"
                />
              </div>
              <div className="form-group">
                <label className="font-bold">Rol / Nivel de Acceso:</label>
                <select 
                  value={userForm.role} 
                  onChange={e => setUserForm({...userForm, role: e.target.value})} 
                  className="win-input font-bold"
                >
                  <option value="Administrador">Administrador</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Cajero">Cajero</option>
                </select>
              </div>
              <div className="form-group">
                <label className="font-bold">Clave Asignada:</label>
                <input 
                  type="password" required value={userForm.password} 
                  onChange={e => setUserForm({...userForm, password: e.target.value})} 
                  className="win-input" placeholder="Min. 6 caracteres"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary font-bold">CREAR USUARIO</button>
            </div>
          </form>
        </div>
      )}

      {activeModal === 'modalEntrada' && (
        <div className="modal-window xlarge" onClick={e => e.stopPropagation()} style={{ width: '950px', maxHeight: '90vh' }}>
          <div className="win-titlebar">
            <span className="flex items-center gap-2"><PlusCircle size={14}/> ENTRADA POR COMPRA (RECEPCIÓN)</span>
            <span className="modal-close" onClick={onClose}></span>
          </div>
          <div className="modal-body flex flex-col gap-4 overflow-hidden">
            <div className="win-window p-6" style={{ background: '#c0c0c0', border: '1px solid #808080' }}>
              <div className="grid grid-cols-3 gap-6">
                <div className="form-group">
                  <label className="font-bold">Proveedor:</label>
                  <input type="text" value={entradaHeader.proveedor} onChange={e => setEntradaHeader({...entradaHeader, proveedor: e.target.value})} className="win-input" />
                </div>
                <div className="form-group">
                  <label className="font-bold">Nro Factura:</label>
                  <input type="text" value={entradaHeader.nroFactura} onChange={e => setEntradaHeader({...entradaHeader, nroFactura: e.target.value})} className="win-input" />
                </div>
                <div className="form-group">
                  <label className="font-bold">Tasa BCV:</label>
                  <input 
                    type="number" step="0.01" 
                    value={entradaHeader.tasaBcv} 
                    onChange={e => {
                      const newTasa = parseFloat(e.target.value) || 0;
                      setEntradaHeader({
                        ...entradaHeader, 
                        tasaBcv: newTasa,
                        pagoContadoBs: Number((entradaHeader.pagoContadoUsd * newTasa).toFixed(2))
                      });
                    }} 
                    className="win-input font-bold" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-6 mt-4">
                <div className="form-group">
                  <label className="font-bold">Tipo Compra:</label>
                  <select value={entradaHeader.tipoCompra} onChange={e => setEntradaHeader({...entradaHeader, tipoCompra: e.target.value})} className="win-input">
                    <option value="Contado">Contado</option>
                    <option value="Credito">Crédito</option>
                    <option value="Mixto">Mixto</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="font-bold">Días Crédito:</label>
                  <input type="number" value={entradaHeader.diasCredito} onChange={e => setEntradaHeader({...entradaHeader, diasCredito: parseInt(e.target.value) || 0})} className="win-input" />
                </div>
                <div className="form-group">
                  <label className="font-bold">Pago Contado (USD):</label>
                  <input 
                    type="number" step="0.0001" 
                    value={entradaHeader.pagoContadoUsd || ''} 
                    onChange={e => handleEntradaPayment('usd', parseFloat(e.target.value) || 0)} 
                    className="win-input font-bold" 
                  />
                </div>
                <div className="form-group">
                  <label className="font-bold">Pago Contado (Bs.):</label>
                  <input 
                    type="number" step="0.01" 
                    value={entradaHeader.pagoContadoBs || ''} 
                    onChange={e => handleEntradaPayment('bs', parseFloat(e.target.value) || 0)} 
                    className="win-input font-bold" 
                  />
                </div>
              </div>
            </div>

            <div className="toolbar bg-gray-200 p-2 border border-gray-400">
               <button type="button" className="btn px-3 flex items-center gap-2" onClick={() => onOpenModal('modalProducto')}><Plus size={14}/> NUEVA FICHA</button>
               <div className="relative flex-1 mx-2">
                 <input 
                    type="text" 
                    placeholder="🔍 Buscar producto por código o nombre..." 
                    className="win-input w-full bg-white"
                    value={entradaSearch}
                    onChange={e => setEntradaSearch(e.target.value)}
                 />
                 {entradaSearch && (
                   <div className="search-dropdown active w-full">
                     {products.filter(p => p.codigo.toLowerCase().includes(entradaSearch.toLowerCase()) || p.nombre.toLowerCase().includes(entradaSearch.toLowerCase())).map(p => (
                       <div key={p.codigo} className="search-dropdown-item" onClick={() => {
                          setEntradaCart([...entradaCart, { codigo: p.codigo, descripcion: p.nombre, cantidad: 1, costo: p.costoPromedio }]);
                          setEntradaSearch('');
                       }}>
                         {p.codigo} - {p.nombre} (Costo: ${p.costoPromedio.toFixed(4)})
                       </div>
                     ))}
                   </div>
                 )}
               </div>
               <button type="button" className="btn px-3 flex items-center gap-2"><Plus size={14}/> AÑADIR ITEM</button>
            </div>

            <div className="table-responsive bg-white flex-1 overflow-y-auto border-2 border-gray-400">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Descripción</th>
                      <th style={{ textAlign: 'center' }}>Cant</th>
                      <th style={{ textAlign: 'right' }}>Costo USD</th>
                      <th style={{ textAlign: 'right' }}>Subtotal</th>
                      <th style={{ textAlign: 'center' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entradaCart.map((it, idx) => (
                      <tr key={idx}>
                        <td className="font-bold">{it.codigo}</td>
                        <td>{it.descripcion}</td>
                        <td style={{ textAlign: 'center' }}>
                          <input 
                            type="number" value={it.cantidad} 
                            onChange={e => setEntradaCart(entradaCart.map((item, i) => i === idx ? {...item, cantidad: parseInt(e.target.value) || 1} : item))}
                            className="w-16 text-center border"
                          />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <input 
                            type="number" step="0.0001" value={it.costo} 
                            onChange={e => setEntradaCart(entradaCart.map((item, i) => i === idx ? {...item, costo: parseFloat(e.target.value) || 0} : item))}
                            className="w-24 text-right border pr-1"
                          />
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>${(it.costo * it.cantidad).toFixed(4)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button type="button" onClick={() => setEntradaCart(entradaCart.filter((_, i) => i !== idx))} className="text-red-600">🗑️</button>
                        </td>
                      </tr>
                    ))}
                    {entradaCart.length === 0 && (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: '60px', color: '#999' }}>No hay items cargados en esta compra</td></tr>
                    )}
                  </tbody>
                </table>
            </div>

            <div className="flex gap-8 p-4 bg-gray-300 border-2 border-gray-400">
               <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-600 uppercase">Total Factura USD</span>
                  <span className="text-2xl font-black text-blue-900">${totalFacturaUsd.toFixed(4)}</span>
               </div>
               <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-600 uppercase">Equiv. Bs.</span>
                  <span className="text-2xl font-black text-gray-700">{equivBs.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
               </div>
               <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-600 uppercase">Total Pagado USD</span>
                  <span className="text-2xl font-black text-green-700">${entradaHeader.pagoContadoUsd.toFixed(4)}</span>
               </div>
               <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-600 uppercase">Pendiente USD (Crédito)</span>
                  <span className="text-2xl font-black text-red-700">${(totalFacturaUsd - entradaHeader.pagoContadoUsd).toFixed(4)}</span>
               </div>
            </div>
          </div>
          <div className="modal-footer" style={{ padding: '15px' }}>
            <button type="button" className="btn px-10" onClick={onClose}>Cancelar</button>
            <button type="button" className="btn btn-primary px-10 font-black flex items-center gap-2 shadow-lg" onClick={handleProcessEntrada}>
              <FileText size={16}/> PROCESAR ENTRADA
            </button>
          </div>
        </div>
      )}

      {activeModal === 'modalAjuste' && (
        <div className="modal-window" style={{ width: '450px' }} onClick={e => e.stopPropagation()}>
          <div className="win-titlebar">
             <span className="flex items-center gap-2"><RefreshCcw size={14}/> AJUSTE MANUAL DE INVENTARIO</span>
             <span className="modal-close" onClick={onClose}></span>
          </div>
          <div className="modal-body space-y-4">
             <div className="form-group">
                <label className="font-bold">Producto:</label>
                <select className="win-input" value={inventoryForm.codigo} onChange={e => setInventoryForm({...inventoryForm, codigo: e.target.value})}>
                   <option value="">-- Seleccionar --</option>
                   {products.map(p => <option key={p.codigo} value={p.codigo}>{p.codigo} - {p.nombre}</option>)}
                </select>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                   <label className="font-bold">Cantidad (+ / -):</label>
                   <input type="number" className="win-input" value={inventoryForm.cantidad} onChange={e => setInventoryForm({...inventoryForm, cantidad: parseInt(e.target.value) || 0})} />
                </div>
                <div className="form-group">
                   <label className="font-bold">Costo Ref. (USD):</label>
                   <input type="number" step="0.01" className="win-input" value={inventoryForm.costo} onChange={e => setInventoryForm({...inventoryForm, costo: parseFloat(e.target.value) || 0})} />
                </div>
             </div>
             <div className="form-group">
                <label className="font-bold">Motivo / Justificación:</label>
                <textarea className="win-input" style={{ height: '80px' }} value={inventoryForm.comentario} onChange={e => setInventoryForm({...inventoryForm, comentario: e.target.value})} />
             </div>
          </div>
          <div className="modal-footer">
             <button type="button" className="btn" onClick={onClose}>Cancelar</button>
             <button type="button" className="btn btn-primary font-bold" onClick={async () => {
                const product = products.find(p => p.codigo === inventoryForm.codigo);
                if (product) {
                  const stockPrev = product.stock;
                  const newStock = stockPrev + inventoryForm.cantidad;
                  await updateDoc(doc(db, 'products', product.codigo), { stock: newStock });
                  const logId = uuidv4();
                  await setDoc(doc(db, `products/${product.codigo}/logs`, logId), {
                    id: logId, fecha: new Date().toISOString(), codigoProducto: product.codigo, tipo: 'AJUSTE',
                    cantidad: inventoryForm.cantidad, stockPrevio: stockPrev, stockNuevo: newStock,
                    costo: inventoryForm.costo || product.costoPromedio, referencia: 'AJUSTE',
                    comentario: inventoryForm.comentario, usuario: config.vendedor
                  });
                  notify('✅ Ajuste procesado');
                  onClose();
                }
             }}>APLICAR AJUSTE</button>
          </div>
        </div>
      )}

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
                  <input ref={amountRef} type="number" value={paymentState.amount || ''} onChange={e => setPaymentState({...paymentState, amount: parseFloat(e.target.value) || 0})} className="win-input font-bold text-lg text-right" />
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
            <button type="button" className="btn btn-success font-black text-lg px-8 py-2" onClick={finalizeSale}>💾 FINALIZAR VENTA</button>
          </div>
        </div>
      )}

      {activeModal === 'modalDetalleVenta' && (
        <div className="modal-window xlarge" style={{ width: '700px' }} onClick={e => e.stopPropagation()}>
           <div className="win-titlebar">
              <span className="flex items-center gap-2"><FileText size={14}/> DETALLE DE FACTURA: {editingId}</span>
              <span className="modal-close" onClick={onClose}></span>
           </div>
           <div className="modal-body">
              {(() => {
                const s = sales.find(s => s.numero === editingId);
                if (!s) return <p className="p-10 text-center">Factura no encontrada...</p>;
                return (
                  <div className="space-y-4">
                     <div className="grid grid-cols-2 gap-4 bg-gray-100 p-4 border border-gray-300">
                        <div><strong>Cliente:</strong> {s.cliente}</div>
                        <div><strong>RIF/CI:</strong> {s.rif}</div>
                        <div><strong>Fecha:</strong> {new Date(s.fecha).toLocaleString()}</div>
                        <div><strong>Vendedor:</strong> {s.vendedor}</div>
                        <div><strong>Estado:</strong> <span className={s.estado === 'Completada' ? 'text-green-700' : 'text-red-700'}>{s.estado?.toUpperCase()}</span></div>
                        <div><strong>Referencia:</strong> {s.referencia}</div>
                     </div>
                     <div className="table-responsive bg-white max-h-60 overflow-y-auto border border-gray-400">
                        <table className="data-table">
                           <thead className="bg-gray-200">
                              <tr>
                                 <th>Producto</th>
                                 <th style={{ textAlign: 'center' }}>Cant</th>
                                 <th style={{ textAlign: 'right' }}>Precio USD</th>
                                 <th style={{ textAlign: 'right' }}>Total USD</th>
                              </tr>
                           </thead>
                           <tbody>
                              {s.items.map((it, idx) => (
                                 <tr key={idx}>
                                    <td>{it.codigo} - {it.descripcion}</td>
                                    <td style={{ textAlign: 'center' }}>{it.cantidad}</td>
                                    <td style={{ textAlign: 'right' }}>${it.precioUsd.toFixed(2)}</td>
                                    <td style={{ textAlign: 'right' }}>${(it.precioUsd * it.cantidad * (1 + it.iva/100)).toFixed(2)}</td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                     <div className="flex justify-end gap-8 p-4 bg-gray-200 font-bold border border-gray-300">
                        <span>SUBTOTAL: ${s.subtotal.toFixed(2)}</span>
                        <span>IVA: ${s.iva.toFixed(2)}</span>
                        <span className="text-xl text-blue-900">TOTAL: ${s.totalUsd.toFixed(2)}</span>
                     </div>
                  </div>
                );
              })()}
           </div>
           <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => window.print()}>🖨️ IMPRIMIR</button>
              <button className="btn" onClick={onClose}>Cerrar</button>
           </div>
        </div>
      )}

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
