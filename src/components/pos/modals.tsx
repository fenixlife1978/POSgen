
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Product, Client, Provider, Sale, Account, CartItem, Presupuesto, User, InventoryMovement } from '@/types/pos';
import { v4 as uuidv4 } from 'uuid';
import { Wallet, Printer, Download, Plus, Search, Trash2, Save, CreditCard, ChevronRight, User as UserIcon } from 'lucide-react';

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

  // --- PRODUCT FORM ---
  const initialProduct: Product = {
    codigo: '', barcode: '', nombre: '', descripcion: '', referencia: '', marca: 'Universal',
    unidad: 'Unidad', moneda: 'base', departamento: 'Tienda', categoria: 'Repuesto',
    ubicacion: '', stockMin: 5, stock: 0, costoAnterior: 0, costoActual: 0, costoPromedio: 0,
    utilidadPorcentaje: 30, precio1: 0, precio2: 0, precio3: 0, precio4: 0, ivaAlicuota: 16,
    permiteDescuento: true, activo: true, manejaSeriales: false, manejaLotes: false,
    manejaTallasColores: false, manejaPeso: false, isKit: false, stockPropio: true,
    kitComponents: [], iva: 16
  };
  const [productForm, setProductForm] = useState<Product>(initialProduct);
  const [stockInicial, setStockInicial] = useState<string>('0');
  
  const [markupText, setMarkupText] = useState<string>('30');
  const [precioUsdText, setPrecioUsdText] = useState<string>('0');
  const [precioBsText, setPrecioBsText] = useState<string>('0');
  const [stockMinText, setStockMinText] = useState<string>('5');

  // --- CLIENT FORM ---
  const initialClient: Client = {
    tipoRif: 'V', rifNum: '', nombre: '', telefono: '', email: '', direccion: '', tipo: 'Detal', credito: 0, saldo: 0
  };
  const [clientForm, setClientForm] = useState<Client>(initialClient);

  // --- PROVIDER FORM ---
  const initialProvider: Provider = { id: '', rif: '', nombre: '', direccion: '', contacto: '', telefono: '' };
  const [providerForm, setProviderForm] = useState<Provider>(initialProvider);

  // --- PAYMENT CALCULATOR ---
  const [paymentState, setPaymentState] = useState({
    method: 'Efectivo USD',
    amount: 0,
    payments: [] as { method: string, usd: number, bs: number }[],
    totalPaidUsd: 0
  });

  const [lastSale, setLastSale] = useState<Sale | null>(null);

  useEffect(() => {
    if (activeModal === 'modalProducto' && editingId !== null) {
      const prod = products[editingId];
      if (prod) {
        setProductForm({ ...prod });
        setStockInicial(prod.stock.toString());
        setMarkupText(prod.utilidadPorcentaje.toString());
        setPrecioUsdText(prod.precio1.toString());
        setPrecioBsText((prod.precio1 * config.tasa).toFixed(2));
        setStockMinText(prod.stockMin.toString());
      }
    } else if (activeModal === 'modalProducto') {
      setProductForm(initialProduct);
      setStockInicial('0');
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
  }, [activeModal, editingId, products, clients, providers, config.tasa]);

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
    const cost = newForm.costoPromedio;
    const tasa = config.tasa;
    const val = parseFloat(valStr) || 0;

    if (field === 'utilidadPorcentaje') {
      setMarkupText(valStr);
      const newPrice = val >= 100 ? cost : Math.round((cost / (1 - val/100)) * 100) / 100;
      newForm.utilidadPorcentaje = val;
      newForm.precio1 = newPrice;
      setPrecioUsdText(newPrice.toString());
      setPrecioBsText((newPrice * tasa).toFixed(2));
    } else if (field === 'precio1') {
      setPrecioUsdText(valStr);
      newForm.precio1 = val;
      newForm.utilidadPorcentaje = val > cost ? Math.round((1 - (cost / val)) * 10000) / 100 : 0;
      setMarkupText(newForm.utilidadPorcentaje.toString());
      setPrecioBsText((val * tasa).toFixed(2));
    } else if (field === 'precioBs') {
      setPrecioBsText(valStr);
      const priceUsd = val / tasa;
      newForm.precio1 = Math.round(priceUsd * 100) / 100;
      newForm.utilidadPorcentaje = newForm.precio1 > cost ? Math.round((1 - (cost / newForm.precio1)) * 10000) / 100 : 0;
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
      stock: parseInt(stockInicial) || 0,
      stockMin: parseInt(stockMinText) || 0,
      utilidadPorcentaje: parseFloat(markupText) || 0,
      precio1: parseFloat(precioUsdText) || 0
    };

    if (isNew) {
      updatedProducts.push(finalForm);
      if (parseInt(stockInicial) > 0) {
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
    notify(`✅ Producto ${isNew ? 'creado' : 'actualizado'} correctamente`);
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
      if (product.isKit && !product.stockPropio) {
        product.kitComponents.forEach(comp => {
          const compProd = updatedProducts[comp.productIndex];
          if (compProd) {
            const stockPrev = compProd.stock;
            compProd.stock -= (comp.cantidad * item.cantidad);
            newMovements.push({
              id: uuidv4(),
              fecha: new Date().toISOString(),
              codigoProducto: compProd.codigo,
              tipo: 'VENTA',
              cantidad: -(comp.cantidad * item.cantidad),
              stockPrevio: stockPrev,
              stockNuevo: compProd.stock,
              costo: compProd.costoPromedio,
              referencia: sale.numero,
              comentario: `Venta de componente de Kit: ${product.codigo}`,
              usuario: config.vendedor
            });
          }
        });
      } else {
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
      }
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

  if (!activeModal && !lastSale) return null;

  const totalVentaUsd = cart.reduce((acc, item) => acc + (item.precioUsd * item.cantidad * (1 + item.iva / 100)), 0);
  const faltanteUsd = Math.max(0, totalVentaUsd - paymentState.totalPaidUsd);
  const vueltoUsd = Math.max(0, paymentState.totalPaidUsd - totalVentaUsd);

  return (
    <div className={`modal-overlay ${activeModal || lastSale ? 'active' : ''}`} onClick={() => { if(!lastSale) onClose(); else setLastSale(null); }}>
      
      {activeModal === 'modalProveedor' && (
        <div className="modal-window large" onClick={e => e.stopPropagation()}>
          <div className="modal-titlebar">
            <span>🏢 REGISTRO MAESTRO DE PROVEEDOR</span>
            <span className="modal-close" onClick={onClose}>✕</span>
          </div>
          <div className="modal-body">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="settings-section">
                  <h3>Identificación Fiscal</h3>
                  <div className="form-group">
                    <label>Rif / C.I. (V-):</label>
                    <input 
                      type="text" 
                      value={providerForm.rif} 
                      onChange={e => setProviderForm({...providerForm, rif: e.target.value.toUpperCase()})} 
                      placeholder="Ej: J-12345678-0"
                      className="win-input font-bold" 
                    />
                  </div>
                  <div className="form-group">
                    <label>Nombre de la Empresa:</label>
                    <input 
                      type="text" 
                      value={providerForm.nombre} 
                      onChange={e => setProviderForm({...providerForm, nombre: e.target.value})} 
                      className="win-input" 
                    />
                  </div>
                </div>
                <div className="settings-section">
                  <h3>Ubicación</h3>
                  <div className="form-group">
                    <label>Dirección:</label>
                    <textarea 
                      value={providerForm.direccion} 
                      onChange={e => setProviderForm({...providerForm, direccion: e.target.value})} 
                      className="win-input" 
                      style={{ height: '80px' }} 
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="settings-section">
                  <h3>Contacto Directo</h3>
                  <div className="form-group">
                    <label>Persona de Contacto:</label>
                    <input 
                      type="text" 
                      value={providerForm.contacto} 
                      onChange={e => setProviderForm({...providerForm, contacto: e.target.value})} 
                      className="win-input" 
                    />
                  </div>
                  <div className="form-group">
                    <label>Teléfono:</label>
                    <input 
                      type="text" 
                      value={providerForm.telefono} 
                      onChange={e => setProviderForm({...providerForm, telefono: e.target.value})} 
                      className="win-input" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSaveProvider}>💾 GUARDAR PROVEEDOR</button>
          </div>
        </div>
      )}

      {activeModal === 'modalCliente' && (
        <div className="modal-window large" onClick={e => e.stopPropagation()}>
          <div className="modal-titlebar">
            <span>👤 FICHA MAESTRA DE CLIENTE</span>
            <span className="modal-close" onClick={onClose}>✕</span>
          </div>
          <div className="modal-body">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="settings-section">
                  <h3>Identificación</h3>
                  <div className="form-row">
                    <div className="form-group" style={{ width: '80px' }}>
                      <label>Tipo:</label>
                      <select value={clientForm.tipoRif} onChange={e => setClientForm({...clientForm, tipoRif: e.target.value})} className="win-input">
                        <option value="V">V</option>
                        <option value="J">J</option>
                        <option value="G">G</option>
                        <option value="E">E</option>
                        <option value="P">P</option>
                      </select>
                    </div>
                    <div className="form-group flex-1">
                      <label>Cédula / RIF:</label>
                      <input type="text" value={clientForm.rifNum} onChange={e => setClientForm({...clientForm, rifNum: e.target.value})} className="win-input font-bold" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Nombre o Razón Social:</label>
                    <input type="text" value={clientForm.nombre} onChange={e => setClientForm({...clientForm, nombre: e.target.value})} className="win-input" />
                  </div>
                </div>
                <div className="settings-section">
                  <h3>Contacto</h3>
                  <div className="form-group">
                    <label>Teléfono:</label>
                    <input type="text" value={clientForm.telefono} onChange={e => setClientForm({...clientForm, telefono: e.target.value})} className="win-input" />
                  </div>
                  <div className="form-group">
                    <label>Correo Electrónico:</label>
                    <input type="email" value={clientForm.email} onChange={e => setClientForm({...clientForm, email: e.target.value})} className="win-input" />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="settings-section">
                  <h3>Dirección Fiscal</h3>
                  <textarea value={clientForm.direccion} onChange={e => setClientForm({...clientForm, direccion: e.target.value})} className="win-input" style={{ height: '80px' }} />
                </div>
                <div className="settings-section">
                  <h3>Configuración Comercial</h3>
                  <div className="form-group">
                    <label>Tipo de Cliente:</label>
                    <select value={clientForm.tipo} onChange={e => setClientForm({...clientForm, tipo: e.target.value})} className="win-input">
                      <option value="Detal">Detal (Normal)</option>
                      <option value="Mayor">Mayorista</option>
                      <option value="VIP">VIP / Especial</option>
                      <option value="Exento">Contribuyente Exento</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Límite de Crédito (USD):</label>
                    <input type="number" value={clientForm.credito} onChange={e => setClientForm({...clientForm, credito: parseFloat(e.target.value) || 0})} className="win-input" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSaveClient}>💾 GUARDAR CLIENTE</button>
          </div>
        </div>
      )}

      {activeModal === 'modalProcesar' && (
        <div className="modal-window" onClick={e => e.stopPropagation()} style={{ width: '420px' }}>
          <div className="modal-titlebar">
            <span>💳 PROCESAR ABONO / COBRO</span>
            <span className="modal-close" onClick={onClose}>✕</span>
          </div>
          <div className="modal-body space-y-4">
            <div className="win-window p-4 bg-gray-200">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold">TOTAL A CANCELAR:</span>
                <span className="text-xl font-black text-black">${totalVentaUsd.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold">EQUIVALENTE:</span>
                <span className="text-sm font-bold text-gray-700">Bs. {(totalVentaUsd * config.tasa).toFixed(2)}</span>
              </div>
            </div>
            <div className="p-4 border-2 border-gray-400 bg-white">
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="form-group">
                  <label>Método Pago:</label>
                  <select ref={methodRef} value={paymentState.method} onChange={e => setPaymentState({...paymentState, method: e.target.value})} className="win-input" onKeyDown={e => { if(e.key === 'Enter') amountRef.current?.focus(); }}>
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
              <button className="btn btn-primary w-full py-2 shadow-inner" onClick={addPayment}>➕ AÑADIR ABONO</button>
            </div>
            <div className="table-responsive h-24 bg-gray-50">
              <table className="data-table">
                <thead><tr><th>Método</th><th className="text-right">USD</th><th className="text-right">Bs.</th></tr></thead>
                <tbody>
                  {paymentState.payments.map((p, i) => (
                    <tr key={i}><td>{p.method}</td><td className="text-right">${p.usd.toFixed(2)}</td><td className="text-right">{p.bs.toFixed(2)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="win-window p-4 bg-gray-300 text-center">
              <div className="text-[10px] font-bold text-gray-600 uppercase mb-1">{vueltoUsd > 0 ? 'Vuelto a entregar' : 'Faltante por liquidar'}</div>
              <div className="text-3xl font-black text-black">{vueltoUsd > 0 ? `$${vueltoUsd.toFixed(2)}` : `$${faltanteUsd.toFixed(2)}`}</div>
              <div className="text-lg font-bold text-black mt-1">Bs. {(vueltoUsd > 0 ? vueltoUsd * config.tasa : faltanteUsd * config.tasa).toFixed(2)}</div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={onClose}>Volver</button>
            <button className="btn btn-success" disabled={faltanteUsd > 0} onClick={finalizeSale}>💾 PROCESAR VENTA</button>
          </div>
        </div>
      )}

      {activeModal === 'modalProducto' && (
        <div className="modal-window large" onClick={e => e.stopPropagation()}>
          <div className="modal-titlebar">
            <span>💾 FICHA MAESTRA DE PRODUCTO</span>
            <span className="modal-close" onClick={onClose}>✕</span>
          </div>
          <div className="modal-body">
            <div className="grid grid-cols-3 gap-4">
              <div className="settings-section space-y-4">
                <div className="form-group">
                  <label>Código:</label>
                  <input type="text" value={productForm.codigo} onChange={e => setProductForm({...productForm, codigo: e.target.value})} className="win-input font-bold" />
                </div>
                <div className="form-group">
                  <label>Código de Barras:</label>
                  <div className="flex gap-1">
                    <input type="text" value={productForm.barcode} onChange={e => setProductForm({...productForm, barcode: e.target.value})} className="win-input flex-1" />
                    <button className="btn p-1 px-2"><Search size={14}/></button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Nombre del Producto:</label>
                  <input type="text" value={productForm.nombre} onChange={e => setProductForm({...productForm, nombre: e.target.value})} className="win-input" />
                </div>
                <div className="form-group">
                  <label>Referencia / OEM:</label>
                  <input type="text" value={productForm.referencia} onChange={e => setProductForm({...productForm, referencia: e.target.value})} className="win-input" />
                </div>
              </div>

              <div className="settings-section space-y-4">
                <div className="form-group">
                  <label>Marca:</label>
                  <div className="flex gap-1">
                    <select value={productForm.marca} onChange={e => setProductForm({...productForm, marca: e.target.value})} className="win-input flex-1">
                      {marcas.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <button className="btn px-2" onClick={() => {const n=prompt('Nueva Marca:'); if(n) setMarcas([...marcas, n])}}>+</button>
                    <button className="btn px-2" onClick={() => setMarcas(marcas.filter(m => m !== productForm.marca))}>-</button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Unidad de Medida:</label>
                  <div className="flex gap-1">
                    <select value={productForm.unidad} onChange={e => setProductForm({...productForm, unidad: e.target.value})} className="win-input flex-1">
                      {unidades.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <button className="btn px-2" onClick={() => {const n=prompt('Nueva Unidad:'); if(n) setUnidades([...unidades, n])}}>+</button>
                    <button className="btn px-2" onClick={() => setUnidades(unidades.filter(u => u !== productForm.unidad))}>-</button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Categoría:</label>
                  <div className="flex gap-1">
                    <select value={productForm.categoria} onChange={e => setProductForm({...productForm, categoria: e.target.value})} className="win-input flex-1">
                      {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button className="btn px-2" onClick={() => {const n=prompt('Nueva Cat:'); if(n) setCategorias([...categorias, n])}}>+</button>
                    <button className="btn px-2" onClick={() => setCategorias(categorias.filter(c => c !== productForm.categoria))}>-</button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Departamento:</label>
                  <div className="flex gap-1">
                    <select value={productForm.departamento} onChange={e => setProductForm({...productForm, departamento: e.target.value})} className="win-input flex-1">
                      {departamentos.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <button className="btn px-2" onClick={() => {const n=prompt('Nuevo Dept:'); if(n) setDepartamentos([...departamentos, n])}}>+</button>
                    <button className="btn px-2" onClick={() => setDepartamentos(departamentos.filter(d => d !== productForm.departamento))}>-</button>
                  </div>
                </div>
              </div>

              <div className="settings-section space-y-4">
                <div className="form-group">
                  <label>Ganancia Markup (%):</label>
                  <input type="text" value={markupText} onChange={e => handleProductPriceCalc('utilidadPorcentaje', e.target.value)} className="win-input text-blue-800 font-bold" />
                </div>
                <div className="form-group">
                  <label>IVA / Impuestos:</label>
                  <select value={productForm.iva} onChange={e => setProductForm({...productForm, iva: parseInt(e.target.value)})} className="win-input">
                    <option value="16">General (16%)</option>
                    <option value="8">Reducida (8%)</option>
                    <option value="0">Exento (0%)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Precio Detal (USD):</label>
                  <input type="text" value={precioUsdText} onChange={e => handleProductPriceCalc('precio1', e.target.value)} className="win-input font-bold bg-yellow-100" />
                </div>
                <div className="form-group">
                  <label>Precio Detal (Bs.):</label>
                  <input type="text" value={precioBsText} onChange={e => handleProductPriceCalc('precioBs', e.target.value)} className="win-input font-bold" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="settings-section">
                <h3 className="text-blue-800 text-xs mb-3">STOCK Y TIPO</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label>Stock Mínimo:</label>
                    <input type="text" value={stockMinText} onChange={e => setStockMinText(e.target.value)} className="win-input" />
                  </div>
                  <div className="form-group">
                    <label>Stock Inicial:</label>
                    <input type="text" value={stockInicial} onChange={e => setStockInicial(e.target.value)} className="win-input bg-yellow-50" disabled={editingId !== null} />
                  </div>
                </div>
                <div className="form-group mt-3">
                  <label>Ubicación Física:</label>
                  <input type="text" value={productForm.ubicacion} onChange={e => setProductForm({...productForm, ubicacion: e.target.value})} className="win-input" />
                </div>
              </div>

              <div className="settings-section flex flex-col justify-center items-center">
                <label className="checkbox-label text-lg">
                  <input type="checkbox" checked={productForm.isKit} onChange={e => setProductForm({...productForm, isKit: e.target.checked})} />
                  Es Kit / Combo
                </label>
                {productForm.isKit && (
                  <div className="p-2 border mt-2 bg-white w-full">
                    <label className="checkbox-label text-[10px]">
                      <input type="checkbox" checked={productForm.stockPropio} onChange={e => setProductForm({...productForm, stockPropio: e.target.checked})} />
                      Maneja Stock Propio
                    </label>
                    {!productForm.stockPropio && (
                      <div className="mt-1 max-h-20 overflow-y-auto text-[9px]">
                        <select className="w-full win-input" onChange={e => {
                          const idx = parseInt(e.target.value);
                          if(!isNaN(idx)){
                            const p = products[idx];
                            setProductForm({...productForm, kitComponents: [...productForm.kitComponents, {productIndex: idx, codigo: p.codigo, cantidad: 1}]});
                          }
                        }}>
                          <option>Añadir componente...</option>
                          {products.map((p, i) => <option key={i} value={i}>{p.nombre}</option>)}
                        </select>
                        {productForm.kitComponents.map((c, i) => <div key={i}>{c.codigo} x {c.cantidad}</div>)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary flex gap-2" onClick={handleSaveProduct}>
              <Save size={14}/> GUARDAR FICHA
            </button>
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
            <div className="border-b border-dashed border-black my-1" />
            <div className="space-y-1">
              <div className="flex justify-between font-bold"><span>DESC</span> <span>CANT</span> <span>TOTAL</span></div>
              {lastSale.items.map((it, i) => (
                <div key={i} className="flex justify-between">
                  <span className="truncate w-24">{it.descripcion}</span>
                  <span>{it.cantidad}</span>
                  <span>${(it.precioUsd * it.cantidad).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t-2 border-black pt-2 mt-2 space-y-1">
              <div className="flex justify-between"><span>SUBTOTAL:</span> <span>${lastSale.subtotal.toFixed(2)}</span></div>
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
