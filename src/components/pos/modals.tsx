
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Product, Client, Provider, Sale, Account, CartItem, Presupuesto, User, InventoryMovement } from '@/types/pos';
import { v4 as uuidv4 } from 'uuid';
import { Wallet, Printer, Download, Plus, Search, Trash2, Save, CreditCard } from 'lucide-react';

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
  const addBtnRef = useRef<HTMLButtonElement>(null);

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

  const handleSaveProvider = () => {
    if (!providerForm.rif || !providerForm.nombre) {
      notify('❌ RIF y Nombre son obligatorios', 'error');
      return;
    }

    const isNew = !providerForm.id;
    const duplicate = providers.find(p => p.rif.toLowerCase() === providerForm.rif.toLowerCase() && p.id !== providerForm.id);
    
    if (duplicate) {
      notify('❌ El RIF ingresado ya pertenece a otro proveedor', 'error');
      return;
    }

    let updatedProviders = [...providers];
    if (isNew) {
      updatedProviders.push({ ...providerForm, id: uuidv4() });
    } else {
      updatedProviders = updatedProviders.map(p => p.id === providerForm.id ? providerForm : p);
    }

    setProviders(updatedProviders);
    notify(`✅ Proveedor ${isNew ? 'registrado' : 'actualizado'} correctamente`);
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

    // Lógica de Cuenta por Pagar (CXP)
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
    cart.forEach(item => {
      const product = updatedProducts[item.productIndex];
      if (product.isKit && !product.stockPropio) {
        product.kitComponents.forEach(comp => {
          const compProd = updatedProducts[comp.productIndex];
          if (compProd) compProd.stock -= (comp.cantidad * item.cantidad);
        });
      } else {
        product.stock -= item.cantidad;
      }
    });

    setSales([...sales, sale]);
    setProducts(updatedProducts);
    setLastSale(sale);
    setCart([]);
    notify('✅ Venta procesada exitosamente');
    onClose();
  };

  const addPurchaseItem = (p: Product) => {
    const exists = purchaseForm.items.find(it => it.codigo === p.codigo);
    if (exists) { notify('⚠️ El producto ya está en la lista', 'warning'); return; }
    setPurchaseForm({
      ...purchaseForm,
      items: [...purchaseForm.items, {
        codigo: p.codigo, nombre: p.nombre, cantidad: 1, costo: p.costoActual || p.costoPromedio, productIndex: products.indexOf(p)
      }]
    });
    setPurchaseSearch('');
    setPurchaseResults([]);
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

  if (!activeModal && !lastSale) return null;

  return (
    <div className={`modal-overlay ${activeModal || lastSale ? 'active' : ''}`} onClick={() => { if(!lastSale) onClose(); else setLastSale(null); }}>
      
      {activeModal === 'modalProveedor' && (
        <div className="modal-window" onClick={e => e.stopPropagation()} style={{ width: '450px' }}>
          <div className="modal-titlebar">
            <span>🏢 FICHA MAESTRA DE PROVEEDOR</span>
            <span className="modal-close" onClick={onClose}>✕</span>
          </div>
          <div className="modal-body space-y-4">
            <div className="form-group">
              <label>RIF / Identificación Fiscal:</label>
              <input type="text" value={providerForm.rif} onChange={e => setProviderForm({...providerForm, rif: e.target.value})} className="win-input" placeholder="Ej: J-12345678-9" />
            </div>
            <div className="form-group">
              <label>Nombre / Razón Social:</label>
              <input type="text" value={providerForm.nombre} onChange={e => setProviderForm({...providerForm, nombre: e.target.value})} className="win-input" />
            </div>
            <div className="form-group">
              <label>Persona de Contacto:</label>
              <input type="text" value={providerForm.contacto} onChange={e => setProviderForm({...providerForm, contacto: e.target.value})} className="win-input" />
            </div>
            <div className="form-group">
              <label>Teléfono:</label>
              <input type="text" value={providerForm.telefono} onChange={e => setProviderForm({...providerForm, telefono: e.target.value})} className="win-input" />
            </div>
            <div className="form-group">
              <label>Dirección:</label>
              <textarea value={providerForm.direccion} onChange={e => setProviderForm({...providerForm, direccion: e.target.value})} className="win-input" style={{ height: '60px' }} />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSaveProvider}>💾 GUARDAR PROVEEDOR</button>
          </div>
        </div>
      )}

      {activeModal === 'modalEntrada' && (
        <div className="modal-window xlarge" onClick={e => e.stopPropagation()}>
          <div className="modal-titlebar">
            <span>📥 ENTRADA POR COMPRA (RECEPCIÓN)</span>
            <span className="modal-close" onClick={onClose}>✕</span>
          </div>
          <div className="modal-body space-y-6">
            <div className="win-window p-6 bg-gray-200 grid grid-cols-4 gap-4">
              <div className="form-group col-span-2">
                <label>Proveedor:</label>
                <select value={purchaseForm.proveedorId} onChange={e => setPurchaseForm({...purchaseForm, proveedorId: e.target.value})} className="win-input">
                  <option value="">-- Seleccionar Proveedor --</option>
                  {providers.map(p => <option key={p.id} value={p.id}>{p.rif} - {p.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Nro Factura:</label>
                <input type="text" value={purchaseForm.nroFactura} onChange={e => setPurchaseForm({...purchaseForm, nroFactura: e.target.value})} className="win-input" />
              </div>
              <div className="form-group">
                <label>Tasa Aplicada:</label>
                <input type="number" value={purchaseForm.tasa} onChange={e => setPurchaseForm({...purchaseForm, tasa: parseFloat(e.target.value) || 0})} className="win-input font-bold" />
              </div>
              <div className="form-group">
                <label>Tipo Compra:</label>
                <select value={purchaseForm.tipo} onChange={e => setPurchaseForm({...purchaseForm, tipo: e.target.value as any})} className="win-input">
                  <option value="Contado">Contado</option>
                  <option value="Credito">Crédito</option>
                  <option value="Mixto">Mixto</option>
                </select>
              </div>
              {purchaseForm.tipo !== 'Contado' && (
                <div className="form-group">
                  <label>Días Crédito:</label>
                  <input type="number" value={purchaseForm.diasCredito} onChange={e => setPurchaseForm({...purchaseForm, diasCredito: parseInt(e.target.value) || 0})} className="win-input" />
                </div>
              )}
            </div>

            <div className="toolbar bg-blue-100 p-4 border border-blue-300">
              <div className="flex-1 px-4 relative">
                <input 
                  type="text" 
                  placeholder="🔍 Buscar producto inteligente..." 
                  className="win-input w-full" 
                  value={purchaseSearch}
                  onChange={(e) => {
                    setPurchaseSearch(e.target.value);
                    if (e.target.value.length > 0) {
                      setPurchaseResults(products.filter(p => p.nombre.toLowerCase().includes(e.target.value.toLowerCase()) || p.codigo.toLowerCase().startsWith(e.target.value.toLowerCase())).slice(0, 10));
                    } else setPurchaseResults([]);
                  }}
                />
                {purchaseResults.length > 0 && (
                  <div className="absolute top-full left-4 right-4 bg-white border-2 border-blue-800 z-50 shadow-xl max-h-48 overflow-y-auto">
                    {purchaseResults.map(p => (
                      <div key={p.codigo} className="p-2 hover:bg-blue-100 cursor-pointer text-xs flex justify-between border-b" onClick={() => addPurchaseItem(p)}>
                        <span><strong>{p.codigo}</strong> - {p.nombre}</span>
                        <span className="font-bold">Stock: {p.stock}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="table-responsive h-48 bg-white">
              <table className="data-table">
                <thead>
                  <tr><th>Código</th><th>Descripción</th><th>Cant</th><th>Costo USD</th><th>Subtotal</th><th>Acción</th></tr>
                </thead>
                <tbody>
                  {purchaseForm.items.map((it, idx) => (
                    <tr key={idx}>
                      <td>{it.codigo}</td><td>{it.nombre}</td>
                      <td><input type="number" value={it.cantidad} onChange={e => {const n=[...purchaseForm.items]; n[idx].cantidad=parseInt(e.target.value)||1; setPurchaseForm({...purchaseForm, items:n})}} className="win-input w-16 text-center" /></td>
                      <td><input type="number" value={it.costo} onChange={e => {const n=[...purchaseForm.items]; n[idx].costo=parseFloat(e.target.value)||0; setPurchaseForm({...purchaseForm, items:n})}} className="win-input w-24 text-right" /></td>
                      <td className="text-right">${(it.cantidad * it.costo).toFixed(2)}</td>
                      <td className="text-center"><button className="text-red-600" onClick={() => {const n=[...purchaseForm.items]; n.splice(idx,1); setPurchaseForm({...purchaseForm, items:n})}}>❌</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" onClick={processPurchase}>💾 PROCESAR ENTRADA</button>
          </div>
        </div>
      )}

      {/* ... Resto de los modales (Producto, Procesar, Ticket) se mantienen igual ... */}
    </div>
  );
}
