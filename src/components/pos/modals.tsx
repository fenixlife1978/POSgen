
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Product, Client, Provider, Sale, Account, CartItem, User, InventoryMovement, CashMovement } from '@/types/pos';
import { v4 as uuidv4 } from 'uuid';
import { 
  Wallet, Search, Trash2, Save, CreditCard, UserPlus, 
  Package, UserCircle, Truck, 
  RefreshCcw, DollarSign,
  PlusCircle, FileText, Plus, Minus, Layers, Wrench, Banknote, History
} from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { doc, setDoc, writeBatch, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

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
  clientInfo: { name: string, rif: string, saldo: number, isCredit: boolean };
}

export function Modals({ 
  activeModal, onClose, products, setProducts, clients, setClients, 
  providers, setProviders, sales, setSales, accounts, setAccounts, 
  cart, setCart, config, setConfig, notify, editingId, users, setUsers,
  movements, setMovements, onOpenModal, clientInfo
}: ModalsProps) {
  
  const methodRef = useRef<HTMLSelectElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  // Form states
  const [productForm, setProductForm] = useState<any>({
    codigo: '', nombre: '', categoria: 'Accesorio', marca: 'Toyota', 
    barcode: '', referencia: '', unidad: 'Unidad', departamento: 'Tienda',
    costoPromedio: '0', utilidadPorcentaje: '0', precio1: '0', precio2: '0', precio3: '0', precio4: '0',
    stock: '0', stockMin: '5', iva: 16, exento: false, activo: true, isService: false, isKit: false, stockPropio: true,
    kitComponents: [], ubicacion: '', serviceType: 'Mecánica General'
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

  // Apertura de Caja
  const [aperturaMonto, setAperturaMonto] = useState('0');

  // Cobro Deuda
  const [cobroSearch, setCobroSearch] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [montoAbono, setMontoAbono] = useState('0');

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
          stockMin: p.stockMin?.toString() || '0',
          isService: p.isService || false,
          serviceType: p.serviceType || 'Mecánica General'
        });
      }
    } else if (activeModal === 'modalProducto' && editingId === null) {
      setProductForm({
        codigo: '', nombre: '', categoria: 'Accesorio', marca: 'Toyota', 
        barcode: '', referencia: '', unidad: 'Unidad', departamento: 'Tienda',
        costoPromedio: '0', utilidadPorcentaje: '0', precio1: '0', precio2: '0', precio3: '0', precio4: '0',
        stock: '0', stockMin: '5', iva: 16, exento: false, activo: true, isService: false, isKit: false, stockPropio: true,
        kitComponents: [], ubicacion: '', serviceType: 'Mecánica General'
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

      if (type === 'cost' || type === 'margin' || type === 'usd' || type === 'bs') {
        const marginNum = parseFloat(newForm.utilidadPorcentaje) / 100;
        
        if (type === 'cost') {
          const p1 = marginNum < 1 ? effectiveNum / (1 - marginNum) : effectiveNum;
          newForm.precio1 = p1.toFixed(4);
        } else if (type === 'margin') {
          const p1 = effectiveNum < 100 ? effectiveCost / (1 - effectiveNum / 100) : effectiveCost;
          newForm.precio1 = p1.toFixed(4);
        } else if (type === 'usd') {
          newForm.utilidadPorcentaje = effectiveNum > 0 ? ((1 - (effectiveCost / effectiveNum)) * 100).toFixed(2) : "0";
        } else if (type === 'bs') {
          const usdVal = effectiveNum / tasa;
          newForm.utilidadPorcentaje = usdVal > 0 ? ((1 - (effectiveCost / usdVal)) * 100).toFixed(2) : "0";
        }
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
      await setDoc(doc(db, 'products', finalProduct.codigo), finalProduct);
      notify('✅ Producto guardado');
      onClose();
    } catch (error) {
      notify('❌ Error al guardar', 'error');
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

  const handleProcessApertura = async (e: React.FormEvent) => {
    e.preventDefault();
    const monto = parseFloat(aperturaMonto) || 0;
    const movId = uuidv4();
    const movement: CashMovement = {
      id: movId,
      fecha: new Date().toISOString(),
      tipo: 'INGRESO',
      montoUsd: monto,
      montoBs: monto * config.tasa,
      metodo: 'Efectivo USD',
      referencia: 'APERTURA',
      concepto: 'FONDO DE APERTURA DE CAJA',
      usuario: config.vendedor
    };
    await setDoc(doc(db, 'accounting/audit/cash_movements', movId), movement);
    notify('✅ Apertura de caja registrada');
    onClose();
  };

  const handleProcessCobro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;
    const monto = parseFloat(montoAbono) || 0;
    const batch = writeBatch(db);
    const fecha = new Date().toISOString();
    
    // Actualizar Cuenta
    const nuevoPagado = selectedAccount.montoPagado + monto;
    const nuevoEstado = nuevoPagado >= selectedAccount.montoTotal ? 'Pagada' : 'Parcial';
    batch.update(doc(db, 'accounts', selectedAccount.id), {
      montoPagado: nuevoPagado,
      estado: nuevoEstado
    });

    // Registrar en Caja
    const movId = uuidv4();
    batch.set(doc(db, 'accounting/audit/cash_movements', movId), {
      id: movId, fecha, tipo: 'INGRESO', montoUsd: monto, montoBs: monto * config.tasa,
      metodo: 'Efectivo USD', referencia: selectedAccount.referencia,
      concepto: `COBRO DE DEUDA: ${selectedAccount.entidad}`, usuario: config.vendedor
    });

    await batch.commit();
    notify('✅ Cobro de deuda procesado');
    onClose();
  };

  const finalizeSale = async () => {
    const totalUsd = cart.reduce((acc, item) => acc + (item.precioUsd * item.cantidad * (1 + item.iva / 100)), 0);
    const batch = writeBatch(db);
    const saleId = uuidv4();
    const fecha = new Date().toISOString();
    
    const sale: Sale = {
      numero: `FAC-${(sales.length + 1).toString().padStart(6, '0')}`,
      fecha,
      cliente: clientInfo.name,
      rif: clientInfo.rif,
      vendedor: config.vendedor,
      items: [...cart],
      subtotal: cart.reduce((acc, it) => acc + (it.precioUsd * it.cantidad), 0),
      iva: cart.reduce((acc, it) => acc + (it.precioUsd * it.cantidad * (it.iva / 100)), 0),
      totalUsd: totalUsd,
      totalBs: totalUsd * config.tasa,
      pago: paymentState.payments.map(p => p.method).join(', ') || (clientInfo.isCredit ? 'CRÉDITO' : 'Contado'),
      detallesPago: [...paymentState.payments],
      recibidoUsd: paymentState.totalPaidUsd,
      recibidoBs: paymentState.totalPaidUsd * config.tasa,
      cambioUsd: Math.max(0, paymentState.totalPaidUsd - totalUsd),
      referencia: uuidv4().slice(0, 8),
      credito: clientInfo.isCredit || paymentState.totalPaidUsd < totalUsd,
      estado: 'Completada'
    };

    batch.set(doc(db, 'sales', saleId), sale);
    
    // Registrar ingreso en Caja si hubo pago parcial o total
    if (paymentState.totalPaidUsd > 0) {
      const movId = uuidv4();
      batch.set(doc(db, 'accounting/audit/cash_movements', movId), {
        id: movId, fecha, tipo: 'INGRESO', montoUsd: paymentState.totalPaidUsd, 
        montoBs: paymentState.totalPaidUsd * config.tasa, metodo: 'Mixto',
        referencia: sale.numero, concepto: `VENTA FACTURA ${sale.numero}`, usuario: config.vendedor
      });
    }

    // Crear CXC si queda saldo pendiente
    const saldoPendiente = totalUsd - paymentState.totalPaidUsd;
    if (saldoPendiente > 0.001) {
      const accId = uuidv4();
      batch.set(doc(db, 'accounts', accId), {
        id: accId, entidad: clientInfo.name, rif: clientInfo.rif, montoTotal: totalUsd, 
        montoPagado: paymentState.totalPaidUsd, fechaEmision: fecha, 
        estado: paymentState.totalPaidUsd > 0 ? 'Parcial' : 'Pendiente', 
        referencia: sale.numero, tipo: 'CXC'
      });
    }

    // Actualizar Stock
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
              id: logId, fecha, codigoProducto: compProd.codigo, tipo: 'VENTA', 
              cantidad: -qtyToDeduct, stockPrevio: compProd.stock, stockNuevo: newStock, 
              costo: compProd.costoPromedio, referencia: `${sale.numero} (KIT)`, usuario: config.vendedor
            });
          }
        }
      } else if (!product.isService) {
        const newStock = product.stock - item.cantidad;
        batch.update(doc(db, 'products', product.codigo), { stock: newStock });
        const logId = uuidv4();
        batch.set(doc(db, `products/${product.codigo}/logs`, logId), {
          id: logId, fecha, codigoProducto: product.codigo, tipo: 'VENTA', 
          cantidad: -item.cantidad, stockPrevio: product.stock, stockNuevo: newStock, 
          costo: product.costoPromedio, referencia: sale.numero, usuario: config.vendedor
        });
      }
    }
    await batch.commit();
    setLastSale(sale);
    setCart([]);
    notify('✅ Flujo de venta y contabilidad procesado');
    onClose();
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

  if (!activeModal && !lastSale) return null;

  return (
    <div className="modal-overlay active" onClick={() => { if(!lastSale) onClose(); else setLastSale(null); }}>
      
      {activeModal === 'modalAperturaCaja' && (
        <div className="modal-window" style={{ width: '350px' }} onClick={e => e.stopPropagation()}>
          <div className="win-titlebar">
            <span className="flex items-center gap-2"><Wallet size={14}/> APERTURA DE CAJA</span>
            <span className="modal-close" onClick={onClose}></span>
          </div>
          <form onSubmit={handleProcessApertura}>
            <div className="modal-body p-6 text-center">
              <div className="size-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <DollarSign size={32}/>
              </div>
              <h3 className="font-black text-lg mb-2">FONDO INICIAL</h3>
              <p className="text-xs text-gray-500 mb-6 uppercase font-bold">Ingrese el monto en efectivo USD disponible en caja</p>
              <div className="form-group">
                <input 
                  type="text" 
                  autoFocus
                  value={aperturaMonto} 
                  onChange={e => setAperturaMonto(e.target.value)} 
                  className="win-input text-center text-3xl font-black text-emerald-700 h-16" 
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary font-black px-8">ABRIR CAJA</button>
            </div>
          </form>
        </div>
      )}

      {activeModal === 'modalCobroDeuda' && (
        <div className="modal-window large" style={{ width: '600px' }} onClick={e => e.stopPropagation()}>
          <div className="win-titlebar">
            <span className="flex items-center gap-2"><Banknote size={14}/> COBRO DE CUENTA / DEUDA</span>
            <span className="modal-close" onClick={onClose}></span>
          </div>
          <form onSubmit={handleProcessCobro}>
            <div className="modal-body space-y-6">
              <div className="relative">
                <label className="font-bold text-xs uppercase text-gray-500 mb-1 block">Buscar Cliente:</label>
                <input 
                  type="text" 
                  placeholder="🔍 Nombre o RIF del cliente..." 
                  value={cobroSearch} 
                  onChange={e => setCobroSearch(e.target.value)} 
                  className="win-input w-full"
                />
                {cobroSearch && (
                  <div className="search-dropdown active w-full">
                    {accounts.filter(a => a.tipo === 'CXC' && a.estado !== 'Pagada' && (a.entidad.toLowerCase().includes(cobroSearch.toLowerCase()) || a.rif?.includes(cobroSearch))).map(a => (
                      <div key={a.id} className="search-dropdown-item" onClick={() => { setSelectedAccount(a); setCobroSearch(''); }}>
                        {a.entidad} - Fact: {a.referencia} | Pendiente: ${ (a.montoTotal - a.montoPagado).toFixed(2) }
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedAccount && (
                <div className="win-window p-6 bg-gray-100 animate-in fade-in" style={{ border: '2px solid #000080' }}>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400">CLIENTE</p>
                      <p className="font-black text-blue-900">{selectedAccount.entidad}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400">DOCUMENTO</p>
                      <p className="font-black">{selectedAccount.referencia}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-white p-4 border-2 border-gray-300 rounded shadow-inner">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-red-500 uppercase">Saldo Deudor</span>
                      <span className="text-3xl font-black text-red-600">${ (selectedAccount.montoTotal - selectedAccount.montoPagado).toFixed(2) }</span>
                    </div>
                    <div className="text-right">
                       <label className="font-bold text-xs text-gray-500 block">MONTO ABONO (USD):</label>
                       <input 
                         type="text" 
                         value={montoAbono} 
                         onChange={e => setMontoAbono(e.target.value)}
                         className="win-input text-2xl font-black text-right w-40 h-12 bg-yellow-50"
                       />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn" onClick={onClose}>Cerrar</button>
              <button type="submit" disabled={!selectedAccount} className="btn btn-success font-black px-12 py-3 flex items-center gap-2">
                <CreditCard size={18}/> PROCESAR RECIBO DE PAGO
              </button>
            </div>
          </form>
        </div>
      )}

      {activeModal === 'modalProducto' && (
        <div className="modal-window xlarge" onClick={e => e.stopPropagation()} style={{ width: '850px', maxHeight: '95vh', overflowY: 'auto' }}>
          <div className="win-titlebar">
            <span className="flex items-center gap-2">
              {productForm.isService ? <Wrench size={14}/> : <Package size={14}/>}
              {productForm.isService ? ' FICHA MAESTRA DE SERVICIO' : ' FICHA MAESTRA DE PRODUCTO'}
            </span>
            <span className="modal-close" onClick={onClose}></span>
          </div>
          <form onSubmit={handleSaveProduct}>
            <div className="modal-body p-6">
              <div className="flex gap-4 mb-6 bg-gray-300 p-2 border border-gray-400">
                <label className="flex items-center gap-3 font-black cursor-pointer px-4 h-10 bg-white border-2 border-primary/20 rounded">
                  <input type="radio" checked={!productForm.isService} onChange={() => setProductForm({...productForm, isService: false})} className="size-5" />
                  ITEM FÍSICO
                </label>
                <label className="flex items-center gap-3 font-black cursor-pointer px-4 h-10 bg-white border-2 border-indigo-200 rounded">
                  <input type="radio" checked={productForm.isService} onChange={() => setProductForm({...productForm, isService: true})} className="size-5" />
                  SERVICIO
                </label>
              </div>

              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="win-window p-4" style={{ background: '#c0c0c0', border: '1px solid #808080' }}>
                   <div className="form-group mb-4">
                      <label className="font-bold">Código Interno:</label>
                      <input type="text" required value={productForm.codigo} onChange={e => setProductForm({...productForm, codigo: e.target.value.toUpperCase()})} className="win-input font-bold" />
                   </div>
                   <div className="form-group mb-4">
                      <label className="font-bold">Código Barras:</label>
                      <input type="text" value={productForm.barcode} onChange={e => setProductForm({...productForm, barcode: e.target.value})} className="win-input" />
                   </div>
                   <div className="form-group">
                      <label className="font-bold">Descripción:</label>
                      <input type="text" required value={productForm.nombre} onChange={e => setProductForm({...productForm, nombre: e.target.value})} className="win-input" />
                   </div>
                </div>

                <div className="win-window p-4" style={{ background: '#c0c0c0', border: '1px solid #808080' }}>
                   <div className="form-group mb-4">
                      <label className="font-bold">Marca:</label>
                      <input type="text" value={productForm.marca} onChange={e => setProductForm({...productForm, marca: e.target.value})} className="win-input" />
                   </div>
                   <div className="form-group mb-4">
                      <label className="font-bold">Categoría:</label>
                      <select className="win-input" value={productForm.categoria} onChange={e => setProductForm({...productForm, categoria: e.target.value})}>
                        <option value="Accesorio">Accesorio</option>
                        <option value="Lubricante">Lubricante</option>
                        <option value="Frenos">Frenos</option>
                      </select>
                   </div>
                   <div className="form-group">
                      <label className="font-bold">Departamento:</label>
                      <input type="text" value={productForm.departamento} onChange={e => setProductForm({...productForm, departamento: e.target.value})} className="win-input" />
                </div>
                </div>

                <div className="win-window p-4" style={{ background: '#c0c0c0', border: '1px solid #808080' }}>
                   <div className="form-group mb-4">
                      <label className="font-bold">Costo USD:</label>
                      <input type="text" value={productForm.costoPromedio} onChange={e => handlePriceUpdate('cost', e.target.value)} className="win-input font-bold bg-red-50" />
                   </div>
                   <div className="form-group mb-4">
                      <label className="font-bold">Margen Venta (%):</label>
                      <input type="text" value={productForm.utilidadPorcentaje} onChange={e => handlePriceUpdate('margin', e.target.value)} className="win-input font-bold" />
                   </div>
                   <div className="form-group">
                      <label className="font-bold">Precio Detal (USD):</label>
                      <input type="text" value={productForm.precio1} onChange={e => handlePriceUpdate('usd', e.target.value)} className="win-input font-bold bg-yellow-50" />
                   </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary font-bold">GUARDAR FICHA</button>
            </div>
          </form>
        </div>
      )}

      {activeModal === 'modalProcesar' && (
        <div className="modal-window" style={{ width: '420px' }} onClick={e => e.stopPropagation()}>
          <div className="win-titlebar">
            <span className="flex items-center gap-2"><CreditCard size={14}/> FINALIZAR VENTA</span>
            <span className="modal-close" onClick={onClose}></span>
          </div>
          <div className="modal-body space-y-4">
             <div className="win-window p-4 bg-gray-200 text-center border-b-4 border-primary">
                <div className="text-[10px] font-bold uppercase text-gray-600">Monto Factura</div>
                <div className="text-4xl font-black text-primary">${cart.reduce((s, i) => s + (i.precioUsd * i.cantidad * (1 + i.iva/100)), 0).toFixed(2)}</div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
               <div className="form-group">
                  <label>Método Pago:</label>
                  <select ref={methodRef} value={paymentState.method} onChange={e => setPaymentState({...paymentState, method: e.target.value})} className="win-input font-bold">
                    <option value="Efectivo USD">💵 Efectivo USD</option>
                    <option value="Efectivo Bs.">💸 Efectivo Bs.</option>
                    <option value="Pagomovil">📲 Pagomovil</option>
                    <option value="Zelle">🏦 Zelle</option>
                  </select>
               </div>
               <div className="form-group">
                  <label>Monto:</label>
                  <input ref={amountRef} type="number" value={paymentState.amount || ''} onChange={e => setPaymentState({...paymentState, amount: parseFloat(e.target.value) || 0})} className="win-input font-bold text-lg text-right" />
               </div>
             </div>
             <button type="button" className="btn btn-primary w-full py-2 font-bold" onClick={() => {
                if (!paymentState.amount) return;
                const usd = paymentState.method.includes('USD') || paymentState.method === 'Zelle' ? paymentState.amount : paymentState.amount / config.tasa;
                const bs = paymentState.method.includes('Bs.') || paymentState.method === 'Pagomovil' ? paymentState.amount : paymentState.amount * config.tasa;
                const newPays = [...paymentState.payments, { method: paymentState.method, usd, bs }];
                setPaymentState({...paymentState, payments: newPays, totalPaidUsd: newPays.reduce((s, p) => s + p.usd, 0), amount: 0});
             }}>➕ AÑADIR PAGO AL RECIBO</button>

             <div className="win-window p-3 bg-gray-300 space-y-2 border-2 border-gray-400">
                <div className="flex justify-between text-lg font-black pt-2">
                  <span>SALDO RESTANTE:</span> 
                  <span className="text-red-600">
                    ${Math.max(0, cart.reduce((s, i) => s + (i.precioUsd * i.cantidad * (1 + i.iva/100)), 0) - paymentState.totalPaidUsd).toFixed(2)}
                  </span>
                </div>
                {clientInfo.isCredit && (
                  <p className="text-[10px] text-blue-800 font-bold uppercase text-center italic">** El saldo restante se cargará automáticamente a la cuenta del cliente **</p>
                )}
             </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn" onClick={onClose}>Cancelar</button>
            <button type="button" className="btn btn-success font-black text-lg px-8 py-2" onClick={finalizeSale}>💾 FINALIZAR OPERACIÓN</button>
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
            <div className="border-t-2 border-black pt-2 space-y-1 font-bold text-right">
              <div>SUBTOTAL: ${lastSale.subtotal.toFixed(2)}</div>
              <div>IVA: ${lastSale.iva.toFixed(2)}</div>
              <div className="text-sm">TOTAL: ${lastSale.totalUsd.toFixed(2)}</div>
              <div className="text-[8px] opacity-60">RECIBIDO: ${lastSale.recibidoUsd.toFixed(2)}</div>
              <div className="text-[8px] opacity-60">CRÉDITO: ${(lastSale.totalUsd - lastSale.recibidoUsd).toFixed(2)}</div>
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
