'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Product, Client, Sale, Account, CartItem, Presupuesto, User, InventoryMovement } from '@/types/pos';
import { v4 as uuidv4 } from 'uuid';
import { Wallet, Printer, Download, X } from 'lucide-react';

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
  activeModal, onClose, products, setProducts, clients, setClients, 
  sales, setSales, accounts, setAccounts, cart, setCart, 
  config, setConfig, notify, editingId, users, setUsers,
  movements, setMovements
}: ModalsProps) {
  
  const [marcas] = useState(['Universal', 'Toyota', 'Ford', 'LUK', 'BOSCH', 'NGK']);
  const [unidades] = useState(['Unidad', 'Kilo', 'Litro', 'Caja', 'Galón', 'Par']);
  const [categorias] = useState(['Repuesto', 'Lubricante', 'Servicio', 'Accesorio', 'Frenos', 'Motor']);
  const [departamentos] = useState(['Almacén Principal', 'Tienda', 'Servicios']);

  // --- PRODUCT FORM STATE ---
  const initialProduct: Product = {
    codigo: '', barcode: '', nombre: '', descripcion: '', referencia: '', marca: 'Universal',
    unidad: 'Unidad', moneda: 'base', departamento: 'Tienda', categoria: 'Repuesto',
    ubicacion: '', stockMin: 5, stock: 0, costoAnterior: 0, costoActual: 0, costoPromedio: 0,
    utilidadPorcentaje: 0, precio1: 0, precio2: 0, precio3: 0, precio4: 0, ivaAlicuota: 16,
    permiteDescuento: true, activo: true, manejaSeriales: false, manejaLotes: false,
    manejaTallasColores: false, manejaPeso: false, isKit: false, stockPropio: true,
    kitComponents: [], iva: 16
  };
  const [productForm, setProductForm] = useState<Product>(initialProduct);

  // --- COMPRA FORM STATE ---
  const [purchaseForm, setPurchaseForm] = useState({
    proveedor: '', nroFactura: '', tasa: config.tasa, tipo: 'Contado', diasCredito: 0, 
    pagoContadoUsd: 0, pagoContadoBs: 0, items: [] as any[]
  });

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
      if (prod) setProductForm({ ...prod });
    } else if (activeModal === 'modalProducto') {
      setProductForm(initialProduct);
    }
    
    if (activeModal === 'modalProcesar') {
      setPaymentState({
        method: 'Efectivo USD',
        amount: 0,
        payments: [],
        totalPaidUsd: 0
      });
    }
  }, [activeModal, editingId, products, config]);

  const handleProductPriceCalc = (field: string, val: number) => {
    let newForm = { ...productForm };
    const cost = newForm.costoPromedio;

    if (field === 'utilidadPorcentaje') {
      newForm.utilidadPorcentaje = val;
      newForm.precio1 = Math.round((val >= 100 ? cost : cost / (1 - val/100)) * 100) / 100;
    } else if (field === 'precio1') {
      newForm.precio1 = val;
      newForm.utilidadPorcentaje = val > 0 ? Math.round((1 - (cost / val)) * 10000) / 100 : 0;
    } else if (field === 'costoPromedio') {
      newForm.costoPromedio = val;
      newForm.precio1 = Math.round((newForm.utilidadPorcentaje >= 100 ? val : val / (1 - newForm.utilidadPorcentaje/100)) * 100) / 100;
    }
    setProductForm(newForm);
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
    const totalUsd = getCartTotal();
    const remainingUsd = Math.round((totalUsd - paymentState.totalPaidUsd) * 100) / 100;
    
    let usd = 0;
    let bs = 0;

    if (paymentState.method.includes('USD')) {
      usd = paymentState.amount;
      bs = Math.round(usd * config.tasa * 100) / 100;
    } else {
      bs = paymentState.amount;
      usd = Math.round((bs / config.tasa) * 100) / 100;
    }

    const newPayments = [...paymentState.payments, { method: paymentState.method, usd, bs }];
    const newTotalPaid = Math.round(newPayments.reduce((acc, p) => acc + p.usd, 0) * 100) / 100;

    setPaymentState({
      ...paymentState,
      payments: newPayments,
      totalPaidUsd: newTotalPaid,
      amount: 0
    });
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

    // Descontar stock
    const updatedProducts = products.map(p => {
      const item = cart.find(it => it.codigo === p.codigo);
      if (item) return { ...p, stock: p.stock - item.cantidad };
      return p;
    });

    setSales([...sales, sale]);
    setProducts(updatedProducts);
    setLastSale(sale);
    setCart([]);
    notify('✅ Venta procesada exitosamente');
    onClose();
    setTimeout(() => {
      setLastSale(sale); // Trick to open ticket modal
    }, 100);
  };

  if (!activeModal && !lastSale) return null;

  return (
    <>
      <div className={`modal-overlay ${activeModal || lastSale ? 'active' : ''}`} onClick={() => { if(!lastSale) onClose(); else setLastSale(null); }}>
        
        {/* MODAL CALCULADORA DE PAGO */}
        {activeModal === 'modalProcesar' && (
          <div className="modal-window" onClick={e => e.stopPropagation()} style={{ width: '450px' }}>
            <div className="modal-titlebar">
              <span>🧮 CALCULADORA DE PAGOS</span>
              <span className="modal-close" onClick={onClose}>✕</span>
            </div>
            <div className="modal-body space-y-4">
              <div className="win-window p-4 bg-black text-yellow-400 text-center space-y-2">
                <div className="text-sm font-bold opacity-70">TOTAL A CANCELAR</div>
                <div className="text-4xl font-black">${getCartTotal().toFixed(2)}</div>
                <div className="text-sm opacity-80">Equiv. Bs. {(getCartTotal() * config.tasa).toFixed(2)}</div>
              </div>

              <div className="form-group">
                <label>Método de Pago:</label>
                <select 
                  value={paymentState.method} 
                  onChange={e => setPaymentState({...paymentState, method: e.target.value})}
                  className="win-input h-10 w-full"
                >
                  <option>Efectivo USD</option>
                  <option>Efectivo Bs</option>
                  <option>Débito/Crédito Bs</option>
                  <option>Binance USDT</option>
                  <option>Zelle USD</option>
                  <option>Pago Móvil Bs</option>
                </select>
              </div>

              <div className="flex gap-2">
                <div className="form-group flex-1">
                  <label>Monto a Liquidar ({paymentState.method.includes('USD') ? 'USD' : 'Bs'}):</label>
                  <input 
                    type="number" 
                    value={paymentState.amount} 
                    onChange={e => setPaymentState({...paymentState, amount: parseFloat(e.target.value) || 0})}
                    className="win-input h-10 w-full text-right font-bold text-lg"
                  />
                </div>
                <button className="btn btn-primary mt-6 px-4" onClick={addPayment}>➕ Añadir</button>
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
                        <td className="text-right">${p.usd.toFixed(2)}</td>
                        <td className="text-right">Bs {p.bs.toFixed(2)}</td>
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

              <div className="win-window p-3 bg-gray-200">
                <div className="flex justify-between font-bold text-xs">
                  <span>TOTAL PAGADO:</span>
                  <span>${paymentState.totalPaidUsd.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-lg mt-1" style={{ color: paymentState.totalPaidUsd >= getCartTotal() ? 'green' : 'red' }}>
                  <span>{paymentState.totalPaidUsd >= getCartTotal() ? 'VUELTO:' : 'FALTA:'}</span>
                  <span>${Math.abs(Math.round((paymentState.totalPaidUsd - getCartTotal()) * 100) / 100).toFixed(2)}</span>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn w-full" onClick={onClose}>Cancelar</button>
                {paymentState.totalPaidUsd >= getCartTotal() && (
                  <button className="btn btn-success w-full h-12 text-lg" onClick={finalizeSale}>
                    ✅ PROCESAR VENTA (F12)
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL TICKET / COMPROBANTE */}
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
                <div className="flex justify-between"><span>IVA (16%):</span> <span>${lastSale.iva.toFixed(2)}</span></div>
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
