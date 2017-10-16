set p=%~dp0
cd %p%
start run\mongod-dev.bat
start npm run-script dev
start cmd.exe