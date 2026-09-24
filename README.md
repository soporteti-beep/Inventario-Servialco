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
* **Visor Global de Consulta Unificada:** Una pantalla central (`index.html`) que integra automáticamente los datos de todos los módulos en tiempo real para facilitar auditorías y búsquedas sin riesgo de modificar la base de datos.
* **Trazabilidad e Historial (`bitacora.csv`):** Cada evento (cambio de responsable, mantenimiento, reubicación o devolución) queda registrado cronológicamente con su fecha y responsable.
* **Sincronización en Vivo:** Al registrar un cambio desde la interfaz web, el sistema actualiza en caliente los datos en memoria y dispara la automatización.
* **GitOps & Automatización:** GitHub Actions (`actualizar.yml` + `actualizar.py`) procesa periódicamente el archivo de bitácora y actualiza la base de datos de cada módulo sin intervención manual.

---

## 🛠️ Estructura del Repositorio

El proyecto sigue una estructura limpia, separando la interfaz visual de la lógica de negocio y las bases de datos locales de cada proveedor:

```text
Inventario-Servialco/
│
├── .github/
│   └── workflows/
│       └── actualizar.yml          # Workflow de automatización CI/CD
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
│   └── style.css                  # Hoja de estilos centralizada
│
├── js/
│   └── main.js                    # Motor JavaScript unificado y lógica GitHub API
│
├── index.html                     # Visor global de consulta unificada
├── bitacora.csv                   # Registro maestro de trazabilidad e historial
├── actualizar.py                  # Script Python que procesa la bitácora
├── actualizar_sheet.py            # Script Python que procesa la bitácora y envía los datos a una Hoja de Calculo de Google Drive
└── README.md                      # Documentación del proyecto
