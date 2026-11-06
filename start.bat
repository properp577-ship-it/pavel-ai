@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul || (echo Сначала установите Node.js версии LTS с сайта nodejs.org, затем запустите этот файл снова. & pause & exit /b)
if not exist .sdk58 (
  echo Установка и обновление до SDK 58, это займёт несколько минут...
  if exist node_modules rmdir /s /q node_modules
  if exist package-lock.json del package-lock.json
  call npm install
  call npx expo install --fix
  echo ok> .sdk58
)
echo Отсканируйте QR-код камерой iPhone (приложение Expo Go). Телефон и компьютер должны быть в одной Wi-Fi сети.
call npx expo start -c
pause
