'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Product, Client, CartItem, Sale, Presupuesto } from '@/types/pos';
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
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [posCart, setPosCart] = useState<CartItem[]>([]);
  const [selectedRow, setSelectedRow] = useState(-1);
  const [dateTime, setDateTime] = useState('');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  // Form States
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
    nextInvoice: 1
  });

  const [paymentState, setPaymentState] = useState({
    receivedUsd: 0,
    receivedBs: 0,
    selectedMethod: 'efectivo_usd',
    reference: '',
    changeUsd: 0,
    changeBs: 0
  });

  const [tempProduct, setTempProduct] = useState<Partial<Product>>({});
  const [tempClient, setTempClient] = useState<Partial<Client>>({});
  const [tempManualItem, setTempManualItem] = useState({ desc: '', precio: 0, cant: 1, iva: 16 });
  const [tempDiscount, setTempDiscount] = useState({ tipo: 'porcentaje', valor: 0, aplicar: 'item' });
  const [tempInventory, setTempInventory] = useState({ prodIdx: -1, qty: 1, costo: 0, motivo: 'Merma', obs: '', prov: '', fact: '', nuevoStock: 0 });
  const [editId, setEditId] = useState(-1);

  // Initialize
  useEffect(() => {
    const saved = localStorage.getItem('autoparts_pos_db');
    if (saved) {
      const db = JSON.parse(saved);
      setProducts(db.products || INITIAL_PRODUCTS);
      setClients(db.clients || INITIAL_CLIENTS);
      setSales(db.sales || []);
      setPresupuestos(db.presupuestos || []);
      if (db.config) setConfig(db.config);
    } else {
      setProducts(INITIAL_PRODUCTS);
      setClients(INITIAL_CLIENTS);
    }

    const interval = setInterval(() => setDateTime(format(new Date(), 'dd/MM/yyyy HH:mm:ss')), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const db = { products, clients, sales, presupuestos, config };
    localStorage.setItem('autoparts_pos_db', JSON.stringify(db));
  }, [products, clients, sales, presupuestos, config]);

  // Totals
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

  // Search Logic
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

  // Sale Process
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
      credito: posCredito,
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

  // CRUD Logic
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

  // Inventory & Misc
  const handleInventoryAction = (type: 'entrada' | 'salida' | 'ajuste') => {
    const idx = tempInventory.prodIdx;
    if (idx === -1) return;
    setProducts(prev => prev.map((p, i) => {
      if (i !== idx) return p;
      if (type === 'entrada') return { ...p, stock: p.stock + tempInventory.qty, costoUsd: tempInventory.costo || p.costoUsd };
      if (type === 'salida') return { ...p, stock: Math.max(0, p.stock - tempInventory.qty) };
      if (type === 'ajuste') return { ...p, stock: tempInventory.nuevoStock };
      return p;
    }));
    setActiveModal(null);
  };

  const applyDiscount = () => {
    if (tempDiscount.aplicar === 'item' && selectedRow >= 0) {
      setPosCart(prev => prev.map((item, i) => {
        if (i !== selectedRow) return item;
        const factor = tempDiscount.tipo === 'porcentaje' ? (1 - tempDiscount.valor / 100) : 1;
        const newValue = tempDiscount.tipo === 'porcentaje' ? item.precioUsd * factor : Math.max(0, item.precioUsd - tempDiscount.valor);
        return { ...item, precioUsd: newValue };
      }));
    } else if (tempDiscount.aplicar === 'total') {
      const factor = tempDiscount.tipo === 'porcentaje' ? (1 - tempDiscount.valor / 100) : 1;
      const amountPerItem = tempDiscount.valor / (posCart.length || 1);
      setPosCart(prev => prev.map(item => ({
        ...item,
        precioUsd: tempDiscount.tipo === 'porcentaje' ? item.precioUsd * factor : Math.max(0, item.precioUsd - amountPerItem)
      })));
    }
    setActiveModal(null);
  };

  const addManualItem = () => {
    if (!tempManualItem.desc) return;
    setPosCart(prev => [...prev, { 
      productIndex: -1, 
      codigo: 'MANUAL', 
      descripcion: tempManualItem.desc, 
      precioUsd: tempManualItem.precio, 
      iva: tempManualItem.iva, 
      cantidad: tempManualItem.cant, 
      categoria: 'Manual' 
    }]);
    setTempManualItem({ desc: '', precio: 0, cant: 1, iva: 16 });
    setActiveModal(null);
  };

  const saveAsPresupuesto = () => {
    if (posCart.length === 0) return;
    const newP: Presupuesto = {
      numero: 'P-' + String(presupuestos.length + 1).padStart(4, '0'),
      fecha: new Date().toISOString(),
      cliente: posCliente || 'Consumidor Final',
      items: [...posCart],
      totalUsd: totals.totalUsd,
      estado: 'Pendiente'
    };
    setPresupuestos(prev => [...prev, newP]);
    setPosCart([]); setPosCliente('');
    alert('Presupuesto guardado');
  };

  // Dashboard Stats
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
          <div key={m} className={`nav-tab uppercase ${activeModule === m ? 'active' : ''}`} onClick={() => setActiveModule(m)}>
            {m === 'pos' ? '️ POS Venta' : m}
          </div>
        ))}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Module POS */}
        {activeModule === 'pos' && (
          <div className="flex-1 flex flex-col p-0">
            <div className="bg-[#dce8f0] border border-[#808080] m-1 p-2">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <label className="font-bold min-w-[50px]">Rif:</label>
                <input type="text" className="win-input w-40" value={posRif} onChange={e => {
                  setPosRif(e.target.value);
                  const c = clients.find(cl => (cl.tipoRif + '-' + cl.rifNum) === e.target.value);
                  if (c) setPosCliente(c.nombre);
                }} />
                <label className="ml-4 font-bold flex items-center gap-1"><input type="checkbox" checked={posCredito} onChange={e => setPosCredito(e.target.checked)} /> Crédito</label>
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
                <input 
                  type="text" 
                  className="win-input w-64" 
                  placeholder="Código o descripción..." 
                  value={posBusqueda} 
                  onChange={e => searchProducts(e.target.value)} 
                  onKeyDown={e => {
                    if (e.key === 'Enter' && searchDropdown.length > 0) addToCart(searchDropdown[0]);
                  }}
                />
                <label className="font-bold text-sm ml-4">Equivalente:</label>
                <input type="text" readOnly className="win-input w-40 bg-[#e8e8e8]" value={`Bs. ${totals.totalBs.toFixed(2)}`} />
              </div>
              {searchDropdown.length > 0 && (
                <div className="search-dropdown active left-16 top-full">
                  {searchDropdown.map(p => (
                    <div key={p.codigo} className="search-dropdown-item" onClick={() => addToCart(p)}>
                      <strong>{p.codigo}</strong> - {p.descripcion} | <span className="text-[#000080] font-bold">${p.precioUsd.toFixed(2)}</span> | Stock: {p.stock}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 flex overflow-hidden min-h-0">
              <div className="table-container m-1">
                <table className="product-table">
                  <thead className="sticky top-0 z-10">
                    <tr><th className="w-10">#</th><th>Descripcion</th><th className="w-24">Oferta USD</th><th className="w-16">Cant</th><th className="w-28">Precio</th><th className="w-32">Total+Iva</th></tr>
                  </thead>
                  <tbody>
                    {posCart.map((item, i) => (
                      <tr key={i} className={`cursor-pointer ${selectedRow === i ? 'selected' : ''}`} onClick={() => setSelectedRow(i)}>
                        <td>${i + 1}</td>
                        <td>${item.codigo} - ${item.descripcion}</td>
                        <td className="text-right font-bold">${item.precioUsd.toFixed(2)}</td>
                        <td className="text-center">${item.cantidad}</td>
                        <td className="text-right">${(item.precioUsd * item.cantidad).toFixed(2)}</td>
                        <td className="text-right font-bold">${(item.precioUsd * item.cantidad * (1 + item.iva/100)).toFixed(2)}</td>
                      </tr>
                    ))}
                    {posCart.length === 0 && <tr><td colSpan={6} className="text-center py-20 text-[#888]">Agregue productos...</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="right-sidebar">
                <button className="sidebar-btn" onClick={() => setActiveModal('modalRecuperar')}>Recuperar</button>
                <button className="sidebar-btn" onClick={() => setActiveModal('modalDescuento')}>Dscto</button>
                <button className="sidebar-btn" onClick={() => { if (selectedRow >= 0) { setPosCart(prev => prev.filter((_, i) => i !== selectedRow)); setSelectedRow(-1); } }}>Delete F4</button>
                <button className="sidebar-btn" onClick={() => setActiveModal('modalItem')}>Item</button>
                <button className="sidebar-btn btn-procesar" onClick={processSale}>Procesar F12</button>
                <button className="sidebar-btn" onClick={saveAsPresupuesto}>Presupuesto</button>
                <button className="sidebar-btn" onClick={() => setActiveModal('modalCantidad')}>Cantidad</button>
                <button className="sidebar-btn" onClick={() => window.location.reload()}>Salir</button>
              </div>
            </div>

            <div className="bottom-totals">
              <div className="total-box stotal"><span className="total-label">S/total:</span><div className="total-value">{totals.subtotal.toFixed(2)}</div></div>
              <div className="total-box iva"><span className="total-label">Iva:</span><div className="total-value">{totals.totalIva.toFixed(2)}</div></div>
              <div className="total-box total-bs"><span className="total-label">Total Bs:</span><div className="total-value">{totals.totalBs.toFixed(2)}</div></div>
              <div className="total-box dolar-igtf"><span className="total-label">DOLAR+IGTF:</span><div className="total-value">{(totals.totalUsd + totals.igtfAmount).toFixed(2)}</div></div>
              <div className="total-box divisas"><span className="total-label">DIVISAS:</span><div className="total-value">{totals.totalUsd.toFixed(2)}</div></div>
              <div className="items-count"><div>Item(s): {posCart.length}</div><div>Unidad(es): {totals.totalUnits}</div></div>
            </div>
          </div>
        )}

        {/* Dashboard */}
        {activeModule === 'dashboard' && (
          <div className="p-4 overflow-auto">
            <h2 className="text-xl font-bold text-[#000080] mb-4">Dashboard - Resumen General</h2>
            <div className="dashboard-grid">
              <div className="dash-card"><div className="dash-value">{dashboardStats.todaySales}</div><div className="dash-label">Ventas Hoy</div></div>
              <div className="dash-card"><div className="dash-value">${dashboardStats.montoHoy.toFixed(2)}</div><div className="dash-label">Monto Hoy (USD)</div></div>
              <div className="dash-card"><div className="dash-value">{dashboardStats.itemsHoy}</div><div className="dash-label">Items Vendidos</div></div>
              <div className="dash-card"><div className="dash-value">{dashboardStats.clientsHoy}</div><div className="dash-label">Clientes Atendidos</div></div>
              <div className="dash-card"><div className="dash-value text-red-700">{dashboardStats.stockBajo}</div><div className="dash-label">Stock Bajo</div></div>
            </div>
          </div>
        )}

        {/* Modals Implementation */}
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
                <div className="form-row">
                  <div className="form-group"><label>Recibido USD:</label><input type="number" className="win-input" value={paymentState.receivedUsd} onChange={e => calcChange(parseFloat(e.target.value)||0, paymentState.receivedBs)} /></div>
                  <div className="form-group"><label>Recibido BS:</label><input type="number" className="win-input" value={paymentState.receivedBs} onChange={e => calcChange(paymentState.receivedUsd, parseFloat(e.target.value)||0)} /></div>
                </div>
              </div>
              <div className="modal-footer"><button className="btn" onClick={() => setActiveModal(null)}>Cancelar</button><button className="btn btn-success" onClick={confirmSale}>✅ Confirmar Venta</button></div>
            </div>
          </div>
        )}

        {/* Modal Item Manual */}
        {activeModal === 'modalItem' && (
          <div className="modal-overlay active">
            <div className="modal-window large">
              <div className="modal-titlebar"><span>📋 Agregar Item Manual</span><span className="modal-close" onClick={() => setActiveModal(null)}>✕</span></div>
              <div className="modal-body">
                <div className="form-group"><label>Descripción:</label><input type="text" className="win-input" value={tempManualItem.desc} onChange={e => setTempManualItem({...tempManualItem, desc: e.target.value})} /></div>
                <div className="form-row">
                  <div className="form-group"><label>Precio USD:</label><input type="number" className="win-input" value={tempManualItem.precio} onChange={e => setTempManualItem({...tempManualItem, precio: parseFloat(e.target.value)||0})} /></div>
                  <div className="form-group"><label>Cantidad:</label><input type="number" className="win-input" value={tempManualItem.cant} onChange={e => setTempManualItem({...tempManualItem, cant: parseInt(e.target.value)||1})} /></div>
                </div>
              </div>
              <div className="modal-footer"><button className="btn" onClick={() => setActiveModal(null)}>Cancelar</button><button className="btn btn-success" onClick={addManualItem}>➕ Agregar</button></div>
            </div>
          </div>
        )}

        {/* Modal Descuento */}
        {activeModal === 'modalDescuento' && (
          <div className="modal-overlay active">
            <div className="modal-window">
              <div className="modal-titlebar"><span>🏷️ Aplicar Descuento</span><span className="modal-close" onClick={() => setActiveModal(null)}>✕</span></div>
              <div className="modal-body">
                <div className="form-group"><label>Tipo:</label><select className="win-input" value={tempDiscount.tipo} onChange={e => setTempDiscount({...tempDiscount, tipo: e.target.value})}><option value="porcentaje">Porcentaje (%)</option><option value="monto">Monto Fijo (USD)</option></select></div>
                <div className="form-group"><label>Valor:</label><input type="number" className="win-input" value={tempDiscount.valor} onChange={e => setTempDiscount({...tempDiscount, valor: parseFloat(e.target.value)||0})} /></div>
                <div className="form-group"><label>Aplicar a:</label><select className="win-input" value={tempDiscount.aplicar} onChange={e => setTempDiscount({...tempDiscount, aplicar: e.target.value})}><option value="item">Item Seleccionado</option><option value="total">Total de la Venta</option></select></div>
              </div>
              <div className="modal-footer"><button className="btn" onClick={() => setActiveModal(null)}>Cancelar</button><button className="btn btn-success" onClick={applyDiscount}>✅ Aplicar</button></div>
            </div>
          </div>
        )}

        {/* Modules logic for rendering tables */}
        {activeModule === 'productos' && (
          <div className="p-4 flex flex-col h-full overflow-auto">
            <div className="toolbar"><button className="win-btn" onClick={() => { setTempProduct({}); setEditId(-1); setActiveModal('modalProducto'); }}>➕ Nuevo</button></div>
            <table className="data-table">
              <thead><tr><th>Código</th><th>Descripción</th><th>Precio USD</th><th>Stock</th></tr></thead>
              <tbody>
                {products.map((p, i) => (
                  <tr key={i} className={selectedRow === i ? 'selected' : ''} onClick={() => setSelectedRow(i)}>
                    <td>{p.codigo}</td><td>{p.descripcion}</td><td>${p.precioUsd.toFixed(2)}</td><td>{p.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <span className="status-section">Usuario: Admin</span>
        <span className="status-section">Conectado - DB: LocalStorage</span>
        <span className="status-section">Vendedor: {config.vendedor}</span>
        <span className="status-section">Última Venta: {sales.length > 0 ? sales[sales.length-1].numero : '--'}</span>
      </div>
    </div>
  );
}
