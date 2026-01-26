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

Create a .env.local file:
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/my-app
SECRET_KEY=your_jwt_secret_minimum_32_characters_long
```
## Database

MongoDB collections:

users – User profiles, allergies, tokens.

medicines – Full medicine dataset from Indian Medicine Dataset.

med_calc – User’s saved cost medicines.

prescriptions – Saved prescriptions with schedules.

## Getting Started

```
# Clone the repository
git clone https://github.com/Preksha-Chaki/MedManager.git
cd my-app

# Install dependencies
npm install

# Set up environment variables
cp .env.local

# Start development server
npm run dev
```





