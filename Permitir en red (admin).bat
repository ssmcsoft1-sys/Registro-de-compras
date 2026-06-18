@echo off
chcp 65001 >nul
REM Se auto-eleva a administrador (aparece la ventana de permisos de Windows).
net session >nul 2>&1
if %errorlevel% neq 0 (
  echo Solicitando permisos de administrador...
  powershell -NoProfile -Command "Start-Process '%~f0' -Verb RunAs"
  exit /b
)

echo ============================================================
echo   Permitir "Registro de compras" en la red local
echo ============================================================
echo.

REM Borra la regla anterior si existe, y la vuelve a crear (puerto 3001, todos los perfiles).
netsh advfirewall firewall delete rule name="Registro de compras (puerto 3001)" >nul 2>&1
netsh advfirewall firewall add rule name="Registro de compras (puerto 3001)" dir=in action=allow protocol=TCP localport=3001

echo.
echo Listo. El puerto 3001 ya esta permitido en el firewall.
echo Ahora las otras computadoras de la red podran abrir la app.
echo.
pause
