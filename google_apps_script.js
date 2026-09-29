/**
 * ============================================================================
 * AI LOAN ELIGIBILITY CHECKER - GOOGLE APPS SCRIPT WEB APP ENDPOINT
 * ============================================================================
 * 
 * Instructions for Setup in Google Sheets:
 * 1. Open Google Sheets (https://sheets.new) and name your sheet "AI Loan Applications".
 * 2. Click "Extensions" -> "Apps Script".
 * 3. Delete any code in the editor, and paste this entire file content.
 * 4. Click "Save" (disk icon).
 * 5. Click "Deploy" -> "New deployment".
 * 6. Click the gear icon next to "Select type" and choose "Web app".
 * 7. Configure:
 *    - Description: AI Loan Eligibility Endpoint
 *    - Execute as: Me (your Google account)
 *    - Who has access: Anyone (required for frontend fetch/webhook)
 * 8. Click "Deploy" and authorize access when prompted.
 * 9. Copy the generated "Web App URL" (ends in /exec).
 * 10. Paste this URL into your .env file as GOOGLE_APPS_SCRIPT_URL or directly
 *     in the AI Loan Eligibility Checker UI Settings modal!
 */

function setupSheet(sheet) {
  const headers = [
    "Timestamp",
    "Applicant Name",
    "Monthly Salary (₹)",
    "Credit Score",
    "Existing EMI (₹)",
    "Age",
    "Eligibility Status",
    "Eligible Loan Amount (₹)",
    "Risk Classification",
    "Max Monthly Repayment (₹)",
    "AI Recommendations / Remarks"
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#1e293b");
    headerRange.setFontColor("#f8fafc");
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
    
    // Auto-fit columns
    for (let i = 1; i <= headers.length; i++) {
      sheet.autoResizeColumn(i);
    }
  }
}

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("Applications");
    if (!sheet) {
      sheet = ss.insertSheet("Applications");
    }
    
    setupSheet(sheet);

    let data;
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter;
      }
    } else {
      data = e.parameter;
    }

    const timestamp = data.timestamp || new Date().toISOString();
    const applicantName = data.applicant_name || data.name || "N/A";
    const monthlySalary = Number(data.monthly_salary || data.salary || 0);
    const creditScore = Number(data.credit_score || 0);
    const existingEmi = Number(data.existing_emi || 0);
    const age = Number(data.age || 0);
    const status = data.status || (data.is_eligible ? "APPROVED" : "REJECTED");
    const eligibleAmount = Number(data.eligible_amount || 0);
    const riskLevel = data.risk_level || data.risk_classification || "Moderate";
    const maxRepayment = Number(data.max_monthly_repayment || (monthlySalary * 0.5 - existingEmi));
    const recommendations = data.recommendations || data.reason || data.ai_reasoning || "Standard assessment completed.";

    sheet.appendRow([
      timestamp,
      applicantName,
      monthlySalary,
      creditScore,
      existingEmi,
      age,
      status,
      eligibleAmount,
      riskLevel,
      maxRepayment,
      recommendations
    ]);

    const lastRow = sheet.getLastRow();
    
    // Color-code the status cell
    const statusCell = sheet.getRange(lastRow, 7);
    if (status.toUpperCase().includes("APPROV")) {
      statusCell.setBackground("#dcfce7");
      statusCell.setFontColor("#15803d");
    } else {
      statusCell.setBackground("#fee2e2");
      statusCell.setFontColor("#b91c1c");
    }

    const response = {
      success: true,
      message: "Loan application successfully recorded to Google Sheet",
      row: lastRow,
      data: {
        applicantName: applicantName,
        status: status,
        eligibleAmount: eligibleAmount
      }
    };

    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    const errorResponse = {
      success: false,
      error: error.toString()
    };
    return ContentService
      .createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Applications");
  if (!sheet) {
    sheet = ss.insertSheet("Applications");
  }
  setupSheet(sheet);

  const totalRows = Math.max(0, sheet.getLastRow() - 1);
  const response = {
    status: "online",
    service: "AI Loan Eligibility Checker Apps Script",
    sheetName: ss.getName(),
    totalApplications: totalRows,
    timestamp: new Date().toISOString()
  };

  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}
