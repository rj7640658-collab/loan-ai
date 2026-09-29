import math
import pytest
from app import app, evaluate_loan_eligibility, analyze_credit_score, calculate_reducing_balance_emi

@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


# ============================================================================
# MILESTONE 3: CORE FINANCIAL RULE VALIDATION TESTS
# ============================================================================

def test_loan_eligibility_all_criteria_met():
    """Test standard approved scenario where all 4 conditions pass."""
    salary = 50000
    credit_score = 750
    existing_emi = 10000
    age = 28

    result = evaluate_loan_eligibility(salary, credit_score, existing_emi, age)

    assert result["is_eligible"] is True
    assert result["eligible_amount"] == 50000 * 20  # ₹1,000,000
    assert "Prime" in result["risk_classification"] or "Moderate" in result["risk_classification"]
    assert len(result["rejection_reasons"]) == 0
    assert len(result["passed_checks"]) == 4


def test_loan_eligibility_salary_threshold_boundary():
    """
    Test Rule 1: Monthly salary must exceed ₹30,000 strictly.
    - Exactly 30,000 -> REJECTED (must exceed 30,000)
    - 30,001 -> APPROVED
    - 25,000 -> REJECTED
    """
    # Exactly 30,000
    res_exact = evaluate_loan_eligibility(30000, 750, 5000, 25)
    assert res_exact["is_eligible"] is False
    assert any("greater than ₹30,000" in r for r in res_exact["rejection_reasons"])

    # Below 30,000
    res_below = evaluate_loan_eligibility(28000, 750, 5000, 25)
    assert res_below["is_eligible"] is False
    assert res_below["eligible_amount"] == 0

    # Above 30,000
    res_above = evaluate_loan_eligibility(30001, 750, 5000, 25)
    assert res_above["is_eligible"] is True
    assert res_above["eligible_amount"] == 30001 * 20


def test_loan_eligibility_credit_score_boundary():
    """
    Test Rule 2: Credit score must be strictly greater than 700.
    - Exactly 700 -> REJECTED
    - 701 -> APPROVED
    - 650 -> REJECTED
    """
    # Exactly 700
    res_exact = evaluate_loan_eligibility(45000, 700, 5000, 25)
    assert res_exact["is_eligible"] is False
    assert any("greater than 700" in r for r in res_exact["rejection_reasons"])

    # Score 701
    res_above = evaluate_loan_eligibility(45000, 701, 5000, 25)
    assert res_above["is_eligible"] is True

    # Score 620
    res_below = evaluate_loan_eligibility(45000, 620, 5000, 25)
    assert res_below["is_eligible"] is False


def test_loan_eligibility_existing_emi_boundary():
    """
    Test Rule 3: Existing EMI obligations must remain below ₹20,000.
    - Exactly 20,000 -> REJECTED
    - 19,999 -> APPROVED
    - 25,000 -> REJECTED
    """
    # Exactly 20,000
    res_exact = evaluate_loan_eligibility(45000, 750, 20000, 25)
    assert res_exact["is_eligible"] is False
    assert any("below ₹20,000" in r for r in res_exact["rejection_reasons"])

    # 19,999
    res_below = evaluate_loan_eligibility(45000, 750, 19999, 25)
    assert res_below["is_eligible"] is True

    # 22,000
    res_above = evaluate_loan_eligibility(45000, 750, 22000, 25)
    assert res_above["is_eligible"] is False


def test_loan_eligibility_age_boundary():
    """
    Test Rule 4: Applicant age must be at least 21 years (age >= 21).
    - 20 -> REJECTED
    - 21 -> APPROVED
    - 30 -> APPROVED
    """
    # Age 20
    res_minor = evaluate_loan_eligibility(50000, 750, 5000, 20)
    assert res_minor["is_eligible"] is False
    assert any("at least 21 years" in r for r in res_minor["rejection_reasons"])

    # Age 21
    res_21 = evaluate_loan_eligibility(50000, 750, 5000, 21)
    assert res_21["is_eligible"] is True

    # Age 40
    res_40 = evaluate_loan_eligibility(50000, 750, 5000, 40)
    assert res_40["is_eligible"] is True


