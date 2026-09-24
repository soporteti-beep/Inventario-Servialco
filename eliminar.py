import csv
import os

def detectar_separador(ruta_archivo):
    with open(ruta_archivo, 'r', encoding='utf-8-sig') as f:
        primera_linea = f.readline()
        return ';' if ';' in primera_linea else ','

def procesar_eliminaciones():
    bitacora_path = 'bitacora.csv'
    if not os.path.exists(bitacora_path):
        return

    rutas_csv = {
        'SERVIALCO': 'Servialco/servialco.csv',
        'AYS': 'AYS-Servialco/ays-servialco.csv',
        'UNICAT': 'UNICAT/unicat.csv',
        'ARKY': 'ARKY/arky.csv'
    }

    # 1. Leer bitácora y encontrar qué seriales se deben eliminar
    seriales_a_eliminar = set()
    sep_bit = detectar_separador(bitacora_path)
    with open(bitacora_path, mode='r', encoding='utf-8-sig') as f:
        reader = csv.reader(f, delimiter=sep_bit)
        bitacora_filas = list(reader)

    if len(bitacora_filas) <= 1:
        return

    for fila in bitacora_filas[1:]:
        if not fila or len(fila) < 8:
            continue
        
        serial = fila[1].strip().upper() if len(fila) > 1 else ''
        evento = fila[2].strip().upper() if len(fila) > 2 else ''
        
        # Si el evento es ELIMINAR, lo añadimos a la lista negra
        if serial and evento == 'ELIMINAR':
            seriales_a_eliminar.add(serial)

    if not seriales_a_eliminar:
        print("No hay eventos de eliminación en la bitácora.")
        return

    # 2. Procesar cada inventario y reescribirlo SIN los equipos eliminados
    for clave, ruta in rutas_csv.items():
        if not os.path.exists(ruta):
            continue

        sep = detectar_separador(ruta)
        filas_mantenidas = []
        eliminados_en_este_modulo = 0

        with open(ruta, mode='r', encoding='utf-8-sig') as f:
            reader = csv.reader(f, delimiter=sep)
            filas = list(reader)

            if not filas:
                continue

            cabecera = filas[0]
            filas_mantenidas.append(cabecera) # Guardamos la cabecera
            
            headers_target = [h.strip().lower() for h in cabecera]
            idx_prov_serial = headers_target.index('serial_proveedor') if 'serial_proveedor' in headers_target else -1

            for fila in filas[1:]:
                if not fila or len(fila) == 0:
                    continue
                
                serial_principal = fila[0].strip().upper()
                serial_prov = fila[idx_prov_serial].strip().upper() if idx_prov_serial > -1 and len(fila) > idx_prov_serial else ''

                # Si el serial está en la lista de eliminados, lo saltamos (no lo guardamos)
                if serial_principal in seriales_a_eliminar or (serial_prov and serial_prov in seriales_a_eliminar):
                    eliminados_en_este_modulo += 1
                    print(f"Equipo {serial_principal} eliminado de {clave} exitosamente.")
                else:
                    filas_mantenidas.append(fila)

        # 3. Reescribir el archivo solo si se eliminó algún equipo en este módulo
        if eliminados_en_este_modulo > 0:
            with open(ruta, mode='w', encoding='utf-8', newline='') as f:
                writer = csv.writer(f, delimiter=sep)
                writer.writerows(filas_mantenidas)

if __name__ == '__main__':
    procesar_eliminaciones()
