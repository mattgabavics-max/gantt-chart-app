# Quick Start Guide

**Get up and running in 5 minutes!** ⚡

---

## Prerequisites

Make sure you have installed:
- ✅ **Node.js 18+** - [Download here](https://nodejs.org/)
- ✅ **PostgreSQL 14+** - [Download here](https://www.postgresql.org/download/)

---

## 🚀 Two-Step Launch

### **Step 1: One-Time Setup** (first time only)

**Windows:**
```bash
setup.bat
```

**Mac/Linux:**
```bash
chmod +x setup.sh
./setup.sh
```

This will:
- Install dependencies
- Create environment files
- Setup the database
- Run migrations

You'll be prompted to enter your PostgreSQL credentials.

---

### **Step 2: Start the App**

**Windows:**
```bash
start.bat
```

**Mac/Linux:**
```bash
./start.sh
```

**Or use npm:**
```bash
npm run dev
```

---

## 🎉 That's It!

Open your browser: **http://localhost:3000**

---

## ⚙️ Manual Setup (if scripts don't work)

<details>
<summary>Click to expand manual instructions</summary>

### 1. Install dependencies
```bash
npm install
```

### 2. Create environment files
```bash
# Copy example files
cp client/.env.example client/.env
cp server/.env.example server/.env
```

### 3. Configure database
Edit `server/.env` and update:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/gantt_chart_db"
```

### 4. Create database
```bash
createdb gantt_chart_db
```

Or via psql:
```sql
psql -U postgres
CREATE DATABASE gantt_chart_db;
\q
```

### 5. Run migrations
```bash
npm run prisma:generate
npm run prisma:migrate dev
```

### 6. Start the app
```bash
npm run dev
```

</details>

---

## 🆘 Troubleshooting

### "Database connection error"
- Make sure PostgreSQL is running
- Check your credentials in `server/.env`
- Verify database exists: `psql -l | grep gantt_chart_db`

### "Port already in use"
- Close other apps using port 3000 or 5000
- Or change ports in `.env` files

### "Command not found"
- Make sure Node.js and PostgreSQL are in your PATH
- Restart your terminal after installation

---

## 📚 Next Steps

1. **Register an account** at http://localhost:3000
2. **Create your first project**
3. **Add tasks** and start planning!

For detailed documentation, see:
- 📖 [User Manual](USER_MANUAL.md)
- 🔌 [API Reference](API_REFERENCE.md)
- 👨‍💻 [Technical Docs](TECHNICAL_DESIGN_DOCUMENT.md)

---

**Need help?** Check [USER_MANUAL.md](USER_MANUAL.md) or create an issue on GitHub.
