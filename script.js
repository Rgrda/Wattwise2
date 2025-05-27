document.addEventListener("DOMContentLoaded", () => {
  const constantContainer = document.getElementById("constant-appliances");
  const flexContainer = document.getElementById("appliance-list");

  const addConstantBtn = document.getElementById("add-constant-btn");
  const addFlexBtn = document.getElementById("add-appliance-btn");
  const clearBtn = document.getElementById("clear-btn");
  const estimateBtn = document.getElementById("estimate-btn");
  const backBtn = document.getElementById("back-btn");
  const getStartedBtn = document.getElementById("get-started-btn");

  const kwhInput = document.getElementById("kwhCost");
  const billInput = document.getElementById("billAmount");

  // Appliance wattage values
  const applianceWatts = {
    "TV": 125,
    "Light": 17.5,
    "Fan (Ceiling)": 75,
    "Fan (stand/wall)": 65,
    "Air conditioner (HVAC)": 3250,
    "Air conditioner (window)": 1150,
    "Washing machine": 900,
    "Electric stove": 3500,
    "Refrigerator": 350,
    "Oven": 3500,
    "Microwave oven": 900,
    "Electric heater/kettle": 1000,
    "Rice cooker": 650,
    "Coffee maker": 1050,
    "Toaster": 1150,
    "Air fryer": 1500,
    "Clothes Iron": 1400,
    "Blower (hair dryer)": 65
  };

  // Function to set initial values when appliance is selected
  const handleApplianceSelection = (input) => {
    const selectedAppliance = input.value;
    if (applianceWatts[selectedAppliance]) {
      const wattsInput = input.closest('.appliance').querySelector('.input-group input[type="number"]');
      const capacityInput = input.closest('.appliance').querySelector('.capacity-input input');
      
      capacityInput.value = 50;
      wattsInput.value = applianceWatts[selectedAppliance];
    }
  };

  // Add event listeners for appliance selection
  document.addEventListener('change', (e) => {
    if (e.target.classList.contains('appliance-input')) {
      handleApplianceSelection(e.target);
    }
  });

  // Function to handle page transitions
  const transitionToPage = (fromPage, toPage) => {
    const fromElement = document.getElementById(fromPage);
    const toElement = document.getElementById(toPage);
    
    fromElement.classList.remove('active');
    setTimeout(() => {
      fromElement.style.display = 'none';
      toElement.style.display = 'block';
      // Force a reflow
      toElement.offsetHeight;
      toElement.classList.add('active');
    }, 500); // Match this with the CSS transition duration
  };

  const removeAppliance = (btn) => {
    btn.addEventListener("click", () => {
      btn.parentElement.remove();
    });
  };

  addConstantBtn.addEventListener("click", () => {
    const div = document.createElement("div");
    div.className = "appliance constant";
    div.innerHTML = `
      <input type="text" class="appliance-input" placeholder="Type or select appliance" list="appliance-suggestions" />
      <div class="input-group">
        <input type="number" placeholder="Watts (W)" />
        <div class="capacity-input">
          <span>use at</span>
          <input type="number" placeholder="%" min="0" max="100" />
          <span>capacity</span>
        </div>
      </div>
      <input type="number" placeholder="Hours per Day" />
      <button class="remove-btn">X</button>
    `;
    constantContainer.appendChild(div);
    removeAppliance(div.querySelector(".remove-btn"));
  });

  addFlexBtn.addEventListener("click", () => {
    const div = document.createElement("div");
    div.className = "appliance";
    div.innerHTML = `
      <input type="text" class="appliance-input" placeholder="Type or select appliance" list="appliance-suggestions" />
      <div class="input-group">
        <input type="number" placeholder="Watts (W)" />
        <div class="capacity-input">
          <span>use at</span>
          <input type="number" placeholder="%" min="0" max="100" />
          <span>capacity</span>
        </div>
      </div>
      <button class="remove-btn">X</button>
    `;
    flexContainer.appendChild(div);
    removeAppliance(div.querySelector(".remove-btn"));
  });

  clearBtn.addEventListener("click", () => {
    constantContainer.innerHTML = "";
    flexContainer.innerHTML = "";
    kwhInput.value = "";
    billInput.value = "";
  });

  backBtn.addEventListener("click", () => {
    transitionToPage("result-page", "form-page");
  });

  getStartedBtn.addEventListener("click", () => {
    transitionToPage("main-page", "form-page");
  });

  estimateBtn.addEventListener("click", () => {
    const kwhRate = parseFloat(kwhInput.value);
    const bill = parseFloat(billInput.value);

    if (isNaN(kwhRate) || isNaN(bill)) {
      alert("Please enter valid kWh rate and monthly bill.");
      return;
    }

    document.getElementById("rate-display").textContent = kwhRate.toFixed(2);
    document.getElementById("budget-display").textContent = bill.toFixed(2);

    const energyBudgetKWh = bill / kwhRate;
    const days = 30;

    let constantTotalKWh = 0;
    let constants = [];

    // Calculate constant appliances first
    constantContainer.querySelectorAll(".appliance").forEach(div => {
      const name = div.querySelector(".appliance-input").value || "Unnamed";
      const baseWatts = parseFloat(div.querySelector(".input-group input[type='number']").value);
      const capacity = parseFloat(div.querySelector(".capacity-input input").value) || 100;
      const hours = parseFloat(div.querySelectorAll("input[type='number']")[2].value);

      if (!isNaN(baseWatts) && !isNaN(hours)) {
        const actualWatts = baseWatts * (capacity / 100);
        const dailyKWh = (actualWatts * hours) / 1000;
        constantTotalKWh += dailyKWh * days;
        constants.push({ 
          name, 
          baseWatts,
          capacity,
          actualWatts,
          dailyHours: hours 
        });
      }
    });

    // Calculate remaining kWh for flexible appliances
    const remainingKWh = energyBudgetKWh - constantTotalKWh;
    let flexes = [];
    let totalFlexWatts = 0;

    // First pass: collect all flexible appliances and their actual watts
    flexContainer.querySelectorAll(".appliance").forEach(div => {
      const name = div.querySelector(".appliance-input").value || "Unnamed";
      const baseWatts = parseFloat(div.querySelector(".input-group input[type='number']").value);
      const capacity = parseFloat(div.querySelector(".capacity-input input").value) || 100;
      
      if (!isNaN(baseWatts)) {
        const actualWatts = baseWatts * (capacity / 100);
        flexes.push({ 
          name, 
          baseWatts,
          capacity,
          actualWatts 
        });
        totalFlexWatts += actualWatts;
      }
    });

    // Calculate daily hours for flexible appliances based on their proportion of total watts
    flexes.forEach(flex => {
      const proportion = flex.actualWatts / totalFlexWatts;
      const dailyHours = (remainingKWh * 1000 * proportion) / (flex.actualWatts * days);
      flex.dailyHours = dailyHours;
    });

    const resultsBody = document.getElementById("results-body");
    resultsBody.innerHTML = "";
    let totalDailyKWh = 0;
    let totalMonthlyKWh = 0;

    // Display constant appliances
    constants.forEach(({ name, baseWatts, capacity, actualWatts, dailyHours }) => {
      const dailyKWh = (actualWatts * dailyHours) / 1000;
      const monthlyKWh = dailyKWh * days;
      const monthlyCost = monthlyKWh * kwhRate;
      const weeklyCost = monthlyCost / 4;

      totalDailyKWh += dailyKWh;
      totalMonthlyKWh += monthlyKWh;

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${name}</td>
        <td>${baseWatts} (${capacity}%)</td>
        <td class="green-col">${dailyHours}</td>
        <td>${dailyKWh.toFixed(2)}</td>
        <td>${monthlyKWh.toFixed(2)}</td>
        <td>₱${weeklyCost.toFixed(2)}</td>
        <td>₱${monthlyCost.toFixed(2)}</td>
      `;
      resultsBody.appendChild(row);
    });

    // Display flexible appliances
    flexes.forEach(({ name, baseWatts, capacity, actualWatts, dailyHours }) => {
      const dailyKWh = (actualWatts * dailyHours) / 1000;
      const monthlyKWh = dailyKWh * days;
      const monthlyCost = monthlyKWh * kwhRate;
      const weeklyCost = monthlyCost / 4;

      totalDailyKWh += dailyKWh;
      totalMonthlyKWh += monthlyKWh;

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${name}</td>
        <td>${baseWatts} (${capacity}%)</td>
        <td class="green-col">${dailyHours.toFixed(2)}</td>
        <td>${dailyKWh.toFixed(2)}</td>
        <td>${monthlyKWh.toFixed(2)}</td>
        <td>₱${weeklyCost.toFixed(2)}</td>
        <td>₱${monthlyCost.toFixed(2)}</td>
      `;
      resultsBody.appendChild(row);
    });

    // Display totals
    document.getElementById("total-cost").textContent = `₱${bill.toFixed(2)}`;
    document.getElementById("total-daily-kwh").textContent = totalDailyKWh.toFixed(2);
    document.getElementById("total-monthly-kwh").textContent = totalMonthlyKWh.toFixed(2);

    transitionToPage("form-page", "result-page");
  });
});