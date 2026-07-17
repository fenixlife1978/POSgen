
'use client';

import React from 'react';
import { Product } from '@/types/pos';

interface ProductsModuleProps {
  active: boolean;
  onOpenModal: (id: string, dataId?: string | number) => void;
  products: Product[];
  tasa: number;
  notify: any;
}

export function ProductsModule({ active, onOpenModal, products, tasa, notify }: ProductsModuleProps) {
  if (!active) return null;

  return (
    <div id="module-productos" className="module-panel active">
      <h2 style={{ color: '#000080', marginBottom: '12px' }}>📦 Gestión de Productos y Servicios</h2>
      <div className="toolbar">
        <button onClick={() => onOpenModal('modalProducto')}>➕ Nuevo Item</button>
        <button>📤 Exportar</button>
        <button>📥 Importar</button>
        <input type="text" id="prodSearch" placeholder="🔍 Buscar item..." style={{ border: '2px solid', borderColor: '#808080 #fff #fff #808080', padding: '4px 8px', marginLeft: 'auto', width: '250px' }} />
      </div>
      <div className="table-responsive">
        <table className="data-table" id="productsTable">
          <thead>
            <tr>
              <th>Código</th>
              <th>Descripción</th>
              <th>Categoría</th>
              <th style={{ textAlign: 'right' }}>Precio USD</th>
              <th style={{ textAlign: 'right' }}>Precio BS</th>
              <th style={{ textAlign: 'center' }}>Stock</th>
              <th style={{ textAlign: 'center' }}>Mín</th>
              <th style={{ textAlign: 'center' }}>IVA%</th>
              <th style={{ textAlign: 'center' }}>Estado</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, idx) => (
              <tr key={p.codigo} onDoubleClick={() => onOpenModal('modalProducto', idx)}>
                <td>{p.codigo}</td>
                <td>{p.nombre}</td>
                <td>{p.categoria}</td>
                <td style={{ textAlign: 'right' }}>${p.precio1.toFixed(2)}</td>
                <td style={{ textAlign: 'right' }}>Bs. {(p.precio1 * tasa).toFixed(2)}</td>
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{p.stock}</td>
                <td style={{ textAlign: 'center' }}>{p.stockMin}</td>
                <td style={{ textAlign: 'center' }}>{p.iva}%</td>
                <td style={{ textAlign: 'center' }}>{p.activo ? '✅' : '❌'}</td>
                <td style={{ textAlign: 'center' }}>
                  <button className="btn" style={{ padding: '2px 6px', fontSize: '10px' }} onClick={() => onOpenModal('modalProducto', idx)}>✏️</button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                  No hay productos registrados. Use "Nuevo Item" para comenzar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
