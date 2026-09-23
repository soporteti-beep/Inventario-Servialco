import csv
import datetime

INV_FILE = 'inventario.csv'
BIT_FILE = 'bitacora.csv'

def main():
    inventario = {}
    mapa_llaves = {} # Mapea serial_proveedor -> serial principal
    
    # 1. Leer el inventario actual
    try:
        with open(INV_FILE, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            campos_inventario = reader.fieldnames
            for row in reader:
                serial_principal = row['serial'].strip()
                serial_prov = row.get('serial_proveedor', '').strip()
                
                # Guardar el registro por su serial principal
                inventario[serial_principal] = row
                
                # Registrar alias por serial de proveedor si existe
                if serial_prov:
                    mapa_llaves[serial_prov] = serial_principal
                    
    except Exception as e:
        print(f"Error leyendo {INV_FILE}: {e}")
        return

    # 2. Leer la bitácora y procesar eventos
    try:
        with open(BIT_FILE, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                llave_ingresada = row['serial'].strip()
                if not llave_ingresada:
                    continue
                
                # Determinar el serial real en el inventario
                if llave_ingresada in inventario:
                    serial_target = llave_ingresada
                elif llave_ingresada in mapa_llaves:
                    serial_target = mapa_llaves[llave_ingresada]
                else:
                    # Si no existe ni como serial ni como serial_proveedor, se crea uno nuevo
                    serial_target = llave_ingresada
                    inventario[serial_target] = {k: '' for k in campos_inventario}
                    inventario[serial_target]['serial'] = serial_target

                # Mapeo de campos
                mapeo_columnas = {
                    'responsable_nuevo': 'responsable',
                    'area_nueva': 'area',
                    'cargo_nueva': 'cargo',
                    'ubicacion_nueva': 'ubicacion',
                    'estado_nuevo': 'estado',
                    'proveedor_nuevo': 'proveedor',
                    'empresa_nueva': 'empresa'
                }
                
                for col_bitacora, col_inv in mapeo_columnas.items():
                    if row.get(col_bitacora, '').strip():
                        inventario[serial_target][col_inv] = row[col_bitacora]
                        
                if row.get('observaciones', '').strip():
                    inventario[serial_target]['observaciones'] = row['observaciones']
                
                # Actualizar última fecha con la fecha del evento o la fecha actual
                fecha_evento = row.get('fecha', '').strip()
                if fecha_evento:
                    inventario[serial_target]['ultima_actualizacion'] = fecha_evento
                else:
                    inventario[serial_target]['ultima_actualizacion'] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    
    except Exception as e:
        print(f"Error procesando {BIT_FILE}: {e}")
        return

    # 3. Guardar el inventario actualizado
    try:
        with open(INV_FILE, mode='w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=campos_inventario)
            writer.writeheader()
            for row in inventario.values():
                writer.writerow(row)
        print("Inventario actualizado correctamente.")
    except Exception as e:
        print(f"Error guardando {INV_FILE}: {e}")

if __name__ == '__main__':
    main()
