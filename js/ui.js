// ==========================================
// ui.js - INTERFAZ GRÁFICA Y MODALES (DOM)
// ==========================================

function renderizarEncabezados(esModuloYS) {
    let htmlCabecera = '';
    encabezadosGlobales.forEach((h) => {
        if (!esModuloYS && h.trim() === 'serial_proveedor') return; 
        let nombreMostrar = h.toUpperCase().replace(/_/g, ' ');
        if (esModuloYS && h.trim() === 'serial_proveedor') nombreMostrar = 'SERIAL PROVEEDOR';
        htmlCabecera += `<th>${nombreMostrar}</th>`;
    });
    document.querySelectorAll('.filas-cabecera').forEach(el => el.innerHTML = htmlCabecera);
}

function pintarTablas(datos, esModuloYS) {
    let htmlComps = '';
    let htmlMons = '';

    let idxEstado = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'estado');
    let idxEmpresa = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'empresa');
    let idxTipo = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'tipo');
    let idxSerial = 0; 

    datos.forEach(fila => {
        let celdas = fila.data;
        let estadoActual = idxEstado > -1 && celdas[idxEstado] ? celdas[idxEstado].trim().toUpperCase() : '';
        let empresaActual = idxEmpresa > -1 && celdas[idxEmpresa] ? celdas[idxEmpresa].trim().toUpperCase() : '';
        let valSerial = celdas[idxSerial] ? celdas[idxSerial].trim() : '';
        let tipoVal = idxTipo > -1 && celdas[idxTipo] ? celdas[idxTipo].trim().toUpperCase() : '';
        
        let grupoActual = fila.grupo || '';

        let esMonitor = tipoVal.includes('MONITOR') || tipoVal.includes('PANTALLA');

        let filaHtml = `<tr class="fila-dato ${esMonitor ? 'fila-monitor' : 'fila-comp'}" data-estado="${estadoActual}" data-empresa="${empresaActual}" data-grupo="${grupoActual}">`;
        
        celdas.forEach((celda, index) => {
            if (!esModuloYS && encabezadosGlobales[index].trim() === 'serial_proveedor') return;

            let contenido = celda || '';
            if (index === idxEstado) {
                let claseBadge = contenido === 'ASIGNADO' ? 'bg-asignado' : (contenido === 'BODEGA' ? 'bg-bodega' : 'bg-default');
                contenido = `<span class="badge ${claseBadge}">${contenido}</span>`;
            }
            
            if (index === idxSerial && valSerial !== '') {
                contenido = `<a href="javascript:void(0)" onclick="verHistorial('${valSerial}')" style="color: inherit; font-weight: bold; text-decoration: underline; cursor: pointer;">${valSerial}</a>`;
            }
            
            filaHtml += `<td>${contenido}</td>`;
        });
        filaHtml += '</tr>';

        if (esMonitor) htmlMons += filaHtml;
        else htmlComps += filaHtml;
    });

    if(document.getElementById('cuerpo-computadores')) document.getElementById('cuerpo-computadores').innerHTML = htmlComps;
    if(document.getElementById('cuerpo-monitores')) document.getElementById('cuerpo-monitores').innerHTML = htmlMons;
}

function filtrarTabla() {
    let filtroGlobal = document.getElementById("buscador") ? document.getElementById("buscador").value.toUpperCase() : '';
    let filtroEstado = document.getElementById("filtro-estado") ? document.getElementById("filtro-estado").value.toUpperCase() : '';

    let countC = 0, countM = 0;

    document.querySelectorAll('.fila-dato').forEach(fila => {
        let coincideEstado = (filtroEstado === "" || fila.getAttribute('data-estado') === filtroEstado);
        let coincideGlobal = fila.innerText.toUpperCase().includes(filtroGlobal);
        
        if (coincideEstado && coincideGlobal) {
            fila.style.display = "";
            if (fila.classList.contains('fila-comp')) countC++;
            else if (fila.classList.contains('fila-monitor')) countM++;
        } else {
            fila.style.display = "none";
        }
    });

    if(document.getElementById('sec-computadores')) document.getElementById('sec-computadores').style.display = countC > 0 ? 'block' : 'none';
    if(document.getElementById('sec-monitores')) document.getElementById('sec-monitores').style.display = countM > 0 ? 'block' : 'none';
}

