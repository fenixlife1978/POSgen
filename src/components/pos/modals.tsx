
'use client';

import React, { useState } from 'react';
import { Product, Client, Sale, Account, CartItem, Presupuesto } from '@/types/pos';

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
  presupuestos: Presupuesto[];
  setPresupuestos: React.Dispatch<React.SetStateAction<Presupuesto[]>>;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  config: any;
  notify: any;
  selectedRow: number;
}

export function Modals({ 
  activeModal, onClose, products, setProducts, clients, setClients, 
  sales, setSales, accounts, setAccounts, presupuestos, setPresupuestos,
  cart, setCart, config, notify, selectedRow 
}: ModalsProps) {
  
  const [productForm, setProductForm] = useState<Partial<Product>>({
    codigo: '',
    descripcion: '',
    costoUsd: 0,
    margen: 0,
    precioUsd: 0,
    precioBs: 0,
    iva: 16,
    stock: 0,
    stockMin: 5,
    marca: 'Universal',
    unidad: 'Unidad',
    categoria: 'Repuesto',
    departamento: 'General',
    isKit: false,
    stockPropio: true,
    activo: true
  });

  if (!activeModal) return null;

  const handleProductPriceCalc = (field: string, val: string) => {
    const num = parseFloat(val) || 0;
    let newForm = { ...productForm, [field]: num };
    const cost = field === 'costoUsd' ? num : (productForm.costoUsd || 0);

    if (field === 'margen') {
      const price = cost / (1 - num / 100);
      newForm.precioUsd = price;
      newForm.precioBs = price * config.tasa;
    } else if (field === 'precioUsd') {
      const margin = ((num - cost) / num) * 100;
      newForm.margen = margin;
      newForm.precioBs = num * config.tasa;
    } else if (field === 'precioBs') {
      const priceUsd = num / config.tasa;
      const margin = ((priceUsd - cost) / priceUsd) * 100;
      newForm.precioUsd = priceUsd;
      newForm.margen = margin;
    } else if (field === 'costoUsd') {
      const price = num / (1 - (productForm.margen || 0) / 100);
      newForm.precioUsd = price;
      newForm.precioBs = price * config.tasa;
    }
    setProductForm(newForm);
  };

  const saveProduct = () => {
    if (!productForm.codigo || !productForm.descripcion) {
      notify('Faltan campos obligatorios', 'error');
      return;
    }
    setProducts([...products, productForm as Product]);
    notify('✅ Producto guardado');
    onClose();
  };

  const confirmSale = () => {
    const saleNum = `F-${String(config.nextInvoice).padStart(4, '0')}`;
    const totalUsd = cart.reduce((s, i) => s + (i.precioUsd * i.cantidad * (1 + i.iva / 100)), 0);
    
    const newSale: Sale = {
      numero: saleNum,
      fecha: new Date().toISOString(),
      cliente: 'Consumidor Final',
      rif: '00000000-0',
      vendedor: config.vendedor,
      items: [...cart],
      subtotal: cart.reduce((s, i) => s + (i.precioUsd * i.cantidad), 0),
      iva: totalUsd - cart.reduce((s, i) => s + (i.precioUsd * i.cantidad), 0),
      totalUsd,
      totalBs: totalUsd * config.tasa,
      pago: 'efectivo_usd',
      recibidoUsd: totalUsd,
      recibidoBs: 0,
      cambioUsd: 0,
      referencia: '',
      credito: false,
      estado: 'Completada'
    };

    setSales([...sales, newSale]);
    
    // Update Stock
    const newProducts = [...products];
    cart.forEach(item => {
      const p = newProducts[item.productIndex];
      if (p) p.stock -= item.cantidad;
    });
    setProducts(newProducts);

    setCart([]);
    notify(`✅ Venta ${saleNum} procesada`);
    onClose();
  };

  const saveInventoryEntry = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const prodIdx = parseInt(formData.get('entProducto') as string);
    const qty = parseInt(formData.get('entCantidad') as string);
    const costo = parseFloat(formData.get('entCosto') as string);
    
    const newProducts = [...products];
    const p = newProducts[prodIdx];
    
    const currentStock = p.stock || 0;
    const currentCpp = p.cpp || p.costoUsd || 0;
    const newStock = currentStock + qty;
    const newCpp = ((currentStock * currentCpp) + (qty * costo)) / newStock;
    
    p.stock = newStock;
    p.cpp = newCpp;
    p.costoUsd = costo;
    
    setProducts(newProducts);
    notify('✅ Entrada registrada y CPP actualizado');
    onClose();
  };

  return (
    <div className={`modal-overlay ${activeModal ? 'active' : ''}`} onClick={onClose}>
      <div className="modal-window large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-titlebar">
          <span>{activeModal?.replace('modal', '')}</span>
          <span className="modal-close" onClick={onClose}>✕</span>
        </div>
        <div className="modal-body">
          {activeModal === 'modalProducto' && (
            <div className="space-y-4">
              <div className="form-row">
                <div className="form-group"><label>Código:</label><input type="text" value={productForm.codigo} onChange={e => setProductForm({...productForm, codigo: e.target.value})} /></div>
                <div className="form-group"><label>Descripción:</label><input type="text" value={productForm.descripcion} onChange={e => setProductForm({...productForm, descripcion: e.target.value})} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Costo USD:</label><input type="number" value={productForm.costoUsd} onChange={e => handleProductPriceCalc('costoUsd', e.target.value)} /></div>
                <div className="form-group"><label>Margen (%):</label><input type="number" value={productForm.margen} onChange={e => handleProductPriceCalc('margen', e.target.value)} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Precio USD:</label><input type="number" value={productForm.precioUsd} onChange={e => handleProductPriceCalc('precioUsd', e.target.value)} /></div>
                <div className="form-group"><label>Precio BS:</label><input type="number" value={productForm.precioBs} onChange={e => handleProductPriceCalc('precioBs', e.target.value)} /></div>
              </div>
              <div className="modal-footer">
                 <button className="btn" onClick={onClose}>Cancelar</button>
                 <button className="btn btn-success" onClick={saveProduct}>💾 Guardar</button>
              </div>
            </div>
          )}

          {activeModal === 'modalEntrada' && (
            <form onSubmit={saveInventoryEntry} className="space-y-4">
              <div className="form-group">
                <label>Producto:</label>
                <select name="entProducto" className="w-full">
                  {products.map((p, i) => (
                    <option key={i} value={i}>{p.codigo} - {p.descripcion}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Cantidad:</label><input type="number" name="entCantidad" required /></div>
                <div className="form-group"><label>Costo Unit USD:</label><input type="number" name="entCosto" step="0.01" required /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={onClose}>Cancelar</button>
                <button type="submit" className="btn btn-success">📥 Registrar</button>
              </div>
            </form>
          )}

          {activeModal === 'modalProcesar' && (
            <div>
               <h3>Confirmar Venta</h3>
               <p>Total a pagar: <strong>${cart.reduce((s, i) => s + (i.precioUsd * i.cantidad * (1 + i.iva / 100)), 0).toFixed(2)}</strong></p>
               <div className="modal-footer">
                  <button className="btn" onClick={onClose}>Cancelar</button>
                  <button className="btn btn-success" onClick={confirmSale}>✅ Confirmar</button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
