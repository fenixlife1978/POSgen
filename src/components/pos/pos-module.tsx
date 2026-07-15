'use client';

import React from 'react';

interface PosModuleProps {
  active: boolean;
  onOpenModal: (id: string) => void;
}

export function PosModule({ active, onOpenModal }: PosModuleProps) {
  if (!active) return null;

  return (
    <div id="module-pos" class="module-panel active" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
      {/* Header Section */}
      <div className="header-section">
        <div className="header-row">
          <label>Rif:</label>
          <input type="text" id="posRif" placeholder="V-00000000-0" style={{ width: '160px' }} />
          <label className="checkbox-label"><input type="checkbox" id="posCredito" /> Crédito</label>
          <label>N/Vendedor:</label>
          <span className="vendedor-name" id="posVendedor">MARIA VERASTEGUI</span>
          <div className="header-buttons">
            <button onClick={() => onOpenModal('modalRecuperar')}>📄 Recuperar Documento</button>
            <button>🏷️ Aplicar Dscto</button>
          </div>
          <div className="datetime-display" id="datetimeDisplay">15/07/2026 16:39:59</div>
        </div>
        <div className="header-row">
          <label>Cliente:</label>
          <input type="text" id="posCliente" placeholder="Nombre del cliente..." style={{ flex: 1, minWidth: '200px' }} />
          <label>Saldo:</label>
          <span className="saldo-val" id="posSaldo">0.00</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-section" style={{ position: 'relative' }}>
        <label>Busqueda:</label>
        <input type="text" id="posBusqueda" placeholder="Código, nombre o descripción..." />
        <label className="equiv-label">Equivalente:</label>
        <input type="text" className="equiv-input" id="posEquivalente" readOnly />
        <button className="copy-btn">📋 Copiar</button>
        <div className="search-dropdown" id="searchDropdown"></div>
      </div>

      {/* Main Content: Table + Sidebar */}
      <div className="main-content">
        <div className="table-container">
          <table className="product-table" id="posTable">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th>Descripcion</th>
                <th style={{ width: '90px' }}>Oferta USD</th>
                <th style={{ width: '60px' }}>Cant</th>
                <th style={{ width: '110px' }}>Precio</th>
                <th style={{ width: '110px' }}>Total+Iva</th>
              </tr>
            </thead>
            <tbody id="posTableBody">
            </tbody>
          </table>
        </div>

        {/* Right Sidebar */}
        <div className="right-sidebar">
          <button className="sidebar-btn" onClick={() => onOpenModal('modalRecuperar')}>Recuperar Documento</button>
          <button className="sidebar-btn">Aplicar Dscto</button>
          <button className="sidebar-btn">Delete F4</button>
          <button className="sidebar-btn" onClick={() => onOpenModal('modalItem')}>Item</button>
          <button className="sidebar-btn">P. Activo</button>
          <button className="sidebar-btn" onClick={() => onOpenModal('modalLocalizar')}>Localizar</button>
          <button className="sidebar-btn btn-procesar">Procesar F12</button>
          <button className="sidebar-btn" onClick={() => onOpenModal('modalCompras')}>Compras</button>
          <button className="sidebar-btn" onClick={() => onOpenModal('modalDatos')}>Datos</button>
          <button className="sidebar-btn" onClick={() => onOpenModal('modalRif')}>Rif</button>
          <button className="sidebar-btn" onClick={() => onOpenModal('modalBuscarCliente')}>Buscar cliente</button>
          <button className="sidebar-btn" onClick={() => onOpenModal('modalPresupuesto')}>Presupuesto</button>
          <button className="sidebar-btn" onClick={() => onOpenModal('modalCantidad')}>Cantidad</button>
          <button className="sidebar-btn" onClick={() => onOpenModal('modalAvanzada')}>Avanzada F6</button>
          <button className="sidebar-btn" onClick={() => onOpenModal('modalConsultar')}>Consultar F2</button>
          <button className="sidebar-btn">Facturar Reverso</button>
          <button className="sidebar-btn" onClick={() => onOpenModal('modalVPOS')}>Opciones VPOS</button>
          <button className="sidebar-btn" onClick={() => onOpenModal('modalPagoMovil')}>Cambio Pago Movil</button>
          <button className="sidebar-btn">Salir</button>
        </div>
      </div>

      {/* Bottom Totals */}
      <div className="bottom-totals">
        <div className="total-box stotal">
          <span className="total-label">S/total:</span>
          <div className="total-value" id="totalStotal">0.00</div>
        </div>
        <div className="total-box iva">
          <span className="total-label">Iva:</span>
          <div className="total-value" id="totalIva">0.00</div>
        </div>
        <div className="total-box total-bs">
          <span className="total-label">Total Bs:</span>
          <div className="total-value" id="totalBs">0.00</div>
          <span className="total-label-sub" id="cambioLabel">CAMBIO ULTIMA FACTURA</span>
        </div>
        <div className="total-box dolar-igtf">
          <span className="total-label">DOLAR+IGTF:</span>
          <div className="total-value" id="totalDolarIgtf">0.00</div>
        </div>
        <div className="total-box divisas">
          <span className="total-label">DIVISAS:</span>
          <div className="total-value" id="totalDivisas">0.00</div>
        </div>
        <div className="items-count">
          <span>Item(s): <strong id="itemCount">0</strong></span>
          <span>Unidad(es): <strong id="unitCount">0</strong></span>
        </div>
      </div>
    </div>
  );
}
