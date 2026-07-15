'use client';

import React from 'react';

interface ConfigModuleProps {
  active: boolean;
  onOpenModal: (id: string) => void;
}

export function ConfigModule({ active, onOpenModal }: ConfigModuleProps) {
  if (!active) return null;

  return (
    <div id="module-config" className="module-panel active">
      <h2 style={{ color: '#000080', marginBottom: '12px' }}>⚙️ Configuración del Sistema</h2>

      <div className="settings-section">
        <h3>💱 Tasa de Cambio</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Tasa USD a BS:</label>
            <input type="number" id="cfgTasa" defaultValue="724.00" step="0.01" />
          </div>
          <div className="form-group">
            <label>IGTF (%):</label>
            <input type="number" id="cfgIgtf" defaultValue="3" step="0.1" />
          </div>
          <div className="form-group">
            <label>IVA (%):</label>
            <input type="number" id="cfgIva" defaultValue="16" step="0.1" />
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>🏪 Datos de la Empresa</h3>
        <div className="form-row">
          <div className="form-group"><label>RIF Empresa:</label><input type="text" id="cfgRifEmp" defaultValue="J-12345678-9" /></div>
          <div className="form-group"><label>Nombre:</label><input type="text" id="cfgNombreEmp" defaultValue="AutoParts C.A." /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Dirección:</label><input type="text" id="cfgDireccion" defaultValue="Av. Principal, Local 5" /></div>
          <div className="form-group"><label>Teléfono:</label><input type="text" id="cfgTelefono" defaultValue="0212-5551234" /></div>
        </div>
      </div>

      <div className="settings-section">
        <h3>👤 Vendedores</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Vendedor Activo:</label>
            <select id="cfgVendedor">
              <option value="MARIA VERASTEGUI">MARIA VERASTEGUI</option>
              <option value="JUAN PEREZ">JUAN PEREZ</option>
              <option value="CARLOS LOPEZ">CARLOS LOPEZ</option>
            </select>
          </div>
        </div>
        <div className="toolbar" style={{ marginTop: '8px' }}>
          <button onClick={() => onOpenModal('modalNuevoVendedor')}>➕ Agregar Vendedor</button>
        </div>
      </div>

      <div className="settings-section">
        <h3>🖨️ Impresión</h3>
        <div className="form-row">
          <div className="form-group"><label>Tipo Impresora:</label><select><option>Térmica 80mm</option><option>Térmica 58mm</option><option>Laser A4</option></select></div>
          <div className="form-group"><label>Copias:</label><input type="number" defaultValue="1" min="1" max="5" /></div>
          <div className="form-group"><label>Logo:</label><input type="file" accept="image/*" /></div>
        </div>
      </div>

      <div className="settings-section">
        <h3>💾 Respaldo de Datos</h3>
        <div className="form-row">
          <div className="form-group"><button className="btn btn-success">📤 Exportar Respaldo</button></div>
          <div className="form-group"><button className="btn btn-warning">📥 Importar Respaldo</button></div>
          <div className="form-group"><button className="btn btn-danger">🗑️ Limpiar Todo</button></div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <button className="btn btn-primary" style={{ padding: '10px 40px', fontSize: '15px' }}>💾 Guardar Configuración</button>
      </div>
    </div>
  );
}
