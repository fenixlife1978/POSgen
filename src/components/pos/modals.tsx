
'use client';

import React, { useState, useEffect } from 'react';
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
  
  const [activeTab, setActiveTab] = useState('basicos');
  const [productForm, setProductForm] = useState<Partial<Product>>({
    codigo: '',
    descripcion: '',
    barcode: '',
    referencia: '',
    marca: 'Universal',
    unidad: 'Unidad',
    moneda: 'base',
    departamento: 'General',
    grupo: '',
    subgrupo: '',
    ubicacion: '',
    costoAnterior: 0,
    costoActual: 0,
    costoPromedio: 0,
    utilidadPorcentaje: 0,
    precio1: 0,
    precio2: 0,
    precio3: 0,
    ivaAlicuota: 16,
    permiteDescuento: true,
    activo: true,
    manejaSeriales: false,
    manejaLotes: false,
    manejaTallasColores: false,
    manejaPeso: false,
    isKit: false,
    stockPropio: true,
    stock: 0,
    stockMin: 5,
    categoria: 'Repuesto'
  });

  // Efecto para limpiar formulario al abrir/cerrar
  useEffect(() => {
    if (activeModal === 'modalProducto') {
      setActiveTab('basicos');
    }
  }, [activeModal]);

  const calculatePriceFromUtility = (cost: number, utility: number) => {
    if (utility >= 100) return cost;
    return cost / (1 - utility / 100);
  };

  const calculateUtilityFromPrice = (cost: number, price: number) => {
    if (price <= 0) return 0;
    return ((price - cost) / price) * 100;
  };

  const handlePriceRecalc = (field: string, val: string) => {
    const value = parseFloat(val) || 0;
    const currentCost = productForm.costoPromedio || 0;
    let newForm = { ...productForm, [field]: value };

    if (field === 'utilidadPorcentaje') {
      const newPrice = calculatePriceFromUtility(currentCost, value);
      newForm.precio1 = newPrice;
    } else if (field === 'precio1') {
      const newUtility = calculateUtilityFromPrice(currentCost, value);
      newForm.utilidadPorcentaje = newUtility;
    } else if (field === 'costoActual' || field === 'costoPromedio') {
      const costToUse = field === 'costoPromedio' ? value : (productForm.costoPromedio || 0);
      newForm.precio1 = calculatePriceFromUtility(costToUse, productForm.utilidadPorcentaje || 0);
    }

    setProductForm(newForm);
  };

  const saveProduct = () => {
    if (!productForm.codigo || !productForm.descripcion) {
      notify('Código y Descripción son obligatorios', 'error');
      return;
    }
    setProducts([...products, productForm as Product]);
    notify('✅ Producto registrado exitosamente');
    onClose();
  };

  if (!activeModal) return null;

  return (
    <div className={`modal-overlay ${activeModal ? 'active' : ''}`} onClick={onClose}>
      <div className={`modal-window ${activeModal === 'modalProducto' ? 'xlarge' : 'large'}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-titlebar">
          <span>{activeModal === 'modalProducto' ? '📦 Ficha Maestra de Producto' : activeModal?.replace('modal', '')}</span>
          <span className="modal-close" onClick={onClose}>✕</span>
        </div>
        
        <div className="modal-body">
          {activeModal === 'modalProducto' && (
            <div className="flex flex-col h-full">
              {/* Tab Navigation */}
              <div className="nav-tabs mb-4">
                <div className={`nav-tab ${activeTab === 'basicos' ? 'active' : ''}`} onClick={() => setActiveTab('basicos')}>Identificación</div>
                <div className={`nav-tab ${activeTab === 'clasificacion' ? 'active' : ''}`} onClick={() => setActiveTab('clasificacion')}>Clasificación</div>
                <div className={`nav-tab ${activeTab === 'precios' ? 'active' : ''}`} onClick={() => setActiveTab('precios')}>Costos y Precios</div>
                <div className={`nav-tab ${activeTab === 'controles' ? 'active' : ''}`} onClick={() => setActiveTab('controles')}>Controles Especiales</div>
              </div>

              {/* Tab Content: Datos Básicos */}
              {activeTab === 'basicos' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Código:</label>
                      <input type="text" value={productForm.codigo} onChange={e => setProductForm({...productForm, codigo: e.target.value})} placeholder="Ej: AUTO-1001" />
                    </div>
                    <div className="form-group">
                      <label>Código de Barras:</label>
                      <input type="text" value={productForm.barcode} onChange={e => setProductForm({...productForm, barcode: e.target.value})} placeholder="Scan barcode..." />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Descripción Completa:</label>
                    <input type="text" value={productForm.descripcion} onChange={e => setProductForm({...productForm, descripcion: e.target.value})} placeholder="Nombre comercial del producto" />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Referencia / OEM:</label>
                      <input type="text" value={productForm.referencia} onChange={e => setProductForm({...productForm, referencia: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Marca:</label>
                      <select value={productForm.marca} onChange={e => setProductForm({...productForm, marca: e.target.value})}>
                        <option value="Universal">Universal</option>
                        <option value="Toyota">Toyota</option>
                        <option value="Ford">Ford</option>
                        <option value="Mobil">Mobil</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Unidad de Medida:</label>
                      <select value={productForm.unidad} onChange={e => setProductForm({...productForm, unidad: e.target.value})}>
                        <option value="Unidad">Unidad</option>
                        <option value="Kilo">Kilo</option>
                        <option value="Litro">Litro</option>
                        <option value="Caja">Caja</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Moneda de Transacción:</label>
                      <select value={productForm.moneda} onChange={e => setProductForm({...productForm, moneda: e.target.value as any})}>
                        <option value="base">Moneda Base (Bs)</option>
                        <option value="alterna">Divisa Alterna (USD)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content: Clasificación */}
              {activeTab === 'clasificacion' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Departamento:</label>
                      <select value={productForm.departamento} onChange={e => setProductForm({...productForm, departamento: e.target.value})}>
                        <option value="General">General</option>
                        <option value="Repuestos">Repuestos</option>
                        <option value="Lubricantes">Lubricantes</option>
                        <option value="Servicios">Servicios</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Grupo:</label>
                      <input type="text" value={productForm.grupo} onChange={e => setProductForm({...productForm, grupo: e.target.value})} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Ubicación Física (Almacén/Estante):</label>
                    <input type="text" value={productForm.ubicacion} onChange={e => setProductForm({...productForm, ubicacion: e.target.value})} placeholder="Ej: Pasillo 3, Nivel B" />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Stock Mínimo:</label>
                      <input type="number" value={productForm.stockMin} onChange={e => setProductForm({...productForm, stockMin: parseInt(e.target.value) || 0})} />
                    </div>
                    <div className="form-group">
                      <label>Stock Inicial:</label>
                      <input type="number" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: parseInt(e.target.value) || 0})} />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content: Costos y Precios */}
              {activeTab === 'precios' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="form-row bg-blue-100 p-3 border border-blue-200 rounded">
                    <div className="form-group">
                      <label>Costo Anterior:</label>
                      <input type="number" value={productForm.costoAnterior} disabled className="bg-gray-100" />
                    </div>
                    <div className="form-group">
                      <label>Costo Actual:</label>
                      <input type="number" value={productForm.costoActual} onChange={e => handlePriceRecalc('costoActual', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Costo Promedio (CPP):</label>
                      <input type="number" value={productForm.costoPromedio} onChange={e => handlePriceRecalc('costoPromedio', e.target.value)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 p-4 border-2 border-gray-300 bg-gray-50">
                    <div className="space-y-4">
                      <div className="form-group">
                        <label className="text-blue-800">Porcentaje de Utilidad (%):</label>
                        <input 
                          type="number" 
                          value={productForm.utilidadPorcentaje} 
                          onChange={e => handlePriceRecalc('utilidadPorcentaje', e.target.value)}
                          className="text-lg font-bold border-blue-400"
                        />
                      </div>
                      <div className="form-group">
                        <label>Precio 1 (Detal):</label>
                        <input 
                          type="number" 
                          value={productForm.precio1} 
                          onChange={e => handlePriceRecalc('precio1', e.target.value)}
                          className="text-xl font-black text-green-700 border-green-400"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="form-group">
                        <label>Precio 2 (Mayor):</label>
                        <input type="number" value={productForm.precio2} onChange={e => setProductForm({...productForm, precio2: parseFloat(e.target.value) || 0})} />
                      </div>
                      <div className="form-group">
                        <label>Precio 3 (Corporativo):</label>
                        <input type="number" value={productForm.precio3} onChange={e => setProductForm({...productForm, precio3: parseFloat(e.target.value) || 0})} />
                      </div>
                      <div className="form-group">
                        <label>Alícuota IVA (%):</label>
                        <select value={productForm.ivaAlicuota} onChange={e => setProductForm({...productForm, ivaAlicuota: parseFloat(e.target.value) || 0})}>
                          <option value="16">General (16%)</option>
                          <option value="8">Reducida (8%)</option>
                          <option value="0">Exento (0%)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] italic text-gray-500">* El sistema utiliza Markup sobre venta para el cálculo de precios.</p>
                </div>
              )}

              {/* Tab Content: Controles Especiales */}
              {activeTab === 'controles' && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-200">
                  <div className="space-y-2 border p-3 bg-white">
                    <label className="checkbox-label"><input type="checkbox" checked={productForm.permiteDescuento} onChange={e => setProductForm({...productForm, permiteDescuento: e.target.checked})} /> Permite Descuento en POS</label>
                    <label className="checkbox-label"><input type="checkbox" checked={productForm.activo} onChange={e => setProductForm({...productForm, activo: e.target.checked})} /> Producto Activo</label>
                    <label className="checkbox-label"><input type="checkbox" checked={productForm.manejaSeriales} onChange={e => setProductForm({...productForm, manejaSeriales: e.target.checked})} /> Manejo de Seriales</label>
                    <label className="checkbox-label"><input type="checkbox" checked={productForm.manejaPeso} onChange={e => setProductForm({...productForm, manejaPeso: e.target.checked})} /> Manejo de Balanza / Peso</label>
                  </div>
                  <div className="space-y-2 border p-3 bg-white">
                    <label className="checkbox-label"><input type="checkbox" checked={productForm.manejaLotes} onChange={e => setProductForm({...productForm, manejaLotes: e.target.checked})} /> Manejo de Lotes y Vencimiento</label>
                    {productForm.manejaLotes && (
                      <input type="date" className="mt-1" value={productForm.fechaVencimiento} onChange={e => setProductForm({...productForm, fechaVencimiento: e.target.value})} />
                    )}
                    <label className="checkbox-label"><input type="checkbox" checked={productForm.manejaTallasColores} onChange={e => setProductForm({...productForm, manejaTallasColores: e.target.checked})} /> Manejo de Tallas y Colores</label>
                    <div className="form-group mt-2">
                      <label>Contenido por Empaque:</label>
                      <input type="number" value={productForm.capacidadContenido} onChange={e => setProductForm({...productForm, capacidadContenido: parseFloat(e.target.value) || 0})} placeholder="Ej: 24 unidades x caja" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Otros modales existentes... */}
          {activeModal === 'modalProcesar' && (
            <div className="space-y-4">
              <div id="procesarSummary" className="bg-gray-100 border border-gray-400 p-4">
                <div className="flex justify-between font-bold text-lg border-b pb-2 mb-2">
                  <span>Total a Pagar:</span>
                  <span className="text-blue-900">${cart.reduce((s, i) => s + (i.precioUsd * i.cantidad * (1 + i.iva / 100)), 0).toFixed(2)}</span>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn" onClick={onClose}>Cancelar</button>
                <button className="btn btn-success" onClick={() => notify('Venta procesada')}>✅ Confirmar</button>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancelar</button>
          {activeModal === 'modalProducto' && (
            <button className="btn btn-success" onClick={saveProduct}>💾 Guardar Ficha</button>
          )}
        </div>
      </div>
    </div>
  );
}
