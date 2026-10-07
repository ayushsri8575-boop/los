let currentStep = 1;
const totalSteps = 7;
let globalAppId = null;

let currentRole = "applicant";
let generatedDummyOtp = null;
let sessionUserMobile = "";

let appData = {
  applicantName: "",
  applicantEmail: "",
  applicantPhone: "",
  employmentType: "",
  monthlyIncome: 0,
  requestedAmount: 0,
  loanTenure: 0,
  creditScore: 0,
  existingDebt: 0,
  interestRate: 0,
  calculatedEmi: 0,
  calculatedDti: 0
};

document.addEventListener("DOMContentLoaded", () => {
  bindFormInputs();

  const resetBtn = document.getElementById("btnResetAll");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      resetWholeSystem();
    });
  }
});

function switchLoginRole(role) {
  currentRole = role;
  document.getElementById("btnRoleUser").classList.toggle("active", role === "applicant");
  document.getElementById("btnRoleAdmin").classList.toggle("active", role === "admin");
}

function handleSendOtp() {
  const mobileInput = document.getElementById("loginMobile").value.trim();

  if (mobileInput.length !== 10 || isNaN(mobileInput)) {
    alert("Please enter a valid 10-digit mobile number.");
    return;
  }

  sessionUserMobile = mobileInput;
  generatedDummyOtp = Math.floor(1000 + Math.random() * 9000).toString();

  document.getElementById("phoneLoginForm").classList.add("hidden-view");
  document.getElementById("otpVerifyForm").classList.remove("hidden-view");
  document.getElementById("dispTargetMobile").innerText = `+91 ${sessionUserMobile}`;

  alert(`[CrediFlow SMS Gateway]\nYour Verification Code is: ${generatedDummyOtp}`);
}

function resetToPhoneStep() {
  document.getElementById("otpVerifyForm").classList.add("hidden-view");
  document.getElementById("phoneLoginForm").classList.remove("hidden-view");
  document.getElementById("inputOtpCode").value = "";
}

function handleVerifyOtp() {
  const enteredOtp = document.getElementById("inputOtpCode").value.trim();

  if (enteredOtp !== generatedDummyOtp) {
    alert("Invalid OTP code. Please enter the 4-digit code shown in the alert.");
    return;
  }

  document.getElementById("authSection").classList.add("hidden-view");

  if (currentRole === "applicant") {
    document.getElementById("applicantPortal").classList.remove("hidden-view");
    document.getElementById("dispUserMobile").innerText = `+91 ${sessionUserMobile}`;
    document.getElementById("applicantPhone").value = sessionUserMobile;
    initNewApplication();
  } else {
    document.getElementById("adminPortal").classList.remove("hidden-view");
    document.getElementById("dispAdminMobile").innerText = `+91 ${sessionUserMobile}`;
  }
}

function logoutSession() {
  document.getElementById("applicantPortal").classList.add("hidden-view");
  document.getElementById("adminPortal").classList.add("hidden-view");
  document.getElementById("authSection").classList.remove("hidden-view");

  resetToPhoneStep();
  document.getElementById("loginMobile").value = "";
  sessionUserMobile = "";
  generatedDummyOtp = null;
}

function initNewApplication() {
  globalAppId = "LOS-2026-" + Math.floor(1000 + Math.random() * 9000);
  document.getElementById("displayAppId").innerText = globalAppId;
  clearState();
  updateSidebar();
}

function clearState() {
  appData = {
    applicantName: "",
    applicantEmail: "",
    applicantPhone: sessionUserMobile,
    employmentType: "",
    monthlyIncome: 0,
    requestedAmount: 0,
    loanTenure: 0,
    creditScore: 0,
    existingDebt: 0,
    interestRate: 0,
    calculatedEmi: 0,
    calculatedDti: 0
  };
}

function resetWholeSystem() {
  document.getElementById("losMasterForm").reset();
  clearState();
  initNewApplication();
  document.getElementById("applicantPhone").value = sessionUserMobile;
  goToStep(1);

  document.getElementById("dispDtiRatio").innerText = "--%";
  document.getElementById("dispDtiStatus").innerText = "Awaiting Calculation";
  document.getElementById("dispCreditGrade").innerText = "--";
  document.getElementById("dispInterestRate").innerText = "--%";

  document.getElementById("disbursalDisplayAmt").innerText = "$0.00";
  document.getElementById("disbursalDisplayTerms").innerText = "-- Years @ --%";
  document.getElementById("disbursalDisplayEmi").innerText = "$0.00 / mo";

  alert("Application form reset to initial step.");
}

function bindFormInputs() {
  const syncInputs = [
    "applicantName",
    "monthlyIncome",
    "requestedAmount",
    "loanTenure",
    "cibilScore",
    "existingEmis",
    "employmentType"
  ];

  syncInputs.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", () => {
        readFormData();
        recalculateFinances();
        updateSidebar();
      });
      el.addEventListener("change", () => {
        readFormData();
        recalculateFinances();
        updateSidebar();
      });
    }
  });
}

