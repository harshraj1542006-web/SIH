/**
 * SAHAKARI SHRAMIK - BOOKING WIZARD & PRICE ENGINE
 * Handles service selection, slot reservation, emergency dispatch, and booking creation
 */

document.addEventListener('DOMContentLoaded', () => {
  initBookingPortal();
});

let bookingState = {
  category: 'electrician',
  workerId: null,
  workerName: 'Auto-Assign Nearest Certified Worker',
  date: '',
  timeSlot: '10:00 AM - 12:00 PM',
  isEmergency: false,
  baseRate: 249,
  estimatedHours: 1,
  welfarePercent: 0.05
};

function getLocalDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function initBookingPortal() {
  const urlParams = new URLSearchParams(window.location.search);
  let paramCategory = urlParams.get('category');
  const paramWorkerId = urlParams.get('workerId');
  const paramEmergency = urlParams.get('emergency');

  // If workerId is provided without category, detect from worker
  if (!paramCategory && paramWorkerId) {
    const matchedWorker = CoopStore.getWorkerById(paramWorkerId);
    if (matchedWorker) {
      paramCategory = matchedWorker.category;
    }
  }

  // Set default date to today (local timezone)
  const dateInput = document.getElementById('bookingDateInput');
  if (dateInput) {
    const today = getLocalDateString();
    dateInput.min = today;
    dateInput.value = today;
    bookingState.date = today;
    dateInput.addEventListener('change', (e) => {
      bookingState.date = e.target.value;
      updateSummaryCard();
    });
  }

  // Populate category select
  populateCategorySelect(paramCategory);

  // Populate worker options for selected category
  populateWorkerSelect(paramCategory || 'electrician', paramWorkerId);

  // Category select change event
  const catSelect = document.getElementById('bookingCategorySelect');
  if (catSelect) {
    catSelect.addEventListener('change', (e) => {
      bookingState.category = e.target.value;
      populateWorkerSelect(bookingState.category, null);
      updatePricingCalculations();
    });
  }

  // Worker select change event
  const wrkSelect = document.getElementById('bookingWorkerSelect');
  if (wrkSelect) {
    wrkSelect.addEventListener('change', (e) => {
      const selectedId = e.target.value;
      if (selectedId === 'auto') {
        bookingState.workerId = null;
        bookingState.workerName = 'Auto-Assign Nearest Certified Worker';
        const catObj = CoopStore.getCategoryById(bookingState.category);
        bookingState.baseRate = catObj ? catObj.baseHourlyRate : 249;
      } else {
        const worker = CoopStore.getWorkerById(selectedId);
        if (worker) {
          bookingState.workerId = worker.id;
          bookingState.workerName = worker.name;
          bookingState.baseRate = worker.hourlyRate;
        }
      }
      updatePricingCalculations();
    });
  }

  // Time slot buttons
  const slotButtons = document.querySelectorAll('.slot-btn');
  slotButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      slotButtons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      bookingState.timeSlot = btn.getAttribute('data-slot');
      updateSummaryCard();
    });
  });

  // Hours duration select
  const hoursSelect = document.getElementById('bookingHoursSelect');
  if (hoursSelect) {
    hoursSelect.addEventListener('change', (e) => {
      bookingState.estimatedHours = Number(e.target.value);
      updatePricingCalculations();
    });
  }

  // Emergency SOS toggle
  const emergencyCheck = document.getElementById('bookingEmergencyCheck');
  if (emergencyCheck) {
    if (paramEmergency === 'true') {
      emergencyCheck.checked = true;
      bookingState.isEmergency = true;
    }
    emergencyCheck.addEventListener('change', (e) => {
      bookingState.isEmergency = e.target.checked;
      updatePricingCalculations();
    });
  }

  // Pre-fill logged-in customer details if available
  const currentUser = CoopStore.getCurrentUser();
  if (currentUser && currentUser.role === 'customer') {
    const nameInput = document.getElementById('customerNameInput');
    const phoneInput = document.getElementById('customerPhoneInput');
    if (nameInput) nameInput.value = currentUser.name;
    if (phoneInput) phoneInput.value = currentUser.phone || '';
  }

  // Form submission
  const bookingForm = document.getElementById('serviceBookingForm');
  if (bookingForm) {
    bookingForm.addEventListener('submit', handleBookingSubmit);
  }

  updatePricingCalculations();
}

