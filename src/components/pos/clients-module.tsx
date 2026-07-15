'use client';

import React from 'react';

interface ClientsModuleProps {
  active: boolean;
  onOpenModal: (id: string) => void;
}

export function ClientsModule({ active, onOpenModal }: ClientsModuleProps) {
  if (!active) return null;

  return (
    <div id="module-clientes" className="module-panel active">
      <h2 style={{ color: '#000080', marginBottom: '12px' }}>👥 Gestión de Clientes</h2>
      <div className="toolbar">
        <button onClick={() => onOpenModal('modalCliente')}> Nuevo Cliente</button>
        <button>✏️ Editar</button>
        <button>️ Eliminar</button>
        <input type="text" id="clientSearch" placeholder="🔍 Buscar cliente..." style={{ border: '2px solid', borderColor: '#808080 #fff #fff #808080', padding: '4px 8px', marginLeft: 'auto', width: '250px' }} />
      </div>
      <div className="table-responsive">
        <table className="data-table" id="clientsTable">
          <thead>
            <tr><th>RIF</th><th>Nombre</th><th>Teléfono</th><th>Email</th><th>Dirección</th><th>Saldo</th><th>Tipo</th></tr>
          </thead>
          <tbody id="clientsTableBody"></tbody>
        </table>
      </div>
    </div>
  );
}
