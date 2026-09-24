// ==========================================
// api.js - COMUNICACIÓN CON GITHUB API Y DATOS
// ==========================================

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
        
        renderizarEncabezados(esModuloYS);

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
                        let idxResp = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'responsable');
                        let idxArea = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'area');
                        let idxCargo = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'cargo');
                        let idxUbic = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'ubicacion');
                        let idxEstado = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'estado');
                        let idxObs = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'observaciones');
                        let idxFecha = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'ultima_actualizacion');
                        let idxEntrega = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'fecha_entrega');

                        if (idxResp > -1 && bResp) equipoEncontrado[idxResp] = bResp;
                        if (idxArea > -1 && bArea) equipoEncontrado[idxArea] = bArea;
                        if (idxCargo > -1 && bCargo) equipoEncontrado[idxCargo] = bCargo;
                        if (idxUbic > -1 && bUbic) equipoEncontrado[idxUbic] = bUbic;
                        if (idxEstado > -1 && bEstado) equipoEncontrado[idxEstado] = bEstado;
                        if (idxObs > -1 && bObs) equipoEncontrado[idxObs] = bObs;
                        if (idxFecha > -1 && bFecha) equipoEncontrado[idxFecha] = bFecha;
                        if (idxEntrega > -1 && bFecha) equipoEncontrado[idxEntrega] = bFecha;
                    }
                }
            }
        } catch (errBit) {
            console.warn("Bitácora no sincronizada:", errBit);
        }

        let datosModulo = Object.values(mapaInventario).map(cols => ({ data: cols }));
        pintarTablas(datosModulo, esModuloYS);
        
        if (typeof window.filtrarTabla === 'function') {
            window.filtrarTabla();
        } else {
            filtrarTabla();
        }
        
    } catch (e) { console.error("Error cargando módulo", e); }
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
