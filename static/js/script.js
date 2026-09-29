/**
 * ============================================================================
 * AI LOAN ELIGIBILITY CHECKER & BFSI PLATFORM - CORE SCRIPT
 * Glassmorphism Client-Side Logic, AI Integration, and Google Sheets Dispatcher
 * ============================================================================
 */

// Storage keys
const STORAGE_KEYS = {
  SETTINGS: "bfsi_loan_ai_settings",
  RECORDS: "bfsi_loan_ai_records"
};

// Default Settings
const defaultSettings = {
  groqApiKey: "",
  groqModel: "llama-3.3-70b-versatile",
  claudeApiKey: "",
  googleAppsScriptUrl: "",
  useBackend: true
};

// Load saved settings
function getSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  } catch (e) {
    return defaultSettings;
  }
}

function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

// Local Records Management
function getLocalRecords() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.RECORDS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalRecord(record) {
  const records = getLocalRecords();
  records.unshift(record);
  // Keep up to 100 records
  if (records.length > 100) records.pop();
  localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
}

// Format Currency in Indian Rupee format (₹)
function formatINR(amount) {
  if (isNaN(amount)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

// Toast Notifications
function showToast(message, type = "info") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  const icon = type === "success" 
    ? "fa-circle-check" 
    : type === "error" 
      ? "fa-circle-exclamation" 
      : "fa-circle-info";

  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(40px)";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ============================================================================
// CLIENT-SIDE FINANCIAL ENGINE
// ============================================================================

/**
 * Milestone 3.1: Rule-based Loan Eligibility Evaluation
 * - Monthly salary > ₹30,000
 * - Credit score > 700
 * - Existing EMI obligations < ₹20,000
 * - Age >= 21
 * If all conditions satisfied:
 * - Eligible Loan Amount = Monthly Salary * 20
 */
function evaluateEligibilityClient(salary, creditScore, existingEmi, age) {
  const reasons = [];
  const passed = [];

  // Rule 1: Monthly salary > ₹30,000
  if (salary > 30000) {
    passed.push(`Monthly salary (₹${salary.toLocaleString('en-IN')}) exceeds minimum threshold of ₹30,000.`);
  } else {
    reasons.push(`Monthly salary must be strictly greater than ₹30,000 (Current: ₹${salary.toLocaleString('en-IN')}).`);
  }

  // Rule 2: Credit score > 700
  if (creditScore > 700) {
    passed.push(`Credit score (${creditScore}) is above benchmark of 700.`);
  } else {
    reasons.push(`Credit score must be strictly greater than 700 (Current: ${creditScore}).`);
  }

  // Rule 3: Existing EMI obligations < ₹20,000
  if (existingEmi < 20000) {
    passed.push(`Existing EMI commitments (₹${existingEmi.toLocaleString('en-IN')}) are below ₹20,000 limit.`);
  } else {
    reasons.push(`Existing monthly EMI obligations must be strictly below ₹20,000 (Current: ₹${existingEmi.toLocaleString('en-IN')}).`);
  }

  // Rule 4: Applicant age >= 21
  if (age >= 21) {
    passed.push(`Applicant age (${age} years) meets the minimum requirement of 21 years.`);
  } else {
    reasons.push(`Applicant age must be at least 21 years (Current: ${age} years).`);
  }

  const isEligible = reasons.length === 0;
  const eligibleAmount = isEligible ? (salary * 20) : 0;
  
  let riskClassification = "High Risk (Non-Compliant)";
  if (isEligible) {
    riskClassification = (creditScore >= 780 && existingEmi < 10000) 
      ? "Low Risk (Prime Borrower)" 
      : "Moderate Risk (Standard Profile)";
  }

  const foir = salary > 0 ? (existingEmi / salary * 100) : 0;
  const maxRepayment = Math.max(0, (salary * 0.50) - existingEmi);

  return {
    is_eligible: isEligible,
    eligible_amount: eligibleAmount,
    risk_classification: riskClassification,
    passed_checks: passed,
    rejection_reasons: reasons,
    foir_percentage: Math.round(foir * 10) / 10,
    max_repayment_capacity: Math.round(maxRepayment)
  };
}

/**
 * Milestone 3.2: Credit Score Analyzer
 * - Excellent (750 - 900)
 * - Good (650 - 749)
 * - Poor (300 - 649)
 */
function analyzeCreditScoreClient(score) {
  score = parseInt(score, 10);
  let category, rating, approvalOdds, interestRateRange, advice;

  if (score >= 750) {
    category = "Excellent";
    rating = "Tier 1 Prime";
    approvalOdds = "95% - High Approval Likelihood";
    interestRateRange = "8.25% - 10.50% (Lowest Rates)";
    advice = [
      "Maintain your exceptional repayment track record with automated bank debits.",
      "Keep overall credit card utilization consistently below 30% of credit limit.",
      "Negotiate for waived processing fees and prime interest rates with top lenders.",
      "Preserve your oldest active credit accounts to maintain positive credit history length."
    ];
  } else if (score >= 650) {
    category = "Good";
    rating = "Tier 2 Standard";
    approvalOdds = "70% - Moderate Approval Likelihood";
    interestRateRange = "10.50% - 14.00% (Standard Rates)";
    advice = [
      "Pay down existing revolving card balances to push your score into the 750+ Prime tier.",
      "Avoid applying for multiple credit cards or personal loans within short intervals.",
      "Ensure zero 30+ day payment delays across all ongoing EMIs.",
      "Check your credit report across CIBIL and Experian for any clerical inaccuracies."
    ];
  } else {
    category = "Poor";
    rating = "Tier 3 Subprime";
    approvalOdds = "< 30% - High Rejection Risk";
    interestRateRange = "15.00%+ or Secured Lending Only";
    advice = [
      "Clear all past-due amounts and overdue balances immediately.",
      "Consider a secured credit card against a fixed deposit (FD) to rebuild score.",
      "Consolidate multiple small expensive debts into a single manageable plan.",
      "Refrain from new loan inquiries until your credit profile improves above 700."
    ];
  }

  const percentile = Math.min(99, Math.max(5, Math.round(((score - 300) / 600) * 100)));

  return {
    score: score,
    category: category,
    rating: rating,
    approval_odds: approvalOdds,
    interest_rate_range: interestRateRange,
    percentile: percentile,
    recommendations: advice
  };
}

/**
 * Milestone 3.3: Reducing-Balance EMI Formula
 * EMI = (P * R * (1 + R)^N) / ((1 + R)^N - 1)
 */
function calculateEmiClient(principal, annualRate, tenureMonths) {
  const P = parseFloat(principal);
  const annual = parseFloat(annualRate);
  const N = parseInt(tenureMonths, 10);

  if (P <= 0 || annual <= 0 || N <= 0) {
    return { emi: 0, total_interest: 0, total_payment: P, amortization: [] };
  }

  const R = (annual / 12.0) / 100.0;
  const factor = Math.pow(1 + R, N);
  const emi = (P * R * factor) / (factor - 1);
  const roundedEmi = Math.round(emi * 100) / 100;

  const totalPayment = Math.round((roundedEmi * N) * 100) / 100;
  const totalInterest = Math.round((totalPayment - P) * 100) / 100;

  let balance = P;
  const amortization = [];

  for (let month = 1; month <= N; month++) {
    const interestForMonth = balance * R;
    const principalForMonth = roundedEmi - interestForMonth;
    balance = Math.max(0, balance - principalForMonth);

    if (month <= 24 || month % 12 === 0 || month === N) {
      amortization.push({
        month: month,
        emi: roundedEmi,
        principal: Math.round(principalForMonth * 100) / 100,
        interest: Math.round(interestForMonth * 100) / 100,
        remaining_balance: Math.round(balance * 100) / 100
      });
    }
  }

  return {
    emi: roundedEmi,
    principal: P,
    annual_rate: annual,
    tenure_months: N,
    tenure_years: Math.round((N / 12) * 10) / 10,
    total_interest: totalInterest,
    total_payment: totalPayment,
    interest_ratio: Math.round((totalInterest / totalPayment) * 1000) / 10,
    principal_ratio: Math.round((P / totalPayment) * 1000) / 10,
    amortization: amortization
  };
}

// ============================================================================
// GOOGLE SHEETS & APPS SCRIPT WEBHOOK DISPATCHER
// ============================================================================

async function sendToGoogleAppsScript(payload) {
  const settings = getSettings();
  const scriptUrl = settings.googleAppsScriptUrl;
  
  if (!scriptUrl || !scriptUrl.startsWith("http") || scriptUrl.includes("YOUR_DEPLOYMENT_ID")) {
    return { success: false, reason: "No valid Google Apps Script Web App URL configured." };
  }

  try {
    // Standard Google Apps Script Web App POST
    const response = await fetch(scriptUrl, {
      method: "POST",
      mode: "no-cors", // Google Apps Script redirects require no-cors in direct browser fetch
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    return { success: true, message: "Dispatched to Google Apps Script successfully" };
  } catch (error) {
    console.warn("Google Apps Script sync warning:", error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// DIRECT GROQ & CLAUDE AI CLIENT INTEGRATION (FALLBACK OR STANDALONE)
// ============================================================================

async function generateAIAdvice(userPrompt, contextData = {}) {
  const settings = getSettings();

  // Try Groq API if key present in client settings
  if (settings.groqApiKey) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${settings.groqApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: settings.groqModel || "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: "You are an expert BFSI Credit Underwriting and Financial Planning AI Advisor. Provide concise, high-value, structured recommendations."
            },
            {
              role: "user",
              content: `Prompt: ${userPrompt}\nFinancial Context: ${JSON.stringify(contextData)}`
            }
          ],
          temperature: 0.4,
          max_tokens: 600
        })
      });

      if (res.ok) {
        const json = await res.json();
        return {
          provider: "Groq Llama-3.3-70b (Live Client API)",
          advice: json.choices[0].message.content
        };
      }
    } catch (e) {
      console.warn("Groq client fetch error:", e);
    }
  }

  // Try Claude API if key present
  if (settings.claudeApiKey) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": settings.claudeApiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
          "dangerously-allow-browser": "true"
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 600,
          messages: [
            {
              role: "user",
              content: `You are a BFSI Credit Advisor. Inquire: ${userPrompt}\nContext: ${JSON.stringify(contextData)}`
            }
          ]
        })
      });

      if (res.ok) {
        const json = await res.json();
        return {
          provider: "Anthropic Claude 3.5 Sonnet (Live Client API)",
          advice: json.content[0].text
        };
      }
    } catch (e) {
      console.warn("Claude client fetch error:", e);
    }
  }

  // Intelligent BFSI Offline Financial Engine
  const salary = contextData.monthly_salary || 0;
  const score = contextData.credit_score || 720;
  const emi = contextData.existing_emi || 0;
  const isEligible = contextData.is_eligible;
  const eligibleAmount = contextData.eligible_amount || (salary * 20);

  if (isEligible) {
    return {
      provider: "BFSI Institutional Underwriting Intelligence",
      advice: `**Underwriting Decision: Sanction Recommended for ${formatINR(eligibleAmount)}**\n\n` +
        `• **Borrower Risk Profile:** With a credit score of ${score} and disciplined EMI commitments of ${formatINR(emi)}/month, you meet Tier-1 retail lending guidelines.\n` +
        `• **Tenure Strategy:** Opting for a 48 to 60-month tenure maintains an EMI within 35% of your take-home pay, preserving your liquidity.\n` +
        `• **Interest Optimization:** Making a 5% prepayment once annually reduces your cumulative borrowing expense by up to 22%.`
    };
  } else if (contextData.rejection_reasons && contextData.rejection_reasons.length > 0) {
    const list = contextData.rejection_reasons.map(r => `  • ${r}`).join("\n");
    return {
      provider: "BFSI Institutional Underwriting Intelligence",
      advice: `**Underwriting Decision: Re-Qualification Strategy Required**\n\n` +
        `Your application fell short of regulatory risk norms due to:\n${list}\n\n` +
        `• **Target Turnaround Action:** Liquidate short-term revolving debt to compress existing EMIs below ₹20,000, or apply with a co-borrower to satisfy income standards. Once corrected, re-apply after 45 days.`
    };
  }

  // General query advice
  const q = userPrompt.toLowerCase();
  if (q.includes("rejection") || q.includes("rejected") || q.includes("fail")) {
    return {
      provider: "BFSI Advisory Engine",
      advice: `### Fast Recovery Strategy After Loan Rejection\n\n` +
        `1. **Lower Your Debt Burden:** Prepay high-interest consumer credit to drop your monthly debt obligations under 40% of income.\n` +
        `2. **Check Credit Inaccuracies:** Obtain your CIBIL report and challenge any incorrect delayed-payment tags.\n` +
        `3. **Co-applicant Synergy:** Adding an earning spouse or parent immediately boosts aggregate eligibility.`
    };
  } else if (q.includes("prepay") || q.includes("emi")) {
    return {
      provider: "BFSI Advisory Engine",
      advice: `### Reducing-Balance Prepayment Blueprint\n\n` +
        `1. **The 1-Extra-EMI Power:** Making just 1 extra EMI payment per year slashes a 20-year loan by ~4.5 years.\n` +
        `2. **Partial Lump-Sum Strategy:** Direct annual bonuses toward principal prepayments in the first 5 years when the interest component is highest.\n` +
        `3. **Lower Rates:** Refinance with balance transfers if your score has risen above 780.`
    };
  }

  return {
    provider: "BFSI Advisory Engine",
    advice: `### Institutional Borrowing Best Practices\n\n` +
      `• **Prudent 50% Rule:** Never allow all combined EMIs to exceed 50% of your verifiable net monthly salary.\n` +
      `• **Credit Health:** Consistently maintain credit card utilization under 30% to safeguard your 750+ score.\n` +
      `• **Emergency Buffer:** Reserve at least 6 months of living expenses before taking on long-term obligations.`
  };
}

