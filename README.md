# ThinkSharp Impact Tool

A modern Volunteer & Internship Management System developed for **ThinkSharp Foundation**.

---

## Overview

ThinkSharp Impact Tool is a centralized platform that manages the complete volunteer and internship lifecycle.

The system allows:

- Public volunteer applications
- Internship applications
- Administrative approval workflow
- Volunteer activity logging
- Internship work tracking
- Organization analytics
- Impact reporting
- Record management

---

# Features

## Public Portal

- Volunteer / Internship Application Form
- QR Code Access
- Resume Upload
- Emergency Contact Information
- Declaration & Consent
- Responsive Design

---

## Authentication

- Secure Login
- Role-based Access
- Admin
- Volunteer
- Intern

---

## Volunteer Module

- Submit Activity Reports
- Track Volunteer Hours
- Beneficiaries Impacted
- Trees Planted
- View Personal Dashboard

---

## Internship Module

- Internship Activity Logging
- Deliverables Tracking
- Internship Duration
- Internship Dashboard
- Personal Statistics

---

## Admin Module

- Organization Dashboard
- Analytics
- Application Review
- Approve / Reject Applicants
- Records Management
- Search & Filters
- Export to Excel
- Export to PDF

---

## Analytics Dashboard

Displays:

- Total Volunteer Hours
- Total Internship Hours
- Total Activities
- Total Projects
- Beneficiaries Impacted
- Trees Planted
- Volunteer Distribution
- Internship Distribution

---

## Records

- Search
- Filters
- Repeat Previous Activity
- Export
- Sorting
- Complete Activity History

---

## Role Based Permissions

### Administrator

Access to:

- Dashboard
- Applications
- Records
- Analytics

Can

- Approve Applications
- Reject Applications
- Review Reports

---

### Volunteer

Access to:

- Personal Dashboard
- Submit Activity
- Personal Statistics

Cannot access

- Records
- Applications
- Admin Dashboard

---

### Intern

Access to:

- Personal Dashboard
- Internship Reports
- Personal Statistics

Cannot access

- Administrative Features

---

# Technology Stack

Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

Backend

- Supabase

Database

- PostgreSQL

Authentication

- Supabase Auth

Storage

- Supabase Storage

Charts

- Recharts

Deployment

- Vercel

---

# Folder Structure

```text
app/
components/
hooks/
lib/
public/
styles/
supabase/
types/
```

---

# Database Modules

Main Tables

- activities
- applications
- members
- profiles

Authentication

- auth.users

Storage

- application-resumes

---

# Application Workflow

```
Homepage

│

├── Login

│       │

│       ▼

│   Existing Members

│

└── Apply as Volunteer / Intern

        │

        ▼

Public Application

        │

        ▼

Pending

        │

        ▼

Admin Review

        │

 ┌──────┴───────┐

 │              │

Reject      Approve

                │

                ▼

Member Created

                │

                ▼

Login

                │

                ▼

Dashboard

                │

                ▼

Activity Reporting

                │

                ▼

Organization Analytics
```

---

# Installation

Clone repository

```bash
git clone <repository-url>
```

Install dependencies

```bash
npm install
```

Run development server

```bash
npm run dev
```

Build production

```bash
npm run build
```

Start production

```bash
npm start
```

---

# Environment Variables

Create

```
.env.local
```

Add

```env
NEXT_PUBLIC_SUPABASE_URL=

NEXT_PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=
```

---

# Main Features

✔ Public Registration

✔ QR Based Registration

✔ Resume Upload

✔ Role Based Authentication

✔ Volunteer Dashboard

✔ Internship Dashboard

✔ Admin Dashboard

✔ Activity Reporting

✔ Analytics

✔ Records Management

✔ Excel Export

✔ PDF Export

✔ Responsive UI

---

# Future Enhancements

- Email Notifications
- Certificate Generation
- Alumni Portal
- Recommendation Letters
- Attendance Tracking
- Mobile Application
- Push Notifications
- Calendar Integration

---

# Developed For

**ThinkSharp Foundation**

Volunteer & Internship Impact Management Platform

---

# License

This project was developed exclusively for ThinkSharp Foundation.

All rights reserved.
