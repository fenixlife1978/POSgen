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
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [sales, setSales] = useState<Sale[]>([]);
  const [posCart, setPosCart] = useState<CartItem[]>([]);
  const [selectedRow, setSelectedRow] = useState(-1);
  const [dateTime, setDateTime] = useState('');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  const [config, setConfig] = useState({
    tasa: 724.00,
    igtf: 3,
    iva: 16,
    rifEmpresa: 'J-12345678-9',
    nombreEmpresa: 'AutoParts C.A.',
    direccion: 'Av. Principal, Local 5',
    telefono: '0212-5551234',
    vendedor: 'MARIA VERASTEGUI',
    nextInvoice: 1
  });

  const [posRif, setPosRif] = useState('');
  const [posCliente, setPosCliente] = useState('');
  const [posBusqueda, setPosBusqueda] = useState('');
  const [searchDropdown, setSearchDropdown] = useState<Product[]>([]);
  const [paymentState, setPaymentState] = useState({
    receivedUsd: 0,
    receivedBs: 0,
    selectedMethod: 'efectivo_usd',
    reference: ''
  });

  useEffect(() => {
    const interval = setInterval(() => setDateTime(format(new Date(), 'dd/MM/yyyy HH:mm:ss')), 1000);
    return () => clearInterval(interval);
  }, []);

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
  }, [posCart, config]);

  const addToCart = (product: Product) => {
    if (product.stock <= 0 && product.categoria !== 'Servicio') { alert('Sin stock'); return; }
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
    setSales(prev => [...prev, { numero: invoiceNum, fecha: new Date().toISOString(), cliente: posCliente || 'Consumidor Final', rif: posRif || 'V-00000000-0', vendedor: config.vendedor, items: [...posCart], subtotal: totals.subtotal, iva: totals.totalIva, totalUsd: totals.totalUsd, totalBs: totals.totalBs, pago: paymentState.selectedMethod, recibidoUsd: paymentState.receivedUsd, recibidoBs: paymentState.receivedBs, cambioUsd: (paymentState.receivedUsd + paymentState.receivedBs/config.tasa) - totals.totalUsd, referencia: paymentState.reference, credito: false, estado: 'Completada' }]);
    setProducts(prev => prev.map((p, i) => {
      const item = posCart.find(it => it.productIndex === i);
      return item && p.categoria !== 'Servicio' ? { ...p, stock: p.stock - item.cantidad } : p;
    }));
    setConfig(prev => ({ ...prev, nextInvoice: prev.nextInvoice + 1 }));
    setPosCart([]); setPosCliente(''); setPosRif(''); setActiveModal(null);
    alert(`Venta exitosa: ${invoiceNum}`);
  };

  return (
    <div className="flex flex-col h-screen bg-[#c0c0c0] select-none text-[13px]">
      <div className="dollar-bar flex items-center gap-4 px-2 py-1">
        <span className="text-[#000080]">💲</span>
        <span>DOLAR: <strong className="font-bold">{config.tasa.toFixed(2)}</strong></span>
        <span className="ml-auto text-[11px] text-[#555]">AutoParts POS v2.0</span>
      </div>

      <div className="flex bg-[#c0c0c0] border-b-2 border-[#808080] px-1">
        {['pos', 'dashboard', 'productos', 'clientes', 'ventas', 'inventario', 'reportes', 'config'].map(m => (
          <div key={m} className={`nav-tab uppercase ${activeModule === m ? 'active' : ''}`} onClick={() => setActiveModule(m)}>{m === 'pos' ? '️ POS Venta' : m}</div>
        ))}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
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
                <input type="text" className="win-input w-64 text-sm" placeholder="Código o descripción..." value={posBusqueda} onChange={e => {
                  setPosBusqueda(e.target.value);
                  if (e.target.value) setSearchDropdown(products.filter(p => p.activo && (p.codigo.toLowerCase().includes(e.target.value.toLowerCase()) || p.descripcion.toLowerCase().includes(e.target.value.toLowerCase()))).slice(0, 10));
                  else setSearchDropdown([]);
                }} />
                <label className="font-bold text-sm ml-4">Equivalente:</label>
                <input type="text" readOnly className="win-input w-40 bg-[#e8e8e8]" value={`Bs. ${totals.totalBs.toFixed(2)}`} />
              </div>
              {searchDropdown.length > 0 && (
                <div className="absolute top-full left-16 bg-white border-2 border-[#000080] z-50 min-w-[400px] shadow-lg">
                  {searchDropdown.map(p => (
                    <div key={p.codigo} className="p-2 hover:bg-[#0078d7] hover:text-white cursor-pointer border-b" onClick={() => addToCart(p)}>
                      <strong>{p.codigo}</strong> - {p.descripcion} | <span className="text-[#000080] font-bold group-hover:text-white">${p.precioUsd.toFixed(2)}</span> | Stock: {p.stock}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 flex overflow-hidden min-h-0">
              <div className="flex-1 overflow-auto border-2 border-[#808080] m-1 bg-white">
                <table className="w-full product-table border-collapse">
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
                <button className="win-btn py-3 bg-[#f0a0a0] text-sm" onClick={() => { if (posCart.length) { setPaymentState({ receivedUsd: totals.totalUsd, receivedBs: 0, selectedMethod: 'efectivo_usd', reference: '' }); setActiveModal('modalProcesar'); } }}>Procesar F12</button>
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

        {activeModule !== 'pos' && (
          <div className="p-4">
            <h2 className="text-2xl font-bold text-[#000080] mb-4 uppercase">{activeModule}</h2>
            <div className="bg-white border-2 border-[#808080] p-10 text-center">Módulo de {activeModule} en construcción.<br /><button className="win-btn mt-4 px-4 py-2" onClick={() => setActiveModule('pos')}>Volver al POS</button></div>
          </div>
        )}
      </div>

      {activeModal === 'modalProcesar' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000]">
          <div className="win-window w-[600px] max-w-full">
            <div className="win-titlebar"><span>Procesar Venta</span><button className="win-btn py-0 px-2" onClick={() => setActiveModal(null)}>✕</button></div>
            <div className="p-3">
              <div className="bg-[#f0f0f0] border border-[#808080] p-3 mb-3">
                <div className="grid grid-cols-2 gap-2">
                  <div><strong>Cliente:</strong> {posCliente || 'Consumidor Final'}</div>
                  <div><strong>Items:</strong> {posCart.length}</div>
                  <div><strong>Total USD:</strong> <span className="text-blue-800 font-bold">${totals.totalUsd.toFixed(2)}</span></div>
                  <div><strong>Total BS:</strong> <span className="text-red-700 font-bold">Bs. {totals.totalBs.toFixed(2)}</span></div>
                </div>
              </div>
              <label className="font-bold mb-2 block">Método de Pago:</label>
              <div className="grid grid-cols-4 gap-1 mb-4">
                {['efectivo_usd', 'efectivo_bs', 'pago_movil', 'transferencia', 'tarjeta', 'zelle', 'mixto', 'credito'].map(m => (
                  <button key={m} className={`win-btn py-2 capitalize ${paymentState.selectedMethod === m ? 'bg-[#0078d7] text-white' : ''}`} onClick={() => setPaymentState(prev => ({ ...prev, selectedMethod: m }))}>{m.replace('_', ' ')}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block font-bold">Monto Recibido USD:</label>
                  <input type="number" className="win-input w-full" value={paymentState.receivedUsd} onChange={e => setPaymentState(prev => ({ ...prev, receivedUsd: parseFloat(e.target.value) || 0 }))} />
                  <label className="block font-bold">Monto Recibido BS:</label>
                  <input type="number" className="win-input w-full" value={paymentState.receivedBs} onChange={e => setPaymentState(prev => ({ ...prev, receivedBs: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-2">
                  <label className="block font-bold">Cambio USD:</label>
                  <input type="text" readOnly className="win-input w-full bg-[#90ee90] font-bold" value={((paymentState.receivedUsd + paymentState.receivedBs/config.tasa) - totals.totalUsd).toFixed(2)} />
                  <label className="block font-bold">Cambio BS:</label>
                  <input type="text" readOnly className="win-input w-full bg-[#87ceeb] font-bold" value={(((paymentState.receivedUsd + paymentState.receivedBs/config.tasa) - totals.totalUsd) * config.tasa).toFixed(2)} />
                </div>
              </div>
            </div>
            <div className="p-3 border-t border-[#808080] flex justify-end gap-2"><button className="win-btn" onClick={() => setActiveModal(null)}>Cancelar</button><button className="win-btn bg-[#40a040] text-white" onClick={confirmSale}>✅ Confirmar Venta</button></div>
          </div>
        </div>
      )}

      <div className="bg-[#c0c0c0] border-t-2 border-white px-2 py-1 flex justify-between text-[11px]">
        <span className="border border-[#808080] px-2">Usuario: Admin</span>
        <span className="border border-[#808080] px-2">Conectado</span>
        <span className="border border-[#808080] px-2">Vendedor: {config.vendedor}</span>
      </div>
    </div>
  );
}
