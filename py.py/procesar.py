"""Reconstruye los inventarios a partir de bitacora.csv respetando el orden de los eventos.

Reemplaza a Nuevo.py, actualizar.py, eliminar.py y Devolver.py.
Uso (desde la raíz del repo):  python py.py/procesar.py
"""
import csv
import io
import os
import sys
from datetime import datetime

BITACORA = 'bitacora.csv'
MODULOS = {
    'SERVIALCO': 'Servialco/servialco.csv',
    'AYS': 'AYS-Servialco/ays-servialco.csv',
    'UNICAT': 'UNICAT/unicat.csv',
    'ARKY': 'ARKY/arky.csv',
}
PROVEEDOR_A_MODULO = {'PROPIO': 'SERVIALCO', 'SERVIALCO': 'SERVIALCO',
                      'AYS': 'AYS', 'UNICAT': 'UNICAT', 'ARKY': 'ARKY'}

# Vocabulario cerrado de eventos
CREAR = {'NUEVO', 'ASIGNACION_INICIAL'}
BAJA = {'ELIMINAR', 'DEVOLVER'}
ACTUALIZAR = {'CAMBIO_USUARIO', 'REPARACION'}
ALIAS = {'CAMBIO_RESPONSABLE': 'CAMBIO_USUARIO', 'CREACION_NUEVO': 'NUEVO'}

# Posición de cada columna en la bitácora
B = dict(fecha=0, serial=1, evento=2, responsable=3, area=4, cargo=5, ubicacion=6,
         estado=7, proveedor=8, empresa=9, observaciones=10,
         nombre_equipo=11, tipo=12, marca=13, propiedad=14)
MAYUS = {'estado', 'proveedor', 'empresa', 'nombre_equipo', 'tipo', 'marca', 'propiedad'}
# Campos que se copian de la bitácora al inventario (columna del inventario = clave)
CAMPOS_ACTUALIZAR = ['responsable', 'area', 'cargo', 'ubicacion', 'estado', 'observaciones']
CAMPOS_CREAR = CAMPOS_ACTUALIZAR + ['nombre_equipo', 'tipo', 'marca', 'propiedad']

errores = 0


def error(linea, msg):
    global errores
    errores += 1
    print(f'::error file={BITACORA},line={linea}::{msg}')


def aviso(linea, msg):
    print(f'::warning file={BITACORA},line={linea}::{msg}')


def leer_csv(ruta):
    with open(ruta, encoding='utf-8-sig', newline='') as f:
        texto = f.read()
    sep = ';' if ';' in texto.split('\n', 1)[0] else ','
    filas = list(csv.reader(io.StringIO(texto, newline=''), delimiter=sep))
    return texto, sep, filas


def cargar_modulos():
    mods = {}
    for clave, ruta in MODULOS.items():
        if not os.path.exists(ruta):
            continue
        original, sep, filas = leer_csv(ruta)
        if not filas:
            continue
        header = [h.strip() for h in filas[0]]
        low = [h.lower() for h in header]
        mods[clave] = {
            'ruta': ruta, 'sep': sep, 'original': original, 'header': header,
            'filas': [f for f in filas[1:] if f and f[0].strip()],
            'orig': {},
            'idx': {h: i for i, h in enumerate(low)},
            # serial alterno: serial_proveedor (Servialco/UNICAT/ARKY) o serial_fabrica (AYS)
            'alt': next((i for i, h in enumerate(low) if h in ('serial_proveedor', 'serial_fabrica')), -1),
        }
    for m in mods.values():
        m['orig'] = {id(f): list(f) for f in m['filas']}
    return mods


def es_serial(fila, m, serial):
    if fila[0].strip().upper() == serial:
        return True
    a = m['alt']
    return a > -1 and len(fila) > a and fila[a].strip().upper() == serial


def buscar(mods, serial):
    """Todas las (módulo, fila) donde aparece el serial."""
    return [(m, f) for m in mods.values() for f in m['filas'] if es_serial(f, m, serial)]


def aplicar(fila, m, valores):
    """Copia a la fila los valores no vacíos de la bitácora."""
    idx = m['idx']
    while len(fila) < len(m['header']):
        fila.append('')
    for campo, val in valores.items():
        i = idx.get(campo, -1)
        if val and i > -1:
            fila[i] = val


