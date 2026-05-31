@echo off
setlocal EnableExtensions EnableDelayedExpansion

cd /d "%~dp0"

set "NODE_EXE=C:\Program Files\nodejs\node.exe"
set "NPM_CMD=C:\Program Files\nodejs\npm.cmd"

if not exist "%NODE_EXE%" (
  set "NODE_EXE=node"
)

if not exist "%NPM_CMD%" (
  set "NPM_CMD=npm"
)

echo.
echo ==========================================
echo   JP Sistems CRM
echo ==========================================
echo.

if not exist ".env" (
  if exist ".env.example" (
    copy ".env.example" ".env" >nul
    echo Configuracion local creada.
  )
)

if not exist "node_modules\next" (
  echo Instalando dependencias del CRM...
  call "%NPM_CMD%" install
  if errorlevel 1 goto :error
)

echo Preparando base de datos local...
set "PRISMA_CLIENT_READY="
if exist "node_modules\.prisma\client\index.js" set "PRISMA_CLIENT_READY=1"
if exist "node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\.prisma\client\index.js" set "PRISMA_CLIENT_READY=1"

if not defined PRISMA_CLIENT_READY (
  call "%NPM_CMD%" run db:generate
  if errorlevel 1 goto :error
)

call "%NPM_CMD%" run db:migrate
if errorlevel 1 goto :error

set "CRM_PORT=3000"
for /f %%P in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "$ports = 3000..3005; foreach ($p in $ports) { $client = New-Object Net.Sockets.TcpClient; try { $async = $client.BeginConnect('127.0.0.1', $p, $null, $null); if (-not $async.AsyncWaitHandle.WaitOne(200, $false)) { $client.Close(); Write-Output $p; exit 0 }; $client.EndConnect($async); $client.Close() } catch { Write-Output $p; exit 0 } }; Write-Output 3000"') do (
  set "CRM_PORT=%%P"
)
set "CRM_URL=http://127.0.0.1:%CRM_PORT%"
set "WATCHPACK_POLLING=true"
set "CHOKIDAR_USEPOLLING=true"
set "CHOKIDAR_INTERVAL=350"
set "NEXT_TELEMETRY_DISABLED=1"

echo.
echo CRM listo en %CRM_URL%
echo Usuario demo: admin@jpsistems.local
echo Password demo: admin
echo.
echo Esta ventana mantiene vivo el CRM y actualiza cambios automaticamente.
echo Para apagarlo, cierrala o presiona Ctrl+C.
echo.
start "" "%CRM_URL%"
call "%NPM_CMD%" run dev -- --hostname 127.0.0.1 --port %CRM_PORT%
exit /b %errorlevel%

:error
echo.
echo No pude completar el arranque automatico. Revisa el mensaje anterior.
pause
exit /b 1
