
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Product, Client, Sale, Account, CartItem, Presupuesto, User, InventoryMovement } from '@/types/pos';
import { v4 as uuidv4 } from 'uuid';

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

  // --- AJUSTE FORM STATE ---
  const [adjustmentForm, setAdjustmentForm] = useState({
    codigo: '', cantidad: 0, motivo: 'Inventario Inicial', usuario: config.vendedor
  });

  useEffect(() => {
    if (activeModal === 'modalProducto' && editingId !== null) {
      const prod = products[editingId];
      if (prod) setProductForm({ ...prod });
    } else if (activeModal === 'modalProducto') {
      setProductForm(initialProduct);
    }
    
    if (activeModal === 'modalAjuste') {
      setAdjustmentForm({ codigo: '', cantidad: 0, motivo: 'Conteo Físico', usuario: config.vendedor });
    }

    if (activeModal === 'modalEntrada') {
      setPurchaseForm({
        proveedor: '', nroFactura: '', tasa: config.tasa, tipo: 'Contado', diasCredito: 0, 
        pagoContadoUsd: 0, pagoContadoBs: 0, items: [] as any[]
      });
    }
  }, [activeModal, editingId, products, config]);

  // Markup sobre VENTA: Precio = Costo / (1 - Utilidad/100)
  const handleProductPriceCalc = (field: string, val: number) => {
    let newForm = { ...productForm };
    const cost = newForm.costoPromedio;

    if (field === 'utilidadPorcentaje') {
      newForm.utilidadPorcentaje = val;
      newForm.precio1 = val >= 100 ? cost : cost / (1 - val/100);
    } else if (field === 'precio1') {
      newForm.precio1 = val;
      newForm.utilidadPorcentaje = val > 0 ? (1 - (cost / val)) * 100 : 0;
    } else if (field === 'costoPromedio') {
      newForm.costoPromedio = val;
      newForm.precio1 = newForm.utilidadPorcentaje >= 100 ? val : val / (1 - newForm.utilidadPorcentaje/100);
    }
    setProductForm(newForm);
  };

  const saveProduct = () => {
    if (!productForm.codigo || !productForm.nombre) return notify('Código y Nombre obligatorios', 'error');
    if (editingId !== null) {
      const updated = [...products];
      updated[editingId] = productForm;
      setProducts(updated);
      notify('✅ Producto actualizado');
    } else {
      setProducts([...products, productForm]);
      notify('✅ Producto agregado al maestro');
    }
    onClose();
  };

  const finalizePurchase = () => {
    if (!purchaseForm.proveedor || purchaseForm.items.length === 0) return notify('Faltan datos en la compra', 'error');
    
    const updatedProducts = [...products];
    const newMovements: InventoryMovement[] = [];

    purchaseForm.items.forEach(item => {
      const pIdx = updatedProducts.findIndex(p => p.codigo === item.codigo);
      if (pIdx >= 0) {
        const p = updatedProducts[pIdx];
        const stockPrev = p.stock;
        const cant = parseFloat(item.cantidad);
        const costoN = parseFloat(item.costo);

        // CPP: ((Stock actual * Costo actual) + (Cant comprada * Costo compra)) / (Stock actual + Cant comprada)
        const nuevoCostoPromedio = ((p.stock * p.costoPromedio) + (cant * costoN)) / (p.stock + cant);
        
        p.costoAnterior = p.costoActual;
        p.costoActual = costoN;
        p.costoPromedio = nuevoCostoPromedio;
        p.stock += cant;

        // Recalcular precios base a nuevo costo
        p.precio1 = p.utilidadPorcentaje >= 100 ? p.costoPromedio : p.costoPromedio / (1 - p.utilidadPorcentaje/100);

        newMovements.push({
          id: uuidv4(),
          fecha: new Date().toISOString(),
          codigoProducto: p.codigo,
          tipo: 'ENTRADA',
          cantidad: cant,
          stockPrevio: stockPrev,
          stockNuevo: p.stock,
          costo: costoN,
          referencia: purchaseForm.nroFactura,
          comentario: `Compra a ${purchaseForm.proveedor}`,
          usuario: config.vendedor
        });
      }
    });

    setProducts(updatedProducts);
    setMovements([...movements, ...newMovements]);
    notify('✅ Compra procesada e inventario actualizado');
    onClose();
  };

  const finalizeAdjustment = () => {
    const pIdx = products.findIndex(p => p.codigo === adjustmentForm.codigo);
    if (pIdx < 0) return notify('Producto no encontrado', 'error');
    
    const p = products[pIdx];
    const stockPrev = p.stock;
    const stockN = stockPrev + adjustmentForm.cantidad;

    const movement: InventoryMovement = {
      id: uuidv4(),
      fecha: new Date().toISOString(),
      codigoProducto: p.codigo,
      tipo: 'AJUSTE',
      cantidad: adjustmentForm.cantidad,
      stockPrevio: stockPrev,
      stockNuevo: stockN,
      costo: p.costoPromedio,
      referencia: 'AJUSTE-MANUAL',
      comentario: adjustmentForm.motivo,
      usuario: adjustmentForm.usuario
    };

    const updated = [...products];
    updated[pIdx].stock = stockN;
    
    setProducts(updated);
    setMovements([...movements, movement]);
    notify(`✅ Ajuste de stock procesado para ${p.codigo}`);
    onClose();
  };

  if (!activeModal) return null;

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-window xlarge" onClick={e => e.stopPropagation()} style={{ width: activeModal === 'modalEntrada' ? '900px' : '750px' }}>
        <div className="modal-titlebar">
          <span>{activeModal.toUpperCase()}</span>
          <span className="modal-close" onClick={onClose}>✕</span>
        </div>
        <div className="modal-body">
          
          {/* MODAL MAESTRO PRODUCTO */}
          {activeModal === 'modalProducto' && (
            <div className="space-y-4">
              <div className="settings-section">
                <h3>🆔 Identificación y Básicos</h3>
                <div className="form-row">
                  <div className="form-group flex-1"><label>Código Maestro:</label><input value={productForm.codigo} onChange={e => setProductForm({...productForm, codigo: e.target.value})} /></div>
                  <div className="form-group flex-1"><label>Código de Barras:</label><input value={productForm.barcode} onChange={e => setProductForm({...productForm, barcode: e.target.value})} /></div>
                  <div className="form-group flex-2"><label>Nombre del Producto:</label><input value={productForm.nombre} onChange={e => setProductForm({...productForm, nombre: e.target.value})} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group flex-1"><label>Referencia / OEM:</label><input value={productForm.referencia} onChange={e => setProductForm({...productForm, referencia: e.target.value})} /></div>
                  <div className="form-group flex-1"><label>Marca:</label><select value={productForm.marca} onChange={e => setProductForm({...productForm, marca: e.target.value})}>{marcas.map(m => <option key={m}>{m}</option>)}</select></div>
                  <div className="form-group flex-1"><label>Unidad:</label><select value={productForm.unidad} onChange={e => setProductForm({...productForm, unidad: e.target.value})}>{unidades.map(u => <option key={u}>{u}</option>)}</select></div>
                </div>
              </div>

              <div className="settings-section">
                <h3>💰 Estructura de Costos y Markup (Financiero)</h3>
                <div className="form-row">
                  <div className="form-group"><label>Costo Promedio:</label><input type="number" value={productForm.costoPromedio} onChange={e => handleProductPriceCalc('costoPromedio', parseFloat(e.target.value) || 0)} /></div>
                  <div className="form-group" style={{ background: '#f0f0f0', padding: '4px' }}><label>Margen Ganancia %:</label><input type="number" value={productForm.utilidadPorcentaje} onChange={e => handleProductPriceCalc('utilidadPorcentaje', parseFloat(e.target.value) || 0)} /></div>
                  <div className="form-group"><label>PVP Detal USD:</label><input type="number" value={productForm.precio1} onChange={e => handleProductPriceCalc('precio1', parseFloat(e.target.value) || 0)} /></div>
                  <div className="form-group"><label>PVP Detal BS:</label><input type="number" value={productForm.precio1 * config.tasa} readOnly style={{ background: '#eee' }} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Stock Inicial:</label><input type="number" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: parseFloat(e.target.value) || 0})} /></div>
                  <div className="form-group"><label>Stock Mínimo:</label><input type="number" value={productForm.stockMin} onChange={e => setProductForm({...productForm, stockMin: parseFloat(e.target.value) || 0})} /></div>
                  <div className="form-group"><label>Ubicación Física:</label><input value={productForm.ubicacion} onChange={e => setProductForm({...productForm, ubicacion: e.target.value})} /></div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-primary" onClick={onClose}>Cancelar</button>
                <button className="btn btn-success" onClick={saveProduct}>Guardar Producto</button>
              </div>
            </div>
          )}

          {/* MODAL ENTRADA POR COMPRA */}
          {activeModal === 'modalEntrada' && (
            <div className="space-y-4">
              <div className="header-section">
                <div className="form-row">
                  <div className="form-group flex-1"><label>Proveedor:</label><input value={purchaseForm.proveedor} onChange={e => setPurchaseForm({...purchaseForm, proveedor: e.target.value})} /></div>
                  <div className="form-group"><label>Factura Nro:</label><input value={purchaseForm.nroFactura} onChange={e => setPurchaseForm({...purchaseForm, nroFactura: e.target.value})} /></div>
                  <div className="form-group"><label>Tasa Compra:</label><input type="number" value={purchaseForm.tasa} onChange={e => setPurchaseForm({...purchaseForm, tasa: parseFloat(e.target.value)})} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Tipo Compra:</label><select value={purchaseForm.tipo} onChange={e => setPurchaseForm({...purchaseForm, tipo: e.target.value})}><option>Contado</option><option>Crédito</option><option>Mixto</option></select></div>
                  {purchaseForm.tipo !== 'Contado' && <div className="form-group"><label>Días Crédito:</label><input type="number" value={purchaseForm.diasCredito} onChange={e => setPurchaseForm({...purchaseForm, diasCredito: parseInt(e.target.value)})} /></div>}
                </div>
              </div>

              <div className="win-window p-2" style={{ background: '#fff' }}>
                <div className="form-row items-end">
                  <div className="form-group flex-2"><label>Producto:</label><select id="buyProd" className="win-input"><option value="">Seleccione...</option>{products.map(p => <option key={p.codigo} value={p.codigo}>{p.nombre} ({p.codigo})</option>)}</select></div>
                  <div className="form-group"><label>Cant:</label><input type="number" id="buyQty" defaultValue="1" className="win-input" style={{ width: '60px' }} /></div>
                  <div className="form-group"><label>Costo USD:</label><input type="number" id="buyCost" defaultValue="0" className="win-input" style={{ width: '80px' }} /></div>
                  <button className="btn" onClick={() => {
                    const code = (document.getElementById('buyProd') as HTMLSelectElement).value;
                    const qty = parseFloat((document.getElementById('buyQty') as HTMLInputElement).value);
                    const cost = parseFloat((document.getElementById('buyCost') as HTMLInputElement).value);
                    if (!code || qty <= 0) return;
                    setPurchaseForm({...purchaseForm, items: [...purchaseForm.items, { codigo: code, cantidad: qty, costo: cost }]});
                  }}>➕ Añadir</button>
                  <button className="btn btn-primary" onClick={() => onOpenModal('modalProducto')}>🆕 Nuevo Item</button>
                </div>

                <div className="table-responsive mt-2" style={{ maxHeight: '150px' }}>
                  <table className="data-table">
                    <thead><tr><th>Código</th><th>Cant</th><th>Costo U.</th><th>Total</th><th>Acción</th></tr></thead>
                    <tbody>
                      {purchaseForm.items.map((it, i) => (
                        <tr key={i}>
                          <td>{it.codigo}</td><td>{it.cantidad}</td><td>${it.costo}</td><td>${(it.cantidad * it.costo).toFixed(2)}</td>
                          <td><button onClick={() => setPurchaseForm({...purchaseForm, items: purchaseForm.items.filter((_, idx) => idx !== i)})}>❌</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="win-window p-4" style={{ background: '#000', color: '#0f0', display: 'flex', justifyContent: 'space-between' }}>
                <div>TOTAL COMPRA: <span style={{ fontSize: '24px' }}>${purchaseForm.items.reduce((s,i) => s + (i.cantidad * i.costo), 0).toFixed(2)}</span></div>
                <div style={{ textAlign: 'right' }}>Equiv. Bs: <span style={{ fontSize: '20px' }}>Bs. {(purchaseForm.items.reduce((s,i) => s + (i.cantidad * i.costo), 0) * purchaseForm.tasa).toFixed(2)}</span></div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-success w-full" onClick={finalizePurchase}>PROCESAR COMPRA E INVENTARIO</button>
              </div>
            </div>
          )}

          {/* MODAL AJUSTE DE STOCK */}
          {activeModal === 'modalAjuste' && (
            <div className="space-y-4">
              <div className="win-window p-4">
                <div className="form-group"><label>Producto:</label><select value={adjustmentForm.codigo} onChange={e => setAdjustmentForm({...adjustmentForm, codigo: e.target.value})}><option value="">Seleccione...</option>{products.map(p => <option key={p.codigo} value={p.codigo}>{p.nombre} ({p.codigo}) | Stock: {p.stock}</option>)}</select></div>
                <div className="form-group"><label>Cantidad a Ajustar (use - para restar):</label><input type="number" value={adjustmentForm.cantidad} onChange={e => setAdjustmentForm({...adjustmentForm, cantidad: parseFloat(e.target.value) || 0})} /></div>
                <div className="form-group"><label>Motivo del Ajuste:</label><input value={adjustmentForm.motivo} onChange={e => setAdjustmentForm({...adjustmentForm, motivo: e.target.value})} /></div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-success w-full" onClick={finalizeAdjustment}>REALIZAR AJUSTE</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
