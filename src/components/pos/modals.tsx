
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Product, Client, Provider, Sale, Account, CartItem, User, InventoryMovement, CashMovement } from '@/types/pos';
import { v4 as uuidv4 } from 'uuid';
import { 
  Wallet, Search, Trash2, Save, CreditCard, UserPlus, 
  Package, UserCircle, Truck, 
  RefreshCcw, DollarSign,
  PlusCircle, FileText, Plus, Minus, Layers, Wrench, Banknote, History,
  ArrowRightLeft, LogOut, ChevronDown, CheckCircle2, Activity, Clock, Printer
} from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { doc, setDoc, writeBatch, updateDoc, collection, onSnapshot, query, where } from 'firebase/firestore';
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
    proveedor: '', providerRif: '', nroFactura: '', tasaBcv: config.tasa.toString(), tipoCompra: 'Contado', diasCredito: 7, pagoContadoUsd: '0', pagoContadoBs: '0'
  });
  const [entradaSearch, setEntradaSearch] = useState('');
  const [entradaCart, setEntradaCart] = useState<any[]>([]);

  const [inventoryForm, setInventoryForm] = useState({
    codigo: '', cantidad: '0', costo: '0', referencia: '', comentario: '', tipoAjuste: 'Faltante'
  });

  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'Cajero', password: '' });
  const [paymentState, setPaymentState] = useState({ method: 'Efectivo USD', amount: 0, payments: [] as any[], totalPaidUsd: 0 });
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  const [aperturaMonto, setAperturaMonto] = useState('0');
  const [cobroSearch, setCobroSearch] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [montoAbono, setMontoAbono] = useState('0');

  const [gastoForm, setGastoForm] = useState({ concepto: '', monto: '0', referencia: '' });
  const [trasladoForm, setTrasladoForm] = useState({ banco: '', monto: '0', referencia: '' });
  const [devForm, setDevForm] = useState({ nroFactura: '', itemIdx: -1, cantidad: 1, condicion: 'REINTEGRADO_STOCK', motivo: '' });

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
    const tasa = parseFloat(config.tasa) || 1;

    if (type === 'cost') newForm.costoPromedio = rawValue;
    if (type === 'margin') newForm.utilidadPorcentaje = rawValue;
    if (type === 'usd') newForm.precio1 = rawValue;
    if (type === 'bs') newForm.precio1 = (parseFloat(rawValue) / tasa).toString();
    if (type === 'exento') { newForm.exento = rawValue; newForm.iva = rawValue ? 0 : 16; }
    if (type === 'iva') { newForm.iva = rawValue; newForm.exento = rawValue === 0; }

    const costNum = parseFloat(newForm.costoPromedio) || 0;
    const marginNum = (parseFloat(newForm.utilidadPorcentaje) || 0) / 100;

    if (type === 'cost' || type === 'margin') {
      const p1 = marginNum < 1 ? costNum / (1 - marginNum) : costNum;
      newForm.precio1 = p1.toFixed(4);
    } else if (type === 'usd' || type === 'bs') {
      const p1 = parseFloat(newForm.precio1) || 0;
      newForm.utilidadPorcentaje = p1 > 0 ? ((1 - (costNum / p1)) * 100).toFixed(2) : "0";
    }

    setProductForm(newForm);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...productForm,
      costoPromedio: parseFloat(productForm.costoPromedio) || 0,
      utilidadPorcentaje: parseFloat(productForm.utilidadPorcentaje) || 0,
      precio1: parseFloat(productForm.precio1) || 0,
      precio2: parseFloat(productForm.precio2) || 0,
      precio3: parseFloat(productForm.precio3) || 0,
      precio4: parseFloat(productForm.precio4) || 0,
      stock: parseFloat(productForm.stock) || 0,
      stockMin: parseFloat(productForm.stockMin) || 0,
    };
    await setDoc(doc(db, 'products', data.codigo), data);
    notify('✅ Item guardado');
    onClose();
  };

  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = providerForm.id || uuidv4();
    const data = { ...providerForm, id };
    await setDoc(doc(db, 'providers', id), data);
    notify('✅ Proveedor guardado');
    onClose();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { user } = await createUserWithEmailAndPassword(auth, userForm.email, userForm.password);
      const userData: User = {
        id: user.uid,
        username: userForm.email.split('@')[0],
        name: userForm.name,
        email: userForm.email,
        role: userForm.role as any,
        active: true,
        terminalId: config.terminalId
      };
      await setDoc(doc(db, 'users', user.uid), userData);
      notify('✅ Usuario creado exitosamente');
      onClose();
    } catch (error: any) {
      notify(`❌ Error: ${error.message}`, 'error');
    }
  };

  const handleProcessApertura = async (e: React.FormEvent) => {
    e.preventDefault();
    const monto = parseFloat(aperturaMonto) || 0;
    const movId = uuidv4();
    const fecha = new Date().toISOString();

    await setDoc(doc(db, 'accounting/audit/cash_movements', movId), {
      id: movId, fecha, tipo: 'INGRESO', montoUsd: monto, montoBs: monto * config.tasa,
      metodo: 'Efectivo USD', referencia: 'APERTURA', terminalId: config.terminalId,
      concepto: `APERTURA DE CAJA - TERMINAL ${config.terminalId}`, usuario: config.vendedor
    });

    notify(`✅ Caja abierta en Terminal ${config.terminalId}`);
    onClose();
  };

  const handleProcessCobro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;
    const abono = parseFloat(montoAbono) || 0;
    const batch = writeBatch(db);
    const fecha = new Date().toISOString();

    const nuevoPagado = selectedAccount.montoPagado + abono;
    const esTotal = nuevoPagado >= selectedAccount.montoTotal - 0.001;
    
    batch.update(doc(db, 'accounts', selectedAccount.id), {
      montoPagado: nuevoPagado,
      estado: esTotal ? 'Pagada' : 'Parcial'
    });

    const movId = uuidv4();
    batch.set(doc(db, 'accounting/audit/cash_movements', movId), {
      id: movId, fecha, tipo: 'INGRESO', montoUsd: abono, montoBs: abono * config.tasa,
      metodo: 'Efectivo USD', referencia: selectedAccount.referencia, terminalId: config.terminalId,
      concepto: `COBRO DEUDA: ${selectedAccount.entidad}`, usuario: config.vendedor
    });

    await batch.commit();
    notify('✅ Cobro registrado exitosamente');
    setSelectedAccount(null);
    setMontoAbono('0');
    onClose();
  };

  const handleProcessEntrada = async (e: React.FormEvent) => {
    e.preventDefault();
    if (entradaCart.length === 0) return notify('❌ El carrito de entrada está vacío', 'error');
    
    const batch = writeBatch(db);
    const fecha = new Date().toISOString();
    const totalUsd = entradaCart.reduce((acc, item) => acc + (item.costo * item.cantidad), 0);
    const abonoUsd = parseFloat(entradaHeader.pagoContadoUsd) || 0;
    const tasa = parseFloat(entradaHeader.tasaBcv) || config.tasa;

    for (const item of entradaCart) {
      const prod = products.find(p => p.codigo === item.codigo);
      if (prod) {
        const stockPrev = prod.stock;
        const newStock = stockPrev + item.cantidad;
        const newCosto = ((prod.costoPromedio * stockPrev) + (item.costo * item.cantidad)) / newStock;
        
        batch.update(doc(db, 'products', prod.codigo), { 
          stock: newStock, 
          costoPromedio: newCosto,
          costoActual: item.costo
        });

        const logId = uuidv4();
        batch.set(doc(db, 'inventory_movements', logId), {
          id: logId, fecha, codigoProducto: prod.codigo, tipo: 'ENTRADA',
          cantidad: item.cantidad, stockPrevio: stockPrev, stockNuevo: newStock,
          costo: item.costo, referencia: entradaHeader.nroFactura,
          comentario: `Compra a proveedor: ${entradaHeader.proveedor}`, usuario: config.vendedor
        });
      }
    }

    if (abonoUsd > 0) {
      const movId = uuidv4();
      batch.set(doc(db, 'accounting/audit/cash_movements', movId), {
        id: movId, fecha, tipo: 'EGRESO', montoUsd: abonoUsd, montoBs: abonoUsd * tasa,
        metodo: 'Efectivo USD', referencia: entradaHeader.nroFactura, terminalId: config.terminalId,
        concepto: `PAGO COMPRA: ${entradaHeader.proveedor}`, usuario: config.vendedor
      });
    }

    const pendiente = totalUsd - abonoUsd;
    if (pendiente > 0.0001) {
      const accId = uuidv4();
      batch.set(doc(db, 'accounts', accId), {
        id: accId, entidad: entradaHeader.proveedor, rif: entradaHeader.providerRif,
        montoTotal: totalUsd, montoPagado: abonoUsd, fechaEmision: fecha,
        estado: abonoUsd > 0 ? 'Parcial' : 'Pendiente', referencia: entradaHeader.nroFactura, tipo: 'CXP'
      });
    }

    await batch.commit();
    notify('✅ Entrada por compra procesada');
    setEntradaCart([]);
    onClose();
  };

  const handleProcessAjuste = async (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find(p => p.codigo === inventoryForm.codigo);
    if (!prod) return notify('❌ Producto no encontrado', 'error');

    const cant = parseInt(inventoryForm.cantidad) || 0;
    const factor = inventoryForm.tipoAjuste === 'Faltante' ? -1 : 1;
    const finalQty = cant * factor;
    
    const batch = writeBatch(db);
    const fecha = new Date().toISOString();
    const newStock = prod.stock + finalQty;

    batch.update(doc(db, 'products', prod.codigo), { stock: newStock });

    const logId = uuidv4();
    batch.set(doc(db, 'inventory_movements', logId), {
      id: logId, fecha, codigoProducto: prod.codigo, tipo: 'AJUSTE',
      cantidad: finalQty, stockPrevio: prod.stock, stockNuevo: newStock,
      costo: prod.costoPromedio, referencia: inventoryForm.referencia,
      comentario: inventoryForm.comentario, usuario: config.vendedor
    });

    await batch.commit();
    notify('✅ Ajuste registrado');
    onClose();
  };

  const handleProcessGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    const monto = parseFloat(gastoForm.monto) || 0;
    const movId = uuidv4();
    const fecha = new Date().toISOString();

    await setDoc(doc(db, 'accounting/audit/cash_movements', movId), {
      id: movId, fecha, tipo: 'EGRESO', montoUsd: monto, montoBs: monto * config.tasa,
      metodo: 'Efectivo USD', referencia: gastoForm.referencia, terminalId: config.terminalId,
      concepto: `GASTO OPERATIVO: ${gastoForm.concepto}`, usuario: config.vendedor
    });

    notify('✅ Gasto registrado');
    onClose();
  };

  const handleProcessTraslado = async (e: React.FormEvent) => {
    e.preventDefault();
    const monto = parseFloat(trasladoForm.monto) || 0;
    const movId = uuidv4();
    const fecha = new Date().toISOString();

    await setDoc(doc(db, 'accounting/audit/cash_movements', movId), {
      id: movId, fecha, tipo: 'EGRESO', montoUsd: monto, montoBs: monto * config.tasa,
      metodo: 'Traslado Bancario', referencia: trasladoForm.referencia, terminalId: config.terminalId,
      concepto: `TRASLADO A BANCO: ${trasladoForm.banco}`, usuario: config.vendedor
    });

    notify('✅ Traslado registrado');
    onClose();
  };

  const handleProcessDevolucion = async (e: React.FormEvent) => {
    e.preventDefault();
    const sale = sales.find(s => s.numero === devForm.nroFactura);
    if (!sale) return notify('❌ Factura no encontrada', 'error');

    const batch = writeBatch(db);
    const fecha = new Date().toISOString();
    
    if (devForm.itemIdx === -1) {
      for (const item of sale.items) {
        const prod = products.find(p => p.codigo === item.codigo);
        if (prod) {
          const newStock = prod.stock + item.cantidad;
          batch.update(doc(db, 'products', prod.codigo), { stock: newStock });
          const logId = uuidv4();
          batch.set(doc(db, 'inventory_movements', logId), {
            id: logId, fecha, codigoProducto: prod.codigo, tipo: 'DEVOLUCION',
            cantidad: item.cantidad, stockPrevio: prod.stock, stockNuevo: newStock,
            costo: prod.costoPromedio, referencia: sale.numero,
            comentario: 'Anulación total de factura', usuario: config.vendedor
          });
        }
      }
      batch.update(doc(db, 'sales', sale.numero), { estado: 'Anulada' });
      
      const movId = uuidv4();
      batch.set(doc(db, 'accounting/audit/cash_movements', movId), {
        id: movId, fecha, tipo: 'EGRESO', montoUsd: sale.totalUsd, montoBs: sale.totalBs,
        metodo: 'Efectivo USD', referencia: sale.numero, terminalId: config.terminalId,
        concepto: `REEMBOLSO ANULACION FACTURA ${sale.numero}`, usuario: config.vendedor
      });
    }

    await batch.commit();
    notify('✅ Devolución procesada');
    onClose();
  };

  const finalizeSale = async () => {
    const totalUsd = cart.reduce((acc, item) => acc + (item.precioUsd * item.cantidad * (1 + item.iva / 100)), 0);
    const batch = writeBatch(db);
    const fecha = new Date().toISOString();
    
    const sale: Sale = {
      numero: `FAC-${(sales.length + 1).toString().padStart(6, '0')}`,
      fecha,
      cliente: clientInfo.name,
      rif: clientInfo.rif,
      vendedor: config.vendedor,
      terminalId: config.terminalId,
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

    batch.set(doc(db, 'sales', sale.numero), sale);
    
    if (paymentState.totalPaidUsd > 0) {
      const movId = uuidv4();
      batch.set(doc(db, 'accounting/audit/cash_movements', movId), {
        id: movId, fecha, tipo: 'INGRESO', montoUsd: paymentState.totalPaidUsd, 
        montoBs: paymentState.totalPaidUsd * config.tasa, metodo: 'Mixto',
        referencia: sale.numero, terminalId: config.terminalId,
        concepto: `VENTA FACTURA ${sale.numero}`, usuario: config.vendedor
      });
    }

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
            batch.set(doc(db, 'inventory_movements', logId), {
              id: logId, fecha, codigoProducto: compProd.codigo, tipo: 'VENTA',
              cantidad: -qtyToDeduct, stockPrevio: compProd.stock, stockNuevo: newStock,
              costo: compProd.costoPromedio, referencia: `${sale.numero} (KIT)`, 
              usuario: config.vendedor, comentario: `Venta por combo: ${product.nombre}`
            });
          }
        }
      } else if (!product.isService) {
        const newStock = product.stock - item.cantidad;
        batch.update(doc(db, 'products', product.codigo), { stock: newStock });
        const logId = uuidv4();
        batch.set(doc(db, 'inventory_movements', logId), {
          id: logId, fecha, codigoProducto: product.codigo, tipo: 'VENTA',
          cantidad: -item.cantidad, stockPrevio: product.stock, stockNuevo: newStock,
          costo: product.costoPromedio, referencia: sale.numero, 
          usuario: config.vendedor, comentario: `Venta directa`
        });
      }
    }
    await batch.commit();
    setLastSale(sale);
    setCart([]);
    notify('✅ Venta procesada');
    onClose();
  };

  const handleEntradaPayment = (type: 'usd' | 'bs', value: string) => {
    const tasa = parseFloat(entradaHeader.tasaBcv) || 1;
    const numVal = parseFloat(value) || 0;
    if (type === 'usd') {
      setEntradaHeader({ ...entradaHeader, pagoContadoUsd: value, pagoContadoBs: (numVal * tasa).toFixed(2) });
    } else {
      setEntradaHeader({ ...entradaHeader, pagoContadoBs: value, pagoContadoUsd: (numVal / tasa).toFixed(4) });
    }
  };

  if (!activeModal && !lastSale) return null;

  return (
    <div className="modal-overlay active" onClick={() => { if(!lastSale) onClose(); else setLastSale(null); }}>
      
      {activeModal === 'modalCorteX' && editingId && (
        <div className="modal-window" style={{ width: '450px' }} onClick={e => e.stopPropagation()}>
           <div className="win-titlebar">
              <span className="flex items-center gap-2"><Activity size={14}/> CORTE DE CAJA PARCIAL (X)</span>
              <span className="modal-close" onClick={onClose}></span>
           </div>
           <div className="modal-body p-6 space-y-4 bg-white font-mono text-[11px]">
              <div className="text-center border-b-2 border-black pb-4 mb-4">
                 <h2 className="text-sm font-black uppercase">{editingId.businessName}</h2>
                 <p className="font-bold">ID TERMINAL: {editingId.terminalId}</p>
                 <p>{editingId.date} | {editingId.time}</p>
                 <p className="uppercase">Cajero: {editingId.cashier}</p>
              </div>

              <div className="space-y-1">
                 <div className="flex justify-between font-bold"><span>FONDO INICIAL:</span> <span>${editingId.fondoInicial.toFixed(2)}</span></div>
                 <div className="flex justify-between font-bold text-blue-800"><span>VENTAS TOTALES BRUTAS:</span> <span>${editingId.ventasBrutas.toFixed(2)}</span></div>
                 <div className="flex justify-between text-gray-500"><span>IMPUESTOS (IVA):</span> <span>${editingId.impuestos.toFixed(2)}</span></div>
              </div>

              <div className="bg-gray-100 p-2 border border-gray-300">
                 <p className="font-black border-b border-gray-400 mb-1">DESGLOSE POR MÉTODO:</p>
                 <div className="flex justify-between"><span>Efectivo (Cash):</span> <span>${editingId.breakdown.efectivo.toFixed(2)}</span></div>
                 <div className="flex justify-between"><span>Tarjetas:</span> <span>${editingId.breakdown.tarjetas.toFixed(2)}</span></div>
                 <div className="flex justify-between"><span>Transf. / Digital:</span> <span>${editingId.breakdown.transferencias.toFixed(2)}</span></div>
                 <div className="flex justify-between text-red-600"><span>Créditos Clientes:</span> <span>${editingId.breakdown.creditos.toFixed(2)}</span></div>
              </div>

              <div className="space-y-1 border-y border-dashed border-black py-2">
                 <div className="flex justify-between"><span>ENTRADAS (CAMBIO):</span> <span className="text-emerald-600">+${editingId.entradas.toFixed(2)}</span></div>
                 <div className="flex justify-between"><span>SALIDAS (RETIROS):</span> <span className="text-red-600">-${editingId.salidas.toFixed(2)}</span></div>
                 <div className="flex justify-between"><span>DEVOLUCIONES:</span> <span className="text-red-600">-${editingId.devoluciones.toFixed(2)}</span></div>
              </div>

              <div className="bg-black text-yellow-400 p-3 text-center border-2 border-yellow-400">
                 <p className="text-[10px] font-bold">EFECTIVO TEÓRICO EN CAJA</p>
                 <p className="text-2xl font-black">${editingId.efectivoTeorico.toFixed(2)}</p>
              </div>

              <p className="text-[9px] text-center text-gray-500 italic">** Consulta informativa. No cierra la terminal fiscalmente. **</p>
           </div>
           <div className="modal-footer flex gap-2">
              <button className="btn flex items-center gap-2" onClick={() => window.print()}><Printer size={14}/> Imprimir</button>
              <button className="btn ml-auto" onClick={onClose}>Cerrar</button>
           </div>
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
                <label>Nombre Completo:</label>
                <input type="text" required className="win-input" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Correo Electrónico:</label>
                <input type="email" required className="win-input" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label>Rol Asignado:</label>
                  <select className="win-input" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}>
                    <option value="Cajero">Cajero</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Clave Asignada:</label>
                  <input type="password" required className="win-input" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
                </div>
              </div>
              <p className="text-[10px] text-gray-500 italic mt-2">Nota: El usuario se vinculará automáticamente a la terminal {config.terminalId}.</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary font-bold">CREAR ACCESO</button>
            </div>
          </form>
        </div>
      )}

      {activeModal === 'modalDetalleVenta' && (
        <div className="modal-window large" style={{ width: '600px' }} onClick={e => e.stopPropagation()}>
           <div className="win-titlebar">
              <span>🧾 DETALLE DE FACTURA {editingId}</span>
              <span className="modal-close" onClick={onClose}></span>
           </div>
           <div className="modal-body">
              {sales.find(s => s.numero === editingId) ? (
                 <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 border-b pb-4">
                       <div><strong>Cliente:</strong> {sales.find(s => s.numero === editingId)?.cliente}</div>
                       <div><strong>Fecha:</strong> {new Date(sales.find(s => s.numero === editingId)!.fecha).toLocaleString()}</div>
                       <div><strong>Cajero:</strong> {sales.find(s => s.numero === editingId)?.vendedor}</div>
                       <div><strong>Terminal:</strong> {sales.find(s => s.numero === editingId)?.terminalId || 'CAJA-01'}</div>
                    </div>
                    <table className="data-table w-full">
                       <thead><tr><th>Item</th><th>Cant</th><th>Precio</th><th>Total</th></tr></thead>
                       <tbody>
                          {sales.find(s => s.numero === editingId)?.items.map((it, i) => (
                             <tr key={i}><td>{it.descripcion}</td><td>{it.cantidad}</td><td>${it.precioUsd.toFixed(2)}</td><td>${(it.cantidad * it.precioUsd).toFixed(2)}</td></tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              ) : <p>Cargando datos...</p>}
           </div>
           <div className="modal-footer"><button className="btn" onClick={onClose}>Cerrar</button></div>
        </div>
      )}

      {activeModal === 'modalEntrada' && (
        <div className="modal-window xlarge" style={{ width: '900px' }} onClick={e => e.stopPropagation()}>
          <div className="win-titlebar">
            <span className="flex items-center gap-2"><Truck size={14}/> RECEPCIÓN DE INVENTARIO / COMPRA</span>
            <span className="modal-close" onClick={onClose}></span>
          </div>
          <form onSubmit={handleProcessEntrada}>
            <div className="modal-body space-y-6">
              <div className="grid grid-cols-4 gap-4 bg-gray-200 p-4 border border-gray-400">
                <div className="form-group">
                  <label className="font-bold">Proveedor:</label>
                  <select className="win-input" required value={entradaHeader.proveedor} onChange={e => {
                    const p = providers.find(pr => pr.nombre === e.target.value);
                    setEntradaHeader({...entradaHeader, proveedor: e.target.value, providerRif: p?.rif || ''});
                  }}>
                    <option value="">-- Seleccionar --</option>
                    {providers.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="font-bold">Factura N°:</label>
                  <input type="text" required className="win-input" value={entradaHeader.nroFactura} onChange={e => setEntradaHeader({...entradaHeader, nroFactura: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="font-bold text-blue-800">Tasa Aplicada:</label>
                  <input type="text" className="win-input font-bold" value={entradaHeader.tasaBcv} onChange={e => setEntradaHeader({...entradaHeader, tasaBcv: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="font-bold">Condición:</label>
                  <select className="win-input" value={entradaHeader.tipoCompra} onChange={e => setEntradaHeader({...entradaHeader, tipoCompra: e.target.value})}>
                    <option value="Contado">Contado (Libro Caja)</option>
                    <option value="Credito">Crédito (Libro CXP)</option>
                  </select>
                </div>
              </div>

              <div className="relative">
                <input type="text" placeholder="🔍 Buscar producto para agregar a la compra..." className="win-input w-full h-10 px-4" value={entradaSearch} onChange={e => setEntradaSearch(e.target.value)} />
                {entradaSearch && (
                  <div className="search-dropdown active w-full">
                    {products.filter(p => !p.isService && (p.codigo.toLowerCase().includes(entradaSearch.toLowerCase()) || p.nombre.toLowerCase().includes(entradaSearch.toLowerCase()))).map(p => (
                      <div key={p.codigo} className="search-dropdown-item" onClick={() => {
                        setEntradaCart([...entradaCart, { codigo: p.codigo, nombre: p.nombre, cantidad: 1, costo: p.costoPromedio }]);
                        setEntradaSearch('');
                      }}>
                        {p.codigo} - {p.nombre} | Costo Actual: ${p.costoPromedio.toFixed(4)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="table-responsive h-48 bg-white">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Descripción</th>
                      <th style={{ textAlign: 'center' }}>Cant. Recibida</th>
                      <th style={{ textAlign: 'right' }}>Costo USD Unit.</th>
                      <th style={{ textAlign: 'right' }}>Total Item</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entradaCart.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.codigo}</td>
                        <td>{item.nombre}</td>
                        <td style={{ textAlign: 'center' }}>
                          <input type="number" className="w-20 text-center" value={item.cantidad} onChange={e => {
                            const newCart = [...entradaCart];
                            newCart[idx].cantidad = parseInt(e.target.value) || 0;
                            setEntradaCart(newCart);
                          }} />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <input type="text" className="w-24 text-right" value={item.costo} onChange={e => {
                            const newCart = [...entradaCart];
                            newCart[idx].costo = parseFloat(e.target.value) || 0;
                            setEntradaCart(newCart);
                          }} />
                        </td>
                        <td style={{ textAlign: 'right' }}>${(item.cantidad * item.costo).toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="dash-card bg-black text-yellow-400">
                  <div className="dash-value">${entradaCart.reduce((s, i) => s + (i.cantidad * i.costo), 0).toFixed(4)}</div>
                  <div className="dash-label">TOTAL FACTURA USD</div>
                </div>
                <div className="dash-card bg-blue-900 text-white">
                  <div className="dash-value">Bs. {(entradaCart.reduce((s, i) => s + (i.cantidad * i.costo), 0) * (parseFloat(entradaHeader.tasaBcv) || 1)).toFixed(2)}</div>
                  <div className="dash-label">EQUIV. BS.</div>
                </div>
                <div className="dash-card bg-emerald-800 text-white">
                   <input type="text" className="bg-transparent border-none text-center text-xl font-bold w-full outline-none" value={entradaHeader.pagoContadoUsd} onChange={e => handleEntradaPayment('usd', e.target.value)} />
                   <div className="dash-label">TOTAL PAGADO USD</div>
                </div>
                <div className="dash-card bg-red-900 text-white">
                   <div className="dash-value">${Math.max(0, entradaCart.reduce((s, i) => s + (i.cantidad * i.costo), 0) - (parseFloat(entradaHeader.pagoContadoUsd) || 0)).toFixed(4)}</div>
                   <div className="dash-label">PENDIENTE USD (CRÉDITO)</div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn" onClick={() => onOpenModal('modalProducto')}>➕ Nueva Ficha</button>
              <button type="button" className="btn ml-auto" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary font-black px-8">REGISTRAR COMPRA</button>
            </div>
          </form>
        </div>
      )}

      {activeModal === 'modalAjuste' && (
        <div className="modal-window" style={{ width: '400px' }} onClick={e => e.stopPropagation()}>
          <div className="win-titlebar">
            <span className="flex items-center gap-2"><RefreshCcw size={14}/> AJUSTE TÉCNICO DE INVENTARIO</span>
            <span className="modal-close" onClick={onClose}></span>
          </div>
          <form onSubmit={handleProcessAjuste}>
            <div className="modal-body space-y-4">
              <div className="form-group">
                <label>Producto:</label>
                <select className="win-input" required value={inventoryForm.codigo} onChange={e => setInventoryForm({...inventoryForm, codigo: e.target.value})}>
                  <option value="">-- Seleccionar --</option>
                  {products.filter(p => !p.isService).map(p => <option key={p.codigo} value={p.codigo}>{p.codigo} - {p.nombre}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label>Tipo Ajuste:</label>
                  <select className="win-input" value={inventoryForm.tipoAjuste} onChange={e => setInventoryForm({...inventoryForm, tipoAjuste: e.target.value})}>
                    <option value="Faltante">📉 Faltante (Gasto Merma)</option>
                    <option value="Sobrante">📈 Sobrante (Ingreso Extra)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Cantidad:</label>
                  <input type="text" className="win-input" required value={inventoryForm.cantidad} onChange={e => setInventoryForm({...inventoryForm, cantidad: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Motivo / Comentario:</label>
                <textarea className="win-input h-20" required value={inventoryForm.comentario} onChange={e => setInventoryForm({...inventoryForm, comentario: e.target.value})} />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary font-bold">APLICAR AJUSTE</button>
            </div>
          </form>
        </div>
      )}

      {activeModal === 'modalGasto' && (
        <div className="modal-window" style={{ width: '350px' }} onClick={e => e.stopPropagation()}>
          <div className="win-titlebar">
            <span className="flex items-center gap-2"><DollarSign size={14}/> REGISTRO DE GASTO OPERATIVO</span>
            <span className="modal-close" onClick={onClose}></span>
          </div>
          <form onSubmit={handleProcessGasto}>
            <div className="modal-body space-y-4">
              <div className="form-group">
                <label>Concepto del Gasto:</label>
                <input type="text" className="win-input" required placeholder="Ej: Pago de Electricidad" value={gastoForm.concepto} onChange={e => setGastoForm({...gastoForm, concepto: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Monto USD:</label>
                <input type="text" className="win-input font-bold text-red-600" required value={gastoForm.monto} onChange={e => setGastoForm({...gastoForm, monto: e.target.value})} />
              </div>
              <div className="form-group">
                <label>N° Comprobante:</label>
                <input type="text" className="win-input" value={gastoForm.referencia} onChange={e => setGastoForm({...gastoForm, referencia: e.target.value})} />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary font-bold">REGISTRAR EGRESO</button>
            </div>
          </form>
        </div>
      )}

      {activeModal === 'modalTraslado' && (
        <div className="modal-window" style={{ width: '350px' }} onClick={e => e.stopPropagation()}>
          <div className="win-titlebar">
            <span className="flex items-center gap-2"><ArrowRightLeft size={14}/> TRASLADO BANCARIO (DEPÓSITO)</span>
            <span className="modal-close" onClick={onClose}></span>
          </div>
          <form onSubmit={handleProcessTraslado}>
            <div className="modal-body space-y-4">
              <div className="form-group">
                <label>Banco Destino:</label>
                <input type="text" className="win-input" required placeholder="Ej: Banesco" value={trasladoForm.banco} onChange={e => setTrasladoForm({...trasladoForm, banco: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Monto a Retirar:</label>
                <input type="text" className="win-input font-bold" required value={trasladoForm.monto} onChange={e => setTrasladoForm({...trasladoForm, monto: e.target.value})} />
              </div>
              <div className="form-group">
                <label>N° Referencia Depósito:</label>
                <input type="text" className="win-input" value={trasladoForm.referencia} onChange={e => setTrasladoForm({...trasladoForm, referencia: e.target.value})} />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary font-bold">CONFIRMAR TRASLADO</button>
            </div>
          </form>
        </div>
      )}

      {activeModal === 'modalDevolucion' && (
        <div className="modal-window" style={{ width: '450px' }} onClick={e => e.stopPropagation()}>
          <div className="win-titlebar">
            <span className="flex items-center gap-2"><History size={14}/> PROCESAR DEVOLUCIÓN DE CLIENTE</span>
            <span className="modal-close" onClick={onClose}></span>
          </div>
          <form onSubmit={handleProcessDevolucion}>
            <div className="modal-body space-y-4">
              <div className="form-group">
                <label>N° Factura:</label>
                <input type="text" className="win-input font-bold" required value={devForm.nroFactura} onChange={e => setDevForm({...devForm, nroFactura: e.target.value.toUpperCase()})} />
              </div>
              <div className="form-group">
                <label>Acción de Stock:</label>
                <select className="win-input" value={devForm.condicion} onChange={e => setDevForm({...devForm, condicion: e.target.value})}>
                  <option value="REINTEGRADO_STOCK">✅ Reingresar al Inventario</option>
                  <option value="MERMA_DANADO">❌ Mercancía Dañada (Merma)</option>
                </select>
              </div>
              <p className="text-[10px] text-gray-500 font-bold italic">Nota: Al procesar la devolución, se generará un EGRESO en el libro de caja por el monto total de la factura reembolsada.</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary font-black px-8">EJECUTAR DEVOLUCIÓN</button>
            </div>
          </form>
        </div>
      )}

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
              <p className="text-[10px] font-bold text-blue-800 mt-2">TERMINAL: {config.terminalId}</p>
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
              <button type="button" className="btn px-8" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary px-8 font-bold flex items-center gap-2">
                <Save size={14} /> GUARDAR FICHA MAESTRA
              </button>
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
                    <option value="Tarjeta">💳 Tarjeta (Deb/Cred)</option>
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
                const usd = paymentState.method.includes('USD') || paymentState.method === 'Zelle' || paymentState.method === 'Tarjeta' ? paymentState.amount : paymentState.amount / config.tasa;
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

      {activeModal === 'modalProveedor' && (
        <div className="modal-window large" onClick={e => e.stopPropagation()} style={{ width: '600px' }}>
          <div className="win-titlebar">
            <span className="flex items-center gap-2"><Truck size={14}/> FICHA DE PROVEEDOR</span>
            <span className="modal-close" onClick={onClose}></span>
          </div>
          <form onSubmit={handleSaveProvider}>
            <div className="modal-body space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="font-bold">RIF / Documento:</label>
                  <input type="text" required value={providerForm.rif} onChange={e => setProviderForm({...providerForm, rif: e.target.value.toUpperCase()})} className="win-input" />
                </div>
                <div className="form-group">
                  <label className="font-bold">Razón Social:</label>
                  <input type="text" required value={providerForm.nombre} onChange={e => setProviderForm({...providerForm, nombre: e.target.value})} className="win-input" />
                </div>
              </div>
              <div className="form-group">
                <label className="font-bold">Dirección Fiscal:</label>
                <input type="text" value={providerForm.direccion} onChange={e => setProviderForm({...providerForm, direccion: e.target.value})} className="win-input" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="font-bold">Contacto:</label>
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
    </div>
  );
}
