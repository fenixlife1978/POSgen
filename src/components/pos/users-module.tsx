
'use client';

import React from 'react';
import { User } from '@/types/pos';

interface UsersModuleProps {
  active: boolean;
  users: User[];
  onOpenModal: (id: string) => void;
}

export function UsersModule({ active, users, onOpenModal }: UsersModuleProps) {
  if (!active) return null;

  return (
    <div className="module-panel active">
      <h2 style={{ color: '#000080', marginBottom: '12px' }}>👤 Gestión de Usuarios</h2>
      <div className="toolbar" style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <button className="btn" onClick={() => onOpenModal('modalNuevoUsuario')}>➕ Nuevo Usuario</button>
      </div>
      
      <div className="table-container">
        <table className="product-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo / Email</th>
              <th>Rol / Nivel</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td className="font-bold">{u.name}</td>
                <td>{u.email}</td>
                <td><strong>{u.role}</strong></td>
                <td>{u.active ? '🟢 Activo' : '🔴 Inactivo'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
