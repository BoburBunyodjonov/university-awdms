**TECHNICAL SPECIFICATION**

Academic Workload Distribution & Management System

**AWDMS**

University Department

Version 1.0

2026

**1. Project Goal & Description**

**1.1 Project Name**

Academic Workload Distribution & Management System (AWDMS)

**1.2 Project Goal**

The system\'s purpose is to digitally manage the academic workload
allocated to a university department for one academic year ---
distributing it among teachers without errors, automatically calculating
annual and semester loads, separately tracking in-class and out-of-class
work, and generating formal reports exportable to Excel.

**1.3 Problem Statement**

The current process is carried out manually in Excel files, which leads
to the following errors:

-   Some hours go completely unassigned

-   The same workload item gets assigned twice

-   Lecture/practice/assessment linkages are tracked incorrectly

-   Master\'s-level workload may be assigned to a teacher without a
    scientific degree

-   Discrepancies arise between the department\'s total workload and the
    sum of individual teacher loads

**1.4 Target Users**

-   Department head

-   Workload distribution officer

-   System administrator

-   Teachers

-   Management staff (for statistics and reporting)

**1.5 Core System Functions**

-   Enter workload by academic year, semester, course year, direction,
    group, language, and subject

-   Calculate workload based on configurable formulas

-   Manage lecture, practice, lab, assessment, course project, and
    supervision workloads

-   Create and manage lecture streams (potok)

-   Assign workload items to teachers

-   Separately calculate in-class and out-of-class hours

-   Detect unassigned and invalid records

-   Export individual and summary reports to Excel

**2. Business Domain & Rules**

**2.1 Workload Categories**

**In-class (Auditorium) Workload**

-   Lecture

-   Practical

-   Laboratory

-   Assessment (Nazorat)

-   Course project work

**Out-of-class (Non-auditorium) Workload**

-   Industrial internship supervision

-   Pre-diploma internship supervision

-   Final Qualifying Work (FQW / VQR)

-   Master\'s dissertation (MD)

-   Research degree project (NDP)

-   Academic internship (NS)

-   Other supervision-type work

**2.2 Core Business Rules**

1.  Each workload item is assigned to exactly ONE teacher.

2.  Lectures are always assigned to a single teacher.

3.  Practicals are always assigned to a single teacher and cannot be
    split.

4.  Lecture and practical may be assigned to the same teacher, but this
    is not required.

5.  Lecture and practical may go to different teachers.

6.  Multiple academic groups can be merged into a single lecture stream.

7.  In a merged lecture stream, lecture hours do not increase, but
    assessment hours may increase proportionally to the total student
    count.

8.  Uzbek and Russian groups cannot be merged into the same lecture
    stream.

9.  A single subject may have multiple lecture streams.

10. Each practical item must be linked to its corresponding lecture
    stream.

11. Course project work counts as in-class (auditorium) workload.

12. VQR, MD, NDP, and NS are tracked by studentCount, not by individual
    student name.

13. MD, NDP, and NS may only be assigned to teachers with a scientific
    degree.

14. Formulas can only be edited by the administrator.

15. Teacher annual norm is stored in the teacher profile and is
    editable.

16. Department total workload = sum of all workload items assigned to
    all teachers.

**2.3 Academic Structure**

-   Academic year: fall and spring semesters

-   courseYear: 1--4 for bachelor, or master\'s stage

-   semesterNumber: 1, 2, 3, 4, ...

-   academicTerm: Fall / Spring

-   Study type: full-time / part-time / master\'s

-   Language of instruction: Uzbek / Russian

**3. User Roles**

Note: The primary business users of this system are Admin and Teacher.
Student and Guest roles are included for an extended ecosystem but may
have limited functionality in the MVP phase.

**3.1 Admin**

**Permissions:**

-   View all data

-   Create, edit, and delete teachers

-   Create and edit formulas

-   Open / close academic years

-   Import workload data

-   Create and manage lecture streams

-   Assign all workload items to teachers

-   Reassign and unassign workload items

