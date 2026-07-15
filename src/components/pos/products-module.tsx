'use client';

import React from 'react';

interface ProductsModuleProps {
  active: boolean;
  onOpenModal: (id: string) => void;
}

export function ProductsModule({ active, onOpenModal }: ProductsModuleProps) {
  if (!active) return null;

  return (
    <div id="module-productos" className="module-panel active">
      <h2 style={{ color: '#000080', marginBottom: '12px' }}> Gestión de Productos</h2>
      <div className="toolbar">
        <button onClick={() => onOpenModal('modalProducto')}>➕ Nuevo Producto</button>
        <button>✏️ Editar</button>
        <button>🗑️ Eliminar</button>
        <button>📤 Exportar</button>
        <button>📥 Importar</button>
        <input type="text" id="prodSearch" placeholder=" Buscar producto..." style={{ border: '2px solid', borderColor: '#808080 #fff #fff #808080', padding: '4px 8px', marginLeft: 'auto', width: '250px' }} />
      </div>
      <div className="table-responsive">
        <table className="data-table" id="productsTable">
          <thead>
            <tr>
              <th>Código</th><th>Descripción</th><th>Categoría</th><th>Precio USD</th><th>Precio BS</th><th>Stock</th><th>Mín</th><th>IVA%</th><th>Estado</th>
            </tr>
          </thead>
          <tbody id="productsTableBody"></tbody>
        </table>
      </div>
    </div>
  );
}
