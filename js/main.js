const GITHUB_USER = 'soporteti-beep';
const GITHUB_REPO = 'Inventario-Servialco';
let encabezadosGlobales = [];

async function cargarModulo(csvUrl, esModuloYS) {
    try {
        const response = await fetch(`${csvUrl}?${new Date().getTime()}`); 
        const data = await response.text();
        const filas = data.split('\n').filter(row => row.trim().length > 0);
        if(filas.length === 0) return;

        const separador = filas[0].includes(';') ? ';' : ',';
        encabezadosGlobales = filas[0].split(separador);
        
        let htmlCabecera = '';
        encabezadosGlobales.forEach((h) => {
            if (!esModuloYS && h === 'serial_proveedor') return; 
            let nombreMostrar = h.toUpperCase().replace(/_/g, ' ');
            if (esModuloYS && h === 'serial_proveedor') nombreMostrar = 'SERIAL PROVEEDOR';
            htmlCabecera += `<th>${nombreMostrar}</th>`;
        });
        
        document.querySelectorAll('.filas-cabecera').forEach(el => el.innerHTML = htmlCabecera);

        let datosModulo = [];
        for (let i = 1; i < filas.length; i++) {
            datosModulo.push({ data: filas[i].split(separador) });
        }
        
        pintarTablas(datosModulo, esModuloYS);
        filtrarTabla();
    } catch (e) { console.error("Error cargando base de datos", e); }
}

function pintarTablas(datos, esModuloYS) {
    let htmlComps = '';
    let htmlMons = '';

    let idxEstado = encabezadosGlobales.indexOf('estado');
    let idxSerial = encabezadosGlobales.indexOf('serial');
    let idxTipo = encabezadosGlobales.indexOf('tipo');

    datos.forEach(fila => {
        let celdas = fila.data;
        let estadoActual = idxEstado > -1 && celdas[idxEstado] ? celdas[idxEstado].trim().toUpperCase() : '';
        let valSerial = idxSerial > -1 && celdas[idxSerial] ? celdas[idxSerial].trim() : '';
        let tipoVal = idxTipo > -1 && celdas[idxTipo] ? celdas[idxTipo].trim().toUpperCase() : '';

        // CORRECCIÓN CLAVE: Clasificación amplia para no perder PROBOOK, THINKPAD, etc.
        let esMonitor = tipoVal.includes('MONITOR') || tipoVal.includes('PANTALLA');

        let filaHtml = `<tr class="fila-dato ${esMonitor ? 'fila-monitor' : 'fila-comp'}" data-estado="${estadoActual}">`;
        
        celdas.forEach((celda, index) => {
            if (!esModuloYS && encabezadosGlobales[index] === 'serial_proveedor') return;

            let contenido = celda || '';
            if (index === idxEstado) {
                let claseBadge = contenido === 'ASIGNADO' ? 'bg-asignado' : (contenido === 'BODEGA' ? 'bg-bodega' : 'bg-default');
                contenido = `<span class="badge ${claseBadge}">${contenido}</span>`;
            }
            
            if (index === idxSerial) {
                contenido = `<a href="javascript:void(0)" onclick="verHistorial('${valSerial}')" style="color: inherit; font-weight: bold; text-decoration: underline;">${valSerial}</a>`;
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
    let filtroGlobal = document.getElementById("buscador").value.toUpperCase();
    let filtroEstado = document.getElementById("filtro-estado").value.toUpperCase();

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

    document.getElementById('sec-computadores').style.display = countC > 0 ? 'block' : 'none';
    document.getElementById('sec-monitores').style.display = countM > 0 ? 'block' : 'none';
}

function abrirModal() { 
    document.getElementById('miModal').style.display = 'block'; 
    document.getElementById('m-fecha').value = new Date().toISOString().split('T')[0];
}

function cerrarModal() { document.getElementById('miModal').style.display = 'none'; }
function cerrarHistorial() { document.getElementById('modalHistorial').style.display = 'none'; }

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
        
        for(let i=1; i<filas.length; i++) {
            let sep = filas[i].includes(';') ? ';' : ',';
            let cols = filas[i].split(sep);
            if((cols[1] ? cols[1].trim() : '') === serialBuscado) {
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
        if(!hayRegistros) htmlHistorial = '<tr><td colspan="6" style="text-align:center; padding: 20px;">No hay registros.</td></tr>';
        document.getElementById('cuerpo-historial').innerHTML = htmlHistorial;
    } catch(e) { document.getElementById('cuerpo-historial').innerHTML = '<tr><td colspan="6" style="text-align:center; color:red; padding: 20px;">Error al cargar.</td></tr>'; }
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
        if (!getRes.ok) throw new Error("Fallo de autenticación.");
        
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
            alert('¡Evento registrado! Recarga la página en unos segundos.');
            cerrarModal();
        } else throw new Error("No se pudo guardar.");
    } catch (error) {
        alert("Error: " + error.message);
        localStorage.removeItem('gh_token'); 
    } finally {
        document.querySelector('.modal-footer .btn-guardar').innerText = "💾 Guardar Evento";
    }
}