-   View monitoring and statistics

-   Export to Excel

-   Manage user roles

-   View audit logs

**3.2 Teacher**

**Permissions:**

-   View own workload only

-   View workload broken down by semester and year

-   View in-class and out-of-class hours

-   Export own workload to Excel

-   View own profile and annual norm

-   View assigned groups, subjects, and supervision blocks

**3.3 Student (Optional in MVP)**

**Permissions:**

-   View publicly available or restricted academic information

-   View subjects and teacher list for own group

-   View general information about assigned supervision blocks

**3.4 Guest**

**Permissions:**

-   View public pages without logging in

-   About page, Contact page

-   General statistics overview (if permitted)

**4. Functional Requirements**

**4.1 Authentication & Authorization**

-   Login / Logout

-   JWT access + refresh token (or session-based auth)

-   Route protection based on role

-   Change password / Reset password

-   Account status: active / inactive

**4.2 Teacher Management**

-   Add teacher with: full name, scientific degree, position, annual
    norm

-   Active / inactive status

-   Role mapping (admin or teacher)

-   View full workload profile per teacher

**4.3 Academic Structure Management**

-   Create academic years and semesters

-   Add directions (bachelor / master level)

-   Create groups with: name, direction, level, study type, course year,
    semester number, language, student count

**4.4 Subject Offering Management**

-   Enter subject name and link to a direction

-   Specify course year, semester number, and academic term

-   Link groups to the subject offering

**4.5 Formula Management**

-   Create and edit formulas (admin only)

-   Scope: by level (bachelor/master), study type, and workload type

-   Calculation modes: coefficient-based, fixed per student, fixed per
    group, fixed value

-   Effective date management

-   Active / inactive formula state

-   Formula preview before applying

-   Formula audit log

**4.6 Lecture Stream Planning**

-   Create a stream for a subject offering

-   Merge multiple groups into one lecture stream

-   Language restriction validation (Uzbek / Russian groups cannot be
    merged)

-   Automatic total student count calculation

-   Preview lecture hours and assessment hours

-   Assign teacher to stream

-   Stream status: draft / ready / assigned

**4.7 Workload Generation**

-   Create workload items: lecture, practical, lab, assessment, course
    project, VQR, MD, NDP, NS, internship

-   Link practical items to a lecture stream

-   Automatic category assignment: auditorium / non_auditorium

**4.8 Workload Assignment**

-   Assign workload item to a teacher via dropdown

-   Single-owner policy: each item assigned to exactly one teacher

-   Reassign and unassign functionality

-   Scientific degree restriction check for MD/NDP/NS

-   Practical item split prevention

-   Language-stream restriction check

-   Assignment history stored in log

**4.9 Monitoring**

-   List of unassigned workload items

-   Items with invalid formula configurations

-   Degree mismatch items (MD/NDP/NS assigned to unqualified teacher)

-   Cross-language merge errors

-   Duplicate / exclusive assignment errors

-   Department total mismatch warnings

-   Filter panel and color-coded highlighting

**4.10 Teacher Dashboard**

-   Total annual workload for the teacher

-   Fall / spring semester breakdown

-   In-class hours and out-of-class hours

-   Assigned subjects, streams, and supervision blocks

**4.11 Statistics & Reporting**

-   Statistics by teacher, department, semester, category, and direction

-   Overload / underload indicators

-   Excel export for all report types

**4.12 Import / Export**

-   Import workload from Excel template (with preview and validation)

-   Import error report

-   Export: teacher load, department summary, semester summary,
    statistics

**4.13 Audit Log**

-   Who created / edited / deleted which workload item and when

-   Who changed which formula and when

-   Who changed which assignment and when

-   Old value / new value stored per change

**5. Technology Stack**

