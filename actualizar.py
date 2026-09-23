import csv
import os

def procesar_inventario():
    bitacora_path = 'bitacora.csv'
    if not os.path.exists(bitacora_path):
        print("No se encontró el archivo bitacora.csv")
        return

    rutas_csv = {
        'SERVIALCO': 'Servialco/servialco.csv',
        'AYS': 'AYS-Servialco/ays-servialco.csv',
        'UNICAT': 'UNICAT/unicat.csv',
        'ARKY': 'ARKY/arky.csv'
    }

    modulos_data = {}
    modulos_headers = {}

    for clave, ruta in rutas_csv.items():
        if os.path.exists(ruta):
            with open(ruta, mode='r', encoding='utf-8-sig') as f:
                reader = csv.reader(f)
                filas = list(reader)
                if filas:
                    modulos_headers[clave] = filas[0]
                    # Indexar por serial (columna 0) limpiando espacios y mayúsculas
                    modulos_data[clave] = {fila[0].strip().upper(): fila for fila in filas[1:] if fila and len(fila) > 0}
        else:
            print(f"Advertencia: No se encontró la ruta {ruta}")

    with open(bitacora_path, mode='r', encoding='utf-8-sig') as f:
        reader = csv.reader(f)
        bitacora_filas = list(reader)

    if len(bitacora_filas) <= 1:
        print("Bitácora vacía o solo contiene cabecera.")
        return

    for fila in bitacora_filas[1:]:
        if not fila or len(fila) < 8:
            continue

        fecha = fila[0].strip() if len(fila) > 0 else ''
        serial = fila[1].strip().upper() if len(fila) > 1 else ''
        evento = fila[2].strip().upper() if len(fila) > 2 else ''
        resp = fila[3].strip() if len(fila) > 3 else ''
        area = fila[4].strip() if len(fila) > 4 else ''
        cargo = fila[5].strip() if len(fila) > 5 else ''
        ubicacion = fila[6].strip() if len(fila) > 6 else ''
        estado = fila[7].strip().upper() if len(fila) > 7 else ''
        proveedor = fila[8].strip().upper() if len(fila) > 8 else ''
        empresa = fila[9].strip().upper() if len(fila) > 9 else ''
        obs = fila[10].strip() if len(fila) > 10 else ''

        if not serial:
            continue

        clave_modulo = None
        if 'PROPIO' in proveedor or 'SERVIALCO' in proveedor:
            clave_modulo = 'SERVIALCO'
        elif 'AYS' in proveedor:
            clave_modulo = 'AYS'
        elif 'UNICAT' in proveedor:
            clave_modulo = 'UNICAT'
        elif 'ARKY' in proveedor:
            clave_modulo = 'ARKY'

        if clave_modulo and clave_modulo in modulos_data:
            inventario_target = modulos_data[clave_modulo]
            headers_target = [h.strip().lower() for h in modulos_headers[clave_modulo]]

            # Búsqueda dinámica de índices de columnas
            idx_resp = headers_target.index('responsable') if 'responsable' in headers_target else -1
            idx_area = headers_target.index('area') if 'area' in headers_target else -1
            idx_cargo = headers_target.index('cargo') if 'cargo' in headers_target else -1
            idx_ubic = headers_target.index('ubicacion') if 'ubicacion' in headers_target else -1
            idx_estado = headers_target.index('estado') if 'estado' in headers_target else -1
            idx_prov = headers_target.index('serial_proveedor') if 'serial_proveedor' in headers_target else -1

            equipo_encontrado = None
            if serial in inventario_target:
                equipo_encontrado = inventario_target[serial]
            elif idx_prov > -1:
                for k, reg in inventario_target.items():
                    if len(reg) > idx_prov and reg[idx_prov].strip().upper() == serial:
                        equipo_encontrado = reg
                        break

            if equipo_encontrado:
                if resp and idx_resp > -1 and len(equipo_encontrado) > idx_resp: equipo_encontrado[idx_resp] = resp
                if area and idx_area > -1 and len(equipo_encontrado) > idx_area: equipo_encontrado[idx_area] = area
                if cargo and idx_cargo > -1 and len(equipo_encontrado) > idx_cargo: equipo_encontrado[idx_cargo] = cargo
                if ubicacion and idx_ubic > -1 and len(equipo_encontrado) > idx_ubic: equipo_encontrado[idx_ubic] = ubicacion
                if estado and idx_estado > -1 and len(equipo_encontrado) > idx_estado: equipo_encontrado[idx_estado] = estado

    for clave, ruta in rutas_csv.items():
        if clave in modulos_data and clave in modulos_headers:
            with open(ruta, mode='w', encoding='utf-8', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(modulos_headers[clave])
                writer.writerows(modulos_data[clave].values())
            print(f"Archivo {ruta} actualizado exitosamente.")

if __name__ == '__main__':
    procesar_inventario()
