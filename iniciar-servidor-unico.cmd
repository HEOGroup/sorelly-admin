@echo off
rem Servidor unico do Sorelly Admin (porta 3000). Clique duas vezes neste arquivo, ou rode:  cmd /c iniciar-servidor-unico.cmd
rem Faz 3 coisas: (1) mais memoria para o Node, (2) grava tudo em logs\servidor.log, (3) liga de novo sozinho se cair.
rem Para parar de vez: feche esta janela.
rem IMPORTANTE (16/11/2026): quem liga e o Marcus, nesta janela. Servidor ligado por uma conversa do Claude e encerrado junto com ela.
cd /d "%~dp0"
if not exist logs mkdir logs

rem Se ja existe um servidor na 3000, nao liga outro (dois servidores na mesma pasta quebram a tela).
netstat -ano | findstr /R /C:":3000 .*LISTENING" >nul
if %errorlevel%==0 (
  echo A porta 3000 ja esta em uso. Feche o servidor antigo antes.
  echo Para ver quem usa:  netstat -ano ^| findstr :3000
  pause
  exit /b 1
)

set NODE_OPTIONS=--max-old-space-size=8192

:ligar
powershell -NoProfile -Command "Add-Content -Path 'logs\servidor.log' -Encoding UTF8 -Value ('[' + (Get-Date -Format 'dd/MM/yyyy HH:mm:ss') + '] LIGANDO o servidor')"
echo [%date% %time%] Ligando o servidor... (log em logs\servidor.log)
call npm.cmd run dev 2>&1 | powershell -NoProfile -Command "$input | ForEach-Object { Write-Host $_; Add-Content -Path 'logs\servidor.log' -Encoding UTF8 -Value $_ }"
powershell -NoProfile -Command "Add-Content -Path 'logs\servidor.log' -Encoding UTF8 -Value ('[' + (Get-Date -Format 'dd/MM/yyyy HH:mm:ss') + '] SERVIDOR CAIU. Religando em 5 segundos')"
echo [%date% %time%] SERVIDOR CAIU. Religando em 5 segundos... (feche a janela para parar)
timeout /t 5 /nobreak >nul
goto ligar
