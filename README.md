# 🌟 FlexiPal

> Connecting USFCA students with campus vendors in real-time — making food vending flexible and accessible.

<div align="center">

[![Built with React](https://img.shields.io/badge/Built_with-React-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Powered by Supabase](https://img.shields.io/badge/Powered_by-Supabase-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Styled with Tailwind](https://img.shields.io/badge/Styled_with-Tailwind-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=flat-square&logo=vercel)](https://vercel.com/)

</div>

## 🚀 Quick Links

- 🌐 [Live Demo](https://flexipal.app)
- 🎨 [Design System](https://ui.shadcn.com/)

## 📖 About

FlexiPal is a platform designed to help USFCA students share and utilize their flexi funds effectively. It provides a seamless way for students to connect with fellow Dons who have extra flexi funds, ensuring no student goes hungry while preventing fund wastage.

## ✨ Features

- 🔐 Secure USFCA email authentication
- 💬 Real-time chat system
- 🎨 Beautiful, responsive UI
- 📱 Mobile-first design
- 🔄 Real-time updates
- 🎯 Location-based vendor discovery

## 🛠️ Tech Stack

### Frontend
- **Framework:** React with TypeScript
- **Routing:** React Router v6
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Icons:** Lucide Icons
- **State Management:** React Query

### Backend & Infrastructure
- **Database & Auth:** Supabase
- **Real-time:** Supabase Realtime
- **File Storage:** Supabase Storage
- **Hosting:** Vercel
- **Type Safety:** TypeScript

## 🏗️ Project Structure

```
src/
├── components/        # Reusable UI components
├── hooks/            # Custom React hooks
├── integrations/     # Third-party service integrations
├── lib/             # Utility functions and constants
├── pages/           # Page components
└── App.tsx          # Root component
```

## 🚀 Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/flexipal.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## 🔑 Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🎨 Design System

We use shadcn/ui components with a custom theme matching USFCA's brand colors:
- Primary (USF Green): `#00543C`
- Secondary (USF Gold): `#FDBB30`
- Accents and gradients inspired by nature and sustainability

## 📈 Performance

- Lighthouse Score: 95+ on all metrics
- Core Web Vitals compliant
- Optimized for mobile devices
- Fast initial load times

## 🤝 Contributing

Contributions are welcome!

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- USFCA for supporting student initiatives

---

<div align="center">
Made with ❤️ by Luca Bianchini
</div>
