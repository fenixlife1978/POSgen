'use client';

import React from 'react';

interface ModalsProps {
  activeModal: string | null;
  onClose: () => void;
}

export function Modals({ activeModal, onClose }: ModalsProps) {
  if (!activeModal) return null;

  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <>
      {/* Modal: Procesar Venta */}
      <div className={`modal-overlay ${activeModal === 'modalProcesar' ? 'active' : ''}`} onClick={onClose}>
        <div className="modal-window large" onClick={stopPropagation}>
          <div className="modal-titlebar"><span> Procesar Venta</span><span className="modal-close" onClick={onClose}>✕</span></div>
          <div className="modal-body">
            <div id="procesarSummary" style={{ background: '#f0f0f0', border: '1px solid #808080', padding: '12px', marginBottom: '12px' }}>
              <div className="form-row">
                <div><strong>Cliente:</strong> <span id="procCliente">Consumidor Final</span></div>
                <div><strong>RIF:</strong> <span id="procRif">V-00000000-0</span></div>
              </div>
              <div className="form-row" style={{ marginTop: '8px' }}>
                <div><strong>Items:</strong> <span id="procItems">0</span></div>
                <div><strong>Subtotal USD:</strong> <span id="procSubtotal">$0.00</span></div>
                <div><strong>IVA:</strong> <span id="procIva">$0.00</span></div>
                <div><strong>TOTAL USD:</strong> <span id="procTotal" style={{ fontSize: '18px', color: '#000080', fontWeight: 'bold' }}>$0.00</span></div>
                <div><strong>TOTAL BS:</strong> <span id="procTotalBs" style={{ fontSize: '18px', color: '#c00000', fontWeight: 'bold' }}>Bs. 0.00</span></div>
              </div>
            </div>

            <h4 style={{ color: '#000080', marginBottom: '8px' }}>Método de Pago:</h4>
            <div className="payment-methods">
              <div className="payment-method selected"><div className="pm-icon">💵</div>Efectivo USD</div>
              <div className="payment-method"><div className="pm-icon">💴</div>Efectivo BS</div>
              <div className="payment-method"><div className="pm-icon">📱</div>Pago Móvil</div>
              <div className="payment-method"><div className="pm-icon">🏦</div>Transferencia</div>
              <div className="payment-method"><div className="pm-icon"></div>Tarjeta Débito/Crédito</div>
              <div className="payment-method"><div className="pm-icon">🌐</div>Zelle</div>
              <div className="payment-method"><div className="pm-icon">🔀</div>Pago Mixto</div>
              <div className="payment-method"><div className="pm-icon">📋</div>Crédito</div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Monto Recibido USD:</label>
                <input type="number" id="payReceivedUsd" step="0.01" defaultValue="0" />
              </div>
              <div className="form-group">
                <label>Monto Recibido BS:</label>
                <input type="number" id="payReceivedBs" step="0.01" defaultValue="0" />
              </div>
              <div className="form-group">
                <label>Cambio USD:</label>
                <input type="text" id="payChangeUsd" readOnly style={{ background: '#90ee90', fontWeight: 'bold' }} />
              </div>
              <div className="form-group">
                <label>Cambio BS:</label>
                <input type="text" id="payChangeBs" readOnly style={{ background: '#87ceeb', fontWeight: 'bold' }} />
              </div>
            </div>

            <div className="form-group">
              <label>Referencia / Nota:</label>
              <input type="text" id="payReference" placeholder="Número de referencia..." />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={onClose}>Cancelar</button>
            <button className="btn btn-success">✅ Confirmar Venta</button>
          </div>
        </div>
      </div>

      {/* Modal: Nuevo Producto */}
      <div className={`modal-overlay ${activeModal === 'modalProducto' ? 'active' : ''}`} onClick={onClose}>
        <div className="modal-window large" onClick={stopPropagation}>
          <div className="modal-titlebar"><span>📦 Producto</span><span className="modal-close" onClick={onClose}>✕</span></div>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group"><label>Código:</label><input type="text" id="prodCodigo" placeholder="AUTO-001" /></div>
              <div className="form-group"><label>Código de Barras:</label><input type="text" id="prodBarcode" /></div>
            </div>
            <div className="form-group"><label>Descripción:</label><input type="text" id="prodDescripcion" placeholder="Descripción del producto..." /></div>
            <div className="form-row">
              <div className="form-group"><label>Categoría:</label><select id="prodCategoria"><option value="Repuesto">Repuesto</option><option value="Lubricante">Lubricante</option><option value="Servicio">Servicio</option><option value="Accesorio">Accesorio</option></select></div>
              <div className="form-group"><label>Marca:</label><input type="text" id="prodMarca" /></div>
              <div className="form-group"><label>Modelo Compatible:</label><input type="text" id="prodModelo" /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Precio USD:</label><input type="number" id="prodPrecioUsd" step="0.01" defaultValue="0" /></div>
              <div className="form-group"><label>Costo USD:</label><input type="number" id="prodCostoUsd" step="0.01" defaultValue="0" /></div>
              <div className="form-group"><label>IVA (%):</label><input type="number" id="prodIva" defaultValue="16" step="0.1" /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Stock Actual:</label><input type="number" id="prodStock" defaultValue="0" /></div>
              <div className="form-group"><label>Stock Mínimo:</label><input type="number" id="prodStockMin" defaultValue="5" /></div>
              <div className="form-group"><label>Unidad:</label><select id="prodUnidad"><option>Unidad</option><option>Caja</option><option>Litro</option><option>Galón</option><option>Kit</option><option>Servicio</option></select></div>
            </div>
            <div className="form-group"><label>Ubicación:</label><input type="text" id="prodUbicacion" placeholder="Estante A-3..." /></div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={onClose}>Cancelar</button>
            <button className="btn btn-success">💾 Guardar</button>
          </div>
        </div>
      </div>

      {/* Modal: Nuevo Cliente */}
      <div className={`modal-overlay ${activeModal === 'modalCliente' ? 'active' : ''}`} onClick={onClose}>
        <div className="modal-window large" onClick={stopPropagation}>
          <div className="modal-titlebar"><span> Cliente</span><span className="modal-close" onClick={onClose}>✕</span></div>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group"><label>Tipo RIF:</label><select id="cliTipoRif"><option>V</option><option>J</option><option>E</option><option>G</option><option>P</option></select></div>
              <div className="form-group"><label>Número RIF:</label><input type="text" id="cliRifNum" placeholder="00000000-0" /></div>
            </div>
            <div className="form-group"><label>Nombre / Razón Social:</label><input type="text" id="cliNombre" /></div>
            <div className="form-row">
              <div className="form-group"><label>Teléfono:</label><input type="text" id="cliTelefono" /></div>
              <div className="form-group"><label>Email:</label><input type="email" id="cliEmail" /></div>
            </div>
            <div className="form-group"><label>Dirección:</label><textarea id="cliDireccion" rows={2}></textarea></div>
            <div className="form-row">
              <div className="form-group"><label>Tipo:</label><select id="cliTipo"><option>Regular</option><option>Mayorista</option><option>Taller</option><option>Flota</option></select></div>
              <div className="form-group"><label>Límite Crédito:</label><input type="number" id="cliCredito" step="0.01" defaultValue="0" /></div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={onClose}>Cancelar</button>
            <button className="btn btn-success">💾 Guardar</button>
          </div>
        </div>
      </div>

      {/* Modal: Cantidad */}
      <div className={`modal-overlay ${activeModal === 'modalCantidad' ? 'active' : ''}`} onClick={onClose}>
        <div className="modal-window" onClick={stopPropagation}>
          <div className="modal-titlebar"><span>🔢 Cantidad</span><span className="modal-close" onClick={onClose}>✕</span></div>
          <div className="modal-body">
            <div className="form-group">
              <label>Cantidad:</label>
              <input type="number" id="qtyInput" defaultValue="1" min="1" step="1" style={{ fontSize: '24px', textAlign: 'center' }} />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary">✅ Aplicar</button>
          </div>
        </div>
      </div>

      {/* Modal: Item (Add manual) */}
      <div className={`modal-overlay ${activeModal === 'modalItem' ? 'active' : ''}`} onClick={onClose}>
        <div className="modal-window large" onClick={stopPropagation}>
          <div className="modal-titlebar"><span>📋 Agregar Item Manual</span><span className="modal-close" onClick={onClose}>✕</span></div>
          <div className="modal-body">
            <div className="form-group"><label>Descripción:</label><input type="text" id="itemDesc" /></div>
            <div className="form-row">
              <div className="form-group"><label>Precio USD:</label><input type="number" id="itemPrecio" step="0.01" defaultValue="0" /></div>
              <div className="form-group"><label>Cantidad:</label><input type="number" id="itemCant" defaultValue="1" min="1" /></div>
              <div className="form-group"><label>IVA (%):</label><input type="number" id="itemIva" defaultValue="16" step="0.1" /></div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={onClose}>Cancelar</button>
            <button className="btn btn-success">➕ Agregar</button>
          </div>
        </div>
      </div>

      {/* Modal: Aplicar Descuento */}
      <div className={`modal-overlay ${activeModal === 'modalDescuento' ? 'active' : ''}`} onClick={onClose}>
        <div className="modal-window" onClick={stopPropagation}>
          <div className="modal-titlebar"><span>🏷️ Aplicar Descuento</span><span className="modal-close" onClick={onClose}>✕</span></div>
          <div className="modal-body">
            <div className="form-group"><label>Tipo:</label><select id="dsctoTipo"><option value="porcentaje">Porcentaje (%)</option><option value="monto">Monto Fijo (USD)</option></select></div>
            <div className="form-group"><label>Valor:</label><input type="number" id="dsctoValor" step="0.01" defaultValue="0" /></div>
            <div className="form-group"><label>Aplicar a:</label><select id="dsctoAplicar"><option value="item">Item Seleccionado</option><option value="total">Total de la Venta</option></select></div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={onClose}>Cancelar</button>
            <button className="btn btn-success">✅ Aplicar</button>
          </div>
        </div>
      </div>

      {/* Modal: Buscar Cliente */}
      <div className={`modal-overlay ${activeModal === 'modalBuscarCliente' ? 'active' : ''}`} onClick={onClose}>
        <div className="modal-window large" onClick={stopPropagation}>
          <div className="modal-titlebar"><span>🔍 Buscar Cliente</span><span className="modal-close" onClick={onClose}>✕</span></div>
          <div className="modal-body">
            <div className="form-group"><label>Buscar por nombre, RIF o teléfono:</label><input type="text" id="searchClientInput" placeholder="Escriba para buscar..." /></div>
            <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <table className="data-table" id="searchClientTable">
                <thead><tr><th>RIF</th><th>Nombre</th><th>Teléfono</th><th>Saldo</th></tr></thead>
                <tbody id="searchClientTableBody"></tbody>
              </table>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary">✅ Seleccionar</button>
          </div>
        </div>
      </div>

      {/* Modal: Localizar Producto */}
      <div className={`modal-overlay ${activeModal === 'modalLocalizar' ? 'active' : ''}`} onClick={onClose}>
        <div className="modal-window large" onClick={stopPropagation}>
          <div className="modal-titlebar"><span>🔍 Localizar Producto</span><span className="modal-close" onClick={onClose}>✕</span></div>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group"><label>Código:</label><input type="text" id="locCodigo" /></div>
              <div className="form-group"><label>Descripción:</label><input type="text" id="locDesc" /></div>
              <div className="form-group"><label>Categoría:</label><select id="locCat"><option value="">Todas</option><option>Repuesto</option><option>Lubricante</option><option>Servicio</option><option>Accesorio</option></select></div>
            </div>
            <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <table className="data-table" id="locTable">
                <thead><tr><th>Código</th><th>Descripción</th><th>Categoría</th><th>Precio USD</th><th>Stock</th></tr></thead>
                <tbody id="locTableBody"></tbody>
              </table>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary">✅ Agregar al POS</button>
          </div>
        </div>
      </div>

      {/* Modal: Datos (Sale Info) */}
      <div className={`modal-overlay ${activeModal === 'modalDatos' ? 'active' : ''}`} onClick={onClose}>
        <div className="modal-window" onClick={stopPropagation}>
          <div className="modal-titlebar"><span>📋 Datos de la Venta</span><span className="modal-close" onClick={onClose}>✕</span></div>
          <div className="modal-body">
            <div className="form-group"><label>N° Factura:</label><input type="text" id="datFactura" readOnly /></div>
            <div className="form-group"><label>Fecha:</label><input type="text" id="datFecha" readOnly /></div>
            <div className="form-group"><label>Vendedor:</label><input type="text" id="datVendedor" readOnly /></div>
            <div className="form-group"><label>Cliente:</label><input type="text" id="datCliente" readOnly /></div>
            <div className="form-group"><label>Condición:</label><select id="datCondicion"><option>Contado</option><option>Crédito</option></select></div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-primary" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>

      {/* Modal: RIF */}
      <div className={`modal-overlay ${activeModal === 'modalRif' ? 'active' : ''}`} onClick={onClose}>
        <div className="modal-window" onClick={stopPropagation}>
          <div className="modal-titlebar"><span>🔍 Buscar por RIF</span><span className="modal-close" onClick={onClose}>✕</span></div>
          <div className="modal-body">
            <div className="form-group"><label>RIF:</label><input type="text" id="rifSearchInput" placeholder="V-00000000-0" /></div>
            <div id="rifResult" style={{ background: '#f0f0f0', padding: '12px', border: '1px solid #808080', minHeight: '80px' }}>
              <p style={{ color: '#888' }}>Ingrese un RIF para buscar...</p>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={onClose}>Cerrar</button>
            <button className="btn btn-primary">Seleccionar</button>
          </div>
        </div>
      </div>

      {/* Modal: Presupuesto */}
      <div className={`modal-overlay ${activeModal === 'modalPresupuesto' ? 'active' : ''}`} onClick={onClose}>
        <div className="modal-window large" onClick={stopPropagation}>
          <div className="modal-titlebar"><span>📄 Presupuesto</span><span className="modal-close" onClick={onClose}>✕</span></div>
          <div className="modal-body">
            <p style={{ marginBottom: '12px' }}>Los presupuestos guardados aparecerán aquí. Seleccione uno para cargarlo en el POS.</p>
            <div className="table-responsive">
              <table className="data-table" id="presupTable">
                <thead><tr><th>N°</th><th>Fecha</th><th>Cliente</th><th>Items</th><th>Total USD</th><th>Estado</th></tr></thead>
                <tbody id="presupTableBody"></tbody>
              </table>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={onClose}>Cerrar</button>
            <button className="btn btn-success">💾 Guardar Actual como Presupuesto</button>
          </div>
        </div>
      </div>

      {/* Modal: Avanzada F6 */}
      <div className={`modal-overlay ${activeModal === 'modalAvanzada' ? 'active' : ''}`} onClick={onClose}>
        <div className="modal-window large" onClick={stopPropagation}>
          <div className="modal-titlebar"><span>⚡ Búsqueda Avanzada F6</span><span className="modal-close" onClick={onClose}>✕</span></div>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group"><label>Código:</label><input type="text" id="advCodigo" /></div>
              <div className="form-group"><label>Descripción:</label><input type="text" id="advDesc" /></div>
              <div className="form-group"><label>Marca:</label><input type="text" id="advMarca" /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Categoría:</label><select id="advCat"><option value="">Todas</option><option>Repuesto</option><option>Lubricante</option><option>Servicio</option><option>Accesorio</option></select></div>
              <div className="form-group"><label>Precio Min:</label><input type="number" id="advPrecioMin" step="0.01" /></div>
              <div className="form-group"><label>Precio Max:</label><input type="number" id="advPrecioMax" step="0.01" /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Stock:</label><select id="advStock"><option value="">Todos</option><option value="disponible">Con Stock</option><option value="bajo">Stock Bajo</option><option value="agotado">Agotado</option></select></div>
            </div>
            <button className="btn btn-primary" style={{ marginTop: '8px' }}> Buscar</button>
            <div className="table-responsive" style={{ marginTop: '12px', maxHeight: '250px', overflowY: 'auto' }}>
              <table className="data-table" id="advTable">
                <thead><tr><th>Código</th><th>Descripción</th><th>Cat</th><th>Precio USD</th><th>Stock</th></tr></thead>
                <tbody id="advTableBody"></tbody>
              </table>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={onClose}>Cerrar</button>
            <button className="btn btn-primary">➕ Agregar Seleccionado</button>
          </div>
        </div>
      </div>

      {/* Modal: Consultar F2 */}
      <div className={`modal-overlay ${activeModal === 'modalConsultar' ? 'active' : ''}`} onClick={onClose}>
        <div className="modal-window large" onClick={stopPropagation}>
          <div className="modal-titlebar"><span> Consultar Precio F2</span><span className="modal-close" onClick={onClose}>✕</span></div>
          <div className="modal-body">
            <div className="form-group"><label>Código o Descripción:</label><input type="text" id="consultInput" placeholder="Escriba para consultar..." /></div>
            <div id="consultResult" style={{ background: '#f0f0f0', padding: '16px', border: '1px solid #808080', minHeight: '100px' }}>
              <p style={{ color: '#888' }}>Ingrese un código o descripción...</p>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>

      {/* Modal: VPOS */}
      <div className={`modal-overlay ${activeModal === 'modalVPOS' ? 'active' : ''}`} onClick={onClose}>
        <div className="modal-window" onClick={stopPropagation}>
          <div className="modal-titlebar"><span>💳 Opciones VPOS</span><span className="modal-close" onClick={onClose}>✕</span></div>
          <div className="modal-body">
            <div className="form-group"><label>Tipo de Tarjeta:</label><select><option>Débito</option><option>Crédito</option></select></div>
            <div className="form-group"><label>Banco:</label><select><option>Banesco</option><option>Mercantil</option><option>Venezuela</option><option>BOD</option><option>Bicentenario</option><option>Provincial</option></select></div>
            <div className="form-group"><label>Monto USD:</label><input type="number" step="0.01" defaultValue="0" /></div>
            <div className="form-group"><label>Últimos 4 dígitos:</label><input type="text" maxLength={4} placeholder="****" /></div>
            <div className="form-group"><label>N° Aprobación:</label><input type="text" /></div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={onClose}>Cancelar</button>
            <button className="btn btn-success">✅ Procesar</button>
          </div>
        </div>
      </div>
    </>
  );
}
