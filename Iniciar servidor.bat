@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo   Registro de compras - iniciando servidor
echo ============================================
echo.
echo Liberando el puerto 3001 por si ya habia un servidor abierto...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
echo.
echo Compilando la ultima version...
call npm run build
echo.
echo ============================================
echo   Abre la app en el navegador:
echo.
echo   En esta PC:        http://localhost:3001
echo.
echo   Desde otras PC de la red, prueba estas:
powershell -NoProfile -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.*' } | ForEach-Object { '     http://' + $_.IPAddress + ':3001' }"
echo ============================================
echo.
echo (Deja esta ventana abierta mientras se usa la app.)
echo Para detener: cierra esta ventana o pulsa Ctrl+C.
echo.
call npm start
pause
