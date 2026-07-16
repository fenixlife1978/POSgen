'use client';

import React, { useState, useEffect } from 'react';
import { Product, Client, Sale, Account, CartItem, Presupuesto, KitComponent } from '@/types/pos';

interface ModalsProps {
  activeModal: string | null;
  onClose: () => void;
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
  notify: any;
  selectedRow: number;
}

export function Modals({ 
  activeModal, onClose, products, setProducts, clients, setClients, 
  sales, setSales, accounts, setAccounts, presupuestos,
  cart, setCart, config, notify, selectedRow 
}: ModalsProps) {
  
  const [marcas, setMarcas] = useState(['Universal', 'Toyota', 'Ford', 'Mobil', 'Castrol', 'Fram', 'NGK', 'Brembo', 'Gates', 'MAC', 'Rain-X', 'Prestone', 'Valvoline']);
  const [unidades, setUnidades] = useState(['Unidad', 'Kilo', 'Litro', 'Caja', 'Galón', 'Kit', 'Servicio']);
  const [categorias, setCategorias] = useState(['Repuesto', 'Lubricante', 'Servicio', 'Accesorio']);
  const [departamentos, setDepartamentos] = useState(['General', 'Frenos', 'Motor', 'Suspensión', 'Eléctrico', 'Mantenimiento']);

  const [productForm, setProductForm] = useState<Partial<Product>>({
    codigo: '',
    barcode: '',
    nombre: '',
    descripcion: '',
    referencia: '',
    marca: 'Universal',
    unidad: 'Unidad',
    moneda: 'base',
    departamento: 'General',
    categoria: 'Repuesto',
    grupo: '',
    subgrupo: '',
    ubicacion: '',
    stockMin: 5,
    stock: 0,
    costoAnterior: 0,
    costoActual: 0,
    costoPromedio: 0,
    utilidadPorcentaje: 0,
    precio1: 0,
    precio2: 0,
    precio3: 0,
    precio4: 0,
    ivaAlicuota: 16,
    isKit: false,
    stockPropio: true,
    activo: true,
    manejaSeriales: false,
    manejaLotes: false,
    manejaTallasColores: false,
    manejaPeso: false,
    permiteDescuento: true,
    kitComponents: [],
    capacidadContenido: 0
  });

  const [purchaseForm, setPurchaseForm] = useState({
    proveedor: '',
    nroFactura: '',
    tasa: config.tasa || 1,
    tipo: 'Contado',
    diasCredito: 0,
    pagoContadoUsd: 0,
    pagoContadoBs: 0,
    items: [] as any[]
  });

  const [itemCompra, setItemCompra] = useState({
    productIdx: -1,
    cantidad: 1,
    costo: 0
  });

  useEffect(() => {
    if (activeModal === 'modalEntrada') {
      setPurchaseForm(prev => ({ ...prev, tasa: config.tasa }));
    }
  }, [activeModal, config.tasa]);

  const handleProductPriceCalc = (field: string, value: number) => {
    const cost = field === 'costoPromedio' ? value : (productForm.costoPromedio || 0);
    const tasa = config.tasa || 1;
    let newForm = { ...productForm };

    if (field === 'costoPromedio') {
      newForm.costoPromedio = value;
      const u = (newForm.utilidadPorcentaje || 0) / 100;
      newForm.precio1 = u >= 1 ? cost : cost / (1 - u);
    } else if (field === 'utilidadPorcentaje') {
      const u = value / 100;
      // Formula Markup sobre Venta: Precio = Costo / (1 - Utilidad%)
      const pUsd = u >= 1 ? cost : cost / (1 - u);
      newForm.utilidadPorcentaje = value;
      newForm.precio1 = pUsd;
    } else if (field === 'precio1') {
      const pUsd = value;
      // Utilidad% = (1 - Costo/Precio) * 100
      const u = pUsd > 0 ? (1 - (cost / pUsd)) * 100 : 0;
      newForm.precio1 = pUsd;
      newForm.utilidadPorcentaje = u;
    } else if (field === 'precioBs') {
      const pUsd = value / tasa;
      const u = pUsd > 0 ? (1 - (cost / pUsd)) * 100 : 0;
      newForm.precio1 = pUsd;
      newForm.utilidadPorcentaje = u;
    }

    setProductForm(newForm);
  };

  const handleMasterNav = (e: React.KeyboardEvent) => {
    if (['Enter', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
      const selectors = 'input:not([disabled]), select:not([disabled]), textarea:not([disabled])';
      const fields = Array.from(e.currentTarget.querySelectorAll(selectors)) as HTMLElement[];
      const active = document.activeElement as HTMLElement;
      const idx = fields.indexOf(active);

      if (idx === -1) return;

      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIdx = (idx + 1) % fields.length;
        fields[nextIdx].focus();
        if ('select' in fields[nextIdx]) (fields[nextIdx] as any).select?.();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIdx = (idx - 1 + fields.length) % fields.length;
        fields[prevIdx].focus();
        if ('select' in fields[prevIdx]) (fields[prevIdx] as any).select?.();
      }
    }
  };

  const handleAddOption = (list: string) => {
    const val = prompt(`Agregar nueva ${list}:`);
    if (!val) return;
    if (list === 'Marca') setMarcas([...marcas, val]);
    if (list === 'Unidad') setUnidades([...unidades, val]);
    if (list === 'Categoria') setCategorias([...categorias, val]);
    if (list === 'Departamento') setDepartamentos([...departamentos, val]);
  };

  const saveProduct = () => {
    if (!productForm.codigo || !productForm.nombre) {
      notify('Código y Nombre son obligatorios', 'error');
      return;
    }
    setProducts([...products, productForm as Product]);
    notify('✅ Producto registrado exitosamente');
    onClose();
  };

  const handlePagoMixto = (val: number, moneda: 'USD' | 'BS') => {
    const tasa = purchaseForm.tasa;
    if (moneda === 'USD') {
      setPurchaseForm({ ...purchaseForm, pagoContadoUsd: val, pagoContadoBs: val * tasa });
    } else {
      setPurchaseForm({ ...purchaseForm, pagoContadoBs: val, pagoContadoUsd: val / tasa });
    }
  };

  const addItemToPurchase = () => {
    if (itemCompra.productIdx === -1) {
      notify('Seleccione un producto', 'error');
      return;
    }
    const prod = products[itemCompra.productIdx];
    const newItem = {
      ...prod,
      productIdx: itemCompra.productIdx,
      cantidad: itemCompra.cantidad,
      costo: itemCompra.costo
    };
    setPurchaseForm({
      ...purchaseForm,
      items: [...purchaseForm.items, newItem]
    });
    setItemCompra({ productIdx: -1, cantidad: 1, costo: 0 });
  };

  const getPurchaseTotals = () => {
    const totalFactura = purchaseForm.items.reduce((acc, item) => acc + (item.cantidad * item.costo), 0);
    const equivBs = totalFactura * purchaseForm.tasa;
    let totalPagado = 0;
    
    if (purchaseForm.tipo === 'Contado') totalPagado = totalFactura;
    else if (purchaseForm.tipo === 'Credito') totalPagado = 0;
    else totalPagado = purchaseForm.pagoContadoUsd;

    return {
      totalFactura,
      equivBs,
      totalPagado,
      totalPendiente: totalFactura - totalPagado
    };
  };

  const purchaseTotals = getPurchaseTotals();

  if (!activeModal) return null;

  return (
    <div className={`modal-overlay ${activeModal ? 'active' : ''}`} onClick={onClose}>
      <div className={`modal-window ${['modalProducto', 'modalEntrada'].includes(activeModal) ? 'xlarge' : 'large'}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-titlebar">
          <span>
            {activeModal === 'modalProducto' ? '📦 Ficha Maestra de Producto' : 
             activeModal === 'modalEntrada' ? '📥 Entrada por Compra (Procesar Factura)' :
             activeModal?.replace('modal', '')}
          </span>
          <span className="modal-close" onClick={onClose}>✕</span>
        </div>
        
        <div className="modal-body" onKeyDown={activeModal === 'modalProducto' ? handleMasterNav : undefined}>
          
          {activeModal === 'modalProducto' && (
            <div className="space-y-6">
              <div className="win-window p-4 space-y-4">
                <h4 className="text-blue-900 font-bold border-b border-gray-400 pb-1 mb-2">1. Identificación y Datos Básicos</h4>
                <div className="form-row">
                  <div className="form-group"><label>Código:</label><input type="text" value={productForm.codigo || ''} onChange={e => setProductForm({...productForm, codigo: e.target.value})} /></div>
                  <div className="form-group"><label>Código Barras (Scanner):</label><input type="text" value={productForm.barcode || ''} onChange={e => setProductForm({...productForm, barcode: e.target.value})} /></div>
                  <div className="form-group"><label>Referencia / OEM:</label><input type="text" value={productForm.referencia || ''} onChange={e => setProductForm({...productForm, referencia: e.target.value})} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group flex-[2]"><label>Nombre del Producto:</label><input type="text" value={productForm.nombre || ''} onChange={e => setProductForm({...productForm, nombre: e.target.value})} /></div>
                  <div className="form-group flex-[3]"><label>Descripción Detallada:</label><input type="text" value={productForm.descripcion || ''} onChange={e => setProductForm({...productForm, descripcion: e.target.value})} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="flex justify-between">Marca: <span className="cursor-pointer text-blue-700 font-bold" onClick={() => handleAddOption('Marca')}>[+]</span></label>
                    <select value={productForm.marca} onChange={e => setProductForm({...productForm, marca: e.target.value})}>
                      {marcas.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="flex justify-between">Unidad: <span className="cursor-pointer text-blue-700 font-bold" onClick={() => handleAddOption('Unidad')}>[+]</span></label>
                    <select value={productForm.unidad} onChange={e => setProductForm({...productForm, unidad: e.target.value})}>
                      {unidades.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>Moneda:</label>
                    <select value={productForm.moneda} onChange={e => setProductForm({...productForm, moneda: e.target.value as any})}>
                      <option value="base">Bolívares (Base)</option>
                      <option value="alterna">Dólares (Alterna)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="win-window p-4">
                <h4 className="text-blue-900 font-bold border-b border-gray-400 pb-1 mb-2">2. Clasificación y Existencias</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label className="flex justify-between">Departamento: <span className="cursor-pointer text-blue-700 font-bold" onClick={() => handleAddOption('Departamento')}>[+]</span></label>
                    <select value={productForm.departamento} onChange={e => setProductForm({...productForm, departamento: e.target.value})}>
                      {departamentos.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="flex justify-between">Categoría: <span className="cursor-pointer text-blue-700 font-bold" onClick={() => handleAddOption('Categoria')}>[+]</span></label>
                    <select value={productForm.categoria} onChange={e => setProductForm({...productForm, categoria: e.target.value})}>
                      {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>Grupo:</label><input type="text" value={productForm.grupo || ''} onChange={e => setProductForm({...productForm, grupo: e.target.value})} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Ubicación Física:</label><input type="text" value={productForm.ubicacion || ''} onChange={e => setProductForm({...productForm, ubicacion: e.target.value})} placeholder="Estante / Almacén" /></div>
                  <div className="form-group"><label>Stock Mínimo:</label><input type="number" value={productForm.stockMin || 0} onChange={e => setProductForm({...productForm, stockMin: parseInt(e.target.value) || 0})} /></div>
                  <div className="form-group"><label>Stock Inicial:</label><input type="number" value={productForm.stock || 0} onChange={e => setProductForm({...productForm, stock: parseInt(e.target.value) || 0})} /></div>
                </div>
              </div>

              <div className="win-window p-4 bg-gray-100">
                <h4 className="text-blue-900 font-bold border-b border-gray-400 pb-1 mb-2">3. Costos y Precios (Markup sobre Venta)</h4>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="form-group"><label>Costo Anterior:</label><input type="number" disabled value={productForm.costoAnterior || 0} className="bg-gray-200" /></div>
                  <div className="form-group"><label>Costo Actual:</label><input type="number" value={productForm.costoActual || 0} onChange={e => setProductForm({...productForm, costoActual: parseFloat(e.target.value) || 0})} /></div>
                  <div className="form-group"><label>Costo Promedio (CPP):</label><input type="number" value={productForm.costoPromedio || 0} onChange={e => handleProductPriceCalc('costoPromedio', parseFloat(e.target.value) || 0)} className="font-bold border-blue-500" /></div>
                </div>

                <div className="p-4 border-2 border-blue-400 bg-white rounded shadow-inner">
                  <div className="form-row items-end">
                    <div className="form-group">
                      <label className="text-blue-800 font-bold">Ganancia (% Markup):</label>
                      <input type="number" value={productForm.utilidadPorcentaje || 0} onChange={e => handleProductPriceCalc('utilidadPorcentaje', parseFloat(e.target.value) || 0)} className="text-lg font-black" />
                    </div>
                    <div className="form-group">
                      <label className="text-green-800 font-bold">Precio Detal USD:</label>
                      <input type="number" value={productForm.precio1 || 0} onChange={e => handleProductPriceCalc('precio1', parseFloat(e.target.value) || 0)} className="text-xl font-black text-green-700" />
                    </div>
                    <div className="form-group">
                      <label className="text-red-800 font-bold">Precio Detal Bs (Tasa {config.tasa}):</label>
                      <input type="number" value={((productForm.precio1 || 0) * config.tasa)} onChange={e => handleProductPriceCalc('precioBs', parseFloat(e.target.value) || 0)} className="text-xl font-black text-red-700" />
                    </div>
                  </div>
                </div>

                <div className="form-row mt-4">
                  <div className="form-group"><label>Precio 2 (Mayor):</label><input type="number" value={productForm.precio2 || 0} onChange={e => setProductForm({...productForm, precio2: parseFloat(e.target.value) || 0})} /></div>
                  <div className="form-group"><label>Precio 3 (Corp):</label><input type="number" value={productForm.precio3 || 0} onChange={e => setProductForm({...productForm, precio3: parseFloat(e.target.value) || 0})} /></div>
                  <div className="form-group"><label>Precio 4 (Promo):</label><input type="number" value={productForm.precio4 || 0} onChange={e => setProductForm({...productForm, precio4: parseFloat(e.target.value) || 0})} /></div>
                  <div className="form-group"><label>Alícuota IVA:</label>
                    <select value={productForm.ivaAlicuota} onChange={e => setProductForm({...productForm, ivaAlicuota: parseInt(e.target.value)})}>
                      <option value="16">General (16%)</option>
                      <option value="8">Reducida (8%)</option>
                      <option value="0">Exento (0%)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="win-window p-4">
                <h4 className="text-blue-900 font-bold border-b border-gray-400 pb-1 mb-2">4. Kits, Combos y Controles</h4>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="checkbox-label"><input type="checkbox" checked={productForm.isKit} onChange={e => setProductForm({...productForm, isKit: e.target.checked})} /> Es un KIT / COMBO</label>
                    <label className="checkbox-label"><input type="checkbox" checked={productForm.stockPropio} onChange={e => setProductForm({...productForm, stockPropio: e.target.checked})} /> Posee Stock Propio (vs Virtual)</label>
                    <label className="checkbox-label"><input type="checkbox" checked={productForm.manejaSeriales} onChange={e => setProductForm({...productForm, manejaSeriales: e.target.checked})} /> Maneja Seriales</label>
                    <label className="checkbox-label"><input type="checkbox" checked={productForm.manejaLotes} onChange={e => setProductForm({...productForm, manejaLotes: e.target.checked})} /> Maneja Lotes / Vencimiento</label>
                    <div className="form-group mt-2">
                      <label>Contenido por Empaque:</label>
                      <input type="number" value={productForm.capacidadContenido || 0} onChange={e => setProductForm({...productForm, capacidadContenido: parseFloat(e.target.value) || 0})} placeholder="Ej: 24 unidades x caja" />
                    </div>
                  </div>
                  {productForm.isKit && (
                    <div className="border p-2 bg-gray-50 text-xs">
                      <strong>Componentes del Kit:</strong>
                      <div className="mt-1 max-h-24 overflow-auto border bg-white">
                        {productForm.kitComponents?.length === 0 ? <p className="p-2 text-gray-400 italic">No hay componentes seleccionados</p> : 
                          productForm.kitComponents?.map(c => <div key={c.codigo} className="flex justify-between p-1 border-b"><span>{c.codigo}</span><span>x{c.cantidad}</span></div>)
                        }
                      </div>
                      <button className="btn mt-2 w-full text-[10px]" onClick={() => notify('Búsqueda de componentes no implementada aún', 'warning')}>🔍 Buscar Componentes</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeModal === 'modalEntrada' && (
            <div className="space-y-6">
              <div className="win-window p-4">
                <div className="flex justify-between items-center border-b border-gray-400 pb-2 mb-4">
                  <h4 className="text-blue-900 font-bold">📦 Datos de Factura de Compra</h4>
                  <button className="btn btn-primary text-xs" onClick={() => notify('Abre modal producto sin cerrar compra', 'info')}>+ Nuevo Producto en Factura</button>
                </div>
                <div className="form-row">
                  <div className="form-group flex-[2]"><label>Proveedor:</label><input type="text" value={purchaseForm.proveedor} onChange={e => setPurchaseForm({...purchaseForm, proveedor: e.target.value})} placeholder="Nombre o RIF Proveedor" /></div>
                  <div className="form-group"><label>N° Factura:</label><input type="text" value={purchaseForm.nroFactura} onChange={e => setPurchaseForm({...purchaseForm, nroFactura: e.target.value})} /></div>
                  <div className="form-group"><label>Tasa BCV (Bs):</label><input type="number" value={purchaseForm.tasa} onChange={e => setPurchaseForm({...purchaseForm, tasa: parseFloat(e.target.value) || 0})} className="font-bold text-red-700" /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Tipo Compra:</label>
                    <select value={purchaseForm.tipo} onChange={e => setPurchaseForm({...purchaseForm, tipo: e.target.value as any})}>
                      <option>Contado</option>
                      <option>Credito</option>
                      <option>Mixto</option>
                    </select>
                  </div>
                  {(purchaseForm.tipo === 'Credito' || purchaseForm.tipo === 'Mixto') && (
                    <div className="form-group animate-in fade-in"><label>Días Crédito:</label><input type="number" value={purchaseForm.diasCredito} onChange={e => setPurchaseForm({...purchaseForm, diasCredito: parseInt(e.target.value) || 0})} /></div>
                  )}
                  {purchaseForm.tipo === 'Mixto' && (
                    <>
                      <div className="form-group animate-in fade-in"><label>Pago Contado (USD):</label><input type="number" value={purchaseForm.pagoContadoUsd} onChange={e => handlePagoMixto(parseFloat(e.target.value) || 0, 'USD')} /></div>
                      <div className="form-group animate-in fade-in"><label>Pago Contado (BS):</label><input type="number" value={purchaseForm.pagoContadoBs} onChange={e => handlePagoMixto(parseFloat(e.target.value) || 0, 'BS')} /></div>
                    </>
                  )}
                </div>
              </div>

              <div className="win-window p-4 bg-blue-50">
                <h4 className="text-blue-900 font-bold border-b border-gray-400 pb-1 mb-2">📥 Selección de Items</h4>
                <div className="form-row items-end">
                  <div className="form-group flex-[3]">
                    <label>Buscar Producto:</label>
                    <select value={itemCompra.productIdx} onChange={e => setItemCompra({...itemCompra, productIdx: parseInt(e.target.value)})}>
                      <option value="-1">Seleccione...</option>
                      {products.map((p, i) => <option key={i} value={i}>{p.codigo} - {p.nombre}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>Cantidad:</label><input type="number" value={itemCompra.cantidad} onChange={e => setItemCompra({...itemCompra, cantidad: parseInt(e.target.value) || 0})} /></div>
                  <div className="form-group"><label>Costo Actual (USD):</label><input type="number" value={itemCompra.costo} onChange={e => setItemCompra({...itemCompra, costo: parseFloat(e.target.value) || 0})} /></div>
                  <div className="form-group"><button className="btn btn-success w-full" onClick={addItemToPurchase}>+ Agregar</button></div>
                </div>

                <div className="table-container mt-4" style={{ height: '150px' }}>
                  <table className="product-table">
                    <thead><tr><th>Código</th><th>Descripción</th><th>Cant</th><th>Costo</th><th>Total</th></tr></thead>
                    <tbody>
                      {purchaseForm.items.map((it, idx) => (
                        <tr key={idx}><td>{it.codigo}</td><td>{it.nombre}</td><td>{it.cantidad}</td><td>${it.costo.toFixed(2)}</td><td>${(it.cantidad * it.costo).toFixed(2)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="win-window p-4 bg-black text-white flex justify-between items-center rounded-none border-4 border-gray-500">
                <div className="text-center"><p className="text-[10px] text-gray-400">TOTAL FACTURA USD</p><div className="text-2xl font-black text-yellow-400">${purchaseTotals.totalFactura.toFixed(2)}</div></div>
                <div className="text-center"><p className="text-[10px] text-gray-400">EQUIV. BS ({purchaseForm.tasa})</p><div className="text-2xl font-black text-blue-400">Bs. {purchaseTotals.equivBs.toLocaleString()}</div></div>
                <div className="text-center"><p className="text-[10px] text-gray-400">TOTAL PAGADO USD</p><div className="text-2xl font-black text-green-400">${purchaseTotals.totalPagado.toFixed(2)}</div></div>
                <div className="text-center"><p className="text-[10px] text-gray-400">PENDIENTE USD</p><div className="text-2xl font-black text-red-500">${purchaseTotals.totalPendiente.toFixed(2)}</div></div>
              </div>
            </div>
          )}

          {activeModal === 'modalProcesar' && (
            <div className="space-y-4">
              <div id="procesarSummary" className="bg-gray-100 border border-gray-400 p-4">
                <div className="flex justify-between font-bold text-lg border-b pb-2 mb-2">
                  <span>Total a Pagar:</span>
                  <span className="text-blue-900">${cart.reduce((s, i) => s + (i.precioUsd * i.cantidad * (1 + i.iva / 100)), 0).toFixed(2)}</span>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn" onClick={onClose}>Cancelar</button>
                <button className="btn btn-success" onClick={() => notify('Venta procesada')}>✅ Confirmar</button>
              </div>
            </div>
          )}

          {activeModal === 'modalCantidad' && (
            <div className="form-group">
              <label>Cantidad:</label>
              <input type="number" id="qtyInput" defaultValue="1" min="1" step="1" style={{ fontSize: '24px', textAlign: 'center' }} />
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancelar</button>
          {activeModal === 'modalProducto' && (
            <button className="btn btn-success" onClick={saveProduct}>💾 Guardar Ficha Maestra</button>
          )}
          {activeModal === 'modalEntrada' && (
            <button className="btn btn-success" onClick={() => { notify('Compra registrada con éxito'); onClose(); }}>💾 Procesar Factura de Compra</button>
          )}
        </div>
      </div>
    </div>
  );
}
