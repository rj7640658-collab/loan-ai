# 🏦 AI Loan Eligibility Checker & BFSI Intelligence Engine

[![Python Version](https://img.shields.io/badge/python-3.8%2B-blue.svg)](https://www.python.org/)
[![Flask Framework](https://img.shields.io/badge/framework-Flask%203.0%2B-lightgrey.svg)](https://flask.palletsprojects.com/)
[![Tests Passing](https://img.shields.io/badge/pytest-13%20passed%20(100%25)-brightgreen.svg)](test_app.py)
[![AI Engine](https://img.shields.io/badge/AI-Groq%20LLaMA%203.3%20%7C%20Claude%203.5-orange.svg)](https://groq.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

An institutional-grade, full-stack financial technology application built with Python (Flask) and a modern glassmorphic interface. It delivers automated loan underwriting decisions, reducing-balance EMI calculations, credit score risk tiering, dual-provider generative AI financial advisory, and bidirectional cloud synchronization with Google Sheets.

---

## 📑 Comprehensive Project Report

### 1. Executive Summary & Problem Statement
In conventional Banking, Financial Services, and Insurance (BFSI) operations, retail loan evaluation faces recurring bottlenecks:
- **High Latency:** Manual credit underwriting takes days or weeks to evaluate basic eligibility metrics.
- **Opaque Disqualifications:** Applicants who fail criteria receive binary rejections without transparent rationale or actionable recovery pathways.
- **Fragmented Tools:** Consumers must bounce between siloed calculators, credit bureau checkers, and advisors.

**The Solution:**
The **AI Loan Eligibility Checker & BFSI Intelligence Engine** unifies real-time algorithmic underwriting, compound interest calculation, credit bureau risk modeling, and LLM-powered financial advisory into a single, cohesive, responsive platform.

---

### 2. System Architecture & Workflow

```
+-----------------------------------------------------------------------------------+
|                                 PRESENTATION LAYER                                |
|  - Modern Dark / Glassmorphic Responsive Web Interface (HTML5, Vanilla CSS & JS)  |
|  - Dashboards: Eligibility Checker | EMI Amortization | Credit Score | AI Advisor |
+------------------------------------------+----------------------------------------+
                                           | HTTP / REST (JSON)
                                           v
+-----------------------------------------------------------------------------------+
|                            APPLICATION & SERVICE LAYER                            |
|                            (Python 3.8+ / Flask 3.0+)                             |
|                                                                                   |
|  +--------------------+  +----------------------+  +---------------------------+  |
|  | Underwriting Engine|  | EMI Compound Engine  |  | Credit Risk Profiler      |  |
|  | - Salary Multiples |  | - Reducing Balance   |  | - CIBIL/Experian Tiers    |  |
|  | - FOIR / DTI Ratios|  | - Principal/Interest |  | - Percentile Calculations |  |
|  +--------------------+  +----------------------+  +---------------------------+  |
+------------------------------------------+----------------------------------------+
                                           |
                    +----------------------+----------------------+
                    |                                             |
                    v                                             v
+---------------------------------------+     +-------------------------------------+
|        INTELLIGENCE & AI LAYER        |     |     PERSISTENCE & AUDIT LAYER       |
|                                       |     |                                     |
|  +---------------------------------+  |     |  +-------------------------------+  |
|  | Primary: Groq LLaMA 3.3 70B     |  |     |  | Local JSON Audit Store        |  |
|  | Fallback: Claude 3.5 Sonnet     |  |     |  | (records.json, 200 items FIFO)|  |
|  | Offline: BFSI Heuristic Engine  |  |     |  +-------------------------------+  |
|  +---------------------------------+  |     |  +-------------------------------+  |
|                                       |     |  | Google Apps Script Webhook    |  |
|                                       |     |  | (Real-time Google Sheet Sync) |  |
+---------------------------------------+     +-------------------------------------+
```

---

### 3. Core Business Logic & Mathematical Models

#### A. Institutional Loan Underwriting Logic
Each application is rigorously checked against four underwriting criteria:
1. **Net Monthly Salary:** Must be strictly greater than ₹30,000.
2. **Credit Bureau Score:** Must be strictly greater than 700.
3. **Existing Monthly Obligations (EMI):** Must be strictly below ₹20,000.
4. **Applicant Age:** Must be at least 21 years of age.

If all criteria pass:
$$\text{Eligible Loan Amount} = \text{Monthly Salary} \times 20$$

If any criterion fails, the sanctioned limit is ₹0 and specific rejection reasons are reported.

**Fixed Obligation to Income Ratio (FOIR):**
$$\text{FOIR (\%)} = \left(\frac{\text{Existing EMI}}{\text{Monthly Salary}}\right) \times 100$$

**Maximum Disposable Repayment Capacity:**
$$\text{Permissible New EMI} = \max\left(0, (\text{Monthly Salary} \times 0.50) - \text{Existing EMI}\right)$$

#### B. Reducing-Balance EMI & Compound Amortization Model
The platform implements standard banking compound amortization:

$$\text{EMI} = \frac{P \times R \times (1 + R)^N}{(1 + R)^N - 1}$$

Where:
- $P$ = Principal Loan Amount
- $R$ = Monthly Interest Rate $\left(\frac{\text{Annual Rate}}{12 \times 100}\right)$
- $N$ = Loan Tenure in Months

Dynamic month-by-month calculation:
$$\text{Interest}_t = \text{Balance}_{t-1} \times R$$
$$\text{Principal}_t = \text{EMI} - \text{Interest}_t$$
$$\text{Balance}_t = \max(0, \text{Balance}_{t-1} - \text{Principal}_t)$$

#### C. Credit Score Risk Categorization
- **Tier 1 Prime (750 - 900):** ~95% approval likelihood, lowest APR tier (8.25% - 10.50%).
- **Tier 2 Standard (650 - 749):** ~70% approval likelihood, standard market rates (10.50% - 14.00%).
- **Tier 3 Subprime (300 - 649):** <30% approval likelihood, requiring debt consolidation or secured collateral.

---

### 4. Dual AI Reasoning & Offline Heuristic Fallback
The platform supports multi-tiered AI financial intelligence:
1. **Groq Cloud API (`llama-3.3-70b-versatile`):** Sub-second response generation for rapid interactive evaluations.
2. **Anthropic Claude API (`claude-3-5-sonnet-20241022`):** Nuanced financial planning and high-context risk assessment.
3. **Deterministic Heuristic Engine:** An offline rule engine that synthesizes customized recovery plans for non-compliant borrowers and repayment optimization plans for approved applicants without requiring external API keys.

---

### 5. Quality Assurance & Test Verification
The project maintains a 100% automated test coverage pass rate via `pytest`:
- **13 Test Cases Executed:**
  - `test_evaluate_loan_eligibility_approved` ✅
  - `test_evaluate_loan_eligibility_low_salary` ✅
  - `test_evaluate_loan_eligibility_low_credit_score` ✅
  - `test_evaluate_loan_eligibility_high_emi` ✅
  - `test_evaluate_loan_eligibility_underage` ✅
  - `test_calculate_reducing_balance_emi` ✅
  - `test_calculate_reducing_balance_emi_zero_inputs` ✅
  - `test_analyze_credit_score_tiers` ✅
  - `test_generate_ai_financial_reasoning_fallback` ✅
  - `test_api_check_eligibility_success` ✅
  - `test_api_calculate_emi_success` ✅
  - `test_api_analyze_credit_success` ✅
  - `test_api_ai_advisor_fallback` ✅

---

## ✨ Key Features

- **🎯 Instant Loan Eligibility Evaluation:** Instant sanction calculation ($20\times\text{salary}$), FOIR calculation, and transparent reason tracking.
- **🧮 Interactive EMI Calculator:** Amortization tables, real-time interest/principal breakdowns, and repayment graphs.
- **📊 Credit Score Risk Analyzer:** Bureau percentiles, APR estimations, and personalized score improvement recommendations.
- **🤖 AI Financial Advisor:** Dual LLM support (Groq/Claude) with guaranteed offline deterministic fallback.
- **📜 Application History & Auditing:** Persistent FIFO log (`records.json`) for auditing past evaluations.
- **📊 Google Sheets Live Sync:** Out-of-the-box integration with Google Apps Script to forward applications to spreadsheets in real time.

---

## 📡 REST API Reference

| Endpoint | Method | Payload / Parameters | Description |
|---|---|---|---|
| `/api/check-eligibility` | `POST` | `{"applicant_name": str, "monthly_salary": float, "credit_score": int, "existing_emi": float, "age": int}` | Evaluates eligibility, computes borrowing cap, generates AI assessment, records log |
| `/api/calculate-emi` | `POST` | `{"principal": float, "annual_rate": float, "tenure_months": int}` | Calculates reducing-balance EMI and monthly amortization breakdown |
| `/api/analyze-credit` | `POST` | `{"credit_score": int}` | Analyzes credit tier, approval odds, and tailored credit health strategies |
| `/api/ai-advisor` | `POST` | `{"query": str, "context": dict}` | AI-powered financial advisory for loan, EMI, debt, and credit queries |
| `/api/records` | `GET` | *None* | Retrieves application history records |
| `/api/health` | `GET` | *None* | Verifies API health and third-party configuration flags |

---

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.8+
- Git

### 2. Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rj7640658-collab/loan-ai.git
   cd loan-ai
   ```

2. **Create and activate a virtual environment:**
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
   *(Optional: Add `GROQ_API_KEY`, `ANTHROPIC_API_KEY`, or `GOOGLE_APPS_SCRIPT_URL` in `.env`)*

5. **Run the application:**
   ```bash
   python app.py
   ```

6. **Open in browser:**
   Navigate to [http://127.0.0.1:5000](http://127.0.0.1:5000)

---

## 📂 Project Structure

```
loan-ai/
├── app.py                   # Core Flask backend & BFSI logic
├── requirements.txt         # Python package dependencies
├── .env.example             # Environment template
├── .gitignore               # Ignored cache & private files
├── google_apps_script.js    # Google Sheets webhook script
├── test_app.py              # Automated test suite (13 test cases)
├── records.json             # Local persistent evaluation store
├── PROJECT_REPORT.md        # Standalone Project Technical Report
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

Execute the test suite with pytest:
```bash
python -m pytest test_app.py -v
```

---

## 📄 License
MIT License. Open for educational, personal, and commercial adaptations.
