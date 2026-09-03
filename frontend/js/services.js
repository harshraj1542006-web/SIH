/**
 * SAHAKARI SHRAMIK - SERVICES MARKETPLACE CONTROLLER
 * Live Filtering, Search, Category Navigation & Worker Detail Modal
 */

document.addEventListener('DOMContentLoaded', () => {
  initMarketplace();
});

let currentFilters = {
  search: '',
  categories: [],
  maxPrice: 500,
  minRating: 0,
  emergencyOnly: false
};

function initMarketplace() {
  // Parse URL Parameters (e.g., ?category=plumber or ?emergency=true)
  const urlParams = new URLSearchParams(window.location.search);
  const paramCategory = urlParams.get('category');
  const paramSearch = urlParams.get('search');
  const paramEmergency = urlParams.get('emergency');

  if (paramCategory) {
    currentFilters.categories.push(paramCategory);
  }
  if (paramSearch) {
    currentFilters.search = paramSearch;
    const searchInput = document.getElementById('marketplaceSearchInput');
    if (searchInput) searchInput.value = paramSearch;
  }
  if (paramEmergency === 'true') {
    currentFilters.emergencyOnly = true;
    const emergencyToggle = document.getElementById('filterEmergencyToggle');
    if (emergencyToggle) emergencyToggle.checked = true;
  }

  // Populate category checkboxes in sidebar
  renderCategoryFilterCheckboxes();

  // Price range slider event
  const priceSlider = document.getElementById('priceRangeSlider');
  const priceVal = document.getElementById('priceRangeVal');
  if (priceSlider && priceVal) {
    priceSlider.addEventListener('input', (e) => {
      currentFilters.maxPrice = Number(e.target.value);
      priceVal.textContent = `₹${e.target.value}/hr`;
      renderFilteredWorkers();
    });
  }

  // Rating radio filters
  const ratingRadios = document.querySelectorAll('input[name="filterRating"]');
  ratingRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      currentFilters.minRating = Number(e.target.value);
      renderFilteredWorkers();
    });
  });

  // Emergency SOS toggle filter
  const emergencyToggle = document.getElementById('filterEmergencyToggle');
  if (emergencyToggle) {
    emergencyToggle.addEventListener('change', (e) => {
      currentFilters.emergencyOnly = e.target.checked;
      renderFilteredWorkers();
    });
  }

  // Search input with debounce
  const searchInput = document.getElementById('marketplaceSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentFilters.search = e.target.value.toLowerCase().trim();
      renderFilteredWorkers();
    });
  }

  // Reset filters button
  const resetBtn = document.getElementById('resetFiltersBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      resetAllFilters();
    });
  }

  // Initial render
  renderFilteredWorkers();
}

function renderCategoryFilterCheckboxes() {
  const container = document.getElementById('categoryCheckboxList');
  if (!container) return;

  const categories = CoopStore.getCategories();
  const workers = CoopStore.getWorkers();

  container.innerHTML = categories.map(cat => {
    const count = workers.filter(w => w.category === cat.id).length;
    const isChecked = currentFilters.categories.includes(cat.id);
    return `
      <label class="filter-checkbox-item">
        <input type="checkbox" value="${cat.id}" ${isChecked ? 'checked' : ''} onchange="handleCategoryToggle(this)">
        <span>${cat.name}</span>
        <span class="filter-count">${count}</span>
      </label>
    `;
  }).join('');
}

window.handleCategoryToggle = function(checkbox) {
  const catId = checkbox.value;
  if (checkbox.checked) {
    if (!currentFilters.categories.includes(catId)) {
      currentFilters.categories.push(catId);
    }
  } else {
    currentFilters.categories = currentFilters.categories.filter(id => id !== catId);
  }
  renderFilteredWorkers();
};

