/**
 * SAHAKARI SHRAMIK - COOPERATIVE DIGITAL SERVICE MARKETPLACE
 * Global Application UI Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initUserSessionBadge();
  initToastContainer();
  initEmergencyModal();
});

/**
 * Mobile Navbar Toggle & Active link marking
 */
function initNavbar() {
  const toggleBtn = document.querySelector('.mobile-toggle-btn');
  const navMenu = document.querySelector('.nav-menu');

  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!toggleBtn.contains(e.target) && !navMenu.contains(e.target)) {
        navMenu.classList.remove('active');
      }
    });
  }

  // Highlight active link based on current path
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const links = document.querySelectorAll('.nav-link');
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href && !href.startsWith('#')) {
      if (href === currentPath || (currentPath === '' && href === 'index.html')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    }
  });
}

/**
 * Updates the user indicator chip in the header navigation
 */
function initUserSessionBadge() {
  const userIndicator = document.getElementById('headerUserIndicator');
  if (!userIndicator) return;

  const currentUser = CoopStore.getCurrentUser();
  if (currentUser) {
    const isWorker = currentUser.role === 'worker';
    userIndicator.innerHTML = `
      <i class="fa-solid ${isWorker ? 'fa-helmet-safety' : 'fa-user'}"></i>
      <span>${currentUser.name} (${isWorker ? 'Worker' : 'Customer'})</span>
    `;
    userIndicator.style.display = 'inline-flex';
    userIndicator.style.cursor = 'pointer';
    userIndicator.title = `Logged in as ${currentUser.name}. Click to view dashboard.`;
    userIndicator.onclick = () => {
      window.location.href = isWorker ? 'worker-dashboard.html' : 'customer-dashboard.html';
    };
  } else {
    userIndicator.style.display = 'none';
  }
}

// Global escape key listener to close active modals
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(modal => {
      modal.classList.remove('active');
    });
  }
});

// Re-render user chip on storage events
window.addEventListener('coop_user_changed', () => {
  initUserSessionBadge();
});

/**
 * Global Toast Notification Generator
 * @param {string} title 
 * @param {string} message 
 * @param {'success'|'error'|'warning'|'info'} type 
 */
function showToast(title, message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: 'fa-circle-check',
    error: 'fa-circle-exclamation',
    warning: 'fa-triangle-exclamation',
    info: 'fa-circle-info'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-icon">
      <i class="fa-solid ${icons[type] || 'fa-info'}"></i>
    </div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function initToastContainer() {
  if (!document.querySelector('.toast-container')) {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
}

/**
 * Emergency SOS Modal Trigger (Available across pages)
 */
function initEmergencyModal() {
  const emergencyBtns = document.querySelectorAll('[data-trigger="emergency-sos"]');
  emergencyBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      // Redirect to booking with emergency query
      window.location.href = 'booking.html?emergency=true';
    });
  });
}
