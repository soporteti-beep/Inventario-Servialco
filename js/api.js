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

                    let bFechaEntrega = colsBit[0] ? colsBit[0].trim() : '';
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
                        if (idxEntrega > -1 && bFechaEntrega) equipoEncontrado[idxEntrega] = bFechaEntrega;
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

    // ==========================================
    // VALIDACIONES ESTRICTAS DE INVENTARIO
    // ==========================================
    const eventoUpper = evento.toUpperCase().trim();
    let equipoExiste = false;

    if (mapaInventarioGlobal[serial]) {
        equipoExiste = true;
    } else {
        let idxProv = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'serial_proveedor');
        if (idxProv > -1) {
            equipoExiste = Object.values(mapaInventarioGlobal).some(cols => cols[idxProv] && cols[idxProv].trim().toUpperCase() === serial);
        }
    }

    if (eventoUpper === 'NUEVO' && equipoExiste) {
        alert(`❌ ERROR: El serial ${serial} YA EXISTE en este inventario.`);
        return; 
    }

    if (eventoUpper !== 'NUEVO' && eventoUpper !== 'ASIGNACION_INICIAL' && !equipoExiste) {
        alert(`❌ ERROR: El serial ${serial} NO EXISTE. Si es un equipo recién comprado, debes seleccionar el evento "Nuevo".`);
        return; 
    }
    // ==========================================

    let token = localStorage.getItem('gh_token') || prompt('Ingresa tu GitHub Token (PAT):');
    if (!token) return;
    localStorage.setItem('gh_token', token);

    document.querySelector('.modal-footer .btn-guardar').innerText = "Guardando... ⏳";

    try {
        const urlAPI = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/bitacora.csv`;
        const getRes = await fetch(urlAPI, { headers: { 'Authorization': `token ${token}` }});
        if (!getRes.ok) throw new Error("Fallo de autenticación. Verifica tu Token.");
        
        const fileData = await getRes.json();
        const contenidoActual = decodeURIComponent(escape(atob(fileData.content)));
        const filasBit = contenidoActual.split('\n').filter(row => row.trim().length > 0);

        // IMPORTANTE: Detectar qué separador usa tu bitacora.csv (; o ,)
        let sep = ',';
        if (filasBit.length > 0 && filasBit[0].includes(';')) {
            sep = ';';
        }

        // Construimos la data usando el separador dinámico para no dañar el CSV
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
            // Capturamos los 4 campos nuevos para la bitácora
            document.getElementById('m-nombre') ? document.getElementById('m-nombre').value : '',
            document.getElementById('m-tipo') ? document.getElementById('m-tipo').value : '',
            document.getElementById('m-marca') ? document.getElementById('m-marca').value : '',
            document.getElementById('m-propiedad') ? document.getElementById('m-propiedad').value : ''
        ].map(val => val.replace(new RegExp(sep, 'g'), '').replace(/\n/g, ' ')); 

        let existeEnBitacora = false;
        for(let i = 1; i < filasBit.length; i++) {
            let sepLinea = filasBit[i].includes(';') ? ';' : ',';
            let cols = filasBit[i].split(sepLinea);
            let sBit = cols[1] ? cols[1].trim().toUpperCase() : '';
            if(sBit === serial) {
                existeEnBitacora = true;
                break;
            }
        }

        let lineasNuevas = "";

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
                    : '2025-06-13'; 
                let prevObs = idxObs > -1 && equipoPrevio[idxObs] && equipoPrevio[idxObs].trim() !== '' 
                    ? equipoPrevio[idxObs].trim() 
                    : 'Asignación inicial previa a la actualización web';

                const dataInicial = [
                    prevFecha, serial, 'ASIGNACION_INICIAL', prevResp, prevArea, prevCargo, prevUbic, prevEstado, proveedorForzado, empresaForzada, prevObs,
                    '', '', '', ''
                ].map(val => val.replace(new RegExp(sep, 'g'), '').replace(/\n/g, ' '));

                lineasNuevas += "\n" + dataInicial.join(sep);
            }
        }

        lineasNuevas += "\n" + dataNuevoEvento.join(sep);
        const contenidoNuevo = contenidoActual + lineasNuevas;

        const putRes = await fetch(urlAPI, {
            method: 'PUT',
            headers: { 
                'Authorization': `token ${token}`, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                message: `🚀 Evento ${proveedorForzado}: ${serial}`,
                content: btoa(unescape(encodeURIComponent(contenidoNuevo))),
                sha: fileData.sha,
                branch: 'main'
            })
        });

        if (putRes.ok) {
            cerrarModal(); 

            // ==========================================
            // ACTUALIZACIÓN OPTIMISTA (Redibujo Mágico)
            // ==========================================
            if (eventoUpper === 'ELIMINAR' || eventoUpper === 'DEVOLVER') {
                delete mapaInventarioGlobal[serial];
            } else {
                let equipo = mapaInventarioGlobal[serial];
                
                if (!equipo) {
                    equipo = new Array(encabezadosGlobales.length).fill('');
                    equipo[0] = serial;
                    
                    let idxProv = encabezadosGlobales.findIndex(h => h.trim().toLowerCase().includes('proveedor'));
                    let idxEmp = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'empresa');
                    let idxNombre = encabezadosGlobales.findIndex(h => h.trim().toLowerCase().replace(/_/g, ' ') === 'nombre equipo');
                    let idxTipo = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'tipo');
                    let idxMarca = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'marca');
                    let idxProp = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'propiedad');
                    
                    if (idxProv > -1) equipo[idxProv] = proveedorForzado;
                    if (idxEmp > -1) equipo[idxEmp] = empresaForzada;
                    
                    if (idxNombre > -1) equipo[idxNombre] = document.getElementById('m-nombre') ? document.getElementById('m-nombre').value.toUpperCase() : '';
                    if (idxTipo > -1) equipo[idxTipo] = document.getElementById('m-tipo') ? document.getElementById('m-tipo').value.toUpperCase() : 'PORTATIL';
                    if (idxMarca > -1) equipo[idxMarca] = document.getElementById('m-marca') ? document.getElementById('m-marca').value.toUpperCase() : '';
                    if (idxProp > -1) equipo[idxProp] = document.getElementById('m-propiedad') ? document.getElementById('m-propiedad').value.toUpperCase() : '';
                    
                    mapaInventarioGlobal[serial] = equipo;
                }

                let idxResp = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'responsable');
                let idxArea = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'area');
                let idxCargo = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'cargo');
                let idxUbic = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'ubicacion');
                let idxEstado = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'estado');
                let idxObs = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'observaciones');
                let idxFechaAct = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'ultima_actualizacion');
                let idxEntrega = encabezadosGlobales.findIndex(h => h.trim().toLowerCase() === 'fecha_entrega');

                let mResp = document.getElementById('m-resp').value.toUpperCase();
                let mArea = document.getElementById('m-area').value.toUpperCase();
                let mCargo = document.getElementById('m-cargo').value.toUpperCase();
                let mUbic = document.getElementById('m-ubic').value.toUpperCase();
                let mEstado = document.getElementById('m-estado').value.toUpperCase();
                let mObs = document.getElementById('m-obs').value.toUpperCase();
                let fechaHoy = new Date().toISOString().split('T')[0];

                if (idxResp > -1 && mResp) equipo[idxResp] = mResp;
                if (idxArea > -1 && mArea) equipo[idxArea] = mArea;
                if (idxCargo > -1 && mCargo) equipo[idxCargo] = mCargo;
                if (idxUbic > -1 && mUbic) equipo[idxUbic] = mUbic;
                if (idxEstado > -1 && mEstado) equipo[idxEstado] = mEstado;
                if (idxObs > -1 && mObs) equipo[idxObs] = mObs;
                if (idxEntrega > -1 && fechaEntrega) equipo[idxEntrega] = fechaEntrega;
                if (idxFechaAct > -1) equipo[idxFechaAct] = fechaHoy;
            }

            let datosModulo = Object.values(mapaInventarioGlobal).map(cols => ({ data: cols }));
            let esModuloYS = encabezadosGlobales.some(h => h.trim().toLowerCase() === 'serial_proveedor');
            
            const buscador = document.getElementById("buscador");
            if(buscador) buscador.value = "";
            
            pintarTablas(datosModulo, esModuloYS);
            if (typeof window.filtrarTabla === 'function') {
                window.filtrarTabla();
            }

            const toast = document.createElement('div');
            toast.innerText = '¡Aplicado al instante! ☁️ Sincronizando con la nube en segundo plano...';
            toast.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background-color: #0D6BB4; color: white; padding: 15px 25px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.2); font-family: sans-serif; font-weight: bold; z-index: 9999; opacity: 0; transition: opacity 0.5s ease;';
            document.body.appendChild(toast);
            
            setTimeout(() => { toast.style.opacity = '1'; }, 100);
            setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 500); }, 3500);

        } else {
            const errorDetails = await putRes.json();
            throw new Error(`Error de GitHub: ${errorDetails.message}`);
        }
    } catch (error) {
        alert("Error: " + error.message);
        if (error.message.includes("autenticación") || error.message.includes("Bad credentials")) {
            localStorage.removeItem('gh_token'); 
        }
    } finally {
        document.querySelector('.modal-footer .btn-guardar').innerText = "💾 Guardar Evento";
    }
}
