
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Product, Client, Provider, Sale, Account, CartItem, User, InventoryMovement } from '@/types/pos';
import { v4 as uuidv4 } from 'uuid';
import { Wallet, Search, Trash2, Save, CreditCard } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, setDoc, writeBatch, collection } from 'firebase/firestore';

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
  presupuestos: any;
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
  activeModal, onClose, products, clients, providers, sales, accounts, cart, setCart, 
  config, notify, editingId, users,
  movements
}: ModalsProps) {
  
  const methodRef = useRef<HTMLSelectElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  const initialProduct: Product = {
    codigo: '', barcode: '', nombre: '', descripcion: '', referencia: '', marca: 'Universal',
    unidad: 'Unidad', moneda: 'base', departamento: 'Tienda', categoria: 'Repuesto',
    ubicacion: '', stockMin: 5, stock: 0, costoAnterior: 0, costoActual: 0, costoPromedio: 0,
    utilidadPorcentaje: 30, precio1: 0, precio2: 0, precio3: 0, precio4: 0, ivaAlicuota: 16,
    permiteDescuento: true, activo: true, manejaSeriales: false, manejaLotes: false,
    manejaTallasColores: false, manejaPeso: false, isKit: false, isService: false, stockPropio: true,
    kitComponents: [], iva: 16
  };
  
  const [productForm, setProductForm] = useState<Product>(initialProduct);
  const [costoText, setCostoText] = useState<string>('0');
  const [markupText, setMarkupText] = useState<string>('30');
  const [precioUsdText, setPrecioUsdText] = useState<string>('0');
  const [precioBsText, setPrecioBsText] = useState<string>('0');
  const [stockInicial, setStockInicial] = useState<string>('0');
  const [stockMinText, setStockMinText] = useState<string>('5');

  const initialClient: Client = { tipoRif: 'V', rifNum: '', nombre: '', telefono: '', email: '', direccion: '', tipo: 'Detal', credito: 0, saldo: 0 };
  const [clientForm, setClientForm] = useState<Client>(initialClient);

  const initialProvider: Provider = { id: '', rif: '', nombre: '', direccion: '', contacto: '', telefono: '' };
  const [providerForm, setProviderForm] = useState<Provider>(initialProvider);

  const [entradaForm, setEntradaForm] = useState({ proveedor: '', rif: '', nroFactura: '', tasa: config.tasa, tipoCompra: 'Contado', diasCredito: 0, pagoContadoUsd: 0, pagoContadoBs: 0, items: [] as any[] });
  const [entradaSearch, setEntradaSearch] = useState('');
  const [entradaDropdown, setEntradaDropdown] = useState<Product[]>([]);

  const [ajusteForm, setAjusteForm] = useState({ codigo: '', tipo: 'ENTRADA' as 'ENTRADA' | 'SALIDA', cantidad: 1, motivo: '', comentario: '' });

  const [paymentState, setPaymentState] = useState({ method: 'Efectivo USD', amount: 0, payments: [] as { method: string, usd: number, bs: number }[], totalPaidUsd: 0 });
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [viewSale, setViewSale] = useState<Sale | null>(null);
  const [userForm, setUserForm] = useState<User>({ id: '', username: '', password: '', name: '', email: '', role: 'Cajero', active: true });

  useEffect(() => {
    if (activeModal === 'modalProducto' && editingId !== null) {
      const prod = products[editingId];
      if (prod) {
        setProductForm({ ...prod });
        setStockInicial(prod.stock.toString());
        setCostoText(prod.costoActual.toString());
        setMarkupText(prod.utilidadPorcentaje.toString());
        setPrecioUsdText(prod.precio1.toString());
        setPrecioBsText((prod.precio1 * config.tasa).toFixed(2));
      }
    } else if (activeModal === 'modalProducto') {
      setProductForm(initialProduct);
    }
    if (activeModal === 'modalCliente' && editingId !== null) setClientForm({ ...clients[editingId] });
    if (activeModal === 'modalProveedor' && editingId !== null) setProviderForm({ ...providers.find(p => p.id === editingId)! });
    if (activeModal === 'modalProcesar') { setPaymentState({ method: 'Efectivo USD', amount: 0, payments: [], totalPaidUsd: 0 }); setTimeout(() => methodRef.current?.focus(), 100); }
    if (activeModal === 'modalDetalleVenta' && editingId) setViewSale(sales.find(s => s.numero === editingId) || null);
    if (activeModal === 'modalEntrada') setEntradaForm({ proveedor: '', rif: '', nroFactura: '', tasa: config.tasa, tipoCompra: 'Contado', diasCredito: 0, pagoContadoUsd: 0, pagoContadoBs: 0, items: [] });
  }, [activeModal, editingId, products, clients, providers, config.tasa, sales]);

  const handleProductPriceCalc = (field: string, valStr: string) => {
    let newForm = { ...productForm };
    const tasa = config.tasa;
    const val = parseFloat(valStr) || 0;

    if (field === 'costo') {
      setCostoText(valStr);
      newForm.costoActual = val;
      const markup = parseFloat(markupText) || 0;
      const newPrice = Math.round((val * (1 + markup / 100)) * 100) / 100;
      newForm.precio1 = newPrice;
      setPrecioUsdText(newPrice.toString());
      setPrecioBsText((newPrice * tasa).toFixed(2));
    } else if (field === 'utilidadPorcentaje') {
      setMarkupText(valStr);
      const cost = newForm.costoActual;
      const newPrice = Math.round((cost * (1 + val / 100)) * 100) / 100;
      newForm.utilidadPorcentaje = val;
      newForm.precio1 = newPrice;
      setPrecioUsdText(newPrice.toString());
      setPrecioBsText((newPrice * tasa).toFixed(2));
    } else if (field === 'precio1') {
      setPrecioUsdText(valStr);
      const cost = newForm.costoActual;
      newForm.precio1 = val;
      newForm.utilidadPorcentaje = cost > 0 ? Math.round(((val / cost) - 1) * 10000) / 100 : 0;
      setMarkupText(newForm.utilidadPorcentaje.toString());
      setPrecioBsText((val * tasa).toFixed(2));
    }
    setProductForm(newForm);
  };

  const handleSaveProduct = async () => {
    if (!productForm.codigo || !productForm.nombre) return notify('Faltan campos', 'error');
    const id = productForm.codigo;
    const finalForm = { ...productForm, stock: parseInt(stockInicial) || 0, stockMin: parseInt(stockMinText) || 0, precio1: parseFloat(precioUsdText) || 0 };
    await setDoc(doc(db, 'products', id), finalForm);
    if (!finalForm.isService && parseInt(stockInicial) > 0) {
      const logId = uuidv4();
      await setDoc(doc(db, `products/${id}/logs`, logId), {
        id: logId, fecha: new Date().toISOString(), codigoProducto: id, tipo: 'ENTRADA', cantidad: finalForm.stock, stockPrevio: 0, stockNuevo: finalForm.stock, costo: finalForm.costoActual, referencia: 'STOCK INICIAL', usuario: config.vendedor
      });
    }
    notify('Producto guardado');
    onClose();
  };

  const finalizeSale = async () => {
    const batch = writeBatch(db);
    const saleId = uuidv4();
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
      detallesPago: [...paymentState.payments],
      recibidoUsd: paymentState.totalPaidUsd,
      recibidoBs: Math.round(paymentState.totalPaidUsd * config.tasa * 100) / 100,
      cambioUsd: Math.max(0, Math.round((paymentState.totalPaidUsd - totalUsd) * 100) / 100),
      referencia: uuidv4().slice(0, 8),
      credito: false,
      estado: 'Completada'
    };

    batch.set(doc(db, 'sales', saleId), sale);
    cart.forEach(item => {
      const product = products[item.productIndex];
      if (product.isService) return;
      const newStock = product.stock - item.cantidad;
      batch.update(doc(db, 'products', product.codigo), { stock: newStock });
      const logId = uuidv4();
      batch.set(doc(db, `products/${product.codigo}/logs`, logId), {
        id: logId, fecha: sale.fecha, codigoProducto: product.codigo, tipo: 'VENTA', cantidad: -item.cantidad, stockPrevio: product.stock, stockNuevo: newStock, costo: product.costoPromedio, referencia: sale.numero, usuario: config.vendedor
      });
    });

    await batch.commit();
    setLastSale(sale);
    setCart([]);
    notify('Venta finalizada');
    onClose();
  };

  const processEntrada = async () => {
    if (!entradaForm.nroFactura || entradaForm.items.length === 0) return notify('Faltan datos', 'warning');
    const batch = writeBatch(db);
    entradaForm.items.forEach(item => {
      const product = products.find(p => p.codigo === item.codigo)!;
      const nuevoStock = product.stock + item.cantidad;
      const nuevoCostoProm = ((product.stock * product.costoPromedio) + (item.cantidad * item.costo)) / nuevoStock;
      batch.update(doc(db, 'products', item.codigo), { stock: nuevoStock, costoActual: item.costo, costoPromedio: nuevoCostoProm });
      const logId = uuidv4();
      batch.set(doc(db, `products/${item.codigo}/logs`, logId), {
        id: logId, fecha: new Date().toISOString(), codigoProducto: item.codigo, tipo: 'ENTRADA', cantidad: item.cantidad, stockPrevio: product.stock, stockNuevo: nuevoStock, costo: item.costo, referencia: `COMPRA-${entradaForm.nroFactura}`, usuario: config.vendedor
      });
    });
    await batch.commit();
    notify('Entrada procesada');
    onClose();
  };

  if (!activeModal && !lastSale && !viewSale) return null;

  return (
    <div className={`modal-overlay active`} onClick={() => { if(!lastSale && !viewSale) onClose(); else { setLastSale(null); setViewSale(null); } }}>
      {activeModal === 'modalProducto' && (
        <div className="modal-window large" onClick={e => e.stopPropagation()}>
          <div className="modal-titlebar"><span>📦 FICHA MAESTRA DE ITEM</span><span className="modal-close" onClick={onClose}>✕</span></div>
          <div className="modal-body grid grid-cols-2 gap-6">
            <div className="settings-section">
              <h3 className="text-xs uppercase font-bold mb-2">Identificación</h3>
              <div className="form-group"><label>Código Interno:</label><input type="text" value={productForm.codigo} onChange={e => setProductForm({...productForm, codigo: e.target.value})} className="win-input" /></div>
              <div className="form-group"><label>Nombre / Descripción:</label><input type="text" value={productForm.nombre} onChange={e => setProductForm({...productForm, nombre: e.target.value})} className="win-input" /></div>
              <div className="flex gap-4 mt-2">
                <label className="checkbox-label"><input type="checkbox" checked={productForm.isService} onChange={e => setProductForm({...productForm, isService: e.target.checked})} /> ¿Es un Servicio?</label>
              </div>
            </div>
            <div className="settings-section">
              <h3 className="text-xs uppercase font-bold mb-2">Finanzas y Precios</h3>
              <div className="form-group"><label>Precio de Costo (USD):</label><input type="number" value={costoText} onChange={e => handleProductPriceCalc('costo', e.target.value)} className="win-input font-bold" /></div>
              <div className="form-group"><label>Ganancia (%):</label><input type="number" value={markupText} onChange={e => handleProductPriceCalc('utilidadPorcentaje', e.target.value)} className="win-input" /></div>
              <div className="form-group"><label>Precio Detal (USD):</label><input type="number" value={precioUsdText} onChange={e => handleProductPriceCalc('precio1', e.target.value)} className="win-input font-bold text-blue-800" /></div>
              <div className="form-group"><label>Precio Detal (Bs.):</label><input type="text" value={precioBsText} readOnly className="win-input bg-gray-100" /></div>
            </div>
          </div>
          <div className="modal-footer"><button className="btn" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={handleSaveProduct}>💾 GUARDAR ITEM</button></div>
        </div>
      )}

      {activeModal === 'modalProcesar' && (
        <div className="modal-window" style={{ width: '400px' }} onClick={e => e.stopPropagation()}>
          <div className="modal-titlebar"><span>💳 PROCESAR ABONO</span><span className="modal-close" onClick={onClose}>✕</span></div>
          <div className="modal-body space-y-4">
             <div className="win-window p-4 bg-gray-200 text-center">
                <div className="text-[10px] font-bold uppercase">Total Factura</div>
                <div className="text-3xl font-black">${cart.reduce((s, i) => s + (i.precioUsd * i.cantidad * (1 + i.iva/100)), 0).toFixed(2)}</div>
             </div>
             <div className="form-group">
                <label>Método:</label>
                <select ref={methodRef} value={paymentState.method} onChange={e => setPaymentState({...paymentState, method: e.target.value})} className="win-input">
                  <option value="Efectivo USD">Efectivo USD</option>
                  <option value="Efectivo Bs.">Efectivo Bs.</option>
                  <option value="Pagomovil">Pagomovil</option>
                  <option value="Zelle">Zelle</option>
                </select>
             </div>
             <div className="form-group">
                <label>Monto a recibir:</label>
                <input ref={amountRef} type="number" value={paymentState.amount || ''} onChange={e => setPaymentState({...paymentState, amount: parseFloat(e.target.value) || 0})} className="win-input font-bold text-lg" />
             </div>
             <button className="btn btn-primary w-full py-2" onClick={() => {
                const usd = paymentState.method.includes('USD') || paymentState.method === 'Zelle' ? paymentState.amount : paymentState.amount / config.tasa;
                const bs = paymentState.method.includes('Bs.') || paymentState.method === 'Pagomovil' ? paymentState.amount : paymentState.amount * config.tasa;
                const newPays = [...paymentState.payments, { method: paymentState.method, usd, bs }];
                setPaymentState({...paymentState, payments: newPays, totalPaidUsd: newPays.reduce((s, p) => s + p.usd, 0), amount: 0});
             }}>➕ AÑADIR PAGO</button>
             <div className="win-window p-4 bg-gray-300">
                <div className="flex justify-between font-bold"><span>Restante:</span> <span>${Math.max(0, cart.reduce((s, i) => s + (i.precioUsd * i.cantidad * (1 + i.iva/100)), 0) - paymentState.totalPaidUsd).toFixed(2)}</span></div>
             </div>
          </div>
          <div className="modal-footer"><button className="btn" onClick={onClose}>Volver</button><button className="btn btn-success" onClick={finalizeSale}>💾 FINALIZAR</button></div>
        </div>
      )}

      {lastSale && (
        <div className="modal-window" style={{ width: '280px', background: '#fff' }} onClick={e => e.stopPropagation()}>
          <div className="p-4 font-mono text-[10px] text-center border-2 border-black">
            <h2 className="font-bold border-b-2 border-black pb-2 mb-2 uppercase">{config.nombreEmpresa}</h2>
            <div className="flex justify-between"><span>FACTURA:</span> <span>{lastSale.numero}</span></div>
            <div className="flex justify-between font-bold text-sm mt-4"><span>TOTAL:</span> <span>${lastSale.totalUsd.toFixed(2)}</span></div>
            <button className="btn btn-primary mt-6 w-full no-print" onClick={() => window.print()}>🖨️ IMPRIMIR</button>
            <button className="btn mt-2 w-full no-print" onClick={() => setLastSale(null)}>CERRAR</button>
          </div>
        </div>
      )}
    </div>
  );
}
