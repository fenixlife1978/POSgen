'use client';

import React, { useState, useEffect } from 'react';

interface ConfigModuleProps {
  active: boolean;
  onOpenModal: (id: string) => void;
  config: any;
  setConfig: React.Dispatch<React.SetStateAction<any>>;
  notify: (msg: string, type?: 'success' | 'error' | 'warning') => void;
}

export function ConfigModule({ active, onOpenModal, config, setConfig, notify }: ConfigModuleProps) {
  const [localConfig, setLocalConfig] = useState(config);

  // Sincronizar estado local si el config global cambia (por ejemplo, al cargar desde localStorage)
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  if (!active) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    // Mapeo de IDs de input a propiedades del objeto config
    const configMap: { [key: string]: string } = {
      cfgTasa: 'tasa',
      cfgIgtf: 'igtf',
      cfgIva: 'iva',
      cfgRifEmp: 'rifEmpresa',
      cfgNombreEmp: 'nombreEmpresa',
      cfgDireccion: 'direccion',
      cfgTelefono: 'telefono',
      cfgVendedor: 'vendedor'
    };

    const prop = configMap[id];
    if (prop) {
      setLocalConfig({
        ...localConfig,
        [prop]: (id === 'cfgTasa' || id === 'cfgIgtf' || id === 'cfgIva') ? parseFloat(value) || 0 : value
      });
    }
  };

  const handleSave = () => {
    try {
      setConfig(localConfig);
      notify('✅ Configuración guardada exitosamente');
    } catch (error) {
      notify('❌ Error al guardar la configuración', 'error');
    }
  };

  return (
    <div id="module-config" className="module-panel active">
      <h2 style={{ color: '#000080', marginBottom: '12px' }}>⚙️ Configuración del Sistema</h2>

      <div className="settings-section">
        <h3>💱 Tasa de Cambio & Impuestos</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Tasa USD a BS (BCV):</label>
            <input 
              type="number" 
              id="cfgTasa" 
              value={localConfig.tasa} 
              onChange={handleChange}
              step="0.01" 
              className="win-input font-bold text-blue-800"
            />
          </div>
          <div className="form-group">
            <label>IGTF (%):</label>
            <input 
              type="number" 
              id="cfgIgtf" 
              value={localConfig.igtf} 
              onChange={handleChange}
              step="0.1" 
            />
          </div>
          <div className="form-group">
            <label>IVA (%):</label>
            <input 
              type="number" 
              id="cfgIva" 
              value={localConfig.iva} 
              onChange={handleChange}
              step="0.1" 
            />
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>🏪 Datos de la Entidad / Empresa</h3>
        <div className="form-row">
          <div className="form-group">
            <label>RIF Empresa:</label>
            <input 
              type="text" 
              id="cfgRifEmp" 
              value={localConfig.rifEmpresa} 
              onChange={handleChange}
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Nombre Comercial:</label>
            <input 
              type="text" 
              id="cfgNombreEmp" 
              value={localConfig.nombreEmpresa} 
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group" style={{ flex: 1 }}>
            <label>Dirección Fiscal:</label>
            <input 
              type="text" 
              id="cfgDireccion" 
              value={localConfig.direccion} 
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Teléfono de Contacto:</label>
            <input 
              type="text" 
              id="cfgTelefono" 
              value={localConfig.telefono} 
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>👤 Personal Operativo</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Vendedor Predeterminado:</label>
            <select id="cfgVendedor" value={localConfig.vendedor} onChange={handleChange}>
              {localConfig.vVendedores?.map((v: string) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="toolbar" style={{ marginTop: '8px' }}>
          <button onClick={() => onOpenModal('modalNuevoVendedor')}>➕ Gestionar Vendedores</button>
        </div>
      </div>

      <div className="settings-section">
        <h3>💾 Gestión de Datos</h3>
        <div className="form-row">
          <div className="form-group"><button className="btn btn-success">📤 Exportar Backup (JSON)</button></div>
          <div className="form-group"><button className="btn btn-warning">📥 Importar Backup</button></div>
          <div className="form-group">
            <button 
              className="btn" 
              style={{ background: '#f0a0a0' }}
              onClick={() => {
                if(confirm('¿Está seguro de eliminar TODOS los datos del sistema? Esta acción no se puede deshacer.')) {
                  localStorage.removeItem('autoparts_pos_db_final');
                  window.location.reload();
                }
              }}
            >
              🗑️ Resetear Sistema
            </button>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '20px', paddingBottom: '20px' }}>
        <button 
          className="btn btn-primary" 
          style={{ padding: '12px 60px', fontSize: '16px', boxShadow: '2px 2px 0 #000' }}
          onClick={handleSave}
        >
          💾 GUARDAR CONFIGURACIÓN ACTUAL
        </button>
      </div>
    </div>
  );
}