# 🏦 AI Loan Eligibility Checker & BFSI Intelligence Engine

An intelligent, full-stack financial technology application built with Python (Flask) and modern frontend interfaces. It provides instant loan eligibility evaluation, EMI calculations, credit score risk profiling, and AI-powered personalized financial roadmaps.

---

## ✨ Features

- **🎯 Instant Loan Eligibility Evaluation:**
  - Evaluates loan requests against institutional BFSI underwriting benchmarks.
  - Automatically calculates maximum eligible borrowing limits based on salary multiples.
  - Real-time instant status with transparent pass/fail criteria.

- **🧮 Interactive EMI Calculator:**
  - Dynamic monthly payment calculation using compound amortisation formulas.
  - Principal vs. Interest breakdown with real-time visual charts.

- **📊 Credit Score Risk Analyzer:**
  - Bureau score bracket analysis (Poor, Fair, Good, Excellent).
  - Debt-to-Income (DTI) and FOIR assessment with risk mitigations.

- **🤖 AI Financial Advisor:**
  - Dual AI support: Powered by Groq (LLaMA 3.3 70B) or Anthropic Claude (3.5 Sonnet).
  - Built-in deterministic BFSI rule engine fallback that operates offline without API keys.
  - Custom actionable recovery roadmaps for applicants currently below qualification thresholds.

- **📜 Application History & Auditing:**
  - Stores application logs and decisions locally (`records.json`).
  - Searchable and exportable audit trail.

- **📊 Google Sheets Live Sync:**
  - Out-of-the-box integration via Google Apps Script (`google_apps_script.js`) to append all submissions to your spreadsheet in real time.

---

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.8+
- Git

### 2. Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/<your-username>/loan-ai.git
   cd loan-ai
   ```

2. **Create and activate a virtual environment (optional but recommended):**
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   *(Edit `.env` if you wish to configure Groq or Anthropic API keys and Google Apps Script URL)*

5. **Run the application:**
   ```bash
   python app.py
   ```

6. **Open in browser:**
   Navigate to [http://localhost:5000](http://localhost:5000)

---

## 📂 Project Structure

```
loan-ai/
├── app.py                   # Core Flask backend & BFSI logic
├── requirements.txt         # Python package dependencies
├── .env.example             # Template configuration file
├── .gitignore               # Git ignored patterns
├── google_apps_script.js    # Google Sheets webhook script
├── test_app.py              # Automated test suite
├── records.json             # Local persistent evaluation store
├── templates/               # Jinja2 HTML templates
│   ├── index.html           # Main dashboard
│   ├── eligibility.html     # Loan eligibility checker
│   ├── emi-calculator.html  # EMI & amortisation calculator
│   ├── credit-analyzer.html # Credit bureau analyzer
│   ├── ai-advisor.html      # AI financial counseling interface
│   └── history.html         # Application history logs
└── static/
    ├── css/
    │   └── style.css        # Premium financial UI styling
    └── js/
        └── script.js        # Dynamic UI & API client logic
```

---

## 🧪 Testing

Run automated unit and integration tests:
```bash
pytest test_app.py
```

---

## 📄 License
MIT License. Feel free to use and adapt for personal or commercial projects.