**5.1 Frontend**

  ---------------------- ----------------- -------------------------------
  **Technology**         **Decision**      **Reason**

  React + TypeScript     **Keep**          Industry standard for
                                           data-heavy admin UIs

  Tailwind CSS           **Keep**          Utility-first, fast, consistent
                                           styling

  TanStack Query         **Keep**          Best solution for server state
                                           & caching

  React Hook Form + Zod  **Keep**          Excellent form validation combo

  Zustand                **Prefer over     Lightweight; Redux Toolkit is
                         Redux**           overkill here

  shadcn/ui              **Keep**          Accessible, Tailwind-native,
                                           flexible components

  Recharts               **Keep**          Sufficient for the statistics
                                           views needed

  Axios                  **Optional**      TanStack Query + fetch may be
                                           sufficient

  React Router           **Keep**          Standard client-side routing
  ---------------------- ----------------- -------------------------------

**5.2 Backend**

  ---------------------- ----------------- -------------------------------
  **Technology**         **Decision**      **Reason**

  NestJS                 **Use**           Modular, role-based
                                           architecture; DTO/guards
                                           built-in

  Express.js             **Skip**          Too unstructured for complex
                                           business rules

  JWT access + refresh   **Keep**          Standard and secure auth
  token                                    pattern

  bcrypt                 **Keep**          Password hashing standard

  ExcelJS                **Keep**          Best Node.js library for Excel
                                           generation

  Multer                 **Keep**          Standard middleware for file
                                           uploads

  Swagger / OpenAPI      **Keep**          API documentation required per
                                           NFRs
  ---------------------- ----------------- -------------------------------

**5.3 Database --- Recommended Change**

The original TZ proposes MongoDB. For this project, PostgreSQL is
strongly recommended instead.

  ------------------ ----------------- ----------------------------------
  **Original**       **Recommended**   **Reason for change**

  MongoDB            **PostgreSQL**    Relational integrity, ACID
                                       transactions, complex joins

  Mongoose           **Prisma ORM**    Type-safe schema, auto-migrations,
                                       TypeScript native

  MongoDB Atlas      **Supabase /      Managed PostgreSQL with easy setup
                     Railway**         
  ------------------ ----------------- ----------------------------------

Why PostgreSQL is the right choice for AWDMS:

-   All 16 business rules involve relational constraints (single-owner,
    degree restrictions, language-stream rules) --- these are natively
    enforced via foreign keys and constraints in PostgreSQL

-   ACID transactions are essential for assignment/reassignment
    operations to prevent data integrity issues

-   Complex aggregation queries (department total vs. teacher sum
    mismatch checks) are straightforward SQL

-   The data model in this TZ is already designed relationally --- it
    maps directly to PostgreSQL tables with zero redesign

-   Prisma provides a fully type-safe schema that integrates perfectly
    with TypeScript on both frontend and backend

**5.4 Monorepo Structure**

Recommended tool: Turborepo (lighter than NX, faster setup)

> academic-workload/\
> ├── apps/\
> │ ├── frontend/ \# React + Vite + TypeScript\
> │ └── backend/ \# NestJS\
> ├── packages/\
> │ └── shared/ \# Shared TypeScript types, enums, Zod schemas\
> ├── docs/\
> ├── .github/\
> │ └── workflows/ \# CI/CD pipelines\
> ├── package.json \# Root workspaces config\
> └── turbo.json \# Turborepo pipeline config

The packages/shared directory contains types used by both frontend and
backend --- no duplication:

> // shared/types/workload.ts\
> export type WorkloadType =\
> \'lecture\' \| \'practice\' \| \'lab\' \| \'control\'\
> \| \'course_project\' \| \'VQR\' \| \'MD\' \| \'NDP\' \| \'NS\'\
> \
> export type AssignmentStatus = \'unassigned\' \| \'assigned\' \|
> \'invalid\'\
> export type AcademicTerm = \'fall\' \| \'spring\'\
> export type StudyLevel = \'bachelor\' \| \'master\'

**5.5 Hosting**

  ---------------------- ------------------------------------------------
  **Layer**              **Recommended Service**

  Frontend               Vercel

  Backend                Render / Railway / VPS

  Database               Supabase (managed PostgreSQL) or Railway
                         PostgreSQL

  File Storage           Local storage or S3-compatible (e.g. Cloudflare
                         R2)

  Environment Secrets    Platform secrets / .env files (never committed)
  ---------------------- ------------------------------------------------

