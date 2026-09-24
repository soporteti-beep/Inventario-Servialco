import csv
import os
from datetime import datetime

def detectar_separador(ruta_archivo):
    """Detecta dinámicamente si el CSV usa coma (,) o punto y coma (;)"""
    with open(ruta_archivo, 'r', encoding='utf-8-sig') as f:
        primera_linea = f.readline()
        return ';' if ';' in primera_linea else ','

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
    modulos_separadores = {}

    fecha_hoy = datetime.now().strftime('%Y-%m-%d')

    # 1. Leer los inventarios base
    for clave, ruta in rutas_csv.items():
        if os.path.exists(ruta):
            sep = detectar_separador(ruta)
            modulos_separadores[clave] = sep
            with open(ruta, mode='r', encoding='utf-8-sig') as f:
                reader = csv.reader(f, delimiter=sep)
                filas = list(reader)
                if filas:
                    modulos_headers[clave] = filas[0]
                    modulos_data[clave] = {
                        fila[0].strip().upper(): fila 
                        for fila in filas[1:] if fila and len(fila) > 0 and fila[0].strip()
                    }
        else:
            print(f"Advertencia: No se encontró la ruta {ruta}")

    # 2. Leer la bitácora
    sep_bit = detectar_separador(bitacora_path)
    with open(bitacora_path, mode='r', encoding='utf-8-sig') as f:
        reader = csv.reader(f, delimiter=sep_bit)
        bitacora_filas = list(reader)

    if len(bitacora_filas) <= 1:
        print("Bitácora vacía o solo contiene cabecera.")
        return

    # 3. Procesar eventos de la bitácora
    for fila in bitacora_filas[1:]:
        if not fila or len(fila) < 8:
            continue

        fecha_entrega = fila[0].strip() if len(fila) > 0 else ''
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

            idx_resp = headers_target.index('responsable') if 'responsable' in headers_target else -1
            idx_area = headers_target.index('area') if 'area' in headers_target else -1
            idx_cargo = headers_target.index('cargo') if 'cargo' in headers_target else -1
            idx_ubic = headers_target.index('ubicacion') if 'ubicacion' in headers_target else -1
            idx_estado = headers_target.index('estado') if 'estado' in headers_target else -1
            idx_prov_target = headers_target.index('proveedor') if 'proveedor' in headers_target else -1
            idx_emp_target = headers_target.index('empresa') if 'empresa' in headers_target else -1
            idx_prov_serial = headers_target.index('serial_proveedor') if 'serial_proveedor' in headers_target else -1
            idx_obs = headers_target.index('observaciones') if 'observaciones' in headers_target else -1
            idx_fecha = headers_target.index('ultima_actualizacion') if 'ultima_actualizacion' in headers_target else -1
            idx_entrega = headers_target.index('fecha_entrega') if 'fecha_entrega' in headers_target else -1

            equipo_encontrado = None
            if serial in inventario_target:
                equipo_encontrado = inventario_target[serial]
            elif idx_prov_serial > -1:
                for k, reg in inventario_target.items():
                    if len(reg) > idx_prov_serial and reg[idx_prov_serial].strip().upper() == serial:
                        equipo_encontrado = reg
                        break

            # --- NUEVA LÓGICA: CREAR EQUIPO SI NO EXISTE ---
            if not equipo_encontrado:
                equipo_encontrado = [''] * len(headers_target)
                equipo_encontrado[0] = serial # Columna 1 siempre es el Serial principal
                if idx_prov_target > -1: equipo_encontrado[idx_prov_target] = proveedor
                if idx_emp_target > -1: equipo_encontrado[idx_emp_target] = empresa
                
                # Lo agregamos al diccionario del módulo correspondiente
                inventario_target[serial] = equipo_encontrado

            # --- ACTUALIZACIÓN DE CAMPOS ---
            max_idx = max(idx_resp, idx_area, idx_cargo, idx_ubic, idx_estado, idx_obs, idx_fecha, idx_entrega, idx_prov_target, idx_emp_target)
            while len(equipo_encontrado) <= max_idx:
                equipo_encontrado.append('')

            if resp and idx_resp > -1: equipo_encontrado[idx_resp] = resp
            if area and idx_area > -1: equipo_encontrado[idx_area] = area
            if cargo and idx_cargo > -1: equipo_encontrado[idx_cargo] = cargo
            if ubicacion and idx_ubic > -1: equipo_encontrado[idx_ubic] = ubicacion
            if estado and idx_estado > -1: equipo_encontrado[idx_estado] = estado
            if obs and idx_obs > -1: equipo_encontrado[idx_obs] = obs
            
            if fecha_entrega and idx_entrega > -1: equipo_encontrado[idx_entrega] = fecha_entrega
            if idx_fecha > -1: equipo_encontrado[idx_fecha] = fecha_hoy

    # 4. Guardar los archivos CSV actualizados
    for clave, ruta in rutas_csv.items():
        if clave in modulos_data and clave in modulos_headers:
            sep = modulos_separadores.get(clave, ',')
            with open(ruta, mode='w', encoding='utf-8', newline='') as f:
                writer = csv.writer(f, delimiter=sep)
                writer.writerow(modulos_headers[clave])
                writer.writerows(modulos_data[clave].values())
            print(f"Archivo {ruta} actualizado exitosamente.")

if __name__ == '__main__':
    procesar_inventario()
