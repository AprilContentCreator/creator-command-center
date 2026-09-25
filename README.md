# Creator Command Center

Creator Lounge Network planner for platforms, content, shops, websites, reminders, and LIVE support.

## Working features
- Add, edit, complete, reopen, and delete entries in every existing section.
- Set dates, times, priorities, status, links, and notes.
- View saved entries on the dashboard and month calendar; search across sections.
- Save quick notes and Brain Dump ideas.
- Export a JSON backup and restore a validated backup in Settings.
- Preserve earlier Quick Add entries, quick notes, and Brain Dump data when first saving the upgraded planner. Original storage keys remain untouched.

## Storage and limits
Data stays in localStorage for this browser and website origin. GitHub hosts the app code, not your planner entries. Devices and browsers do not sync. Keep regular backups. External calendars, social accounts, analytics feeds, and notifications are not connected; these sections support manually entered planning records.

Restore replaces the current planner after confirmation. Invalid backup files are rejected. If existing data cannot be read, saving is disabled to avoid overwriting it. A storage-write failure is shown rather than reported as a successful save.

## Run locally
Serve this directory using any static HTTP server and open index.html. No build or package install is needed. Use the same host and port for continued access to local entries.

## Validation (September 25, 2026)
Tested in headless Microsoft Edge: legacy data migration, persistence after reload, item editing, calendar placement, text rendering, search, JSON export, valid restore, invalid restore rejection, and mobile horizontal layout. No JavaScript runtime errors were observed in those flows.
