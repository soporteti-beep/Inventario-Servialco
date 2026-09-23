import csv
import datetime

# Nombres de los archivos
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
                serial = row['serial']
                
                # Solo procesar si el serial existe en el inventario
                if serial in inventario:
                    # Reemplazar valores solo si la celda de la bitácora NO está vacía
                    if row.get('responsable_nuevo', '').strip():
                        inventario[serial]['responsable'] = row['responsable_nuevo']
                        
                    if row.get('ubicacion_nueva', '').strip():
                        inventario[serial]['ubicacion'] = row['ubicacion_nueva']
                        
                    if row.get('estado_nuevo', '').strip():
                        inventario[serial]['estado'] = row['estado_nuevo']
                        
                    if row.get('proveedor_nuevo', '').strip():
                        inventario[serial]['proveedor'] = row['proveedor_nuevo']
                        
                    if row.get('observaciones', '').strip():
                        inventario[serial]['observaciones'] = row['observaciones']
                    
                    # El script llena automáticamente la última actualización
                    fecha_actual = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    inventario[serial]['ultima_actualizacion'] = fecha_actual
    except Exception as e:
        print(f"Error leyendo {BIT_FILE}: {e}")
        return

    # 3. Guardar los cambios de vuelta en el inventario
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
