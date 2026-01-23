# MedManager
MedManager is a full‑stack medication management web app that helps patients track medicines, calculate treatment costs, and manage prescriptions over time. It combines a modern Next.js frontend with a FastAPI backend and MongoDB for persistence.

## Features
### Medicine search

- Search by name, manufacturer, or short composition.

- View pack details, composition, manufacturer, and discontinuation status.

- Allergy-aware highlighting based on your saved allergy list.

### Saved medicines

- Add/remove medicines to a personal “saved” list.

- Saved medicines are reused in the cost calculator and prescriptions.

### Cost calculator

- Select saved medicines and define:

  - Dosage per intake.

  - Frequency (per day, per week, per month).

  - Weekly or monthly schedules.

- Choose a start and end date and calculate:

  - Total quantity required.

  - Per‑medicine and overall cost.

  - Uses pack size labels to derive cost per unit.

 ### Prescriptions

- Save a cost configuration as a prescription for a date range.

- Persist prescriptions to the backend for later reference and integration with tracking.

### Tracking calendar

- Calendar view to visualize medication schedules and adherence over time.

- Uses the saved prescription data for day‑wise planning.

### User profile & allergies

- JWT‑based authentication (token stored client‑side).

- View/update profile details (name, email, phone).

- Manage allergy list; UI blocks selecting medicines that match your allergens.

### Responsive UI & theming

- Next.js App Router with client components where needed.

- Tailwind CSS with a custom purple/ink color palette.

- shadcn/ui primitives (AlertDialog, Dialog, Popover, Calendar, etc.) with consistent light card styling.

## Tech Stack
### Frontend

- Next.js (React, App Router)

- TypeScript

- Tailwind CSS (custom theme via @theme)

- shadcn/ui + Radix primitives

### Backend

- FastAPI (Python)

- RESTful endpoints for auth, medicines, cost calculation, prescriptions, and allergies

### Database

- MongoDB / MongoDB Atlas

### Auth

- JWT tokens stored in localStorage for authenticated API calls
