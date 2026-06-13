@echo off
REM Lance pc_relay.py au démarrage de Windows.
REM Place ce fichier dans le dossier Démarrage :
REM   Win+R -> shell:startup -> copie ce .bat dedans

set RELAY_PORT=8765
set RELAY_TOKEN=un_token_secret_long_et_aleatoire

python "%~dp0pc_relay.py"
