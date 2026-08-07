$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$backupDirectory = Join-Path $root 'backups'
New-Item -ItemType Directory -Force -Path $backupDirectory | Out-Null
$stamp = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'
$output = Join-Path $backupDirectory "genealogie_$stamp.sql"
$docker = 'C:\Users\chris\AppData\Local\Programs\DockerDesktop\resources\bin\docker.exe'
& $docker exec memoire-familiale-db pg_dump -U genealogie -d genealogie | Set-Content -Encoding utf8 $output
Write-Output "Sauvegarde créée : $output"
