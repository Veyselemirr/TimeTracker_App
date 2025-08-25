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

### DevOps & Tools
- **Vercel** - Deployment platform
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 📸 Screenshots

### Dashboard
*Interactive dashboard with real-time analytics and beautiful charts*

### Timer Interface  
*Clean, intuitive timer with category selection and live updates*

### Achievements
*Comprehensive achievement system with rarity levels and progress tracking*

### Leaderboard
*Competitive rankings with podium display and user statistics*

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Veyselemirr/TimeTracker_App.git
   cd TimeTracker_App
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your `.env.local`:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/timetracker"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Database Setup**
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Run Development Server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Maintain test coverage
- Use conventional commit messages
- Update documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Veysel Emir Yurtseven**
- GitHub: [@Veyselemirr](https://github.com/Veyselemirr)
- LinkedIn: [Veysel Emir Yurtseven](https://linkedin.com/in/veyselemirr)

## 🙏 Acknowledgments

- **Radix UI** for accessible components
- **Tailwind CSS** for utility-first styling  
- **Vercel** for seamless deployment
- **Prisma** for type-safe database access

## 🔮 Roadmap

- [ ] **Team Workspaces** - Collaborative time tracking
- [ ] **Advanced Analytics** - Weekly/monthly reports
- [ ] **Mobile App** - React Native implementation
- [ ] **Integrations** - Calendar sync, Slack notifications
- [ ] **Time Blocking** - Schedule planning features
- [ ] **Export Features** - CSV, PDF reports

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

[Report Bug](https://github.com/Veyselemirr/TimeTracker_App/issues) • [Request Feature](https://github.com/Veyselemirr/TimeTracker_App/issues) • [Documentation](https://github.com/Veyselemirr/TimeTracker_App/wiki)

</div>