function populateCategorySelect(selectedCategory) {
  const select = document.getElementById('bookingCategorySelect');
  if (!select) return;

  const categories = CoopStore.getCategories();
  select.innerHTML = categories.map(c => `
    <option value="${c.id}" ${c.id === selectedCategory ? 'selected' : ''}>
      ${c.name} (Base ₹${c.baseHourlyRate}/hr)
    </option>
  `).join('');

  if (selectedCategory) {
    bookingState.category = selectedCategory;
  }
}

function populateWorkerSelect(category, selectedWorkerId) {
  const select = document.getElementById('bookingWorkerSelect');
  if (!select) return;

  const workers = CoopStore.getWorkers().filter(w => w.category === category);
  
  let optionsHtml = `<option value="auto">⚡ Auto-Assign Nearest Society Worker (Fastest)</option>`;
  let workerFound = false;

  workers.forEach(w => {
    const isSel = w.id === selectedWorkerId;
    if (isSel) {
      workerFound = true;
      bookingState.workerId = w.id;
      bookingState.workerName = w.name;
      bookingState.baseRate = w.hourlyRate;
    }
    optionsHtml += `
      <option value="${w.id}" ${isSel ? 'selected' : ''}>
        ${w.name} (★ ${w.rating.toFixed(1)} | ₹${w.hourlyRate}/hr | ${w.society.split('#')[0]})
      </option>
    `;
  });

  select.innerHTML = optionsHtml;

  if (!workerFound) {
    bookingState.workerId = null;
    bookingState.workerName = 'Auto-Assign Nearest Certified Worker';
    const catObj = CoopStore.getCategoryById(category);
    bookingState.baseRate = catObj ? catObj.baseHourlyRate : 249;
  }
}

function updatePricingCalculations() {
  const baseSubtotal = bookingState.baseRate * bookingState.estimatedHours;
  const emergencySurge = bookingState.isEmergency ? 100 : 0; // Fixed flat ₹100 express dispatch fee
  const welfareContribution = Math.round((baseSubtotal + emergencySurge) * bookingState.welfarePercent);
  const totalAmount = baseSubtotal + emergencySurge + welfareContribution;

  // Update State
  bookingState.subtotal = baseSubtotal;
  bookingState.emergencyFee = emergencySurge;
  bookingState.welfareFund = welfareContribution;
  bookingState.total = totalAmount;

  // DOM Updates
  const elemSubtotal = document.getElementById('summarySubtotal');
  const elemEmergencyRow = document.getElementById('summaryEmergencyRow');
  const elemEmergencyFee = document.getElementById('summaryEmergencyFee');
  const elemWelfare = document.getElementById('summaryWelfare');
  const elemTotal = document.getElementById('summaryTotal');

  if (elemSubtotal) elemSubtotal.textContent = `₹${baseSubtotal}`;
  if (elemEmergencyRow && elemEmergencyFee) {
    if (bookingState.isEmergency) {
      elemEmergencyRow.style.display = 'flex';
      elemEmergencyFee.textContent = `+ ₹${emergencySurge}`;
    } else {
      elemEmergencyRow.style.display = 'none';
    }
  }
  if (elemWelfare) elemWelfare.textContent = `+ ₹${welfareContribution} (5%)`;
  if (elemTotal) elemTotal.textContent = `₹${totalAmount}`;

  updateSummaryCard();
}

function updateSummaryCard() {
  const catObj = CoopStore.getCategoryById(bookingState.category) || {};
  const elemServiceName = document.getElementById('summaryServiceName');
  const elemWorkerName = document.getElementById('summaryWorkerName');
  const elemSlot = document.getElementById('summarySlot');
  const elemDate = document.getElementById('summaryDate');

  if (elemServiceName) elemServiceName.textContent = catObj.name || bookingState.category;
  if (elemWorkerName) elemWorkerName.textContent = bookingState.workerName;
  if (elemSlot) elemSlot.textContent = bookingState.isEmergency ? 'Urgent 30-Min Dispatch' : bookingState.timeSlot;
  if (elemDate) elemDate.textContent = bookingState.date;
}

