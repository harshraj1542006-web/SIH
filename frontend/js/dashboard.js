/**
 * SAHAKARI SHRAMIK - DASHBOARD CONTROLLER
 * Manages Customer Hub, Worker Portal, Status Transitions, and Review Modal
 */

document.addEventListener('DOMContentLoaded', () => {
  const isWorkerDashboard = document.getElementById('workerDashboardRoot') !== null;
  const isCustomerDashboard = document.getElementById('customerDashboardRoot') !== null;

  if (isWorkerDashboard) {
    initWorkerDashboard();
  } else if (isCustomerDashboard) {
    initCustomerDashboard();
  }
});

/* ================================================================
   CUSTOMER DASHBOARD LOGIC
   ================================================================ */
function initCustomerDashboard() {
  const currentUser = CoopStore.getCurrentUser() || { id: 'cust-01', name: 'Rajesh Kumar', role: 'customer' };
  const customerId = (currentUser.role === 'customer') ? currentUser.id : 'cust-01';
  
  // Set user greetings
  const nameEl = document.getElementById('customerGreetingName');
  if (nameEl) nameEl.textContent = (currentUser.role === 'customer') ? currentUser.name : 'Rajesh Kumar';

  const phoneEl = document.getElementById('customerPhoneSpan');
  if (phoneEl && currentUser.phone) {
    phoneEl.innerHTML = `<i class="fa-solid fa-phone"></i> ${currentUser.phone}`;
  }

  const cityEl = document.getElementById('customerCitySpan');
  if (cityEl && currentUser.city) {
    cityEl.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${currentUser.city}`;
  }

  renderCustomerMetrics(customerId);
  renderCustomerActiveBookings(customerId);
  renderCustomerBookingHistory(customerId);

  // Tab switching
  setupDashboardTabs('customerTabs', ['activeBookingsTab', 'historyTab']);
}

function renderCustomerMetrics(customerId) {
  const bookings = CoopStore.getCustomerBookings(customerId);
  const activeCount = bookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled').length;
  const completedList = bookings.filter(b => b.status === 'completed');
  
  const totalSpent = completedList.reduce((sum, b) => sum + (b.totalFare || 0), 0);
  const welfareTotal = completedList.reduce((sum, b) => sum + (b.welfareFund || 0), 0);

  const elActive = document.getElementById('metricActiveBookings');
  const elCompleted = document.getElementById('metricCompletedJobs');
  const elSpent = document.getElementById('metricTotalSpent');
  const elWelfare = document.getElementById('metricWelfareContributed');

  if (elActive) elActive.textContent = activeCount;
  if (elCompleted) elCompleted.textContent = completedList.length;
  if (elSpent) elSpent.textContent = `₹${totalSpent}`;
  if (elWelfare) elWelfare.textContent = `₹${welfareTotal}`;
}

function renderCustomerActiveBookings(customerId) {
  const container = document.getElementById('customerActiveList');
  if (!container) return;

  const bookings = CoopStore.getCustomerBookings(customerId);
  const activeBookings = bookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled');

  const countBadge = document.getElementById('customerActiveCountBadge');
  if (countBadge) countBadge.textContent = activeBookings.length;

  if (activeBookings.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 45px 20px; background: #fff; border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
        <i class="fa-solid fa-clipboard-check" style="font-size: 2.5rem; color: var(--text-muted); margin-bottom: 12px;"></i>
        <h4 style="color: var(--primary); margin-bottom: 6px;">No Active Bookings</h4>
        <p style="color: var(--text-muted); margin-bottom: 16px; font-size: 0.9rem;">You have no active service appointments currently scheduled.</p>
        <a href="services.html" class="btn btn-accent btn-sm"><i class="fa-solid fa-plus"></i> Book a Service</a>
      </div>
    `;
    return;
  }

  container.innerHTML = activeBookings.map(b => {
    const isSos = b.isEmergency;
    
    // Status step progression calculation
    const stepPendingClass = 'done';
    const stepAcceptedClass = (b.status === 'accepted' || b.status === 'in-progress') ? (b.status === 'accepted' ? 'active' : 'done') : '';
    const stepProgressClass = b.status === 'in-progress' ? 'active' : '';

    return `
      <div class="booking-item-card">
        <div class="booking-item-meta">
          <div class="booking-item-header">
            <span class="booking-id-tag">${b.id}</span>
            <span class="status-pill ${b.status}">${b.status}</span>
            ${isSos ? '<span class="badge badge-emergency"><i class="fa-solid fa-bolt"></i> Emergency 30-Min</span>' : ''}
          </div>

          <h3 class="booking-item-title">${b.serviceName}</h3>

          <div class="booking-item-info-row">
            <span><i class="fa-solid fa-user-gear"></i> Worker: <strong>${b.workerName}</strong></span>
            <span><i class="fa-solid fa-calendar-day"></i> Date: <strong>${b.date}</strong></span>
            <span><i class="fa-solid fa-clock"></i> Slot: <strong>${b.timeSlot}</strong></span>
            <span><i class="fa-solid fa-indian-rupee-sign"></i> Fair Wage: <strong style="color: var(--welfare-green);">₹${b.totalFare}</strong></span>
          </div>

          <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">
            <i class="fa-solid fa-location-dot"></i> Address: ${b.serviceAddress}
          </div>

          <!-- Progress Tracker -->
          <div class="booking-progress-tracker">
            <div class="track-step ${stepPendingClass}">
              <div class="track-step-dot"><i class="fa-solid fa-check"></i></div>
              <span class="track-step-label">Requested</span>
            </div>
            <div class="track-step ${stepAcceptedClass}">
              <div class="track-step-dot">${stepAcceptedClass === 'done' ? '<i class="fa-solid fa-check"></i>' : '2'}</div>
              <span class="track-step-label">Accepted</span>
            </div>
            <div class="track-step ${stepProgressClass}">
              <div class="track-step-dot">3</div>
              <span class="track-step-label">In Progress</span>
            </div>
            <div class="track-step">
              <div class="track-step-dot">4</div>
              <span class="track-step-label">Done</span>
            </div>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px; align-items: flex-end;">
          <div style="background: #e0f2fe; color: #0369a1; padding: 6px 12px; border-radius: var(--radius-md); font-size: 0.82rem; font-weight: 700;">
            <i class="fa-solid fa-key"></i> OTP: ${b.otp}
          </div>
          <a href="tel:${b.workerPhone || '+919811234501'}" class="btn btn-outline btn-sm">
            <i class="fa-solid fa-phone"></i> Call Worker
          </a>
          <button class="btn btn-outline btn-sm" style="color: var(--danger); border-color: var(--border-color);" onclick="cancelCustomerBooking('${b.id}')">
            Cancel
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function renderCustomerBookingHistory(customerId) {
  const tbody = document.getElementById('customerHistoryTableBody');
  if (!tbody) return;

  const bookings = CoopStore.getCustomerBookings(customerId);
  const completedList = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled');

  if (completedList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 30px; color: var(--text-muted);">No past service history available yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = completedList.map(b => {
    const isReviewed = b.rating !== undefined;
    return `
      <tr>
        <td><strong style="font-family: monospace;">${b.id}</strong></td>
        <td><strong>${b.serviceName}</strong></td>
        <td>${b.workerName}</td>
        <td>${b.date}</td>
        <td><span class="status-pill ${b.status}">${b.status}</span></td>
        <td><strong>₹${b.totalFare}</strong> <span style="font-size: 0.75rem; color: var(--welfare-green);">(₹${b.welfareFund || 0} welfare)</span></td>
        <td>
          ${b.status === 'completed' ? (
            isReviewed ? `
              <span style="color: #f59e0b; font-weight: 700;">
                ★ ${b.rating}/5
              </span>
            ` : `
              <button class="btn btn-accent btn-sm" onclick="openReviewModal('${b.id}')">
                <i class="fa-regular fa-star"></i> Rate
              </button>
            `
          ) : '<span style="color: var(--text-muted);">-</span>'}
        </td>
      </tr>
    `;
  }).join('');
}

window.cancelCustomerBooking = function(bookingId) {
  if (confirm(`Are you sure you want to cancel booking ${bookingId}?`)) {
    CoopStore.updateBookingStatus(bookingId, 'cancelled');
    showToast('Booking Cancelled', `Order ${bookingId} has been cancelled.`, 'warning');
    initCustomerDashboard();
  }
};

/* Rating & Review Modal */
window.openReviewModal = function(bookingId) {
  const booking = CoopStore.getBookingById(bookingId);
  if (!booking) return;

  let modal = document.getElementById('reviewModalDialog');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'reviewModalDialog';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-dialog" style="max-width: 480px;">
      <div class="modal-header">
        <h3 class="modal-title">Rate Cooperative Worker</h3>
        <button class="modal-close-btn" onclick="closeReviewModal()">&times;</button>
      </div>
      <div class="modal-body">
        <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 16px;">
          How was the service provided by <strong>${booking.workerName}</strong> for <em>${booking.serviceName}</em>?
        </p>

        <div style="display: flex; justify-content: center; gap: 10px; font-size: 2rem; color: #f59e0b; margin-bottom: 20px;" id="starRatingSelect">
          <i class="fa-solid fa-star" style="cursor: pointer;" data-val="1" onclick="setStarReview(1)"></i>
          <i class="fa-solid fa-star" style="cursor: pointer;" data-val="2" onclick="setStarReview(2)"></i>
          <i class="fa-solid fa-star" style="cursor: pointer;" data-val="3" onclick="setStarReview(3)"></i>
          <i class="fa-solid fa-star" style="cursor: pointer;" data-val="4" onclick="setStarReview(4)"></i>
          <i class="fa-solid fa-star" style="cursor: pointer;" data-val="5" onclick="setStarReview(5)"></i>
        </div>
        <input type="hidden" id="selectedStarRatingValue" value="5">

        <div class="form-group">
          <label class="form-label">Feedback & Comments</label>
          <textarea class="form-control" id="reviewTextInput" rows="3" placeholder="Share your experience (punctuality, skill, honesty in pricing)..."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeReviewModal()">Cancel</button>
        <button class="btn btn-primary" onclick="submitBookingReview('${booking.id}')">Submit Feedback</button>
      </div>
    </div>
  `;

  modal.onclick = (e) => {
    if (e.target === modal) closeReviewModal();
  };

  modal.classList.add('active');
};

window.setStarReview = function(val) {
  document.getElementById('selectedStarRatingValue').value = val;
  const stars = document.querySelectorAll('#starRatingSelect i');
  stars.forEach((s, idx) => {
    if (idx < val) {
      s.className = 'fa-solid fa-star';
      s.style.color = '#f59e0b';
    } else {
      s.className = 'fa-regular fa-star';
      s.style.color = '#cbd5e1';
    }
  });
};

window.closeReviewModal = function() {
  const modal = document.getElementById('reviewModalDialog');
  if (modal) modal.classList.remove('active');
};

window.submitBookingReview = function(bookingId) {
  const rating = document.getElementById('selectedStarRatingValue').value;
  const text = document.getElementById('reviewTextInput').value;

  CoopStore.addBookingReview(bookingId, rating, text);
  closeReviewModal();
  showToast('Thank You!', 'Your rating has been recorded and credited to the worker cooperative profile.', 'success');
  initCustomerDashboard();
};


/* ================================================================
   WORKER DASHBOARD LOGIC
   ================================================================ */
function initWorkerDashboard() {
  const currentUser = CoopStore.getCurrentUser();
  const workerId = (currentUser && currentUser.role === 'worker') ? currentUser.id : 'wrk-101';
  const workerObj = CoopStore.getWorkerById(workerId) || CoopStore.getWorkerById('wrk-101') || {
    id: 'wrk-101',
    name: 'Ramesh Sharma',
    society: 'Delhi Central Labour Co-op #DL-14',
    rating: 4.9,
    completedJobs: 342,
    hourlyRate: 249,
    category: 'electrician'
  };

  // Populate worker header
  const nameEl = document.getElementById('workerProfileName');
  const societyEl = document.getElementById('workerProfileSociety');
  if (nameEl) nameEl.textContent = workerObj.name;
  if (societyEl) societyEl.innerHTML = `<i class="fa-solid fa-shield-halved"></i> ${workerObj.society}`;

  // Update avatar and category badge
  const avatarEl = document.querySelector('.dashboard-user-header .user-avatar-large');
  if (avatarEl) {
    avatarEl.textContent = workerObj.initials || workerObj.name.substring(0, 2).toUpperCase();
    if (workerObj.avatarBg) avatarEl.style.background = workerObj.avatarBg;
  }
  const badgeEl = document.querySelector('.dashboard-user-header .badge-verified');
  if (badgeEl) {
    const catObj = CoopStore.getCategoryById(workerObj.category) || {};
    badgeEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> Certified ${catObj.name || workerObj.category || 'Artisan'}`;
  }

  // Availability switch
  setupWorkerAvailabilitySwitch();

  // Metrics
  renderWorkerMetrics(workerId, workerObj);

  // Incoming Requests & Active Jobs
  renderWorkerRequestsQueue(workerId, workerObj);
  renderWorkerActiveJobs(workerId);
  renderWorkerEarningsLedger(workerId);

  // Tab switching
  setupDashboardTabs('workerTabs', ['incomingRequestsTab', 'activeJobsTab', 'earningsLedgerTab']);
}

function setupWorkerAvailabilitySwitch() {
  const select = document.getElementById('workerStatusSelect');
  const dot = document.getElementById('workerStatusDot');
  if (!select) return;

  const currentStatus = CoopStore.getWorkerStatus();
  select.value = currentStatus;
  updateStatusDot(dot, currentStatus);

  select.addEventListener('change', (e) => {
    const val = e.target.value;
    CoopStore.setWorkerStatus(val);
    updateStatusDot(dot, val);
    showToast('Status Updated', `Your availability is now set to ${val.toUpperCase()}.`, 'info');
  });
}

function updateStatusDot(dot, status) {
  if (!dot) return;
  dot.className = 'status-indicator-dot';
  if (status === 'busy') dot.classList.add('busy');
  if (status === 'offline') dot.classList.add('offline');
}

function renderWorkerMetrics(workerId, workerObj) {
  const bookings = CoopStore.getBookings().filter(b => b.workerId === workerId);
  const completed = bookings.filter(b => b.status === 'completed');
  
  const baseEarnings = (workerObj.id === 'wrk-101') ? 14250 : ((workerObj.completedJobs || 0) * (workerObj.hourlyRate || 250));
  const totalGross = completed.reduce((sum, b) => sum + (b.totalFare || 0), 0) + baseEarnings;
  const welfareRetained = Math.round(totalGross * 0.05);
  const netEarnings = totalGross - welfareRetained;

  const elEarned = document.getElementById('workerMetricNetEarnings');
  const elWelfare = document.getElementById('workerMetricWelfareFund');
  const elJobs = document.getElementById('workerMetricCompletedJobs');
  const elRating = document.getElementById('workerMetricRating');

  if (elEarned) elEarned.textContent = `₹${netEarnings.toLocaleString('en-IN')}`;
  if (elWelfare) elWelfare.textContent = `₹${welfareRetained.toLocaleString('en-IN')}`;
  if (elJobs) elJobs.textContent = (workerObj.completedJobs || 0) + completed.length;
  if (elRating) elRating.textContent = `★ ${(workerObj.rating || 5.0).toFixed(1)}`;
}

function renderWorkerRequestsQueue(workerId, workerObj) {
  const container = document.getElementById('workerIncomingRequestsList');
  const badge = document.getElementById('incomingCountBadge');
  if (!container) return;

  // Find bookings assigned to this worker or matching category that are in 'pending' status
  const allBookings = CoopStore.getBookings();
  const workerCategory = (workerObj && workerObj.category) ? workerObj.category : null;
  const pendingRequests = allBookings.filter(b => b.status === 'pending' && (!b.workerId || b.workerId === workerId || (workerCategory && b.serviceCategory === workerCategory)));

  if (badge) badge.textContent = pendingRequests.length;

  if (pendingRequests.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 45px 20px; background: #fff; border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
        <i class="fa-solid fa-inbox" style="font-size: 2.5rem; color: var(--text-muted); margin-bottom: 12px;"></i>
        <h4 style="color: var(--primary); margin-bottom: 6px;">No Pending Dispatch Requests</h4>
        <p style="color: var(--text-muted); font-size: 0.9rem;">Keep your status set to "Available Online" to receive incoming cooperative requests.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = pendingRequests.map(req => {
    return `
      <div class="request-card ${req.isEmergency ? 'urgent-sos' : ''}">
        <div class="request-meta">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span class="booking-id-tag">${req.id}</span>
            ${req.isEmergency ? '<span class="badge badge-emergency"><i class="fa-solid fa-bolt"></i> Emergency Callout</span>' : '<span class="badge badge-coop">Standard Request</span>'}
          </div>
          <h4>${req.serviceName}</h4>
          <div class="request-details-row">
            <span><i class="fa-solid fa-user"></i> Customer: <strong>${req.customerName}</strong></span>
            <span><i class="fa-solid fa-calendar-day"></i> Date: <strong>${req.date}</strong></span>
            <span><i class="fa-solid fa-clock"></i> ${req.timeSlot}</span>
          </div>
          <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px;">
            <i class="fa-solid fa-location-dot"></i> ${req.serviceAddress}
          </div>
          <div style="font-size: 0.85rem; color: var(--text-main); background: var(--bg-alt); padding: 6px 10px; border-radius: var(--radius-sm); display: inline-block;">
            <strong>Issue:</strong> "${req.notes || 'Service needed'}"
          </div>
        </div>

        <div style="text-align: right; display: flex; flex-direction: column; gap: 12px; align-items: flex-end;">
          <div class="request-fare-badge">
            <i class="fa-solid fa-hand-holding-dollar"></i> Net Payout: ₹${req.baseFare}
          </div>
          <div class="request-actions-group">
            <button class="btn btn-outline btn-sm" style="color: var(--danger); border-color: var(--border-color);" onclick="handleWorkerReject('${req.id}')">
              Decline
            </button>
            <button class="btn btn-welfare btn-sm" onclick="handleWorkerAccept('${req.id}')">
              <i class="fa-solid fa-check"></i> Accept Job
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderWorkerActiveJobs(workerId) {
  const container = document.getElementById('workerActiveJobsList');
  const badge = document.getElementById('activeJobsCountBadge');
  if (!container) return;

  const allBookings = CoopStore.getBookings();
  const activeJobs = allBookings.filter(b => (b.status === 'accepted' || b.status === 'in-progress') && b.workerId === workerId);

  if (badge) badge.textContent = activeJobs.length;

  if (activeJobs.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 45px 20px; background: #fff; border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
        <i class="fa-solid fa-briefcase" style="font-size: 2.5rem; color: var(--text-muted); margin-bottom: 12px;"></i>
        <h4 style="color: var(--primary); margin-bottom: 6px;">No Active Jobs Right Now</h4>
        <p style="color: var(--text-muted); font-size: 0.9rem;">Accept an incoming request from the queue to start working on a job.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = activeJobs.map(job => {
    return `
      <div class="booking-item-card">
        <div class="booking-item-meta">
          <div class="booking-item-header">
            <span class="booking-id-tag">${job.id}</span>
            <span class="status-pill ${job.status}">${job.status}</span>
            ${job.isEmergency ? '<span class="badge badge-emergency"><i class="fa-solid fa-bolt"></i> Urgent SOS</span>' : ''}
          </div>

          <h3 class="booking-item-title">${job.serviceName}</h3>

          <div class="booking-item-info-row">
            <span><i class="fa-solid fa-user"></i> Customer: <strong>${job.customerName}</strong></span>
            <span><i class="fa-solid fa-phone"></i> ${job.customerPhone}</span>
            <span><i class="fa-solid fa-clock"></i> ${job.timeSlot}</span>
          </div>

          <div style="font-size: 0.88rem; color: var(--text-muted); margin-top: 4px;">
            <i class="fa-solid fa-location-dot"></i> Address: <strong>${job.serviceAddress}</strong>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px; align-items: flex-end;">
          <a href="tel:${job.customerPhone}" class="btn btn-outline btn-sm">
            <i class="fa-solid fa-phone"></i> Contact Customer
          </a>

          ${job.status === 'accepted' ? `
            <button class="btn btn-primary btn-sm" onclick="handleWorkerStartJob('${job.id}')">
              <i class="fa-solid fa-play"></i> Start Job
            </button>
          ` : `
            <button class="btn btn-welfare btn-sm" onclick="handleWorkerCompleteJob('${job.id}')">
              <i class="fa-solid fa-circle-check"></i> Complete & Collect ₹${job.totalFare}
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');
}

function renderWorkerEarningsLedger(workerId) {
  const tbody = document.getElementById('workerEarningsTableBody');
  if (!tbody) return;

  const bookings = CoopStore.getBookings().filter(b => b.workerId === workerId && b.status === 'completed');

  if (bookings.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td>#SHK-2026-8740</td>
        <td>Bathroom Shower & Tap Valve</td>
        <td>₹440</td>
        <td style="color: var(--welfare-green);">₹22 (5%)</td>
        <td><strong>₹418</strong></td>
        <td><span class="status-pill completed">Settled to Bank</span></td>
      </tr>
      <tr>
        <td>#SHK-2026-8512</td>
        <td>Inverter Switchboard Wiring</td>
        <td>₹550</td>
        <td style="color: var(--welfare-green);">₹27 (5%)</td>
        <td><strong>₹523</strong></td>
        <td><span class="status-pill completed">Settled to Bank</span></td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = bookings.map(b => {
    const net = (b.totalFare || 0) - (b.welfareFund || 0);
    return `
      <tr>
        <td><strong style="font-family: monospace;">${b.id}</strong></td>
        <td>${b.serviceName}</td>
        <td>₹${b.totalFare}</td>
        <td style="color: var(--welfare-green);">₹${b.welfareFund} (Welfare)</td>
        <td><strong>₹${net}</strong></td>
        <td><span class="status-pill completed">Settled</span></td>
      </tr>
    `;
  }).join('');
}

window.handleWorkerAccept = function(bookingId) {
  const currentUser = CoopStore.getCurrentUser();
  const currentWorkerId = (currentUser && currentUser.role === 'worker') ? currentUser.id : 'wrk-101';
  const currentWorker = CoopStore.getWorkerById(currentWorkerId);

  CoopStore.updateBookingStatus(bookingId, 'accepted', {
    workerId: currentWorkerId,
    workerName: currentWorker ? currentWorker.name : 'Verified Cooperative Worker',
    workerPhone: currentWorker ? currentWorker.phone : '+91 98112 34501'
  });
  showToast('Job Accepted!', `You have accepted order ${bookingId}. Customer has been notified.`, 'success');
  initWorkerDashboard();
  switchDashboardTab('workerTabs', ['incomingRequestsTab', 'activeJobsTab', 'earningsLedgerTab'], 1);
};

window.handleWorkerReject = function(bookingId) {
  if (confirm('Are you sure you want to decline this job request?')) {
    CoopStore.updateBookingStatus(bookingId, 'cancelled');
    showToast('Job Declined', `Request ${bookingId} was declined.`, 'info');
    initWorkerDashboard();
  }
};

window.handleWorkerStartJob = function(bookingId) {
  CoopStore.updateBookingStatus(bookingId, 'in-progress');
  showToast('Work In Progress', `Job ${bookingId} is now marked In-Progress.`, 'info');
  initWorkerDashboard();
  switchDashboardTab('workerTabs', ['incomingRequestsTab', 'activeJobsTab', 'earningsLedgerTab'], 1);
};

window.handleWorkerCompleteJob = function(bookingId) {
  CoopStore.updateBookingStatus(bookingId, 'completed');
  showToast('Job Completed!', `Congratulations! Earnings for ${bookingId} have been credited directly.`, 'success');
  initWorkerDashboard();
  switchDashboardTab('workerTabs', ['incomingRequestsTab', 'activeJobsTab', 'earningsLedgerTab'], 2);
};

/* Dashboard Tab Switcher Helper */
function setupDashboardTabs(tabContainerId, panelIds) {
  const container = document.getElementById(tabContainerId);
  if (!container) return;

  if (container.dataset.tabsInitialized === 'true') return;
  container.dataset.tabsInitialized = 'true';

  const buttons = container.querySelectorAll('.tab-btn');
  buttons.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      switchDashboardTab(tabContainerId, panelIds, index);
    });
  });
}

function switchDashboardTab(tabContainerId, panelIds, targetIndex) {
  const container = document.getElementById(tabContainerId);
  if (!container) return;

  const buttons = container.querySelectorAll('.tab-btn');
  buttons.forEach((b, idx) => {
    if (idx === targetIndex) {
      b.classList.add('active');
    } else {
      b.classList.remove('active');
    }
  });

  panelIds.forEach((pid, pIdx) => {
    const panel = document.getElementById(pid);
    if (panel) {
      panel.style.display = pIdx === targetIndex ? 'block' : 'none';
    }
  });
}
