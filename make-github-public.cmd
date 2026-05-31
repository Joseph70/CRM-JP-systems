@echo off
setlocal EnableExtensions

cd /d "%~dp0"

set "REPO=Joseph70/CRM-JP-systems"
set "GH_EXE=C:\Program Files\GitHub CLI\gh.exe"

if not exist "%GH_EXE%" set "GH_EXE=gh"

echo.
echo ==========================================
echo   Hacer publico el repositorio CRM
echo ==========================================
echo.
echo Repositorio: https://github.com/%REPO%
echo.

"%GH_EXE%" auth status
if errorlevel 1 (
  echo.
  echo No hay sesion activa. Se abrira el login de GitHub.
  "%GH_EXE%" auth login --hostname github.com --git-protocol https --web
  if errorlevel 1 goto :error
)

echo.
echo Cambiando visibilidad a publica...
"%GH_EXE%" repo edit "%REPO%" --visibility public --accept-visibility-change-consequences
if errorlevel 1 goto :error

echo.
echo Listo. El repositorio ahora es publico:
echo https://github.com/%REPO%
pause
exit /b 0

:error
echo.
echo No pude cambiar la visibilidad. Revisa el mensaje anterior.
pause
exit /b 1
