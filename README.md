# Parkmanager

Parkmanager is a modern, lightweight parking lot reservation system built to manage and optimize corporate or private parking lot allocations.

## Tech Stack
* **Framework:** [Next.js](https://nextjs.org/) (App Router, Server Actions)
* **Database ORM:** [Prisma](https://www.prisma.io/)
* **Database:** SQLite
* **Deployment:** Docker & Docker Compose
* **Styling:** Custom CSS

## Quick Start (Docker)

The application is fully containerized for easy deployment.

1. Ensure you have Docker and Docker Compose installed.
2. In the project root, run:
   ```bash
   docker compose up --build -d
   ```
3. The application will start and the SQLite database will be initialized automatically in the `./data` directory on your host machine to ensure persistence across restarts.

## Access & Navigation

* **Main App:** `http://localhost:3000`
* **Booking Page:** `/booking` – Public page to reserve a spot.
* **Status Page:** `/status` – Public page showing bookings for Today, the Next Business Day, and the Following Business Day.

### Admin Dashboard
* **URL:** `http://localhost:3000/admin`
* **Authentication:** Protected by HTTP Basic Auth.
* **Default Credentials:** Username: `admin` / Password: `admin` 
  *(You can change these in the `docker-compose.yml` file under `ADMIN_USERNAME` and `ADMIN_PASSWORD`)*

Once authenticated in the admin area, you can:
* Manage Lots and Spaces
* Manage Users and assign Roles (`NORMAL`, `MANAGEMENT`, `SPECIAL_NEEDS`)
* Adjust system settings and fairness constraints.

## Fairness Constraints & Settings

To prevent parking spots from being overbooked by a single user, the system features built-in fairness limits.
These values can be configured dynamically in the **Admin Settings**:

* **`FAIRNESS_MAX_SPOTS_NORMAL`** (Default: 3) - Max weekly spots for normal users.
* **`FAIRNESS_MAX_SPOTS_MANAGEMENT`** (Default: 5) - Max weekly spots for management users.
* **`RESTRICTION_TIMEFRAME_HOURS`** (Default: 24) - The threshold prior to the booking date when fairness limits are lifted. For example, if a space is still available <24 hours before the date, anyone can book it regardless of their weekly limits.

*(Note: Users with the `SPECIAL_NEEDS` role bypass fairness restrictions completely).*

## Additional Features
* **Localization:** Fully bilingual interface (English and German). Defaults to German.
* **Iframe Embedding:** The status page `/status` can be embedded into an intranet or external site. Instructions and the exact HTML code are visible at the bottom of the status page *only* if you are currently authenticated as an Admin.
* **Cancel Bookings:** Admins and users can seamlessly delete active bookings directly via the "✕" button on the Status page table.

## Local Development (Without Docker)

1. Copy `.env-example` to `.env`:
   ```bash
   cp .env-example .env
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize the database:
   ```bash
   npx prisma db push
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Internals & Troubleshooting
When running via Docker, the `Dockerfile` uses Next.js `standalone` mode to drastically reduce image size. 
The container initialization runs `prisma db push --skip-generate` to smoothly apply schema changes and handle DB creation without causing transpiler missing module errors, as the Prisma client generation securely happens in the builder stage.
