'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Product, Client, CartItem, Sale } from '@/types/pos';
import { format } from 'date-fns';

const INITIAL_PRODUCTS: Product[] = [
  { codigo: 'OST-600', descripcion: 'OSTEOFLEX 600MG X 60CAPS (AI)', categoria: 'Repuesto', marca: 'AI', modelo: 'Universal', precioUsd: 11.49, costoUsd: 7.50, iva: 16, stock: 45, stockMin: 10, unidad: 'Caja', ubicacion: 'A-1', activo: true },
  { codigo: 'SIT-500', descripcion: 'SITAGLISMET 50MG/500MG X 30COMP (LETI)', categoria: 'Repuesto', marca: 'LETI', modelo: 'Universal', precioUsd: 12.64, costoUsd: 8.20, iva: 16, stock: 30, stockMin: 8, unidad: 'Caja', ubicacion: 'A-2', activo: true },
  { codigo: 'OME-1000', descripcion: 'OMEGA 3 1000MG X 30CAPS (NOW)', categoria: 'Repuesto', marca: 'NOW', modelo: 'Universal', precioUsd: 12.32, costoUsd: 8.00, iva: 16, stock: 25, stockMin: 5, unidad: 'Caja', ubicacion: 'A-3', activo: true },
  { codigo: 'ATO-40', descripcion: 'ATORVASTATINA 40MG X 30TAB (GV)', categoria: 'Repuesto', marca: 'GV', modelo: 'Universal', precioUsd: 8.81, costoUsd: 5.50, iva: 16, stock: 60, stockMin: 15, unidad: 'Caja', ubicacion: 'B-1', activo: true },
  { codigo: 'ETO-60', descripcion: 'ETORICOXIB 60MG X 10TAB (CALOX)', categoria: 'Repuesto', marca: 'CALOX', modelo: 'Universal', precioUsd: 4.65, costoUsd: 2.80, iva: 16, stock: 80, stockMin: 20, unidad: 'Caja', ubicacion: 'B-2', activo: true },
  { codigo: 'OMP-20', descripcion: 'OMEPRAZOL 20MG X 30CAPS (BM)', categoria: 'Repuesto', marca: 'BM', modelo: 'Universal', precioUsd: 2.64, costoUsd: 1.50, iva: 16, stock: 100, stockMin: 25, unidad: 'Caja', ubicacion: 'B-3', activo: true },
  { codigo: 'ACE-5W30', descripcion: 'ACEITE MOTOR 5W-30 SYNTHETIC 1GL (MOBIL)', categoria: 'Lubricante', marca: 'Mobil', modelo: 'Universal', precioUsd: 28.50, costoUsd: 18.00, iva: 16, stock: 35, stockMin: 10, unidad: 'Galón', ubicacion: 'C-1', activo: true },
  { codigo: 'ACE-10W40', descripcion: 'ACEITE MOTOR 10W-40 SEMI-SYNTH 1GL (CASTROL)', categoria: 'Lubricante', marca: 'Castrol', modelo: 'Universal', precioUsd: 24.00, costoUsd: 15.00, iva: 16, stock: 40, stockMin: 10, unidad: 'Galón', ubicacion: 'C-2', activo: true },
  { codigo: 'FILT-AIR', descripcion: 'FILTRO DE AIRE UNIVERSAL (FRAM)', categoria: 'Repuesto', marca: 'Fram', modelo: 'Universal', precioUsd: 12.00, costoUsd: 6.50, iva: 16, stock: 50, stockMin: 15, unidad: 'Unidad', ubicacion: 'D-1', activo: true },
  { codigo: 'FILT-OIL', descripcion: 'FILTRO DE ACEITE UNIVERSAL (FRAM)', categoria: 'Repuesto', marca: 'Fram', modelo: 'Universal', precioUsd: 8.50, costoUsd: 4.00, iva: 16, stock: 55, stockMin: 15, unidad: 'Unidad', ubicacion: 'D-2', activo: true },
];

