const GITHUB_USER = 'soporteti-beep';
const GITHUB_REPO = 'Inventario-Servialco';
let encabezadosGlobales = [];

async function cargarModulo(csvUrl, esModuloYS) {
    try {
        const timestamp = new Date().getTime();
        
        // 1. Cargar el CSV base del módulo
        const responseCsv = await fetch(`${csvUrl}?${timestamp}`); 
        const dataCsv = await responseCsv.text();
        const filasCsv = dataCsv.split('\n').filter(row => row.trim().length > 0);
        if(filasCsv.length === 0) return;

        const separador = filasCsv[0].includes(';') ? ';' : ',';
        encabezadosGlobales = filasCsv[0].split(separador);
        
        let htmlCabecera = '';
        encabezadosGlobales.forEach((h) => {
            if (!esModuloYS && h.trim() === 'serial_proveedor') return; 
            let nombreMostrar = h.toUpperCase().replace(/_/g, ' ');
            if (esModuloYS && h.trim() === 'serial_proveedor') nombreMostrar = 'SERIAL PROVEEDOR';
            htmlCabecera += `<th>${nombreMostrar}</th>`;
        });
        document.querySelectorAll('.filas-cabecera').forEach(el => el.innerHTML = htmlCabecera);

        let mapaInventario = {};
        for (let i = 1; i < filasCsv.length; i++) {
            let cols = filasCsv[i].split(separador);
            let serialKey = cols[0] ? cols[0].trim().toUpperCase() : '';
            if (serialKey) {
                mapaInventario[serialKey] = cols;
            }
        }

        // 2. Sincronización en vivo con bitacora.csv
        try {
            const responseBit = await fetch(`../bitacora.csv?${timestamp}`);
            if (responseBit.ok) {
                const dataBit = await responseBit.text();
                const filasBit = dataBit.split('\n').filter(row => row.trim().length > 0);
                
                for (let i = 1; i < filasBit.length; i++) {
                    let sepBit = filasBit[i].includes(';') ? ';' : ',';
                    let colsBit = filasBit[i].split(sepBit);
                    if (colsBit.length < 11) continue;

                    let bFecha = colsBit[0] ? colsBit[0].trim() : '';
                    let bSerial = colsBit[1] ? colsBit[1].trim().toUpperCase() : '';
                    let bResp = colsBit[3] ? colsBit[3].trim() : '';
                    let bArea = colsBit[4] ? colsBit[4].trim() : '';
                    let bCargo = colsBit[5] ? colsBit[5].trim() : '';
                    let bUbic = colsBit[6] ? colsBit[6].trim() : '';
                    let bEstado = colsBit[7] ? colsBit[7].trim().toUpperCase() : '';
                    let bObs = colsBit[10] ? colsBit[10].trim() : '';

                    let equipoEncontrado = null;
                    if (mapaInventario[bSerial]) {
                        equipoEncontrado = mapaInventario[bSerial];
                    }

                    if (equipoEncontrado) {
                        // Búsqueda dinámica y segura de los índices
                        let idxResp = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'responsable');
                        let idxArea = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'area');
                        let idxCargo = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'cargo');
                        let idxUbic = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'ubicacion');
                        let idxEstado = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'estado');
                        let idxObs = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'observaciones');
                        let idxFecha = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'ultima_actualizacion');

                        if (idxResp > -1 && bResp) equipoEncontrado[idxResp] = bResp;
                        if (idxArea > -1 && bArea) equipoEncontrado[idxArea] = bArea;
                        if (idxCargo > -1 && bCargo) equipoEncontrado[idxCargo] = bCargo;
                        if (idxUbic > -1 && bUbic) equipoEncontrado[idxUbic] = bUbic;
                        if (idxEstado > -1 && bEstado) equipoEncontrado[idxEstado] = bEstado;
                        if (idxObs > -1 && bObs) equipoEncontrado[idxObs] = bObs;
                        if (idxFecha > -1 && bFecha) equipoEncontrado[idxFecha] = bFecha;
                    }
                }
            }
        } catch (errBit) {
            console.warn("Bitácora no sincronizada:", errBit);
        }

        let datosModulo = Object.values(mapaInventario).map(cols => ({ data: cols }));
        pintarTablas(datosModulo, esModuloYS);
        
        // Ejecutar filtros dinámicos
        if (typeof window.filtrarTabla === 'function') {
            window.filtrarTabla();
        } else {
            filtrarTabla();
        }
        
    } catch (e) { console.error("Error cargando módulo", e); }
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

        let esMonitor = tipoVal.includes('MONITOR') || tipoVal.includes('PANTALLA');

        let filaHtml = `<tr class="fila-dato ${esMonitor ? 'fila-monitor' : 'fila-comp'}" data-estado="${estadoActual}" data-empresa="${empresaActual}">`;
        
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

    document.getElementById('cuerpo-computadores').innerHTML = htmlComps;
    document.getElementById('cuerpo-monitores').innerHTML = htmlMons;
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
    if(document.getElementById('miModal')) document.getElementById('miModal').style.display = 'block'; 
    if(document.getElementById('m-fecha')) document.getElementById('m-fecha').value = new Date().toISOString().split('T')[0];
}

function cerrarModal() { if(document.getElementById('miModal')) document.getElementById('miModal').style.display = 'none'; }
function cerrarHistorial() { if(document.getElementById('modalHistorial')) document.getElementById('modalHistorial').style.display = 'none'; }

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

async function guardarEnGitHub(proveedorForzado, empresaForzada) {
    const serial = document.getElementById('m-serial').value.trim();
    const fecha = document.getElementById('m-fecha').value;
    const evento = document.getElementById('m-evento').value;

    if(!fecha || !serial) { alert("Fecha y Serial son obligatorios."); return; }

    let token = localStorage.getItem('gh_token') || prompt('Ingresa tu GitHub Token (PAT):');
    if (!token) return;
    localStorage.setItem('gh_token', token);

    document.querySelector('.modal-footer .btn-guardar').innerText = "Guardando... ⏳";

    const data = [
        fecha, serial, evento, document.getElementById('m-resp').value, 
        document.getElementById('m-area').value, document.getElementById('m-cargo').value, 
        document.getElementById('m-ubic').value, document.getElementById('m-estado').value, 
        proveedorForzado, empresaForzada, document.getElementById('m-obs').value, ''
    ].map(val => val.replace(/,/g, '')); 

    try {
        const getRes = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/bitacora.csv`, { headers: { 'Authorization': `token ${token}` }});
        if (!getRes.ok) throw new Error("Fallo de autenticación. Verifica tu Token.");
        
        const fileData = await getRes.json();
        const contenidoNuevo = decodeURIComponent(escape(atob(fileData.content))) + "\n" + data.join(',');

        const putRes = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/bitacora.csv`, {
            method: 'PUT',
            headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `🚀 Evento ${proveedorForzado}: ${serial}`,
                content: btoa(unescape(encodeURIComponent(contenidoNuevo))),
                sha: fileData.sha
            })
        });

        if (putRes.ok) {
            alert('¡Evento registrado exitosamente! La página se recargará.');
            cerrarModal();
            location.reload();
        } else throw new Error("No se pudo guardar.");
    } catch (error) {
        alert("Error: " + error.message);
        localStorage.removeItem('gh_token'); 
    } finally {
        document.querySelector('.modal-footer .btn-guardar').innerText = "💾 Guardar Evento";
    }
}