**6. Pages & Sitemap**

**6.1 Public Pages**

-   / --- Home page

-   /about --- About the system

-   /contact --- Contact

-   /login --- Login

**6.2 Admin Panel**

-   /admin --- Dashboard

-   /admin/teachers --- Teachers list

-   /admin/teachers/:id --- Teacher profile

-   /admin/academic-years --- Academic years

-   /admin/groups --- Groups

-   /admin/directions --- Directions

-   /admin/subjects --- Subjects / Subject offerings

-   /admin/formulas --- Formula management

-   /admin/streams --- Lecture streams

-   /admin/workload --- Full workload table

-   /admin/workload/import --- Excel import

-   /admin/workload/assign --- Assignment view

-   /admin/monitoring --- Monitoring

-   /admin/statistics --- Statistics

-   /admin/reports --- Reports

-   /admin/audit-logs --- Audit logs

-   /admin/settings --- System settings

**6.3 Teacher Panel**

-   /teacher --- Teacher dashboard

-   /teacher/load --- Full workload

-   /teacher/load/fall --- Fall semester

-   /teacher/load/spring --- Spring semester

-   /teacher/statistics --- Individual statistics

-   /teacher/profile --- Profile

-   /teacher/export --- Excel export

**6.4 Student Panel (Optional)**

-   /student --- Dashboard

-   /student/groups --- Subjects by group

-   /student/teachers --- Group teachers

**7. Data Model**

All collections below map directly to PostgreSQL tables. ObjectId
references become foreign keys (UUID or SERIAL).

**7.1 users**

> {\
> id: UUID (PK)\
> fullName: string\
> email: string (unique)\
> passwordHash: string\
> role: admin \| teacher \| student \| guest\
> teacherId: FK -\> teachers (nullable)\
> isActive: boolean\
> createdAt: timestamp\
> updatedAt: timestamp\
> }

**7.2 teachers**

> {\
> id: UUID (PK)\
> fullName: string\
> degreeName: string\
> hasScientificDegree: boolean\
> position: string\
> annualNorm: integer (hours)\
> isActive: boolean\
> createdAt: timestamp\
> updatedAt: timestamp\
> }

**7.3 academic_years**

> {\
> id: UUID (PK)\
> name: string // e.g. \'2026-2027\'\
> isActive: boolean\
> startDate: date\
> endDate: date\
> }

**7.4 directions**

> {\
> id: UUID (PK)\
> name: string\
> code: string\
> level: bachelor \| master\
> }

**7.5 groups**

> {\
> id: UUID (PK)\
> name: string\
> directionId: FK -\> directions\
> level: bachelor \| master\
> studyType: full_time \| part_time\
> courseYear: integer\
> semesterNumber: integer\
> academicTerm: fall \| spring\
> language: uzbek \| russian\
> studentCount: integer\
> }

**7.6 subject_offerings**

> {\
> id: UUID (PK)\
> subjectName: string\
> directionId: FK -\> directions\
> level: bachelor \| master\
> studyType: full_time \| part_time\
> courseYear: integer\
> semesterNumber: integer\
> academicTerm: fall \| spring\
> isActive: boolean\
> // groups linked via subject_offering_groups join table\
> }

**7.7 formula_configs**

> {\
> id: UUID (PK)\
> name: string\
> scopeType: lecture \| control \| practice \| lab \| course_project \|
> VQR \| MD \| NDP \| NS\
> level: bachelor \| master\
> studyType: full_time \| part_time\
> calculationMode: coefficient_based \| fixed_per_student \|
> fixed_per_group \| fixed_value\
> baseHours: float\
> coefficientPerStudent: float\
> fixedHoursPerStudent: float\
> fixedHoursPerGroup: float\
> fixedValue: float\
> isActive: boolean\
> effectiveFrom: date\
> }

**7.8 lecture_streams**

