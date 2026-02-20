@echo off
echo ========================================
echo   SECP Protocol Frontend Setup
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Check if .env.local exists
if not exist ".env.local" (
    echo Creating .env.local file...
    copy .env.local.example .env.local
    echo.
    echo ⚠️  IMPORTANT: Edit .env.local and add your WalletConnect Project ID
    echo    Get it from: https://cloud.walletconnect.com
    echo.
)

echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo To start the development server, run:
echo   npm run dev
echo.
echo Then open: http://localhost:3000
echo.
pause
