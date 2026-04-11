@echo off
echo ========================================================
echo BENAKA TRAVELS - DATABASE BACKUP UTILITY
echo ========================================================
echo.
echo Initiating backup of the Cloudflare D1 Database (Remote)...

IF NOT EXIST "backups" (
    mkdir backups
)

REM Generate timestamp for filename
set timestamp=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%
set timestamp=%timestamp: =0%

echo Running backup command...
cd backend
call npx wrangler d1 export benaka --remote --output ..\backups\benaka_backup_%timestamp%.sql

echo.
echo ========================================================
echo BACKUP COMPLETE!
echo Your invoice data is safely saved in the "backups" folder.
echo You can use this file to fully restore your system if needed.
echo ========================================================
pause
