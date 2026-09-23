// ==========================================
// CONEXIÓN CON GITHUB Y DATOS (API)
// ==========================================

async function cargarInventario() {
    try {
        const response = await fetch('inventario.csv?' + new Date().getTime()); 
        const data = await response.text();
        const filas = data.split('\n').filter(row => row.trim().length > 0);
        if(filas.length === 0) return;

        encabezadosGlobales = filas[0].split(',');
        renderizarEncabezados();

        let gruposUnicos = new Set();
        datosGlobales = []; // Limpiamos datos antes de llenar

        for (let i = 1; i < filas.length; i++) {
            const columnas = filas[i].split(',');
            const proveedor = columnas[5] ? columnas[5].trim() : 'PROPIO';
            const empresa = columnas[6] ? columnas[6].trim() : 'S/E';
            const etiquetaGrupo = `${proveedor} - ${empresa}`;
            
            gruposUnicos.add(etiquetaGrupo);
            datosGlobales.push({ data: columnas, grupo: etiquetaGrupo });
        }

        renderizarPestanas(gruposUnicos);
        pintarTabla(datosGlobales);
    } catch (e) { console.error("Error cargando inventario", e); }
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
