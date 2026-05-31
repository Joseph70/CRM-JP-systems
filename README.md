# CRM Base JP Sistems

CRM multi-cliente para gestionar los clientes finales de cada cliente de la agencia, con foco en WhatsApp, leads de contenido organico, Meta Ads, formularios y seguimiento comercial.

## Forma unica de correr el CRM

Abre este archivo:

```bash
run-crm.cmd
```

Ese unico arranque hace todo:

- Crea `.env` desde `.env.example` si todavia no existe.
- Instala dependencias si faltan.
- Prepara Prisma.
- Aplica migraciones de la base local SQLite.
- Levanta frontend y backend de Next.js juntos.
- Abre el CRM en el navegador.
- Usa `3000` o el siguiente puerto libre si ya esta ocupado.

Credenciales demo:

```bash
admin@jpsistems.local
admin
```

## Que incluye

- Interfaz Next.js + React + TypeScript.
- Backend con API routes dentro de Next.js.
- Base local con Prisma + SQLite.
- Autenticacion con cookie firmada y passwords hasheados.
- Roles y permisos por cliente/workspace.
- Selector de cliente activo.
- Bandeja principal de WhatsApp.
- Conversaciones, mensajes, notas internas y respuestas rapidas.
- Pipeline comercial tipo kanban.
- Contactos, tareas, campanas, automatizaciones e integraciones.
- Portal inicial de cliente en `/portal`.
- Webhooks para WhatsApp Cloud API y Meta Lead Ads.
- Endpoints listos para conectar credenciales reales de WhatsApp y Meta.
- Modo claro y modo oscuro.

## Archivos importantes

- `run-crm.cmd`: unica forma recomendada de iniciar todo.
- `app/page.tsx`: pantalla principal del CRM.
- `app/globals.css`: diseno visual y temas claro/oscuro.
- `app/api`: backend del CRM.
- `src/server`: logica de datos, autenticacion, seguridad y procesamiento.
- `prisma/schema.prisma`: modelo de base de datos.
- `.env.example`: variables de configuracion.

## Variables para integraciones reales

```bash
DATABASE_URL="file:./dev.db"
SESSION_SECRET="cambia_este_valor_por_un_secreto_largo"
SESSION_SECRET_PREVIOUS=""
WHATSAPP_VERIFY_TOKEN="jp-sistems-dev-token"
WHATSAPP_ACCESS_TOKEN=""
WHATSAPP_PHONE_NUMBER_ID=""
META_VERIFY_TOKEN="jp-sistems-dev-token"
META_ACCESS_TOKEN=""
META_AD_ACCOUNT_ID=""
META_APP_SECRET=""
```

Cuando agregues credenciales reales:

- WhatsApp usa `WHATSAPP_ACCESS_TOKEN` y `WHATSAPP_PHONE_NUMBER_ID`.
- Meta usa `META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID` y `META_APP_SECRET`.
- En produccion debes usar HTTPS y un `SESSION_SECRET` largo.

## Produccion

La version local usa SQLite para que puedas correr todo con un solo archivo. Para produccion conviene cambiar Prisma a PostgreSQL, usar una base administrada, configurar dominio HTTPS y registrar las URLs publicas de webhooks en Meta Developers.
