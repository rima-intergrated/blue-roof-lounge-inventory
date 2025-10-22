<#
.SYNOPSIS
  Safely copy a MongoDB database from a development cluster into production.

.DESCRIPTION
  This script creates a backup of the production database, dumps the development
  database to an archive, and restores the development archive into the
  production database. It is interactive by default and will refuse to run
  if the source and target URIs are the same. It expects the MongoDB Database
  Tools (mongodump/mongorestore) to be installed and on PATH.

  IMPORTANT: This operation can be destructive (uses --drop by default). Only
  run during a maintenance window and after verifying you have a good backup.

.PARAMETER DevUri
  The MongoDB connection URI for the development source database.

.PARAMETER ProdUri
  The MongoDB connection URI for the production target database.

.PARAMETER BackupDir
  Directory where backups and dump archives are saved. Defaults to .\backups

.PARAMETER NoDrop
  If provided, the script will NOT pass --drop to mongorestore (it will merge
  instead of replacing). Use with extreme caution.

.PARAMETER SkipConfirm
  If provided, the script will not prompt for final confirmation.

EXAMPLE
  .\migrate-dev-to-prod.ps1 -DevUri $env:DEV_URI -ProdUri $env:PROD_URI

NOTE: Do NOT store credentials in shared scripts. Use environment variables
      or run this from a secure machine.
#>

param(
    [Parameter(Mandatory=$true)] [string] $DevUri,
    [Parameter(Mandatory=$true)] [string] $ProdUri,
    [string] $BackupDir = ".\backups",
    [switch] $NoDrop,
    [switch] $SkipConfirm
)

function Write-ErrAndExit($msg) {
    Write-Host "ERROR: $msg" -ForegroundColor Red
    exit 1
}

function Check-ToolExists($tool) {
    $which = Get-Command $tool -ErrorAction SilentlyContinue
    if (-not $which) { return $false }
    return $true
}

if (-not (Check-ToolExists 'mongodump')) { Write-ErrAndExit 'mongodump not found on PATH. Install MongoDB Database Tools.' }
if (-not (Check-ToolExists 'mongorestore')) { Write-ErrAndExit 'mongorestore not found on PATH. Install MongoDB Database Tools.' }

if ($DevUri -eq $ProdUri) {
    Write-ErrAndExit 'DevUri and ProdUri are identical. Aborting to avoid data loss.'
}

# Normalize and prepare backup directory
$timestamp = Get-Date -Format yyyyMMdd_HHmmss
if (-not (Test-Path $BackupDir)) { New-Item -ItemType Directory -Path $BackupDir | Out-Null }

$prodBackupArchive = Join-Path $BackupDir ("prod_backup_$timestamp.gz")
$devArchive = Join-Path $BackupDir ("dev_dump_$timestamp.gz")

Write-Host "Production backup archive will be: $prodBackupArchive"
Write-Host "Development dump archive will be: $devArchive"

if (-not $SkipConfirm) {
    Write-Host "\n*** WARNING: This operation can overwrite data in production. ***" -ForegroundColor Yellow
    $resp = Read-Host "Type 'I UNDERSTAND' to continue"
    if ($resp -ne 'I UNDERSTAND') { Write-Host 'Aborted by user.'; exit 2 }
}

try {
    Write-Host "\n1) Creating production backup..." -ForegroundColor Cyan
    $dumpCmd = @('mongodump', "--uri=$ProdUri", "--archive=$prodBackupArchive", '--gzip')
    Write-Host "Running: $($dumpCmd -join ' ')"
    & mongodump --uri=$ProdUri --archive=$prodBackupArchive --gzip
    if ($LASTEXITCODE -ne 0) { Write-ErrAndExit 'mongodump (prod backup) failed.' }

    Write-Host "Production backup completed: $prodBackupArchive" -ForegroundColor Green

    Write-Host "\n2) Dumping development database..." -ForegroundColor Cyan
    & mongodump --uri=$DevUri --archive=$devArchive --gzip
    if ($LASTEXITCODE -ne 0) { Write-ErrAndExit 'mongodump (dev dump) failed.' }
    Write-Host "Development dump completed: $devArchive" -ForegroundColor Green

    Write-Host "\n3) Restoring development dump into production..." -ForegroundColor Cyan
    $restoreArgs = @('--uri', $ProdUri, '--archive', $devArchive, '--gzip')
    if (-not $NoDrop) { $restoreArgs += '--drop' }

    Write-Host "Restore command: mongorestore $($restoreArgs -join ' ')"
    if (-not $SkipConfirm) {
      $ok = Read-Host "Type 'RESTORE' to proceed with the restore into production"
      if ($ok -ne 'RESTORE') { Write-Host 'Restore aborted by user.'; exit 3 }
    }

    & mongorestore @restoreArgs
    if ($LASTEXITCODE -ne 0) { Write-ErrAndExit 'mongorestore failed.' }
    Write-Host "Restore completed successfully." -ForegroundColor Green

    Write-Host "\n4) Verification hints:" -ForegroundColor Cyan
    Write-Host " - Run counts on key collections via mongosh or the Atlas UI. Example:"
    Write-Host "   mongosh \"$ProdUri\" --eval \"db.getCollectionNames().forEach(c=>print(c+': '+db.getCollection(c).countDocuments()))\""
    Write-Host " - Test application endpoints and confirm expected behavior."

    Write-Host "\nMigration finished. Keep the production backup ($prodBackupArchive) until you are confident." -ForegroundColor Green
    exit 0

} catch {
    Write-ErrAndExit "Unexpected error: $($_.Exception.Message)"
}
