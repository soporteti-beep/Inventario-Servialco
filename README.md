# 📦 Sistema de Inventario Activo Fijos - Servialco

Este es un sistema de gestión de inventarios web dinámico e integrado, diseñado para administrar los activos fijos y equipos de Servialco SAS y sus distintos módulos (AYS, UNICAT, ARKY). 

El sistema utiliza una arquitectura *Serverless* que combina una interfaz frontend ligera (HTML/JS) con un backend seguro desplegado en Vercel, el cual sincroniza los datos directamente con GitHub y Google Sheets.

## 🚀 Características Principales

*   **Visor Global Integrado (`index.html`):** Panel unificado que consolida todos los activos de la empresa en una sola vista, permitiendo filtrar por empresa, estado o realizar búsquedas globales.
*   **Módulos Independientes:** Vistas especializadas para cada proveedor o subdivisión (Servialco, AYS, UNICAT, ARKY) para una gestión aislada y enfocada.
*   **Gestión Documental Conforme:** Interfaz adaptada a la norma de la empresa (CÓDIGO: GT.FO.01).
*   **Trazabilidad Completa (Bitácora):** Cada equipo cuenta con un historial detallado de eventos (Asignación, Cambio de Responsable, Devoluciones a proveedor, Soporte técnico, etc.).
*   **Creación Dinámica de Activos:** Formularios inteligentes que adaptan sus campos (Nombre, Tipo, Marca, Propiedad) al vuelo dependiendo del tipo de evento seleccionado.
*   **Backend Seguro en Vercel:** Comunicación cifrada y protección de credenciales. La interfaz web no expone ningún Token de GitHub.
*   **Sincronización Automática con Excel:** Mediante GitHub Actions y la librería `gspread`, todos los cambios realizados en la web se respaldan en documentos de Google Sheets de manera autónoma.

## 🏗️ Arquitectura del Sistema

1.  **Frontend (UI/UX):** 
    *   HTML5 y CSS puro para los componentes visuales.
    *   `js/ui.js`: Controla el DOM, los modales de interacción y el comportamiento de visibilidad condicional de los formularios de registro de equipos.
    *   `js/api.js`: Motor de comunicación. Intercepta las solicitudes del usuario y se comunica con la API Serverless para inyectar actualizaciones optimistas en la interfaz.
2.  **API Segura (Serverless):**
    *   `api/github.js`: Función desplegada en Vercel que protege el Token Personal de GitHub (`GH_TOKEN`). Recibe las peticiones JSON de `api.js` y ejecuta los commits (vía `PUT`) contra el archivo `bitacora.csv`.
3.  **Backend / Automatización (GitHub Actions):**
    *   `.github/workflows/actualizar.yml`: Flujo de trabajo que se dispara al detectar un cambio en `bitacora.csv`.
    *   `py.py/Nuevo.py`: Script maestro en Python. Procesa cronológicamente la bitácora para actualizar, crear o dar de baja equipos en los archivos CSV individuales de cada módulo (`servialco.csv`, `ays.csv`, etc.).
    *   Sincronizador de Google Sheets: Script en Python (`actualizar_sheet.py`) que toma la versión final procesada de los inventarios y actualiza la nube de Google Drive usando credenciales de servicio.

## 🛠️ Despliegue y Configuración

El proyecto está diseñado para funcionar en GitHub Pages (para el frontend) y Vercel (para la API proxy).

### 1. Variables de Entorno (Vercel)
Para que el puente entre la web y GitHub funcione, es necesario configurar en Vercel el entorno:
*   `GH_TOKEN`: Token de Acceso Personal (PAT) de GitHub con permisos de escritura (repo).

### 2. Secretos de Acción (GitHub Actions)
Para el respaldo en Google Sheets:
*   `GDRIVE_CREDENTIALS`: Contenido JSON de la cuenta de servicio de Google Cloud Platform con permisos sobre el documento de cálculo de destino.

## ⚙️ Prevención de Caché (Cache Busting)

Debido a que este es un sistema donde la información visual se actualiza agresivamente mediante JavaScript, todas las referencias a los scripts en los archivos HTML (`api.js` y `ui.js`) utilizan un parámetro de versión (`?v=XX`). Esto asegura que cuando se realice un despliegue con mejoras en el código, todos los navegadores de los usuarios finales descarguen la versión más reciente, previniendo errores de visualización de datos.

---
*Desarrollado para Servialco SAS. 2025.*