> {\
> id: UUID (PK)\
> subjectOfferingId: FK -\> subject_offerings\
> language: uzbek \| russian\
> totalStudentCount: integer\
> lectureHours: float\
> controlHours: float\
> teacherId: FK -\> teachers (nullable)\
> status: draft \| ready \| assigned\
> // groups linked via stream_groups join table\
> }

**7.9 workload_items**

> {\
> id: UUID (PK)\
> academicYearId: FK -\> academic_years\
> subjectOfferingId: FK -\> subject_offerings (nullable)\
> lectureStreamId: FK -\> lecture_streams (nullable)\
> groupId: FK -\> groups (nullable)\
> workloadType: lecture \| practice \| lab \| control \| course_project\
> \| internship \| prediploma \| VQR \| MD \| NDP \| NS\
> category: auditorium \| non_auditorium\
> studentCount: integer\
> plannedHours: float\
> formulaConfigId: FK -\> formula_configs (nullable)\
> requiresDegree: boolean\
> assignedTeacherId: FK -\> teachers (nullable)\
> status: unassigned \| assigned \| invalid\
> }

**7.10 assignment_logs**

> {\
> id: UUID (PK)\
> workloadItemId: FK -\> workload_items\
> oldTeacherId: FK -\> teachers (nullable)\
> newTeacherId: FK -\> teachers (nullable)\
> action: assign \| reassign \| unassign\
> performedByUserId: FK -\> users\
> createdAt: timestamp\
> }

**7.11 audit_logs**

> {\
> id: UUID (PK)\
> entityType: teacher \| formula \| stream \| workload \| assignment\
> entityId: UUID\
> action: create \| update \| delete\
> oldValue: JSON\
> newValue: JSON\
> performedByUserId: FK -\> users\
> createdAt: timestamp\
> }

**8. API Endpoints**

**8.1 Authentication**

> POST /api/auth/login\
> POST /api/auth/refresh\
> POST /api/auth/logout\
> POST /api/auth/forgot-password\
> POST /api/auth/reset-password\
> GET /api/auth/me

**8.2 Teachers**

> GET /api/teachers\
> POST /api/teachers\
> GET /api/teachers/:id\
> PATCH /api/teachers/:id\
> DELETE /api/teachers/:id\
> GET /api/teachers/:id/workload\
> GET /api/teachers/:id/statistics

**8.3 Academic Structure**

> GET /api/academic-years\
> POST /api/academic-years\
> PATCH /api/academic-years/:id\
> \
> GET /api/directions\
> POST /api/directions\
> PATCH /api/directions/:id\
> \
> GET /api/groups\
> POST /api/groups\
> GET /api/groups/:id\
> PATCH /api/groups/:id\
> DELETE /api/groups/:id

**8.4 Subject Offerings**

> GET /api/subjects\
> POST /api/subjects\
> GET /api/subjects/:id\
> PATCH /api/subjects/:id\
> DELETE /api/subjects/:id

**8.5 Formula Configs**

> GET /api/formulas\
> POST /api/formulas\
> GET /api/formulas/:id\
> PATCH /api/formulas/:id\
> DELETE /api/formulas/:id\
> POST /api/formulas/:id/preview

**8.6 Lecture Streams**

> GET /api/streams\
> POST /api/streams\
> GET /api/streams/:id\
> PATCH /api/streams/:id\
> DELETE /api/streams/:id\
> POST /api/streams/:id/assign-teacher

**8.7 Workload Items**

> GET /api/workload\
> POST /api/workload/generate\
> GET /api/workload/:id\
> PATCH /api/workload/:id\
> POST /api/workload/:id/assign\
> POST /api/workload/:id/reassign\
> POST /api/workload/:id/unassign

**8.8 Monitoring**

> GET /api/monitoring/unassigned\
> GET /api/monitoring/invalid\
> GET /api/monitoring/degree-mismatch\
> GET /api/monitoring/summary-mismatch

**8.9 Import / Export**

