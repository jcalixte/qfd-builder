# QFD Builder

A professional Quality Function Deployment (QFD) web application for creating House of Quality matrices. Built with React, TypeScript, Tailwind CSS, and Supabase.

![QFD Builder](https://img.shields.io/badge/QFD-Builder-blue)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green)

## 🌟 Features

- **Customer Requirements Management** - Define and prioritize customer needs
- **Technical Requirements Specification** - Set measurable technical targets
- **Relationship Matrix** - Map customer needs to technical specifications
- **Technical Correlations** - Identify synergies and trade-offs
- **Priority Analysis** - Calculate weighted priorities and strategic recommendations
- **Target Impact Analysis** - Comprehensive analysis combining priorities, difficulty, and correlations
- **Multi-Project Support** - Manage multiple QFD projects
- **Real-time Collaboration** - Cloud-based data storage with Supabase
- **Export/Import** - JSON data export for backup and sharing

## 🚀 Live Demo

**Production:** [https://qfd.netlify.app](https://qfd.netlify.app)

## 🛠️ Technology Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Authentication, Real-time)
- **Icons:** Lucide React
- **Build Tool:** Vite
- **Deployment:** Netlify
- **Database:** PostgreSQL with Row Level Security

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jcalixte/qfd-builder.git
   cd qfd-builder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase database**
   - Create a new Supabase project
   - Run the migration file: `supabase/migrations/20250629120854_fierce_cloud.sql`
   - Or use the Supabase CLI: `supabase db push`

5. **Start development server**
   ```bash
   npm run dev
   ```

## 🗄️ Database Schema

The application uses a comprehensive PostgreSQL schema with:

- **qfd_projects** - Project management
- **customer_requirements** - Customer needs and importance ratings
- **technical_requirements** - Technical specifications and targets
- **relationships** - Customer-to-technical requirement mappings
- **technical_correlations** - Technical requirement interactions
- **project_settings** - Project configuration (competitor names, etc.)

All tables include Row Level Security (RLS) for multi-tenant data isolation.

## 🎯 QFD Methodology

This application implements the traditional House of Quality methodology:

1. **Voice of Customer** - Capture customer requirements with importance ratings
2. **Technical Requirements** - Define measurable technical specifications
3. **Relationship Matrix** - Map customer needs to technical solutions
4. **Technical Correlations** - Identify positive/negative interactions
5. **Priority Calculation** - Weight technical requirements by customer importance
6. **Target Analysis** - Strategic recommendations based on priority vs. difficulty

## 🔐 Authentication

- Email/password authentication via Supabase Auth
- Secure user sessions with automatic token refresh
- Row Level Security ensures users only access their own data

## 📊 Analysis Features

### Priority Analysis
- Weighted priority calculation based on relationship strength
- Relative importance ranking
- Visual priority charts

### Target Impact Analysis
- Implementation challenge assessment
- Strategic importance classification
- Correlation impact summary
- Actionable recommendations

### Correlation Analysis
- Synergy identification
- Trade-off detection
- Strategic bundling recommendations

## 🚀 Deployment

### Netlify (Recommended)
1. Connect your GitHub repository to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
```bash
npm run build
# Deploy the `dist` folder to your hosting provider
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the Toyota Production System and Quality Function Deployment methodology
- Built with modern web technologies for optimal user experience
- Designed for production use in engineering and product development teams

## 📞 Support

For support, email [your-email] or create an issue in this repository.

---

**Built with ❤️ by [jcalixte](https://github.com/jcalixte)**