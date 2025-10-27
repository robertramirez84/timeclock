# TimeClock Monorepo (Base Monorepo + Seed Data)

This is the **Option 1** package: lightweight monorepo + full Seed Pack for Four Points Dual Brand.

## Next steps
1) Start Postgres:
   ```bash
   docker run --name pg-timeclock -e POSTGRES_PASSWORD=clock -e POSTGRES_DB=timeclock -p 5432:5432 -d postgres:16
   ```
2) Create `apps/api/.env`:
   ```env
   DATABASE_URL=postgresql://postgres:clock@localhost:5432/timeclock
   DIGEST_TZ=America/Chicago
   DIGEST_DEFAULT_TIME=21:00
   GM_EMAILS=gm@fourpointsdualbrand.com
   RM_EMAILS=rm@fourpointsdualbrand.com
   CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
   PROPERTY_GEOFENCE_CENTER=29.7604,-95.3698
   PROPERTY_GEOFENCE_RADIUS_M=150
   PROPERTY_WIFI_SSIDS=FourPoints_Guest,FourPoints_Staff
   PROPERTY_WIFI_BSSIDS=00:11:22:33:44:55,66:77:88:99:AA:BB
   SMTP_HOST=localhost
   SMTP_PORT=1025
   SMTP_USER=
   SMTP_PASS=
   ```
3) Install, migrate, seed:
   ```bash
   pnpm install
   pnpm db:migrate
   pnpm db:seed
   ```

> Code for API/Admin UI and Kiosk was provided in the canvas documents. You can add those files later, or ask me to generate a **Full Code ZIP**.
