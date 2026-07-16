
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Product, Client, Provider, Sale, Account, CartItem, Presupuesto, User, InventoryMovement } from '@/types/pos';
import { v4 as uuidv4 } from 'uuid';
import { Wallet, Search, Trash2, Save, CreditCard, ChevronRight, User as UserIcon } from 'lucide-react';

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
  presupuestos: React.Dispatch<React.SetStateAction<Presupuesto[]>>;
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
  activeModal, onClose, onOpenModal, products, setProducts, clients, setClients, 
  providers, setProviders, sales, setSales, accounts, setAccounts, cart, setCart, 
  config, setConfig, notify, editingId, users, setUsers,
  movements, setMovements
}: ModalsProps) {
  
  const [marcas, setMarcas] = useState(['Universal', 'Toyota', 'Ford', 'LUK', 'BOSCH', 'NGK']);
  const [unidades, setUnidades] = useState(['Unidad', 'Kilo', 'Litro', 'Caja', 'Galón', 'Par']);
  const [categorias, setCategorias] = useState(['Repuesto', 'Lubricante', 'Servicio', 'Accesorio', 'Frenos', 'Motor']);
  const [departamentos, setDepartamentos] = useState(['Almacén Principal', 'Tienda', 'Servicios']);

  const methodRef = useRef<HTMLSelectElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  const initialProduct: Product = {
    codigo: '', barcode: '', nombre: '', descripcion: '', referencia: '', marca: 'Universal',
    unidad: 'Unidad', moneda: 'base', departamento: 'Tienda', categoria: 'Repuesto',
    ubicacion: '', stockMin: 5, stock: 0, costoAnterior: 0, costoActual: 0, costoPromedio: 0,
    utilidadPorcentaje: 30, precio1: 0, precio2: 0, precio3: 0, precio4: 0, ivaAlicuota: 16,
    permiteDescuento: true, activo: true, manejaSeriales: false, manejaLotes: false,
    manejaTallasColores: false, manejaPeso: false, isKit: false, isService: false, stockPropio: true,
    kitComponents: [], iva: 16
  };
  const [productForm, setProductForm] = useState<Product>(initialProduct);
  const [stockInicial, setStockInicial] = useState<string>('0');
  
  const [costoText, setCostoText] = useState<string>('0');
  const [markupText, setMarkupText] = useState<string>('30');
  const [precioUsdText, setPrecioUsdText] = useState<string>('0');
  const [precioBsText, setPrecioBsText] = useState<string>('0');
  const [stockMinText, setStockMinText] = useState<string>('5');

  const initialClient: Client = {
    tipoRif: 'V', rifNum: '', nombre: '', telefono: '', email: '', direccion: '', tipo: 'Detal', credito: 0, saldo: 0
  };
  const [clientForm, setClientForm] = useState<Client>(initialClient);

  const initialProvider: Provider = { id: '', rif: '', nombre: '', direccion: '', contacto: '', telefono: '' };
  const [providerForm, setProviderForm] = useState<Provider>(initialProvider);

  const [entradaForm, setEntradaForm] = useState({
    proveedor: '', rif: '', nroFactura: '', tasa: config.tasa, tipoCompra: 'Contado', diasCredito: 0, pagoContadoUsd: 0, pagoContadoBs: 0, items: [] as any[]
  });
  const [entradaSearch, setEntradaSearch] = useState('');
  const [entradaDropdown, setEntradaDropdown] = useState<Product[]>([]);

  const [ajusteForm, setAjusteForm] = useState({
    codigo: '', tipo: 'ENTRADA' as 'ENTRADA' | 'SALIDA', cantidad: 1, motivo: '', comentario: ''
  });

  const [paymentState, setPaymentState] = useState({
    method: 'Efectivo USD',
    amount: 0,
    payments: [] as { method: string, usd: number, bs: number }[],
    totalPaidUsd: 0
  });

  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [viewSale, setViewSale] = useState<Sale | null>(null);

  const initialUser: User = {
    id: '', username: '', password: '', name: '', email: '', role: 'Cajero', active: true
  };
  const [userForm, setUserForm] = useState<User>(initialUser);

  useEffect(() => {
    if (activeModal === 'modalProducto' && editingId !== null) {
      const prod = products[editingId];
      if (prod) {
        setProductForm({ ...prod });
        setStockInicial(prod.stock.toString());
        setCostoText(prod.costoPromedio.toString());
        setMarkupText(prod.utilidadPorcentaje.toString());
        setPrecioUsdText(prod.precio1.toString());
        setPrecioBsText((prod.precio1 * config.tasa).toFixed(2));
        setStockMinText(prod.stockMin.toString());
      }
    } else if (activeModal === 'modalProducto') {
      setProductForm(initialProduct);
      setStockInicial('0');
      setCostoText('0');
      setMarkupText('30');
      setPrecioUsdText('0');
      setPrecioBsText('0');
      setStockMinText('5');
    }

    if (activeModal === 'modalCliente' && editingId !== null) {
      const cli = clients[editingId];
      if (cli) setClientForm({ ...cli });
    } else if (activeModal === 'modalCliente') {
      setClientForm(initialClient);
    }

    if (activeModal === 'modalProveedor' && editingId !== null) {
      const prov = providers.find(p => p.id === editingId);
      if (prov) setProviderForm({ ...prov });
    } else if (activeModal === 'modalProveedor') {
      setProviderForm(initialProvider);
    }
    
    if (activeModal === 'modalProcesar') {
      setPaymentState({ method: 'Efectivo USD', amount: 0, payments: [], totalPaidUsd: 0 });
      setTimeout(() => methodRef.current?.focus(), 100);
    }

    if (activeModal === 'modalDetalleVenta' && editingId) {
      const s = sales.find(s => s.numero === editingId);
      if (s) setViewSale(s);
    }

    if (activeModal === 'modalEntrada') {
      setEntradaForm({ proveedor: '', rif: '', nroFactura: '', tasa: config.tasa, tipoCompra: 'Contado', diasCredito: 0, pagoContadoUsd: 0, pagoContadoBs: 0, items: [] });
    }

    if (activeModal === 'modalAjuste') {
      setAjusteForm({ codigo: '', tipo: 'ENTRADA', cantidad: 1, motivo: 'Diferencia de Inventario', comentario: '' });
    }

    if (activeModal === 'modalNuevoUsuario') {
      setUserForm(initialUser);
    }
  }, [activeModal, editingId, products, clients, providers, config.tasa, sales]);

  const handleSaveProvider = () => {
    if (!providerForm.rif || !providerForm.nombre) {
      notify('❌ RIF y Nombre son obligatorios', 'error');
      return;
    }
    let updatedProviders = [...providers];
    const isNew = editingId === null;
    if (isNew) {
      if (providers.some(p => p.rif === providerForm.rif)) {
        notify('❌ Este RIF ya está registrado', 'error');
        return;
      }
      updatedProviders.push({ ...providerForm, id: uuidv4() });
    } else {
      updatedProviders = providers.map(p => p.id === editingId ? { ...providerForm } : p);
    }
    setProviders(updatedProviders);
    notify(`✅ Proveedor ${isNew ? 'registrado' : 'actualizado'} correctamente`);
    onClose();
  };

  const handleSaveClient = () => {
    if (!clientForm.rifNum || !clientForm.nombre) {
      notify('❌ Cédula/RIF y Nombre son obligatorios', 'error');
      return;
    }
    let updatedClients = [...clients];
    const isNew = editingId === null;
    if (isNew) {
      if (clients.some(c => c.rifNum === clientForm.rifNum)) {
        notify('❌ Este número de identificación ya existe', 'error');
        return;
      }
      updatedClients.push(clientForm);
    } else {
      updatedClients[editingId] = clientForm;
    }
    setClients(updatedClients);
    notify(`✅ Cliente ${isNew ? 'creado' : 'actualizado'} correctamente`);
    onClose();
  };

  const handleProductPriceCalc = (field: string, valStr: string) => {
    let newForm = { ...productForm };
    const tasa = config.tasa;
    const val = parseFloat(valStr) || 0;

    if (field === 'costo') {
      setCostoText(valStr);
      newForm.costoPromedio = val;
      newForm.costoActual = val;
      const markup = parseFloat(markupText) || 0;
      const newPrice = Math.round((val * (1 + markup / 100)) * 100) / 100;
      newForm.precio1 = newPrice;
      setPrecioUsdText(newPrice.toString());
      setPrecioBsText((newPrice * tasa).toFixed(2));
    } else if (field === 'utilidadPorcentaje') {
      setMarkupText(valStr);
      const cost = newForm.costoPromedio;
      const newPrice = Math.round((cost * (1 + val / 100)) * 100) / 100;
      newForm.utilidadPorcentaje = val;
      newForm.precio1 = newPrice;
      setPrecioUsdText(newPrice.toString());
      setPrecioBsText((newPrice * tasa).toFixed(2));
    } else if (field === 'precio1') {
      setPrecioUsdText(valStr);
      const cost = newForm.costoPromedio;
      newForm.precio1 = val;
      newForm.utilidadPorcentaje = cost > 0 ? Math.round(((val / cost) - 1) * 10000) / 100 : 0;
      setMarkupText(newForm.utilidadPorcentaje.toString());
      setPrecioBsText((val * tasa).toFixed(2));
    } else if (field === 'precioBs') {
      setPrecioBsText(valStr);
      const cost = newForm.costoPromedio;
      const priceUsd = val / tasa;
      newForm.precio1 = Math.round(priceUsd * 100) / 100;
      newForm.utilidadPorcentaje = cost > 0 ? Math.round(((newForm.precio1 / cost) - 1) * 10000) / 100 : 0;
      setPrecioUsdText(newForm.precio1.toString());
      setMarkupText(newForm.utilidadPorcentaje.toString());
    }
    setProductForm(newForm);
  };

  const handleSaveProduct = () => {
    if (!productForm.codigo || !productForm.nombre) {
      notify('❌ Código y Nombre son obligatorios', 'error');
      return;
    }
    let updatedProducts = [...products];
    const isNew = editingId === null;
    const finalForm = {
      ...productForm,
      costoPromedio: parseFloat(costoText) || 0,
      costoActual: parseFloat(costoText) || 0,
      stock: productForm.isService ? 0 : (parseInt(stockInicial) || 0),
      stockMin: productForm.isService ? 0 : (parseInt(stockMinText) || 0),
      utilidadPorcentaje: parseFloat(markupText) || 0,
      precio1: parseFloat(precioUsdText) || 0
    };
    if (isNew) {
      updatedProducts.push(finalForm);
      if (!finalForm.isService && parseInt(stockInicial) > 0) {
        setMovements(prev => [...prev, {
          id: uuidv4(),
          fecha: new Date().toISOString(),
          codigoProducto: finalForm.codigo,
          tipo: 'ENTRADA',
          cantidad: parseInt(stockInicial),
          stockPrevio: 0,
          stockNuevo: parseInt(stockInicial),
          costo: finalForm.costoPromedio,
          referencia: 'STOCK INICIAL',
          comentario: 'Carga inicial de inventario',
          usuario: config.vendedor
        }]);
      }
    } else {
      updatedProducts[editingId] = finalForm;
    }
    setProducts(updatedProducts);
    notify(`✅ ${finalForm.isService ? 'Servicio' : 'Producto'} ${isNew ? 'creado' : 'actualizado'} correctamente`);
    onClose();
  };

  const handleEntradaSearch = (q: string) => {
    setEntradaSearch(q);
    if (!q) { setEntradaDropdown([]); return; }
    setEntradaDropdown(products.filter(p => !p.isService && (p.codigo.toLowerCase().includes(q.toLowerCase()) || p.nombre.toLowerCase().includes(q.toLowerCase()))).slice(0, 8));
  };

  const addToEntrada = (p: Product) => {
    if (entradaForm.items.some(i => i.codigo === p.codigo)) return;
    setEntradaForm({ ...entradaForm, items: [...entradaForm.items, { 
      codigo: p.codigo, nombre: p.nombre, cantidad: 1, costo: p.costoActual, subtotal: p.costoActual 
    }]});
    setEntradaSearch('');
    setEntradaDropdown([]);
  };

  const processEntrada = () => {
    const totalFactura = entradaForm.items.reduce((s, i) => s + i.subtotal, 0);
    const montoPendiente = totalFactura - (entradaForm.pagoContadoUsd + (entradaForm.pagoContadoBs / entradaForm.tasa));

    if (!entradaForm.nroFactura || entradaForm.items.length === 0) { notify('Faltan datos de factura o items', 'warning'); return; }
    
    const updatedProducts = [...products];
    const newMovements: InventoryMovement[] = [];

    entradaForm.items.forEach(item => {
      const idx = updatedProducts.findIndex(p => p.codigo === item.codigo);
      if (idx !== -1) {
        const p = updatedProducts[idx];
        const stockPrev = p.stock;
        const nuevoCosto = item.costo;
        const nuevaCant = item.cantidad;
        const costoPromedio = ((p.stock * p.costoPromedio) + (nuevaCant * nuevoCosto)) / (p.stock + nuevaCant);
        p.costoAnterior = p.costoActual;
        p.costoActual = nuevoCosto;
        p.costoPromedio = Math.round(costoPromedio * 100) / 100;
        p.stock += nuevaCant;

        newMovements.push({
          id: uuidv4(),
          fecha: new Date().toISOString(),
          codigoProducto: p.codigo,
          tipo: 'ENTRADA',
          cantidad: nuevaCant,
          stockPrevio: stockPrev,
          stockNuevo: p.stock,
          costo: nuevoCosto,
          referencia: `COMPRA-${entradaForm.nroFactura}`,
          comentario: `Ingreso por compra al proveedor ${entradaForm.proveedor}`,
          usuario: config.vendedor
        });
      }
    });

    if (entradaForm.tipoCompra !== 'Contado' && montoPendiente > 0) {
      setAccounts(prev => [...prev, {
        id: uuidv4(),
        entidad: entradaForm.proveedor || 'Proveedor Desconocido',
        montoTotal: montoPendiente,
        montoPagado: 0,
        fechaEmision: new Date().toLocaleDateString(),
        estado: 'Pendiente',
        referencia: `FACT-${entradaForm.nroFactura}`,
        tipo: 'CXP'
      }]);
    }

    setProducts(updatedProducts);
    setMovements(prev => [...prev, ...newMovements]);
    notify(`✅ Entrada ${entradaForm.nroFactura} procesada`);
    onClose();
  };

  const processAjuste = () => {
    if (!ajusteForm.codigo) { notify('Seleccione un producto', 'error'); return; }
    const idx = products.findIndex(p => p.codigo === ajusteForm.codigo);
    if (idx === -1) return;
    const p = { ...products[idx] };
    const stockPrev = p.stock;
    const diff = ajusteForm.tipo === 'ENTRADA' ? ajusteForm.cantidad : -ajusteForm.cantidad;
    p.stock += diff;

    const newMovements = [...movements, {
      id: uuidv4(),
      fecha: new Date().toISOString(),
      codigoProducto: p.codigo,
      tipo: 'AJUSTE' as any,
      cantidad: diff,
      stockPrevio: stockPrev,
      stockNuevo: p.stock,
      costo: p.costoPromedio,
      referencia: 'AJUSTE MANUAL',
      comentario: `${ajusteForm.motivo}: ${ajusteForm.comentario}`,
      usuario: config.vendedor
    }];

    const updatedProducts = [...products];
    updatedProducts[idx] = p;
    setProducts(updatedProducts);
    setMovements(newMovements);
    notify('✅ Ajuste realizado');
    onClose();
  };

  const finalizeSale = () => {
    const totalUsd = cart.reduce((acc, item) => acc + (item.precioUsd * item.cantidad * (1 + item.iva / 100)), 0);
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
      credito: false,
      estado: 'Completada'
    };

    const updatedProducts = [...products];
    const newMovements: InventoryMovement[] = [...movements];

    cart.forEach(item => {
      const product = updatedProducts[item.productIndex];
      if (product.isService) return;

      const stockPrev = product.stock;
      product.stock -= item.cantidad;
      newMovements.push({
        id: uuidv4(),
        fecha: new Date().toISOString(),
        codigoProducto: product.codigo,
        tipo: 'VENTA',
        cantidad: -item.cantidad,
        stockPrevio: stockPrev,
        stockNuevo: product.stock,
        costo: product.costoPromedio,
        referencia: sale.numero,
        comentario: `Venta directa`,
        usuario: config.vendedor
      });
    });

    setSales([...sales, sale]);
    setProducts(updatedProducts);
    setMovements(newMovements);
    setLastSale(sale);
    setCart([]);
    notify('✅ Venta procesada exitosamente');
    onClose();
  };

  const addPayment = () => {
    if (paymentState.amount <= 0) return;
    let usd = 0; let bs = 0;
    const isUsdMethod = paymentState.method === 'Efectivo USD' || paymentState.method === 'Zelle';
    if (isUsdMethod) { usd = paymentState.amount; bs = Math.round(usd * config.tasa * 100) / 100; } 
    else { bs = paymentState.amount; usd = Math.round((bs / config.tasa) * 100) / 100; }
    const newPayments = [...paymentState.payments, { method: paymentState.method, usd, bs }];
    setPaymentState({
      ...paymentState, payments: newPayments, totalPaidUsd: Math.round(newPayments.reduce((acc, p) => acc + p.usd, 0) * 100) / 100, amount: 0
    });
    methodRef.current?.focus();
  };

  const handleSetPagoExacto = () => {
    const totalUsd = cart.reduce((acc, item) => acc + (item.precioUsd * item.cantidad * (1 + item.iva / 100)), 0);
    const missingUsd = Math.max(0, totalUsd - paymentState.totalPaidUsd);
    const isUsdMethod = paymentState.method === 'Efectivo USD' || paymentState.method === 'Zelle';
    if (isUsdMethod) { setPaymentState(prev => ({ ...prev, amount: Math.round(missingUsd * 100) / 100 })); } 
    else { setPaymentState(prev => ({ ...prev, amount: Math.round(missingUsd * config.tasa * 100) / 100 })); }
  };

  const totalVentaUsd = cart.reduce((acc, item) => acc + (item.precioUsd * item.cantidad * (1 + item.iva / 100)), 0);
  const totalPaidUsd = paymentState.totalPaidUsd;
  const faltanteUsd = Math.max(0, totalVentaUsd - totalPaidUsd);
  const vueltoUsd = Math.max(0, totalPaidUsd - totalVentaUsd);

  if (!activeModal && !lastSale && !viewSale) return null;

  const totalEntradaUsd = entradaForm.items.reduce((s, i) => s + i.subtotal, 0);
  const pagoRealizadoUsd = entradaForm.pagoContadoUsd + (entradaForm.pagoContadoBs / entradaForm.tasa);
  const pendienteUsd = Math.max(0, totalEntradaUsd - pagoRealizadoUsd);

  return (
    <div className={`modal-overlay ${activeModal || lastSale || viewSale ? 'active' : ''}`} onClick={() => { if(!lastSale && !viewSale) onClose(); else { setLastSale(null); setViewSale(null); } }}>
      
      {activeModal === 'modalDetalleVenta' && viewSale && (
        <div className="modal-window large" onClick={e => e.stopPropagation()}>
          <div className="modal-titlebar">
            <span>🧾 DETALLE DE FACTURA: {viewSale.numero}</span>
            <span className="modal-close" onClick={() => setViewSale(null)}>✕</span>
          </div>
          <div className="modal-body space-y-4">
            <div className="settings-section">
              <div className="grid grid-cols-2 gap-4">
                <div><strong>Cliente:</strong> {viewSale.cliente}</div>
                <div><strong>RIF:</strong> {viewSale.rif}</div>
                <div><strong>Fecha:</strong> {new Date(viewSale.fecha).toLocaleString()}</div>
                <div><strong>Estado:</strong> {viewSale.estado}</div>
              </div>
            </div>
            <div className="table-responsive" style={{ maxHeight: '200px' }}>
              <table className="data-table">
                <thead><tr><th>Producto</th><th>Cant</th><th>Precio USD</th><th>Total</th></tr></thead>
                <tbody>
                  {viewSale.items.map((it, i) => (
                    <tr key={i}><td>{it.descripcion}</td><td>{it.cantidad}</td><td>${it.precioUsd.toFixed(2)}</td><td>${(it.cantidad * it.precioUsd).toFixed(2)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-4 font-bold text-lg">
              <span>Total USD: ${viewSale.totalUsd.toFixed(2)}</span>
              <span>Total Bs: {viewSale.totalBs.toFixed(2)}</span>
            </div>
          </div>
          <div className="modal-footer">
             <button className="btn btn-primary" onClick={() => window.print()}>🖨️ REIMPRIMIR</button>
             <button className="btn" onClick={() => setViewSale(null)}>Cerrar</button>
          </div>
        </div>
      )}

      {activeModal === 'modalEntrada' && (
        <div className="modal-window xlarge" onClick={e => e.stopPropagation()}>
          <div className="win-titlebar">
            <span>🚢 ENTRADA POR COMPRA (RECEPCIÓN)</span>
            <span className="modal-close" onClick={onClose}>✕</span>
          </div>
          <div className="modal-body">
            <div className="settings-section">
              <div className="grid grid-cols-3 gap-6">
                <div className="form-group">
                  <label className="text-xs font-bold">Proveedor:</label>
                  <input type="text" value={entradaForm.proveedor} onChange={e => setEntradaForm({...entradaForm, proveedor: e.target.value})} className="win-input h-10" />
                </div>
                <div className="form-group">
                  <label className="text-xs font-bold">Nro Factura:</label>
                  <input type="text" value={entradaForm.nroFactura} onChange={e => setEntradaForm({...entradaForm, nroFactura: e.target.value})} className="win-input h-10 font-bold" />
                </div>
                <div className="form-group">
                  <label className="text-xs font-bold">Tasa BCV:</label>
                  <input type="number" step="0.01" value={entradaForm.tasa} onChange={e => setEntradaForm({...entradaForm, tasa: parseFloat(e.target.value) || 0})} className="win-input h-10" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-6 mt-4">
                <div className="form-group">
                  <label className="text-xs font-bold">Tipo Compra:</label>
                  <select value={entradaForm.tipoCompra} onChange={e => setEntradaForm({...entradaForm, tipoCompra: e.target.value})} className="win-input h-10">
                    <option value="Contado">Contado</option>
                    <option value="Credito">Crédito</option>
                    <option value="Mixto">Mixto</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-xs font-bold">Días Crédito:</label>
                  <input type="number" value={entradaForm.diasCredito} onChange={e => setEntradaForm({...entradaForm, diasCredito: parseInt(e.target.value) || 0})} className="win-input h-10" />
                </div>
                <div className="form-group">
                  <label className="text-xs font-bold">Pago Contado (USD):</label>
                  <input type="number" value={entradaForm.pagoContadoUsd || ''} onChange={e => setEntradaForm({...entradaForm, pagoContadoUsd: parseFloat(e.target.value) || 0})} className="win-input h-10" />
                </div>
                <div className="form-group">
                  <label className="text-xs font-bold">Pago Contado (Bs.):</label>
                  <input type="number" value={entradaForm.pagoContadoBs || ''} onChange={e => setEntradaForm({...entradaForm, pagoContadoBs: parseFloat(e.target.value) || 0})} className="win-input h-10" />
                </div>
              </div>
            </div>

            <div className="flex gap-2 items-center bg-gray-200 p-2 border-y-2 border-gray-400 relative">
              <div className="flex-1 relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2"><Search size={14} className="text-gray-400" /></div>
                <input 
                  type="text" 
                  value={entradaSearch} 
                  onChange={e => handleEntradaSearch(e.target.value)} 
                  className="win-input w-full pl-10 h-10" 
                  placeholder="Buscar producto por código o nombre..." 
                />
                {entradaDropdown.length > 0 && (
                  <div className="search-dropdown active w-full" style={{ top: '100%', left: 0 }}>
                    {entradaDropdown.map(p => (
                      <div key={p.codigo} className="search-dropdown-item" onClick={() => addToEntrada(p)}>
                        <strong>{p.codigo}</strong> - {p.nombre} (Costo: ${p.costoActual})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="table-responsive h-48 mt-2">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Descripción</th>
                    <th className="text-center">Cant</th>
                    <th className="text-right">Costo USD</th>
                    <th className="text-right">Subtotal</th>
                    <th className="text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {entradaForm.items.map((item, i) => (
                    <tr key={i}>
                      <td className="font-bold">{item.codigo}</td>
                      <td>{item.nombre}</td>
                      <td className="text-center"><input type="number" value={item.cantidad} onChange={e => {
                        const its = [...entradaForm.items]; its[i].cantidad = parseInt(e.target.value) || 0; its[i].subtotal = its[i].cantidad * its[i].costo;
                        setEntradaForm({...entradaForm, items: its});
                      }} className="win-input w-16 text-center" /></td>
                      <td className="text-right"><input type="number" step="0.01" value={item.costo} onChange={e => {
                        const its = [...entradaForm.items]; its[i].costo = parseFloat(e.target.value) || 0; its[i].subtotal = its[i].cantidad * its[i].costo;
                        setEntradaForm({...entradaForm, items: its});
                      }} className="win-input w-24 text-right" /></td>
                      <td className="text-right font-bold">${item.subtotal.toFixed(2)}</td>
                      <td className="text-center">
                        <button className="btn text-red-600 p-1" onClick={() => setEntradaForm({...entradaForm, items: entradaForm.items.filter((_, idx) => idx !== i)})}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-4">
              <div className="dash-card bg-gray-300">
                <div className="dash-label text-[10px]">TOTAL FACTURA (USD)</div>
                <div className="dash-value text-xl">${totalEntradaUsd.toFixed(2)}</div>
              </div>
              <div className="dash-card bg-emerald-100">
                <div className="dash-label text-[10px]">PAGADO (USD)</div>
                <div className="dash-value text-xl text-emerald-700">${pagoRealizadoUsd.toFixed(2)}</div>
              </div>
              <div className="dash-card bg-red-100">
                <div className="dash-label text-[10px]">PENDIENTE CRÉDITO (USD)</div>
                <div className="dash-value text-xl text-red-700">${pendienteUsd.toFixed(2)}</div>
              </div>
            </div>
          </div>
          <div className="modal-footer flex justify-between bg-gray-200">
            <button className="btn px-8" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary px-8 flex gap-2 items-center" onClick={processEntrada}>
              <Save size={14} /> PROCESAR ENTRADA
            </button>
          </div>
        </div>
      )}

      {activeModal === 'modalProcesar' && (
        <div className="modal-window" onClick={e => e.stopPropagation()} style={{ width: '420px' }}>
          <div className="modal-titlebar">
            <span>💳 PROCESAR PAGO</span>
            <span className="modal-close" onClick={onClose}>✕</span>
          </div>
          <div className="modal-body space-y-4">
            <div className="win-window p-4 bg-gray-200">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold">TOTAL A CANCELAR:</span>
                <span className="text-xl font-black text-black">${totalVentaUsd.toFixed(2)}</span>
              </div>
            </div>
            <div className="p-4 border-2 border-gray-400 bg-white">
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="form-group">
                  <label>Método Pago:</label>
                  <select ref={methodRef} value={paymentState.method} onChange={e => setPaymentState({...paymentState, method: e.target.value})} className="win-input">
                    <option value="Efectivo Bs.">Efectivo Bs.</option>
                    <option value="Efectivo USD">Efectivo USD</option>
                    <option value="Tarjeta/Punto">Tarjeta/Punto</option>
                    <option value="Biopago">Biopago</option>
                    <option value="Pagomovil">Pagomovil</option>
                    <option value="Zelle">Zelle</option>
                    <option value="Transferencia">Transferencia</option>
                  </select>
                </div>
                <div className="form-group">
                  <div className="flex justify-between">
                    <label>Monto:</label>
                    <button className="text-[8px] font-bold underline text-blue-800" onClick={handleSetPagoExacto}>PAGO EXACTO</button>
                  </div>
                  <input ref={amountRef} type="number" value={paymentState.amount || ''} onChange={e => setPaymentState({...paymentState, amount: parseFloat(e.target.value) || 0})} className="win-input text-right font-bold" placeholder="0.00" onKeyDown={e => { if(e.key === 'Enter') addPayment(); }} />
                </div>
              </div>
              <button className="btn btn-primary w-full py-2 shadow-inner" onClick={addPayment}>➕ AÑADIR PAGO</button>
            </div>
            <div className="win-window p-4 bg-gray-300 text-center">
              <div className="text-[10px] font-bold text-gray-600 uppercase mb-1">{vueltoUsd > 0 ? 'Vuelto a entregar' : 'Faltante por liquidar'}</div>
              <div className="text-3xl font-black text-black">{vueltoUsd > 0 ? `$${vueltoUsd.toFixed(2)}` : `$${faltanteUsd.toFixed(2)}`}</div>
              <div className="text-lg font-bold text-black mt-1">Bs. {(vueltoUsd > 0 ? vueltoUsd * config.tasa : faltanteUsd * config.tasa).toFixed(2)}</div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={onClose}>Volver</button>
            <button className="btn btn-success" disabled={faltanteUsd > 0} onClick={finalizeSale}>💾 FINALIZAR VENTA</button>
          </div>
        </div>
      )}

      {activeModal === 'modalNuevoUsuario' && (
        <div className="modal-window" onClick={e => e.stopPropagation()} style={{ width: '400px' }}>
          <div className="win-titlebar">
            <span>👤 REGISTRO DE NUEVO USUARIO</span>
            <span className="modal-close" onClick={onClose}>✕</span>
          </div>
          <div className="modal-body space-y-4">
            <div className="settings-section">
              <div className="form-group">
                <label>Nombre Completo:</label>
                <input type="text" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} className="win-input" />
              </div>
              <div className="form-group">
                <label>Correo Electrónico:</label>
                <input type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} className="win-input" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label>Rol / Permisos:</label>
                  <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value as any})} className="win-input">
                    <option value="Administrador">Administrador</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Cajero">Cajero</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Contraseña / Clave:</label>
                  <input type="password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="win-input" />
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" onClick={() => {
              if(!userForm.name || !userForm.password || !userForm.email) {
                notify('❌ Todos los campos son obligatorios', 'error');
                return;
              }
              const newUser = { ...userForm, id: uuidv4(), username: userForm.email };
              setUsers([...users, newUser]);
              notify('✅ Usuario creado correctamente');
              onClose();
            }}>💾 GUARDAR USUARIO</button>
          </div>
        </div>
      )}

      {lastSale && (
        <div className="modal-window" onClick={e => e.stopPropagation()} style={{ width: '280px', background: '#fff', color: '#000' }}>
          <div className="p-4 font-mono text-[10px] space-y-2 border-2 border-black">
            <div className="text-center font-bold text-xs uppercase border-b-2 border-black pb-2 mb-2">
              <div>{config.nombreEmpresa}</div>
              <div>RIF: {config.rifEmpresa}</div>
            </div>
            <div className="flex justify-between"><span>FACTURA:</span> <span>{lastSale.numero}</span></div>
            <div className="flex justify-between"><span>FECHA:</span> <span>{new Date(lastSale.fecha).toLocaleString()}</span></div>
            <div className="border-t-2 border-black pt-2 mt-2 space-y-1">
              <div className="flex justify-between font-bold text-xs"><span>TOTAL USD:</span> <span>${lastSale.totalUsd.toFixed(2)}</span></div>
            </div>
            <div className="flex gap-2 mt-4 no-print">
              <button className="btn btn-primary flex-1 py-1 text-[10px]" onClick={() => window.print()}>🖨️ IMPRIMIR</button>
              <button className="btn flex-1 py-1 text-[10px]" onClick={() => setLastSale(null)}>CERRAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