const INITIAL_CLIENTS: Client[] = [
  { tipoRif: 'V', rifNum: '12345678-0', nombre: 'Consumidor Final', telefono: '', email: '', direccion: '', tipo: 'Regular', credito: 0, saldo: 0 },
  { tipoRif: 'J', rifNum: '29876543-2', nombre: 'TALLER MECANICO EL RAYO C.A.', telefono: '0212-5551111', email: 'taller@elrayo.com', direccion: 'Av. Libertador, Local 12', tipo: 'Taller', credito: 5000, saldo: 1250.00 },
];

export default function POSPage() {
  const [activeModule, setActiveModule] = useState('pos');
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [sales, setSales] = useState<Sale[]>([]);
  const [posCart, setPosCart] = useState<CartItem[]>([]);
  const [selectedRow, setSelectedRow] = useState(-1);
  const [dateTime, setDateTime] = useState('');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  // POS States
  const [posRif, setPosRif] = useState('');
  const [posCliente, setPosCliente] = useState('');
  const [posBusqueda, setPosBusqueda] = useState('');
  const [searchDropdown, setSearchDropdown] = useState<Product[]>([]);
  
  // Config state
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

  // Payment state
  const [paymentState, setPaymentState] = useState({
    receivedUsd: 0,
    receivedBs: 0,
    selectedMethod: 'efectivo_usd',
    reference: '',
    changeUsd: 0,
    changeBs: 0
  });

  // Modal temporary states
  const [tempProduct, setTempProduct] = useState<Partial<Product>>({});
  const [tempClient, setTempClient] = useState<Partial<Client>>({});
  const [editId, setEditId] = useState(-1);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    const interval = setInterval(() => setDateTime(format(new Date(), 'dd/MM/yyyy HH:mm:ss')), 1000);
    return () => clearInterval(interval);
  }, []);

  // --- POS Logic ---
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
  }, [posCart, config.tasa, config.igtf]);

  const searchProducts = (query: string) => {
    setPosBusqueda(query);
    if (!query) { setSearchDropdown([]); return; }
    const q = query.toLowerCase();
    const results = products.filter(p => p.activo && (p.codigo.toLowerCase().includes(q) || p.descripcion.toLowerCase().includes(q))).slice(0, 10);
    setSearchDropdown(results);
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0 && product.categoria !== 'Servicio') { alert('Sin stock disponible'); return; }
    const index = products.indexOf(product);
    setPosCart(prev => {
      const existing = prev.find(item => item.productIndex === index);
      if (existing) return prev.map(item => item.productIndex === index ? { ...item, cantidad: item.cantidad + 1 } : item);
      return [...prev, { productIndex: index, codigo: product.codigo, descripcion: product.descripcion, precioUsd: product.precioUsd, iva: product.iva, cantidad: 1, categoria: product.categoria }];
    });
    setPosBusqueda(''); setSearchDropdown([]);
  };

  const processSale = () => {
    if (posCart.length === 0) return;
    setPaymentState({
      receivedUsd: totals.totalUsd,
      receivedBs: 0,
      selectedMethod: 'efectivo_usd',
      reference: '',
      changeUsd: 0,
      changeBs: 0
    });
    setActiveModal('modalProcesar');
  };

  const calcChange = (receivedUsd: number, receivedBs: number) => {
    const totalReceivedUsd = receivedUsd + (receivedBs / config.tasa);
    const changeUsd = totalReceivedUsd - totals.totalUsd;
    setPaymentState(prev => ({
      ...prev,
      receivedUsd,
      receivedBs,
      changeUsd: Math.max(0, changeUsd),
      changeBs: Math.max(0, changeUsd * config.tasa)
    }));
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
      recibidoUsd: paymentState.receivedUsd,
      recibidoBs: paymentState.receivedBs,
      cambioUsd: paymentState.changeUsd,
      referencia: paymentState.reference,
      credito: false,
      estado: 'Completada'
    };
    setSales(prev => [...prev, newSale]);
    setProducts(prev => prev.map((p, i) => {
      const item = posCart.find(it => it.productIndex === i);
      return item && p.categoria !== 'Servicio' ? { ...p, stock: p.stock - item.cantidad } : p;
    }));
    setConfig(prev => ({ ...prev, nextInvoice: prev.nextInvoice + 1 }));
    setPosCart([]); setPosCliente(''); setPosRif(''); setActiveModal(null);
    alert(`Venta exitosa: ${invoiceNum}`);
  };

  // --- CRUD Logic ---
  const saveProduct = () => {
    if (!tempProduct.codigo || !tempProduct.descripcion) return;
    if (editId >= 0) {
      setProducts(prev => prev.map((p, i) => i === editId ? tempProduct as Product : p));
    } else {
      setProducts(prev => [...prev, { ...tempProduct, activo: true } as Product]);
    }
    setActiveModal(null); setEditId(-1); setTempProduct({});
  };

  const saveClient = () => {
    if (!tempClient.nombre || !tempClient.rifNum) return;
    if (editId >= 0) {
      setClients(prev => prev.map((c, i) => i === editId ? tempClient as Client : c));
    } else {
      setClients(prev => [...prev, { ...tempClient, saldo: 0 } as Client]);
    }
    setActiveModal(null); setEditId(-1); setTempClient({});
  };

  // --- Reports & Stats ---
  const generateReport = (type: string) => {
    let content = null;
    if (type === 'ventas') content = { title: 'Reporte de Ventas', val: sales.length, label: 'Ventas Totales' };
    if (type === 'inventario') content = { title: 'Reporte de Inventario', val: products.length, label: 'Items en Catálogo' };
    if (type === 'caja') {
      const today = new Date().toDateString();
      const total = sales.filter(s => new Date(s.fecha).toDateString() === today && s.estado === 'Completada').reduce((sum, s) => sum + s.totalUsd, 0);
      content = { title: 'Cierre de Caja Hoy', val: `$${total.toFixed(2)}`, label: 'Monto Recaudado' };
    }
    setReportData(content);
  };

  const dashboardStats = useMemo(() => {
    const today = new Date().toDateString();
    const todaySales = sales.filter(s => new Date(s.fecha).toDateString() === today && s.estado === 'Completada');
    const montoHoy = todaySales.reduce((sum, s) => sum + s.totalUsd, 0);
    const itemsHoy = todaySales.reduce((sum, s) => sum + s.items.reduce((acc, it) => acc + it.cantidad, 0), 0);
    const clientsHoy = new Set(todaySales.map(s => s.cliente)).size;
    const stockBajo = products.filter(p => p.stock <= p.stockMin && p.activo).length;
    return { todaySales: todaySales.length, montoHoy, itemsHoy, clientsHoy, stockBajo };
  }, [sales, products]);

  return (
    <div className="flex flex-col h-screen bg-[#c0c0c0] select-none text-[13px]">
      {/* Dollar Bar */}
      <div className="dollar-bar flex items-center gap-4 px-2 py-1">
        <span className="text-[#000080]">💲</span>
        <span>DOLAR: <strong className="font-bold">{config.tasa.toFixed(2)}</strong></span>
        <span className="ml-auto text-[11px] text-[#555]">AutoParts POS v2.0 | Repuestos, Lubricantes y Servicios</span>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#c0c0c0] border-b-2 border-[#808080] px-1">
        {['pos', 'dashboard', 'productos', 'clientes', 'ventas', 'inventario', 'reportes', 'config'].map(m => (
          <div key={m} className={`nav-tab uppercase ${activeModule === m ? 'active' : ''}`} onClick={() => setActiveModule(m)}>{m === 'pos' ? '️ POS Venta' : m}</div>
        ))}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Module Panels */}
        {activeModule === 'pos' && (
          <div className="flex-1 flex flex-col p-0">
            <div className="bg-[#dce8f0] border border-[#808080] m-1 p-2">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <label className="font-bold min-w-[50px]">Rif:</label>
                <input type="text" className="win-input w-40" value={posRif} onChange={e => setPosRif(e.target.value)} />
                <label className="ml-4 font-bold">Vendedor:</label>
                <span className="bg-[#e8e8e8] border border-[#808080] px-2 py-1 font-bold">{config.vendedor}</span>
                <div className="ml-auto text-[#008000] font-bold">{dateTime}</div>
              </div>
              <div className="flex items-center gap-2">
                <label className="font-bold min-w-[50px]">Cliente:</label>
                <input type="text" className="win-input flex-1" value={posCliente} onChange={e => setPosCliente(e.target.value)} />
              </div>
            </div>

            <div className="bg-[#dce8f0] border border-[#808080] m-1 p-2 relative">
              <div className="flex items-center gap-3">
                <label className="font-bold text-sm">Busqueda:</label>
                <input type="text" className="win-input w-64" placeholder="Código o descripción..." value={posBusqueda} onChange={e => searchProducts(e.target.value)} />
                <label className="font-bold text-sm ml-4">Equivalente:</label>
                <input type="text" readOnly className="win-input w-40 bg-[#e8e8e8]" value={`Bs. ${totals.totalBs.toFixed(2)}`} />
              </div>
              {searchDropdown.length > 0 && (
                <div className="absolute top-full left-16 bg-white border-2 border-[#000080] z-50 min-w-[400px] shadow-lg">
                  {searchDropdown.map(p => (
                    <div key={p.codigo} className="p-2 hover:bg-[#0078d7] hover:text-white cursor-pointer border-b text-black" onClick={() => addToCart(p)}>
                      <strong>{p.codigo}</strong> - {p.descripcion} | <span className="text-[#000080] font-bold">${p.precioUsd.toFixed(2)}</span> | Stock: {p.stock}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 flex overflow-hidden min-h-0">
              <div className="flex-1 overflow-auto border-2 border-[#808080] m-1 bg-white">
                <table className="w-full product-table">
                  <thead className="sticky top-0 z-10">
                    <tr><th className="w-10">#</th><th>Descripcion</th><th className="w-24">Oferta USD</th><th className="w-16">Cant</th><th className="w-28">Precio</th><th className="w-32">Total+Iva</th></tr>
                  </thead>
                  <tbody>
                    {posCart.map((item, i) => (
                      <tr key={i} className={`cursor-pointer ${selectedRow === i ? 'selected' : ''}`} onClick={() => setSelectedRow(i)}>
                        <td className="p-1 px-2 border-b">{i + 1}</td>
                        <td className="p-1 px-2 border-b">{item.codigo} - {item.descripcion}</td>
                        <td className="p-1 px-2 border-b text-right font-bold">{item.precioUsd.toFixed(2)}</td>
                        <td className="p-1 px-2 border-b text-center">{item.cantidad}</td>
                        <td className="p-1 px-2 border-b text-right">{(item.precioUsd * item.cantidad).toFixed(2)}</td>
                        <td className="p-1 px-2 border-b text-right font-bold">{(item.precioUsd * item.cantidad * (1 + item.iva/100)).toFixed(2)}</td>
                      </tr>
                    ))}
                    {posCart.length === 0 && <tr><td colSpan={6} className="text-center py-20 text-[#888]">Agregue productos...</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="w-36 bg-[#7eb8d8] p-1 flex flex-col gap-1 overflow-y-auto">
                <button className="win-btn py-2">Recuperar</button>
                <button className="win-btn py-2">Dscto</button>
                <button className="win-btn py-2" onClick={() => { if (selectedRow >= 0) { setPosCart(prev => prev.filter((_, i) => i !== selectedRow)); setSelectedRow(-1); } }}>Delete F4</button>
                <button className="win-btn py-3 bg-[#f0a0a0] text-sm" onClick={processSale}>Procesar F12</button>
                <button className="win-btn py-2" onClick={() => window.location.reload()}>Salir</button>
              </div>
            </div>

            <div className="bg-[#c0c0c0] border-t-2 border-white p-2 flex gap-2 flex-wrap items-stretch">
              <div className="flex flex-col min-w-[120px] stotal"><span className="font-bold text-[11px] mb-1">S/total:</span><div className="total-value">{totals.subtotal.toFixed(2)}</div></div>
              <div className="flex flex-col min-w-[120px] iva"><span className="font-bold text-[11px] mb-1">Iva:</span><div className="total-value">{totals.totalIva.toFixed(2)}</div></div>
              <div className="flex flex-col flex-1 min-w-[200px] total-bs"><span className="font-bold text-[11px] mb-1">Total Bs:</span><div className="total-value">{totals.totalBs.toFixed(2)}</div></div>
              <div className="flex flex-col min-w-[120px] dolar-igtf"><span className="font-bold text-[11px] mb-1">DOLAR+IGTF:</span><div className="total-value">{(totals.totalUsd + totals.igtfAmount).toFixed(2)}</div></div>
              <div className="flex flex-col min-w-[120px] divisas"><span className="font-bold text-[11px] mb-1">DIVISAS:</span><div className="total-value">{totals.totalUsd.toFixed(2)}</div></div>
              <div className="flex flex-col justify-center min-w-[100px] font-bold text-right pr-2"><div>Item(s): {posCart.length}</div><div>Unidad(es): {totals.totalUnits}</div></div>
            </div>
          </div>
        )}

        {/* Dashboard Panel */}
        {activeModule === 'dashboard' && (
          <div className="p-4 overflow-auto">
            <h2 className="text-xl font-bold text-[#000080] mb-4">Dashboard - Resumen General</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              <div className="dash-card"><div className="dash-value">{dashboardStats.todaySales}</div><div className="dash-label">Ventas Hoy</div></div>
              <div className="dash-card"><div className="dash-value">${dashboardStats.montoHoy.toFixed(2)}</div><div className="dash-label">Monto Hoy (USD)</div></div>
              <div className="dash-card"><div className="dash-value">{dashboardStats.itemsHoy}</div><div className="dash-label">Items Vendidos</div></div>
              <div className="dash-card"><div className="dash-value">{dashboardStats.clientsHoy}</div><div className="dash-label">Clientes Atendidos</div></div>
              <div className="dash-card"><div className="dash-value text-red-700">{dashboardStats.stockBajo}</div><div className="dash-label">Stock Bajo</div></div>
            </div>
          </div>
        )}

        {/* Products Panel */}
        {activeModule === 'productos' && (
          <div className="p-4 flex flex-col h-full">
            <div className="toolbar flex gap-1 mb-2">
              <button className="win-btn" onClick={() => { setTempProduct({}); setEditId(-1); setActiveModal('modalProducto'); }}>➕ Nuevo</button>
              <button className="win-btn" onClick={() => { if (selectedRow >= 0) { setTempProduct(products[selectedRow]); setEditId(selectedRow); setActiveModal('modalProducto'); } }}>✏️ Editar</button>
              <button className="win-btn" onClick={() => { if (selectedRow >= 0) setProducts(prev => prev.filter((_, i) => i !== selectedRow)) }}>🗑️ Eliminar</button>
            </div>
            <div className="flex-1 overflow-auto bg-white border-2 border-[#808080]">
              <table className="w-full data-table">
                <thead><tr><th>Código</th><th>Descripción</th><th>Precio USD</th><th>Stock</th><th>Estado</th></tr></thead>
                <tbody>
                  {products.map((p, i) => (
                    <tr key={i} className={selectedRow === i ? 'selected' : ''} onClick={() => setSelectedRow(i)}>
                      <td>{p.codigo}</td><td>{p.descripcion}</td><td className="text-right">${p.precioUsd.toFixed(2)}</td><td className="text-center">{p.stock}</td>
                      <td className="text-center">{p.stock <= p.stockMin ? 'Bajo' : 'OK'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Clients Panel */}
        {activeModule === 'clientes' && (
          <div className="p-4 flex flex-col h-full">
            <div className="toolbar flex gap-1 mb-2">
              <button className="win-btn" onClick={() => { setTempClient({}); setEditId(-1); setActiveModal('modalCliente'); }}>➕ Nuevo</button>
            </div>
            <div className="flex-1 overflow-auto bg-white border-2 border-[#808080]">
              <table className="w-full data-table">
                <thead><tr><th>RIF</th><th>Nombre</th><th>Teléfono</th><th>Saldo</th></tr></thead>
                <tbody>
                  {clients.map((c, i) => (
                    <tr key={i} className={selectedRow === i ? 'selected' : ''} onClick={() => setSelectedRow(i)}>
                      <td>{c.tipoRif}-{c.rifNum}</td><td>{c.nombre}</td><td>{c.telefono}</td><td className="text-right">${c.saldo.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Config Panel */}
        {activeModule === 'config' && (
          <div className="p-4 overflow-auto">
            <h2 className="text-xl font-bold text-[#000080] mb-4">⚙️ Configuración</h2>
            <div className="bg-white border-2 border-[#808080] p-4 mb-4">
              <h3 className="font-bold border-b mb-2">💱 Tasa de Cambio</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block">Tasa USD/BS:</label><input type="number" step="0.01" className="win-input w-full" value={config.tasa} onChange={e => setConfig({...config, tasa: parseFloat(e.target.value) || 0})} /></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="status-bar bg-[#c0c0c0] border-t-2 border-white px-2 py-1 flex justify-between text-[11px] h-8 items-center">
        <span className="border border-[#808080] px-2 bg-[#e0e0e0] h-full flex items-center">Usuario: Admin</span>
        <span className="border border-[#808080] px-2 bg-[#e0e0e0] h-full flex items-center">Conectado - DB: LocalStorage</span>
        <span className="border border-[#808080] px-2 bg-[#e0e0e0] h-full flex items-center">Vendedor: {config.vendedor}</span>
        <span className="border border-[#808080] px-2 bg-[#e0e0e0] h-full flex items-center">Última Venta: {sales.length > 0 ? sales[sales.length-1].numero : '--'}</span>
      </div>

      {/* Modals */}
      {activeModal === 'modalProcesar' && (
        <div className="modal-overlay active">
          <div className="modal-window large">
            <div className="modal-titlebar"><span> Procesar Venta</span><span className="modal-close" onClick={() => setActiveModal(null)}>✕</span></div>
            <div className="modal-body">
              <div className="bg-[#f0f0f0] border border-[#808080] p-3 mb-3">
                <div className="grid grid-cols-2 gap-2">
                  <div><strong>Cliente:</strong> {posCliente || 'Consumidor Final'}</div>
                  <div><strong>Items:</strong> {posCart.length}</div>
                  <div><strong>TOTAL USD:</strong> <span className="text-blue-800 font-bold">${totals.totalUsd.toFixed(2)}</span></div>
                  <div><strong>TOTAL BS:</strong> <span className="text-red-700 font-bold">Bs. {totals.totalBs.toFixed(2)}</span></div>
                </div>
              </div>
              <div className="payment-methods">
                {['efectivo_usd', 'efectivo_bs', 'pago_movil', 'transferencia', 'tarjeta', 'zelle', 'mixto', 'credito'].map(m => (
                  <div key={m} className={`payment-method ${paymentState.selectedMethod === m ? 'selected' : ''}`} onClick={() => setPaymentState({...paymentState, selectedMethod: m})}>
                    <div className="pm-icon">💵</div>{m.replace('_', ' ').toUpperCase()}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group"><label>Recibido USD:</label><input type="number" className="win-input" value={paymentState.receivedUsd} onChange={e => calcChange(parseFloat(e.target.value)||0, paymentState.receivedBs)} /></div>
                <div className="form-group"><label>Recibido BS:</label><input type="number" className="win-input" value={paymentState.receivedBs} onChange={e => calcChange(paymentState.receivedUsd, parseFloat(e.target.value)||0)} /></div>
                <div className="form-group"><label>Cambio USD:</label><input type="text" readOnly className="win-input bg-[#90ee90]" value={paymentState.changeUsd.toFixed(2)} /></div>
                <div className="form-group"><label>Cambio BS:</label><input type="text" readOnly className="win-input bg-[#87ceeb]" value={paymentState.changeBs.toFixed(2)} /></div>
              </div>
            </div>
            <div className="modal-footer"><button className="btn" onClick={() => setActiveModal(null)}>Cancelar</button><button className="btn btn-success" onClick={confirmSale}>✅ Confirmar Venta</button></div>
          </div>
        </div>
      )}

      {activeModal === 'modalProducto' && (
        <div className="modal-overlay active">
          <div className="modal-window large">
            <div className="modal-titlebar"><span>📦 Producto</span><span className="modal-close" onClick={() => setActiveModal(null)}>✕</span></div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group flex-1"><label>Código:</label><input type="text" className="win-input" value={tempProduct.codigo || ''} onChange={e => setTempProduct({...tempProduct, codigo: e.target.value})} /></div>
                <div className="form-group flex-1"><label>Categoría:</label><select className="win-input" value={tempProduct.categoria || 'Repuesto'} onChange={e => setTempProduct({...tempProduct, categoria: e.target.value})}><option>Repuesto</option><option>Lubricante</option><option>Servicio</option></select></div>
              </div>
              <div className="form-group"><label>Descripción:</label><input type="text" className="win-input" value={tempProduct.descripcion || ''} onChange={e => setTempProduct({...tempProduct, descripcion: e.target.value})} /></div>
              <div className="form-row">
                <div className="form-group flex-1"><label>Precio USD:</label><input type="number" className="win-input" value={tempProduct.precioUsd || 0} onChange={e => setTempProduct({...tempProduct, precioUsd: parseFloat(e.target.value)||0})} /></div>
                <div className="form-group flex-1"><label>Stock:</label><input type="number" className="win-input" value={tempProduct.stock || 0} onChange={e => setTempProduct({...tempProduct, stock: parseInt(e.target.value)||0})} /></div>
              </div>
            </div>
            <div className="modal-footer"><button className="btn" onClick={() => setActiveModal(null)}>Cancelar</button><button className="btn btn-success" onClick={saveProduct}>💾 Guardar</button></div>
          </div>
        </div>
      )}

      {activeModal === 'modalCliente' && (
        <div className="modal-overlay active">
          <div className="modal-window large">
            <div className="modal-titlebar"><span> Cliente</span><span className="modal-close" onClick={() => setActiveModal(null)}>✕</span></div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group flex-1"><label>RIF:</label><input type="text" className="win-input" value={tempClient.rifNum || ''} onChange={e => setTempClient({...tempClient, rifNum: e.target.value})} /></div>
                <div className="form-group flex-1"><label>Nombre:</label><input type="text" className="win-input" value={tempClient.nombre || ''} onChange={e => setTempClient({...tempClient, nombre: e.target.value})} /></div>
              </div>
            </div>
            <div className="modal-footer"><button className="btn" onClick={() => setActiveModal(null)}>Cancelar</button><button className="btn btn-success" onClick={saveClient}>💾 Guardar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
