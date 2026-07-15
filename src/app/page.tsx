'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Product, Client, CartItem, Sale, Presupuesto } from '@/types/pos';
import { format } from 'date-fns';

// --- NUEVOS TIPOS ---
interface Purchase {
  id: string;
  numero: string;
  fecha: string;
  proveedor: string;
  items: any[];
  totalUsd: number;
  condicion: 'Contado' | 'Crédito';
}

interface Account {
  id: string;
  entidad: string; // Cliente o Proveedor
  montoTotal: number;
  montoPagado: number;
  fechaEmision: string;
  estado: 'Pendiente' | 'Parcial' | 'Pagada';
  referencia: string;
  tipo: 'CXC' | 'CXP';
}

const INITIAL_PRODUCTS: Product[] = [
  { codigo: 'OST-600', descripcion: 'OSTEOFLEX 600MG X 60CAPS (AI)', categoria: 'Repuesto', marca: 'AI', modelo: 'Universal', precioUsd: 11.49, costoUsd: 7.50, iva: 16, stock: 45, stockMin: 10, unidad: 'Caja', ubicacion: 'A-1', activo: true, margen: 34.7, precioBs: 0, departamento: 'General', isKit: false, hasOwnStock: true, aplicaIva: true },
  { codigo: 'SIT-500', descripcion: 'SITAGLISMET 50MG/500MG X 30COMP (LETI)', categoria: 'Repuesto', marca: 'LETI', modelo: 'Universal', precioUsd: 12.64, costoUsd: 8.20, iva: 16, stock: 30, stockMin: 8, unidad: 'Caja', ubicacion: 'A-2', activo: true, margen: 35.1, precioBs: 0, departamento: 'General', isKit: false, hasOwnStock: true, aplicaIva: true },
];

