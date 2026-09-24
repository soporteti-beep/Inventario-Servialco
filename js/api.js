// ==========================================
// api.js - COMUNICACIÓN CON GITHUB API Y DATOS
// ==========================================

const GITHUB_USER = 'soporteti-beep';
const GITHUB_REPO = 'Inventario-Servialco';
let encabezadosGlobales = [];
let mapaInventarioGlobal = {};

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
        
        renderizarEncabezados(esModuloYS);

        mapaInventarioGlobal = {};
        for (let i = 1; i < filasCsv.length; i++) {
            let cols = filasCsv[i].split(separador);
            let serialKey = cols[0] ? cols[0].trim().toUpperCase() : '';
            if (serialKey) {
                mapaInventarioGlobal[serialKey] = cols;
            }
        }

        // 2. Sincronización en vivo con bitacora.csv
        try {
            const responseBit = await fetch(`../bitacora.csv?${timestamp}`);
            if (responseBit.ok) {
                const dataBit = await responseBit.text();
                const filasBit = dataBit.split('\n').filter(row => row.trim().length > 0);
                const fechaHoy = new Date().toISOString().split('T')[0];
                
                for (let i = 1; i < filasBit.length; i++) {
                    let sepBit = filasBit[i].includes(';') ? ';' : ',';
                    let colsBit = filasBit[i].split(sepBit);
                    if (colsBit.length < 11) continue;

                    let bFechaEntrega = colsBit[0] ? colsBit[0].trim() : ''; // Fecha elegida manualmente
                    let bSerial = colsBit[1] ? colsBit[1].trim().toUpperCase() : '';
                    let bResp = colsBit[3] ? colsBit[3].trim() : '';
                    let bArea = colsBit[4] ? colsBit[4].trim() : '';
                    let bCargo = colsBit[5] ? colsBit[5].trim() : '';
                    let bUbic = colsBit[6] ? colsBit[6].trim() : '';
                    let bEstado = colsBit[7] ? colsBit[7].trim().toUpperCase() : '';
                    let bObs = colsBit[10] ? colsBit[10].trim() : '';

                    let equipoEncontrado = null;
                    if (mapaInventarioGlobal[bSerial]) {
                        equipoEncontrado = mapaInventarioGlobal[bSerial];
                    }

                    if (equipoEncontrado) {
                        let idxResp = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'responsable');
                        let idxArea = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'area');
                        let idxCargo = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'cargo');
                        let idxUbic = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'ubicacion');
                        let idxEstado = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'estado');
                        let idxObs = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'observaciones');
                        let idxFechaAct = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'ultima_actualizacion');
                        let idxEntrega = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'fecha_entrega');

                        if (idxResp > -1 && bResp) equipoEncontrado[idxResp] = bResp;
                        if (idxArea > -1 && bArea) equipoEncontrado[idxArea] = bArea;
                        if (idxCargo > -1 && bCargo) equipoEncontrado[idxCargo] = bCargo;
                        if (idxUbic > -1 && bUbic) equipoEncontrado[idxUbic] = bUbic;
                        if (idxEstado > -1 && bEstado) equipoEncontrado[idxEstado] = bEstado;
                        if (idxObs > -1 && bObs) equipoEncontrado[idxObs] = bObs;
                        
                        // FECHA ENTREGA -> Fecha elegida en el modal
                        if (idxEntrega > -1 && bFechaEntrega) equipoEncontrado[idxEntrega] = bFechaEntrega;
                        
                        // ULTIMA ACTUALIZACION -> Fecha de HOY (ahora)
                        if (idxFechaAct > -1) equipoEncontrado[idxFechaAct] = fechaHoy;
                    }
                }
            }
        } catch (errBit) {
            console.warn("Bitácora no sincronizada:", errBit);
        }

        let datosModulo = Object.values(mapaInventarioGlobal).map(cols => ({ data: cols }));
        pintarTablas(datosModulo, esModuloYS);
        
        if (typeof window.filtrarTabla === 'function') {
            window.filtrarTabla();
        } else {
            filtrarTabla();
        }
        
    } catch (e) { console.error("Error cargando módulo", e); }
}