function readFormData() {
  appData.applicantName = document.getElementById("applicantName").value.trim();
  appData.employmentType = document.getElementById("employmentType").value;
  appData.monthlyIncome = parseFloat(document.getElementById("monthlyIncome").value) || 0;
  appData.requestedAmount = parseFloat(document.getElementById("requestedAmount").value) || 0;
  appData.loanTenure = parseInt(document.getElementById("loanTenure").value) || 0;
  appData.creditScore = parseInt(document.getElementById("cibilScore").value) || 0;
  appData.existingDebt = parseFloat(document.getElementById("existingEmis").value) || 0;
}

function recalculateFinances() {
  if (appData.creditScore >= 780) {
    appData.interestRate = 9.85;
  } else if (appData.creditScore >= 720) {
    appData.interestRate = 10.50;
  } else if (appData.creditScore >= 650) {
    appData.interestRate = 12.25;
  } else if (appData.creditScore > 0) {
    appData.interestRate = 14.50;
  } else {
    appData.interestRate = 0;
  }

  const P = appData.requestedAmount;
  const annualR = appData.interestRate;
  const monthlyR = annualR / 12 / 100;
  const N = appData.loanTenure * 12;

  if (P > 0 && N > 0 && monthlyR > 0) {
    const factor = Math.pow(1 + monthlyR, N);
    appData.calculatedEmi = Math.round((P * monthlyR * factor) / (factor - 1));
  } else {
    appData.calculatedEmi = 0;
  }

  if (appData.monthlyIncome > 0 && appData.calculatedEmi > 0) {
    const totalObligations = appData.existingDebt + appData.calculatedEmi;
    appData.calculatedDti = ((totalObligations / appData.monthlyIncome) * 100).toFixed(1);
  } else {
    appData.calculatedDti = 0;
  }

  const dtiDisplay = document.getElementById("dispDtiRatio");
  const dtiStatus = document.getElementById("dispDtiStatus");
  const gradeDisplay = document.getElementById("dispCreditGrade");
  const rateDisplay = document.getElementById("dispInterestRate");

  if (dtiDisplay) dtiDisplay.innerText = appData.calculatedDti > 0 ? `${appData.calculatedDti}%` : "--%";
  if (rateDisplay) rateDisplay.innerText = appData.interestRate > 0 ? `${appData.interestRate.toFixed(2)}%` : "--%";

  if (dtiStatus && gradeDisplay) {
    if (appData.calculatedDti === 0) {
      dtiStatus.innerText = "Awaiting Calculation";
      dtiStatus.style.color = "var(--text-muted)";
      gradeDisplay.innerText = "--";
    } else if (appData.calculatedDti <= 40) {
      dtiStatus.innerText = "Comfortable (<40%)";
      dtiStatus.style.color = "var(--accent)";
      gradeDisplay.innerText = "Grade A+";
    } else if (appData.calculatedDti <= 50) {
      dtiStatus.innerText = "Moderate (40-50%)";
      dtiStatus.style.color = "var(--warning)";
      gradeDisplay.innerText = "Grade B";
    } else {
      dtiStatus.innerText = "High Leverage (>50%)";
      dtiStatus.style.color = "var(--danger)";
      gradeDisplay.innerText = "Grade C (Subprime)";
    }
  }

  const finalSanction = document.getElementById("finalSanctionAmount");
  const finalRate = document.getElementById("finalInterestRate");
  const maxSanctionCap = document.getElementById("maxSanctionCap");

  if (finalSanction && !finalSanction.value && appData.requestedAmount > 0) {
    finalSanction.value = appData.requestedAmount;
  }
  if (maxSanctionCap && !maxSanctionCap.value && appData.requestedAmount > 0) {
    maxSanctionCap.value = appData.requestedAmount;
  }
  if (finalRate && !finalRate.value && appData.interestRate > 0) {
    finalRate.value = appData.interestRate.toFixed(2);
  }

  const disbursalDisplayAmt = document.getElementById("disbursalDisplayAmt");
  const disbursalDisplayTerms = document.getElementById("disbursalDisplayTerms");
  const disbursalDisplayEmi = document.getElementById("disbursalDisplayEmi");

  if (disbursalDisplayAmt) {
    disbursalDisplayAmt.innerText = appData.requestedAmount > 0 ? `$${appData.requestedAmount.toLocaleString("en-US")}` : "$0.00";
  }
  if (disbursalDisplayTerms) {
    disbursalDisplayTerms.innerText = appData.loanTenure > 0 && appData.interestRate > 0
      ? `${appData.loanTenure} Years @ ${appData.interestRate.toFixed(2)}%`
      : "-- Years @ --%";
  }
  if (disbursalDisplayEmi) {
    disbursalDisplayEmi.innerText = appData.calculatedEmi > 0 ? `$${appData.calculatedEmi.toLocaleString("en-US")} / mo` : "$0.00 / mo";
  }
}

