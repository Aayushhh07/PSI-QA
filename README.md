# 🚀 PSI QA Testing Platform

<p align="center">
  <b>Enterprise-Grade Automated E2E Testing</b><br>
  <i>Multi-website automation, performance monitoring, and analytics — all in one platform.</i>
</p>

<p align="center">
  <a href="#-features">✨ Features</a> |
  <a href="#-quickstart">⚡ Quickstart</a> |
  <a href="#-architecture">🛠️ Architecture</a> |
  <a href="#-tech-stack">🧩 Tech Stack</a> |
  <a href="#-use-cases">🎯 Use Cases</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Backend-Express.js%20%2B%20TypeScript-blue" alt="Backend"/>
  <img src="https://img.shields.io/badge/Testing-Playwright-green" alt="Playwright"/>
  <img src="https://img.shields.io/badge/Frontend-React%2019-blueviolet" alt="React 19"/>
  <img src="https://img.shields.io/badge/Database-MongoDB-brightgreen" alt="MongoDB"/>
</p>

---

## 📑 Table of Contents
- [About](#-about)
- [Features](#-features)
- [Quickstart](#-quickstart)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Use Cases](#-use-cases)
- [Security & Config](#-security--config)
- [Contributing](#-contributing)
- [Author](#-author)
- [License](#-license)

---

## 🧐 About
**PSI QA Testing Platform** is a centralized, production-ready automated testing solution built for quality assurance teams and developers.  
It supports **end-to-end (E2E)** testing for multiple web applications, integrates **Playwright** for cross-browser automation, and comes with a **React dashboard** for live monitoring, analytics, and detailed reports.

---

## ✨ Features

### 🔄 Core Testing Capabilities
- **Choice-AI E2E**: Full user journey (login → dashboard → filters → content validation)
- **Opticall E2E**: Business flow testing with chart interaction & call record playback
- **Generic Website Testing**: Multi-website support, screenshot/video capture, performance metrics

### 🛠 Automation & Scheduling
- Daily **Node-cron** jobs at configurable times
- Sequential execution to avoid resource contention

### 📊 Frontend Dashboard
- Real-time execution status
- Detailed test reports with screenshots & videos
- Performance analytics (load time, FCP, DOM load)
- Error tracking and debugging

### 🔐 Security & Reliability
- Environment-based credentials
- **Helmet.js** security headers & **CORS** protection
- Input validation with Joi

---

## ⚡ Quickstart

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/PanScienceInnovation/Testing-App.git
cd Testing-App
```

### 2️⃣ Backend Setup
```bash
cd Testing-App
npm install
```
Create a .env file:
```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Logging Configuration
LOG_LEVEL=info
LOG_FILE_PATH=./logs

# Database Configuration (if needed later)
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=testing_app

# MONGODB_URI=mongodb://localhost:27017/qa_testing
MONGODB_URI=mongodb+srv://vishwakarmaaayush22:3yRzHeFGcVwkf0vM@cluster0.qesey.mongodb.net/qa_testing

ENABLE_DAILY_CRON=true
DAILY_CRON="0 3 * * *"
CRON_TZ=Asia/Kolkata

# Playwright Configuration
# For development with visible Chrome browser:
PLAYWRIGHT_BROWSER=Chrome
PLAYWRIGHT_HEADLESS=false
# For production with headless browser:
# PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_TIMEOUT=30000

# Testing Configuration
TEST_RESULTS_PATH=./test-results
SCREENSHOT_PATH=./screenshots
VIDEO_PATH=./videos 

# Choice-AI Website Credentials
CHOICE_UID=admin
CHOICE_PASS=Y4h0R@NKL1$aH3&

# Opticall Website Credentials
OPTICALL_EMAIL=ce@opticall.io
OPTICALL_PASSWORD="DishD2h#6"
```
Run the backend:
```bash
npm run dev
```

### 3️⃣ Frontend Setup
```bash
cd frontend
npm install
npm run dev
```


## 🛠 Architecture
```mermaid
flowchart TD
  subgraph Frontend[Frontend - React 19]
    D[Dashboard]
    A[Analytics]
    T[Test Details]
  end

  subgraph Backend[Backend - Express.js]


    P[Playwright Service]
    C[Choice-AI Service]
    O[Opticall Service]
    G[Generic Testing Service]
    DB[(MongoDB)]
  end

  D <-- Axios/REST --> Backend
  A <-- Axios/REST --> Backend
  T <-- Axios/REST --> Backend

  P --> DB
  C --> DB
  O --> DB
  G --> DB


```

## 🧩 Tech Stack  

### **Backend**  
- **Express.js** (TypeScript)  
- **Playwright** (browser automation)  
- **MongoDB** + **Mongoose**  
- **Winston** (logging)  
- **Node-cron** (scheduling)  
- **Helmet.js**, **CORS**, **Joi** (security)  

### **Frontend**  
- **React 19** (TypeScript)  
- **Vite** (build tool)  
- **Tailwind CSS** (styling)  
- **Zustand** (state management)  
- **React Router DOM**  
- **Recharts** (charts & analytics)  
- **Axios** (API calls)  

---

## 🎯 Use Cases  
- **QA Teams**: Automated regression & visual testing  
- **Dev Teams**: CI/CD integration for pre-deployment validation  
- **Business Stakeholders**: Real-time monitoring of critical user flows  

---

## 🔐 Security & Config  
- Environment variables for sensitive configs  
- Input validation & sanitization  
- Helmet.js security headers  
- Configurable cron jobs & timezones  

---

## 🤝 Contributing  

We welcome contributions!  

1. Fork the repo  
2. Create a feature branch:  
   ```bash
   git checkout -b feature/YourFeature
   ```
3. Commit & push your changes
4. Open a Pull Request

---

## 👨‍💻 Author

**Aayush Vishwakarma**
- 📍 India
- [LinkedIn](https://www.linkedin.com/in/aayush-vishwakarma-68a8a92a1)
- [GitHub](https://github.com/Aayushhh07)
- 📬 aayushvishwakarma93@gmail.com

---

## 📜 License  
This project is licensed under the **MIT License** – feel free to use and modify.  

---





