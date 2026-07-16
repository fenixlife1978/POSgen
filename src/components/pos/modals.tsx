
'use client';

import React, { useState, useEffect } from 'react';
import { Product, Client, Sale, Account, CartItem, Presupuesto, User } from '@/types/pos';

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
}

export function Modals({ 
  activeModal, onClose, products, setProducts, clients, setClients, 
  sales, setSales, accounts, setAccounts, cart, setCart, 
  config, setConfig, notify, editingId, users, setUsers 
}: ModalsProps) {
  
  const [marcas] = useState(['Universal', 'Toyota', 'Ford', 'Mobil', 'Castrol', 'Fram', 'Mobil 1']);
  const [unidades] = useState(['Unidad', 'Kilo', 'Litro', 'Caja', 'Galón']);
  const [categorias] = useState(['Repuesto', 'Lubricante', 'Servicio', 'Accesorio']);
  const [departamentos] = useState(['General', 'Frenos', 'Motor', 'Suspensión']);

  // --- PRODUCT FORM STATE ---
  const initialProduct: Product = {
    codigo: '', barcode: '', nombre: '', descripcion: '', referencia: '', marca: 'Universal',
    unidad: 'Unidad', moneda: 'base', departamento: 'General', categoria: 'Repuesto',
    ubicacion: '', stockMin: 5, stock: 0, costoAnterior: 0, costoActual: 0, costoPromedio: 0,
    utilidadPorcentaje: 0, precio1: 0, precio2: 0, precio3: 0, precio4: 0, ivaAlicuota: 16,
    permiteDescuento: true, activo: true, manejaSeriales: false, manejaLotes: false,
    manejaTallasColores: false, manejaPeso: false, isKit: false, stockPropio: true,
    kitComponents: [], iva: 16
  };
  const [productForm, setProductForm] = useState<Product>(initialProduct);

  // --- CLIENT FORM STATE ---
  const [clientForm, setClientForm] = useState<Client>({
    tipoRif: 'V', rifNum: '', nombre: '', telefono: '', email: '', direccion: '', tipo: 'Regular', credito: 0, saldo: 0
  });

  // --- USER FORM STATE ---
  const [userForm, setUserForm] = useState<User>({
    id: '', username: '', password: '', name: '', role: 'Cajero', active: true
  });

  // --- PURCHASE FORM STATE ---
  const [purchaseForm, setPurchaseForm] = useState({
    proveedor: '', nroFactura: '', tasa: config.tasa, tipo: 'Contado', diasCredito: 0, pagoContadoUsd: 0, pagoContadoBs: 0, items: [] as any[]
  });

  useEffect(() => {
    if (activeModal === 'modalProducto' && editingId !== null) {
      const prod = products[editingId];
      if (prod) setProductForm({ ...prod });
    } else if (activeModal === 'modalProducto') {
      setProductForm(initialProduct);
    }

    if (activeModal === 'modalCliente' && editingId !== null) {
      const cli = clients[editingId];
      if (cli) setClientForm({ ...cli });
    } else if (activeModal === 'modalCliente') {
      setClientForm({ tipoRif: 'V', rifNum: '', nombre: '', telefono: '', email: '', direccion: '', tipo: 'Regular', credito: 0, saldo: 0 });
    }
  }, [activeModal, editingId, products, clients]);

  const handleProductCalc = (field: string, val: number) => {
    const cost = field === 'costoPromedio' ? val : productForm.costoPromedio;
    let newForm = { ...productForm };
    if (field === 'costoPromedio') newForm.costoPromedio = val;
    
    if (field === 'utilidadPorcentaje' || field === 'costoPromedio') {
      const u = (field === 'utilidadPorcentaje' ? val : productForm.utilidadPorcentaje) / 100;
      newForm.precio1 = u >= 1 ? cost : cost / (1 - u);
      if (field === 'utilidadPorcentaje') newForm.utilidadPorcentaje = val;
    } else if (field === 'precio1') {
      newForm.precio1 = val;
      newForm.utilidadPorcentaje = val > 0 ? (1 - (cost / val)) * 100 : 0;
    } else if (field === 'precioBs') {
      const pUsd = val / config.tasa;
      newForm.precio1 = pUsd;
      newForm.utilidadPorcentaje = pUsd > 0 ? (1 - (cost / pUsd)) * 100 : 0;
    }
    setProductForm(newForm);
  };

  const saveProduct = () => {
    if (!productForm.codigo || !productForm.nombre) return notify('Código y Nombre obligatorios', 'error');
    if (editingId !== null) {
      const updated = [...products];
      updated[editingId] = productForm;
      setProducts(updated);
      notify('Producto actualizado');
    } else {
      setProducts([...products, productForm]);
      notify('Producto agregado');
    }
    onClose();
  };

  const saveClient = () => {
    if (!clientForm.nombre || !clientForm.rifNum) return notify('Nombre y RIF obligatorios', 'error');
    if (editingId !== null) {
      const updated = [...clients];
      updated[editingId] = clientForm;
      setClients(updated);
      notify('Cliente actualizado');
    } else {
      setClients([...clients, clientForm]);
      notify('Cliente agregado');
    }
    onClose();
  };

  const finalizeSale = () => {
    if (cart.length === 0) return notify('Carrito vacío', 'warning');
    const subtotal = cart.reduce((s, i) => s + (i.precioUsd * i.cantidad), 0);
    const totalIva = cart.reduce((s, i) => s + (i.precioUsd * i.cantidad * (i.iva/100)), 0);
    const totalUsd = subtotal + totalIva;

    const newSale: Sale = {
      numero: 'F-' + String(config.nextInvoice).padStart(5, '0'),
      fecha: new Date().toISOString(),
      cliente: 'Consumidor Final',
      rif: '0',
      vendedor: config.vendedor,
      items: [...cart],
      subtotal, iva: totalIva, totalUsd, totalBs: totalUsd * config.tasa,
      pago: 'Efectivo', recibidoUsd: totalUsd, recibidoBs: 0, cambioUsd: 0, referencia: '',
      credito: false, estado: 'Completada'
    };

    // Update Stock
    const updatedProducts = [...products];
    cart.forEach(item => {
      if (item.productIndex >= 0) {
        updatedProducts[item.productIndex].stock -= item.cantidad;
      }
    });

    setSales([...sales, newSale]);
    setProducts(updatedProducts);
    setCart([]);
    setConfig({...config, nextInvoice: config.nextInvoice + 1});
    notify('✅ Venta procesada exitosamente');
    onClose();
  };

  if (!activeModal) return null;

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-window xlarge" onClick={e => e.stopPropagation()}>
        <div className="modal-titlebar">
          <span>{activeModal.replace('modal', ' ')}</span>
          <span className="modal-close" onClick={onClose}>✕</span>
        </div>
        <div className="modal-body">
          {activeModal === 'modalProducto' && (
            <div className="space-y-4">
              <div className="win-window p-4">
                <div className="form-row">
                  <div className="form-group"><label>Código:</label><input value={productForm.codigo} onChange={e => setProductForm({...productForm, codigo: e.target.value})} /></div>
                  <div className="form-group flex-[2]"><label>Nombre:</label><input value={productForm.nombre} onChange={e => setProductForm({...productForm, nombre: e.target.value})} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Costo Promedio:</label><input type="number" value={productForm.costoPromedio} onChange={e => handleProductCalc('costoPromedio', parseFloat(e.target.value) || 0)} /></div>
                  <div className="form-group"><label>Utilidad %:</label><input type="number" value={productForm.utilidadPorcentaje} onChange={e => handleProductCalc('utilidadPorcentaje', parseFloat(e.target.value) || 0)} /></div>
                  <div className="form-group"><label>Precio USD:</label><input type="number" value={productForm.precio1} onChange={e => handleProductCalc('precio1', parseFloat(e.target.value) || 0)} /></div>
                  <div className="form-group"><label>Precio BS:</label><input type="number" value={productForm.precio1 * config.tasa} onChange={e => handleProductCalc('precioBs', parseFloat(e.target.value) || 0)} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Existencia:</label><input type="number" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: parseInt(e.target.value) || 0})} /></div>
                  <div className="form-group"><label>Mínimo:</label><input type="number" value={productForm.stockMin} onChange={e => setProductForm({...productForm, stockMin: parseInt(e.target.value) || 0})} /></div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-success" onClick={saveProduct}>Guardar Producto</button>
              </div>
            </div>
          )}

          {activeModal === 'modalCliente' && (
            <div className="space-y-4">
              <div className="win-window p-4">
                <div className="form-row">
                  <div className="form-group"><label>Tipo:</label><select value={clientForm.tipoRif} onChange={e => setClientForm({...clientForm, tipoRif: e.target.value})}><option>V</option><option>J</option><option>G</option><option>E</option></select></div>
                  <div className="form-group"><label>RIF/Cédula:</label><input value={clientForm.rifNum} onChange={e => setClientForm({...clientForm, rifNum: e.target.value})} /></div>
                </div>
                <div className="form-group"><label>Nombre / Razón Social:</label><input value={clientForm.nombre} onChange={e => setClientForm({...clientForm, nombre: e.target.value})} /></div>
                <div className="form-group"><label>Dirección:</label><input value={clientForm.direccion} onChange={e => setClientForm({...clientForm, direccion: e.target.value})} /></div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-success" onClick={saveClient}>Guardar Cliente</button>
              </div>
            </div>
          )}

          {activeModal === 'modalProcesar' && (
            <div className="space-y-4">
              <div className="win-window p-8 bg-black text-white text-center">
                <p className="text-xl">TOTAL A PAGAR</p>
                <div className="text-5xl font-black text-yellow-400">
                  ${cart.reduce((s, i) => s + (i.precioUsd * i.cantidad * (1 + i.iva/100)), 0).toFixed(2)}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-success btn-procesar w-full" onClick={finalizeSale}>FINALIZAR VENTA (F12)</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
