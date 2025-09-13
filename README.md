# ⏰ TimeTracker Pro

> **Modern time tracking application with gamification elements, real-time analytics, and competitive features.**

[![Next.js](https://img.shields.io/badge/Next.js-15.4-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.14-2D3748?logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

## 🚀 Features

### ⏱️ **Real-Time Timer**
- Start, pause, resume, and stop timers
- Category-based time tracking
- Persistent timer state (survives page reloads)
- Real-time updates with smooth animations

### 🏆 **Achievement System**
- 25+ unique achievements across 6 categories
- Rarity system: Common, Rare, Epic, Legendary
- Real-time achievement unlocking
- Points and badge collection

### 📊 **Comprehensive Analytics**
- Daily, weekly, and monthly statistics
- Interactive charts (Bar charts, Pie charts)
- Category-wise time breakdown
- Goal progress tracking
- Streak monitoring

### 🏅 **Competitive Leaderboards**
- Daily and weekly rankings
- Real-time user statistics
- Podium display for top 3 users
- Personal rank tracking

### 📅 **Smart Calendar**
- Visual month view with intensity heatmap
- Session details and achievements per day
- Goal completion indicators
- Streak visualization

### 🎯 **Goal Management**
- Daily, weekly, and monthly goals
- Category-specific targets
- Progress visualization
- Achievement rewards

## 🛠️ Tech Stack

### Frontend
- **Next.js 15.4** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS 4.0** - Modern styling
- **Radix UI** - Accessible component library
- **Recharts** - Interactive data visualization
- **Zustand** - State management

### Backend
- **Next.js API Routes** - Server-side API
- **Prisma** - Type-safe ORM
- **PostgreSQL** - Primary database
- **NextAuth.js 5.0** - Authentication system
- **bcryptjs** - Password security


## 📝 Database Schema

### Core Entities
- **Users** - Authentication and profile data
- **Categories** - Work categories (Programming, Study, etc.)
- **TimeEntries** - Individual work sessions
- **Goals** - User-defined targets
- **Achievements** - Unlockable badges
- **UserAchievements** - User progress tracking

## 🎮 Achievement Categories

| Category | Description | Examples |
|----------|-------------|----------|
| 🔥 **Streak** | Consecutive days | 3, 7, 30, 100 days |
| ⏰ **Time** | Daily work duration | 30min, 1hr, 3hr, 8hr |
| 🎯 **Goal** | Target completion | 1, 5, 10, 25 goals |
| ⚡ **Performance** | Work patterns | Early bird, Night owl |
| 📈 **Total** | Cumulative stats | 10hr, 100hr, 500hr |
| 📚 **Category** | Subject mastery | Expert, Master, Versatile |

## 🔐 Security Features

- **Secure Authentication** - NextAuth.js with multiple providers
- **Password Hashing** - bcrypt encryption
- **Session Management** - JWT-based sessions
- **API Protection** - Route-level authentication
- **Type Safety** - Full TypeScript coverage

## 📱 Responsive Design

- **Mobile-First** approach
- **Progressive Web App** capabilities
- **Touch-Friendly** interface
- **Cross-Platform** compatibility
