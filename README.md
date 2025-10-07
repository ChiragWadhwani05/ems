# Employee Management System

A modern web application for managing employees, teams, and tasks with role-based access control.

## Features

- **User Authentication** - JWT-based login/registration with role management
- **Team Management** - Create teams, assign members (many-to-many relationships)
- **Task Management** - Create, assign, and track tasks with priority levels
- **Role-Based Access** - Admin, Manager, and Employee permissions
- **Real-time Updates** - Dynamic UI with instant feedback

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: JWT with HTTP-only cookies

## Quick Start

1. **Clone and install**

   ```bash
   git clone <repo-url>
   cd ems
   npm install
   ```

2. **Environment setup**

   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/ems"
   JWT_SECRET="your-secret-key"
   ```

3. **Database setup**

   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## User Roles

- **Admin**: Full system access, user approval, user management
- **Employee**: View assigned tasks, update task status

- **Team Lead**: For specific teams, create/manage tasks, view team members

## API Routes

- `/api/auth/*` - Authentication (login, register, logout)
- `/api/users/*` - User management and profiles
- `/api/teams/*` - Team operations and member management
- `/api/tasks/*` - Task creation, assignment, and tracking

## Deployment

Deploy to Vercel with environment variables:

- `DATABASE_URL`
- `JWT_SECRET`

---

Built with Next.js and modern web technologies.