> POST /api/import/workload-excel\
> GET /api/export/teacher/:id/excel\
> GET /api/export/statistics/excel\
> GET /api/export/department/excel\
> GET /api/export/semester/:term/excel

**8.10 Statistics & Reports**

> GET /api/statistics/department\
> GET /api/statistics/teachers\
> GET /api/statistics/teacher/:id\
> GET /api/reports/annual-summary\
> GET /api/reports/semester-summary

**8.11 Audit Logs**

> GET /api/audit-logs\
> GET /api/assignment-logs

**9. UI/UX Requirements**

**9.1 Design**

-   Professional admin dashboard style

-   Minimal, clean, data-centric UI

-   Status indicators using color coding

-   Priority focus on tables, filters, and data density

-   High performance --- minimum clicks to accomplish tasks

**9.2 Responsiveness**

-   Desktop-first design

-   Optimized for laptops and large monitors

-   Tablet responsive

-   Mobile: minimal read-only support only

**9.3 Accessibility**

-   WCAG-compliant color contrast

-   Full keyboard navigation

-   Clear form validation messages

-   Icon + text combination (never icon-only)

-   Status not indicated by color alone

**9.4 Table UX**

-   Sticky header

-   Filter panel

-   Search input

-   Sortable columns

-   Pagination

-   CSV / Excel export button

-   Row status badge

**9.5 Status Color Codes**

  ----------------------- -----------------------------------------------
  **Status**              **Color**

  Assigned                Green

  Unassigned              Red

  Invalid                 Dark red / Warning

  Draft                   Gray

  Ready                   Blue
  ----------------------- -----------------------------------------------

**9.6 View Modes**

-   Flat table view

-   Grouped by teacher

-   Grouped by semester

-   Grouped by category (auditorium / non-auditorium)

-   Grouped by lecture stream

**10. Security Requirements**

**10.1 Authentication**

-   Protected routes require login

-   Passwords stored as bcrypt hashes

-   Refresh token support

-   Session invalidated on logout

**10.2 Authorization**

-   Role-based access control (RBAC)

-   Admin-only routes strictly protected

-   Teachers can only access their own workload data

-   Public pages must not expose sensitive data

**10.3 Data Integrity**

-   Transaction-level integrity for all assignment operations

-   Duplicate assignment prevention enforced at DB level

-   Scientific degree restriction enforced before assignment

-   Language-stream validation enforced before stream creation

-   Single-owner policy enforced at both API and DB levels

**10.4 Input Validation**

-   Backend validation is mandatory for all endpoints

-   Frontend validation is supplementary

-   DTO / schema-based validation (Zod on frontend, class-validator on
    backend)

-   Imported Excel files validated before processing

**10.5 Logging & Auditing**

-   Every critical change is logged (create, update, delete, assign,
    reassign, unassign)

-   Performed-by user and timestamp stored for every log entry

-   Old value and new value stored per change

**10.6 Security Best Practices**

-   Rate limiting on all API routes

-   CORS properly configured

-   Helmet middleware (HTTP security headers)

-   Environment secrets never committed to git

-   HTTPS only in production

-   Regular database backup policy

**11. Non-Functional Requirements**

-   System must handle 100+ teachers, 1000+ workload items, and
    multi-semester data without performance degradation

-   Core pages must load within 2--3 seconds

-   Import process must display progress and validation errors in real
    time

-   No data loss on server restart

-   Codebase must be modular and easily extensible

-   Swagger/OpenAPI documentation required for all endpoints

**12. Development Roadmap**

**Phase 1 --- Discovery & System Design**

-   Finalize and confirm all business rules

-   Design database schema (PostgreSQL + Prisma)

-   Define API contracts

-   Create UI wireframes

-   Define Excel template mapping for import

**Phase 2 --- MVP**

-   Authentication (login, logout, JWT, role-based routing)

-   Teachers CRUD

-   Groups / directions / subject offerings CRUD

-   Formula CRUD

-   Workload item creation

-   Assignment module (assign, reassign, unassign)

-   Teacher dashboard (annual + semester breakdown)

-   Monitoring: unassigned items + degree mismatch

