@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================================
echo   Migrar las compras locales a la base de datos en la nube
echo ============================================================
echo.
echo Pega la cadena de conexion de Neon (la del Paso 2, empieza por
echo "postgresql://...") y pulsa Enter:
echo.
set /p DBURL="DATABASE_URL: "
echo.
set "DATABASE_URL=%DBURL%"
node --disable-warning=ExperimentalWarning server/migrate-to-postgres.js
echo.
echo (Si dice "Migracion completa", tus compras ya estan en la nube.)
echo.
pause
