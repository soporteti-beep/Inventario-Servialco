import csv
import datetime

INV_FILE = 'inventario.csv'
BIT_FILE = 'bitacora.csv'

def main():
    inventario = {}
    
    # 1. Leer el inventario actual
    try:
        with open(INV_FILE, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            campos_inventario = reader.fieldnames
            for row in reader:
                inventario[row['serial']] = row
    except Exception as e:
        print(f"Error leyendo {INV_FILE}: {e}")
        return

    # 2. Leer la bitácora y procesar eventos
    try:
        with open(BIT_FILE, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                serial = row['serial'].strip()
                if not serial:
                    continue
                
                # LA MAGIA: Si el serial no existe, el bot crea una nueva fila vacía
                if serial not in inventario:
                    inventario[serial] = {k: '' for k in campos_inventario}
                    inventario[serial]['serial'] = serial

                # Mapeo inteligente de Bitácora -> Inventario
                mapeo_columnas = {
                    'responsable_nuevo': 'responsable',
                    'area_nueva': 'area',
                    'cargo_nueva': 'cargo',
                    'ubicacion_nueva': 'ubicacion',
                    'estado_nuevo': 'estado',
                    'proveedor_nuevo': 'proveedor',
                    'empresa_nueva': 'empresa'
                }
                
                # Actualizar dinámicamente
                for col_bitacora, col_inv in mapeo_columnas.items():
                    if row.get(col_bitacora, '').strip():
                        inventario[serial][col_inv] = row[col_bitacora]
                        
                if row.get('observaciones', '').strip():
                    inventario[serial]['observaciones'] = row['observaciones']
                
                # Sello de tiempo
                inventario[serial]['ultima_actualizacion'] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
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
        print("Inventario actualizado y revolucionado correctamente.")
    except Exception as e:
        print(f"Error guardando {INV_FILE}: {e}")

if __name__ == '__main__':
    main()
