import os
import json
import math
from datetime import datetime
from flask import Flask, render_template, request, jsonify, send_from_directory
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder="static", template_folder="templates")
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "bfsi-loan-ai-secret-2026")

DATA_FILE = os.path.join(os.path.dirname(__file__), "records.json")

# Ensure records.json exists
if not os.path.exists(DATA_FILE):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump([], f)


# ============================================================================
# HELPER FUNCTIONS: FINANCIAL LOGIC
# ============================================================================

def evaluate_loan_eligibility(salary, credit_score, existing_emi, age):
    """
    Evaluates loan eligibility based on predefined business rules:
    - Monthly salary > ₹30,000
    - Credit score > 700
    - Existing EMI < ₹20,000
    - Applicant age >= 21
    
    If all conditions are met:
    - Eligible Loan Amount = Monthly Salary * 20
    """
    reasons = []
    passed_checks = []

    # Rule 1: Monthly salary > 30,000
    if salary > 30000:
        passed_checks.append("Monthly salary exceeds minimum threshold of ₹30,000.")
    else:
        reasons.append("Monthly salary must be strictly greater than ₹30,000 (Current: ₹{:,.2f}).".format(salary))

    # Rule 2: Credit score > 700
    if credit_score > 700:
        passed_checks.append("Credit score is above 700 benchmark.")
    else:
        reasons.append("Credit score must be strictly greater than 700 (Current: {}).".format(credit_score))

    # Rule 3: Existing EMI obligations < 20,000
    if existing_emi < 20000:
        passed_checks.append("Existing monthly EMI obligations are below ₹20,000 limit.")
    else:
        reasons.append("Existing EMI obligations must be strictly below ₹20,000 (Current: ₹{:,.2f}).".format(existing_emi))

    # Rule 4: Applicant age >= 21
    if age >= 21:
        passed_checks.append("Applicant meets the minimum age requirement of 21 years.")
    else:
        reasons.append("Applicant age must be at least 21 years (Current: {} years).".format(age))

    is_eligible = len(reasons) == 0

    if is_eligible:
        eligible_amount = salary * 20
        # Risk classification
        if credit_score >= 780 and existing_emi < 10000:
            risk_classification = "Low Risk (Prime Borrower)"
        else:
            risk_classification = "Moderate Risk (Standard Profile)"
    else:
        eligible_amount = 0
        risk_classification = "High Risk (Non-Compliant)"

    # Fixed Obligation to Income Ratio (FOIR)
    foir = (existing_emi / salary * 100) if salary > 0 else 0
    # Permissible max new EMI (standard 50% FOIR cap minus existing obligations)
    max_repayment_capacity = max(0, (salary * 0.50) - existing_emi)

    return {
        "is_eligible": is_eligible,
        "eligible_amount": eligible_amount,
        "risk_classification": risk_classification,
        "passed_checks": passed_checks,
        "rejection_reasons": reasons,
        "foir_percentage": round(foir, 2),
        "max_repayment_capacity": round(max_repayment_capacity, 2)
    }