function resetAllFilters() {
  currentFilters = {
    search: '',
    categories: [],
    maxPrice: 500,
    minRating: 0,
    emergencyOnly: false
  };

  const searchInput = document.getElementById('marketplaceSearchInput');
  if (searchInput) searchInput.value = '';

  const priceSlider = document.getElementById('priceRangeSlider');
  const priceVal = document.getElementById('priceRangeVal');
  if (priceSlider && priceVal) {
    priceSlider.value = 500;
    priceVal.textContent = '₹500/hr';
  }

  const emergencyToggle = document.getElementById('filterEmergencyToggle');
  if (emergencyToggle) emergencyToggle.checked = false;

  const defaultRating = document.querySelector('input[name="filterRating"][value="0"]');
  if (defaultRating) defaultRating.checked = true;

  renderCategoryFilterCheckboxes();
  renderFilteredWorkers();
}

function renderFilteredWorkers() {
  const grid = document.getElementById('workersListGrid');
  const countBadge = document.getElementById('workersCountBadge');
  if (!grid) return;

  const allWorkers = CoopStore.getWorkers();

  const filtered = allWorkers.filter(w => {
    // Category match
    if (currentFilters.categories.length > 0 && !currentFilters.categories.includes(w.category)) {
      return false;
    }

    // Search query match (name, trade, skills, city, society)
    if (currentFilters.search) {
      const q = currentFilters.search;
      const matchName = w.name.toLowerCase().includes(q);
      const matchTrade = w.category.toLowerCase().includes(q);
      const matchSkills = w.skills.some(s => s.toLowerCase().includes(q));
      const matchCity = (w.city || '').toLowerCase().includes(q);
      const matchSociety = (w.society || '').toLowerCase().includes(q);
      if (!matchName && !matchTrade && !matchSkills && !matchCity && !matchSociety) {
        return false;
      }
    }

    // Price match
    if (w.hourlyRate > currentFilters.maxPrice) {
      return false;
    }

    // Rating match
    if (w.rating < currentFilters.minRating) {
      return false;
    }

    // Emergency match
    if (currentFilters.emergencyOnly && !w.emergencyAvailable) {
      return false;
    }

    return true;
  });

  if (countBadge) {
    countBadge.textContent = `${filtered.length} Verified Workers Found`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: #fff; border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
        <i class="fa-solid fa-user-slash" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 16px;"></i>
        <h3 style="color: var(--primary); margin-bottom: 8px;">No Verified Workers Match Your Criteria</h3>
        <p style="color: var(--text-muted); max-width: 480px; margin: 0 auto 20px;">Try adjusting your filters, price range, or searching for general terms like 'Electrician' or 'Plumber'.</p>
        <button class="btn btn-primary" onclick="resetAllFilters()">Reset All Filters</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(worker => {
    const categoryObj = CoopStore.getCategoryById(worker.category) || {};
    return `
      <div class="worker-card">
        <div class="worker-card-header">
          <div class="worker-card-avatar" style="background: ${worker.avatarBg || '#0f2b48'}">
            ${worker.initials || worker.name.substring(0, 2)}
          </div>
          <div class="worker-card-meta">
            <h4>${worker.name}</h4>
            <div class="worker-card-trade">
              <i class="fa-solid ${categoryObj.icon || 'fa-wrench'}"></i> ${categoryObj.name || worker.category}
            </div>
            <div class="worker-card-society">
              <i class="fa-solid fa-shield-halved"></i> ${worker.society}
            </div>
          </div>
        </div>

        <div class="worker-card-rating-row">
          <span class="star-rating-badge">
            <i class="fa-solid fa-star"></i> ${worker.rating.toFixed(1)}
          </span>
          <span style="color: var(--text-muted);">(${worker.reviewsCount} reviews)</span>
          <span class="worker-exp-badge">• ${worker.experienceYears} yrs experience</span>
          ${worker.emergencyAvailable ? '<span class="badge badge-emergency" style="margin-left: auto;"><i class="fa-solid fa-bolt"></i> SOS</span>' : ''}
        </div>

        <div class="worker-skills-tags">
          ${worker.skills.slice(0, 3).map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
          ${worker.skills.length > 3 ? `<span class="skill-tag">+${worker.skills.length - 3}</span>` : ''}
        </div>

        <div class="worker-card-footer">
          <div class="worker-price-box">
            <span class="worker-price-rate">₹${worker.hourlyRate}</span>
            <span class="worker-price-unit">Fair Base / Hour</span>
          </div>
          <div class="worker-card-actions">
            <button class="btn btn-outline btn-sm" onclick="openWorkerDetailsModal('${worker.id}')">
              <i class="fa-regular fa-eye"></i> Profile
            </button>
            <a href="booking.html?workerId=${worker.id}&category=${worker.category}" class="btn btn-accent btn-sm">
              <i class="fa-regular fa-calendar-check"></i> Book Now
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Worker Details Modal View
 */
window.openWorkerDetailsModal = function(workerId) {
  const worker = CoopStore.getWorkerById(workerId);
  if (!worker) return;

  const categoryObj = CoopStore.getCategoryById(worker.category) || {};
  let modal = document.getElementById('workerProfileModal');

  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'workerProfileModal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-header">
        <h3 class="modal-title">Worker Profile & Cooperative Verification</h3>
        <button class="modal-close-btn" onclick="closeWorkerDetailsModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div style="display: flex; gap: 18px; align-items: center; margin-bottom: 20px;">
          <div class="worker-card-avatar" style="width: 80px; height: 80px; font-size: 2.2rem; background: ${worker.avatarBg || '#0f2b48'}">
            ${worker.initials || worker.name.substring(0, 2)}
          </div>
          <div>
            <h3 style="font-size: 1.4rem; color: var(--primary); margin-bottom: 4px;">${worker.name}</h3>
            <p style="font-weight: 600; color: var(--accent);"><i class="fa-solid ${categoryObj.icon || 'fa-wrench'}"></i> Certified ${categoryObj.name || worker.category}</p>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;"><i class="fa-solid fa-location-dot"></i> ${worker.city || 'National Capital Region'}, India</p>
          </div>
        </div>

        <div style="background: var(--welfare-light); border: 1px solid #bbf7d0; border-radius: var(--radius-md); padding: 14px; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 8px; color: var(--welfare-green); font-weight: 700; font-size: 0.9rem; margin-bottom: 4px;">
            <i class="fa-solid fa-shield-check"></i> Cooperative Society Verified Member
          </div>
          <p style="font-size: 0.82rem; color: #166534;">
            <strong>Affiliation:</strong> ${worker.society} (Society ID: ${worker.societyId || 'SOC-FED-VERIFIED'})<br>
            Police background checked • State minimum wage adherence • Accidental death & disability insurance covered.
          </p>
        </div>

        <div style="margin-bottom: 18px;">
          <h4 style="font-size: 0.95rem; color: var(--primary); margin-bottom: 6px;">Biography & Experience</h4>
          <p style="font-size: 0.9rem; color: var(--text-main); line-height: 1.5;">${worker.bio || 'Skilled cooperative federation certified artisan with extensive field experience.'}</p>
        </div>

        <div style="margin-bottom: 18px;">
          <h4 style="font-size: 0.95rem; color: var(--primary); margin-bottom: 8px;">Trade Skills & Specializations</h4>
          <div class="worker-skills-tags">
            ${worker.skills.map(s => `<span class="skill-tag" style="padding: 5px 10px; font-size: 0.82rem;">${s}</span>`).join('')}
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; background: var(--bg-alt); padding: 14px; border-radius: var(--radius-md); text-align: center;">
          <div>
            <div style="font-weight: 800; font-size: 1.2rem; color: var(--primary);">${worker.completedJobs}+</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Jobs Done</div>
          </div>
          <div>
            <div style="font-weight: 800; font-size: 1.2rem; color: #b45309;">★ ${worker.rating.toFixed(1)}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${worker.reviewsCount} Ratings</div>
          </div>
          <div>
            <div style="font-weight: 800; font-size: 1.2rem; color: var(--welfare-green);">₹${worker.hourlyRate}/hr</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Fair Standard Rate</div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeWorkerDetailsModal()">Close</button>
        <a href="booking.html?workerId=${worker.id}&category=${worker.category}" class="btn btn-accent">
          <i class="fa-regular fa-calendar-check"></i> Book This Worker
        </a>
      </div>
    </div>
  `;

  modal.onclick = (e) => {
    if (e.target === modal) closeWorkerDetailsModal();
  };

  modal.classList.add('active');
};

window.closeWorkerDetailsModal = function() {
  const modal = document.getElementById('workerProfileModal');
  if (modal) {
    modal.classList.remove('active');
  }
};