// ============================================================================
// PAGE SPECIFIC INITIALIZERS
// ============================================================================

// 1. LOAN ELIGIBILITY CHECKER PAGE
function initEligibilityModule() {
  const form = document.getElementById("eligibilityForm");
  if (!form) return;

  const salaryInput = document.getElementById("monthlySalary");
  const salarySlider = document.getElementById("salarySlider");
  const scoreInput = document.getElementById("creditScore");
  const scoreSlider = document.getElementById("scoreSlider");
  const emiInput = document.getElementById("existingEmi");
  const emiSlider = document.getElementById("emiSlider");
  const ageInput = document.getElementById("applicantAge");
  const ageSlider = document.getElementById("ageSlider");

  // Sync inputs with range sliders
  function bindSync(input, slider) {
    if (!input || !slider) return;
    input.addEventListener("input", () => {
      slider.value = input.value;
    });
    slider.addEventListener("input", () => {
      input.value = slider.value;
    });
  }

  bindSync(salaryInput, salarySlider);
  bindSync(scoreInput, scoreSlider);
  bindSync(emiInput, emiSlider);
  bindSync(ageInput, ageSlider);

  // Preset chips for salary
  document.querySelectorAll(".salary-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const val = chip.getAttribute("data-val");
      salaryInput.value = val;
      salarySlider.value = val;
      document.querySelectorAll(".salary-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
    });
  });

  // Handle form submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector("button[type='submit']");
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Analyzing Financial Profile...`;
    submitBtn.disabled = true;

    const applicantName = document.getElementById("applicantName").value.trim() || "Applicant";
    const salary = parseFloat(salaryInput.value) || 0;
    const creditScore = parseInt(scoreInput.value, 10) || 0;
    const existingEmi = parseFloat(emiInput.value) || 0;
    const age = parseInt(ageInput.value, 10) || 0;

    let evaluation = null;
    let aiReasoning = null;
    let serverSynced = false;

    // Try Flask API if available
    try {
      const res = await fetch("/api/check-eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicant_name: applicantName,
          monthly_salary: salary,
          credit_score: creditScore,
          existing_emi: existingEmi,
          age: age
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          evaluation = json.data;
          aiReasoning = { provider: json.data.ai_provider, advice: json.data.ai_reasoning };
          serverSynced = true;
        }
      }
    } catch (err) {
      console.log("Backend not detected or offline, executing client-side financial engine:", err);
    }

    // Fallback to client-side engine if server not available
    if (!evaluation) {
      evaluation = evaluateEligibilityClient(salary, creditScore, existingEmi, age);
      evaluation.applicant_name = applicantName;
      evaluation.monthly_salary = salary;
      evaluation.credit_score = creditScore;
      evaluation.existing_emi = existingEmi;
      evaluation.age = age;
      evaluation.status = evaluation.is_eligible ? "APPROVED" : "REJECTED";
      evaluation.timestamp = new Date().toLocaleString();

      aiReasoning = await generateAIAdvice("Evaluate this loan profile", evaluation);
      evaluation.ai_provider = aiReasoning.provider;
      evaluation.ai_reasoning = aiReasoning.advice;

      // Save locally
      saveLocalRecord(evaluation);

      // Send to Google Sheets if configured
      sendToGoogleAppsScript(evaluation);
    }

    // Render results
    renderEligibilityResult(evaluation, aiReasoning);

    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;

    showToast(
      evaluation.is_eligible ? "Congratulations! Loan Approved!" : "Assessment Complete: Profile Did Not Qualify",
      evaluation.is_eligible ? "success" : "error"
    );
  });
}

function renderEligibilityResult(data, aiData) {
  const resultContainer = document.getElementById("eligibilityResultContainer");
  if (!resultContainer) return;

  const isApproved = data.is_eligible;

  let checklistHtml = "";
  if (data.passed_checks) {
    data.passed_checks.forEach(chk => {
      checklistHtml += `
        <li class="rule-check-item passed">
          <i class="fa-solid fa-circle-check rule-icon"></i>
          <div>${chk}</div>
        </li>
      `;
    });
  }
  if (data.rejection_reasons) {
    data.rejection_reasons.forEach(rsn => {
      checklistHtml += `
        <li class="rule-check-item failed">
          <i class="fa-solid fa-circle-xmark rule-icon"></i>
          <div>${rsn}</div>
        </li>
      `;
    });
  }

  resultContainer.innerHTML = `
    <div class="result-card ${isApproved ? 'approved' : 'rejected'} glass-card-glow">
      <div class="result-header">
        <div class="result-status-box">
          <div class="result-icon-circle">
            <i class="fa-solid ${isApproved ? 'fa-check' : 'fa-xmark'}"></i>
          </div>
          <div>
            <div class="result-title">${isApproved ? 'Loan Approved' : 'Application Not Approved'}</div>
            <span class="badge ${isApproved ? 'badge-approved' : 'badge-rejected'}">
              ${data.risk_classification || (isApproved ? 'Prime Borrower' : 'High Risk')}
            </span>
          </div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="window.print()">
          <i class="fa-solid fa-print"></i> Print
        </button>
      </div>

      <div class="result-amount-display">
        <div class="result-amount-label">
          ${isApproved ? 'Maximum Eligible Loan Sanction' : 'Eligible Amount Approved'}
        </div>
        <div class="result-amount-value">
          ${isApproved ? formatINR(data.eligible_amount) : '₹0'}
        </div>
        <div class="form-hint" style="justify-content: center; margin-top: 0.5rem;">
          <i class="fa-solid fa-calculator"></i>
          ${isApproved ? 'Formula: Monthly Salary (₹' + data.monthly_salary.toLocaleString('en-IN') + ') × 20' : 'Requirements not met'}
        </div>
      </div>

      <div class="stats-mini-grid">
        <div class="stat-mini-card">
          <div class="stat-mini-label">FOIR (Debt-to-Income)</div>
          <div class="stat-mini-val">${data.foir_percentage}%</div>
          <div class="form-hint">${data.foir_percentage < 40 ? 'Healthy Buffer' : 'Elevated Burden'}</div>
        </div>
        <div class="stat-mini-card">
          <div class="stat-mini-label">Max New Monthly EMI</div>
          <div class="stat-mini-val">${formatINR(data.max_repayment_capacity)}</div>
          <div class="form-hint">50% Income Ceiling Cap</div>
        </div>
      </div>

      <h4 style="font-size: 0.95rem; margin-bottom: 0.75rem; color: #fff;">
        <i class="fa-solid fa-list-check" style="color: var(--secondary); margin-right: 0.4rem;"></i>
        Rule-Based Criteria Evaluation:
      </h4>
      <ul class="rule-checklist">
        ${checklistHtml}
      </ul>

      <div class="ai-insight-box">
        <div class="ai-insight-header">
          <span class="ai-tag">
            <i class="fa-solid fa-wand-magic-sparkles"></i>
            ${aiData ? aiData.provider : 'AI Financial Reasoning'}
          </span>
          <span class="badge badge-info"><i class="fa-solid fa-microchip"></i> Underwriting AI</span>
        </div>
        <div class="ai-insight-text">
          ${formatMarkdownToHtml(aiData ? aiData.advice : data.ai_reasoning || "Evaluation processed.")}
        </div>
      </div>

      <div style="margin-top: 1.5rem; display: flex; gap: 0.75rem; flex-wrap: wrap;">
        <a href="emi-calculator.html?amount=${data.eligible_amount || 500000}" class="btn btn-primary btn-sm">
          <i class="fa-solid fa-calculator"></i> Plan EMI for this Sanction
        </a>
        <a href="ai-advisor.html" class="btn btn-secondary btn-sm">
          <i class="fa-solid fa-robot"></i> Ask AI Advisor
        </a>
      </div>
    </div>
  `;

  // Scroll smoothly to results
  resultContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// 2. CREDIT SCORE ANALYZER PAGE
function initCreditScoreModule() {
  const form = document.getElementById("creditAnalyzerForm");
  const scoreInput = document.getElementById("analyzerScoreInput");
  const scoreSlider = document.getElementById("analyzerScoreSlider");

  if (!scoreInput || !scoreSlider) return;

  function updateScore(score) {
    score = Math.min(900, Math.max(300, parseInt(score, 10) || 700));
    scoreInput.value = score;
    scoreSlider.value = score;
    renderCreditScoreVisuals(score);
  }

  scoreInput.addEventListener("input", () => updateScore(scoreInput.value));
  scoreSlider.addEventListener("input", () => updateScore(scoreSlider.value));

  document.querySelectorAll(".score-preset-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const val = chip.getAttribute("data-score");
      updateScore(val);
      document.querySelectorAll(".score-preset-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
    });
  });

  // Initial trigger
  updateScore(scoreInput.value || 750);
}

function renderCreditScoreVisuals(score) {
  const analysis = analyzeCreditScoreClient(score);

  // SVG Gauge calculation
  // Total circumference for r=90 is 2 * PI * 90 = 565.48
  const maxScore = 900;
  const minScore = 300;
  const percentage = (score - minScore) / (maxScore - minScore);
  const totalOffset = 565.48;
  const targetOffset = totalOffset - (percentage * totalOffset);

  const gaugeFill = document.getElementById("gaugeFillCircle");
  const scoreValDisplay = document.getElementById("gaugeScoreValue");
  const tierDisplay = document.getElementById("gaugeScoreTier");

  if (gaugeFill) {
    gaugeFill.style.strokeDashoffset = targetOffset;
    if (analysis.category === "Excellent") {
      gaugeFill.style.stroke = "var(--success)";
    } else if (analysis.category === "Good") {
      gaugeFill.style.stroke = "var(--warning)";
    } else {
      gaugeFill.style.stroke = "var(--danger)";
    }
  }

  if (scoreValDisplay) scoreValDisplay.textContent = score;
  if (tierDisplay) {
    tierDisplay.textContent = `${analysis.category} (${analysis.rating})`;
    tierDisplay.className = `gauge-score-tier tier-${analysis.category.toLowerCase()}`;
  }

  // Update Analysis Cards
  const oddsEl = document.getElementById("creditApprovalOdds");
  if (oddsEl) oddsEl.textContent = analysis.approval_odds;

  const rateEl = document.getElementById("creditInterestRange");
  if (rateEl) rateEl.textContent = analysis.interest_rate_range;

  const percEl = document.getElementById("creditPercentile");
  if (percEl) percEl.textContent = `Top ${100 - analysis.percentile}% of borrowers`;

  // Update recommendations list
  const listEl = document.getElementById("creditRecommendationsList");
  if (listEl) {
    listEl.innerHTML = analysis.recommendations.map(rec => `
      <li class="rule-check-item passed">
        <i class="fa-solid fa-circle-check" style="color: ${analysis.category === 'Excellent' ? 'var(--success)' : analysis.category === 'Good' ? 'var(--warning)' : 'var(--danger)'}"></i>
        <div>${rec}</div>
      </li>
    `).join("");
  }
}

// 3. EMI CALCULATOR MODULE
function initEmiModule() {
  const amountInput = document.getElementById("emiAmountInput");
  const amountSlider = document.getElementById("emiAmountSlider");
  const rateInput = document.getElementById("emiRateInput");
  const rateSlider = document.getElementById("emiRateSlider");
  const tenureInput = document.getElementById("emiTenureInput");
  const tenureSlider = document.getElementById("emiTenureSlider");

  if (!amountInput || !rateInput || !tenureInput) return;

  // Check URL parameters for preset loan sanction from eligibility module
  const urlParams = new URLSearchParams(window.location.search);
  const paramAmount = urlParams.get("amount");
  if (paramAmount && !isNaN(paramAmount) && Number(paramAmount) > 0) {
    amountInput.value = paramAmount;
    if (amountSlider) amountSlider.value = paramAmount;
  }

  function bindInputSync(input, slider, callback) {
    if (!input || !slider) return;
    input.addEventListener("input", () => {
      slider.value = input.value;
      callback();
    });
    slider.addEventListener("input", () => {
      input.value = slider.value;
      callback();
    });
  }

  function updateEmiCalculations() {
    const P = parseFloat(amountInput.value) || 500000;
    const R = parseFloat(rateInput.value) || 10.5;
    const N = parseInt(tenureInput.value, 10) || 36;

    const result = calculateEmiClient(P, R, N);

    // Display values
    document.getElementById("emiValueDisplay").textContent = formatINR(result.emi);
    document.getElementById("emiPrincipalDisplay").textContent = formatINR(result.principal);
    document.getElementById("emiInterestDisplay").textContent = formatINR(result.total_interest);
    document.getElementById("emiTotalDisplay").textContent = formatINR(result.total_payment);

    // Update Ratio Bar
    const principalBar = document.getElementById("emiPrincipalBar");
    const interestBar = document.getElementById("emiInterestBar");
    if (principalBar && interestBar) {
      principalBar.style.width = `${result.principal_ratio}%`;
      interestBar.style.width = `${result.interest_ratio}%`;
      principalBar.title = `Principal: ${result.principal_ratio}%`;
      interestBar.title = `Interest: ${result.interest_ratio}%`;
    }

    // Render Amortization Schedule Table
    renderAmortizationTable(result.amortization);
  }

  bindInputSync(amountInput, amountSlider, updateEmiCalculations);
  bindInputSync(rateInput, rateSlider, updateEmiCalculations);
  bindInputSync(tenureInput, tenureSlider, updateEmiCalculations);

  // Preset chips for Loan Amount
  document.querySelectorAll(".emi-amount-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const val = chip.getAttribute("data-val");
      amountInput.value = val;
      if (amountSlider) amountSlider.value = val;
      document.querySelectorAll(".emi-amount-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      updateEmiCalculations();
    });
  });

  // Preset chips for Tenure
  document.querySelectorAll(".emi-tenure-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const val = chip.getAttribute("data-val");
      tenureInput.value = val;
      if (tenureSlider) tenureSlider.value = val;
      document.querySelectorAll(".emi-tenure-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      updateEmiCalculations();
    });
  });

  // Export to CSV button
  const exportBtn = document.getElementById("exportEmiCsvBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const P = parseFloat(amountInput.value) || 500000;
      const R = parseFloat(rateInput.value) || 10.5;
      const N = parseInt(tenureInput.value, 10) || 36;
      const result = calculateEmiClient(P, R, N);
      downloadAmortizationCSV(result);
    });
  }

  // Initial calculation
  updateEmiCalculations();
}

function renderAmortizationTable(schedule) {
  const tbody = document.getElementById("amortizationTableBody");
  if (!tbody) return;

  if (!schedule || schedule.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No schedule data available</td></tr>`;
    return;
  }

  tbody.innerHTML = schedule.map(row => `
    <tr>
      <td>Month ${row.month}</td>
      <td>${formatINR(row.emi)}</td>
      <td style="color: var(--primary);">${formatINR(row.principal)}</td>
      <td style="color: var(--secondary);">${formatINR(row.interest)}</td>
      <td>${formatINR(row.remaining_balance)}</td>
    </tr>
  `).join("");
}

