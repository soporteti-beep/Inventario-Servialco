import csv
import os

def detectar_separador(ruta_archivo):
    with open(ruta_archivo, 'r', encoding='utf-8-sig') as f:
        primera_linea = f.readline()
        return ';' if ';' in primera_linea else ','

def procesar_devoluciones():
    bitacora_path = 'bitacora.csv'
    if not os.path.exists(bitacora_path):
        return

    rutas_csv = {
        'SERVIALCO': 'Servialco/servialco.csv',
        'AYS': 'AYS-Servialco/ays-servialco.csv',
        'UNICAT': 'UNICAT/unicat.csv',
        'ARKY': 'ARKY/arky.csv'
    }

    # 1. Encontrar qué seriales se deben devolver
    seriales_a_devolver = set()
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
        
        # Si el evento es DEVOLVER, lo añadimos a la lista para sacarlo del inventario
        if serial and evento == 'DEVOLVER':
            seriales_a_devolver.add(serial)

    if not seriales_a_devolver:
        print("No hay eventos de devolución en la bitácora.")
        return

    # 2. Procesar cada inventario y reescribirlo SIN los equipos devueltos
    for clave, ruta in rutas_csv.items():
        if not os.path.exists(ruta):
            continue

        sep = detectar_separador(ruta)
        filas_mantenidas = []
        devueltos_en_este_modulo = 0

        with open(ruta, mode='r', encoding='utf-8-sig') as f:
            reader = csv.reader(f, delimiter=sep)
            filas = list(reader)

            if not filas:
                continue

            cabecera = filas[0]
            filas_mantenidas.append(cabecera)
            
            headers_target = [h.strip().lower() for h in cabecera]
            idx_prov_serial = headers_target.index('serial_proveedor') if 'serial_proveedor' in headers_target else -1

            for fila in filas[1:]:
                if not fila or len(fila) == 0:
                    continue
                
                serial_principal = fila[0].strip().upper()
                serial_prov = fila[idx_prov_serial].strip().upper() if idx_prov_serial > -1 and len(fila) > idx_prov_serial else ''

                if serial_principal in seriales_a_devolver or (serial_prov and serial_prov in seriales_a_devolver):
                    devueltos_en_este_modulo += 1
                    print(f"Equipo {serial_principal} devuelto y retirado de {clave} exitosamente.")
                else:
                    filas_mantenidas.append(fila)

        # 3. Reescribir el archivo solo si se devolvió algún equipo
        if devueltos_en_este_modulo > 0:
            with open(ruta, mode='w', encoding='utf-8', newline='') as f:
                writer = csv.writer(f, delimiter=sep)
                writer.writerows(filas_mantenidas)

if __name__ == '__main__':
    procesar_devoluciones()
