@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set "REPO_NAME=CRM-JP-sistems"
set "DEFAULT_OWNER=Joseph70"
set "GIT_EXE=C:\Program Files\Git\cmd\git.exe"
set "GH_EXE=C:\Program Files\GitHub CLI\gh.exe"

if not exist "%GIT_EXE%" set "GIT_EXE=git"
if not exist "%GH_EXE%" set "GH_EXE=gh"

echo.
echo ==========================================
echo   Publicar CRM JP Sistems en GitHub
echo ==========================================
echo.

echo Marcando esta carpeta como repositorio seguro...
"%GIT_EXE%" config --global --add safe.directory "%CD:\=/%"

if not exist ".git" (
  echo.
  echo Inicializando repositorio local...
  "%GIT_EXE%" init -b main
)

echo.
echo Verificando sesion de GitHub...
"%GH_EXE%" auth status
if errorlevel 1 (
  echo.
  echo No hay sesion activa. Se abrira el login de GitHub.
  "%GH_EXE%" auth login --hostname github.com --git-protocol https --web
  if errorlevel 1 goto :error
)

for /f "tokens=*" %%u in ('"%GH_EXE%" api user --jq .login') do set "GH_USER=%%u"
if "%GH_USER%"=="" set "GH_USER=%DEFAULT_OWNER%"

echo.
echo Repositorio destino: https://github.com/%GH_USER%/%REPO_NAME%
echo.

"%GIT_EXE%" config user.name "Joseph"
"%GIT_EXE%" config user.email "joseph@users.noreply.github.com"

echo Guardando archivos del CRM...
"%GIT_EXE%" add -A -- .
"%GIT_EXE%" diff --cached --quiet
if errorlevel 1 (
  "%GIT_EXE%" commit -m "Initial CRM JP Sistems"
) else (
  echo No hay cambios nuevos para guardar.
)

echo.
echo Creando repositorio remoto si no existe...
"%GH_EXE%" repo view "%GH_USER%/%REPO_NAME%" >nul 2>nul
if errorlevel 1 (
  "%GH_EXE%" repo create "%REPO_NAME%" --private --source=. --remote=origin --push
  if errorlevel 1 goto :error
) else (
  "%GIT_EXE%" remote remove origin 2>nul
  "%GIT_EXE%" remote add origin "https://github.com/%GH_USER%/%REPO_NAME%.git"
  "%GIT_EXE%" push -u origin main
  if errorlevel 1 goto :error
)

echo.
echo Listo. CRM subido a:
echo https://github.com/%GH_USER%/%REPO_NAME%
pause
exit /b 0

:error
echo.
echo No pude completar la publicacion. Revisa el mensaje anterior.
pause
exit /b 1
