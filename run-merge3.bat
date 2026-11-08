@echo off
setlocal EnableExtensions

rem Double-click this file to start both merge3 services on this computer.
rem Optional overrides: MERGE3_BACKEND_DIR, MERGE3_JAVA_HOME,
rem MERGE3_BACKEND_PORT, MERGE3_FRONTEND_PORT.
set "FE_DIR=%~dp0"
for %%I in ("%FE_DIR%.") do set "FE_DIR=%%~fI"
if defined MERGE3_BACKEND_DIR set "BE_DIR=%MERGE3_BACKEND_DIR%"
if not defined MERGE3_BACKEND_DIR set "BE_DIR=%FE_DIR%\..\group4-BE"
if not defined MERGE3_BACKEND_DIR if not exist "%BE_DIR%\mvnw.cmd" set "BE_DIR=%FE_DIR%\..\..\merge2-backend\group4-BE"
for %%I in ("%BE_DIR%") do set "BE_DIR=%%~fI"

if not defined MERGE3_BACKEND_PORT set "MERGE3_BACKEND_PORT=8081"
if not defined MERGE3_FRONTEND_PORT set "MERGE3_FRONTEND_PORT=5174"
set "SERVER_PORT=%MERGE3_BACKEND_PORT%"
set "CORS_ALLOWED_ORIGINS=http://127.0.0.1:%MERGE3_FRONTEND_PORT%,http://localhost:%MERGE3_FRONTEND_PORT%"
set "FRONTEND_URL=http://127.0.0.1:%MERGE3_FRONTEND_PORT%"
set "VITE_API_BASE_URL=http://127.0.0.1:%MERGE3_BACKEND_PORT%/api/v1"

if defined MERGE3_JAVA_HOME set "JAVA_HOME=%MERGE3_JAVA_HOME%"
if not exist "%JAVA_HOME%\bin\java.exe" set "JAVA_HOME=C:\SWP\.test-tools\jdk21\jdk-21.0.12.1+1"

if not exist "%BE_DIR%\mvnw.cmd" goto missing_backend
if not exist "%JAVA_HOME%\bin\java.exe" goto missing_java
where git.exe >nul 2>&1 || goto missing_git
where npm.cmd >nul 2>&1 || goto missing_npm

set "FE_BRANCH="
set "BE_BRANCH="
for /f "delims=" %%B in ('git -C "%FE_DIR%" branch --show-current 2^>nul') do set "FE_BRANCH=%%B"
for /f "delims=" %%B in ('git -C "%BE_DIR%" branch --show-current 2^>nul') do set "BE_BRANCH=%%B"
if /I not "%FE_BRANCH%"=="merge3" goto wrong_branch
if /I not "%BE_BRANCH%"=="merge3" goto wrong_branch

if /I "%~1"=="--backend" goto run_backend
if /I "%~1"=="--frontend" goto run_frontend

echo Frontend: %FE_DIR% [%FE_BRANCH%]
echo Backend:  %BE_DIR% [%BE_BRANCH%]
echo Java:     %JAVA_HOME%
echo Web:      http://127.0.0.1:%MERGE3_FRONTEND_PORT%/
echo API:      %VITE_API_BASE_URL%
if /I "%~1"=="--check" exit /b 0

call :port_busy %MERGE3_BACKEND_PORT%
if not errorlevel 1 goto port_in_use
call :port_busy %MERGE3_FRONTEND_PORT%
if not errorlevel 1 goto port_in_use

start "Merge3 Backend" "%ComSpec%" /k call "%~f0" --backend
start "Merge3 Frontend" "%ComSpec%" /k call "%~f0" --frontend
echo.
echo Started both services. Keep their two console windows open.
echo Open http://127.0.0.1:%MERGE3_FRONTEND_PORT%/ after the backend finishes starting.
echo Close the two service windows or press Ctrl+C in each to stop them.
if not defined MERGE3_NO_PAUSE pause
exit /b 0

:run_backend
cd /d "%BE_DIR%" || exit /b 1
echo Starting merge3 backend on port %MERGE3_BACKEND_PORT%...
call mvnw.cmd -q spring-boot:run
if errorlevel 1 echo Backend stopped with an error. Read the message above.
exit /b %errorlevel%

:run_frontend
cd /d "%FE_DIR%" || exit /b 1
if not exist "node_modules\.bin\vite.cmd" (
    echo Installing frontend dependencies...
    call npm.cmd ci || exit /b 1
)
echo Starting merge3 frontend on port %MERGE3_FRONTEND_PORT%...
call npm.cmd run dev -- --host 127.0.0.1 --port %MERGE3_FRONTEND_PORT% --strictPort
if errorlevel 1 echo Frontend stopped with an error. Read the message above.
exit /b %errorlevel%

:port_busy
powershell.exe -NoProfile -Command "if (Get-NetTCPConnection -State Listen -LocalPort %~1 -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }" >nul 2>&1
exit /b %errorlevel%

:port_in_use
echo.
echo A requested port is already in use. No new service was started.
echo If merge3 is already running, open http://127.0.0.1:%MERGE3_FRONTEND_PORT%/ .
echo Otherwise stop the process on that port or set MERGE3_BACKEND_PORT and MERGE3_FRONTEND_PORT before running this file.
if not defined MERGE3_NO_PAUSE pause
exit /b 1

:wrong_branch
echo Expected branch merge3 in both repositories. Found FE=%FE_BRANCH%, BE=%BE_BRANCH%.
goto failed
:missing_backend
echo Backend repository not found: %BE_DIR%
echo Set MERGE3_BACKEND_DIR to its folder.
goto failed
:missing_java
echo JDK not found. Set MERGE3_JAVA_HOME to a JDK 21 folder.
goto failed
:missing_git
echo git.exe not found in PATH.
goto failed
:missing_npm
echo npm.cmd not found in PATH. Install Node.js before running.
goto failed
:failed
if not defined MERGE3_NO_PAUSE pause
exit /b 1
