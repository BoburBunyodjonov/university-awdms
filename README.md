# AWDMS — Academic Workload Distribution & Management System

A department-level platform that replaces the Excel files universities use to hand out
teaching hours. It stores the academic structure (years, directions, groups, subjects),
calculates workload from configurable formulas, assigns every item to exactly one teacher
under strict validation rules, and exports official reports to Excel.

> Status: in active development. Backend API, shared domain layer and admin UI are being
> built out against a written technical specification
> ([`AWDMS_Technical_Specification.md`](./AWDMS_Technical_Specification.md)).

## The problem

Departments distribute a year of teaching load by hand in spreadsheets. In practice this means
hours that nobody was assigned, the same item given to two teachers, master's-level supervision
handed to staff without a scientific degree, and a department total that does not match the sum
of the individual teacher loads. AWDMS turns those rules into code.

## What it does

- **Formula-driven calculation** — lecture, practice, lab, assessment, course/individual project,
  internships, FQW, master's dissertation and PhD supervision each have their own formula
  (fixed hours, per group, or per student × coefficient). Admins edit coefficients; the formula
  shape is fixed and versioned by effective date.
- **Lecture streams (potok)** — merge several groups into one stream: lecture hours are counted
  once, assessment hours scale with the combined student count, and Uzbek/Russian groups are
  blocked from being merged.
- **Single-owner assignment** — every workload item belongs to exactly one teacher. Practicals
  cannot be split; PhD-only work is rejected for teachers without a degree and capped at 3 students.
- **Monitoring** — one screen for unassigned items, invalid formula configs, degree mismatches
  and department-total mismatches.
- **Teacher dashboard** — annual total against the teacher's norm, fall/spring split, in-class vs
  out-of-class hours, overload/underload indicator.
- **Excel in and out** — import workload from an official template with a validated preview and a
  downloadable error report; export teacher, department and semester reports with formal headers.
- **Audit log** — who changed which formula, item or assignment, with old and new values.

## Tech stack

| Layer | Stack |
|---|---|
| Monorepo | Turborepo + npm workspaces, shared TypeScript types in `packages/shared` |
| Backend | NestJS 10, Prisma 6 + PostgreSQL, JWT (access + refresh), Passport, class-validator + Zod |
| Reports | ExcelJS (export), Multer (import upload) |
| API docs | Swagger / OpenAPI |
| Security | bcrypt, Helmet, rate limiting (`@nestjs/throttler`), role-based guards |
| Frontend | React 18 + Vite + TypeScript, Tailwind CSS, Radix UI, TanStack Query, Zustand, React Hook Form + Zod, Recharts, i18next |
| Deployment | Docker Compose + Nginx reverse proxy on a VPS ([`DEPLOY_HETZNER.md`](./DEPLOY_HETZNER.md)) |

## Repository layout

```
apps/
  backend/           NestJS API (Prisma schema, modules, guards, Excel import/export)
  frontend/          React + Vite admin & teacher panels
  workload-mock-ui/  UI prototype for the workload screens
packages/shared/     Domain types, enums and Zod schemas shared by both apps
infra/nginx/         Reverse proxy config
scripts/             Deployment and maintenance scripts
```

## Running locally

```bash
npm install
cp .env.example .env          # database URL, JWT secrets

npm run dev --workspace @awdms/backend    # API on :3000, Swagger at /api/docs
npm run dev --workspace @awdms/frontend   # Vite dev server
```

Database:

```bash
npm run prisma:migrate --workspace @awdms/backend
npm run prisma:seed    --workspace @awdms/backend
```

Production is a single `docker compose -f docker-compose.prod.yml up -d --build` behind Nginx.

## Domain model

`users`, `teachers`, `academic_years`, `directions`, `groups`, `subject_offerings`,
`formula_configs`, `lecture_streams`, `workload_items`, `assignment_logs`, `audit_logs` —
PostgreSQL, with the business rules (single owner, degree restriction, language restriction)
enforced at both the API and the database level.
