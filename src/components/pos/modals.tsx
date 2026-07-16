'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Product, Client, Sale, Account, CartItem, Presupuesto, User, InventoryMovement, KitComponent } from '@/types/pos';
import { v4 as uuidv4 } from 'uuid';
import { Wallet, Printer, Download, Plus, Search, Trash2, Save, CreditCard, Minus } from 'lucide-react';

interface ModalsProps {
  activeModal: string | null;
  onClose: () => void;
  onOpenModal: (id: string, dataId?: any) => void;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
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
  sales, setSales, accounts, setAccounts, cart, setCart, 
  config, setConfig, notify, editingId, users, setUsers,
  movements, setMovements
}: ModalsProps) {
  
  const [marcas, setMarcas] = useState(['Universal', 'Toyota', 'Ford', 'LUK', 'BOSCH', 'NGK']);
  const [unidades, setUnidades] = useState(['Unidad', 'Kilo', 'Litro', 'Caja', 'Galón', 'Par']);
  const [categorias, setCategorias] = useState(['Repuesto', 'Lubricante', 'Servicio', 'Accesorio', 'Frenos', 'Motor']);
  const [departamentos, setDepartamentos] = useState(['Almacén Principal', 'Tienda', 'Servicios']);

  // Refs para navegación de teclado
  const methodRef = useRef<HTMLSelectElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);

  // --- PRODUCT FORM STATE ---
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

  // Component selection for virtual kits
  const [compSearch, setCompSearch] = useState('');
  const [compResults, setCompResults] = useState<Product[]>([]);

  // --- COMPRA FORM STATE ---
  const [purchaseForm, setPurchaseForm] = useState({
    proveedor: '', nroFactura: '', tasa: config.tasa, tipo: 'Contado' as 'Contado' | 'Credito' | 'Mixto', 
    diasCredito: 0, pagoContadoUsd: 0, pagoContadoBs: 0, items: [] as any[]
  });
  const [purchaseSearch, setPurchaseSearch] = useState('');
  const [purchaseResults, setPurchaseResults] = useState<Product[]>([]);

  // --- PROCESAR PAGO STATE ---
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
    
    if (activeModal === 'modalProcesar') {
      setPaymentState({ method: 'Efectivo USD', amount: 0, payments: [], totalPaidUsd: 0 });
      setTimeout(() => methodRef.current?.focus(), 100);
    }

    if (activeModal === 'modalEntrada') {
      setPurchaseForm(prev => ({ ...prev, tasa: config.tasa }));
    }
  }, [activeModal, editingId, products, config.tasa]);

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

  const manageList = (list: string[], setList: (l: string[]) => void, action: 'add' | 'remove', value?: string) => {
    if (action === 'add') {
      const newVal = prompt('Ingrese el nuevo valor:');
      if (newVal) setList([...list, newVal]);
    } else {
      if (confirm(`¿Eliminar "${value}" de la lista?`)) {
        setList(list.filter(l => l !== value));
      }
    }
  };

  const addComponentToKit = (p: Product) => {
    if (p.codigo === productForm.codigo) {
      notify('❌ No puedes agregar el producto a sí mismo', 'error');
      return;
    }
    const idx = products.indexOf(p);
    const exists = productForm.kitComponents.find(c => c.codigo === p.codigo);
    if (exists) return;

    setProductForm({
      ...productForm,
      kitComponents: [...productForm.kitComponents, { productIndex: idx, codigo: p.codigo, cantidad: 1 }]
    });
    setCompSearch('');
    setCompResults([]);
  };

  const handlePurchaseSearch = (query: string) => {
    setPurchaseSearch(query);
    if (query.length < 1) {
      setPurchaseResults([]);
      return;
    }
    const filtered = products.filter(p => 
      p.codigo.toLowerCase().startsWith(query.toLowerCase()) || 
      p.nombre.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10);
    setPurchaseResults(filtered);
  };

  const addPurchaseItem = (p: Product) => {
    const exists = purchaseForm.items.find(it => it.codigo === p.codigo);
    if (exists) {
      notify('⚠️ El producto ya está en la lista', 'warning');
      return;
    }
    setPurchaseForm({
      ...purchaseForm,
      items: [...purchaseForm.items, {
        codigo: p.codigo,
        nombre: p.nombre,
        cantidad: 1,
        costo: p.costoActual || p.costoPromedio,
        productIndex: products.indexOf(p)
      }]
    });
    setPurchaseSearch('');
    setPurchaseResults([]);
  };

  const removePurchaseItem = (idx: number) => {
    const newItems = [...purchaseForm.items];
    newItems.splice(idx, 1);
    setPurchaseForm({ ...purchaseForm, items: newItems });
  };

  const updatePurchaseItem = (idx: number, field: string, value: any) => {
    const newItems = [...purchaseForm.items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    setPurchaseForm({ ...purchaseForm, items: newItems });
  };

  const processPurchase = () => {
    if (purchaseForm.items.length === 0) {
      notify('❌ Debe agregar al menos un producto', 'error');
      return;
    }
    
    const updatedProducts = [...products];
    const newMovements: InventoryMovement[] = [...movements];

    purchaseForm.items.forEach(item => {
      const p = updatedProducts[item.productIndex];
      const stockAnterior = p.stock;
      const cppAnterior = p.costoPromedio;
      
      // Recálculo de CPP Financiero
      const nuevoCpp = ((stockAnterior * cppAnterior) + (item.cantidad * item.costo)) / (stockAnterior + item.cantidad);
      
      p.costoAnterior = p.costoActual;
      p.costoActual = item.costo;
      p.costoPromedio = Math.round(nuevoCpp * 100) / 100;
      p.stock += item.cantidad;

      // Actualización de precio si se mantiene el margen
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
        comentario: `Entrada por compra a ${purchaseForm.proveedor || 'Proveedor'}`,
        usuario: config.vendedor
      });
    });

    setProducts(updatedProducts);
    setMovements(newMovements);
    setPurchaseForm({
      proveedor: '', nroFactura: '', tasa: config.tasa, tipo: 'Contado', 
      diasCredito: 0, pagoContadoUsd: 0, pagoContadoBs: 0, items: []
    });
    notify('✅ Recepción de mercancía procesada correctamente');
    onClose();
  };

  const getCartTotal = () => {
    let subtotal = 0;
    let totalIva = 0;
    cart.forEach(item => {
      const s = Math.round(item.precioUsd * item.cantidad * 100) / 100;
      subtotal += s;
      totalIva += Math.round(s * (item.iva / 100) * 100) / 100;
    });
    return Math.round((subtotal + totalIva) * 100) / 100;
  };

  const addPayment = () => {
    if (paymentState.amount <= 0) return;
    let usd = 0; let bs = 0;
    
    const isUsdMethod = paymentState.method === 'Efectivo USD' || paymentState.method === 'Zelle';
    
    if (isUsdMethod) {
      usd = paymentState.amount; bs = Math.round(usd * config.tasa * 100) / 100;
    } else {
      bs = paymentState.amount; usd = Math.round((bs / config.tasa) * 100) / 100;
    }
    
    const newPayments = [...paymentState.payments, { method: paymentState.method, usd, bs }];
    setPaymentState({
      ...paymentState,
      payments: newPayments,
      totalPaidUsd: Math.round(newPayments.reduce((acc, p) => acc + p.usd, 0) * 100) / 100,
      amount: 0
    });
    methodRef.current?.focus();
  };

  const finalizeSale = () => {
    const totalUsd = getCartTotal();
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

  const handleSaveProduct = () => {
    const updated = [...products];
    const isNew = editingId === null;
    const finalProduct = { ...productForm, stock: isNew ? stockInicial : productForm.stock };

    if (isNew) {
      updated.push(finalProduct);
      if (stockInicial > 0) {
        const movement: InventoryMovement = {
          id: uuidv4(),
          fecha: new Date().toISOString(),
          codigoProducto: finalProduct.codigo,
          tipo: 'ENTRADA',
          cantidad: stockInicial,
          stockPrevio: 0,
          stockNuevo: stockInicial,
          costo: finalProduct.costoPromedio,
          referencia: 'APERTURA',
          comentario: 'Stock inicial en ficha maestra',
          usuario: config.vendedor
        };
        setMovements([...movements, movement]);
      }
    } else {
      updated[editingId] = finalProduct;
    }

    setProducts(updated);
    notify(`✅ Producto ${isNew ? 'creado' : 'actualizado'} correctamente`);
    onClose();
  };

  const handleCalculatorKeyDown = (e: React.KeyboardEvent, field: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'method') amountRef.current?.focus();
      if (field === 'amount') addBtnRef.current?.focus();
      if (field === 'add') addPayment();
    }
  };

  const purchaseTotals = purchaseForm.items.reduce((acc, it) => acc + (it.cantidad * it.costo), 0);

  if (!activeModal && !lastSale) return null;

  return (
    <>
      <div className={`modal-overlay ${activeModal || lastSale ? 'active' : ''}`} onClick={() => { if(!lastSale) onClose(); else setLastSale(null); }}>
        
        {activeModal === 'modalProducto' && (
          <div className="modal-window xlarge" onClick={e => e.stopPropagation()}>
            <div className="modal-titlebar">
              <span>📇 FICHA MAESTRA DE PRODUCTO / SERVICIO</span>
              <span className="modal-close" onClick={onClose}>✕</span>
            </div>
            <div className="modal-body max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-6">
                <div className="win-window p-4 space-y-3">
                  <h3 className="text-blue-800 font-bold border-b border-gray-400 pb-1 mb-2">IDENTIFICACIÓN</h3>
                  <div className="form-group">
                    <label>Código Interno:</label>
                    <input type="text" value={productForm.codigo} onChange={e => setProductForm({...productForm, codigo: e.target.value})} className="win-input" />
                  </div>
                  <div className="form-group">
                    <label>Código de Barras:</label>
                    <div className="flex gap-1">
                      <input type="text" value={productForm.barcode} onChange={e => setProductForm({...productForm, barcode: e.target.value})} className="win-input flex-1" />
                      <button className="btn p-1">🔍</button>
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

                <div className="win-window p-4 space-y-3">
                  <h3 className="text-blue-800 font-bold border-b border-gray-400 pb-1 mb-2">ATRIBUTOS</h3>
                  <div className="form-group">
                    <label>Marca:</label>
                    <div className="flex gap-1">
                      <select value={productForm.marca} onChange={e => setProductForm({...productForm, marca: e.target.value})} className="win-input flex-1">
                        {marcas.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <button className="btn p-1" onClick={() => manageList(marcas, setMarcas, 'add')}>+</button>
                      <button className="btn p-1" onClick={() => manageList(marcas, setMarcas, 'remove', productForm.marca)}>-</button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Unidad de Medida:</label>
                    <div className="flex gap-1">
                      <select value={productForm.unidad} onChange={e => setProductForm({...productForm, unidad: e.target.value})} className="win-input flex-1">
                        {unidades.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                      <button className="btn p-1" onClick={() => manageList(unidades, setUnidades, 'add')}>+</button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Categoría:</label>
                    <div className="flex gap-1">
                      <select value={productForm.categoria} onChange={e => setProductForm({...productForm, categoria: e.target.value})} className="win-input flex-1">
                        {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <button className="btn p-1" onClick={() => manageList(categorias, setCategorias, 'add')}>+</button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Departamento:</label>
                    <div className="flex gap-1">
                      <select value={productForm.departamento} onChange={e => setProductForm({...productForm, departamento: e.target.value})} className="win-input flex-1">
                        {departamentos.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <button className="btn p-1" onClick={() => manageList(departamentos, setDepartamentos, 'add')}>+</button>
                      <button className="btn p-1" onClick={() => manageList(departamentos, setDepartamentos, 'remove', productForm.departamento)}>-</button>
                    </div>
                  </div>
                </div>

                <div className="win-window p-4 space-y-3 bg-gray-100">
                  <h3 className="text-green-800 font-bold border-b border-gray-400 pb-1 mb-2">LÓGICA FINANCIERA</h3>
                  <div className="form-group">
                    <label>Costo Promedio (USD):</label>
                    <input 
                      type="number" 
                      value={productForm.costoPromedio} 
                      onChange={e => handleProductPriceCalc('costoPromedio', parseFloat(e.target.value) || 0)} 
                      className="win-input font-bold text-red-600"
                    />
                  </div>
                  <div className="form-group">
                    <label>Ganancia Markup (%):</label>
                    <input 
                      type="number" 
                      value={productForm.utilidadPorcentaje} 
                      onChange={e => handleProductPriceCalc('utilidadPorcentaje', parseFloat(e.target.value) || 0)} 
                      className="win-input font-bold text-blue-600"
                    />
                  </div>
                  <div className="form-group">
                    <label>IVA / Impuestos:</label>
                    <select 
                      value={productForm.iva} 
                      onChange={e => setProductForm({...productForm, iva: parseFloat(e.target.value) || 0, ivaAlicuota: parseFloat(e.target.value) || 0})} 
                      className="win-input font-bold"
                    >
                      <option value="16">General (16%)</option>
                      <option value="8">Reducida (8%)</option>
                      <option value="0">Exento (0%)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Precio Detal (USD):</label>
                    <input 
                      type="number" 
                      value={productForm.precio1} 
                      onChange={e => handleProductPriceCalc('precio1', parseFloat(e.target.value) || 0)} 
                      className="win-input font-bold text-lg bg-yellow-100"
                    />
                  </div>
                  <div className="form-group">
                    <label>Precio Detal (Bs.):</label>
                    <input 
                      type="number" 
                      value={Math.round(productForm.precio1 * config.tasa * 100) / 100} 
                      onChange={e => handleProductPriceCalc('precioBs', parseFloat(e.target.value) || 0)}
                      className="win-input font-black bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-6">
                <div className="win-window p-4 space-y-4">
                  <h3 className="text-indigo-800 font-bold mb-2">STOCK Y TIPO</h3>
                  <div className="flex gap-4">
                    <div className="form-group flex-1">
                      <label>Stock Mínimo:</label>
                      <input type="number" value={productForm.stockMin} onChange={e => setProductForm({...productForm, stockMin: parseInt(e.target.value) || 0})} className="win-input" />
                    </div>
                    {editingId === null && (
                      <div className="form-group flex-1">
                        <label>Stock Inicial:</label>
                        <input type="number" value={stockInicial} onChange={e => setStockInicial(parseInt(e.target.value) || 0)} className="win-input bg-yellow-50" />
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Ubicación Física:</label>
                    <input type="text" value={productForm.ubicacion} onChange={e => setProductForm({...productForm, ubicacion: e.target.value})} className="win-input" />
                  </div>
                </div>

                <div className="win-window p-4 space-y-4">
                   <div className="flex items-center justify-around h-full">
                      <label className="flex items-center gap-2 font-bold cursor-pointer">
                        <input type="checkbox" checked={productForm.isKit} onChange={e => setProductForm({...productForm, isKit: e.target.checked})} /> 
                        Es Kit / Combo
                      </label>
                      {productForm.isKit && (
                        <div className="flex flex-col gap-2">
                           <label className="flex items-center gap-2 text-xs cursor-pointer">
                            <input type="radio" name="kitType" checked={productForm.stockPropio} onChange={() => setProductForm({...productForm, stockPropio: true})} /> 
                            Stock Propio
                          </label>
                          <label className="flex items-center gap-2 text-xs cursor-pointer">
                            <input type="radio" name="kitType" checked={!productForm.stockPropio} onChange={() => setProductForm({...productForm, stockPropio: false})} /> 
                            Stock Virtual
                          </label>
                        </div>
                      )}
                   </div>
                </div>
              </div>

              {productForm.isKit && !productForm.stockPropio && (
                <div className="win-window p-4 mt-6 animate-in slide-in-from-top-4">
                  <h3 className="text-blue-800 font-bold mb-4 border-b">COMPONENTES DEL KIT VIRTUAL (Se descuentan del inventario)</h3>
                  <div className="flex gap-2 mb-4 relative">
                    <input 
                      type="text" 
                      placeholder="🔍 Buscar componente..." 
                      className="win-input flex-1"
                      value={compSearch}
                      onChange={e => {
                        setCompSearch(e.target.value);
                        if (e.target.value.length > 1) {
                          setCompResults(products.filter(p => p.nombre.toLowerCase().includes(e.target.value.toLowerCase()) || p.codigo.toLowerCase().includes(e.target.value.toLowerCase())).slice(0, 5));
                        } else setCompResults([]);
                      }}
                    />
                    {compResults.length > 0 && (
                      <div className="absolute top-full left-0 w-full bg-white border-2 border-blue-800 z-50 shadow-xl">
                        {compResults.map(p => (
                          <div key={p.codigo} className="p-2 hover:bg-blue-100 cursor-pointer text-xs flex justify-between" onClick={() => addComponentToKit(p)}>
                            <span>{p.codigo} - {p.nombre}</span>
                            <span className="font-bold">Stock: {p.stock}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <table className="data-table">
                    <thead>
                      <tr><th>Código</th><th>Descripción</th><th className="w-24">Cantidad</th><th>Eliminar</th></tr>
                    </thead>
                    <tbody>
                      {productForm.kitComponents.map((comp, idx) => (
                        <tr key={comp.codigo}>
                          <td>{comp.codigo}</td>
                          <td>{products.find(p => p.codigo === comp.codigo)?.nombre}</td>
                          <td>
                            <input 
                              type="number" 
                              value={comp.cantidad} 
                              onChange={e => {
                                const n = [...productForm.kitComponents];
                                n[idx].cantidad = parseInt(e.target.value) || 1;
                                setProductForm({...productForm, kitComponents: n});
                              }}
                              className="win-input w-full text-center"
                            />
                          </td>
                          <td className="text-center">
                            <button className="text-red-600" onClick={() => setProductForm({...productForm, kitComponents: productForm.kitComponents.filter((_, i) => i !== idx)})}>❌</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={onClose}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSaveProduct}>💾 GUARDAR FICHA</button>
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
                  <input type="text" value={purchaseForm.proveedor} onChange={e => setPurchaseForm({...purchaseForm, proveedor: e.target.value})} className="win-input" />
                </div>
                <div className="form-group">
                  <label>Nro Factura:</label>
                  <input type="text" value={purchaseForm.nroFactura} onChange={e => setPurchaseForm({...purchaseForm, nroFactura: e.target.value})} className="win-input" />
                </div>
                <div className="form-group">
                  <label>Tasa BCV:</label>
                  <input 
                    type="number" 
                    value={purchaseForm.tasa} 
                    onChange={e => setPurchaseForm({...purchaseForm, tasa: parseFloat(e.target.value) || 0})}
                    className="win-input font-bold" 
                  />
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
                {purchaseForm.tipo === 'Mixto' && (
                  <>
                    <div className="form-group">
                      <label>Pago Contado (USD):</label>
                      <input type="number" value={purchaseForm.pagoContadoUsd} onChange={e => setPurchaseForm({...purchaseForm, pagoContadoUsd: parseFloat(e.target.value) || 0, pagoContadoBs: Math.round((parseFloat(e.target.value) || 0) * purchaseForm.tasa * 100) / 100})} className="win-input" />
                    </div>
                    <div className="form-group">
                      <label>Pago Contado (Bs.):</label>
                      <input type="number" value={purchaseForm.pagoContadoBs} onChange={e => setPurchaseForm({...purchaseForm, pagoContadoBs: parseFloat(e.target.value) || 0, pagoContadoUsd: Math.round(((parseFloat(e.target.value) || 0) / purchaseForm.tasa) * 100) / 100})} className="win-input" />
                    </div>
                  </>
                )}
              </div>

              <div className="toolbar bg-blue-100 p-4 border border-blue-300">
                <button className="btn btn-success" onClick={() => onOpenModal('modalProducto')}>➕ NUEVA FICHA</button>
                <div className="flex-1 px-4 relative">
                  <input 
                    type="text" 
                    placeholder="🔍 Buscar producto por código o nombre..." 
                    className="win-input w-full" 
                    value={purchaseSearch}
                    onChange={(e) => handlePurchaseSearch(e.target.value)}
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
                <button className="btn btn-primary">➕ AÑADIR ITEM</button>
              </div>

              <div className="table-responsive h-48 bg-white border-2 border-gray-400">
                <table className="data-table">
                  <thead>
                    <tr><th>Código</th><th>Descripción</th><th>Cant</th><th>Costo USD</th><th>Subtotal</th><th>Acción</th></tr>
                  </thead>
                  <tbody>
                    {purchaseForm.items.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-8 text-gray-400 italic">No hay items cargados en esta compra</td></tr>
                    ) : (
                      purchaseForm.items.map((it, idx) => (
                        <tr key={idx}>
                          <td>{it.codigo}</td>
                          <td>{it.nombre}</td>
                          <td>
                            <input type="number" value={it.cantidad} onChange={e => updatePurchaseItem(idx, 'cantidad', parseInt(e.target.value) || 1)} className="win-input w-16 text-center" />
                          </td>
                          <td>
                            <input type="number" value={it.costo} onChange={e => updatePurchaseItem(idx, 'costo', parseFloat(e.target.value) || 0)} className="win-input w-24 text-right" />
                          </td>
                          <td className="text-right">${(it.cantidad * it.costo).toFixed(2)}</td>
                          <td className="text-center">
                            <button className="text-red-600" onClick={() => removePurchaseItem(idx)}>❌</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="win-window p-3 bg-[#d0f0d0] text-black text-center border-2 border-white shadow-sm">
                  <div className="text-[10px] font-black uppercase">TOTAL FACTURA USD</div>
                  <div className="text-xl font-black">${purchaseTotals.toFixed(2)}</div>
                </div>
                <div className="win-window p-3 bg-[#ffffa0] text-black text-center border-2 border-white shadow-sm">
                  <div className="text-[10px] font-black uppercase">EQUIV. BS.</div>
                  <div className="text-xl font-black">Bs {(purchaseTotals * purchaseForm.tasa).toFixed(2)}</div>
                </div>
                <div className="win-window p-3 bg-[#b0d0f0] text-black text-center border-2 border-white shadow-sm">
                  <div className="text-[10px] font-black uppercase">PAGADO USD</div>
                  <div className="text-xl font-black">${(purchaseForm.tipo === 'Contado' ? purchaseTotals : purchaseForm.pagoContadoUsd).toFixed(2)}</div>
                </div>
                <div className="win-window p-3 bg-[#f0a0a0] text-black text-center border-2 border-white shadow-sm">
                  <div className="text-[10px] font-black uppercase">PENDIENTE USD</div>
                  <div className="text-xl font-black">${(purchaseTotals - (purchaseForm.tipo === 'Contado' ? purchaseTotals : purchaseForm.pagoContadoUsd)).toFixed(2)}</div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={onClose}>Cancelar</button>
              <button className="btn btn-primary" onClick={processPurchase}>💾 PROCESAR ENTRADA</button>
            </div>
          </div>
        )}

        {activeModal === 'modalProcesar' && (
          <div className="modal-window" onClick={e => e.stopPropagation()} style={{ width: '450px' }}>
            <div className="modal-titlebar">
              <span>🧮 CALCULADORA DE PAGOS</span>
              <span className="modal-close" onClick={onClose}>✕</span>
            </div>
            <div className="modal-body space-y-4">
              <div className="win-window p-4 bg-gray-200 text-black text-center space-y-2 border-none shadow-inner">
                <div className="text-sm font-bold opacity-70">TOTAL A CANCELAR</div>
                <div className="text-4xl font-black text-black">${getCartTotal().toFixed(2)}</div>
                <div className="text-sm opacity-80 text-black">Equiv. Bs. {(getCartTotal() * config.tasa).toFixed(2)}</div>
              </div>

              <div className="form-group">
                <label>Método de Pago:</label>
                <select 
                  ref={methodRef}
                  value={paymentState.method} 
                  onChange={e => setPaymentState({...paymentState, method: e.target.value})}
                  onKeyDown={e => handleCalculatorKeyDown(e, 'method')}
                  className="win-input h-10 w-full"
                >
                  <option>Efectivo Bs.</option>
                  <option>Efectivo USD</option>
                  <option>Tarjeta/Punto</option>
                  <option>Biopago</option>
                  <option>Pagomovil</option>
                  <option>Zelle</option>
                  <option>Transferencia</option>
                </select>
              </div>

              <div className="flex gap-2 items-end">
                <div className="form-group flex-1">
                  <label>Monto a Liquidar ({(paymentState.method === 'Efectivo USD' || paymentState.method === 'Zelle') ? 'USD' : 'Bs'}):</label>
                  <input 
                    ref={amountRef}
                    type="number" 
                    value={paymentState.amount} 
                    onChange={e => setPaymentState({...paymentState, amount: parseFloat(e.target.value) || 0})}
                    onKeyDown={e => handleCalculatorKeyDown(e, 'amount')}
                    className="win-input h-10 w-full text-right font-bold text-lg text-black"
                  />
                </div>
                <button 
                  className="btn h-10 bg-blue-100 text-[10px] font-black uppercase px-2 hover:bg-blue-200 shadow-sm border border-blue-300"
                  onClick={() => {
                    const total = getCartTotal();
                    const missingUsd = Math.max(0, total - paymentState.totalPaidUsd);
                    const isUsdMethod = paymentState.method === 'Efectivo USD' || paymentState.method === 'Zelle';
                    if (isUsdMethod) {
                      setPaymentState({...paymentState, amount: Math.round(missingUsd * 100) / 100});
                    } else {
                      setPaymentState({...paymentState, amount: Math.round(missingUsd * config.tasa * 100) / 100});
                    }
                  }}
                >
                  Pago Exacto
                </button>
                <button 
                  ref={addBtnRef}
                  className="btn btn-primary h-10 px-4 flex items-center gap-1 shadow-md" 
                  onKeyDown={e => handleCalculatorKeyDown(e, 'add')}
                  onClick={addPayment}
                >
                  <Plus size={14} /> Añadir
                </button>
              </div>

              <div className="table-responsive" style={{ maxHeight: '120px' }}>
                <table className="data-table">
                  <thead>
                    <tr><th>Método</th><th className="text-right">USD</th><th className="text-right">Bs</th><th className="text-center">X</th></tr>
                  </thead>
                  <tbody>
                    {paymentState.payments.map((p, i) => (
                      <tr key={i}>
                        <td>{p.method}</td>
                        <td className="text-right text-black">${p.usd.toFixed(2)}</td>
                        <td className="text-right text-black">Bs {p.bs.toFixed(2)}</td>
                        <td className="text-center">
                          <button onClick={() => {
                            const n = [...paymentState.payments];
                            n.splice(i, 1);
                            setPaymentState({...paymentState, payments: n, totalPaidUsd: n.reduce((acc, it) => acc + it.usd, 0)});
                          }}>❌</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="win-window p-4 bg-gray-200 border-none shadow-md">
                <div className="flex justify-between font-bold text-[10px] text-black/60 border-b border-gray-300 pb-1 uppercase tracking-widest">
                  <span>Total Pagado:</span>
                  <span>${paymentState.totalPaidUsd.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-start mt-2 text-black">
                  <span className="font-black text-sm">{paymentState.totalPaidUsd >= getCartTotal() ? 'VUELTO:' : 'FALTA:'}</span>
                  <div className="text-right flex flex-col items-end">
                    <div className="font-black text-3xl leading-none text-black">${Math.abs(Math.round((paymentState.totalPaidUsd - getCartTotal()) * 100) / 100).toFixed(2)}</div>
                  </div>
                </div>
                {/* Monto en Bs Centrado y mas grande solicitado */}
                <div className="flex justify-center mt-3">
                  <div className="bg-white/50 px-6 py-3 rounded-xl border border-gray-400 shadow-inner flex flex-col items-center">
                    <span className="text-[9px] font-black text-black/50 uppercase tracking-widest mb-1">Equivalencia en Bolívares</span>
                    <span className="font-black text-3xl text-black">
                      Bs {Math.abs(Math.round((paymentState.totalPaidUsd - getCartTotal()) * config.tasa * 100) / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-none pt-2">
                <button className="btn w-full" onClick={onClose}>Cancelar</button>
                {paymentState.totalPaidUsd >= getCartTotal() && (
                  <button className="btn btn-success w-full h-14 text-xl shadow-lg border-2 border-white text-black" onClick={finalizeSale}>
                    ✅ PROCESAR VENTA (F12)
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {lastSale && (
          <div className="modal-window" onClick={e => e.stopPropagation()} style={{ width: '350px' }}>
            <div className="modal-titlebar">
              <span>🎫 TICKET DE VENTA</span>
              <span className="modal-close" onClick={() => setLastSale(null)}>✕</span>
            </div>
            <div className="modal-body p-6 bg-white text-black font-mono text-[10px]">
              <div className="text-center space-y-1 mb-4 border-b pb-2">
                <div className="font-black text-sm">{config.nombreEmpresa}</div>
                <div>RIF: {config.rifEmpresa}</div>
                <div>{config.direccion}</div>
                <div>TEL: {config.telefono}</div>
              </div>
              
              <div className="space-y-1 mb-4">
                <div className="flex justify-between"><span>FACTURA:</span> <span>{lastSale.numero}</span></div>
                <div className="flex justify-between"><span>FECHA:</span> <span>{new Date(lastSale.fecha).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>CLIENTE:</span> <span>{lastSale.cliente}</span></div>
                <div className="flex justify-between"><span>VENDEDOR:</span> <span>{lastSale.vendedor}</span></div>
              </div>

              <div className="border-y py-2 space-y-1">
                {lastSale.items.map((it, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="flex-1">{it.cantidad}x {it.descripcion.slice(0,20)}</span>
                    <span className="ml-2">${(it.precioUsd * it.cantidad).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-1 text-xs font-bold">
                <div className="flex justify-between"><span>SUBTOTAL:</span> <span>${lastSale.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>IVA:</span> <span>${lastSale.iva.toFixed(2)}</span></div>
                <div className="flex justify-between border-t pt-1 font-black text-sm"><span>TOTAL USD:</span> <span>${lastSale.totalUsd.toFixed(2)}</span></div>
                <div className="flex justify-between text-[10px]"><span>TOTAL Bs:</span> <span>Bs {lastSale.totalBs.toFixed(2)}</span></div>
              </div>

              <div className="mt-4 border-t pt-2 text-[8px]">
                <div className="flex justify-between font-bold"><span>METODOS:</span> <span>{lastSale.pago}</span></div>
                <div className="flex justify-between"><span>RECIBIDO:</span> <span>${lastSale.recibidoUsd.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold"><span>VUELTO:</span> <span>${lastSale.cambioUsd.toFixed(2)}</span></div>
              </div>

              <div className="mt-6 text-center text-[9px] italic border-t pt-4">
                *** Gracias por su compra ***
                <br />Conserve su ticket para cambios
              </div>

              <div className="flex gap-2 mt-6 print:hidden">
                <button className="btn flex-1 flex items-center justify-center gap-2" onClick={() => window.print()}>
                  <Printer size={14} /> Imprimir
                </button>
                <button className="btn flex-1 flex items-center justify-center gap-2">
                  <Download size={14} /> PDF
                </button>
              </div>
              <button className="btn w-full mt-2 print:hidden" onClick={() => setLastSale(null)}>Cerrar</button>
            </div>
          </div>
        )}

      </div>
    </>
  );
}