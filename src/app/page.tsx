'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Product, Client, Sale, Account, CartItem } from '@/types/pos';
import { format } from 'date-fns';

export default function POSPage() {
  const [activeModule, setActiveModule] = useState('pos');
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [posCart, setPosCart] = useState<CartItem[]>([]);
  const [selectedRow, setSelectedRow] = useState(-1);
  const [dateTime, setDateTime] = useState('');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  // Form states
  const [posRif, setPosRif] = useState('');
  const [posCliente, setPosCliente] = useState('');
  const [posBusqueda, setPosBusqueda] = useState('');
  const [posCredito, setPosCredito] = useState(false);
  const [posSaldo, setPosSaldo] = useState(0);
  
  const [config, setConfig] = useState({
    tasa: 724.00,
    igtf: 3,
    iva: 16,
    rifEmpresa: 'J-12345678-9',
    nombreEmpresa: 'AutoParts C.A.',
    direccion: 'Av. Principal, Local 5',
    telefono: '0212-5551234',
    vendedor: 'MARIA VERASTEGUI',
    vendedores: ['MARIA VERASTEGUI', 'JUAN PEREZ', 'CARLOS LOPEZ'],
    nextInvoice: 1
  });

  useEffect(() => {
    const saved = localStorage.getItem('autoparts_pos_db');
    if (saved) {
      const db = JSON.parse(saved);
      if (db.products) setProducts(db.products);
      if (db.clients) setClients(db.clients);
      if (db.sales) setSales(db.sales);
      if (db.config) setConfig(db.config);
    }
    const interval = setInterval(() => setDateTime(format(new Date(), 'dd/MM/yyyy HH:mm:ss')), 1000);
    return () => clearInterval(interval);
  }, []);

  const totals = useMemo(() => {
    let subtotal = 0, totalIva = 0, totalUnits = 0;
    posCart.forEach(item => {
      const s = item.precioUsd * item.cantidad;
      subtotal += s;
      totalIva += s * (item.iva / 100);
      totalUnits += item.cantidad;
    });
    const totalUsd = subtotal + totalIva;
    return {
      subtotal,
      totalIva,
      totalUsd,
      totalBs: totalUsd * config.tasa,
      igtfAmount: totalUsd * (config.igtf / 100),
      totalUnits
    };
  }, [posCart, config.tasa, config.igtf]);

  const switchModule = (name: string) => setActiveModule(name);
  const openModal = (id: string) => setActiveModal(id);
  const closeModal = () => setActiveModal(null);

  // POS Handlers
  const searchClientByRif = (rif: string) => {
    setPosRif(rif);
    const client = clients.find(c => `${c.tipoRif}-${c.rifNum}` === rif || c.rifNum === rif);
    if (client) {
      setPosCliente(client.nombre);
      setPosSaldo(client.saldo);
    }
  };

  return (
    <div id="mainApp" className="flex flex-col h-screen bg-[#c0c0c0]">
      {/* Dollar Bar */}
      <div className="dollar-bar">
        <span className="dollar-icon">💲</span>
        <span>DOLAR: <strong id="dolarRate">{config.tasa.toFixed(2)}</strong></span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#555' }}>
          AutoParts POS v2.0 | Repuestos, Lubricantes y Servicios Automotrices
        </span>
      </div>

      {/* Navigation Tabs */}
      <div className="nav-tabs">
        <div className={`nav-tab ${activeModule === 'pos' ? 'active' : ''}`} onClick={() => switchModule('pos')}>️ POS Venta</div>
        <div className={`nav-tab ${activeModule === 'dashboard' ? 'active' : ''}`} onClick={() => switchModule('dashboard')}> Dashboard</div>
        <div className={`nav-tab ${activeModule === 'productos' ? 'active' : ''}`} onClick={() => switchModule('productos')}>📦 Productos</div>
        <div className={`nav-tab ${activeModule === 'clientes' ? 'active' : ''}`} onClick={() => switchModule('clientes')}>👥 Clientes</div>
        <div className={`nav-tab ${activeModule === 'ventas' ? 'active' : ''}`} onClick={() => switchModule('ventas')}>🧾 Ventas</div>
        <div className={`nav-tab ${activeModule === 'inventario' ? 'active' : ''}`} onClick={() => switchModule('inventario')}>📋 Inventario</div>
        <div className={`nav-tab ${activeModule === 'reportes' ? 'active' : ''}`} onClick={() => switchModule('reportes')}>📈 Reportes</div>
        <div className={`nav-tab ${activeModule === 'config' ? 'active' : ''}`} onClick={() => switchModule('config')}>⚙️ Configuración</div>
      </div>

      {/* POS MODULE (Exact structure requested) */}
      {activeModule === 'pos' && (
        <div id="module-pos" className="module-panel active" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
          <div className="header-section">
            <div className="header-row">
              <label>Rif:</label>
              <input type="text" id="posRif" value={posRif} placeholder="V-00000000-0" style={{ width: '160px' }} onChange={(e) => searchClientByRif(e.target.value)} />
              <label className="checkbox-label"><input type="checkbox" checked={posCredito} onChange={(e) => setPosCredito(e.target.checked)} /> Crédito</label>
              <label>N/Vendedor:</label>
              <span className="vendedor-name" id="posVendedor">{config.vendedor}</span>
              <div className="header-buttons">
                <button onClick={() => openModal('modalRecuperar')}>📄 Recuperar Documento</button>
                <button>🏷️ Aplicar Dscto</button>
              </div>
              <div className="datetime-display" id="datetimeDisplay">{dateTime}</div>
            </div>
            <div className="header-row">
              <label>Cliente:</label>
              <input type="text" id="posCliente" value={posCliente} placeholder="Nombre del cliente..." style={{ flex: 1, minWidth: '200px' }} onChange={(e) => setPosCliente(e.target.value)} />
              <label>Saldo:</label>
              <span className="saldo-val" id="posSaldo">{posSaldo.toFixed(2)}</span>
            </div>
          </div>

          <div className="search-section" style={{ position: 'relative' }}>
            <label>Busqueda:</label>
            <input type="text" id="posBusqueda" value={posBusqueda} placeholder="Código, nombre o descripción..." onChange={(e) => setPosBusqueda(e.target.value)} />
            <label className="equiv-label">Equivalente:</label>
            <input type="text" className="equiv-input" id="posEquivalente" value={`Bs. ${totals.totalBs.toFixed(2)}`} readOnly />
            <button className="copy-btn">📋 Copiar</button>
          </div>

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
                  {posCart.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: '#888', padding: '40px' }}>Agregue productos usando la búsqueda...</td></tr>
                  ) : (
                    posCart.map((item, i) => (
                      <tr key={i} className={i === selectedRow ? 'selected' : ''} onClick={() => setSelectedRow(i)}>
                        <td>{i + 1}</td>
                        <td>{item.codigo} - {item.descripcion}</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{item.precioUsd.toFixed(2)}</td>
                        <td style={{ textAlign: 'center' }}>{item.cantidad}</td>
                        <td style={{ textAlign: 'right' }}>{(item.precioUsd * item.cantidad).toFixed(2)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{(item.precioUsd * item.cantidad * (1 + item.iva / 100)).toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="right-sidebar">
              <button className="sidebar-btn" onClick={() => openModal('modalRecuperar')}>Recuperar Documento</button>
              <button className="sidebar-btn">Aplicar Dscto</button>
              <button className="sidebar-btn" onClick={() => { if(selectedRow >= 0) { const newCart = [...posCart]; newCart.splice(selectedRow, 1); setPosCart(newCart); setSelectedRow(-1); } }}>Delete F4</button>
              <button className="sidebar-btn" onClick={() => openModal('modalItem')}>Item</button>
              <button className="sidebar-btn">P. Activo</button>
              <button className="sidebar-btn" onClick={() => openModal('modalLocalizar')}>Localizar</button>
              <button className="sidebar-btn btn-procesar" onClick={() => openModal('modalProcesar')}>Procesar F12</button>
              <button className="sidebar-btn" onClick={() => openModal('modalCompras')}>Compras</button>
              <button className="sidebar-btn" onClick={() => openModal('modalDatos')}>Datos</button>
              <button className="sidebar-btn" onClick={() => openModal('modalRif')}>Rif</button>
              <button className="sidebar-btn" onClick={() => openModal('modalBuscarCliente')}>Buscar cliente</button>
              <button className="sidebar-btn" onClick={() => openModal('modalPresupuesto')}>Presupuesto</button>
              <button className="sidebar-btn" onClick={() => openModal('modalCantidad')}>Cantidad</button>
              <button className="sidebar-btn" onClick={() => openModal('modalAvanzada')}>Avanzada F6</button>
              <button className="sidebar-btn" onClick={() => openModal('modalConsultar')}>Consultar F2</button>
              <button className="sidebar-btn">Facturar Reverso</button>
              <button className="sidebar-btn" onClick={() => openModal('modalVPOS')}>Opciones VPOS</button>
              <button className="sidebar-btn" onClick={() => openModal('modalPagoMovil')}>Cambio Pago Movil</button>
              <button className="sidebar-btn">Salir</button>
            </div>
          </div>

          <div className="bottom-totals">
            <div className="total-box stotal">
              <span className="total-label">S/total:</span>
              <div className="total-value" id="totalStotal">{totals.subtotal.toFixed(2)}</div>
            </div>
            <div className="total-box iva">
              <span className="total-label">Iva:</span>
              <div className="total-value" id="totalIva">{totals.totalIva.toFixed(2)}</div>
            </div>
            <div className="total-box total-bs">
              <span className="total-label">Total Bs:</span>
              <div className="total-value" id="totalBs">{totals.totalBs.toFixed(2)}</div>
              <span className="total-label-sub" id="cambioLabel">CAMBIO ULTIMA FACTURA</span>
            </div>
            <div className="total-box dolar-igtf">
              <span className="total-label">DOLAR+IGTF:</span>
              <div className="total-value" id="totalDolarIgtf">{(totals.totalUsd + totals.igtfAmount).toFixed(2)}</div>
            </div>
            <div className="total-box divisas">
              <span className="total-label">DIVISAS:</span>
              <div className="total-value" id="totalDivisas">{totals.totalUsd.toFixed(2)}</div>
            </div>
            <div className="items-count">
              <span>Item(s): <strong id="itemCount">{posCart.length}</strong></span>
              <span>Unidad(es): <strong id="unitCount">{totals.totalUnits}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Placeholder for other modules */}
      {activeModule === 'dashboard' && <div className="module-panel active p-4"><h2>Dashboard en desarrollo...</h2></div>}
      {activeModule === 'productos' && <div className="module-panel active p-4"><h2>Gestión de Productos en desarrollo...</h2></div>}

      {/* Status Bar */}
      <div className="status-bar">
        <span className="status-section"> Usuario: Admin</span>
        <span className="status-section"> Conectado</span>
        <span className="status-section"> DB: LocalStorage</span>
        <span className="status-section">Última Venta: --</span>
      </div>

      {/* Modal Backdrop */}
      {activeModal && (
        <div className="modal-overlay active">
          <div className="modal-window">
            <div className="win-titlebar">
              <span>{activeModal}</span>
              <span className="modal-close cursor-pointer" onClick={closeModal}>✕</span>
            </div>
            <div className="modal-body p-4">
              Contenido del modal {activeModal}
            </div>
            <div className="modal-footer p-2 border-t flex justify-end gap-2">
              <button className="sidebar-btn px-4" onClick={closeModal}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
