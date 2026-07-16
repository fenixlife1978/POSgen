'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Product, Client, Provider, Sale, Account, CartItem, Presupuesto, User, InventoryMovement } from '@/types/pos';
import { v4 as uuidv4 } from 'uuid';
import { Wallet, Printer, Download, Plus, Search, Trash2, Save, CreditCard, ChevronRight } from 'lucide-react';

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
  const [stockInicial, setStockInicial] = useState(0);

  // --- PROVIDER FORM ---
  const initialProvider: Provider = { id: '', rif: '', nombre: '', direccion: '', contacto: '', telefono: '' };
  const [providerForm, setProviderForm] = useState<Provider>(initialProvider);

  // --- COMPRA FORM ---
  const [purchaseForm, setPurchaseForm] = useState({
    proveedorId: '', nroFactura: '', tasa: config.tasa, tipo: 'Contado' as 'Contado' | 'Credito' | 'Mixto', 
    diasCredito: 0, pagoContadoUsd: 0, pagoContadoBs: 0, items: [] as any[]
  });
  const [purchaseSearch, setPurchaseSearch] = useState('');
  const [purchaseResults, setPurchaseResults] = useState<Product[]>([]);

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
        setStockInicial(prod.stock);
      }
    } else if (activeModal === 'modalProducto') {
      setProductForm(initialProduct);
      setStockInicial(0);
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

    if (activeModal === 'modalEntrada') {
      setPurchaseForm(prev => ({ ...prev, tasa: config.tasa }));
    }
  }, [activeModal, editingId, products, providers, config.tasa]);

  const handleProductPriceCalc = (field: string, val: number) => {
    let newForm = { ...productForm };
    const cost = newForm.costoPromedio;
    const tasa = config.tasa;

    if (field === 'utilidadPorcentaje') {
      newForm.utilidadPorcentaje = val;
      newForm.precio1 = val >= 100 ? cost : Math.round((cost / (1 - val/100)) * 100) / 100;
    } else if (field === 'precio1') {
      newForm.precio1 = val;
      newForm.utilidadPorcentaje = val > cost ? Math.round((1 - (cost / val)) * 10000) / 100 : 0;
    } else if (field === 'precioBs') {
      const priceUsd = val / tasa;
      newForm.precio1 = Math.round(priceUsd * 100) / 100;
      newForm.utilidadPorcentaje = newForm.precio1 > cost ? Math.round((1 - (cost / newForm.precio1)) * 10000) / 100 : 0;
    } else if (field === 'costoPromedio') {
      newForm.costoPromedio = val;
      newForm.precio1 = newForm.utilidadPorcentaje >= 100 ? val : Math.round((val / (1 - newForm.utilidadPorcentaje/100)) * 100) / 100;
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

    if (isNew) {
      updatedProducts.push(productForm);
      // Generar movimiento de Kardex Inicial
      if (stockInicial > 0) {
        setMovements(prev => [...prev, {
          id: uuidv4(),
          fecha: new Date().toISOString(),
          codigoProducto: productForm.codigo,
          tipo: 'ENTRADA',
          cantidad: stockInicial,
          stockPrevio: 0,
          stockNuevo: stockInicial,
          costo: productForm.costoPromedio,
          referencia: 'STOCK INICIAL',
          comentario: 'Carga inicial de inventario',
          usuario: config.vendedor
        }]);
      }
    } else {
      updatedProducts[editingId] = productForm;
    }

    setProducts(updatedProducts);
    notify(`✅ Producto ${isNew ? 'creado' : 'actualizado'} correctamente`);
    onClose();
  };

  const processPurchase = () => {
    if (purchaseForm.items.length === 0) {
      notify('❌ Debe agregar al menos un producto', 'error');
      return;
    }

    const provider = providers.find(p => p.id === purchaseForm.proveedorId);
    if (!provider) {
      notify('❌ Seleccione un proveedor válido', 'error');
      return;
    }
    
    const updatedProducts = [...products];
    const newMovements: InventoryMovement[] = [...movements];
    const totalPurchase = purchaseForm.items.reduce((acc, it) => acc + (it.cantidad * it.costo), 0);

    purchaseForm.items.forEach(item => {
      const p = updatedProducts[item.productIndex];
      const stockAnterior = p.stock;
      const cppAnterior = p.costoPromedio;
      const nuevoCpp = ((stockAnterior * cppAnterior) + (item.cantidad * item.costo)) / (stockAnterior + item.cantidad);
      
      p.costoAnterior = p.costoActual;
      p.costoActual = item.costo;
      p.costoPromedio = Math.round(nuevoCpp * 100) / 100;
      p.stock += item.cantidad;
      p.precio1 = p.utilidadPorcentaje >= 100 ? p.costoPromedio : Math.round((p.costoPromedio / (1 - p.utilidadPorcentaje/100)) * 100) / 100;

      newMovements.push({
        id: uuidv4(),
        fecha: new Date().toISOString(),
        codigoProducto: p.codigo,
        tipo: 'ENTRADA',
        cantidad: item.cantidad,
        stockPrevio: stockAnterior,
        stockNuevo: p.stock,
        costo: item.costo,
        referencia: purchaseForm.nroFactura || 'COMPRA',
        comentario: `Entrada por compra a ${provider.nombre}`,
        usuario: config.vendedor
      });
    });

    if (purchaseForm.tipo !== 'Contado') {
      const amountPaid = purchaseForm.tipo === 'Mixto' ? purchaseForm.pagoContadoUsd : 0;
      const pending = totalPurchase - amountPaid;
      
      if (pending > 0) {
        setAccounts(prev => [...prev, {
          id: uuidv4(),
          entidad: provider.nombre,
          montoTotal: totalPurchase,
          montoPagado: amountPaid,
          fechaEmision: new Date().toISOString(),
          estado: amountPaid > 0 ? 'Parcial' : 'Pendiente',
          referencia: purchaseForm.nroFactura || 'COMPRA',
          tipo: 'CXP'
        }]);
      }
    }

    setProducts(updatedProducts);
    setMovements(newMovements);
    setPurchaseForm({
      proveedorId: '', nroFactura: '', tasa: config.tasa, tipo: 'Contado', 
      diasCredito: 0, pagoContadoUsd: 0, pagoContadoBs: 0, items: []
    });
    notify('✅ Recepción de mercancía procesada correctamente');
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
      
      // Lógica de Descuento de Stock
      if (product.isKit && !product.stockPropio) {
        // Kit Virtual: Descontar componentes
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
        // Producto Normal o Kit con Stock Propio
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
    const totalPaidUsd = paymentState.totalPaidUsd;
    const missingUsd = Math.max(0, totalUsd - totalPaidUsd);
    
    const isUsdMethod = paymentState.method === 'Efectivo USD' || paymentState.method === 'Zelle';
    if (isUsdMethod) {
      setPaymentState(prev => ({ ...prev, amount: Math.round(missingUsd * 100) / 100 }));
    } else {
      setPaymentState(prev => ({ ...prev, amount: Math.round(missingUsd * config.tasa * 100) / 100 }));
    }
  };

  if (!activeModal && !lastSale) return null;

  const totalVentaUsd = cart.reduce((acc, item) => acc + (item.precioUsd * item.cantidad * (1 + item.iva / 100)), 0);
  const faltanteUsd = Math.max(0, totalVentaUsd - paymentState.totalPaidUsd);
  const vueltoUsd = Math.max(0, paymentState.totalPaidUsd - totalVentaUsd);

  return (
    <div className={`modal-overlay ${activeModal || lastSale ? 'active' : ''}`} onClick={() => { if(!lastSale) onClose(); else setLastSale(null); }}>
      
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
                  <select 
                    ref={methodRef} 
                    value={paymentState.method} 
                    onChange={e => setPaymentState({...paymentState, method: e.target.value})} 
                    className="win-input"
                    onKeyDown={e => { if(e.key === 'Enter') amountRef.current?.focus(); }}
                  >
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
                  <input 
                    ref={amountRef} 
                    type="number" 
                    value={paymentState.amount || ''} 
                    onChange={e => setPaymentState({...paymentState, amount: parseFloat(e.target.value) || 0})} 
                    className="win-input text-right font-bold" 
                    placeholder="0.00"
                    onKeyDown={e => { if(e.key === 'Enter') addPayment(); }}
                  />
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
              <div className="text-[10px] font-bold text-gray-600 uppercase mb-1">
                {vueltoUsd > 0 ? 'Vuelto a entregar' : 'Faltante por liquidar'}
              </div>
              <div className="text-3xl font-black text-black">
                {vueltoUsd > 0 ? `$${vueltoUsd.toFixed(2)}` : `$${faltanteUsd.toFixed(2)}`}
              </div>
              <div className="text-lg font-bold text-black mt-1">
                Bs. {(vueltoUsd > 0 ? vueltoUsd * config.tasa : faltanteUsd * config.tasa).toFixed(2)}
              </div>
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
            <span>📦 FICHA MAESTRA DE PRODUCTO / SERVICIO</span>
            <span className="modal-close" onClick={onClose}>✕</span>
          </div>
          <div className="modal-body">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="settings-section">
                  <h3>Identificación</h3>
                  <div className="form-group">
                    <label>Código:</label>
                    <input type="text" value={productForm.codigo} onChange={e => setProductForm({...productForm, codigo: e.target.value})} className="win-input font-bold" />
                  </div>
                  <div className="form-group">
                    <label>Nombre del Producto / Servicio:</label>
                    <input type="text" value={productForm.nombre} onChange={e => setProductForm({...productForm, nombre: e.target.value})} className="win-input" />
                  </div>
                </div>

                <div className="settings-section">
                  <h3>Atributos</h3>
                  <div className="form-row items-end">
                    <div className="form-group flex-1">
                      <label>Departamento:</label>
                      <div className="flex gap-1">
                        <select value={productForm.departamento} onChange={e => setProductForm({...productForm, departamento: e.target.value})} className="win-input">
                          {departamentos.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <button className="btn px-2" onClick={() => {const n=prompt('Nuevo Dept:'); if(n) setDepartamentos([...departamentos, n])}}>+</button>
                      </div>
                    </div>
                  </div>
                  <div className="form-row items-end mt-2">
                    <div className="form-group flex-1">
                      <label>Categoría:</label>
                      <div className="flex gap-1">
                        <select value={productForm.categoria} onChange={e => setProductForm({...productForm, categoria: e.target.value})} className="win-input">
                          {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <button className="btn px-2" onClick={() => {const n=prompt('Nueva Cat:'); if(n) setCategorias([...categorias, n])}}>+</button>
                      </div>
                    </div>
                  </div>
                  <div className="form-row items-end mt-2">
                    <div className="form-group flex-1">
                      <label>Unidad:</label>
                      <div className="flex gap-1">
                        <select value={productForm.unidad} onChange={e => setProductForm({...productForm, unidad: e.target.value})} className="win-input">
                          {unidades.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                        <button className="btn px-2" onClick={() => {const n=prompt('Nueva Unidad:'); if(n) setUnidades([...unidades, n])}}>+</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="settings-section">
                  <h3>Lógica Financiera</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="form-group">
                      <label>Costo CPP (USD):</label>
                      <input type="number" value={productForm.costoPromedio} onChange={e => handleProductPriceCalc('costoPromedio', parseFloat(e.target.value) || 0)} className="win-input" />
                    </div>
                    <div className="form-group">
                      <label>Ganancia (%):</label>
                      <input type="number" value={productForm.utilidadPorcentaje} onChange={e => handleProductPriceCalc('utilidadPorcentaje', parseFloat(e.target.value) || 0)} className="win-input" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="form-group">
                      <label>Precio Detal (USD):</label>
                      <input type="number" value={productForm.precio1} onChange={e => handleProductPriceCalc('precio1', parseFloat(e.target.value) || 0)} className="win-input font-bold text-blue-900" />
                    </div>
                    <div className="form-group">
                      <label>Precio Detal (Bs.):</label>
                      <input type="number" value={Math.round(productForm.precio1 * config.tasa * 100) / 100} onChange={e => handleProductPriceCalc('precioBs', parseFloat(e.target.value) || 0)} className="win-input font-bold text-red-900" />
                    </div>
                  </div>
                  <div className="form-group mt-2">
                    <label>IVA Aplicable:</label>
                    <select value={productForm.iva} onChange={e => setProductForm({...productForm, iva: parseInt(e.target.value)})} className="win-input">
                      <option value="16">General (16%)</option>
                      <option value="8">Reducida (8%)</option>
                      <option value="0">Exento (0%)</option>
                    </select>
                  </div>
                </div>

                <div className="settings-section">
                  <h3>Inventario</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="form-group">
                      <label>Stock Inicial:</label>
                      <input type="number" value={stockInicial} onChange={e => setStockInicial(parseInt(e.target.value) || 0)} className="win-input" disabled={editingId !== null} />
                    </div>
                    <div className="form-group">
                      <label>Stock Mínimo:</label>
                      <input type="number" value={productForm.stockMin} onChange={e => setProductForm({...productForm, stockMin: parseInt(e.target.value) || 0})} className="win-input" />
                    </div>
                  </div>
                  <div className="form-group mt-3">
                    <label className="checkbox-label">
                      <input type="checkbox" checked={productForm.isKit} onChange={e => setProductForm({...productForm, isKit: e.target.checked})} />
                      Es Kit / Combo
                    </label>
                  </div>
                  
                  {productForm.isKit && (
                    <div className="p-3 bg-blue-50 border border-blue-200 mt-2 space-y-2 animate-in slide-in-from-top-2">
                      <label className="checkbox-label text-[10px]">
                        <input type="checkbox" checked={productForm.stockPropio} onChange={e => setProductForm({...productForm, stockPropio: e.target.checked})} />
                        Maneja Stock Propio (Físico)
                      </label>
                      
                      {!productForm.stockPropio && (
                        <div className="mt-2 space-y-2">
                          <p className="text-[9px] font-bold text-blue-800 uppercase">Componentes del Kit Virtual:</p>
                          <div className="flex gap-1">
                            <select className="win-input text-[10px] flex-1" id="kitCompSel">
                              <option value="">Seleccionar Item...</option>
                              {products.filter(p => p.codigo !== productForm.codigo).map((p, idx) => (
                                <option key={p.codigo} value={idx}>{p.nombre}</option>
                              ))}
                            </select>
                            <button className="btn px-2" onClick={() => {
                              const sel = document.getElementById('kitCompSel') as HTMLSelectElement;
                              const idx = parseInt(sel.value);
                              if(!isNaN(idx)) {
                                const p = products[idx];
                                setProductForm({...productForm, kitComponents: [...productForm.kitComponents, { productIndex: idx, codigo: p.codigo, cantidad: 1 }]});
                              }
                            }}>+</button>
                          </div>
                          <div className="max-h-20 overflow-y-auto border bg-white">
                            {productForm.kitComponents.map((c, i) => (
                              <div key={i} className="flex justify-between items-center p-1 text-[10px] border-b">
                                <span>{c.codigo}</span>
                                <input type="number" value={c.cantidad} onChange={e => {const n=[...productForm.kitComponents]; n[i].cantidad=parseInt(e.target.value)||1; setProductForm({...productForm, kitComponents:n})}} className="w-8 text-center border" />
                                <button className="text-red-600" onClick={() => {const n=[...productForm.kitComponents]; n.splice(i,1); setProductForm({...productForm, kitComponents:n})}}>x</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSaveProduct}>💾 GUARDAR PRODUCTO</button>
          </div>
        </div>
      )}

      {activeModal === 'modalAjuste' && (
        <div className="modal-window" onClick={e => e.stopPropagation()} style={{ width: '400px' }}>
          <div className="modal-titlebar">
            <span>🔧 AJUSTE MANUAL DE INVENTARIO</span>
            <span className="modal-close" onClick={onClose}>✕</span>
          </div>
          <div className="modal-body space-y-4">
            <div className="form-group">
              <label>Producto a Ajustar:</label>
              <select id="adjProd" className="win-input">
                {products.map((p, idx) => <option key={p.codigo} value={idx}>{p.codigo} - {p.nombre} (Stock: {p.stock})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label>Tipo Ajuste:</label>
                <select id="adjTipo" className="win-input">
                  <option value="ENTRADA">➕ Entrada (+)</option>
                  <option value="SALIDA">➖ Salida (-)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Cantidad:</label>
                <input type="number" id="adjCant" className="win-input" min="1" defaultValue="1" />
              </div>
            </div>
            <div className="form-group">
              <label>Motivo del Ajuste:</label>
              <textarea id="adjMotivo" className="win-input" placeholder="Ej: Mercancía dañada, error de conteo..." style={{ height: '60px' }} />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" onClick={() => {
              const idx = parseInt((document.getElementById('adjProd') as HTMLSelectElement).value);
              const tipo = (document.getElementById('adjTipo') as HTMLSelectElement).value as any;
              const cant = parseInt((document.getElementById('adjCant') as HTMLInputElement).value);
              const motivo = (document.getElementById('adjMotivo') as HTMLTextAreaElement).value;
              
              const p = products[idx];
              const stockPrev = p.stock;
              const realCant = tipo === 'ENTRADA' ? cant : -cant;
              
              const updated = [...products];
              updated[idx].stock += realCant;
              setProducts(updated);
              
              setMovements([...movements, {
                id: uuidv4(), fecha: new Date().toISOString(), codigoProducto: p.codigo, tipo: 'AJUSTE',
                cantidad: realCant, stockPrevio: stockPrev, stockNuevo: updated[idx].stock,
                costo: p.costoPromedio, referencia: 'AJUSTE MANUAL', comentario: motivo, usuario: config.vendedor
              }]);
              
              notify('✅ Ajuste realizado correctamente');
              onClose();
            }}> APLICAR AJUSTE</button>
          </div>
        </div>
      )}

      {lastSale && (
        <div className="modal-window" onClick={e => e.stopPropagation()} style={{ width: '280px', background: '#fff', color: '#000' }}>
          <div className="p-4 font-mono text-[10px] space-y-2 border-2 border-black">
            <div className="text-center font-bold text-xs uppercase border-b-2 border-black pb-2 mb-2">
              <div>{config.nombreEmpresa}</div>
              <div>RIF: {config.rifEmpresa}</div>
              <div className="text-[8px] font-normal">{config.direccion}</div>
              <div className="text-[8px] font-normal">TEL: {config.telefono}</div>
            </div>
            
            <div className="flex justify-between"><span>FACTURA:</span> <span>{lastSale.numero}</span></div>
            <div className="flex justify-between"><span>FECHA:</span> <span>{new Date(lastSale.fecha).toLocaleString()}</span></div>
            <div className="flex justify-between"><span>VEND:</span> <span>{lastSale.vendedor}</span></div>
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
              <div className="flex justify-between"><span>IVA:</span> <span>${lastSale.iva.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-xs"><span>TOTAL USD:</span> <span>${lastSale.totalUsd.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold"><span>TOTAL BS:</span> <span>{lastSale.totalBs.toFixed(2)}</span></div>
            </div>

            <div className="mt-4 border-t pt-2 text-[8px]">
              <div className="flex justify-between font-bold"><span>METODOS:</span> <span>{lastSale.pago}</span></div>
              <div className="flex justify-between"><span>RECIBIDO:</span> <span>${lastSale.recibidoUsd.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold"><span>VUELTO:</span> <span>${lastSale.cambioUsd.toFixed(2)}</span></div>
            </div>

            <div className="text-center mt-6 text-[8px] border-t pt-2">
              GRACIAS POR SU COMPRA
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