function downloadAmortizationCSV(result) {
  let csvContent = "data:text/csv;charset=utf-8,Month,EMI (INR),Principal (INR),Interest (INR),Remaining Balance (INR)\n";
  result.amortization.forEach(r => {
    csvContent += `${r.month},${r.emi},${r.principal},${r.interest},${r.remaining_balance}\n`;
  });
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `loan_amortization_${result.principal}_${result.tenure_months}m.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("Amortization schedule exported to CSV!", "success");
}

// 4. AI ADVISOR CHAT MODULE
function initAiAdvisorModule() {
  const chatMessages = document.getElementById("chatMessages");
  const chatInput = document.getElementById("chatInput");
  const sendBtn = document.getElementById("chatSendBtn");

  if (!chatMessages || !chatInput || !sendBtn) return;

  function appendMessage(sender, htmlContent) {
    const isUser = sender === "user";
    const bubble = document.createElement("div");
    bubble.className = `message-bubble ${isUser ? 'message-user' : 'message-ai'}`;
    bubble.innerHTML = `
      <div class="message-avatar">
        <i class="fa-solid ${isUser ? 'fa-user' : 'fa-robot'}"></i>
      </div>
      <div class="message-content">
        ${htmlContent}
      </div>
    `;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return bubble;
  }

  async function handleSend(text) {
    const query = text || chatInput.value.trim();
    if (!query) return;

    chatInput.value = "";
    appendMessage("user", escapeHtml(query));

    const loadingBubble = appendMessage("ai", `
      <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-muted);">
        <i class="fa-solid fa-spinner fa-spin"></i> Analyzing financial scenario...
      </div>
    `);

    try {
      // Try backend first
      let answer = null;
      try {
        const resp = await fetch("/api/ai-advisor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: query })
        });
        if (resp.ok) {
          const json = await resp.json();
          if (json.success) answer = json.answer;
        }
      } catch (e) {
        // backend unavailable
      }

      // Fallback to client AI generator
      if (!answer) {
        const aiRes = await generateAIAdvice(query);
        answer = aiRes.advice;
      }

      loadingBubble.querySelector(".message-content").innerHTML = formatMarkdownToHtml(answer);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (err) {
      loadingBubble.querySelector(".message-content").innerHTML = `
        <span style="color: var(--danger);">An error occurred while generating advice. Please try again.</span>
      `;
    }
  }

  sendBtn.addEventListener("click", () => handleSend());
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  });

  // Prompt chips
  document.querySelectorAll(".prompt-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const prompt = chip.getAttribute("data-prompt");
      handleSend(prompt);
    });
  });
}

// 5. RECORDS & HISTORY MODULE
function initHistoryModule() {
  const tableBody = document.getElementById("recordsTableBody");
  if (!tableBody) return;

  async function loadRecords() {
    let records = [];

    // Try backend
    try {
      const res = await fetch("/api/records");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.records) records = json.records;
      }
    } catch (e) {
      // fallback to local storage
    }

    if (records.length === 0) {
      records = getLocalRecords();
    }

    const filterStatus = document.getElementById("filterStatusSelect")?.value || "ALL";
    const filtered = records.filter(r => {
      if (filterStatus === "ALL") return true;
      return r.status === filterStatus;
    });

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            <i class="fa-solid fa-folder-open" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
            No loan evaluations recorded yet. Run a check on the Loan Eligibility Checker page!
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = filtered.map(r => `
      <tr>
        <td>${r.timestamp || 'N/A'}</td>
        <td style="font-weight: 600; color: #fff;">${escapeHtml(r.applicant_name || 'N/A')}</td>
        <td>${formatINR(r.monthly_salary)}</td>
        <td><span class="badge ${r.credit_score >= 750 ? 'badge-success' : r.credit_score >= 650 ? 'badge-warning' : 'badge-danger'}">${r.credit_score}</span></td>
        <td>${formatINR(r.existing_emi)}</td>
        <td>
          <span class="badge ${r.status === 'APPROVED' ? 'badge-approved' : 'badge-rejected'}">
            ${r.status}
          </span>
        </td>
        <td style="font-weight: 700; color: ${r.status === 'APPROVED' ? 'var(--success)' : 'var(--danger)'}">
          ${r.status === 'APPROVED' ? formatINR(r.eligible_amount) : '₹0'}
        </td>
      </tr>
    `).join("");
  }

  const filterSelect = document.getElementById("filterStatusSelect");
  if (filterSelect) {
    filterSelect.addEventListener("change", loadRecords);
  }

  const exportBtn = document.getElementById("exportRecordsCsvBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const records = getLocalRecords();
      if (records.length === 0) {
        showToast("No records to export", "error");
        return;
      }
      let csv = "data:text/csv;charset=utf-8,Timestamp,Applicant Name,Monthly Salary,Credit Score,Existing EMI,Age,Status,Eligible Amount,Risk Level\n";
      records.forEach(r => {
        csv += `"${r.timestamp}","${r.applicant_name}",${r.monthly_salary},${r.credit_score},${r.existing_emi},${r.age},"${r.status}",${r.eligible_amount},"${r.risk_classification}"\n`;
      });
      const encodedUri = encodeURI(csv);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `loan_applications_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("Loan applications exported to CSV!", "success");
    });
  }

  const clearBtn = document.getElementById("clearRecordsBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to clear local application records?")) {
        localStorage.removeItem(STORAGE_KEYS.RECORDS);
        loadRecords();
        showToast("Local records cleared", "info");
      }
    });
  }

  loadRecords();
}

