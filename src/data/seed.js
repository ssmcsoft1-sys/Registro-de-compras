// 19 compras semilla de ejemplo (ene–jun 2026).
// En producción, `purchases` vendrá de una API/DB — reemplazar esta semilla.
// Modelo de compra:
//   { id, fecha (YYYY-MM-DD), proyecto, categoria, descripcion,
//     proveedor, metodo, estado, importe (number), recibo }

const d = (fecha, proyecto, categoria, descripcion, proveedor, metodo, estado, importe) => ({
  id: fecha + descripcion,
  fecha,
  proyecto,
  categoria,
  descripcion,
  proveedor,
  metodo,
  estado,
  importe,
  recibo: null,
})

export function seedPurchases() {
  return [
    d('2026-01-08', 'Proyecto 1', 'Componentes mecánicos', 'Rodamientos SKF 6204 (x20)', 'Suministros Industriales MX', 'Transferencia', 'Recibido', 18400),
    d('2026-01-15', 'Proyecto 2', 'Filamento', 'Filamento PETG 1.75mm 5kg', 'Impresión3D Store', 'Tarjeta corporativa', 'Recibido', 7250),
    d('2026-01-22', 'Proyecto 1', 'Componentes eléctricos', 'Drivers stepper TMC2209 (x12)', 'DigiKey', 'Tarjeta corporativa', 'Recibido', 9600),
    d('2026-02-03', 'Proyecto 3', 'Servicios', 'Mecanizado CNC piezas aluminio', 'TallerMec S.A.', 'Transferencia', 'Recibido', 42800),
    d('2026-02-11', 'Proyecto 2', 'Componentes mecánicos', 'Husillos de bolas 1605 (x4)', 'Suministros Industriales MX', 'Transferencia', 'Recibido', 15300),
    d('2026-02-18', 'Proyecto 4', 'Componentes eléctricos', 'Fuente conmutada 24V 350W', 'Steren', 'Efectivo', 'Recibido', 3450),
    d('2026-02-27', 'Proyecto 1', 'Filamento', 'Filamento ABS 1.75mm 10kg', 'Impresión3D Store', 'Tarjeta corporativa', 'En envío', 13900),
    d('2026-03-05', 'Proyecto 3', 'Componentes mecánicos', 'Perfil estructural 40x40 (x30)', 'Aluminios del Norte', 'Transferencia', 'Recibido', 22600),
    d('2026-03-14', 'Proyecto 2', 'Servicios', 'Corte láser lámina acero', 'LaserCorte MX', 'Transferencia', 'Recibido', 11200),
    d('2026-03-21', 'Proyecto 4', 'Componentes eléctricos', 'Sensores inductivos NPN (x15)', 'DigiKey', 'Tarjeta corporativa', 'Recibido', 8750),
    d('2026-04-02', 'Proyecto 1', 'Componentes eléctricos', 'Microcontroladores ESP32 (x25)', 'Mouser', 'Tarjeta corporativa', 'Recibido', 12400),
    d('2026-04-10', 'Proyecto 3', 'Filamento', 'Filamento TPU 1.75mm 3kg', 'Impresión3D Store', 'Tarjeta corporativa', 'Recibido', 6100),
    d('2026-04-19', 'Proyecto 2', 'Componentes mecánicos', 'Guías lineales MGN12 (x8)', 'Suministros Industriales MX', 'Transferencia', 'En envío', 16800),
    d('2026-04-28', 'Proyecto 4', 'Servicios', 'Anodizado piezas aluminio', 'TallerMec S.A.', 'Transferencia', 'Recibido', 9300),
    d('2026-05-06', 'Proyecto 1', 'Componentes mecánicos', 'Acoples flexibles 8mm (x10)', 'Aluminios del Norte', 'Efectivo', 'Recibido', 4200),
    d('2026-05-15', 'Proyecto 3', 'Componentes eléctricos', 'Relés de estado sólido (x20)', 'Steren', 'Tarjeta corporativa', 'Recibido', 7600),
    d('2026-05-23', 'Proyecto 2', 'Material de oficina', 'Cinta Kapton + consumibles', 'Amazon Business', 'Tarjeta corporativa', 'Recibido', 2150),
    d('2026-06-04', 'Proyecto 4', 'Componentes mecánicos', 'Tornillería inox M3–M6 surtido', 'Tornillos MX', 'Transferencia', 'Recibido', 3850),
    d('2026-06-12', 'Proyecto 1', 'Servicios', 'Impresión PCB prototipo (x5)', 'JLCPCB', 'Tarjeta corporativa', 'En envío', 5400),
  ]
}
