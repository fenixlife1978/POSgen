
'use client';

import React, { useState } from 'react';
import { Provider } from '@/types/pos';

interface ProvidersModuleProps {
  active: boolean;
  onOpenModal: (id: string, dataId?: any) => void;
  providers: Provider[];
  setProviders: React.Dispatch<React.SetStateAction<Provider[]>>;
  notify: (msg: string, type?: 'success' | 'error' | 'warning') => void;
}

export function ProvidersModule({ active, onOpenModal, providers, setProviders, notify }: ProvidersModuleProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  if (!active) return null;

  const filtered = providers.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.rif.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = () => {
    if (selectedIdx !== null) {
      const provider = filtered[selectedIdx];
      onOpenModal('modalProveedor', provider.id);
    } else {
      notify('Seleccione un proveedor para editar', 'warning');
    }
  };

  const handleDelete = () => {
    if (selectedIdx === null) {
      notify('Seleccione un proveedor para eliminar', 'warning');
      return;
    }
    const provider = filtered[selectedIdx];
    if (confirm(`¿Está seguro de eliminar al proveedor "${provider.nombre}"?`)) {
      setProviders(providers.filter(p => p.id !== provider.id));
      setSelectedIdx(null);
      notify('✅ Proveedor eliminado');
    }
  };

  return (
    <div className="module-panel active">
      <h2 style={{ color: '#000080', marginBottom: '12px' }}>🏢 Gestión de Proveedores</h2>
      <div className="toolbar">
        <button onClick={() => onOpenModal('modalProveedor')}>➕ Nuevo Proveedor</button>
        <button onClick={handleEdit}>✏️ Editar</button>
        <button onClick={handleDelete}>🗑️ Eliminar</button>
        <div style={{ marginLeft: 'auto' }}>
          <input 
            type="text" 
            placeholder="🔍 Buscar por nombre o RIF..." 
            className="win-input" 
            style={{ width: '250px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>RIF</th>
              <th>Nombre / Razón Social</th>
              <th>Persona de Contacto</th>
              <th>Teléfono</th>
              <th>Dirección</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, idx) => (
              <tr 
                key={p.id} 
                className={selectedIdx === idx ? 'selected' : ''} 
                onClick={() => setSelectedIdx(idx)}
                onDoubleClick={() => onOpenModal('modalProveedor', p.id)}
              >
                <td style={{ fontWeight: 'bold' }}>{p.rif}</td>
                <td>{p.nombre}</td>
                <td>{p.contacto}</td>
                <td>{p.telefono}</td>
                <td>{p.direccion}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#888' }}>No se encontraron proveedores</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
