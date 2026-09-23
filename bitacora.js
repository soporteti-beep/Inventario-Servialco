const GITHUB_USER = 'soporteti-beep';
const GITHUB_REPO = 'Inventario-Servialco';

let datosGlobales = []; 
let encabezadosGlobales = [];

async function cargarInventario() {
    try {
        const response = await fetch('inventario.csv?' + new Date().getTime()); 
        const data = await response.text();
        const filas = data.split('\n').filter(row => row.trim().length > 0);
        if(filas.length === 0) return;

        encabezadosGlobales = filas[0].split(',');
        
        let htmlCabecera = '';
        encabezadosGlobales.forEach((h, index) => {
            // OCULTAMOS LA COLUMNA SERIAL ORIGINAL
            if (h === 'serial') return; 
            
            let nombreMostrar = h.toUpperCase().replace(/_/g, ' ');
            // RENOMBRAMOS LA COLUMNA SERIAL PROVEEDOR A "SERIAL AYS"
            if (h === 'serial_proveedor') nombreMostrar = 'SERIAL AYS'; 
            
            htmlCabecera += `<th>${nombreMostrar}</th>`;
        });
        document.getElementById('filas-cabecera').innerHTML = htmlCabecera;

        let gruposUnicos = new Set();
        for (let i = 1; i < filas.length; i++) {
            const columnas = filas[i].split(',');
            const proveedor = columnas[5] ? columnas[5].trim() : 'PROPIO';
            const empresa = columnas[6] ? columnas[6].trim() : 'S/E';
            const etiquetaGrupo = `${proveedor} - ${empresa}`;
            
            gruposUnicos.add(etiquetaGrupo);
            datosGlobales.push({ data: columnas, grupo: etiquetaGrupo });
        }

        const tabsContainer = document.getElementById('tabs-container');
        gruposUnicos.forEach(grupo => {
            if(grupo !== " - ") tabsContainer.innerHTML += `<button class="tab-btn" onclick="filtrarPorPestana('${grupo}', this)">${grupo}</button>`;
        });
        pintarTabla(datosGlobales);
    } catch (e) { console.error("Error cargando inventario", e); }
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
            // OCULTAMOS EL CONTENIDO DE LA COLUMNA SERIAL ORIGINAL
            if (index === idxSerialOrig) return;

            let contenido = celda;
            
            // Badge para Estado
            if (index === idxEstado) {
                let claseBadge = celda === 'ASIGNADO' ? 'bg-asignado' : (celda === 'BODEGA' ? 'bg-bodega' : 'bg-default');
                contenido = `<span class="badge ${claseBadge}">${celda}</span>`;
            }
            
            // CONVERTIMOS LA COLUMNA SERIAL AYS EN EL ENLACE PARA EL HISTORIAL
            if (index === idxSerialProv) {
                // Si la celda está vacía, mostramos el serial original para no dejar el campo en blanco
                let serialAMostrar = celda.trim() !== '' ? celda : valSerialOrig;
                contenido = `<a href="javascript:void(0)" onclick="verHistorial('${valSerialOrig}', '${valSerialProv}')" style="color: #0D6BB4; font-weight: bold; text-decoration: underline;" title="Ver historial de trazabilidad">${serialAMostrar}</a>`;
            }
            
            htmlCuerpo += `<td>${contenido}</td>`;
        });
        htmlCuerpo += '</tr>';
    });
    document.getElementById('cuerpo-tabla').innerHTML = htmlCuerpo;
}

function filtrarPorPestana(grupo, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    document.getElementById("buscador").value = '';
    document.getElementById("filtro-estado").value = '';
    
    filtrarTabla();
}

function filtrarTabla() {
    let filtroGlobal = document.getElementById("buscador").value.toUpperCase();
    let filtroEstado = document.getElementById("filtro-estado").value.toUpperCase();
    let grupoActivo = document.querySelector('.tab-btn.active').innerText;
    
    document.querySelectorAll('.fila-dato').forEach(fila => {
        let coincidePestana = (grupoActivo === 'TODOS LOS EQUIPOS' || fila.getAttribute('data-grupo') === grupoActivo);
        let coincideEstado = (filtroEstado === "" || fila.getAttribute('data-estado') === filtroEstado);
        let coincideGlobal = fila.innerText.toUpperCase().includes(filtroGlobal);
        
        fila.style.display = (coincidePestana && coincideEstado && coincideGlobal) ? "" : "none";
    });
}

