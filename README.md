# Inventario-Servialco
# 💻 Sistema de Gestión de Inventario TI (GitOps Architecture)

Un sistema web modular, ligero y descentralizado para la administración, rastreo y trazabilidad de activos de TI (computadores, portátiles y monitores) en tiempo real, alojado completamente en GitHub Pages y automatizado mediante GitHub Actions.

---

## 🚀 Características Principales

* **Arquitectura Modular por Proveedores:**
  * 🏢 **SERVIALCO:** Gestión exclusiva de equipos propios.
  * 🏢 **AYS:** Gestión de equipos alquilados (Servialco / Construsalco) con filtrado por serial del proveedor.
  * 🏢 **UNICAT:** Control de activos alquilados a Unicat.
  * 🏢 **ARKY:** Control de activos alquilados a Arky.
* **Visor Global de Consulta Unificada:** Una pantalla central (`index.html`) que integra automáticamente los datos de todos los módulos en tiempo real para facilitar auditorías y búsquedas mediante pestañas dinámicas sin riesgo de modificar la base de datos.
* **Trazabilidad e Historial (`bitacora.csv`):** Cada evento (nuevo, cambio de responsable, mantenimiento, devolución o eliminación) queda registrado cronológicamente con su fecha y responsable.
* **Sincronización en Vivo y Validaciones Estrictas:** Al registrar un cambio desde la interfaz web, el sistema valida que los seriales existan (o no se dupliquen) antes de conectarse a la API de GitHub, actualizando la página instantánea y silenciosamente sin alertas molestas.
* **Backend Separado (Responsabilidad Única):** Lógica procesada en Python puro y dividida por tipo de evento (`Nuevo.py`, `actualizar.py`, `eliminar.py`, `Devolver.py`) para evitar corrupción de datos.
* **Sincronización con la Nube:** Integración mediante API con Google Cloud y `gspread` para mantener una copia de respaldo automática de la bitácora en Google Sheets.

---

## 🛠️ Estructura del Repositorio

El proyecto sigue una estructura limpia, separando la interfaz visual (Frontend) de la lógica de negocio (Backend en Python) y las bases de datos locales (CSV) de cada proveedor:

```text
Inventario-Servialco/
│
├── .github/
│   └── workflows/
│       └── actualizar.yml         # Workflow automatizado que orquesta los scripts Python
│
├── Servialco/
│   ├── servialco.html             # Módulo visual Servialco (Propios)
│   └── servialco.csv              # Base de datos de equipos propios
│
├── AYS-Servialco/
│   ├── ays-servialco.html         # Módulo visual AYS
│   └── ays-servialco.csv          # Base de datos de equipos AYS
│
├── UNICAT/
│   ├── unicat.html                # Módulo visual UNICAT
│   └── unicat.csv                 # Base de datos de equipos UNICAT
│
├── ARKY/
│   ├── arky.html                  # Módulo visual ARKY
│   └── arky.csv                   # Base de datos de equipos ARKY
│
├── css/
│   └── style.css                  # Hoja de estilos centralizada para toda la aplicación
│
├── js/
│   ├── api.js                     # Comunicación con GitHub API y validaciones de datos
│   └── ui.js                      # Interfaz gráfica, dibujado de tablas y modales
│
├── py.py/                         # Backend: Scripts de procesamiento por evento
│   ├── Nuevo.py                   # Lógica para la creación de nuevos equipos
│   ├── actualizar.py              # Lógica para actualización de responsables y estados
│   ├── eliminar.py                # Lógica para retirar permanentemente un equipo
│   ├── Devolver.py                # Lógica para retirar equipos y marcarlos como devueltos
│   └── actualizar_sheet.py        # Conector API para respaldar la bitácora en Google Sheets
│
├── index.html                     # Visor global de consulta unificada (Front page)
├── bitacora.csv                   # Registro maestro de trazabilidad e historial general
├── logo-servialco.png             # Logotipo corporativo
└── README.md                      # Documentación del proyecto
