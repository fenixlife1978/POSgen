
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

      {finalReportZ && (
        <div className="modal-window" style={{ width: '350px', background: '#fff' }} onClick={e => e.stopPropagation()}>
           <div className="p-8 font-mono text-[10px] text-black">
              <div className="text-center mb-6">
                 <h2 className="text-sm font-black uppercase">{config.nombreEmpresa}</h2>
                 <p className="font-bold">{config.rifEmpresa}</p>
                 <p className="text-xs font-black mt-2">REPORTE Z N° {finalReportZ.numero.toString().padStart(4, '0')}</p>
                 <p>TERMINAL: {finalReportZ.terminalId}</p>
                 <p>{finalReportZ.fecha} | {new Date().toLocaleTimeString()}</p>
              </div>

              <div className="border-y-2 border-black border-dashed py-3 mb-4">
                 <div className="flex justify-between"><span>FACTURA INICIAL:</span> <span>{finalReportZ.facturaInicio}</span></div>
                 <div className="flex justify-between"><span>FACTURA FINAL:</span> <span>{finalReportZ.facturaFin}</span></div>
                 <div className="flex justify-between"><span>TICKETS ANULADOS:</span> <span>{finalReportZ.anulaciones}</span></div>
              </div>

              <div className="space-y-1 mb-4">
                 <div className="flex justify-between"><span>BASE IMPONIBLE:</span> <span>${finalReportZ.baseImponible.toFixed(2)}</span></div>
                 <div className="flex justify-between"><span>TASA IVA (16%):</span> <span>${finalReportZ.ivaTotal.toFixed(2)}</span></div>
                 <div className="flex justify-between font-black border-t border-black pt-1"><span>VENTA NETA DIARIA:</span> <span>${finalReportZ.ventaNeta.toFixed(2)}</span></div>
              </div>

              <div className="bg-gray-100 p-2 mb-4 border border-gray-300">
                 <p className="font-black border-b border-gray-400 mb-1">CIERRE FORMAS PAGO:</p>
                 {finalReportZ.desglosePagos.map(p => (
                   <div key={p.method} className="flex justify-between"><span>{p.method}:</span> <span>${p.total.toFixed(2)}</span></div>
                 ))}
              </div>

              <div className="space-y-1 mb-6 border-b-2 border-black border-dashed pb-3">
                 <div className="flex justify-between"><span>EFECTIVO ESTIMADO:</span> <span>${finalReportZ.efectivoSistema.toFixed(2)}</span></div>
                 <div className="flex justify-between"><span>EFECTIVO CONTADO:</span> <span>${finalReportZ.efectivoReal.toFixed(2)}</span></div>
                 <div className={`flex justify-between font-black ${finalReportZ.diferencia < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    <span>DIFERENCIA:</span> <span>${finalReportZ.diferencia.toFixed(2)}</span>
                 </div>
              </div>

              <div className="text-right font-black mb-10">
                 <p className="text-[8px] opacity-60">GRAN TOTAL ACUMULADO HISTÓRICO:</p>
                 <p className="text-sm">${finalReportZ.grandTotalAcumulado.toFixed(2)}</p>
              </div>

              <div className="grid grid-cols-2 gap-10 mt-20 text-center">
                 <div className="border-t border-black pt-2">FIRMA CAJERO</div>
                 <div className="border-t border-black pt-2">FIRMA SUPERVISOR</div>
              </div>

              <div className="mt-10 no-print flex flex-col gap-2">
                 <button className="btn btn-primary w-full py-2 font-bold" onClick={() => window.print()}>🖨️ IMPRIMIR REPORTE Z</button>
                 <button className="btn w-full py-2" onClick={() => setFinalReportZ(null)}>CERRAR</button>
              </div>
           </div>
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
      {/* REST OF MODALS (Producto, Cliente, etc. remain unchanged) */}
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
      {/* OTHER MODALS... (Restored from previous versions as needed) */}
    </div>
  );
}
