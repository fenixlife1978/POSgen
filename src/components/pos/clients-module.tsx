'use client';

import React, { useState } from 'react';
import { Client } from '@/types/pos';

interface ClientsModuleProps {
  active: boolean;
  onOpenModal: (id: string, dataId?: any) => void;
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  notify: (msg: string, type?: 'success' | 'error' | 'warning') => void;
}

export function ClientsModule({ active, onOpenModal, clients, setClients, notify }: ClientsModuleProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  if (!active) return null;

  const filtered = clients.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.rifNum.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = () => {
    if (selectedIdx !== null) {
      onOpenModal('modalCliente', selectedIdx);
    } else {
      notify('Seleccione un cliente para editar', 'warning');
    }
  };

  const handleDelete = () => {
    if (selectedIdx === null) {
      notify('Seleccione un cliente para eliminar', 'warning');
      return;
    }
    if (confirm('¿Está seguro de eliminar este cliente?')) {
      const newClients = [...clients];
      newClients.splice(selectedIdx, 1);
      setClients(newClients);
      setSelectedIdx(null);
      notify('✅ Cliente eliminado');
    }
  };

  return (
    <div id="module-clientes" className="module-panel active">
      <h2 style={{ color: '#000080', marginBottom: '12px' }}>👥 Gestión de Clientes</h2>
      <div className="toolbar">
        <button onClick={() => onOpenModal('modalCliente')}> Nuevo Cliente</button>
        <button onClick={handleEdit}>✏️ Editar</button>
        <button onClick={handleDelete}>️ Eliminar</button>
        <input 
          type="text" 
          placeholder="🔍 Buscar cliente..." 
          style={{ border: '2px solid', borderColor: '#808080 #fff #fff #808080', padding: '4px 8px', marginLeft: 'auto', width: '250px' }} 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>RIF/CI</th>
              <th>Nombre o Razón Social</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Dirección</th>
              <th style={{ textAlign: 'right' }}>Saldo</th>
              <th>Tipo</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, idx) => (
              <tr 
                key={idx} 
                className={selectedIdx === idx ? 'selected' : ''} 
                onClick={() => setSelectedIdx(idx)}
                onDoubleClick={() => onOpenModal('modalCliente', idx)}
              >
                <td>{c.tipoRif}-{c.rifNum}</td>
                <td style={{ fontWeight: 'bold' }}>{c.nombre}</td>
                <td>{c.telefono}</td>
                <td>{c.email}</td>
                <td>{c.direccion}</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>${c.saldo.toFixed(2)}</td>
                <td>{c.tipo}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#888' }}>No se encontraron clientes</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
