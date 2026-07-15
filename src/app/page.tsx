
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Product, Client, CartItem, Sale, Account } from '@/types/pos';
import { format } from 'date-fns';

const INITIAL_PRODUCTS: Product[] = [
  { codigo: 'OST-600', descripcion: 'OSTEOFLEX 600MG X 60CAPS (AI)', categoria: 'Repuesto', marca: 'AI', modelo: 'Universal', precioUsd: 11.49, costoUsd: 7.50, iva: 16, stock: 45, stockMin: 10, unidad: 'Caja', ubicacion: 'A-1', activo: true },
  { codigo: 'SIT-500', descripcion: 'SITAGLISMET 50MG/500MG X 30COMP (LETI)', categoria: 'Repuesto', marca: 'LETI', modelo: 'Universal', precioUsd: 12.64, costoUsd: 8.20, iva: 16, stock: 30, stockMin: 8, unidad: 'Caja', ubicacion: 'A-2', activo: true },
];

export default function POSPage() {
  const [activeModule, setActiveModule] = useState('pos');
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cuentas, setCuentas] = useState<Account[]>([]);
  const [posCart, setPosCart] = useState<CartItem[]>([]);
  const [selectedRow, setSelectedRow] = useState(-1);
  const [dateTime, setDateTime] = useState('');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  const [posRif, setPosRif] = useState('');
  const [posCliente, setPosCliente] = useState('');
  const [posBusqueda, setPosBusqueda] = useState('');
  const [posCredito, setPosCredito] = useState(false);
  
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
    nextInvoice: 1
  });

  const [paymentState, setPaymentState] = useState({ receivedUsd: 0, receivedBs: 0, selectedMethod: 'efectivo_usd', reference: '' });
  const [tempProduct, setTempProduct] = useState<Partial<Product>>({ activo: true, margen: 30, costoUsd: 0 });

  // --- LOGICA DE RECALCULO TRIDIRECCIONAL (MARKUP SOBRE VENTA) ---
  const handleProductPriceCalc = (field: string, val: number) => {
    const cost = tempProduct.costoUsd || 0;
    const tasa = config.tasa;
    let newTemp = { ...tempProduct };

    if (field === 'costo') {
      newTemp.costoUsd = val;
      newTemp.precioUsd = val / (1 - (newTemp.margen || 0) / 100);
    } else if (field === 'margen') {
      newTemp.margen = val;
      newTemp.precioUsd = cost / (1 - val / 100);
    } else if (field === 'precioUsd') {
      newTemp.precioUsd = val;
      newTemp.margen = ((val - cost) / val) * 100;
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
      setCuentas(db.cuentas || []);
      if (db.config) setConfig(db.config);
    } else {
      setProducts(INITIAL_PRODUCTS);
    }
    const interval = setInterval(() => setDateTime(format(new Date(), 'dd/MM/yyyy HH:mm:ss')), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const db = { products, clients, sales, cuentas, config };
    localStorage.setItem('autoparts_pos_db', JSON.stringify(db));
  }, [products, clients, sales, cuentas, config]);

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
  };

  return (
    <div className="flex flex-col h-screen bg-[#c0c0c0] select-none text-[13px] overflow-hidden">
      {/* Dollar Bar */}
      <div className="dollar-bar flex items-center gap-4">
        <span className="text-[#000080]">💲 DOLAR: {config.tasa.toFixed(2)}</span>
        <span className="ml-auto text-[#555]">AutoParts POS v2.0 | Sistema Integral de Ventas y Almacén</span>
      </div>

      {/* Navigation */}
      <div className="flex bg-[#c0c0c0] border-b-2 border-[#808080] px-1">
        {['pos', 'dashboard', 'productos', 'clientes', 'ventas', 'cuentas', 'inventario', 'config'].map(m => (
          <div key={m} className={`nav-tab uppercase ${activeModule === m ? 'active' : ''}`} onClick={() => setActiveModule(m)}>
            {m === 'pos' ? '️ POS Venta' : m}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-hidden relative">
        {activeModule === 'pos' && (
          <div className="h-full flex flex-col">
             <div className="bg-[#dce8f0] border border-[#808080] m-1 p-2 flex flex-col gap-2">
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

             <div className="flex-1 flex min-h-0">
                <div className="flex-1 bg-white m-1 border-2 border-[#808080] overflow-auto">
                   <table className="product-table w-full">
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
                <div className="w-36 bg-[#7eb8d8] p-1 flex flex-col gap-1">
                   <button className="win-btn h-10" onClick={() => setActiveModal('modalProducto')}>➕ Producto</button>
                   <button className="win-btn h-10" onClick={() => setPosCart([])}>Limpiar</button>
                   <button className="win-btn h-12 bg-[#f0a0a0] mt-auto" onClick={() => setActiveModal('modalProcesar')}>Procesar F12</button>
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
              <div className="dash-card"><div className="dash-value text-[#008000]">${cuentas.filter(c=>c.tipo==='CXC').reduce((s,c)=>s+c.montoTotal,0).toFixed(2)}</div><div className="dash-label">CXC Total</div></div>
              <div className="dash-card"><div className="dash-value text-[#c00000]">${cuentas.filter(c=>c.tipo==='CXP').reduce((s,c)=>s+c.montoTotal,0).toFixed(2)}</div><div className="dash-label">CXP Total</div></div>
            </div>
            <table className="data-table">
              <thead><tr><th>Tipo</th><th>Entidad</th><th>Monto</th><th>Fecha</th><th>Ref</th><th>Estado</th></tr></thead>
              <tbody>
                {cuentas.map(c => (
                  <tr key={c.id}>
                    <td><span className={`cat-badge ${c.tipo==='CXC'?'cat-servicio':'cat-lubricante'}`}>{c.tipo}</span></td>
                    <td>{c.entidad}</td><td>${c.montoTotal.toFixed(2)}</td><td>{new Date(c.fechaEmision).toLocaleDateString()}</td><td>{c.referencia}</td><td>{c.estado}</td>
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
              <thead><tr><th>Código</th><th>Descripción</th><th>Stock</th><th>CPP (Costo)</th><th>Precio USD</th><th>Valor Total</th></tr></thead>
              <tbody>
                {products.map((p, i) => (
                  <tr key={i}>
                    <td>{p.codigo}</td><td>{p.descripcion}</td><td>{p.stock}</td><td>${p.costoUsd.toFixed(2)}</td><td>${p.precioUsd.toFixed(2)}</td><td>${(p.stock * p.costoUsd).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL PROCESAR VENTA */}
      {activeModal === 'modalProcesar' && (
        <div className="modal-overlay">
          <div className="modal-window large">
            <div className="win-titlebar"><span> Procesar Venta</span><span className="cursor-pointer" onClick={() => setActiveModal(null)}>✕</span></div>
            <div className="modal-body">
              <div className="bg-[#f0f0f0] border border-[#808080] p-3 mb-3">
                <div className="grid grid-cols-2 gap-2">
                  <div><strong>Cliente:</strong> {posCliente || 'Consumidor Final'}</div>
                  <div><strong>TOTAL USD:</strong> <span className="text-blue-800 font-bold">${totals.totalUsd.toFixed(2)}</span></div>
                  <div><strong>TOTAL BS:</strong> <span className="text-red-700 font-bold">Bs. {totals.totalBs.toFixed(2)}</span></div>
                </div>
              </div>
              <div className="form-group"><label>Método de Pago:</label><select className="win-input w-full" value={paymentState.selectedMethod} onChange={e=>setPaymentState({...paymentState, selectedMethod: e.target.value})}><option value="efectivo_usd">Efectivo USD</option><option value="efectivo_bs">Efectivo BS</option><option value="pago_movil">Pago Móvil</option></select></div>
            </div>
            <div className="modal-footer"><button className="win-btn" onClick={() => setActiveModal(null)}>Cancelar</button><button className="win-btn bg-[#40a040] text-white" onClick={confirmSale}>✅ Confirmar Venta</button></div>
          </div>
        </div>
      )}

      {/* MODAL PRODUCTO AVANZADO */}
      {activeModal === 'modalProducto' && (
        <div className="modal-overlay">
          <div className="modal-window large">
            <div className="win-titlebar"><span>📦 Datos del Producto</span><span className="cursor-pointer" onClick={() => setActiveModal(null)}>✕</span></div>
            <div className="modal-body space-y-4">
              <div className="form-row">
                <div className="form-group flex-1"><label>Código:</label><input type="text" className="win-input w-full" value={tempProduct.codigo} onChange={e=>setTempProduct({...tempProduct, codigo: e.target.value})} /></div>
                <div className="form-group flex-[2]"><label>Descripción:</label><input type="text" className="win-input w-full" value={tempProduct.descripcion} onChange={e=>setTempProduct({...tempProduct, descripcion: e.target.value})} /></div>
              </div>
              <div className="bg-[#f0f0f0] p-3 border border-[#808080] space-y-2">
                <div className="form-row">
                  <div className="form-group flex-1"><label>Costo USD:</label><input type="number" className="win-input w-full" value={tempProduct.costoUsd} onChange={e=>handleProductPriceCalc('costo', parseFloat(e.target.value)||0)} /></div>
                  <div className="form-group flex-1"><label>Margen %:</label><input type="number" className="win-input w-full" value={tempProduct.margen} onChange={e=>handleProductPriceCalc('margen', parseFloat(e.target.value)||0)} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group flex-1"><label>Precio USD:</label><input type="number" className="win-input w-full font-bold text-blue-800" value={tempProduct.precioUsd} onChange={e=>handleProductPriceCalc('precioUsd', parseFloat(e.target.value)||0)} /></div>
                  <div className="form-group flex-1"><label>Precio BS:</label><input type="text" className="win-input w-full bg-[#eee]" readOnly value={((tempProduct.precioUsd||0)*config.tasa).toFixed(2)} /></div>
                </div>
              </div>
            </div>
            <div className="modal-footer"><button className="win-btn" onClick={() => setActiveModal(null)}>Cancelar</button><button className="win-btn bg-[#0078d7] text-white" onClick={()=>{setProducts([...products, tempProduct as Product]); setActiveModal(null);}}>💾 Guardar Producto</button></div>
          </div>
        </div>
      )}

      <div className="status-bar flex justify-between bg-[#c0c0c0] border-t-2 border-white px-2 py-1 text-[11px]">
        <span>Usuario: Admin</span>
        <span>Conectado - DB: LocalStorage</span>
        <span>Vendedor: {config.vendedor}</span>
        <span>Tasa: {config.tasa}</span>
      </div>
    </div>
  );
}
