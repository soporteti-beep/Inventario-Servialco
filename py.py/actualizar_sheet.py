import os
import json
import csv
import gspread

def sincronizar_drive():
    print("Iniciando sincronización con Google Sheets...")
    
    # 1. Cargar las credenciales de GitHub Secrets
    creds_json = os.environ.get('GDRIVE_CREDENTIALS')
    if not creds_json:
        print("Error: No se encontró GDRIVE_CREDENTIALS")
        return
        
    creds_dict = json.loads(creds_json)
    gc = gspread.service_account_from_dict(creds_dict)
    
    # 2. ID extraído de tu Google Sheets ("bitacora")
    ID_HOJA = "1f8RXApZiAB444HVlrRGzOVc8X5L-bKSc1lB45UZKuBI"
    
    # 3. Asegurar la ruta correcta a la bitácora
    # Como el script está en py.py/, calculamos la ruta hacia la carpeta principal
    ruta_script = os.path.dirname(os.path.abspath(__file__))
    ruta_bitacora = os.path.join(ruta_script, '..', 'bitacora.csv')
    
    # Fallback de seguridad por si GitHub Actions lo ejecuta directo en la raíz
    if not os.path.exists(ruta_bitacora):
        ruta_bitacora = 'bitacora.csv'
    
    try:
        documento = gc.open_by_key(ID_HOJA)
        hoja = documento.sheet1
        
        # 4. Leer el archivo bitacora.csv detectando el separador correcto
        with open(ruta_bitacora, 'r', encoding='utf-8-sig') as f:
            primera_linea = f.readline()
            sep = ';' if ';' in primera_linea else ','
            f.seek(0)
            reader = csv.reader(f, delimiter=sep)
            datos_csv = list(reader)
            
        # 5. Limpiar la hoja y subir los nuevos datos al instante
        hoja.clear()
        hoja.update(datos_csv)
        print(f"¡Éxito! Se sincronizaron {len(datos_csv)} filas en tu Google Sheets.")
        
    except Exception as e:
        print(f"Error al actualizar Google Sheets: {e}")

if __name__ == '__main__':
    sincronizar_drive()
