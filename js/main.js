// ==========================================
// VARIABLES GLOBALES Y CONFIGURACIÓN
// ==========================================
const GITHUB_USER = 'soporteti-beep';
const GITHUB_REPO = 'Inventario-Servialco';
let datosGlobales = []; 
let encabezadosGlobales = [];

// Iniciar la app al cargar la página 
window.onload = () => {
    cargarInventario();
};

// ==========================================
// LÓGICA DE FILTROS Y PESTAÑAS
// ==========================================
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
