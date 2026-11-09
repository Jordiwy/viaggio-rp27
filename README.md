# Viatge

App privada para preparar entre dos el viaje a Roma y Pompeya (25–28 de febrero de 2027): plan día a día editable, mapa con la ruta de cada día, planes para elegir, votaciones, qué comer, notas compartidas y maleta.

## Arquitectura

| Parte | Tecnología | Dónde |
|---|---|---|
| Frontend | HTML, CSS y JavaScript sin framework, empaquetado con Vite. PWA instalable en iPhone, con service worker para abrir sin conexión. | `web/` |
| Backend | API REST en Cloudflare Workers con [Hono](https://hono.dev) y validación con Zod. | `worker/src/` |
| Base de datos | Cloudflare D1 (SQLite), con migraciones versionadas. | `migrations/` |
| Despliegue | GitHub Actions publica en Cloudflare con cada `push` a `main`. | `.github/workflows/deploy.yml` |

### Acceso

No hay contraseñas. Cada viajero tiene un **enlace personal** (`/?k=<token>`); en la base de datos solo se guarda el hash SHA-256 del token. El organizador puede generar un enlace nuevo para cualquiera desde su perfil, y el anterior deja de funcionar al momento.

El primer arranque (`/api/setup`) solo funciona con la base de datos vacía: crea el viaje y los dos enlaces.

### Sincronización

La app guarda al momento cada cambio y consulta novedades cada 15 segundos y al volver a abrirla (`GET /api/state?since=<rev>`, que responde «sin cambios» si nada se ha movido). Sin conexión, los cambios quedan pendientes y se envían al volver. El plan de cada día tiene control de versiones: si los dos lo editan a la vez, el segundo recibe un aviso y ve la versión del otro.

### API

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/api/health` | Estado y si falta el primer arranque |
| POST | `/api/setup` | Crea el viaje y los dos enlaces (solo una vez) |
| GET | `/api/state?since=` | Todo el estado del viaje |
| PUT / DELETE | `/api/itinerary/:day` | Guarda o restablece el plan de un día |
| PUT | `/api/votes/:decision` | Voto de cada uno |
| PUT | `/api/wishes/:plan` | Planes que apetecen |
| PUT | `/api/note` | Notas compartidas |
| PUT | `/api/packing/:item` | Maleta (de cada uno) |
| PATCH | `/api/me` | Cambiar el nombre |
| POST | `/api/members/:id/link` | Enlace nuevo (solo el organizador) |

## Desarrollo

```bash
npm install
npm run db:migrate:local
npm run dev                          # http://localhost:8787
BASE=http://127.0.0.1:8787 npm test  # pruebas de la API (con la base de datos vacía)
```

## Puesta en marcha en Cloudflare

1. Crear una cuenta gratuita en Cloudflare y abrir **Workers & Pages** una vez (así se crea el subdominio `*.workers.dev`).
2. Crear un token de API con la plantilla **Edit Cloudflare Workers** y añadirle el permiso **Account → D1 → Edit**.
3. En GitHub, **Settings → Secrets and variables → Actions**, crear `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID`.
4. Lanzar el flujo **Desplegar en Cloudflare** (o hacer un `push`). Crea la base de datos, aplica las migraciones y publica.
5. Abrir la dirección que aparece en el resumen del flujo y crear el viaje.

Fotos: anuncio de Airbnb de la anfitriona y Wikimedia Commons (autores y licencias en el pie de la app).
