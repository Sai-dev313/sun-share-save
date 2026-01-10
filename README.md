# ☀️ SunShareSave - Solar Energy Credit Trading Platform

A fintech platform that empowers solar panel owners to earn and trade energy credits, while helping consumers save money on electricity bills through peer-to-peer energy credit marketplace.

![Status](https://img.shields.io/badge/status-active-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Built with](https://img.shields.io/badge/built%20with-React%2BVite-61DAFB)

---

## 🎯 Overview

**SunShareSave** is a digital platform that bridges solar panel owners and electricity consumers through a credit-based energy trading system. It eliminates the need for physical electricity routing and instead focuses on **trading the value of clean energy through credits**.

### Why SunShareSave?
- ✅ **Environmental Impact**: Promotes renewable energy adoption
- ✅ **Cost Savings**: Consumers save up to 50% on electricity bills
- ✅ **Revenue Generation**: Solar owners monetize excess energy
- ✅ **Simple & Transparent**: No complex calculations or hidden fees
- ✅ **Marketplace Driven**: Fair pricing through supply and demand

---

## 🚀 Features

### For Solar Panel Owners (Producers)
- 📊 Dashboard showing daily energy generation, consumption, and export
- 💰 Automatic credit earning (1 unit = 1 credit)
- 📋 Wallet management (credits & cash)
- 🛒 List credits on marketplace at custom prices
- 💵 Convert credits to cash through sales

### For Electricity Consumers
- 💳 Easy credit purchasing from marketplace
- 💡 Use credits to reduce monthly electricity bills (1 credit = ₹2 savings)
- 👛 Credit wallet with balance tracking
- 📊 Dashboard showing savings and credit usage
- 💸 Optional: Earn credits by selling them to other consumers

### Marketplace
- 📌 Real-time credit listings
- 🤝 Peer-to-peer trading
- 📈 Market price discovery
- ✨ Transparent transactions
- 🔒 Secure buy/sell process

### User Management
- 🔐 Secure signup and login (email + password)
- 👤 Role selection (Producer / Consumer)
- 📝 Profile management
- 🔑 Password change functionality
- 🚪 Session management

---

## 💡 How It Works

### Energy Credit Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                   SOLAR PANEL OWNER (PRODUCER)              │
├─────────────────────────────────────────────────────────────┤
│  Solar Panels Generate 200 units today                       │
│  ├─ 120 units used at home                                   │
│  └─ 80 units sent to grid → 80 Credits earned               │
│     (Listed at ₹0.85 per credit on marketplace)             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    MARKETPLACE                               │
├─────────────────────────────────────────────────────────────┤
│  Listing: 80 Credits for ₹68 (₹0.85 each)                   │
│  Status: Waiting for buyer                                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  ELECTRICITY CONSUMER                        │
├─────────────────────────────────────────────────────────────┤
│  Buys 80 credits for ₹68                                     │
│  Uses 50 credits → Saves ₹100 on electricity bill           │
│  Remaining: 30 credits (keeps for future use)               │
└─────────────────────────────────────────────────────────────┘
```

### Pricing Example
- **Solar Energy Market Price**: ₹0.85 - ₹1.00 per unit
- **Normal Electricity Price**: ₹2.00+ per unit (varies by region)
- **Savings**: Consumers save 50% when using solar credits

---

## 🛠️ Technology Stack

### Frontend
- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling
- **shadcn-ui** - Component library

### Backend & Database
- **Supabase** - PostgreSQL database & authentication
- **Real-time Sync** - Live marketplace updates

### Development
- **npm** - Package manager
- **ESLint** - Code quality
- **PostCSS** - CSS processing

---

## 📋 Project Structure

```
sun-share-save/
├── src/
│   ├── components/          # Reusable React components
│   ├── pages/               # Page components
│   ├── styles/              # Global styles
│   ├── App.tsx              # Main app component
│   └── main.tsx             # Entry point
├── public/                  # Static assets
├── supabase/                # Database configuration & migrations
├── index.html               # HTML template
├── package.json             # Dependencies
├── vite.config.ts           # Vite configuration
├── tailwind.config.ts       # Tailwind configuration
└── README.md                # This file
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- Supabase account (for database)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Sai-dev313/sun-share-save.git
cd sun-share-save
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Start development server**
```bash
npm run dev
```

5. **Open in browser**
Navigate to `http://localhost:5173`

---

## 📱 Available Pages

| Page | Route | Purpose |
|------|-------|---------|
| Login/Signup | `/` | User authentication |
| Producer Dashboard | `/dashboard` | View energy stats & earnings |
| Consumer Dashboard | `/consumer` | Manage credits & savings |
| Marketplace | `/marketplace` | Buy/sell energy credits |
| Profile | `/profile` | User settings & preferences |

---

## 🔐 Security Features

- ✅ Email + Password authentication
- ✅ Supabase secure authentication
- ✅ Role-based access control (Producer/Consumer)
- ✅ Session management
- ✅ Password hashing
- ✅ Protected routes & API endpoints

---

## 💾 Database Schema (Simplified)

### Users Table
```sql
- id (UUID, primary key)
- email (unique)
- password (hashed)
- full_name
- role (producer | consumer)
- created_at
```

### Wallets Table
```sql
- user_id (foreign key)
- credits (integer)
- cash (decimal)
```

### Marketplace Listings Table
```sql
- id (UUID)
- seller_id (foreign key)
- credits_amount (integer)
- price_per_credit (decimal)
- status (active | sold)
- created_at
```

### Energy Records Table
```sql
- user_id (foreign key)
- generated (integer)
- consumed (integer)
- exported (integer)
- date
```

---

## 🎨 Design Principles

The UI follows a clean, minimal fintech aesthetic:

- **Color Scheme**: Green (#6BCF8E) for positive actions, Blue (#9DB7F5) for neutral
- **Typography**: Large, readable numbers for financial data
- **Layout**: Card-based, mobile-first responsive design
- **UX**: Simple actions, clear call-to-buttons, no clutter

---

## 📊 Core Logic

### Credit Earning
```
1 unit of extra power generated = 1 energy credit
```

### Bill Savings
```
1 energy credit = ₹2 savings on electricity bill
```

### Marketplace Trading
```
Price = Set by seller per credit
Total Cost = Credits × Price Per Credit
```

---

## 🌱 Environmental Impact

Each credit represents real, measurable renewable energy:
- Reduces grid dependency on fossil fuels
- Incentivizes residential solar adoption
- Creates transparent energy trading
- Supports India's renewable energy goals

---

## 📈 Roadmap

- [ ] Mobile app (iOS/Android)
- [ ] Advanced analytics & reporting
- [ ] Credit history & statements
- [ ] Integration with real smart meters
- [ ] Multi-language support
- [ ] Credit trading API
- [ ] Carbon credit integration
- [ ] Government incentive tracking

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Keep components reusable
- Write clear commit messages
- Test before submitting PR

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👨‍💻 Author

**Sai Dev** - [@Sai-dev313](https://github.com/Sai-dev313)

---

## 📧 Support & Contact

- **Issues**: Report bugs via GitHub Issues
- **Email**: [your-email@example.com]
- **Documentation**: Check the `/docs` folder for detailed guides

---

## 🙏 Acknowledgments

- Built during hackathon for renewable energy innovation
- Inspired by carbon credit trading models
- Designed for Indian energy market context

---

## ⚠️ Disclaimer

- This is a **simulated platform** for demonstration purposes
- No real electricity is physically routed between users
- Credits represent the value of clean energy, not actual power
- For production use, integration with real smart meters is required
- Complies with local renewable energy regulations

---

## 📞 Quick Links

- **Live Demo**: [Coming Soon]
- **Documentation**: [View Docs](#)
- **Report Issues**: [GitHub Issues](https://github.com/Sai-dev313/sun-share-save/issues)
- **Feature Requests**: [GitHub Discussions](#)

---

<div align="center">

**Made with ☀️ for a sustainable future**

⭐ Star us on GitHub if you find this useful!

</div>