function handleBookingSubmit(e) {
  e.preventDefault();

  const nameInput = document.getElementById('customerNameInput');
  const phoneInput = document.getElementById('customerPhoneInput');
  const addressInput = document.getElementById('customerAddressInput');
  const notesInput = document.getElementById('customerNotesInput');

  if (!nameInput.value.trim() || !phoneInput.value.trim() || !addressInput.value.trim()) {
    showToast('Missing Details', 'Please enter your name, phone number, and complete address.', 'error');
    return;
  }

  // If worker was auto-assigned, pick the first available worker in this category
  let assignedWorkerId = bookingState.workerId;
  let assignedWorkerName = bookingState.workerName;
  let assignedWorkerPhone = '+91 98112 34500';

  if (!assignedWorkerId) {
    const candidateWorkers = CoopStore.getWorkers().filter(w => w.category === bookingState.category);
    if (candidateWorkers.length > 0) {
      assignedWorkerId = candidateWorkers[0].id;
      assignedWorkerName = candidateWorkers[0].name;
      assignedWorkerPhone = candidateWorkers[0].phone;
    } else {
      assignedWorkerId = 'wrk-101';
      assignedWorkerName = 'Ramesh Sharma';
    }
  } else {
    const workerObj = CoopStore.getWorkerById(assignedWorkerId);
    if (workerObj) assignedWorkerPhone = workerObj.phone;
  }

  const currentUser = CoopStore.getCurrentUser() || { id: 'cust-01', name: nameInput.value };

  const newBookingPayload = {
    serviceCategory: bookingState.category,
    serviceName: `${(CoopStore.getCategoryById(bookingState.category) || {}).name} Service`,
    workerId: assignedWorkerId,
    workerName: assignedWorkerName,
    workerPhone: assignedWorkerPhone,
    customerId: currentUser.id,
    customerName: nameInput.value.trim(),
    customerPhone: phoneInput.value.trim(),
    serviceAddress: addressInput.value.trim(),
    date: bookingState.date,
    timeSlot: bookingState.isEmergency ? 'Immediate SOS (Within 30 mins)' : bookingState.timeSlot,
    isEmergency: bookingState.isEmergency,
    baseFare: bookingState.subtotal,
    emergencyFee: bookingState.emergencyFee,
    welfareFund: bookingState.welfareFund,
    totalFare: bookingState.total,
    notes: notesInput ? notesInput.value.trim() : 'Standard service request.'
  };

  const createdBooking = CoopStore.createBooking(newBookingPayload);

  // Show confirmation modal
  showBookingSuccessModal(createdBooking);
}

function showBookingSuccessModal(booking) {
  let modal = document.getElementById('bookingSuccessModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'bookingSuccessModal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-dialog" style="max-width: 520px; text-align: center; padding: 10px; position: relative;">
      <button class="modal-close-btn" style="position: absolute; top: 12px; right: 16px; z-index: 10;" onclick="document.getElementById('bookingSuccessModal').classList.remove('active')">&times;</button>
      <div class="modal-body" style="padding: 36px 28px;">
        <div style="width: 72px; height: 72px; background: #dcfce7; color: #15803d; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.2rem; margin: 0 auto 20px;">
          <i class="fa-solid fa-check"></i>
        </div>

        <h3 style="font-size: 1.6rem; color: var(--primary); margin-bottom: 8px;">Booking Confirmed!</h3>
        <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 24px;">
          Your service order has been placed through the Labour Cooperative Federation.
        </p>

        <div style="background: var(--bg-alt); border: 1.5px dashed var(--border-color); border-radius: var(--radius-md); padding: 18px; text-align: left; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem;">
            <span style="color: var(--text-muted);">Booking Reference:</span>
            <strong style="font-family: monospace; color: var(--primary); font-size: 1rem;">${booking.id}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem;">
            <span style="color: var(--text-muted);">Assigned Worker:</span>
            <strong>${booking.workerName}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem;">
            <span style="color: var(--text-muted);">Service Date:</span>
            <strong>${booking.date} (${booking.timeSlot})</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem;">
            <span style="color: var(--text-muted);">Total Fair Wage:</span>
            <strong style="color: var(--welfare-green);">₹${booking.totalFare}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.82rem; color: var(--welfare-green); border-top: 1px solid var(--border-color); padding-top: 8px;">
            <span>Worker Welfare & Pension:</span>
            <strong>₹${booking.welfareFund} Contributed</strong>
          </div>
        </div>

        <div style="background: #e0f2fe; color: #0369a1; padding: 10px 14px; border-radius: var(--radius-md); font-size: 0.85rem; margin-bottom: 24px;">
          <i class="fa-solid fa-key"></i> <strong>Service OTP: ${booking.otp}</strong> (Share this with the worker only when work begins).
        </div>

        <div style="display: flex; gap: 12px; justify-content: center;">
          <a href="customer-dashboard.html" class="btn btn-primary" style="flex: 1;">
            <i class="fa-solid fa-gauge-high"></i> Go to Dashboard
          </a>
          <a href="services.html" class="btn btn-outline" style="flex: 1;">
            Browse More
          </a>
        </div>
      </div>
    </div>
  `;

  modal.onclick = (e) => {
    if (e.target === modal) modal.classList.remove('active');
  };

  modal.classList.add('active');
}
