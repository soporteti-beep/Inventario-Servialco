# 🚀 Sistema Global de Inventarios | Servialco Asset Tracking

> **La evolución del control de activos fijos.**
> Una plataforma ágil, automatizada y en la nube que transforma la manera en que **Servialco SAS** y sus aliados (AYS, UNICAT, ARKY) administran, rastrean y auditan sus equipos tecnológicos.

---

## 🎯 ¿Qué soluciona esta plataforma?

El sistema elimina el caos de tener múltiples archivos de Excel desactualizados rodando por correos electrónicos. En su lugar, ofrece un portal web unificado, seguro y automático.

*   👁️ **Visión Global 360°:** Un buscador maestro. Escribe un nombre, un serial o el nombre de un empleado, y el sistema te dirá exactamente qué equipo tiene y en qué estado está, sin importar de qué empresa sea.
*   🏢 **Módulos Independientes:** Espacios de trabajo separados para cada proveedor (Servialco, AYS, UNICAT, ARKY). Cada técnico trabaja solo en su módulo, pero todo alimenta a una misma base central.
*   ⏳ **Historial Incorruptible (Trazabilidad):** ¿Quién tuvo este portátil hace un año? El sistema guarda una "caja negra" o bitácora de cada movimiento (nuevas asignaciones, cambios de área, soporte y bajas). Nada se pierde.
*   ⚡ **Cero Instalaciones:** Funciona como cualquier página web moderna. Se abre desde el navegador sin instalar absolutamente nada.

---

## ⚙️ ¿Cómo funciona? (La Arquitectura del Sistema)

El sistema funciona como una fábrica automatizada. En lugar de tener a una persona copiando y pegando datos, tenemos "asistentes automáticos" (robots) trabajando en la nube. 

El flujo es simple y ocurre en segundos:

1. **La Pantalla (Interacción):** El usuario de soporte técnico abre la página web y registra que un equipo cambió de dueño.
2. **El Libro Mayor (Bitácora):** Ese movimiento se anota automáticamente en un archivo maestro intocable llamado `bitacora.csv`.
3. **El Robot Organizador (Automatización):** Al detectar una nueva anotación, un robot en la nube se despierta, lee la bitácora y clasifica la información (Ej: *"Ah, este equipo es de AYS, lo guardaré en la carpeta de AYS"*).
4. **El Reporte Gerencial (Sincronización):** Finalmente, el robot actualiza un archivo de **Google Sheets** en tiempo real para que la gerencia pueda auditar el inventario desde su Drive, siempre con la última versión.

---

## 💡 ¿Por qué se diseñó de esta manera?

Esta estructura fue elegida estratégicamente por tres grandes beneficios para la empresa:

*   **Cero Costos de Infraestructura:** No se necesita comprar ni alquilar servidores costosos. Todo el sistema vive en la infraestructura gratuita de GitHub y Google.
*   **Inmunidad a Errores Humanos:** Si alguien borra un dato por accidente, el sistema en la nube guarda una "foto" de cada versión del inventario. Siempre se puede viajar en el tiempo y recuperar la información.
*   **Datos Siempre Sincronizados:** Al centralizar todo en una bitácora que es leída por procesos automáticos, es imposible que el reporte de gerencia diga una cosa y la pantalla del técnico diga otra. Todo es exactamente igual en todas partes.

---

## 📂 ¿Cómo está organizado el proyecto visualmente?

Si miras los archivos del sistema, verás que todo está ordenado de forma lógica y modular. Así es como se ve por dentro:

```text
📁 Inventario-Servialco/
│
├── 📄 index.html         👉 El "Visor Global" (La pantalla principal con el súper-buscador)
├── 📄 bitacora.csv       👉 El "Libro Mayor" (Donde queda el registro de TODO lo que pasa)
│
├── 📁 Servialco/         👉 Pantalla y datos exclusivos de equipos propios de Servialco
├── 📁 AYS-Servialco/     👉 Pantalla y datos exclusivos de equipos de AYS
├── 📁 UNICAT/            👉 Pantalla y datos exclusivos de equipos de UNICAT
├── 📁 ARKY/              👉 Pantalla y datos exclusivos de equipos de ARKY
│
├── 📁 js/                👉 El "Motor Interactivo" (Hace que las pantallas respondan rápido y abran ventanas)
├── 📁 css/               👉 El "Maquillaje" (Colores, tipos de letra, el logo y el diseño visual)
│
├── 📁 py.py/             👉 El "Cerebro Organizador" (Los scripts/robots que procesan y ordenan los datos)
└── 📁 .github/           👉 Las "Instrucciones del Jefe" (Le dice a la nube a qué hora y cómo activar los robots)