export default function POSPage() {
  const [activeModule, setActiveModule] = useState('pos');
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [cuentas, setCuentas] = useState<Account[]>([]);
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [posCart, setPosCart] = useState<CartItem[]>([]);
  const [selectedRow, setSelectedRow] = useState(-1);
  const [dateTime, setDateTime] = useState('');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  const [posRif, setPosRif] = useState('');
  const [posCliente, setPosCliente] = useState('');
  const [posBusqueda, setPosBusqueda] = useState('');
  const [posCredito, setPosCredito] = useState(false);
  const [searchDropdown, setSearchDropdown] = useState<Product[]>([]);
  
  const [config, setConfig] = useState({
    tasa: 724.00,
    igtf: 3,
    iva: 16,
    rifEmpresa: 'J-12345678-9',
    nombreEmpresa: 'AutoParts C.A.',
    direccion: 'Av. Principal, Local 5',
    telefono: '0212-5551234',
    vendedor: 'MARIA VERASTEGUI',
    vendedores: ['MARIA VERASTEGUI', 'JUAN PEREZ', 'CARLOS LOPEZ'],
    nextInvoice: 1,
    unidades: ['Unidad', 'Caja', 'Litro', 'Galón', 'Kit'],
    marcas: ['AI', 'LETI', 'NOW', 'GV', 'CALOX', 'Mobil', 'Castrol', 'Fram'],
    modelos: ['Universal', 'Sedan', 'SUV', 'Camión'],
    categorias: ['Repuesto', 'Lubricante', 'Servicio', 'Accesorio'],
    departamentos: ['Almacén Central', 'Piso de Venta', 'Taller']
  });

  const [paymentState, setPaymentState] = useState({ receivedUsd: 0, receivedBs: 0, selectedMethod: 'efectivo_usd', reference: '', changeUsd: 0, changeBs: 0 });
  const [tempProduct, setTempProduct] = useState<Partial<Product>>({ aplicaIva: true, hasOwnStock: true, margen: 30, costoUsd: 0 });
  const [tempClient, setTempClient] = useState<Partial<Client>>({});
  const [editId, setEditId] = useState(-1);

  // --- LOGICA DE RECALCULO TRIDIRECCIONAL (MARKUP SOBRE VENTA) ---
  const handleProductPriceCalc = (field: string, val: number) => {
    const cost = tempProduct.costoUsd || 0;
    const tasa = config.tasa;
    let newTemp = { ...tempProduct };

    if (field === 'costo') {
      newTemp.costoUsd = val;
      newTemp.precioUsd = val / (1 - (newTemp.margen || 0) / 100);
      newTemp.precioBs = newTemp.precioUsd * tasa;
    } else if (field === 'margen') {
      newTemp.margen = val;
      newTemp.precioUsd = cost / (1 - val / 100);
      newTemp.precioBs = newTemp.precioUsd * tasa;
    } else if (field === 'precioUsd') {
      newTemp.precioUsd = val;
      newTemp.margen = ((val - cost) / val) * 100;
      newTemp.precioBs = val * tasa;
    } else if (field === 'precioBs') {
      newTemp.precioBs = val;
      newTemp.precioUsd = val / tasa;
      newTemp.margen = ((newTemp.precioUsd - cost) / newTemp.precioUsd) * 100;
    }
    setTempProduct(newTemp);
  };

  useEffect(() => {
    const saved = localStorage.getItem('autoparts_pos_db');
    if (saved) {
      const db = JSON.parse(saved);
      setProducts(db.products || INITIAL_PRODUCTS);
      setClients(db.clients || []);
      setSales(db.sales || []);
      setPurchases(db.purchases || []);
      setCuentas(db.cuentas || []);
      setPresupuestos(db.presupuestos || []);
      if (db.config) setConfig(db.config);
    } else {
      setProducts(INITIAL_PRODUCTS);
    }
    const interval = setInterval(() => setDateTime(format(new Date(), 'dd/MM/yyyy HH:mm:ss')), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const db = { products, clients, sales, purchases, cuentas, presupuestos, config };
    localStorage.setItem('autoparts_pos_db', JSON.stringify(db));
  }, [products, clients, sales, purchases, cuentas, presupuestos, config]);

  const totals = useMemo(() => {
    let subtotal = 0, totalIva = 0, totalUnits = 0;
    posCart.forEach(item => {
      const s = item.precioUsd * item.cantidad;
      subtotal += s;
      totalIva += s * (item.iva / 100);
      totalUnits += item.cantidad;
    });
    const totalUsd = subtotal + totalIva;
    return { subtotal, totalIva, totalUsd, totalBs: totalUsd * config.tasa, igtfAmount: totalUsd * (config.igtf / 100), totalUnits };
  }, [posCart, config.tasa]);

  const searchProducts = (query: string) => {
    setPosBusqueda(query);
    if (!query) { setSearchDropdown([]); return; }
    const q = query.toLowerCase();
    const results = products.filter(p => p.activo && (p.codigo.toLowerCase().includes(q) || p.descripcion.toLowerCase().includes(q))).slice(0, 10);
    setSearchDropdown(results);
  };

  const addToCart = (product: Product) => {
    const index = products.indexOf(product);
    setPosCart(prev => {
      const existing = prev.find(item => item.productIndex === index);
      if (existing) return prev.map(item => item.productIndex === index ? { ...item, cantidad: item.cantidad + 1 } : item);
      return [...prev, { productIndex: index, codigo: product.codigo, descripcion: product.descripcion, precioUsd: product.precioUsd, iva: product.iva, cantidad: 1, categoria: product.categoria }];
    });
    setPosBusqueda(''); setSearchDropdown([]);
  };

  const confirmSale = () => {
    const invoiceNum = 'F-' + String(config.nextInvoice).padStart(4, '0');
    const newSale: Sale = {
      numero: invoiceNum,
      fecha: new Date().toISOString(),
      cliente: posCliente || 'Consumidor Final',
      rif: posRif || 'V-00000000-0',
      vendedor: config.vendedor,
      items: [...posCart],
      subtotal: totals.subtotal,
      iva: totals.totalIva,
      totalUsd: totals.totalUsd,
      totalBs: totals.totalBs,
      pago: paymentState.selectedMethod,
      estado: 'Completada',
      credito: posCredito
    };

    if (posCredito) {
      setCuentas(prev => [...prev, { id: Math.random().toString(), entidad: newSale.cliente, montoTotal: newSale.totalUsd, montoPagado: 0, fechaEmision: newSale.fecha, estado: 'Pendiente', referencia: invoiceNum, tipo: 'CXC' }]);
    }

    setSales(prev => [...prev, newSale]);
    setProducts(prev => prev.map((p, i) => {
      const item = posCart.find(it => it.productIndex === i);
      return item ? { ...p, stock: p.stock - item.cantidad } : p;
    }));
    setConfig(prev => ({ ...prev, nextInvoice: prev.nextInvoice + 1 }));
    setPosCart([]); setActiveModal(null);
    alert('Venta realizada con éxito');
  };

  // --- LOGICA DE COMPRA Y CPP ---
  const handlePurchaseEntry = (prov: string, items: any[], cond: 'Contado' | 'Crédito') => {
    const purchaseId = 'C-' + Math.random().toString(36).substr(2, 5).toUpperCase();
    let totalPurchase = 0;

    const updatedProducts = products.map((p, i) => {
      const entry = items.find(it => it.prodIdx === i);
      if (entry) {
        // Formula CPP: (StockAnt * CostoAnt + CantNueva * CostoNuevo) / (StockAnt + CantNueva)
        const totalOld = p.stock * p.costoUsd;
        const totalNew = entry.qty * entry.cost;
        const newStock = p.stock + entry.qty;
        const newCPP = (totalOld + totalNew) / newStock;
        totalPurchase += totalNew;
        return { ...p, stock: newStock, costoUsd: newCPP };
      }
      return p;
    });

    if (cond === 'Crédito') {
      setCuentas(prev => [...prev, { id: Math.random().toString(), entidad: prov, montoTotal: totalPurchase, montoPagado: 0, fechaEmision: new Date().toISOString(), estado: 'Pendiente', referencia: purchaseId, tipo: 'CXP' }]);
    }

    setProducts(updatedProducts);
    setPurchases(prev => [...prev, { id: purchaseId, numero: purchaseId, fecha: new Date().toISOString(), proveedor: prov, items, totalUsd: totalPurchase, condicion: cond }]);
    alert('Entrada de inventario registrada con CPP actualizado');
  };

  return (
    <div className="flex flex-col h-screen bg-[#c0c0c0] select-none text-[13px] overflow-hidden">
      {/* Dollar Bar */}
      <div className="bg-[#c0c0c0] border-bottom-[3px] border-[#ff0000] p-1 px-2 font-bold flex items-center gap-4 text-[12px]">
        <span className="text-[#000080]">💲 DOLAR: {config.tasa.toFixed(2)}</span>
        <span className="ml-auto text-[#555]">AutoParts POS v2.0 | Sistema Integral de Ventas y Almacén</span>
      </div>

      {/* Navigation */}
      <div className="flex bg-[#c0c0c0] border-b-2 border-[#808080] px-1">
        {['pos', 'dashboard', 'productos', 'clientes', 'ventas', 'compras', 'cuentas', 'inventario', 'config'].map(m => (
          <div key={m} className={`nav-tab uppercase ${activeModule === m ? 'active' : ''}`} onClick={() => setActiveModule(m)}>
            {m === 'pos' ? '️ POS Venta' : m === 'cxc' ? 'CXC' : m}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-hidden relative">
        {activeModule === 'pos' && (
          <div className="h-full flex flex-col p-1">
             <div className="bg-[#dce8f0] border border-[#808080] p-2 mb-1 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <label className="font-bold w-12 text-right">Rif:</label>
                  <input type="text" className="win-input w-40" value={posRif} onChange={e => setPosRif(e.target.value)} />
                  <label className="flex items-center gap-1 font-bold ml-4"><input type="checkbox" checked={posCredito} onChange={e => setPosCredito(e.target.checked)} /> Crédito</label>
                  <label className="font-bold ml-auto">Vendedor:</label>
                  <span className="bg-[#e8e8e8] border border-[#808080] px-2 py-1 font-bold">{config.vendedor}</span>
                  <div className="ml-4 text-[#008000] font-bold">{dateTime}</div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="font-bold w-12 text-right">Cliente:</label>
                  <input type="text" className="win-input flex-1" value={posCliente} onChange={e => setPosCliente(e.target.value)} />
                </div>
             </div>

             <div className="bg-[#dce8f0] border border-[#808080] p-2 mb-1 relative">
                <div className="flex items-center gap-2">
                  <label className="font-bold">Búsqueda:</label>
                  <input type="text" className="win-input w-80" placeholder="Código o descripción..." value={posBusqueda} onChange={e => searchProducts(e.target.value)} />
                  <label className="font-bold ml-4">Equivalente:</label>
                  <input type="text" readOnly className="win-input w-44 bg-[#e8e8e8] font-bold" value={`Bs. ${totals.totalBs.toFixed(2)}`} />
                </div>
                {searchDropdown.length > 0 && (
                  <div className="search-dropdown active left-20 top-full">
                    {searchDropdown.map(p => (
                      <div key={p.codigo} className="search-dropdown-item" onClick={() => addToCart(p)}>
                        <strong>{p.codigo}</strong> - {p.descripcion} | <span className="text-[#000080] font-bold">${p.precioUsd.toFixed(2)}</span> | Stock: {p.stock}
                      </div>
                    ))}
                  </div>
                )}
             </div>

             <div className="flex-1 flex min-h-0 gap-1">
                <div className="flex-1 bg-white border-2 border-[#808080] overflow-auto">
                   <table className="product-table">
                     <thead className="sticky top-0 z-10">
                       <tr><th className="w-10">#</th><th>Descripción</th><th className="w-24">USD</th><th className="w-16">Cant</th><th className="w-28">Subtotal</th><th className="w-32">Total+IVA</th></tr>
                     </thead>
                     <tbody>
                       {posCart.map((item, i) => (
                         <tr key={i} className={selectedRow === i ? 'selected' : ''} onClick={() => setSelectedRow(i)}>
                           <td>{i + 1}</td><td>{item.codigo} - {item.descripcion}</td><td className="text-right">${item.precioUsd.toFixed(2)}</td><td className="text-center">{item.cantidad}</td><td className="text-right">${(item.precioUsd * item.cantidad).toFixed(2)}</td><td className="text-right font-bold">${(item.precioUsd * item.cantidad * (1 + item.iva/100)).toFixed(2)}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                </div>
                <div className="w-32 bg-[#7eb8d8] p-1 flex flex-col gap-1">
                   <button className="sidebar-btn" onClick={() => setPosCart([])}>Limpiar</button>
                   <button className="sidebar-btn" onClick={() => { if (selectedRow >= 0) setPosCart(prev => prev.filter((_, i) => i !== selectedRow)) }}>Eliminar</button>
                   <button className="sidebar-btn btn-procesar mt-auto" onClick={() => setActiveModal('modalProcesar')}>Procesar F12</button>
                </div>
             </div>

             <div className="bg-[#c0c0c0] border-t-2 border-white p-1 flex gap-2">
                <div className="total-box stotal flex-1"><span className="total-label">Subtotal:</span><div className="total-value">{totals.subtotal.toFixed(2)}</div></div>
                <div className="total-box iva flex-1"><span className="total-label">IVA:</span><div className="total-value">{totals.totalIva.toFixed(2)}</div></div>
                <div className="total-box total-bs flex-[2]"><span className="total-label">Total Bs:</span><div className="total-value">{totals.totalBs.toFixed(2)}</div></div>
                <div className="total-box divisas flex-1"><span className="total-label">DIVISAS:</span><div className="total-value">{totals.totalUsd.toFixed(2)}</div></div>
             </div>
          </div>
        )}

        {/* MODULO CUENTAS (CXC / CXP) */}
        {activeModule === 'cuentas' && (
          <div className="p-4 flex flex-col h-full overflow-auto">
            <h2 className="text-xl font-bold text-[#000080] mb-4">Cuentas por Cobrar y Pagar</h2>
            <div className="dashboard-grid mb-6">
              <div className="dash-card"><div className="dash-value text-[#008000]">${cuentas.filter(c=>c.tipo==='CXC'&&c.estado!=='Pagada').reduce((s,c)=>s+(c.montoTotal-c.montoPagado),0).toFixed(2)}</div><div className="dash-label">CXC Total Pendiente</div></div>
              <div className="dash-card"><div className="dash-value text-[#c00000]">${cuentas.filter(c=>c.tipo==='CXP'&&c.estado!=='Pagada').reduce((s,c)=>s+(c.montoTotal-c.montoPagado),0).toFixed(2)}</div><div className="dash-label">CXP Total Pendiente</div></div>
            </div>
            <table className="data-table">
              <thead><tr><th>Tipo</th><th>Entidad</th><th>Monto Total</th><th>Pendiente</th><th>Fecha</th><th>Ref</th><th>Estado</th></tr></thead>
              <tbody>
                {cuentas.map(c => (
                  <tr key={c.id}>
                    <td><span className={`cat-badge ${c.tipo==='CXC'?'cat-servicio':'cat-lubricante'}`}>{c.tipo}</span></td>
                    <td>{c.entidad}</td><td>${c.montoTotal.toFixed(2)}</td><td>${(c.montoTotal - c.montoPagado).toFixed(2)}</td><td>{new Date(c.fechaEmision).toLocaleDateString()}</td><td>{c.referencia}</td>
                    <td><span className={`cat-badge ${c.estado==='Pagada'?'cat-servicio':c.estado==='Parcial'?'cat-accesorio':'cat-repuesto'}`}>{c.estado}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* MODULO INVENTARIO CON CPP */}
        {activeModule === 'inventario' && (
          <div className="p-4 flex flex-col h-full overflow-auto">
            <h2 className="text-xl font-bold text-[#000080] mb-4">Inventario General (CPP)</h2>
            <table className="data-table">
              <thead><tr><th>Código</th><th>Descripción</th><th>Dep.</th><th>Stock</th><th>CPP (Costo)</th><th>Precio USD</th><th>Valor Total</th></tr></thead>
              <tbody>
                {products.map((p, i) => (
                  <tr key={i}>
                    <td>{p.codigo}</td><td>{p.descripcion}</td><td>{p.departamento || 'General'}</td><td>{p.stock}</td><td>${p.costoUsd.toFixed(2)}</td><td>${p.precioUsd.toFixed(2)}</td><td>${(p.stock * p.costoUsd).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* MODULO PRODUCTOS (CRUD AVANZADO) */}
        {activeModule === 'productos' && (
          <div className="p-4 flex flex-col h-full overflow-auto">
            <div className="toolbar"><button className="win-btn" onClick={() => { setTempProduct({ aplicaIva: true, hasOwnStock: true, margen: 30, costoUsd: 0 }); setEditId(-1); setActiveModal('modalProducto'); }}>➕ Nuevo Producto/Servicio</button></div>
            <table className="data-table">
              <thead><tr><th>Código</th><th>Descripción</th><th>Costo</th><th>Margen %</th><th>Precio USD</th><th>Stock</th></tr></thead>
              <tbody>
                {products.map((p, i) => (
                  <tr key={i} className={selectedRow === i ? 'selected' : ''} onClick={() => setSelectedRow(i)}>
                    <td>{p.codigo}</td><td>{p.descripcion}</td><td>${p.costoUsd.toFixed(2)}</td><td>{p.margen}%</td><td>${p.precioUsd.toFixed(2)}</td><td>{p.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL PRODUCTO AVANZADO */}
      {activeModal === 'modalProducto' && (
        <div className="modal-overlay active">
          <div className="modal-window large">
            <div className="modal-titlebar"><span>📦 Datos del Producto/Servicio</span><span className="modal-close" onClick={() => setActiveModal(null)}>✕</span></div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group flex-[2]"><label>Código (Manual/Scanner):</label><input type="text" className="win-input" value={tempProduct.codigo} onChange={e => setTempProduct({...tempProduct, codigo: e.target.value})} /></div>
                <div className="form-group"><label>Departamento:</label><select className="win-input" value={tempProduct.departamento} onChange={e => setTempProduct({...tempProduct, departamento: e.target.value})}>{config.departamentos.map(d=><option key={d}>{d}</option>)}</select></div>
              </div>
              <div className="form-group"><label>Descripción:</label><input type="text" className="win-input" value={tempProduct.descripcion} onChange={e => setTempProduct({...tempProduct, descripcion: e.target.value})} /></div>
              
              <div className="bg-[#f0f0f0] border border-[#808080] p-2 mb-2">
                <div className="form-row">
                  <div className="form-group"><label>Costo USD:</label><input type="number" className="win-input font-bold" value={tempProduct.costoUsd} onChange={e => handleProductPriceCalc('costo', parseFloat(e.target.value)||0)} /></div>
                  <div className="form-group"><label>Margen % (Markup):</label><input type="number" className="win-input text-blue-700 font-bold" value={tempProduct.margen} onChange={e => handleProductPriceCalc('margen', parseFloat(e.target.value)||0)} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Precio USD:</label><input type="number" className="win-input text-[#008000] font-bold" value={tempProduct.precioUsd} onChange={e => handleProductPriceCalc('precioUsd', parseFloat(e.target.value)||0)} /></div>
                  <div className="form-group"><label>Precio BS:</label><input type="number" className="win-input text-[#c00000] font-bold" value={tempProduct.precioBs} onChange={e => handleProductPriceCalc('precioBs', parseFloat(e.target.value)||0)} /></div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group"><label>Stock Inicial:</label><input type="number" className="win-input" value={tempProduct.stock} onChange={e => setTempProduct({...tempProduct, stock: parseInt(e.target.value)||0})} /></div>
                <div className="form-group"><label>Stock Mínimo:</label><input type="number" className="win-input" value={tempProduct.stockMin} onChange={e => setTempProduct({...tempProduct, stockMin: parseInt(e.target.value)||0})} /></div>
                <div className="form-group"><label>IVA:</label><select className="win-input" value={tempProduct.aplicaIva?'S':'N'} onChange={e=>setTempProduct({...tempProduct, aplicaIva: e.target.value==='S'})}><option value="S">Si Aplica (16%)</option><option value="N">No Aplica (0%)</option></select></div>
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Marca:</label>
                  <div className="flex gap-1">
                    <select className="win-input flex-1" value={tempProduct.marca} onChange={e=>setTempProduct({...tempProduct, marca: e.target.value})}>{config.marcas.map(m=><option key={m}>{m}</option>)}</select>
                    <button className="win-btn px-2" onClick={()=>{const n = prompt('Nueva Marca'); if(n) setConfig({...config, marcas:[...config.marcas, n]})}}>+</button>
                  </div>
                </div>
                <div className="form-group flex-1">
                  <label>Unidad:</label>
                  <div className="flex gap-1">
                    <select className="win-input flex-1" value={tempProduct.unidad} onChange={e=>setTempProduct({...tempProduct, unidad: e.target.value})}>{config.unidades.map(u=><option key={u}>{u}</option>)}</select>
                    <button className="win-btn px-2" onClick={()=>{const n = prompt('Nueva Unidad'); if(n) setConfig({...config, unidades:[...config.unidades, n]})}}>+</button>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-1"><input type="checkbox" checked={tempProduct.isKit} onChange={e=>setTempProduct({...tempProduct, isKit: e.target.checked})} /> ¿Es Kit/Combo?</label>
                <label className="flex items-center gap-1"><input type="checkbox" checked={tempProduct.hasOwnStock} onChange={e=>setTempProduct({...tempProduct, hasOwnStock: e.target.checked})} /> Stock Propio (vs Virtual)</label>
              </div>
            </div>
            <div className="modal-footer"><button className="btn" onClick={() => setActiveModal(null)}>Cancelar</button><button className="btn btn-success" onClick={() => {
              if (editId >= 0) setProducts(prev => prev.map((p, i) => i === editId ? tempProduct as Product : p));
              else setProducts(prev => [...prev, { ...tempProduct, activo: true } as Product]);
              setActiveModal(null);
            }}>💾 Guardar Producto</button></div>
          </div>
        </div>
      )}

      {/* MODAL PROCESAR VENTA */}
      {activeModal === 'modalProcesar' && (
        <div className="modal-overlay active">
          <div className="modal-window large">
            <div className="modal-titlebar"><span> Procesar Venta</span><span className="modal-close" onClick={() => setActiveModal(null)}>✕</span></div>
            <div className="modal-body">
              <div className="bg-[#f0f0f0] border border-[#808080] p-3 mb-3">
                <div className="grid grid-cols-2 gap-2">
                  <div><strong>Cliente:</strong> {posCliente || 'Consumidor Final'}</div>
                  <div><strong>TOTAL USD:</strong> <span className="text-blue-800 font-bold">${totals.totalUsd.toFixed(2)}</span></div>
                  <div><strong>TOTAL BS:</strong> <span className="text-red-700 font-bold">Bs. {totals.totalBs.toFixed(2)}</span></div>
                </div>
              </div>
              <div className="payment-methods">
                {['efectivo_usd', 'efectivo_bs', 'pago_movil', 'transferencia', 'zelle', 'credito'].map(m => (
                  <div key={m} className={`payment-method ${paymentState.selectedMethod === m ? 'selected' : ''}`} onClick={() => setPaymentState({...paymentState, selectedMethod: m})}>
                    {m.replace('_', ' ').toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer"><button className="btn" onClick={() => setActiveModal(null)}>Cancelar</button><button className="btn btn-success" onClick={confirmSale}>✅ Confirmar Venta</button></div>
          </div>
        </div>
      )}

      <div className="status-bar">
        <span className="status-section">Usuario: Admin</span>
        <span className="status-section">Conectado - DB: LocalStorage</span>
        <span className="status-section">Vendedor: {config.vendedor}</span>
        <span className="status-section">Tasa: {config.tasa}</span>
      </div>
    </div>
  );
}