def analyze_credit_score(score):
    """
    Classifies credit profile:
    - Excellent: 750 - 900
    - Good: 650 - 749
    - Poor: 300 - 649
    """
    score = int(score)
    if score >= 750:
        category = "Excellent"
        rating = "Tier 1 Prime"
        approval_odds = "95% - High Approval Likelihood"
        interest_rate_range = "8.25% - 10.50% (Lowest Rates)"
        advice = [
            "Maintain your current disciplined repayment track record.",
            "Keep overall credit card utilization consistently below 30%.",
            "Negotiate for waived processing fees and prime interest rates with top lenders.",
            "Preserve your oldest active credit accounts to maintain positive credit history length."
        ]
    elif score >= 650:
        category = "Good"
        rating = "Tier 2 Standard"
        approval_odds = "70% - Moderate Approval Likelihood"
        interest_rate_range = "10.50% - 14.00% (Standard Rates)"
        advice = [
            "Pay down existing high-utilization revolving credit balances to cross 750.",
            "Avoid applying for multiple credit cards or personal loans within short intervals.",
            "Ensure zero 30+ day payment delays across all ongoing EMIs.",
            "Check your credit report across CIBIL, Experian, and Equifax for any clerical inaccuracies."
        ]
    else:
        category = "Poor"
        rating = "Tier 3 Subprime"
        approval_odds = "< 30% - High Rejection Risk"
        interest_rate_range = "15.00%+ or Secured Lending Only"
        advice = [
            "Clear all past-due amounts and overdue balances immediately.",
            "Consider a secured credit card against a fixed deposit (FD) to rebuild score.",
            "Consolidate multiple small expensive debts into a single manageable plan.",
            "Refrain from new loan inquiries until your credit profile improves above 700."
        ]

    # Percentile relative to Indian retail borrower pool
    percentile = min(99, max(5, int((score - 300) / 600 * 100)))

    return {
        "score": score,
        "category": category,
        "rating": rating,
        "approval_odds": approval_odds,
        "interest_rate_range": interest_rate_range,
        "percentile": percentile,
        "recommendations": advice
    }


def calculate_reducing_balance_emi(principal, annual_interest_rate, tenure_months):
    """
    Calculates EMI using reducing-balance formula:
    EMI = (P * R * (1 + R)^N) / ((1 + R)^N - 1)
    where:
    P = Principal Loan Amount
    R = Monthly Interest Rate (annual rate / 12 / 100)
    N = Loan Tenure in Months
    """
    P = float(principal)
    annual_rate = float(annual_interest_rate)
    N = int(tenure_months)

    if P <= 0 or annual_rate <= 0 or N <= 0:
        return {
            "emi": 0,
            "principal": P,
            "total_interest": 0,
            "total_payment": P,
            "amortization": []
        }

    R = (annual_rate / 12.0) / 100.0

    # Calculate EMI: (P * R * (1 + R)^N) / ((1 + R)^N - 1)
    emi = (P * R * math.pow(1 + R, N)) / (math.pow(1 + R, N) - 1)
    rounded_emi = round(emi, 2)

    total_payment = round(rounded_emi * N, 2)
    total_interest = round(total_payment - P, 2)

    # Generate amortization breakdown (first 12 months + annual summaries)
    balance = P
    amortization = []
    for month in range(1, N + 1):
        interest_for_month = balance * R
        principal_for_month = emi - interest_for_month
        balance = max(0.0, balance - principal_for_month)

        if month <= 24 or month % 12 == 0 or month == N:
            amortization.append({
                "month": month,
                "emi": round(emi, 2),
                "principal": round(principal_for_month, 2),
                "interest": round(interest_for_month, 2),
                "remaining_balance": round(balance, 2)
            })

    return {
        "emi": round(emi, 2),
        "principal": round(P, 2),
        "annual_rate": annual_rate,
        "tenure_months": N,
        "tenure_years": round(N / 12.0, 1),
        "total_interest": round(total_interest, 2),
        "total_payment": round(total_payment, 2),
        "interest_ratio": round((total_interest / total_payment) * 100, 2),
        "principal_ratio": round((P / total_payment) * 100, 2),
        "amortization": amortization
    }


# ============================================================================
# AI FINANCIAL REASONING ENGINE (GROQ & CLAUDE INTEGRATION + ROBUST FALLBACK)
# ============================================================================

