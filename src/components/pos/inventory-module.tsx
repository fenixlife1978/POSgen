
'use client';

import React from 'react';
import { Product } from '@/types/pos';

interface InventoryModuleProps {
  active: boolean;
  onOpenModal: (id: string) => void;
  products: Product[];
}

export function InventoryModule({ active, onOpenModal, products }: InventoryModuleProps) {
  if (!active) return null;

  const totalValor = products.reduce((s, p) => s + (p.stock * (p.costoPromedio || 0)), 0);

  return (
    <div className="module-panel active">
      <h2 style={{ color: '#000080', marginBottom: '12px' }}> Control de Inventario</h2>
      <div className="toolbar">
        <button onClick={() => onOpenModal('modalEntrada')}>📥 Entrada Compra (CPP)</button>
        <button onClick={() => onOpenModal('modalSalida')}>📤 Salida</button>
        <button onClick={() => onOpenModal('modalAjuste')}>🔧 Ajuste</button>
        <button>📊 Reporte General (CPP)</button>
      </div>
      <div className="dashboard-grid" style={{ marginBottom: '12px' }}>
        <div className="dash-card"><div className="dash-value">{products.length}</div><div className="dash-label">Total Productos</div></div>
        <div className="dash-card"><div className="dash-value">${totalValor.toFixed(2)}</div><div className="dash-label">Valor Inv. (CPP)</div></div>
        <div className="dash-card"><div className="dash-value">{products.filter(p => p.stock <= p.stockMin && p.stock > 0).length}</div><div className="dash-label">Stock Bajo</div></div>
        <div className="dash-card"><div className="dash-value">{products.filter(p => p.stock === 0).length}</div><div className="dash-label">Agotados</div></div>
      </div>
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Descripción</th>
              <th>Costo (CPP)</th>
              <th>Stock</th>
              <th>Min</th>
              <th>Valor (CPP)</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.codigo}>
                <td>{p.codigo}</td>
                <td>{p.descripcion}</td>
                <td>${(p.costoPromedio || 0).toFixed(2)}</td>
                <td>{p.stock}</td>
                <td>{p.stockMin}</td>
                <td>${((p.stock) * (p.costoPromedio || 0)).toFixed(2)}</td>
                <td>{p.stock <= p.stockMin ? (p.stock === 0 ? '🔴' : '🟡') : '🟢'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
