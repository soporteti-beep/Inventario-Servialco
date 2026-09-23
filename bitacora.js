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
        
        // 1. Pintar Encabezados
        document.getElementById('filas-cabecera').innerHTML = encabezadosGlobales.map(h => `<th>${h.toUpperCase().replace(/_/g, ' ')}</th>`).join('');
        
        // 2. Pintar Filtros por Columna (Estilo Excel)
        document.getElementById('filas-filtros').innerHTML = encabezadosGlobales.map((_, index) => 
            `<td class="th-filtro"><input type="text" class="col-filter" data-idx="${index}" onkeyup="filtrarTabla()" placeholder="🔍 Filtrar..."></td>`
        ).join('');

        let gruposUnicos = new Set();
        for (let i = 1; i < filas.length; i++) {
            const columnas = filas[i].split(',');
            // Aseguramos que no haya espacios raros que creen pestañas dobles
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
    } catch (e) { console.error("Error", e); }
}

function pintarTabla(datos) {
    let htmlCuerpo = '';
    datos.forEach(fila => {
        htmlCuerpo += `<tr class="fila-dato" data-grupo="${fila.grupo}">`;
        fila.data.forEach((celda, index) => {
            let contenido = celda;
            if (encabezadosGlobales[index] === 'estado') {
                let claseBadge = celda === 'ASIGNADO' ? 'bg-asignado' : (celda === 'BODEGA' ? 'bg-bodega' : (celda === 'SOPORTE' ? 'bg-default' : 'bg-default'));
                if (celda === 'SOPORTE') claseBadge = 'bg-default'; // Color gris para soporte
                contenido = `<span class="badge ${claseBadge}">${celda}</span>`;
            }
            htmlCuerpo += `<td>${contenido}</td>`;
        });
        htmlCuerpo += '</tr>';
    });
    document.getElementById('cuerpo-tabla').innerHTML = htmlCuerpo;
}

function filtrarPorPestana(grupo, btn) {
    // Cambiar estilo del botón activo
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Limpiar todos los filtros al cambiar de pestaña para evitar confusiones
    document.getElementById("buscador").value = '';
    document.querySelectorAll('.col-filter').forEach(input => input.value = '');
    
    // Ejecutar filtro maestro
    filtrarTabla();
}

// MOTOR DE FILTRADO MAESTRO (Pestañas + Global + Columnas)
function filtrarTabla() {
    let filtroGlobal = document.getElementById("buscador").value.toUpperCase();
    let grupoActivo = document.querySelector('.tab-btn.active').innerText;
    
    // Obtener los valores de todos los filtros de columna
    let filtrosColumnas = Array.from(document.querySelectorAll('.col-filter')).map(input => input.value.toUpperCase());

    document.querySelectorAll('.fila-dato').forEach(fila => {
        // 1. Validar Pestaña
        let coincidePestana = (grupoActivo === 'TODOS LOS EQUIPOS' || fila.getAttribute('data-grupo') === grupoActivo);
        
        // 2. Validar Buscador Global
        let textoFila = fila.innerText.toUpperCase();
        let coincideGlobal = textoFila.includes(filtroGlobal);
        
        // 3. Validar Filtros de Columna Exactos
        let coincideColumnas = true;
        let celdas = fila.getElementsByTagName('td');
        
        filtrosColumnas.forEach((filtroCol, index) => {
            if (filtroCol && celdas[index]) {
                if (!celdas[index].innerText.toUpperCase().includes(filtroCol)) {
                    coincideColumnas = false;
                }
            }
        });

        // Mostrar u ocultar la fila
        fila.style.display = (coincidePestana && coincideGlobal && coincideColumnas) ? "" : "none";
    });
}

function abrirModal() { 
    document.getElementById('miModal').style.display = 'block'; 
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

    // Desbloquear campos por defecto
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
    if(!serial) { alert("El Serial es obligatorio."); return; }

    let token = localStorage.getItem('gh_token');
    if (!token) {
        token = prompt('Ingresa tu GitHub Personal Access Token (PAT):');
        if (!token) return;
        localStorage.setItem('gh_token', token);
    }

    const botonOriginal = document.querySelector('.modal-footer .btn-accion').innerText;
    document.querySelector('.modal-footer .btn-accion').innerText = "Guardando... ⏳";

    // Extraer proveedor y empresa limpiamente de la selección ("AYS,SERVIALCO")
    const destinoSeleccionado = document.getElementById('m-empresa').value.split(',');
    const nuevoProveedor = destinoSeleccionado[0].trim();
    const nuevaEmpresa = destinoSeleccionado[1].trim();

    const f = new Date().toISOString().split('T')[0];
    const data = [
        f, 
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
                message: `🚀 Actualización vía Web: ${serial}`,
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
