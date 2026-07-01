# Registro de compras — Guía de despliegue

Aplicación web (React + Node/Express) para registrar compras, solicitudes y usuarios.
El mismo servidor sirve la interfaz y la API en **un solo puerto**.

## 1. Requisitos
- **Node.js 22 o superior** (incluye SQLite nativo; necesario si se usa la opción sin Postgres).
- Acceso para definir **variables de entorno** y ejecutar `npm`.
- (Recomendado) Una base de datos **PostgreSQL**. Sin ella, la app usa un archivo SQLite local.

## 2. Instalación
Desde la carpeta del proyecto:

```bash
npm install        # instala dependencias (incluye las de compilación)
npm run build      # compila la interfaz a /dist
npm start          # arranca el servidor (sirve app + API)
```

Por defecto escucha en el puerto **3001** (o el que indique la variable `PORT`).
Conviene ponerlo detrás de un proxy inverso con **HTTPS** (nginx, Apache, Caddy, o el proxy del host).

## 3. Variables de entorno
Defínelas en el panel del host, o crea un archivo `.env` y arranca con
`node --env-file=.env server/index.js`.

| Variable | Obligatoria | Descripción |
|---|---|---|
| `SESSION_SECRET` | **Sí** (en producción) | Cadena larga y aleatoria para firmar las sesiones. Generar con: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `ADMIN_EMAIL` | Sí (primer arranque) | Correo del **administrador inicial**. Se crea automáticamente si no hay usuarios. |
| `ADMIN_PASSWORD` | Sí (primer arranque) | Contraseña inicial de ese administrador (cámbiala luego desde la app). |
| `DATABASE_URL` | Recomendada | Cadena de conexión a PostgreSQL (`postgres://usuario:clave@host:puerto/basededatos`). **Si no se define, se usa SQLite** en `server/data/compras.db`. |
| `NODE_ENV` | Recomendada | Poner en `production`. |
| `ALLOWED_DOMAIN` | No | Dominio de correo permitido para las cuentas. Por defecto `candelasoft.com`. |
| `PORT` | No | Puerto de escucha (por defecto 3001). Muchos hosts lo inyectan solos. |
| `TEAMS_WEBHOOK_URL` | No | (Opcional) Aviso por Microsoft Teams al crear una solicitud. Ver `NOTIFICACIONES-TEAMS.md`. |

> En producción, el servidor **no arranca** si falta `SESSION_SECRET` (medida de seguridad).

## 4. Base de datos
- **PostgreSQL (recomendado):** crear una base vacía y poner su cadena en `DATABASE_URL`.
  La app **crea las tablas automáticamente** en el primer arranque (no hay que correr scripts).
- **SQLite (alternativa):** si no se define `DATABASE_URL`, los datos se guardan en
  `server/data/compras.db`. Asegúrate de que esa carpeta esté en **disco persistente** y se respalde.

## 5. Primer uso
1. Tras arrancar con `ADMIN_EMAIL`/`ADMIN_PASSWORD`, se crea el administrador inicial.
2. Inicia sesión con ese correo y contraseña.
3. Ve a **Usuarios** y da de alta al equipo (cada cuenta con correo del dominio permitido).
4. Reparte a cada persona su correo y su contraseña inicial.

## 6. Actualizaciones futuras
Reemplazar los archivos del proyecto (excepto `server/data` si se usa SQLite) y repetir
`npm install && npm run build`, luego reiniciar el servicio. Las tablas se migran solas.

## 7. Notas
- Los comprobantes/recibos se guardan dentro de la base de datos (imagen/PDF en base64), con un
  límite de ~2 MB por archivo. Si el volumen crece mucho, conviene moverlos a almacenamiento de
  archivos aparte (mejora futura).
- Roles: **Administrador** (todo + aprobar solicitudes + gestionar usuarios) y **Miembro**
  (registrar/editar compras, crear solicitudes). Idiomas: español/inglés/alemán. Moneda: COP con
  conversión a EUR en vivo.

---

### Resumen rápido para el host
```
Node 22+
Variables: SESSION_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, DATABASE_URL, NODE_ENV=production
Comandos:  npm install  →  npm run build  →  npm start
Puerto:    PORT (def. 3001), detrás de proxy HTTPS
```
