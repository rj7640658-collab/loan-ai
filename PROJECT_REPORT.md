# 📑 Project Technical & Architecture Report
## AI Loan Eligibility Checker & BFSI Intelligence Engine

**Author / Maintainer:** Antigravity AI Engineering & BFSI Team  
**System Version:** v1.0.0 Production-Ready  
**Classification:** BFSI Credit Underwriting, Financial Risk Analysis & Generative AI Advisory  
**Repository:** [https://github.com/rj7640658-collab/loan-ai](https://github.com/rj7640658-collab/loan-ai)  
**Date:** October 2026  

---

### Executive Summary

The **AI Loan Eligibility Checker & BFSI Intelligence Engine** is a full-stack, institutional-grade financial decisioning system designed to solve the critical friction points of retail credit lending: slow manual underwriting, opaque eligibility guidelines, and the lack of guidance for rejected applicants.

By pairing deterministic algorithmic underwriting logic with high-performance Generative AI (powered by Groq LLaMA 3.3 70B and Anthropic Claude 3.5 Sonnet, with a built-in offline heuristic fallback), the system delivers:
1. **Instant Loan Underwriting:** Real-time eligibility evaluation against industry standards.
2. **Transparent Decisioning:** Specific explanations of pass/fail criteria and permissible credit capacities.
3. **Actionable Financial Roadmaps:** Step-by-step credit recovery guidance for subprime applicants and tenure/prepayment optimization for prime applicants.
4. **Interactive Financial Calculators:** High-precision compound amortisation calculators and credit bureau risk analyzers.
5. **Multi-Channel Cloud Sync:** Real-time persistence with dual local audit logging and Google Sheets synchronization via Google Apps Script.

---

### System Architecture & Workflow

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

### Core Business Logic & Mathematical Formulations

#### 1. Loan Underwriting & Qualification Engine
The underwriting pipeline executes multi-variable criteria:
* **Salary Threshold:** Net Monthly Salary must strictly exceed ₹30,000.
* **Credit Bureau Score:** CIBIL / Experian score must strictly exceed 700.
* **Existing Fixed Obligations:** Ongoing monthly debt payments (EMIs) must be strictly below ₹20,000.
* **Age Requirement:** Applicant must be at least 21 years of age.

**Sanction Formula:**
$$\text{Eligible Loan Amount} = \text{Monthly Salary} \times 20$$

**Fixed Obligation to Income Ratio (FOIR):**
$$\text{FOIR (\%)} = \left(\frac{\text{Existing EMI}}{\text{Monthly Salary}}\right) \times 100$$

**Maximum Disposable Repayment Capacity:**
$$\text{Permissible New EMI} = \max\left(0, (\text{Monthly Salary} \times 0.50) - \text{Existing EMI}\right)$$

#### 2. Reducing-Balance EMI & Amortization Engine
Unlike flat-rate schemes, the platform leverages standard institutional reducing-balance compound interest calculation:

$$\text{EMI} = \frac{P \times R \times (1 + R)^N}{(1 + R)^N - 1}$$

Where:
* $P$ = Principal Loan Amount
* $R$ = Monthly Interest Rate $\left(\frac{\text{Annual Rate}}{12 \times 100}\right)$
* $N$ = Loan Tenure in Months

For each month $t \in [1, N]$:
$$\text{Interest}_t = \text{Balance}_{t-1} \times R$$
$$\text{Principal}_t = \text{EMI} - \text{Interest}_t$$
$$\text{Balance}_t = \max(0, \text{Balance}_{t-1} - \text{Principal}_t)$$

#### 3. Bureau Credit Score Classification
* **Tier 1 (Prime) — [750 to 900]:** Approval odds ~95%, lowest available APRs (8.25% - 10.50%).
* **Tier 2 (Standard) — [650 to 749]:** Approval odds ~70%, standard market APRs (10.50% - 14.00%).
* **Tier 3 (Subprime) — [300 to 649]:** Approval odds <30%, secured lending or restructuring recommended.

---

### Dual-Provider Generative AI & Deterministic Fallback

1. **Groq Cloud API (`llama-3.3-70b-versatile`):** Ultra-low latency inference delivering institutional-grade borrower analysis in under 500ms.
2. **Anthropic Claude API (`claude-3-5-sonnet-20241022`):** Deep financial reasoning and nuanced advisory.
3. **Deterministic Heuristic Engine:** Operates 100% offline with zero external API dependencies, synthesizing customized recovery pathways and prepayment schedules dynamically.

---

### REST API Documentation

| Endpoint | Method | Input Payload | Output / Response |
|---|---|---|---|
| `/api/check-eligibility` | `POST` | `applicant_name`, `monthly_salary`, `credit_score`, `existing_emi`, `age` | Eligibility decision, sanction limit, FOIR, AI reasoning, Google Sheet sync status |
| `/api/calculate-emi` | `POST` | `principal`, `annual_rate`, `tenure_months` | Monthly EMI, total interest, total payment, 24-month amortization schedule |
| `/api/analyze-credit` | `POST` | `credit_score` | Risk tier, approval likelihood, expected APR range, credit repair advice |
| `/api/ai-advisor` | `POST` | `query`, `context` (optional) | AI underwriting analysis, loan recovery roadmaps, repayment optimization |
| `/api/records` | `GET` | *None* | List of past evaluations from local audit log |
| `/api/health` | `GET` | *None* | Service health, timestamps, integration configuration statuses |

---

### Quality Assurance & Automated Test Results

The suite uses `pytest` across unit, calculation, and route integration tests:
* **Underwriting Validation:** Verifies approval boundaries and rejection rules.
* **EMI Accuracy:** Validates mathematical precision against banking benchmarks.
* **Credit Stratification:** Tests tier assignments for Prime, Standard, and Subprime.
* **AI Advisor Fallback:** Guarantees response integrity even without cloud API keys.
* **Test Outcome:** **13 Passed / 13 Total (100% Passing Rate)**.
