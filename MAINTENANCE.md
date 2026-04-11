# Benaka Rentals - Maintenance & Recovery Guide

This document provides essential instructions for maintaining the platform and recovering data in case of an emergency.

## 1. Data Backups (Crucial)
All invoice and booking data is stored in the **Cloudflare D1 Database**. While Cloudflare is highly reliable, we recommend performing a manual backup every week or before any major changes.

### How to Backup:
1. Ensure the `backup-database.bat` file is in your project root folder.
2. **Double-click `backup-database.bat`**.
3. A new folder named `backups` will be created, containing a `.sql` file with all your data.
4. **Recommendation**: Move these `.sql` files to a secure cloud storage (like Google Drive) for safety.

## 2. Data Recovery
If the website "crashes" or you need to restore data to a new database:
1. Locate your latest `.sql` backup file.
2. Use the Cloudflare Wrangler tool or the Cloudflare Dashboard to import the SQL file into the D1 database.
3. Command for restoration:
   `npx wrangler d1 execute benaka --remote --file=backups/your_backup_file.sql`

## 3. Deployment
If you make changes to the frontend (e.g., updating phone numbers or fleet details):
1. Open a terminal in the `frontend` directory.
2. Run: `npm run build`
3. Run: `npx wrangler deploy` (This updates the live website at benakatravels.in).

## 4. Troubleshooting
- **White Screen on Admin**: This usually means the API token has expired or the browser cache is old. Try clearing your browser cache and logging in again.
- **Invoice Not Generating**: Ensure all required fields (marked with *) are filled out. Check your internet connection.

---
**Developed by Benaka Tours & Travels Tech Team (2025)**