async function verHistorial(serialPrincipal, serialProv) {
    try {
        let tituloMostrar = serialProv ? `SERIAL AYS: ${serialProv} (Fábrica: ${serialPrincipal})` : serialPrincipal;
        document.getElementById('historial-serial').innerText = tituloMostrar;
        document.getElementById('cuerpo-historial').innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Consultando bitácora en la nube... ⏳</td></tr>';
        document.getElementById('modalHistorial').style.display = 'block';

        const response = await fetch('bitacora.csv?' + new Date().getTime());
        const data = await response.text();
        const filas = data.split('\n').filter(row => row.trim().length > 0);
        
        let htmlHistorial = '';
        let hayRegistros = false;
        
        for(let i=1; i<filas.length; i++) {
            let cols = filas[i].split(',');
            let colSerial = cols[1] ? cols[1].trim() : '';
            
            if(colSerial === serialPrincipal || (serialProv && colSerial === serialProv)) {
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
        
        if(!hayRegistros) {
            htmlHistorial = '<tr><td colspan="6" style="text-align:center; padding: 20px;">No hay registros de cambios en la bitácora.</td></tr>';
        }
        
        document.getElementById('cuerpo-historial').innerHTML = htmlHistorial;
    } catch(e) {
        document.getElementById('cuerpo-historial').innerHTML = '<tr><td colspan="6" style="text-align:center; color:red; padding: 20px;">Error al cargar el historial.</td></tr>';
    }
}

function cerrarHistorial() {
    document.getElementById('modalHistorial').style.display = 'none';
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

async function guardarEnGitHub() {
    const serial = document.getElementById('m-serial').value.trim();
    const fecha = document.getElementById('m-fecha').value;

    if(!fecha) { alert("La fecha es obligatoria."); return; }
    if(!serial) { alert("El Serial es obligatorio."); return; }

    let token = localStorage.getItem('gh_token');
    if (!token) {
        token = prompt('Ingresa tu GitHub Personal Access Token (PAT):');
        if (!token) return;
        localStorage.setItem('gh_token', token);
    }

    const botonOriginal = document.querySelector('.modal-footer .btn-accion').innerText;
    document.querySelector('.modal-footer .btn-accion').innerText = "Guardando... ⏳";

    const destinoSeleccionado = document.getElementById('m-empresa').value.split(',');
    const nuevoProveedor = destinoSeleccionado[0].trim();
    const nuevaEmpresa = destinoSeleccionado[1].trim();

    const data = [
        fecha, 
        serial, 
        document.getElementById('m-evento').value,
        document.getElementById('m-resp').value, 
        document.getElementById('m-area').value,
        document.getElementById('m-cargo').value, 
        document.getElementById('m-ubic').value,
        document.getElementById('m-estado').value, 
        nuevoProveedor, 
        nuevaEmpresa,
        document.getElementById('m-obs').value
    ].map(val => val.replace(/,/g, '')); 

    const nuevaLinea = "\n" + data.join(',');

    try {
        const getRes = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/bitacora.csv`, {
            headers: { 'Authorization': `token ${token}` }
        });
        if (!getRes.ok) throw new Error("Fallo de autenticación. Verifica tu Token.");
        
        const fileData = await getRes.json();
        const contenidoActual = decodeURIComponent(escape(atob(fileData.content)));
        const contenidoNuevo = contenidoActual + nuevaLinea;
        const contenidoCodificado = btoa(unescape(encodeURIComponent(contenidoNuevo)));

        const putRes = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/bitacora.csv`, {
            method: 'PUT',
            headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `🚀 Actualización vía Web: ${serial} (${fecha})`,
                content: contenidoCodificado,
                sha: fileData.sha
            })
        });

        if (putRes.ok) {
            alert('¡Evento registrado! El robot de GitHub está actualizando el inventario. Recarga la página en 15 segundos.');
            cerrarModal();
            document.querySelectorAll('input:not([disabled])').forEach(i => i.value = ''); 
        } else {
            throw new Error("No se pudo guardar el archivo.");
        }
    } catch (error) {
        alert("Error: " + error.message);
        localStorage.removeItem('gh_token'); 
    } finally {
        document.querySelector('.modal-footer .btn-accion').innerText = botonOriginal;
    }
}

window.onload = cargarInventario;