async function guardarEnGitHub(proveedorForzado, empresaForzada) {
    const serial = document.getElementById('m-serial').value.trim().toUpperCase();
    const fechaEntrega = document.getElementById('m-fecha').value;
    const evento = document.getElementById('m-evento').value;

    if(!fechaEntrega || !serial) { alert("Fecha de Entrega y Serial son obligatorios."); return; }

    let token = localStorage.getItem('gh_token') || prompt('Ingresa tu GitHub Token (PAT):');
    if (!token) return;
    localStorage.setItem('gh_token', token);

    document.querySelector('.modal-footer .btn-guardar').innerText = "Guardando... ⏳";

    // Datos del NUEVO evento que el usuario está registrando
    const dataNuevoEvento = [
        fechaEntrega, 
        serial, 
        evento, 
        document.getElementById('m-resp').value, 
        document.getElementById('m-area').value, 
        document.getElementById('m-cargo').value, 
        document.getElementById('m-ubic').value, 
        document.getElementById('m-estado').value, 
        proveedorForzado, 
        empresaForzada, 
        document.getElementById('m-obs').value, 
        ''
    ].map(val => val.replace(/,/g, '')); 

    try {
        const getRes = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/bitacora.csv`, { headers: { 'Authorization': `token ${token}` }});
        if (!getRes.ok) throw new Error("Fallo de autenticación. Verifica tu Token.");
        
        const fileData = await getRes.json();
        const contenidoActual = decodeURIComponent(escape(atob(fileData.content)));
        const filasBit = contenidoActual.split('\n').filter(row => row.trim().length > 0);

        // 1. Verificar si este serial ya tiene algún registro previo en la bitácora
        let existeEnBitacora = false;
        for(let i = 1; i < filasBit.length; i++) {
            let sep = filasBit[i].includes(';') ? ';' : ',';
            let cols = filasBit[i].split(sep);
            let sBit = cols[1] ? cols[1].trim().toUpperCase() : '';
            if(sBit === serial) {
                existeEnBitacora = true;
                break;
            }
        }

        let lineasNuevas = "";

        // 2. SI NO EXISTÍA EN LA BITÁCORA: Capturamos automáticamente su estado PREVIO antes de aplicar el nuevo cambio
        if(!existeEnBitacora) {
            let equipoPrevio = mapaInventarioGlobal[serial];
            let idxProv = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'serial_proveedor');
            
            if(!equipoPrevio && idxProv > -1) {
                equipoPrevio = Object.values(mapaInventarioGlobal).find(cols => cols[idxProv] && cols[idxProv].trim().toUpperCase() === serial);
            }

            if(equipoPrevio) {
                let idxResp = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'responsable');
                let idxArea = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'area');
                let idxCargo = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'cargo');
                let idxUbic = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'ubicacion');
                let idxEstado = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'estado');
                let idxEntrega = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'fecha_entrega');
                let idxObs = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'observaciones');

                let prevResp = idxResp > -1 && equipoPrevio[idxResp] ? equipoPrevio[idxResp].trim() : '';
                let prevArea = idxArea > -1 && equipoPrevio[idxArea] ? equipoPrevio[idxArea].trim() : '';
                let prevCargo = idxCargo > -1 && equipoPrevio[idxCargo] ? equipoPrevio[idxCargo].trim() : '';
                let prevUbic = idxUbic > -1 && equipoPrevio[idxUbic] ? equipoPrevio[idxUbic].trim() : '';
                let prevEstado = idxEstado > -1 && equipoPrevio[idxEstado] ? equipoPrevio[idxEstado].trim() : '';
                let prevFecha = idxEntrega > -1 && equipoPrevio[idxEntrega] && equipoPrevio[idxEntrega].trim() !== '' 
                    ? equipoPrevio[idxEntrega].trim() 
                    : '2025-06-13'; // Fecha por defecto si no tenía
                let prevObs = idxObs > -1 && equipoPrevio[idxObs] && equipoPrevio[idxObs].trim() !== '' 
                    ? equipoPrevio[idxObs].trim() 
                    : 'Asignación inicial previa a la actualización web';

                const dataInicial = [
                    prevFecha, 
                    serial, 
                    'ASIGNACION_INICIAL', 
                    prevResp, 
                    prevArea, 
                    prevCargo, 
                    prevUbic, 
                    prevEstado, 
                    proveedorForzado, 
                    empresaForzada, 
                    prevObs, 
                    ''
                ].map(val => val.replace(/,/g, ''));

                lineasNuevas += "\n" + dataInicial.join(',');
            }
        }

        // 3. Agregamos la línea del nuevo cambio que se acaba de llenar en el formulario
        lineasNuevas += "\n" + dataNuevoEvento.join(',');

        const contenidoNuevo = contenidoActual + lineasNuevas;

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
            alert('¡Evento y trazabilidad histórica registrados exitosamente! La página se recargará.');
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
