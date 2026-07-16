
'use client';

import React, { useState } from 'react';
import { Product, InventoryMovement } from '@/types/pos';

interface InventoryModuleProps {
  active: boolean;
  onOpenModal: (id: string, dataId?: string | number) => void;
  products: Product[];
  movements: InventoryMovement[];
}

export function InventoryModule({ active, onOpenModal, products, movements }: InventoryModuleProps) {
  const [activeReport, setActiveReport] = useState<'table' | 'kardex' | 'adjustments'>('table');
  const [selectedProductKardex, setSelectedProductKardex] = useState<string | null>(null);
  const [adjFilter, setAdjFilter] = useState({ type: 'hoy', from: '', to: '' });

  if (!active) return null;

  const totalValor = products.reduce((s, p) => s + (p.stock * p.costoPromedio), 0);
  const stockBajo = products.filter(p => p.stock <= p.stockMin && p.stock > 0);
  const agotados = products.filter(p => p.stock === 0);

  const renderKardex = () => {
    const prod = products.find(p => p.codigo === selectedProductKardex);
    const prodMovements = movements.filter(m => m.codigoProducto === selectedProductKardex).sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="toolbar">
          <button onClick={() => setActiveReport('table')}>⬅️ Volver</button>
          <div style={{ marginLeft: 'auto', fontWeight: 'bold' }}>
            Kardex: {prod?.nombre} ({prod?.codigo}) | Stock Actual: {prod?.stock}
          </div>
        </div>
        <div className="table-responsive" style={{ maxHeight: 'calc(100vh - 350px)' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Concepto / Ref</th>
                <th style={{ textAlign: 'center' }}>Entrada</th>
                <th style={{ textAlign: 'center' }}>Salida</th>
                <th style={{ textAlign: 'center' }}>Stock Prev.</th>
                <th style={{ textAlign: 'center' }}>Stock Nuevo</th>
                <th>Costo Ref.</th>
              </tr>
            </thead>
            <tbody>
              {prodMovements.map(m => (
                <tr key={m.id}>
                  <td>{new Date(m.fecha).toLocaleString()}</td>
                  <td style={{ fontWeight: 'bold' }}>{m.tipo}</td>
                  <td>{m.referencia} - {m.comentario}</td>
                  <td style={{ textAlign: 'center', color: 'green', fontWeight: 'bold' }}>{(m.tipo === 'ENTRADA' || (m.tipo === 'AJUSTE' && m.cantidad > 0)) ? Math.abs(m.cantidad) : '-'}</td>
                  <td style={{ textAlign: 'center', color: 'red', fontWeight: 'bold' }}>{(m.tipo === 'SALIDA' || m.tipo === 'VENTA' || (m.tipo === 'AJUSTE' && m.cantidad < 0)) ? Math.abs(m.cantidad) : '-'}</td>
                  <td style={{ textAlign: 'center' }}>{m.stockPrevio}</td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{m.stockNuevo}</td>
                  <td>${m.costo.toFixed(2)}</td>
                </tr>
              ))}
              {prodMovements.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>No hay movimientos registrados para este producto</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderAdjustments = () => {
    const today = new Date().toDateString();
    let filtered = movements.filter(m => m.tipo === 'AJUSTE');

    if (adjFilter.type === 'hoy') {
      filtered = filtered.filter(m => new Date(m.fecha).toDateString() === today);
    } else if (adjFilter.type === 'rango' && adjFilter.from && adjFilter.to) {
      filtered = filtered.filter(m => {
        const d = new Date(m.fecha);
        return d >= new Date(adjFilter.from) && d <= new Date(adjFilter.to + 'T23:59:59');
      });
    } else if (adjFilter.type === 'mes') {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      filtered = filtered.filter(m => {
        const d = new Date(m.fecha);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
    }

    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="toolbar">
          <button onClick={() => setActiveReport('table')}>⬅️ Volver</button>
          <div className="flex gap-2 items-center" style={{ marginLeft: '12px' }}>
            <label>Filtrar:</label>
            <select value={adjFilter.type} onChange={e => setAdjFilter({...adjFilter, type: e.target.value})} className="win-input">
              <option value="hoy">Hoy</option>
              <option value="rango">Desde - Hasta</option>
              <option value="mes">Este Mes</option>
            </select>
            {adjFilter.type === 'rango' && (
              <>
                <input type="date" value={adjFilter.from} onChange={e => setAdjFilter({...adjFilter, from: e.target.value})} className="win-input" />
                <input type="date" value={adjFilter.to} onChange={e => setAdjFilter({...adjFilter, to: e.target.value})} className="win-input" />
              </>
            )}
          </div>
          <button style={{ marginLeft: 'auto' }} onClick={() => window.print()}>🖨️ Imprimir Reporte</button>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Producto</th>
                <th>Código</th>
                <th style={{ textAlign: 'center' }}>Cant. Ajustada</th>
                <th>Stock Resultante</th>
                <th>Motivo / Comentario</th>
                <th>Usuario</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id}>
                  <td>{new Date(m.fecha).toLocaleString()}</td>
                  <td>{products.find(p => p.codigo === m.codigoProducto)?.nombre || 'Desconocido'}</td>
                  <td>{m.codigoProducto}</td>
                  <td style={{ textAlign: 'center', color: m.cantidad >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                    {m.cantidad > 0 ? '+' : ''}{m.cantidad}
                  </td>
                  <td style={{ textAlign: 'center' }}>{m.stockNuevo}</td>
                  <td>{m.comentario}</td>
                  <td>{m.usuario}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>No hay ajustes en el periodo seleccionado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="module-panel active">
      <h2 style={{ color: '#000080', marginBottom: '12px' }}>📊 Control de Inventario & Kardex</h2>
      
      {activeReport === 'table' && (
        <>
          <div className="toolbar">
            <button onClick={() => onOpenModal('modalEntrada')}>📥 Entrada Compra</button>
            <button onClick={() => onOpenModal('modalAjuste')}>🔧 Nuevo Ajuste</button>
            <button onClick={() => setActiveReport('adjustments')}>📝 Reporte Ajustes</button>
            <div style={{ marginLeft: 'auto' }}>
              <input type="text" placeholder="🔍 Buscar producto..." className="win-input" style={{ width: '200px' }} />
            </div>
          </div>

          <div className="dashboard-grid" style={{ marginBottom: '12px' }}>
            <div className="dash-card"><div className="dash-value">{products.length}</div><div className="dash-label">Items</div></div>
            <div className="dash-card"><div className="dash-value">${totalValor.toFixed(2)}</div><div className="dash-label">Valor CPP</div></div>
            <div className="dash-card" style={{ color: '#e04040' }}><div className="dash-value">{stockBajo.length}</div><div className="dash-label">Stock Bajo</div></div>
            <div className="dash-card" style={{ color: '#000' }}><div className="dash-value">{agotados.length}</div><div className="dash-label">Agotados</div></div>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Descripción</th>
                  <th style={{ textAlign: 'right' }}>Costo (CPP)</th>
                  <th style={{ textAlign: 'center' }}>Stock</th>
                  <th style={{ textAlign: 'center' }}>Mín</th>
                  <th>Ubicación</th>
                  <th>Categoría</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, idx) => (
                  <tr key={p.codigo}>
                    <td>{p.codigo}</td>
                    <td>{p.nombre}</td>
                    <td style={{ textAlign: 'right' }}>${p.costoPromedio.toFixed(2)}</td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{p.stock}</td>
                    <td style={{ textAlign: 'center' }}>{p.stockMin}</td>
                    <td>{p.ubicacion}</td>
                    <td>{p.categoria}</td>
                    <td style={{ textAlign: 'center' }}>
                      {p.stock <= p.stockMin ? (p.stock === 0 ? '🔴' : '🟡') : '🟢'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn" style={{ padding: '2px 8px', fontSize: '10px' }} onClick={() => {
                        setSelectedProductKardex(p.codigo);
                        setActiveReport('kardex');
                      }}>📖 Ver Kardex</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeReport === 'kardex' && renderKardex()}
      {activeReport === 'adjustments' && renderAdjustments()}
    </div>
  );
}
