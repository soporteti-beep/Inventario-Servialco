// ==========================================
// INTERFAZ GRÁFICA Y MODALES (DOM)
// ==========================================

function renderizarEncabezados() {
    let htmlCabecera = '';
    encabezadosGlobales.forEach((h, index) => {
        if (h === 'serial') return; // Ocultamos la de fábrica
        let nombreMostrar = h.toUpperCase().replace(/_/g, ' ');
        if (h === 'serial_proveedor') nombreMostrar = 'SERIAL AYS'; 
        htmlCabecera += `<th>${nombreMostrar}</th>`;
    });
    document.getElementById('filas-cabecera').innerHTML = htmlCabecera;
}

function renderizarPestanas(gruposUnicos) {
    const tabsContainer = document.getElementById('tabs-container');
    tabsContainer.innerHTML = `<button class="tab-btn active" onclick="filtrarPorPestana('TODOS', this)">TODOS LOS EQUIPOS</button>`;
    
    gruposUnicos.forEach(grupo => {
        if(grupo !== " - ") tabsContainer.innerHTML += `<button class="tab-btn" onclick="filtrarPorPestana('${grupo}', this)">${grupo}</button>`;
    });
}

function pintarTabla(datos) {
    let htmlCuerpo = '';
    let idxEstado = encabezadosGlobales.indexOf('estado');
    let idxSerialOrig = encabezadosGlobales.indexOf('serial');
    let idxSerialProv = encabezadosGlobales.indexOf('serial_proveedor');

    datos.forEach(fila => {
        let estadoActual = idxEstado > -1 ? fila.data[idxEstado].trim().toUpperCase() : '';
        let valSerialOrig = idxSerialOrig > -1 ? fila.data[idxSerialOrig].trim() : '';
        let valSerialProv = idxSerialProv > -1 ? fila.data[idxSerialProv].trim() : '';

        htmlCuerpo += `<tr class="fila-dato" data-grupo="${fila.grupo}" data-estado="${estadoActual}">`;
        
        fila.data.forEach((celda, index) => {
            if (index === idxSerialOrig) return; // Saltamos la original

            let contenido = celda;
            if (index === idxEstado) {
                let claseBadge = celda === 'ASIGNADO' ? 'bg-asignado' : (celda === 'BODEGA' ? 'bg-bodega' : 'bg-default');
                contenido = `<span class="badge ${claseBadge}">${celda}</span>`;
            }
            
            if (index === idxSerialProv) {
                let serialAMostrar = celda.trim() !== '' ? celda : valSerialOrig;
                contenido = `<a href="javascript:void(0)" onclick="verHistorial('${valSerialOrig}', '${valSerialProv}')" style="color: #0D6BB4; font-weight: bold; text-decoration: underline;" title="Ver historial de trazabilidad">${serialAMostrar}</a>`;
            }
            
            htmlCuerpo += `<td>${contenido}</td>`;
        });
        htmlCuerpo += '</tr>';
    });
    document.getElementById('cuerpo-tabla').innerHTML = htmlCuerpo;
}

function abrirModal() { 
    document.getElementById('miModal').style.display = 'block'; 
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('m-fecha').value = hoy;
    ajustarFormulario();
}

function cerrarModal() { 
    document.getElementById('miModal').style.display = 'none'; 
}

function ajustarFormulario() {
    let evento = document.getElementById('m-evento').value;
    let resp = document.getElementById('m-resp');
    let area = document.getElementById('m-area');
    let cargo = document.getElementById('m-cargo');
    let estado = document.getElementById('m-estado');

    resp.disabled = false; area.disabled = false; cargo.disabled = false;
    
    if (evento === 'DEVOLUCION_PROVEEDOR') {
        resp.value = 'PROVEEDOR'; resp.disabled = true;
        area.value = 'N/A'; area.disabled = true;
        cargo.value = 'N/A'; cargo.disabled = true;
        estado.value = 'DEVUELTO';
    } else if (evento === 'REPARACION') {
        estado.value = 'SOPORTE';
    } else {
        if(resp.value === 'PROVEEDOR' || resp.disabled) {
            resp.value = ''; area.value = ''; cargo.value = '';
        }
        estado.value = 'ASIGNADO';
    }
}

function cerrarHistorial() {
    document.getElementById('modalHistorial').style.display = 'none';
}
