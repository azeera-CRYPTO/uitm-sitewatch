# UiTM Rekod Lawatan Tapak Staf & Kontraktor

Build a mobile-responsive full-stack web application titled "Sistem Pelaporan & Pemantauan Tugasan Tapak UiTM Kampus Machang". The app should use a professional corporate theme with UiTM colors (Deep Purple and Gold/Yellow).

The application must consist of a Staff Reporting Form and a Secure Admin Dashboard.

1. STAFF REPORTING FORM REQUIREMENTS:
- AUTOMATIC CAPTURE: Automatically capture the exact GPS coordinates (Latitude & Longitude), Current Date, and Current Time immediately when the form is opened. This data must be locked, strictly read-only, and impossible for the staff to edit manually. Include GPS accuracy indicator and a mini map preview to verify the lock.
- STAFF DETAILS: Name and Staff ID / Unit / Contractor field, saved in browser local storage so staff don't have to re-enter it repeatedly.
- CATEGORY OF REPORT (Dropdown Menu):
  * Perkhidmatan Pencucian
  * Kerja Pembaikan Kecil
  * Pemantauan Projek
  * Lain-lain / Aduan
- STATUS OF TASK (Dropdown Menu):
  * Selesai
  * Dalam Proses
  * Memerlukan Tindakan Lanjut
- CONDITIONAL LOCATION SELECTION (Dropdown Menu based on Zone):
  First, staff selects a Zone. Then, the Building dropdown filter shows the specific locations:
  * ZON 1: Bangunan Pentadbiran, Blok Akademik A & B, Pusat Islam / Medan Ilmu, Pos Utama Polis Bantuan, BPF / Unit Kenderaan, Blok Akademik D, Dewan Badminton UiTM, Pusat Pelajar / Premier Lounge.
  * ZON 2: Kolej Tun Razak, Kolej Tunku Abdul Rahman, Dewan Profesional, Pusat Kesihatan, Bengkel FSSR, Pejabat Unit Kaunseling, Perpustakaan Tengku Anis, Blok Akademik C, Birda.
  * ZON 3: Kolej Dato Onn, Pejabat Unit Sukan, Kolej Tun Hussein Onn, Food Court THO (Surau), Kolej Tun Dr Mahathir, Rumah Universiti, Pejabat Polis Bantuan.
- MANUAL INPUT: A text area for staff to type details (e.g., floor level, room number, or specific work notes).
- VISUAL PROOF: A mandatory file/camera upload button for staff to capture and attach a live photo of the completed work or site condition.
- PWA SUPPORT: Mobile-responsive with Progressive Web App capabilities (manifest, installable / Add to Home Screen).

2. ADMIN DASHBOARD REQUIREMENTS:
- SECURE LOGIN: Protect the dashboard with a login page. Configure the default admin email access to: fasiliti.uitmck@gmail.com
- REPORT DATA VIEW: A clean table showing all submitted reports with columns for Timestamp, Staff Name, Category, Zone, Building, Status, Notes, Photo Preview, and GPS Coordinates.
- STATUS UPDATE WORKFLOW: Admin can update the status of reports (especially "Memerlukan Tindakan Lanjut" to "Dalam Tindakan" or "Selesai") with audit/action notes.
- INTERACTIVE MAP VIEW: Integrate an interactive map that visualizes all report submissions as pins based on their auto-captured GPS coordinates. Clicking a pin should show the report details.
- FILTERING & EXPORT: Allow the admin to filter reports by Date Range, Zone, and Task Category. Include a button to export the filtered report data into an Excel/CSV format.
- AUTOMATION: Configure the system to automatically trigger an email notification summary to fasiliti.uitmck@gmail.com whenever a high-priority report (e.g., status "Memerlukan Tindakan Lanjut") is submitted.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://uitm-sitewatch.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/014003d1-dcdf-4dff-a874-18df3d1c7c23).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