def test_loan_eligibility_multiple_failures():
    """Test when multiple criteria fail simultaneously."""
    res = evaluate_loan_eligibility(25000, 650, 25000, 19)
    assert res["is_eligible"] is False
    assert len(res["rejection_reasons"]) == 4
    assert res["eligible_amount"] == 0
    assert "High Risk" in res["risk_classification"]


# ============================================================================
# CREDIT SCORE ANALYZER TESTS
# ============================================================================

def test_credit_score_analyzer_tiers():
    """
    Test 3 classifications:
    - Excellent: 750 - 900
    - Good: 650 - 749
    - Poor: 300 - 649
    """
    # Excellent
    assert analyze_credit_score(750)["category"] == "Excellent"
    assert analyze_credit_score(850)["category"] == "Excellent"
    assert analyze_credit_score(900)["category"] == "Excellent"

    # Good
    assert analyze_credit_score(650)["category"] == "Good"
    assert analyze_credit_score(700)["category"] == "Good"
    assert analyze_credit_score(749)["category"] == "Good"

    # Poor
    assert analyze_credit_score(300)["category"] == "Poor"
    assert analyze_credit_score(649)["category"] == "Poor"
    assert analyze_credit_score(550)["category"] == "Poor"


# ============================================================================
# REDUCING-BALANCE EMI CALCULATOR TESTS
# ============================================================================

def test_reducing_balance_emi_formula():
    """
    Verify EMI = (P * R * (1 + R)^N) / ((1 + R)^N - 1)
    Example:
    P = 1,00,000
    Annual Rate = 12% -> Monthly R = 1% = 0.01
    Tenure = 12 months
    Theoretical EMI = 8,884.88
    """
    principal = 100000
    rate = 12.0
    tenure_months = 12

    result = calculate_reducing_balance_emi(principal, rate, tenure_months)

    assert result["emi"] == 8884.88
    assert result["principal"] == 100000
    assert result["total_payment"] == round(8884.88 * 12, 2)
    assert result["total_interest"] == round((8884.88 * 12) - 100000, 2)
    assert len(result["amortization"]) > 0

    # Amortization check: final balance after 12 months should be approximately 0
    final_entry = result["amortization"][-1]
    assert final_entry["remaining_balance"] <= 1.0


# ============================================================================
# FLASK API ENDPOINT INTEGRATION TESTS
# ============================================================================

def test_api_check_eligibility_approved(client):
    payload = {
        "applicant_name": "Arjun Sharma",
        "monthly_salary": 65000,
        "credit_score": 780,
        "existing_emi": 8000,
        "age": 29
    }
    response = client.post("/api/check-eligibility", json=payload)
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert data["data"]["status"] == "APPROVED"
    assert data["data"]["eligible_amount"] == 65000 * 20
    assert data["data"]["applicant_name"] == "Arjun Sharma"


def test_api_check_eligibility_rejected(client):
    payload = {
        "applicant_name": "Priya Verma",
        "monthly_salary": 28000,
        "credit_score": 670,
        "existing_emi": 22000,
        "age": 20
    }
    response = client.post("/api/check-eligibility", json=payload)
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert data["data"]["status"] == "REJECTED"
    assert data["data"]["eligible_amount"] == 0
    assert len(data["data"]["rejection_reasons"]) > 0


def test_api_analyze_credit(client):
    response = client.post("/api/analyze-credit", json={"credit_score": 820})
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert data["data"]["category"] == "Excellent"


def test_api_calculate_emi(client):
    response = client.post("/api/calculate-emi", json={
        "principal": 500000,
        "annual_rate": 9.5,
        "tenure_months": 60
    })
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert data["data"]["emi"] > 0
    assert data["data"]["total_interest"] > 0


def test_api_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "healthy"