-   Basic Excel export

**Phase 3 --- Academic Stream Logic**

-   Lecture stream planning module

-   Multi-group lecture merge logic

-   Language restriction validation

-   Dynamic control hours preview

-   Practice-to-stream linkage

**Phase 4 --- Reporting & Analytics**

-   Advanced statistics (overload / underload indicators)

-   Semester and annual report generation

-   Audit log UI

-   Filter-rich monitoring dashboard

**Phase 5 --- Production Readiness**

-   Performance optimization

-   Security hardening

-   Backup & restore setup

-   Admin settings module

-   CI/CD pipeline (GitHub Actions)

-   Production deployment

**Phase 6 --- Extended Ecosystem**

-   Student limited access

-   Public statistics page

-   Notifications system

-   Approval workflow for workload plans

-   Versioning of workload plans

**13. GitHub & Deployment Strategy**

**13.1 Repository Structure**

Recommended: Monorepo (frontend-backend contract is tightly coupled)

> academic-workload/\
> ├── apps/\
> │ ├── frontend/\
> │ └── backend/\
> ├── packages/\
> │ └── shared/\
> ├── docs/\
> └── .github/workflows/

**13.2 Branch Strategy**

-   main --- production

-   develop --- integration branch

-   feature/\* --- new features

-   fix/\* --- bug fixes

-   release/\* --- release preparation

**13.3 Pull Request Rules**

-   Each feature in its own PR

-   Code review required before merge

-   Lint and tests must pass

-   Commit messages follow Conventional Commits standard

**13.4 CI/CD**

**Frontend pipeline:**

-   Lint → type check → build → preview deploy

**Backend pipeline:**

-   Lint → unit tests → build → Swagger generation → deploy

**13.5 Deployment Environments**

-   local --- developer machines

-   staging --- pre-production testing

-   production --- live system

**14. Acceptance Criteria**

The system is considered accepted when all of the following conditions
are met:

17. Admin can create and edit teachers.

18. Directions, groups, semesters, and subject offerings can be entered.

19. Formulas can be entered by admin and re-edited at any time.

20. Lecture streams are correctly formed with language-based
    restrictions.

21. Lecture and practical items can be assigned to separate teachers.

22. A practical item cannot be split across multiple teachers.

23. MD / NDP / NS items are blocked from being assigned to teachers
    without a scientific degree.

24. Unassigned items are visible in the monitoring panel.

25. Each teacher\'s individual annual workload is correctly calculated.

26. The department total workload matches the sum of all teacher
    workloads.

27. Core reports are successfully exported to Excel.

**15. Development Priority**

**MVP --- Mandatory**

  ----------------------------------- -----------------------------------
  **Feature**                         **Description**

  Authentication                      Login, logout, JWT, role-based
                                      routing

  Teachers CRUD                       Create, edit, deactivate teachers

  Academic structure                  Groups, directions, subject
                                      offerings

  Formula management                  Create, edit, activate/deactivate
                                      formulas

  Workload item creation              All workload types with
                                      auto-categorization

  Assignment module                   Assign, reassign, unassign with
                                      validation

  Monitoring                          Unassigned + degree mismatch
                                      detection

  Teacher stats dashboard             Annual and semester workload
                                      breakdown

  Excel export (basic)                Teacher load and department summary
  ----------------------------------- -----------------------------------

**Next Iterations**

-   Lecture stream planning

-   Advanced monitoring and mismatch detection

-   Audit log UI

-   Approval workflow

-   Student and guest access

**16. Closing Notes**

This system is not a simple timetable website. It is an academic
workload governance platform for a university department. The core
pillars of the system are:

-   Formula-driven automatic calculation

-   Controlled single-owner assignment with full validation

-   Stream-based lecture planning with language restrictions

-   Role-based data visibility and access control

-   Department total integrity enforcement

-   Export-ready reporting for official use

This technical specification is intended to be used directly by: Claude
AI, frontend and backend developers, UI/UX designer, and project manager
as the authoritative project document.