// 6. SETTINGS MODAL (GROQ, CLAUDE & GOOGLE SHEETS)
function initSettingsModal() {
  const modal = document.getElementById("settingsModal");
  const openBtn = document.getElementById("openSettingsBtn");
  const closeBtn = document.getElementById("closeSettingsBtn");
  const saveBtn = document.getElementById("saveSettingsBtn");

  if (!modal) return;

  function loadInputs() {
    const settings = getSettings();
    const groqKeyInput = document.getElementById("settingGroqKey");
    const claudeKeyInput = document.getElementById("settingClaudeKey");
    const sheetsUrlInput = document.getElementById("settingSheetsUrl");

    if (groqKeyInput) groqKeyInput.value = settings.groqApiKey || "";
    if (claudeKeyInput) claudeKeyInput.value = settings.claudeApiKey || "";
    if (sheetsUrlInput) sheetsUrlInput.value = settings.googleAppsScriptUrl || "";
  }

  if (openBtn) {
    openBtn.addEventListener("click", () => {
      loadInputs();
      modal.classList.add("active");
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.classList.remove("active");
    });
  }

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("active");
  });

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const groqKey = document.getElementById("settingGroqKey")?.value.trim() || "";
      const claudeKey = document.getElementById("settingClaudeKey")?.value.trim() || "";
      const sheetsUrl = document.getElementById("settingSheetsUrl")?.value.trim() || "";

      saveSettings({
        groqApiKey: groqKey,
        claudeApiKey: claudeKey,
        googleAppsScriptUrl: sheetsUrl
      });

      modal.classList.remove("active");
      showToast("API & Google Sheets settings saved successfully!", "success");
    });
  }
}

// Utilities
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatMarkdownToHtml(markdownText) {
  if (!markdownText) return "";
  let html = markdownText
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/### (.*?)\n/g, '<h3 style="color: #38bdf8; margin: 0.5rem 0;">$1</h3>')
    .replace(/## (.*?)\n/g, '<h2 style="color: #38bdf8; margin: 0.6rem 0;">$1</h2>')
    .replace(/\n\n/g, '<p style="margin-bottom: 0.5rem;"></p>')
    .replace(/• (.*?)\n/g, '<li style="margin-bottom: 0.25rem;">$1</li>')
    .replace(/\n/g, '<br/>');
  return html;
}

// Global Mobile Menu Toggle
function initMobileMenu() {
  const btn = document.querySelector(".mobile-menu-btn");
  const navLinks = document.querySelector(".nav-links");
  if (btn && navLinks) {
    btn.addEventListener("click", () => {
      navLinks.classList.toggle("mobile-open");
    });
  }
}

// DOM Ready initialization
document.addEventListener("DOMContentLoaded", () => {
  initMobileMenu();
  initSettingsModal();
  initEligibilityModule();
  initCreditScoreModule();
  initEmiModule();
  initAiAdvisorModule();
  initHistoryModule();
});
