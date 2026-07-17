
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Product, Client, Provider, Sale, Account, CartItem, User, InventoryMovement, CashMovement, ReportZRecord } from '@/types/pos';
import { v4 as uuidv4 } from 'uuid';
import { 
  Wallet, Search, Trash2, Save, CreditCard, UserPlus, 
  Package, UserCircle, Truck, 
  RefreshCcw, DollarSign,
  PlusCircle, FileText, Plus, Minus, Layers, Wrench, Banknote, History,
  ArrowRightLeft, LogOut, ChevronDown, CheckCircle2, Activity, Clock, Printer
} from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { doc, setDoc, writeBatch, collection, onSnapshot, query, where } from 'firebase/firestore';
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
  const [efectivoContado, setEfectivoContado] = useState('0');
  const [cobroSearch, setCobroSearch] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [montoAbono, setMontoAbono] = useState('0');

  const [gastoForm, setGastoForm] = useState({ concepto: '', monto: '0', referencia: '' });
  const [trasladoForm, setTrasladoForm] = useState({ banco: '', monto: '0', referencia: '' });
  const [devForm, setDevForm] = useState({ nroFactura: '', itemIdx: -1, cantidad: 1, condicion: 'REINTEGRADO_STOCK', motivo: '' });

  const [finalReportZ, setFinalReportZ] = useState<ReportZRecord | null>(null);

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

  const handleFinalizeCorteZ = async (e: React.FormEvent) => {
    e.preventDefault();
    const arqueo = parseFloat(efectivoContado) || 0;
    const stats = editingId;
    const batch = writeBatch(db);
    const zId = uuidv4();
    
    const grandTotalActual = config.grandTotalHistory + stats.ventaNeta;
    
    const newZ: ReportZRecord = {
      id: zId,
      numero: stats.numeroZ,
      fecha: stats.date,
      vendedor: config.vendedor,
      terminalId: stats.terminalId,
      facturaInicio: stats.facturaInicio,
      facturaFin: stats.facturaFin,
      baseImponible: stats.baseImponible,
      ventaBruta: stats.baseImponible,
      ventaNeta: stats.ventaNeta,
      ivaTotal: stats.ivaTotal,
      igtfTotal: stats.ventaNeta * 0.03,
      exentoTotal: 0,
      anulaciones: stats.anulaciones,
      gastosTotal: stats.gastos,
      trasladosTotal: stats.traslados,
      grandTotalAcumulado: grandTotalActual,
      efectivoSistema: stats.efectivoSistema,
      efectivoReal: arqueo,
      diferencia: arqueo - stats.efectivoSistema,
      desglosePagos: [
        { method: 'Efectivo', total: stats.methodTotals.efectivo },
        { method: 'Tarjetas', total: stats.methodTotals.tarjetas },
        { method: 'Transferencias', total: stats.methodTotals.transferencias }
      ]
    };

    batch.set(doc(db, 'accounting/audit/reportsZ', zId), newZ);
    batch.set(doc(db, 'system', 'config'), {
      ...config,
      reportZCounter: config.reportZCounter + 1,
      grandTotalHistory: grandTotalActual,
      lastZDate: stats.date
    });

    await batch.commit();
    setFinalReportZ(newZ);
    notify(`✅ Corte Z-${stats.numeroZ} Procesado`);
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
      if (!product.isService) {
        const newStock = product.stock - item.cantidad;
        batch.update(doc(db, 'products', product.codigo), { stock: newStock });
      }
    }
    await batch.commit();
    setLastSale(sale);
    setCart([]);
    notify('✅ Venta procesada');
    onClose();
  };

  if (!activeModal && !lastSale && !finalReportZ) return null;

  return (
    <div className="modal-overlay active" onClick={() => { if(!lastSale && !finalReportZ) onClose(); else { setLastSale(null); setFinalReportZ(null); } }}>
      
      {activeModal === 'modalCorteZ' && editingId && (
        <div className="modal-window" style={{ width: '400px' }} onClick={e => e.stopPropagation()}>
          <div className="win-titlebar bg-red-800">
             <span className="flex items-center gap-2"><FileText size={14}/> ARQUEO DE CIERRE DIARIO (Z)</span>
             <span className="modal-close" onClick={onClose}></span>
          </div>
          <form onSubmit={handleFinalizeCorteZ}>
            <div className="modal-body p-6 space-y-6">
               <div className="text-center">
                  <h3 className="font-black text-xl mb-1 uppercase">Terminal {editingId.terminalId}</h3>
                  <p className="text-xs text-gray-500 font-bold">REPORTE Z NRO: {editingId.numeroZ}</p>
               </div>

               <div className="bg-blue-50 p-4 border border-blue-200">
                  <p className="text-[10px] font-bold text-blue-800 uppercase mb-2">Resumen de Ventas:</p>
                  <div className="flex justify-between font-black text-lg">
                     <span>VENTA NETA:</span>
                     <span>${editingId.ventaNeta.toFixed(2)}</span>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="form-group">
                     <label className="font-black text-xs uppercase text-gray-600">Efectivo Real Contado (Gaveta):</label>
                     <input 
                       type="text" 
                       autoFocus
                       value={efectivoContado} 
                       onChange={e => setEfectivoContado(e.target.value)} 
                       className="win-input text-center text-4xl font-black text-emerald-700 h-20 bg-yellow-50 border-2 border-emerald-500" 
                     />
                  </div>
                  <p className="text-[9px] text-center text-gray-500 italic">** El sistema comparará esta cifra con el fondo inicial y las ventas en efectivo para calcular el arqueo final. **</p>
               </div>
            </div>
            <div className="modal-footer bg-gray-100">
              <button type="button" className="btn" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-success font-black px-12 py-3 flex items-center gap-2">
                <Printer size={18}/> CONFIRMAR Y CERRAR DÍA
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
                        <option value="Mecánica">Mecánica</option>
                        <option value="Eléctrico">Eléctrico</option>
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

              {!productForm.isService && (
                <div className="win-window p-4 mb-6" style={{ background: '#c0c0c0', border: '1px solid #808080' }}>
                  <h4 className="font-bold mb-4 border-b pb-2">📦 Gestión de Inventario y Precios Alternativos</h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="form-group">
                      <label className="font-bold">Stock Inicial:</label>
                      <input type="text" disabled={editingId !== null} value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} className={`win-input font-black text-center ${editingId !== null ? 'bg-gray-200' : 'bg-green-50'}`} />
                    </div>
                    <div className="form-group">
                      <label className="font-bold">Stock Mínimo:</label>
                      <input type="text" value={productForm.stockMin} onChange={e => setProductForm({...productForm, stockMin: e.target.value})} className="win-input font-black text-center" />
                    </div>
                    <div className="form-group">
                      <label className="font-bold">Precio Mayor (USD):</label>
                      <input type="text" value={productForm.precio2} onChange={e => setProductForm({...productForm, precio2: e.target.value})} className="win-input" />
                    </div>
                    <div className="form-group">
                      <label className="font-bold">Precio Promoción:</label>
                      <input type="text" value={productForm.precio3} onChange={e => setProductForm({...productForm, precio3: e.target.value})} className="win-input" />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 mt-4">
                    <div className="form-group">
                      <label className="font-bold">IVA (%):</label>
                      <select className="win-input" value={productForm.iva} onChange={e => handlePriceUpdate('iva', parseFloat(e.target.value))}>
                        <option value={16}>16%</option>
                        <option value={8}>8%</option>
                        <option value={0}>0%</option>
                      </select>
                    </div>
                    <div className="form-group flex items-center gap-2 pt-6">
                      <label className="font-black cursor-pointer flex items-center gap-2">
                        <input type="checkbox" checked={productForm.exento} onChange={e => handlePriceUpdate('exento', e.target.checked)} className="size-4" /> ITEM EXENTO
                      </label>
                    </div>
                    <div className="form-group">
                      <label className="font-bold">Ubicación:</label>
                      <input type="text" value={productForm.ubicacion} onChange={e => setProductForm({...productForm, ubicacion: e.target.value})} className="win-input" placeholder="Pasillo/Estante" />
                    </div>
                    <div className="form-group">
                      <label className="font-bold">Costo Referencial:</label>
                      <input type="text" value={productForm.precio4} onChange={e => setProductForm({...productForm, precio4: e.target.value})} className="win-input" />
                    </div>
                  </div>
                </div>
              )}

              <div className="win-window p-4" style={{ background: '#c0c0c0', border: '1px solid #808080' }}>
                <div className="flex items-center justify-between mb-4 border-b pb-2">
                   <h4 className="font-bold flex items-center gap-2">
                     <Layers size={16}/> CONFIGURACIÓN DE KIT / COMBO VIRTUAL
                   </h4>
                   <label className="flex items-center gap-2 font-black cursor-pointer">
                     <input type="checkbox" checked={productForm.isKit} onChange={e => setProductForm({...productForm, isKit: e.target.checked, stockPropio: !e.target.checked})} className="size-4" /> ACTIVAR COMBO
                   </label>
                </div>
                
                {productForm.isKit && (
                  <div className="animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex gap-4 mb-4">
                       <label className="flex items-center gap-2 text-[11px] font-bold">
                         <input type="radio" checked={productForm.stockPropio} onChange={() => setProductForm({...productForm, stockPropio: true})} /> Combo con Stock Propio (Caja Cerrada)
                       </label>
                       <label className="flex items-center gap-2 text-[11px] font-bold">
                         <input type="radio" checked={!productForm.stockPropio} onChange={() => setProductForm({...productForm, stockPropio: false})} /> Combo Virtual (Descuenta componentes individuales)
                       </label>
                    </div>
                    <p className="text-[10px] text-gray-500 mb-4 italic">** Busque y agregue los componentes que conforman este paquete. El sistema validará el stock de cada uno al vender. **</p>
                    <div className="table-responsive bg-white max-h-[150px]">
                       <table className="data-table">
                          <thead>
                             <tr><th>Código</th><th>Componente</th><th>Cant x Kit</th><th>Acción</th></tr>
                          </thead>
                          <tbody>
                             {productForm.kitComponents.map((comp: any, i: number) => (
                               <tr key={i}>
                                  <td>{comp.codigo}</td>
                                  <td>{comp.descripcion}</td>
                                  <td><input type="number" value={comp.cantidad} onChange={() => {}} className="w-16 border text-center" /></td>
                                  <td className="text-center"><button type="button" className="text-red-600"><Trash2 size={12}/></button></td>
                               </tr>
                             ))}
                             <tr>
                                <td colSpan={4} className="text-center p-2">
                                   <button type="button" className="btn btn-primary text-[10px]" onClick={() => notify('🔍 Buscador de componentes...')}>➕ AGREGAR COMPONENTE AL KIT</button>
                                </td>
                             </tr>
                          </tbody>
                       </table>
                    </div>
                  </div>
                )}
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

      {activeModal === 'modalCliente' && (
        <div className="modal-window" onClick={e => e.stopPropagation()}>
          <div className="win-titlebar"><span>👤 REGISTRO DE CLIENTE</span><span className="modal-close" onClick={onClose}></span></div>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const batch = writeBatch(db);
            const ref = doc(db, 'clients', clientForm.rifNum);
            batch.set(ref, clientForm);
            await batch.commit();
            notify('✅ Cliente guardado');
            onClose();
          }}>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group"><label>RIF/CI:</label><div className="flex gap-1">
                  <select value={clientForm.tipoRif} onChange={e => setClientForm({...clientForm, tipoRif: e.target.value})}><option value="V">V</option><option value="J">J</option><option value="E">E</option></select>
                  <input type="text" required value={clientForm.rifNum} onChange={e => setClientForm({...clientForm, rifNum: e.target.value})} />
                </div></div>
              </div>
              <div className="form-group"><label>Nombre / Razón Social:</label><input type="text" required value={clientForm.nombre} onChange={e => setClientForm({...clientForm, nombre: e.target.value})} /></div>
              <div className="form-group"><label>Dirección:</label><textarea value={clientForm.direccion} onChange={e => setClientForm({...clientForm, direccion: e.target.value})} /></div>
              <div className="form-row">
                <div className="form-group"><label>Teléfono:</label><input type="text" value={clientForm.telefono} onChange={e => setClientForm({...clientForm, telefono: e.target.value})} /></div>
                <div className="form-group"><label>Email:</label><input type="email" value={clientForm.email} onChange={e => setClientForm({...clientForm, email: e.target.value})} /></div>
              </div>
            </div>
            <div className="modal-footer"><button type="button" className="btn" onClick={onClose}>Cancelar</button><button type="submit" className="btn btn-primary">Guardar Cliente</button></div>
          </form>
        </div>
      )}

      {activeModal === 'modalProveedor' && (
        <div className="modal-window" onClick={e => e.stopPropagation()}>
          <div className="win-titlebar">
            <span className="flex items-center gap-2"><Truck size={14}/> REGISTRO DE PROVEEDOR</span>
            <span className="modal-close" onClick={onClose}></span>
          </div>
          <form onSubmit={handleSaveProvider}>
            <div className="modal-body p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="font-bold">RIF (J-00000000-0):</label>
                  <input type="text" required value={providerForm.rif} onChange={e => setProviderForm({...providerForm, rif: e.target.value.toUpperCase()})} className="win-input" />
                </div>
                <div className="form-group">
                  <label className="font-bold">Nombre / Razón Social:</label>
                  <input type="text" required value={providerForm.nombre} onChange={e => setProviderForm({...providerForm, nombre: e.target.value})} className="win-input" />
                </div>
              </div>
              <div className="form-group">
                <label className="font-bold">Dirección Fiscal:</label>
                <textarea value={providerForm.direccion} onChange={e => setProviderForm({...providerForm, direccion: e.target.value})} className="win-input h-20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="font-bold">Persona de Contacto:</label>
                  <input type="text" value={providerForm.contacto} onChange={e => setProviderForm({...providerForm, contacto: e.target.value})} className="win-input" />
                </div>
                <div className="form-group">
                  <label className="font-bold">Teléfono Móvil:</label>
                  <input type="text" value={providerForm.telefono} onChange={e => setProviderForm({...providerForm, telefono: e.target.value})} className="win-input" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary font-bold">REGISTRAR PROVEEDOR</button>
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

      {activeModal === 'modalAperturaCaja' && (
        <div className="modal-window" style={{ width: '350px' }} onClick={e => e.stopPropagation()}>
          <div className="win-titlebar bg-green-800">
            <span className="flex items-center gap-2"><Banknote size={14}/> APERTURA DE CAJA</span>
            <span className="modal-close" onClick={onClose}></span>
          </div>
          <form onSubmit={handleProcessApertura}>
            <div className="modal-body p-6 space-y-4">
               <div className="text-center mb-4">
                  <h3 className="font-black text-xl mb-1 uppercase">Terminal {config.terminalId}</h3>
                  <p className="text-xs text-gray-500 font-bold">{new Date().toLocaleDateString()}</p>
               </div>
               <div className="form-group">
                  <label className="font-bold text-xs uppercase text-gray-600">Monto del Fondo Inicial (USD):</label>
                  <input 
                    type="text" 
                    autoFocus
                    value={aperturaMonto} 
                    onChange={e => setAperturaMonto(e.target.value)} 
                    className="win-input text-center text-3xl font-black text-green-700 h-16 bg-green-50" 
                  />
               </div>
               <p className="text-[10px] text-gray-400 italic">** Este monto será registrado como el efectivo base para dar cambio durante la jornada. **</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary font-black px-6 py-2">CONFIRMAR APERTURA</button>
            </div>
          </form>
        </div>
      )}

      {activeModal === 'modalCobroDeuda' && (
        <div className="modal-window large" style={{ width: '650px' }} onClick={e => e.stopPropagation()}>
          <div className="win-titlebar">
            <span className="flex items-center gap-2"><History size={14}/> COBRO DE CUENTAS POR COBRAR (CXC)</span>
            <span className="modal-close" onClick={onClose}></span>
          </div>
          <form onSubmit={handleProcessCobro}>
            <div className="modal-body p-6 space-y-6">
               <div className="toolbar bg-gray-100 p-2">
                  <Search size={16} className="text-gray-400"/>
                  <input 
                    type="text" 
                    placeholder="Buscar por cliente o factura..." 
                    value={cobroSearch} 
                    onChange={e => setCobroSearch(e.target.value)} 
                    className="win-input flex-1" 
                  />
               </div>

               <div className="table-responsive max-h-[250px] bg-white border border-gray-300">
                  <table className="data-table">
                     <thead>
                        <tr><th>Fecha</th><th>Referencia</th><th>Cliente</th><th style={{ textAlign: 'right' }}>Deuda USD</th></tr>
                     </thead>
                     <tbody>
                        {accounts.filter(a => a.tipo === 'CXC' && a.estado !== 'Pagada' && (a.entidad.toLowerCase().includes(cobroSearch.toLowerCase()) || a.referencia.includes(cobroSearch))).map(a => (
                          <tr key={a.id} className={selectedAccount?.id === a.id ? 'selected' : ''} onClick={() => { setSelectedAccount(a); setMontoAbono((a.montoTotal - a.montoPagado).toString()); }}>
                             <td>{a.fechaEmision}</td>
                             <td className="font-bold">{a.referencia}</td>
                             <td>{a.entidad}</td>
                             <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#e04040' }}>${(a.montoTotal - a.montoPagado).toFixed(2)}</td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </div>

               {selectedAccount && (
                 <div className="bg-yellow-50 p-6 border-2 border-yellow-200 animate-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-4">
                       <div>
                          <p className="text-[10px] font-black uppercase text-gray-500">Abonar a Factura:</p>
                          <h4 className="font-black text-lg">{selectedAccount.referencia} - {selectedAccount.entidad}</h4>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-black uppercase text-gray-500">Saldo Pendiente:</p>
                          <h4 className="font-black text-2xl text-red-600">${(selectedAccount.montoTotal - selectedAccount.montoPagado).toFixed(2)}</h4>
                       </div>
                    </div>
                    <div className="form-group">
                       <label className="font-black text-xs">Monto a Cobrar (USD):</label>
                       <input 
                         type="text" 
                         value={montoAbono} 
                         onChange={e => setMontoAbono(e.target.value)} 
                         className="win-input text-2xl font-black text-green-700 bg-white" 
                       />
                    </div>
                 </div>
               )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn" onClick={onClose}>Cerrar</button>
              <button type="submit" disabled={!selectedAccount} className="btn btn-success font-black px-10 py-3 flex items-center gap-2">
                <CheckCircle2 size={18}/> PROCESAR COBRO
              </button>
            </div>
          </form>
        </div>
      )}

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
                 <div className="flex justify-between font-bold text-blue-800"><span>VENTAS TOTALES BRUTAS:</span> <span>${editingId.ventaNeta.toFixed(2)}</span></div>
                 <div className="flex justify-between text-gray-500"><span>IMPUESTOS (IVA):</span> <span>${editingId.ivaTotal.toFixed(2)}</span></div>
              </div>

              <div className="bg-gray-100 p-2 border border-gray-300">
                 <p className="font-black border-b border-gray-400 mb-1">DESGLOSE POR MÉTODO:</p>
                 <div className="flex justify-between"><span>Efectivo (Cash):</span> <span>${editingId.methodTotals.efectivo.toFixed(2)}</span></div>
                 <div className="flex justify-between"><span>Tarjetas:</span> <span>${editingId.methodTotals.tarjetas.toFixed(2)}</span></div>
                 <div className="flex justify-between"><span>Transf. / Digital:</span> <span>${editingId.methodTotals.transferencias.toFixed(2)}</span></div>
              </div>

              <div className="bg-black text-yellow-400 p-3 text-center border-2 border-yellow-400">
                 <p className="text-[10px] font-bold">EFECTIVO TEÓRICO EN CAJA</p>
                 <p className="text-2xl font-black">${editingId.efectivoSistema.toFixed(2)}</p>
              </div>

              <p className="text-[9px] text-center text-gray-500 italic">** Consulta informativa. No cierra la terminal fiscalmente. **</p>
           </div>
           <div className="modal-footer flex gap-2">
              <button className="btn flex items-center gap-2" onClick={() => window.print()}><Printer size={14}/> Imprimir</button>
              <button className="btn ml-auto" onClick={onClose}>Cerrar</button>
           </div>
        </div>
      )}

      {activeModal === 'modalProcesar' && (
        <div className="modal-window large" onClick={e => e.stopPropagation()} style={{ width: '650px' }}>
          <div className="win-titlebar bg-emerald-800">
            <span className="flex items-center gap-2"><CreditCard size={14}/> FINALIZAR VENTA - PROCESO DE PAGO</span>
            <span className="modal-close" onClick={onClose}></span>
          </div>
          <div className="modal-body p-6">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-gray-100 p-4 border border-gray-300 rounded shadow-inner">
                  <p className="text-[10px] font-black text-gray-500 uppercase mb-2">Total a Cancelar:</p>
                  <div className="text-4xl font-black text-primary">${cart.reduce((acc, item) => acc + (item.precioUsd * item.cantidad * (1 + item.iva / 100)), 0).toFixed(2)}</div>
                  <div className="text-xl font-bold text-gray-400 mt-1">Bs. {(cart.reduce((acc, item) => acc + (item.precioUsd * item.cantidad * (1 + item.iva / 100)), 0) * config.tasa).toFixed(2)}</div>
                </div>

                <div className="space-y-4">
                  <div className="form-group">
                    <label className="font-bold">Método de Pago:</label>
                    <select ref={methodRef} className="win-input h-10 font-bold" defaultValue="Efectivo USD" onChange={() => amountRef.current?.focus()}>
                      <option value="Efectivo USD">Efectivo USD</option>
                      <option value="Efectivo BS">Efectivo BS</option>
                      <option value="Pago Móvil">Pago Móvil</option>
                      <option value="Transferencia">Transferencia</option>
                      <option value="Tarjeta Debito/Credito">Tarjeta Debito/Credito</option>
                      <option value="Zelle">Zelle</option>
                      <option value="Binance">Binance (USDT)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="font-bold">Monto Recibido:</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-gray-400">$</span>
                      <input 
                        ref={amountRef}
                        type="text" 
                        placeholder="0.00" 
                        className="win-input h-14 pl-8 text-2xl font-black text-emerald-700"
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            const val = parseFloat((e.target as HTMLInputElement).value) || 0;
                            if (val > 0) {
                              const method = methodRef.current?.value || 'Efectivo USD';
                              const totalActual = paymentState.payments.reduce((s, p) => s + p.usd, 0) + val;
                              setPaymentState({
                                ...paymentState,
                                payments: [...paymentState.payments, { method, usd: val, bs: val * config.tasa }],
                                totalPaidUsd: totalActual
                              });
                              (e.target as HTMLInputElement).value = '';
                              notify(`➕ ${method} agregado: $${val}`);
                            }
                          }
                        }}
                      />
                    </div>
                    <p className="text-[9px] text-gray-500 mt-1 uppercase font-bold">Presione ENTER para agregar el pago parcial</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col">
                <h4 className="font-black text-xs uppercase text-gray-500 mb-3 flex items-center gap-2">
                  <History size={14}/> Desglose de Pagos:
                </h4>
                <div className="flex-1 bg-white border-2 border-gray-300 rounded overflow-y-auto mb-4 p-2">
                  {paymentState.payments.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-300 font-bold italic text-xs">Esperando pagos...</div>
                  ) : (
                    <div className="space-y-2">
                      {paymentState.payments.map((p, i) => (
                        <div key={i} className="flex justify-between items-center bg-gray-50 p-2 border border-gray-200 rounded animate-in slide-in-from-right-2">
                          <div>
                            <p className="text-[10px] font-black text-primary">{p.method}</p>
                            <p className="text-xs font-bold">${p.usd.toFixed(2)}</p>
                          </div>
                          <button className="text-red-600 hover:scale-110 transition-transform" onClick={() => {
                            const newPayments = paymentState.payments.filter((_, idx) => idx !== i);
                            setPaymentState({
                              ...paymentState,
                              payments: newPayments,
                              totalPaidUsd: newPayments.reduce((s, pay) => s + pay.usd, 0)
                            });
                          }}><Trash2 size={14}/></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-gray-800 text-white p-4 rounded shadow-lg">
                   <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold opacity-60">PAGADO:</span>
                      <span className="font-black">${paymentState.totalPaidUsd.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between items-center border-t border-white/10 pt-2">
                      <span className="text-[10px] font-bold opacity-60">DIFERENCIA / CAMBIO:</span>
                      <span className={`text-xl font-black ${paymentState.totalPaidUsd >= cart.reduce((acc, item) => acc + (item.precioUsd * item.cantidad * (1 + item.iva / 100)), 0) ? 'text-green-400' : 'text-red-400'}`}>
                        ${(paymentState.totalPaidUsd - cart.reduce((acc, item) => acc + (item.precioUsd * item.cantidad * (1 + item.iva / 100)), 0)).toFixed(2)}
                      </span>
                   </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer bg-gray-100">
            <button className="btn px-8" onClick={() => { setPaymentState({ method: 'Efectivo USD', amount: 0, payments: [], totalPaidUsd: 0 }); onClose(); }}>Cancelar</button>
            <button 
              className="btn btn-success px-12 py-3 font-black text-lg flex items-center gap-3 shadow-lg disabled:opacity-50 disabled:grayscale" 
              disabled={paymentState.totalPaidUsd < cart.reduce((acc, item) => acc + (item.precioUsd * item.cantidad * (1 + item.iva / 100)), 0) - 0.01 && !clientInfo.isCredit}
              onClick={finalizeSale}
            >
              <CheckCircle2 size={24}/> {clientInfo.isCredit ? 'PROCESAR CRÉDITO' : 'CONFIRMAR PAGO'}
            </button>
          </div>
        </div>
      )}

      {activeModal === 'modalEntrada' && (
        <div className="modal-window xlarge" style={{ width: '900px' }} onClick={e => e.stopPropagation()}>
           <div className="win-titlebar bg-blue-900">
              <span className="flex items-center gap-2"><ArrowRightLeft size={14}/> RECEPCIÓN DE MERCANCÍA / COMPRA DE INVENTARIO</span>
              <span className="modal-close" onClick={onClose}></span>
           </div>
           <div className="modal-body p-6 flex flex-col gap-6" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
              <div className="grid grid-cols-4 gap-4 bg-gray-200 p-4 border border-gray-400">
                 <div className="form-group">
                    <label className="font-bold">Proveedor:</label>
                    <select className="win-input" value={entradaHeader.proveedor} onChange={e => setEntradaHeader({...entradaHeader, proveedor: e.target.value})}>
                       <option value="">-- Seleccionar --</option>
                       {providers.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                    </select>
                 </div>
                 <div className="form-group">
                    <label className="font-bold">N° Factura:</label>
                    <input type="text" className="win-input" value={entradaHeader.nroFactura} onChange={e => setEntradaHeader({...entradaHeader, nroFactura: e.target.value})} />
                 </div>
                 <div className="form-group">
                    <label className="font-bold">Tipo Compra:</label>
                    <select className="win-input" value={entradaHeader.tipoCompra} onChange={e => setEntradaHeader({...entradaHeader, tipoCompra: e.target.value})}>
                       <option value="Contado">Contado (Efectivo)</option>
                       <option value="Credito">A Crédito (CXP)</option>
                    </select>
                 </div>
                 <div className="form-group">
                    <label className="font-bold">Tasa BCV:</label>
                    <input type="number" step="0.01" className="win-input bg-yellow-50" value={entradaHeader.tasaBcv} onChange={e => setEntradaHeader({...entradaHeader, tasaBcv: e.target.value})} />
                 </div>
              </div>

              <div className="flex gap-4 items-end">
                 <div className="flex-1 form-group relative">
                    <label className="font-bold">Buscar Producto:</label>
                    <input 
                      type="text" 
                      placeholder="Código, Nombre o Barcode..." 
                      className="win-input h-12 text-lg" 
                      value={entradaSearch} 
                      onChange={e => setEntradaSearch(e.target.value)} 
                    />
                    {entradaSearch && (
                      <div className="absolute top-full left-0 w-full bg-white border-2 border-blue-900 z-50 shadow-2xl max-h-60 overflow-y-auto">
                        {products.filter(p => !p.isService && (p.codigo.toLowerCase().includes(entradaSearch.toLowerCase()) || p.nombre.toLowerCase().includes(entradaSearch.toLowerCase()))).map(p => (
                          <div key={p.codigo} className="p-3 border-b hover:bg-blue-50 cursor-pointer flex justify-between" onClick={() => {
                            setEntradaCart([...entradaCart, { ...p, cantRecibida: 1, costoNuevo: p.costoPromedio }]);
                            setEntradaSearch('');
                          }}>
                            <strong>{p.codigo}</strong> {p.nombre} <span>Stock: {p.stock}</span>
                          </div>
                        ))}
                      </div>
                    )}
                 </div>
                 <button type="button" className="btn btn-primary h-12 flex items-center gap-2" onClick={() => onOpenModal('modalProducto')}>
                   <PlusCircle size={18}/> NUEVA FICHA
                 </button>
              </div>

              <div className="table-responsive bg-white border-2 border-gray-400 flex-1">
                 <table className="data-table">
                    <thead>
                       <tr><th>Código</th><th>Producto</th><th>Cant. Actual</th><th>Cant. Recibida</th><th>Costo Unidad (USD)</th><th>Subtotal</th><th>Acción</th></tr>
                    </thead>
                    <tbody>
                       {entradaCart.map((item, i) => (
                         <tr key={i}>
                            <td>{item.codigo}</td>
                            <td>{item.nombre}</td>
                            <td className="text-center">{item.stock}</td>
                            <td className="p-1"><input type="number" className="w-20 border text-center font-bold" value={item.cantRecibida} onChange={e => {
                               const newCart = [...entradaCart];
                               newCart[i].cantRecibida = parseFloat(e.target.value) || 0;
                               setEntradaCart(newCart);
                            }} /></td>
                            <td className="p-1"><input type="number" step="0.0001" className="w-24 border text-right font-bold" value={item.costoNuevo} onChange={e => {
                               const newCart = [...entradaCart];
                               newCart[i].costoNuevo = parseFloat(e.target.value) || 0;
                               setEntradaCart(newCart);
                            }} /></td>
                            <td className="text-right font-bold">${(item.cantRecibida * item.costoNuevo).toFixed(2)}</td>
                            <td className="text-center"><button className="text-red-600" onClick={() => setEntradaCart(entradaCart.filter((_, idx) => idx !== i))}><Trash2 size={14}/></button></td>
                         </tr>
                       ))}
                       {entradaCart.length === 0 && <tr><td colSpan={7} className="text-center p-10 text-gray-400 italic">No hay productos en la lista de recepción</td></tr>}
                    </tbody>
                 </table>
              </div>

              <div className="bg-gray-800 text-white p-6 flex justify-between items-center rounded-lg">
                 <div>
                    <p className="text-xs font-bold opacity-60">TOTAL COMPRA (USD):</p>
                    <p className="text-4xl font-black">${entradaCart.reduce((acc, it) => acc + (it.cantRecibida * it.costoNuevo), 0).toFixed(2)}</p>
                 </div>
                 <button className="btn btn-success px-12 py-4 font-black text-xl shadow-xl flex items-center gap-3" disabled={entradaCart.length === 0 || !entradaHeader.proveedor} onClick={async () => {
                    const batch = writeBatch(db);
                    const fecha = new Date().toISOString();
                    const totalUsd = entradaCart.reduce((acc, it) => acc + (it.cantRecibida * it.costoNuevo), 0);

                    for (const item of entradaCart) {
                      const prodRef = doc(db, 'products', item.codigo);
                      const newStock = item.stock + item.cantRecibida;
                      const newCosto = ((item.stock * item.costoPromedio) + (item.cantRecibida * item.costoNuevo)) / newStock;
                      batch.update(prodRef, { stock: newStock, costoPromedio: newCosto });

                      const movId = uuidv4();
                      batch.set(doc(db, 'inventory_movements', movId), {
                        id: movId, fecha, codigoProducto: item.codigo, tipo: 'ENTRADA',
                        cantidad: item.cantRecibida, stockPrevio: item.stock, stockNuevo: newStock,
                        costo: item.costoNuevo, referencia: entradaHeader.nroFactura,
                        comentario: `Compra a proveedor: ${entradaHeader.proveedor}`, usuario: config.vendedor
                      });
                    }

                    if (entradaHeader.tipoCompra === 'Contado') {
                      const movId = uuidv4();
                      batch.set(doc(db, 'accounting/audit/cash_movements', movId), {
                        id: movId, fecha, tipo: 'EGRESO', montoUsd: totalUsd, montoBs: totalUsd * config.tasa,
                        metodo: 'Efectivo USD', referencia: entradaHeader.nroFactura, terminalId: config.terminalId,
                        concepto: `COMPRA MERCANCIA: ${entradaHeader.proveedor}`, usuario: config.vendedor
                      });
                    } else {
                      const accId = uuidv4();
                      batch.set(doc(db, 'accounts', accId), {
                        id: accId, entidad: entradaHeader.proveedor, rif: 'N/A', montoTotal: totalUsd,
                        montoPagado: 0, fechaEmision: fecha, estado: 'Pendiente',
                        referencia: entradaHeader.nroFactura, tipo: 'CXP'
                      });
                    }

                    await batch.commit();
                    notify('✅ Inventario actualizado correctamente');
                    setEntradaCart([]);
                    onClose();
                 }}>
                   <Save size={24}/> PROCESAR RECEPCIÓN
                 </button>
              </div>
           </div>
        </div>
      )}

      {activeModal === 'modalAjuste' && (
        <div className="modal-window" style={{ width: '450px' }} onClick={e => e.stopPropagation()}>
           <div className="win-titlebar bg-amber-700">
              <span className="flex items-center gap-2"><Wrench size={14}/> AJUSTE MANUAL DE INVENTARIO</span>
              <span className="modal-close" onClick={onClose}></span>
           </div>
           <form onSubmit={async (e) => {
             e.preventDefault();
             const prod = products.find(p => p.codigo === inventoryForm.codigo);
             if (!prod) return notify('❌ Producto no encontrado', 'error');

             const cant = parseFloat(inventoryForm.cantidad);
             const realCant = inventoryForm.tipoAjuste === 'Faltante' ? -cant : cant;
             const newStock = prod.stock + realCant;

             const batch = writeBatch(db);
             batch.update(doc(db, 'products', prod.codigo), { stock: newStock });

             const movId = uuidv4();
             batch.set(doc(db, 'inventory_movements', movId), {
                id: movId, fecha: new Date().toISOString(), codigoProducto: prod.codigo, 
                tipo: 'AJUSTE', cantidad: realCant, stockPrevio: prod.stock, stockNuevo: newStock,
                costo: prod.costoPromedio, referencia: inventoryForm.referencia || 'AJUSTE_MANUAL',
                comentario: inventoryForm.comentario || `Ajuste por ${inventoryForm.tipoAjuste}`,
                usuario: config.vendedor
             });

             await batch.commit();
             notify('✅ Ajuste procesado');
             onClose();
           }}>
             <div className="modal-body p-6 space-y-4">
                <div className="form-group">
                   <label className="font-bold">Producto:</label>
                   <select className="win-input" value={inventoryForm.codigo} onChange={e => setInventoryForm({...inventoryForm, codigo: e.target.value})}>
                      <option value="">-- Seleccionar --</option>
                      {products.filter(p => !p.isService).map(p => <option key={p.codigo} value={p.codigo}>{p.codigo} - {p.nombre} (Stock: {p.stock})</option>)}
                   </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="form-group">
                      <label className="font-bold">Tipo Ajuste:</label>
                      <select className="win-input" value={inventoryForm.tipoAjuste} onChange={e => setInventoryForm({...inventoryForm, tipoAjuste: e.target.value})}>
                         <option value="Faltante">Faltante (Egreso)</option>
                         <option value="Sobrante">Sobrante (Ingreso)</option>
                      </select>
                   </div>
                   <div className="form-group">
                      <label className="font-bold">Cantidad:</label>
                      <input type="number" step="0.01" className="win-input font-black text-center" value={inventoryForm.cantidad} onChange={e => setInventoryForm({...inventoryForm, cantidad: e.target.value})} />
                   </div>
                </div>
                <div className="form-group">
                   <label className="font-bold">Referencia / Motivo:</label>
                   <input type="text" className="win-input" value={inventoryForm.referencia} onChange={e => setInventoryForm({...inventoryForm, referencia: e.target.value})} placeholder="Ej: Merma, Conteo físico..." />
                </div>
                <div className="form-group">
                   <label className="font-bold">Comentario:</label>
                   <textarea className="win-input h-20" value={inventoryForm.comentario} onChange={e => setInventoryForm({...inventoryForm, comentario: e.target.value})} />
                </div>
             </div>
             <div className="modal-footer bg-gray-100">
                <button type="button" className="btn" onClick={onClose}>Cancelar</button>
                <button type="submit" className="btn btn-warning font-black px-8">APLICAR AJUSTE</button>
             </div>
           </form>
        </div>
      )}

      {activeModal === 'modalGasto' && (
        <div className="modal-window" style={{ width: '400px' }} onClick={e => e.stopPropagation()}>
           <div className="win-titlebar bg-red-900">
              <span className="flex items-center gap-2"><DollarSign size={14}/> REGISTRO DE GASTO OPERATIVO</span>
              <span className="modal-close" onClick={onClose}></span>
           </div>
           <form onSubmit={async (e) => {
              e.preventDefault();
              const monto = parseFloat(gastoForm.monto) || 0;
              const batch = writeBatch(db);
              const movId = uuidv4();
              const fecha = new Date().toISOString();

              batch.set(doc(db, 'accounting/audit/cash_movements', movId), {
                id: movId, fecha, tipo: 'EGRESO', montoUsd: monto, montoBs: monto * config.tasa,
                metodo: 'Efectivo USD', referencia: gastoForm.referencia || 'GASTO_OPERATIVO', terminalId: config.terminalId,
                concepto: `GASTO: ${gastoForm.concepto}`, usuario: config.vendedor
              });

              await batch.commit();
              notify('✅ Gasto registrado correctamente');
              setGastoForm({ concepto: '', monto: '0', referencia: '' });
              onClose();
           }}>
              <div className="modal-body p-6 space-y-4">
                 <div className="form-group">
                    <label className="font-bold">Concepto / Motivo:</label>
                    <input type="text" required value={gastoForm.concepto} onChange={e => setGastoForm({...gastoForm, concepto: e.target.value})} className="win-input" placeholder="Ej: Pago Luz, Almuerzos, etc." />
                 </div>
                 <div className="form-group">
                    <label className="font-bold">Monto (USD):</label>
                    <input type="text" required value={gastoForm.monto} onChange={e => setGastoForm({...gastoForm, monto: e.target.value})} className="win-input text-2xl font-black text-red-600" />
                 </div>
                 <div className="form-group">
                    <label className="font-bold">Referencia Doc:</label>
                    <input type="text" value={gastoForm.referencia} onChange={e => setGastoForm({...gastoForm, referencia: e.target.value})} className="win-input" />
                 </div>
              </div>
              <div className="modal-footer bg-gray-100">
                 <button type="button" className="btn" onClick={onClose}>Cancelar</button>
                 <button type="submit" className="btn btn-primary">REGISTRAR EGRESO</button>
              </div>
           </form>
        </div>
      )}

      {activeModal === 'modalTraslado' && (
        <div className="modal-window" style={{ width: '400px' }} onClick={e => e.stopPropagation()}>
           <div className="win-titlebar bg-indigo-900">
              <span className="flex items-center gap-2"><ArrowRightLeft size={14}/> TRASLADO DE CAJA A BANCO</span>
              <span className="modal-close" onClick={onClose}></span>
           </div>
           <form onSubmit={async (e) => {
              e.preventDefault();
              const monto = parseFloat(trasladoForm.monto) || 0;
              const batch = writeBatch(db);
              const movId = uuidv4();
              const fecha = new Date().toISOString();

              batch.set(doc(db, 'accounting/audit/cash_movements', movId), {
                id: movId, fecha, tipo: 'EGRESO', montoUsd: monto, montoBs: monto * config.tasa,
                metodo: 'Efectivo USD', referencia: trasladoForm.referencia || 'TRASLADO_BANCO', terminalId: config.terminalId,
                concepto: `TRASLADO BANCARIO: ${trasladoForm.banco}`, usuario: config.vendedor
              });

              await batch.commit();
              notify('✅ Traslado registrado');
              onClose();
           }}>
              <div className="modal-body p-6 space-y-4">
                 <div className="form-group">
                    <label className="font-bold">Banco Destino:</label>
                    <input type="text" required value={trasladoForm.banco} onChange={e => setTrasladoForm({...trasladoForm, banco: e.target.value})} className="win-input" placeholder="Nombre del banco" />
                 </div>
                 <div className="form-group">
                    <label className="font-bold">Monto a Trasladar (USD):</label>
                    <input type="text" required value={trasladoForm.monto} onChange={e => setTrasladoForm({...trasladoForm, monto: e.target.value})} className="win-input text-2xl font-black text-blue-600" />
                 </div>
                 <div className="form-group">
                    <label className="font-bold">N° Comprobante Depósito:</label>
                    <input type="text" value={trasladoForm.referencia} onChange={e => setTrasladoForm({...trasladoForm, referencia: e.target.value})} className="win-input" />
                 </div>
              </div>
              <div className="modal-footer bg-gray-100">
                 <button type="button" className="btn" onClick={onClose}>Cancelar</button>
                 <button type="submit" className="btn btn-primary font-bold">REGISTRAR DEPÓSITO</button>
              </div>
           </form>
        </div>
      )}

      {activeModal === 'modalDevolucion' && (
        <div className="modal-window large" style={{ width: '600px' }} onClick={e => e.stopPropagation()}>
           <div className="win-titlebar bg-red-700">
              <span className="flex items-center gap-2"><RefreshCcw size={14}/> PROCESAR DEVOLUCIÓN DE CLIENTE</span>
              <span className="modal-close" onClick={onClose}></span>
           </div>
           <form onSubmit={async (e) => {
              e.preventDefault();
              const sale = sales.find(s => s.numero === devForm.nroFactura);
              if (!sale || devForm.itemIdx === -1) return notify('❌ Seleccione factura e ítem', 'error');

              const item = sale.items[devForm.itemIdx];
              const batch = writeBatch(db);
              const fecha = new Date().toISOString();
              const montoDevolver = item.precioUsd * devForm.cantidad * (1 + item.iva/100);

              if (devForm.condicion === 'REINTEGRADO_STOCK') {
                 const prod = products.find(p => p.codigo === item.codigo);
                 if (prod) {
                    batch.update(doc(db, 'products', prod.codigo), { stock: prod.stock + devForm.cantidad });
                    const movId = uuidv4();
                    batch.set(doc(db, 'inventory_movements', movId), {
                       id: movId, fecha, codigoProducto: prod.codigo, tipo: 'DEVOLUCION',
                       cantidad: devForm.cantidad, stockPrevio: prod.stock, stockNuevo: prod.stock + devForm.cantidad,
                       costo: prod.costoPromedio, referencia: sale.numero, comentario: `Devolución: ${devForm.motivo}`,
                       usuario: config.vendedor
                    });
                 }
              }

              const egresoId = uuidv4();
              batch.set(doc(db, 'accounting/audit/cash_movements', egresoId), {
                 id: egresoId, fecha, tipo: 'EGRESO', montoUsd: montoDevolver, montoBs: montoDevolver * config.tasa,
                 metodo: 'Efectivo USD', referencia: sale.numero, terminalId: config.terminalId,
                 concepto: `DEVOLUCIÓN EFECTIVO: ${sale.cliente} (Fact ${sale.numero})`, usuario: config.vendedor
              });

              await batch.commit();
              notify('✅ Devolución procesada y efectivo reintegrado');
              onClose();
           }}>
              <div className="modal-body p-6 space-y-4">
                 <div className="form-group">
                    <label className="font-bold">N° Factura Original:</label>
                    <div className="flex gap-2">
                       <input type="text" className="win-input flex-1" value={devForm.nroFactura} onChange={e => setDevForm({...devForm, nroFactura: e.target.value.toUpperCase()})} placeholder="FAC-XXXXXX" />
                    </div>
                 </div>
                 {sales.find(s => s.numero === devForm.nroFactura) && (
                    <div className="animate-in fade-in duration-300 space-y-4">
                       <div className="form-group">
                          <label className="font-bold">Seleccionar Ítem:</label>
                          <select className="win-input" value={devForm.itemIdx} onChange={e => setDevForm({...devForm, itemIdx: parseInt(e.target.value)})}>
                             <option value={-1}>-- Seleccionar --</option>
                             {sales.find(s => s.numero === devForm.nroFactura)!.items.map((it, i) => (
                               <option key={i} value={i}>{it.codigo} - {it.descripcion} (Compromiso: {it.cantidad})</option>
                             ))}
                          </select>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="form-group">
                             <label className="font-bold">Cantidad a Devolver:</label>
                             <input type="number" className="win-input" value={devForm.cantidad} onChange={e => setDevForm({...devForm, cantidad: parseInt(e.target.value)})} />
                          </div>
                          <div className="form-group">
                             <label className="font-bold">Condición:</label>
                             <select className="win-input" value={devForm.condicion} onChange={e => setDevForm({...devForm, condicion: e.target.value as any})}>
                                <option value="REINTEGRADO_STOCK">Reintegrar al Stock</option>
                                <option value="MERMA_DANADO">Merma (Dañado/No usable)</option>
                             </select>
                          </div>
                       </div>
                       <div className="form-group">
                          <label className="font-bold">Motivo de Devolución:</label>
                          <input type="text" className="win-input" value={devForm.motivo} onChange={e => setDevForm({...devForm, motivo: e.target.value})} placeholder="Ej: Error despacho, pieza defectuosa..." />
                       </div>
                    </div>
                 )}
              </div>
              <div className="modal-footer bg-gray-100">
                 <button type="button" className="btn" onClick={onClose}>Cancelar</button>
                 <button type="submit" className="btn btn-primary font-black px-10">PROCESAR DEVOLUCIÓN</button>
              </div>
           </form>
        </div>
      )}

      {activeModal === 'modalNuevoUsuario' && (
        <div className="modal-window" style={{ width: '400px' }} onClick={e => e.stopPropagation()}>
          <div className="win-titlebar"><span className="flex items-center gap-2"><UserPlus size={14}/> CREAR NUEVO OPERADOR</span><span className="modal-close" onClick={onClose}></span></div>
          <form onSubmit={handleCreateUser}>
            <div className="modal-body p-6 space-y-4">
              <div className="form-group"><label className="font-bold">Nombre Completo:</label><input type="text" required value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} className="win-input" /></div>
              <div className="form-group"><label className="font-bold">Correo Electrónico:</label><input type="email" required value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} className="win-input" /></div>
              <div className="form-group">
                <label className="font-bold">Rol Asignado:</label>
                <select className="win-input" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}>
                  <option value="Cajero">Cajero / Operador</option>
                  <option value="Supervisor">Supervisor de Piso</option>
                  <option value="Administrador">Administrador Global</option>
                </select>
              </div>
              <div className="form-group"><label className="font-bold">Clave de Acceso:</label><input type="password" required value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="win-input" /></div>
              <p className="text-[10px] text-gray-500 italic">** El usuario será registrado en Firebase Auth y Firestore automáticamente. **</p>
            </div>
            <div className="modal-footer"><button type="button" className="btn" onClick={onClose}>Cancelar</button><button type="submit" className="btn btn-primary font-bold">CREAR USUARIO</button></div>
          </form>
        </div>
      )}

      {lastSale && (
        <div className="modal-window" style={{ width: '350px', background: '#fff' }} onClick={e => e.stopPropagation()}>
           <div className="p-8 font-mono text-[10px] text-black">
              <div className="text-center mb-6">
                 <h2 className="text-sm font-black uppercase">{config.nombreEmpresa}</h2>
                 <p className="font-bold">{config.rifEmpresa}</p>
                 <p>{config.direccion}</p>
                 <p>Tel: {config.telefono}</p>
                 <p className="text-xs font-black mt-4 uppercase">Factura de Venta</p>
                 <p className="text-xs font-black">N° {lastSale.numero}</p>
              </div>

              <div className="border-y border-black border-dashed py-2 mb-4">
                 <p>FECHA: {new Date(lastSale.fecha).toLocaleString()}</p>
                 <p>CLIENTE: {lastSale.cliente}</p>
                 <p>RIF/CI: {lastSale.rif}</p>
                 <p>VENDEDOR: {lastSale.vendedor}</p>
                 <p>TERMINAL: {lastSale.terminalId || 'CAJA-01'}</p>
              </div>

              <table className="w-full mb-4">
                 <thead><tr className="border-b border-black border-dashed"><th className="text-left">DESCRIPCIÓN</th><th className="text-right">CANT</th><th className="text-right">TOTAL</th></tr></thead>
                 <tbody>
                    {lastSale.items.map((it, i) => (
                      <tr key={i}><td className="py-1">{it.descripcion}</td><td className="text-right">{it.cantidad}</td><td className="text-right">${(it.precioUsd * it.cantidad).toFixed(2)}</td></tr>
                    ))}
                 </tbody>
              </table>

              <div className="border-t border-black border-dashed pt-2 space-y-1">
                 <div className="flex justify-between"><span>SUBTOTAL:</span> <span>${lastSale.subtotal.toFixed(2)}</span></div>
                 <div className="flex justify-between"><span>IVA (16%):</span> <span>${lastSale.iva.toFixed(2)}</span></div>
                 <div className="flex justify-between font-black text-xs"><span>TOTAL USD:</span> <span>${lastSale.totalUsd.toFixed(2)}</span></div>
                 <div className="flex justify-between font-black text-xs"><span>TOTAL BS:</span> <span>{(lastSale.totalBs).toFixed(2)}</span></div>
              </div>

              <div className="mt-4 border-t border-black border-dashed pt-2">
                 <p className="font-black">FORMA DE PAGO: {lastSale.pago}</p>
                 <p>RECIBIDO: ${lastSale.recibidoUsd.toFixed(2)}</p>
                 <p>CAMBIO: ${lastSale.cambioUsd.toFixed(2)}</p>
              </div>

              <div className="text-center mt-10">
                 <p className="font-black italic">*** GRACIAS POR SU COMPRA ***</p>
                 <p className="text-[8px] opacity-60">ID REF: {lastSale.referencia}</p>
              </div>

              <div className="mt-10 no-print flex flex-col gap-2">
                 <button className="btn btn-primary w-full py-2 font-bold" onClick={() => window.print()}>🖨️ IMPRIMIR FACTURA</button>
                 <button className="btn w-full py-2" onClick={() => setLastSale(null)}>CERRAR</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