def call_groq_api(prompt, system_prompt=None):
    """Calls Groq Cloud API for high-speed LLM reasoning using Llama-3.3-70b-versatile."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None

    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.4,
        "max_tokens": 800
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=12)
        if response.status_code == 200:
            data = response.json()
            return data["choices"][0]["message"]["content"]
    except Exception as err:
        print(f"Groq API Error: {err}")
    return None


def call_claude_api(prompt, system_prompt=None):
    """Calls Anthropic Claude API for deep financial reasoning."""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return None

    model = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")
    url = "https://api.anthropic.com/v1/messages"
    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
    }

    payload = {
        "model": model,
        "max_tokens": 800,
        "messages": [{"role": "user", "content": prompt}]
    }
    if system_prompt:
        payload["system"] = system_prompt

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=12)
        if response.status_code == 200:
            data = response.json()
            return data["content"][0]["text"]
    except Exception as err:
        print(f"Claude API Error: {err}")
    return None


def generate_ai_financial_reasoning(context_data):
    """
    Generates intelligent AI financial analysis. Tries Groq/Claude API first,
    and falls back to comprehensive rule-driven BFSI algorithmic reasoning.
    """
    name = context_data.get("applicant_name", "Applicant")
    salary = float(context_data.get("monthly_salary", 0))
    credit_score = int(context_data.get("credit_score", 0))
    existing_emi = float(context_data.get("existing_emi", 0))
    age = int(context_data.get("age", 0))
    is_eligible = context_data.get("is_eligible", False)
    eligible_amount = float(context_data.get("eligible_amount", 0))
    reasons = context_data.get("rejection_reasons", [])

    prompt = f"""
    Applicant Financial Profile:
    - Name: {name}
    - Age: {age}
    - Monthly Salary: ₹{salary:,.2f}
    - Credit Score: {credit_score}
    - Existing Monthly EMI Obligations: ₹{existing_emi:,.2f}
    - Eligibility Status: {"APPROVED" if is_eligible else "REJECTED"}
    - Approved Loan Sanction: ₹{eligible_amount:,.2f}
    - Failure Reasons (if any): {'; '.join(reasons) if reasons else 'None - Fully Met Criteria'}

    Provide a concise, highly professional BFSI underwriting analysis covering:
    1. Financial Risk Assessment & Debt-to-Income Profile.
    2. Concrete Next Steps (if approved: loan optimization, tenure choices; if rejected: exact recovery plan to qualify).
    3. Actionable Financial Advice. Keep tone professional, encouraging, and analytical.
    """

    system_prompt = (
        "You are an expert BFSI Credit Underwriting and Financial Planning AI Advisor. "
        "Analyze the borrower's profile with precision, financial rigor, and clear actionable recommendations."
    )

    provider = os.getenv("AI_PROVIDER", "auto").lower()

    if provider == "groq":
        res = call_groq_api(prompt, system_prompt)
        if res:
            return {"provider": "Groq Llama-3.3-70b", "advice": res}
    elif provider == "claude":
        res = call_claude_api(prompt, system_prompt)
        if res:
            return {"provider": "Anthropic Claude 3.5 Sonnet", "advice": res}
    else:  # auto
        res = call_groq_api(prompt, system_prompt) or call_claude_api(prompt, system_prompt)
        if res:
            return {"provider": "AI Live Assistant", "advice": res}

    # Deterministic Expert Fallback Engine
    foir = (existing_emi / salary * 100) if salary > 0 else 0
    if is_eligible:
        advice_text = (
            f"**Underwriting Decision: Approved for ₹{eligible_amount:,.0f}**\n\n"
            f"• **Risk Profile:** Your credit score of {credit_score} and low debt-to-income ratio (FOIR of {foir:.1f}%) "
            f"qualify you as a prime borrower. Your existing commitments of ₹{existing_emi:,.0f}/month leave a healthy disposable buffer.\n"
            f"• **Optimal Loan Structuring:** To optimize interest payments on ₹{eligible_amount:,.0f}, select a 3 to 5-year tenure "
            f"if opt for personal financing, or 15–20 years for a home loan to keep the new EMI under 40% of net monthly income.\n"
            f"• **Prepayment Strategy:** Make one extra EMI payment every calendar year or increase your EMI by 5% annually to reduce "
            f"total interest outflow by up to 28%."
        )
    else:
        roadmap = []
        if salary <= 30000:
            roadmap.append(f"Increase verified net income above ₹30,000 or introduce a creditworthy co-applicant (e.g., spouse or parent).")
        if credit_score <= 700:
            roadmap.append(f"Address your {credit_score} credit score: pay all credit card statements before the billing date and resolve any past late-payment remarks.")
        if existing_emi >= 20000:
            roadmap.append(f"De-leverage existing loans: prepay small personal loans or credit lines to bring monthly obligations strictly under ₹20,000 (currently ₹{existing_emi:,.0f}).")
        if age < 21:
            roadmap.append(f"Applicants must reach 21 years of legal credit contracting age. You can apply with a primary adult guardian or co-borrower.")

        advice_text = (
            f"**Underwriting Assessment: Action Required for Qualification**\n\n"
            f"• **Primary Bottlenecks:** Your application does not yet meet institutional risk criteria due to: "
            f"{'; '.join(reasons)}.\n"
            f"• **Target Recovery Roadmap:**\n" +
            "\n".join([f"  1. {item}" for item in roadmap]) +
            f"\n\n• **Re-evaluation Timeline:** Once these parameters are rectified, re-assessment typically takes 30–60 business days for bureau reporting synchronization."
        )

    return {"provider": "BFSI Expert Financial Intelligence Engine", "advice": advice_text}


def forward_to_google_apps_script(data):
    """Forwards loan application data to Google Apps Script Web App endpoint if configured."""
    script_url = os.getenv("GOOGLE_APPS_SCRIPT_URL")
    if not script_url or "YOUR_DEPLOYMENT_ID" in script_url or not script_url.startswith("http"):
        return {"status": "skipped", "message": "Google Apps Script URL not configured"}

    try:
        resp = requests.post(script_url, json=data, timeout=8)
        return {"status": "success", "response": resp.json() if resp.status_code == 200 else resp.text}
    except Exception as err:
        return {"status": "error", "message": str(err)}


def save_local_record(record):
    """Saves evaluated application record to records.json."""
    try:
        records = []
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                records = json.load(f)
        records.insert(0, record)
        # Keep up to 200 recent records
        records = records[:200]
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(records, f, indent=2)
        return True
    except Exception as e:
        print(f"Failed to save record: {e}")
        return False


# ============================================================================
# PAGE ROUTES
# ============================================================================

@app.route("/")
@app.route("/index.html")
def index():
    return render_template("index.html")

@app.route("/eligibility")
@app.route("/eligibility.html")
def eligibility_page():
    return render_template("eligibility.html")

@app.route("/credit-analyzer")
@app.route("/credit-analyzer.html")
def credit_page():
    return render_template("credit-analyzer.html")

@app.route("/emi-calculator")
@app.route("/emi-calculator.html")
def emi_page():
    return render_template("emi-calculator.html")

@app.route("/ai-advisor")
@app.route("/ai-advisor.html")
def advisor_page():
    return render_template("ai-advisor.html")

@app.route("/history")
@app.route("/history.html")
def history_page():
    return render_template("history.html")


# ============================================================================
# REST API ENDPOINTS
# ============================================================================

@app.route("/api/check-eligibility", methods=["POST"])
def api_check_eligibility():
    """
    Evaluates loan eligibility.
    Required JSON payload:
    - applicant_name (str)
    - monthly_salary (float)
    - credit_score (int)
    - existing_emi (float)
    - age (int)
    """
    data = request.get_json(force=True) if request.is_json else request.form.to_dict()

    try:
        name = str(data.get("applicant_name", "Applicant")).strip()
        salary = float(data.get("monthly_salary", 0))
        credit_score = int(data.get("credit_score", 0))
        existing_emi = float(data.get("existing_emi", 0))
        age = int(data.get("age", 0))
    except (ValueError, TypeError) as e:
        return jsonify({"success": False, "error": f"Invalid numerical inputs: {str(e)}"}), 400

    evaluation = evaluate_loan_eligibility(salary, credit_score, existing_emi, age)

    # Attach contextual AI financial reasoning
    ai_context = {
        "applicant_name": name,
        "monthly_salary": salary,
        "credit_score": credit_score,
        "existing_emi": existing_emi,
        "age": age,
        "is_eligible": evaluation["is_eligible"],
        "eligible_amount": evaluation["eligible_amount"],
        "rejection_reasons": evaluation["rejection_reasons"]
    }
    ai_result = generate_ai_financial_reasoning(ai_context)

    # Prepare complete record
    record = {
        "id": datetime.now().strftime("%Y%m%d%H%M%S%f")[:17],
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "applicant_name": name,
        "monthly_salary": salary,
        "credit_score": credit_score,
        "existing_emi": existing_emi,
        "age": age,
        "status": "APPROVED" if evaluation["is_eligible"] else "REJECTED",
        "is_eligible": evaluation["is_eligible"],
        "eligible_amount": evaluation["eligible_amount"],
        "risk_classification": evaluation["risk_classification"],
        "foir_percentage": evaluation["foir_percentage"],
        "max_repayment_capacity": evaluation["max_repayment_capacity"],
        "rejection_reasons": evaluation["rejection_reasons"],
        "passed_checks": evaluation["passed_checks"],
        "ai_provider": ai_result["provider"],
        "ai_reasoning": ai_result["advice"]
    }

    # Save to local records
    save_local_record(record)

    # Forward to Google Sheets Web App if configured
    sheets_result = forward_to_google_apps_script(record)

    return jsonify({
        "success": True,
        "data": record,
        "google_sheets_sync": sheets_result
    })


@app.route("/api/analyze-credit", methods=["POST"])
def api_analyze_credit():
    """Analyzes credit score and provides risk tier & advice."""
    data = request.get_json(force=True) if request.is_json else request.form.to_dict()
    try:
        score = int(data.get("credit_score", 700))
    except (ValueError, TypeError):
        return jsonify({"success": False, "error": "Credit score must be a valid integer between 300 and 900"}), 400

    if score < 300 or score > 900:
        return jsonify({"success": False, "error": "Credit score must be between 300 and 900"}), 400

    analysis = analyze_credit_score(score)
    return jsonify({"success": True, "data": analysis})


@app.route("/api/calculate-emi", methods=["POST"])
def api_calculate_emi():
    """Calculates reducing-balance loan EMI and amortization schedule."""
    data = request.get_json(force=True) if request.is_json else request.form.to_dict()
    try:
        principal = float(data.get("principal", 500000))
        rate = float(data.get("annual_rate", 10.5))
        tenure_months = int(data.get("tenure_months", 36))
    except (ValueError, TypeError) as e:
        return jsonify({"success": False, "error": f"Invalid numerical inputs: {str(e)}"}), 400

    if principal <= 0 or rate <= 0 or tenure_months <= 0:
        return jsonify({"success": False, "error": "All inputs must be greater than zero"}), 400

    result = calculate_reducing_balance_emi(principal, rate, tenure_months)
    return jsonify({"success": True, "data": result})


@app.route("/api/ai-advisor", methods=["POST"])
def api_ai_advisor():
    """Interactive AI Financial Advisor for loan, debt, and credit queries."""
    data = request.get_json(force=True) if request.is_json else request.form.to_dict()
    user_query = data.get("query", "").strip()

    if not user_query:
        return jsonify({"success": False, "error": "Query cannot be empty"}), 400

    prompt = f"User Financial Inquiry: {user_query}\n\nFinancial Context: {json.dumps(data.get('context', {}))}"
    system_prompt = (
        "You are an expert BFSI Credit Underwriting and Wealth Planning AI Advisor. "
        "Provide thorough, precise, practical, and mathematically accurate financial advice. "
        "Use bullet points, clear headings, and concrete steps."
    )

    ai_answer = call_groq_api(prompt, system_prompt) or call_claude_api(prompt, system_prompt)

    if not ai_answer:
        # High-quality smart response generator for common financial inquiries
        query_lower = user_query.lower()
        if "rejection" in query_lower or "rejected" in query_lower or "qualify" in query_lower:
            ai_answer = (
                "### Recovery Blueprint for Loan Approval\n\n"
                "1. **Audit Debt-to-Income (FOIR):** Ensure your total monthly EMIs do not exceed 40-50% of your net salary. "
                "Prepay high-cost debts or credit card lines first.\n"
                "2. **Enhance Verified Income:** Add a co-applicant (working spouse/parent) to combine household incomes and unlock higher eligibility.\n"
                "3. **Credit Repair:** Discard any disputable flags on your credit bureau report. Maintain credit card balances below 30% limit.\n"
                "4. **Reapplication Buffer:** Wait at least 60 days before submitting a fresh institutional application to prevent multiple hard inquiries."
            )
        elif "emi" in query_lower or "reduce" in query_lower or "prepay" in query_lower:
            ai_answer = (
                "### Reducing Balance EMI Optimization Strategies\n\n"
                "1. **The Annual 1-Extra-EMI Rule:** Paying just one additional EMI each year reduces a 20-year loan tenure by approximately 4.5 years.\n"
                "2. **5% Annual Prepayment Escalation:** Increase your monthly EMI by 5% every time you receive an annual salary increment.\n"
                "3. **Balance Transfer Evaluation:** If your current loan interest rate is above 10% and your credit score is >750, explore home loan balance transfers to save 50–150 bps."
            )
        elif "credit score" in query_lower or "cibil" in query_lower or "score" in query_lower:
            ai_answer = (
                "### Rapid 6-Month Credit Score Building Protocol\n\n"
                "1. **Utilization Anchor:** Keep credit card usage strictly under 30% of credit limit. (e.g. ₹30,000 on a ₹1,00,000 limit).\n"
                "2. **Auto-Pay Mandate:** Set up standing instructions for total statement balances, not just minimum due amounts.\n"
                "3. **Credit Mix Diversification:** A healthy balance of secured (auto/home) and unsecured (personal/card) credit improves your rating.\n"
                "4. **Zero Hard Inquiries:** Refrain from applying for multiple consumer loans simultaneously."
            )
        else:
            ai_answer = (
                "### Institutional Financial Advisory Guidance\n\n"
                "• **Prudent Borrowing Rule:** Never let total fixed debt obligations surpass 50% of your verified net monthly income.\n"
                "• **Emergency Buffer:** Maintain 6 months of living expenses and EMIs in a liquid fund before taking on large capital loans.\n"
                "• **Tenure Optimization:** Shorter tenures incur slightly higher monthly EMIs but drastically slash cumulative interest outflow.\n"
                "• **Rule-Based Pre-Qualification:** Always check your eligibility thresholds beforehand to protect your credit score from hard inquiries."
            )

    return jsonify({
        "success": True,
        "query": user_query,
        "answer": ai_answer
    })


@app.route("/api/records", methods=["GET"])
def api_get_records():
    """Returns all evaluated application records."""
    records = []
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                records = json.load(f)
        except Exception:
            records = []
    return jsonify({"success": True, "count": len(records), "records": records})


@app.route("/api/health")
def api_health():
    return jsonify({
        "status": "healthy",
        "service": "AI Loan Eligibility Checker & BFSI Engine",
        "timestamp": datetime.now().isoformat(),
        "groq_configured": bool(os.getenv("GROQ_API_KEY")),
        "claude_configured": bool(os.getenv("ANTHROPIC_API_KEY")),
        "google_sheets_configured": bool(os.getenv("GOOGLE_APPS_SCRIPT_URL"))
    })


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"Starting AI Loan Eligibility Checker on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=True)
