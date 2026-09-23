import csv
import os

def procesar_inventario():
    bitacora_path = 'bitacora.csv'
    if not os.path.exists(bitacora_path):
        print("No se encontró el archivo bitacora.csv")
        return

    # Mapeo de rutas para cada módulo
    rutas_csv = {
        'SERVIALCO': 'Servialco/servialco.csv',
        'AYS': 'AYS-Servialco/ays-servialco.csv',
        'UNICAT': 'UNICAT/unicat.csv',
        'ARKY': 'ARKY/arky.csv'
    }

    # Cargar todos los archivos CSV de módulos existentes
    modulos_data = {}
    modulos_headers = {}

    for clave, ruta in rutas_csv.items():
        if os.path.exists(ruta):
            with open(ruta, mode='r', encoding='utf-8') as f:
                reader = csv.reader(f)
                filas = list(reader)
                if filas:
                    modulos_headers[clave] = filas[0]
                    # Indexar por serial (columna 0)
                    modulos_data[clave] = {fila[0].strip(): fila for fila in filas[1:] if fila}
        else:
            print(f"Advertencia: No se encontró la ruta {ruta}")

    # Leer bitácora y aplicar actualizaciones
    with open(bitacora_path, mode='r', encoding='utf-8') as f:
        reader = csv.reader(f)
        bitacora_filas = list(reader)

    if len(bitacora_filas) <= 1:
        print("Bitácora vacía o solo contiene cabecera.")
        return

    # Procesar eventos en orden cronológico
    for fila in bitacora_filas[1:]:
        if not fila or len(fila) < 10:
            continue

        fecha, serial, evento, resp, area, cargo, ubicacion, estado, proveedor, empresa, obs = fila[:11]
        serial = serial.strip()
        proveedor_upper = proveedor.strip().upper()

        clave_modulo = None
        if 'PROPIO' in proveedor_upper or 'SERVIALCO' in proveedor_upper:
            clave_modulo = 'SERVIALCO'
        elif 'AYS' in proveedor_upper:
            clave_modulo = 'AYS'
        elif 'UNICAT' in proveedor_upper:
            clave_modulo = 'UNICAT'
        elif 'ARKY' in proveedor_upper:
            clave_modulo = 'ARKY'

        if clave_modulo and clave_modulo in modulos_data:
            inventario_target = modulos_data[clave_modulo]
            
            if serial in inventario_target:
                # Actualizar campos del registro existente
                registro = inventario_target[serial]
                # Estructura asume: serial, nombre, tipo, marca, propiedad, proveedor, empresa, responsable, area, cargo, ubicacion, estado...
                if len(registro) >= 12:
                    registro[7] = resp        # Responsable
                    registro[8] = area        # Área
                    registro[9] = cargo       # Cargo
                    registro[10] = ubicacion  # Ubicación
                    registro[11] = estado     # Estado
            else:
                # Registro de nuevo activo si el evento es de creación
                if evento.strip().upper() == 'CREACION_NUEVO':
                    tipo_activo = fila[11] if len(fila) > 11 else 'PORTATIL'
                    nuevo_registro = [
                        serial, f"NUEVO-{serial[:6]}", tipo_activo, "GENERICO", 
                        "PROPIO" if clave_modulo == "SERVIALCO" else "ALQUILER",
                        proveedor, empresa, resp, area, cargo, ubicacion, estado,
                        "", "", "SI", "365", "", fecha, obs, fecha
                    ]
                    inventario_target[serial] = nuevo_registro

    # Reescribir los archivos CSV actualizados
    for clave, ruta in rutas_csv.items():
        if clave in modulos_data and clave in modulos_headers:
            with open(ruta, mode='w', encoding='utf-8', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(modulos_headers[clave])
                writer.writerows(modulos_data[clave].values())
            print(f"Archivo {ruta} actualizado exitosamente.")

if __name__ == '__main__':
    procesar_inventario()
