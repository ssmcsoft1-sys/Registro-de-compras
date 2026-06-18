// Domain constants — colors, labels and option lists.
// Ported verbatim from the design prototype (Registro de Compras.dc.html).

export const PROYECTOS = ['Proyecto 1', 'Proyecto 2', 'Proyecto 3', 'Proyecto 4']

// Valor especial: una compra que aplica a todos los proyectos (gasto compartido).
export const PROYECTO_TODOS = 'Todos los proyectos'

// Opciones de proyecto para formularios y filtros (incluye el bucket compartido).
export const PROYECTOS_FORM = [...PROYECTOS, PROYECTO_TODOS]

export const CATEGORIAS = [
  'Componentes mecánicos',
  'Componentes eléctricos',
  'Filamento',
  'Servicios',
  'Material de oficina',
]

export const METODOS = ['Tarjeta corporativa', 'Transferencia', 'Efectivo']

export const ESTADOS = { RECIBIDO: 'Recibido', EN_ENVIO: 'En envío' }

// Data-viz colors (project bars / dots)
export const PROJ_COLORS = {
  'Proyecto 1': '#322d91',
  'Proyecto 2': '#4843a8',
  'Proyecto 3': '#6863c2',
  'Proyecto 4': '#b9b6e0',
  'Todos los proyectos': '#1f1c5e',
}

// Data-viz colors (category bars)
export const CAT_COLORS = {
  'Componentes mecánicos': '#322d91',
  'Componentes eléctricos': '#6863c2',
  Filamento: '#e72c6e',
  Servicios: '#1f8a5b',
  'Material de oficina': '#f5b400',
}

export const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

export const MES_LARGO = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

// Months covered by the dataset (ene–jun 2026).
export const MONTH_KEYS = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06']

export const PERIOD_LABEL = 'Ene – Jun 2026'
