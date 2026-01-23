# MedManager
MedManager is a full‑stack medication management web app that helps patients track medicines, calculate treatment costs, and manage prescriptions over time.

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

#  Project Structure

```
my-app/
├── .env
├── .env.local
├── .gitignore
├── next-env.d.ts
├── next.config.mjs
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── README.md
├── tailwind.config.ts
├── tsconfig.json
├── node_modules/
├── public/
│   ├── assets/
│   │   ├── Calculator-rafiki.svg
│   │   └── undraw_date-picker_8qys.svg
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── app/
│   ├── api/
│   │   ├── add_med_calc/
│   │   │   └── route.ts
│   │   ├── add_prescription/
│   │   │   └── route.ts
│   │   ├── allergies/
│   │   │   └── route.ts
│   │   ├── bookmarks/
│   │   │   └── route.ts
│   │   ├── Calculate/
│   │   │   └── route.ts
│   │   ├── delete_user/
│   │   │   └── route.ts
│   │   ├── enter_med/
│   │   │   └── route.ts
│   │   ├── fetch_med_calc/
│   │   │   └── route.ts
│   │   ├── fetch_prescription/
│   │   │   └── route.ts
│   │   ├── get_medicine/
│   │   │   └── route.ts
│   │   ├── login/
│   │   │   └── route.ts
│   │   ├── me/
│   │   │   └── route.ts
│   │   ├── phone/
│   │   │   └── route.ts
│   │   ├── register/
│   │   │   └── route.ts
│   │   ├── auth.ts
│   │   └── mongodb.ts
│   ├── calculate/
│   │   └── page.tsx
│   ├── calendar_pg/
│   │   └── page.tsx
│   ├── login/
│   │   └── page.tsx
│   ├── signup/
│   │   └── page.tsx
│   ├── UserDash/
│   │   └── page.tsx
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── TitleBar.tsx
│   ├── Dialog.tsx
│   └── ui/
│       ├── alert-dialog.tsx
│       ├── button.tsx
│       ├── calendar.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── popover.tsx
│       └── switch.tsx
├── lib/
│   ├── utils.ts
│   └── types.ts
└── models/
    ├── calc.ts
    ├── medicine.ts
    ├── Prescription.ts
    └── User.ts


```
# API Endpoints

Public:

- GET /api/get_medicine – Search medicines (?term=paracetamol&type=name)

Protected (Bearer token):

- GET /api/fetch_med_calc – User’s saved cost medicines (?userId=...)

- POST /api/add_med_calc – Add/remove cost medicine

- PUT /api/Calculate – Compute cost for date range

- POST /api/add_prescription – Save prescription

- GET/POST/DELETE /api/allergies – Manage allergies

- GET /api/me – User profile

- PUT /api/phone – Update phone

- DELETE /api/delete_user – Delete account

## Environment Variables

```
DB=mongodb+srv://2405066_db_user:amuKTQM5yEtUqcnF@mycluster.y78x2nr.mongodb.net/?retryWrites=true&w=majority&appName=MyCluster
SECRET_KEY=HELLO
```
## Database

MongoDB collections:

users – User profiles, allergies, tokens.

medicines – Full medicine dataset from Indian Medicine Dataset.

med_calc – User’s saved cost medicines.

prescriptions – Saved prescriptions with schedules.