function updateSidebar() {
  document.getElementById("sidebarName").innerText = appData.applicantName || "--";
  document.getElementById("sidebarEmp").innerText = appData.employmentType || "--";
  document.getElementById("sidebarCibil").innerText = appData.creditScore > 0 ? appData.creditScore : "--";
  document.getElementById("sidebarLoanAmt").innerText = appData.requestedAmount > 0 ? `$${appData.requestedAmount.toLocaleString("en-US")}` : "$0.00";
  document.getElementById("sidebarRate").innerText = appData.interestRate > 0 ? `${appData.interestRate.toFixed(2)}%` : "--%";
  document.getElementById("sidebarTenure").innerText = appData.loanTenure > 0 ? `${appData.loanTenure} Years` : "-- Years";
  document.getElementById("sidebarEmi").innerText = appData.calculatedEmi > 0 ? `$${appData.calculatedEmi.toLocaleString("en-US")}` : "$0.00";

  document.getElementById("sidebarCurrentStage").innerText = `${currentStep} of ${totalSteps}`;
}

function validateStage(stageNum) {
  readFormData();

  if (stageNum === 1) {
    if (!document.getElementById("applicantName").value.trim()) {
      alert("Please enter Applicant Full Name.");
      return false;
    }
    if (!document.getElementById("applicantEmail").value.trim()) {
      alert("Please enter a valid Email Address.");
      return false;
    }
    if (!document.getElementById("employmentType").value) {
      alert("Please select Employment Type.");
      return false;
    }
    if (appData.monthlyIncome < 1000) {
      alert("Monthly income must be at least $1,000.");
      return false;
    }
    if (appData.requestedAmount <= 0) {
      alert("Please enter valid Requested Loan Amount.");
      return false;
    }
    if (appData.loanTenure <= 0) {
      alert("Please select Loan Tenure.");
      return false;
    }
    if (appData.creditScore < 600) {
      alert("Credit score must be at least 600 to qualify.");
      return false;
    }
  }

  if (stageNum === 2) {
    const taxId = document.getElementById("panNumber").value.trim();
    const natId = document.getElementById("aadhaarNumber").value.trim();
    const addr = document.getElementById("currentAddress").value.trim();
    const purpose = document.getElementById("loanPurpose").value;

    if (!taxId || !natId || !addr || !purpose) {
      alert("Please fill in all mandatory application fields.");
      return false;
    }
  }

  if (stageNum === 3) {
    const officer = document.getElementById("processingOfficer").value.trim();
    if (!officer) {
      alert("Please assign a Processing Officer.");
      return false;
    }
  }

  if (stageNum === 5) {
    const underwriter = document.getElementById("underwriterName").value.trim();
    const approvedAmt = parseFloat(document.getElementById("finalSanctionAmount").value) || 0;
    if (!underwriter || approvedAmt <= 0) {
      alert("Please provide Underwriter Name and Approved Amount.");
      return false;
    }
  }

  if (stageNum === 6) {
    const amlPass = document.getElementById("qcAml").checked;
    const signPass = document.getElementById("qcDocSignature").checked;
    const pricingPass = document.getElementById("qcPricingPolicy").checked;
    const auditor = document.getElementById("qcAuditorId").value.trim();

    if (!auditor) {
      alert("Please provide QC Auditor Name & ID.");
      return false;
    }
    if (!amlPass || !signPass || !pricingPass) {
      alert("All compliance checkboxes must be verified and checked.");
      return false;
    }
  }

  return true;
}

function handleStageTransition(fromStep, toStep) {
  if (validateStage(fromStep)) {
    recalculateFinances();
    goToStep(toStep);
  }
}

function goToStep(step) {
  if (step < 1 || step > totalSteps) return;

  document.querySelectorAll(".form-stage").forEach((stage) => {
    stage.classList.remove("active");
  });
  document.getElementById(`stage-${step}`).classList.add("active");

  const stepItems = document.querySelectorAll(".step-item");
  stepItems.forEach((item) => {
    const itemStep = parseInt(item.getAttribute("data-step"));
    item.classList.remove("active", "completed");

    if (itemStep === step) {
      item.classList.add("active");
    } else if (itemStep < step) {
      item.classList.add("completed");
    }
  });

  currentStep = step;
  recalculateFinances();
  updateSidebar();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function finalizeDisbursement() {
  const bank = document.getElementById("bankName").value.trim();
  const acc = document.getElementById("accountNumber").value.trim();
  const ifsc = document.getElementById("ifscCode").value.trim();

  if (!bank || !acc || !ifsc) {
    alert("Please complete beneficiary banking details before funding.");
    return;
  }

  const generatedUtr = "UTR-" + Math.floor(100000000000 + Math.random() * 900000000000);
  document.getElementById("utrNumber").innerText = generatedUtr;
  document.getElementById("successModal").classList.add("open");
}

function closeModalAndPrint() {
  document.getElementById("successModal").classList.remove("open");
  window.print();
}