async function guardarEnGitHub() {
    const serial = document.getElementById('m-serial').value.trim();
    const fecha = document.getElementById('m-fecha').value;
    const evento = document.getElementById('m-evento').value;

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

    // Capturamos el tipo si es una creación nueva, de lo contrario lo dejamos vacío
    const tipoActivo = evento === 'CREACION_NUEVO' ? document.getElementById('m-tipo').value : '';

    const data = [
        fecha, 
        serial, 
        evento,
        document.getElementById('m-resp').value, 
        document.getElementById('m-area').value,
        document.getElementById('m-cargo').value, 
        document.getElementById('m-ubic').value,
        document.getElementById('m-estado').value, 
        nuevoProveedor, 
        nuevaEmpresa,
        document.getElementById('m-obs').value,
        tipoActivo // Enviamos el tipo de activo al final
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