def leer_bitacora():
    if not os.path.exists(BITACORA):
        return []
    _, sep, _ = leer_csv(BITACORA)
    with open(BITACORA, encoding='utf-8-sig', newline='') as f:
        reader = csv.reader(f, delimiter=sep)
        next(reader, None)
        eventos = []
        for fila in reader:
            if any(c.strip() for c in fila):
                eventos.append((reader.line_num, fila))
    return eventos


def procesar():
    mods = cargar_modulos()
    hoy = datetime.now().strftime('%Y-%m-%d')
    vistos = {}  # último contenido por serial, para avisar duplicados exactos

    for linea, fila in leer_bitacora():
        if len(fila) < 8:
            error(linea, f'Fila incompleta ({len(fila)} columnas, mínimo 8).')
            continue
        fila = fila + [''] * (15 - len(fila))
        d = {}
        for k, i in B.items():
            v = fila[i].strip()
            d[k] = v.upper() if k in MAYUS else v
        serial = d['serial'].upper()
        evento = d['evento'].upper().replace(' ', '_')
        evento = ALIAS.get(evento, evento)

        if not serial:
            error(linea, 'Fila sin serial.')
            continue
        if evento not in CREAR | BAJA | ACTUALIZAR:
            error(linea, f'Evento desconocido "{d["evento"]}" (serial {serial}).')
            continue
        firma = tuple(c.strip() for c in fila)
        if vistos.get(serial) == firma:
            aviso(linea, f'Fila idéntica a la anterior del serial {serial}.')
        vistos[serial] = firma

        if evento in CREAR:
            clave = PROVEEDOR_A_MODULO.get(d['proveedor'])
            if clave is None or clave not in mods:
                error(linea, f'Proveedor "{d["proveedor"]}" no corresponde a ningún módulo (serial {serial}).')
                continue
            m = mods[clave]
            existentes = [f for f in m['filas'] if es_serial(f, m, serial)]
            if not existentes:
                nueva = [''] * len(m['header'])
                nueva[0] = serial
                m['filas'].append(nueva)
                existentes = [nueva]
                aplicar(nueva, m, {'proveedor': d['proveedor'], 'empresa': d['empresa']})
            if any(mm is not m for mm, _ in buscar(mods, serial)):
                aviso(linea, f'El serial {serial} también existe en otro módulo.')
            vals = {k: d[k] for k in CAMPOS_CREAR}
            vals['fecha_entrega'] = d['fecha']
            aplicar(existentes[0], m, vals)

        elif evento in ACTUALIZAR:
            hallados = buscar(mods, serial)
            if not hallados:
                aviso(linea, f'{evento} de {serial}: el equipo no existe en ningún inventario.')
                continue
            vals = {k: d[k] for k in CAMPOS_ACTUALIZAR}
            vals['fecha_entrega'] = d['fecha']
            for m, f in hallados:
                aplicar(f, m, vals)

        else:  # BAJA: ELIMINAR o DEVOLVER
            hallados = buscar(mods, serial)
            if not hallados:
                aviso(linea, f'{evento} de {serial}: el equipo no existe en ningún inventario.')
                continue
            for m, f in hallados:
                m['filas'].remove(f)
                print(f'{evento}: {serial} retirado de {m["ruta"]}')

    for m in mods.values():
        i_upd = m['idx'].get('ultima_actualizacion', -1)
        for f in m['filas']:
            while len(f) < len(m['header']):
                f.append('')
            antes = m['orig'].get(id(f))
            if i_upd > -1 and (antes is None or antes != f):
                f[i_upd] = hoy
        buf = io.StringIO(newline='')
        w = csv.writer(buf, delimiter=m['sep'], lineterminator='\r\n')
        w.writerow(m['header'])
        w.writerows(m['filas'])
        if buf.getvalue() != m['original']:
            with open(m['ruta'], 'w', encoding='utf-8', newline='') as f:
                f.write(buf.getvalue())
            print(f'Actualizado {m["ruta"]} ({len(m["filas"])} equipos)')

    if errores:
        print(f'\n{errores} fila(s) de la bitácora no se pudieron aplicar. Revisa los errores de arriba.')
        sys.exit(1)


if __name__ == '__main__':
    procesar()