function abrirModal() { 
    if(document.getElementById('miModal')) {
        document.getElementById('miModal').style.display = 'block'; 
        
        // Reiniciar valores del formulario al abrir
        if(document.getElementById('m-serial')) document.getElementById('m-serial').value = '';
        if(document.getElementById('m-evento')) document.getElementById('m-evento').selectedIndex = 0; 
        if(document.getElementById('m-resp')) document.getElementById('m-resp').value = '';
        if(document.getElementById('m-area')) document.getElementById('m-area').value = '';
        if(document.getElementById('m-cargo')) document.getElementById('m-cargo').value = '';
        if(document.getElementById('m-ubic')) document.getElementById('m-ubic').value = '';
        if(document.getElementById('m-estado')) document.getElementById('m-estado').value = 'ASIGNADO';
        if(document.getElementById('m-obs')) document.getElementById('m-obs').value = '';
        
        // Limpiar los 4 campos nuevos por si acaso
        if(document.getElementById('m-nombre')) document.getElementById('m-nombre').value = '';
        if(document.getElementById('m-marca')) document.getElementById('m-marca').value = '';
        if(document.getElementById('m-tipo')) document.getElementById('m-tipo').selectedIndex = 0;
        if(document.getElementById('m-propiedad')) document.getElementById('m-propiedad').selectedIndex = 0;

        // Vinculamos el evento onchange a la lista desplegable y actualizamos la vista
        const selectEvento = document.getElementById('m-evento');
        if (selectEvento) {
            selectEvento.onchange = toggleCamposPorEvento;
            toggleCamposPorEvento(); // Ejecutar inmediatamente al abrir
        }
    }
    if(document.getElementById('m-fecha')) {
        document.getElementById('m-fecha').value = new Date().toISOString().split('T')[0];
    }
}

// NUEVA FUNCIÓN MEJORADA: Oculta o muestra campos dependiendo del evento
function toggleCamposPorEvento() {
    const selectEvento = document.getElementById('m-evento');
    if (!selectEvento) return;

    const evento = selectEvento.value.toUpperCase();
    console.log("Cambio detectado. Evento seleccionado:", evento); // <- RASTREADOR PARA DEPURACIÓN
    
    // IDs de los campos que queremos ocultar al eliminar/devolver
    const camposExtras = ['m-area', 'm-cargo', 'm-ubic', 'm-estado', 'm-resp'];
    
    // Elementos con la clase .campo-nuevo (Nombre, Tipo, Marca, Propiedad)
    const camposNuevos = document.querySelectorAll('.campo-nuevo');

    // 1. Mostrar/Ocultar campos normales (Responsable, Area, Cargo...)
    camposExtras.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento && elemento.parentElement) {
            if (evento === 'ELIMINAR' || evento === 'DEVOLVER') {
                elemento.parentElement.style.display = 'none';
            } else {
                elemento.parentElement.style.display = '';
            }
        }
    });

    // 2. Mostrar/Ocultar campos exclusivos de "NUEVO"
    camposNuevos.forEach(el => {
        if (evento === 'NUEVO') {
            el.style.display = ''; // Aparecen
        } else {
            el.style.display = 'none'; // Se esconden
        }
    });
}

function cerrarModal() { 
    if(document.getElementById('miModal')) document.getElementById('miModal').style.display = 'none'; 
}

function cerrarHistorial() { 
    if(document.getElementById('modalHistorial')) document.getElementById('modalHistorial').style.display = 'none'; 
}

function prepararGuardado(proveedor, empresa) {
    const btnGuardar = document.querySelector('.modal-footer .btn-guardar');
    if(btnGuardar) {
        const nuevoBtn = btnGuardar.cloneNode(true);
        btnGuardar.parentNode.replaceChild(nuevoBtn, btnGuardar);
        
        nuevoBtn.addEventListener('click', () => {
            if (typeof guardarEnGitHub === 'function') {
                guardarEnGitHub(proveedor, empresa);
            } else {
                console.error("La función guardarEnGitHub no está definida en api.js");
            }
        });
    }
}

async function verHistorial(serialBuscado) {
    try {
        document.getElementById('historial-serial').innerText = serialBuscado;
        document.getElementById('cuerpo-historial').innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Consultando bitácora... ⏳</td></tr>';
        document.getElementById('modalHistorial').style.display = 'block';

        const response = await fetch('../bitacora.csv?' + new Date().getTime());
        const data = await response.text();
        const filas = data.split('\n').filter(row => row.trim().length > 0);
        
        let htmlHistorial = '';
        let hayRegistros = false;
        
        let sTarget1 = serialBuscado ? serialBuscado.toUpperCase() : '';

        for(let i=1; i<filas.length; i++) {
            let sep = filas[i].includes(';') ? ';' : ',';
            let cols = filas[i].split(sep);
            let sBit = cols[1] ? cols[1].trim().toUpperCase() : '';
            
            if(sBit === sTarget1) {
                hayRegistros = true;
                htmlHistorial += `<tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 10px;">${cols[0] || ''}</td>
                    <td style="padding: 10px;"><strong>${cols[2] || ''}</strong></td>
                    <td style="padding: 10px;">${cols[3] || ''}</td>
                    <td style="padding: 10px;">${cols[6] || ''}</td>
                    <td style="padding: 10px;"><span class="badge bg-default">${cols[7] || ''}</span></td>
                    <td style="padding: 10px;">${cols[10] || ''}</td>
                </tr>`;
            }
        }
        if(!hayRegistros) htmlHistorial = '<tr><td colspan="6" style="text-align:center; padding: 20px;">No hay registros en la bitácora para este serial.</td></tr>';
        document.getElementById('cuerpo-historial').innerHTML = htmlHistorial;
    } catch(e) { 
        document.getElementById('cuerpo-historial').innerHTML = '<tr><td colspan="6" style="text-align:center; color:red; padding: 20px;">Error al cargar historial.</td></tr>'; 
        console.error(e);
    }
}
