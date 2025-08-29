// Withdrawal Simulator functionality
class SimulatorController {
  constructor(app) {
    this.app = app;
    this.initSimulator();
  }

  initSimulator() {
    this.setupSimulatorEvents();
    this.updateSimulation();
  }

  setupSimulatorEvents() {
    const monthsSlider = document.getElementById("simulatorMonths");
    const monthsValue = document.getElementById("monthsValue");

    if (monthsSlider && monthsValue) {
      monthsSlider.addEventListener("input", (e) => {
        const months = parseInt(e.target.value);
        monthsValue.textContent = months;
        this.updateSimulation(months);
      });
    }
  }

  updateSimulation(overrideMonths = null) {
    const actualMonths = Object.keys(this.app.userData.deposits).length;
    const simulatedMonths =
      overrideMonths !== null ? overrideMonths : actualMonths;

    // Calculate simulated deposits and interest
    const { deposited, interest } =
      this.calculateSimulatedValues(simulatedMonths);

    // Calculate penalty and total
    const isEarlyWithdrawal = simulatedMonths < 12;
    const penalty = isEarlyWithdrawal ? deposited * 0.1 : 0;
    const interestToKeep = isEarlyWithdrawal ? 0 : interest;
    const total = deposited + interestToKeep - penalty;

    // Update UI
    this.updateSimulationDisplay(
      deposited,
      interest,
      penalty,
      total,
      isEarlyWithdrawal
    );

    // Update slider if not manually set
    if (overrideMonths === null) {
      const slider = document.getElementById("simulatorMonths");
      const valueDisplay = document.getElementById("monthsValue");
      if (slider && valueDisplay) {
        slider.value = actualMonths;
        valueDisplay.textContent = actualMonths;
      }
    }
  }

  calculateSimulatedValues(months) {
    const deposits = Object.values(this.app.userData.deposits)
      .slice(0, months)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    let totalDeposited = 0;
    let totalInterest = 0;
    const monthlyRate = 0.045 / 12;

    deposits.forEach((deposit, index) => {
      totalDeposited += deposit.amount;
      // Calculate interest for this deposit over the remaining months
      const monthsEarning = months - index;
      totalInterest += deposit.amount * monthlyRate * monthsEarning;
    });

    return {
      deposited: totalDeposited,
      interest: totalInterest,
    };
  }

  updateSimulationDisplay(
    deposited,
    interest,
    penalty,
    total,
    isEarlyWithdrawal
  ) {
    // Update breakdown values
    document.getElementById("simDeposited").textContent = `$${deposited.toFixed(
      0
    )}`;
    document.getElementById("simInterest").textContent = `$${interest.toFixed(
      2
    )}`;
    document.getElementById("simPenalty").textContent = `-$${penalty.toFixed(
      0
    )}`;
    document.getElementById("simTotal").textContent = `$${total.toFixed(2)}`;

    // Show/hide penalty row
    const penaltyRow = document.getElementById("penaltyRow");
    if (penaltyRow) {
      penaltyRow.style.display = isEarlyWithdrawal ? "flex" : "none";
    }

    // Update withdrawal status
    const statusElement = document.getElementById("withdrawalStatus");
    if (statusElement) {
      statusElement.className = "withdrawal-status";

      if (isEarlyWithdrawal) {
        statusElement.classList.add("penalty");
        statusElement.innerHTML = `
                    <span class="status-text">Early withdrawal - penalty applies</span>
                `;
      } else {
        statusElement.classList.add("eligible");
        statusElement.innerHTML = `
                    <span class="status-text">✓ Eligible for full withdrawal with interest!</span>
                `;
      }
    }
  }

  calculateOptimalStrategy() {
    const currentMonths = Object.keys(this.app.userData.deposits).length;
    const avgDeposit =
      this.app.userData.totalDeposited / Math.max(1, currentMonths);

    const scenarios = [];

    // Current withdrawal
    const current = this.calculateSimulatedValues(currentMonths);
    scenarios.push({
      name: "Withdraw Now",
      months: currentMonths,
      total:
        current.deposited -
        (currentMonths < 12 ? current.deposited * 0.1 : 0) +
        (currentMonths >= 12 ? current.interest : 0),
    });

    // Wait until eligible
    if (currentMonths < 12) {
      const eligible = this.calculateSimulatedValues(12);
      const projectedDeposits =
        current.deposited + avgDeposit * (12 - currentMonths);
      scenarios.push({
        name: "Wait Until Eligible",
        months: 12,
        total: projectedDeposits + eligible.interest,
      });
    }

    return scenarios;
  }
}

// Initialize simulator when app is ready
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    if (window.vaultScoreApp) {
      window.simulatorController = new SimulatorController(
        window.vaultScoreApp
      );

      // Update simulator when switching to simulator tab
      const originalUpdateUI = window.vaultScoreApp.updateUI;
      window.vaultScoreApp.updateUI = function () {
        originalUpdateUI.call(this);
        if (this.currentTab === "simulator" && window.simulatorController) {
          window.simulatorController.updateSimulation();
        }
      };
    }
  }, 100);
});
