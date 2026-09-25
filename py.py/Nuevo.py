import csv
import os
from datetime import datetime

def detectar_separador(ruta_archivo):
    with open(ruta_archivo, 'r', encoding='utf-8-sig') as f:
        primera_linea = f.readline()
        return ';' if ';' in primera_linea else ','

def procesar_nuevos():
    bitacora_path = 'bitacora.csv'
    if not os.path.exists(bitacora_path):
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

    # Cargar CSVs existentes
    for clave, ruta in rutas_csv.items():
        if os.path.exists(ruta):
            sep = detectar_separador(ruta)
            modulos_separadores[clave] = sep
            with open(ruta, mode='r', encoding='utf-8-sig') as f:
                reader = csv.reader(f, delimiter=sep)
                filas = list(reader)
                if filas:
                    modulos_headers[clave] = [h.strip() for h in filas[0]]
                    modulos_data[clave] = {
                        fila[0].strip().upper(): fila 
                        for fila in filas[1:] if fila and len(fila) > 0 and fila[0].strip()
                    }

    sep_bit = detectar_separador(bitacora_path)
    with open(bitacora_path, mode='r', encoding='utf-8-sig') as f:
        reader = csv.reader(f, delimiter=sep_bit)
        bitacora_filas = list(reader)

    if len(bitacora_filas) <= 1:
        return

    for fila in bitacora_filas[1:]:
        if not fila or len(fila) < 8:
            continue

        fecha_entrega = fila[0].strip()
        serial = fila[1].strip().upper()
        evento = fila[2].strip().upper()
        resp = fila[3].strip()
        area = fila[4].strip()
        cargo = fila[5].strip()
        ubicacion = fila[6].strip()
        estado = fila[7].strip().upper()
        proveedor = fila[8].strip().upper()
        empresa = fila[9].strip().upper()
        obs = fila[10].strip() if len(fila) > 10 else ''
        
        # Nuevos campos
        nombre_eq = fila[11].strip().upper() if len(fila) > 11 else ''
        tipo_eq = fila[12].strip().upper() if len(fila) > 12 else ''
        marca_eq = fila[13].strip().upper() if len(fila) > 13 else ''
        propiedad_eq = fila[14].strip().upper() if len(fila) > 14 else ''

        if not serial or evento != 'NUEVO':
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
            headers_target = [h.lower() for h in modulos_headers[clave_modulo]]

            # Mapeo de índices tolerante
            idx_resp = headers_target.index('responsable') if 'responsable' in headers_target else -1
            idx_area = headers_target.index('area') if 'area' in headers_target else -1
            idx_cargo = headers_target.index('cargo') if 'cargo' in headers_target else -1
            idx_ubic = headers_target.index('ubicacion') if 'ubicacion' in headers_target else -1
            idx_estado = headers_target.index('estado') if 'estado' in headers_target else -1
            idx_obs = headers_target.index('observaciones') if 'observaciones' in headers_target else -1
            idx_fecha = headers_target.index('ultima_actualizacion') if 'ultima_actualizacion' in headers_target else -1
            idx_entrega = headers_target.index('fecha_entrega') if 'fecha_entrega' in headers_target else -1
            
            idx_prov = next((i for i, h in enumerate(headers_target) if 'proveedor' in h), -1)
            idx_emp = headers_target.index('empresa') if 'empresa' in headers_target else -1
            idx_nombre = next((i for i, h in enumerate(headers_target) if h in ['nombre equipo', 'nombre_equipo']), -1)
            idx_tipo = headers_target.index('tipo') if 'tipo' in headers_target else -1
            idx_marca = headers_target.index('marca') if 'marca' in headers_target else -1
            idx_prop = headers_target.index('propiedad') if 'propiedad' in headers_target else -1

            # Crear equipo completamente nuevo
            nuevo_equipo = [''] * len(headers_target)
            nuevo_equipo[0] = serial
            
            if idx_prov > -1: nuevo_equipo[idx_prov] = proveedor
            if idx_emp > -1: nuevo_equipo[idx_emp] = empresa
            if idx_resp > -1: nuevo_equipo[idx_resp] = resp
            if idx_area > -1: nuevo_equipo[idx_area] = area
            if idx_cargo > -1: nuevo_equipo[idx_cargo] = cargo
            if idx_ubic > -1: nuevo_equipo[idx_ubic] = ubicacion
            if idx_estado > -1: nuevo_equipo[idx_estado] = estado
            if idx_obs > -1: nuevo_equipo[idx_obs] = obs
            if idx_entrega > -1: nuevo_equipo[idx_entrega] = fecha_entrega
            if idx_fecha > -1: nuevo_equipo[idx_fecha] = fecha_hoy
            
            if idx_nombre > -1: nuevo_equipo[idx_nombre] = nombre_eq
            if idx_tipo > -1: nuevo_equipo[idx_tipo] = tipo_eq
            if idx_marca > -1: nuevo_equipo[idx_marca] = marca_eq
            if idx_prop > -1: nuevo_equipo[idx_prop] = propiedad_eq

            inventario_target[serial] = nuevo_equipo

    # Guardar cambios
    for clave, ruta in rutas_csv.items():
        if clave in modulos_data and clave in modulos_headers:
            sep = modulos_separadores.get(clave, ',')
            with open(ruta, mode='w', encoding='utf-8', newline='') as f:
                writer = csv.writer(f, delimiter=sep)
                writer.writerow(modulos_headers[clave])
                writer.writerows(modulos_data[clave].values())

if __name__ == '__main__':
    procesar_nuevos()
