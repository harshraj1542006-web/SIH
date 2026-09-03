/**
 * SAHAKARI SHRAMIK - COOPERATIVE DIGITAL SERVICE MARKETPLACE
 * LocalStorage State Store & Persistence Layer
 */

const STORAGE_KEYS = {
  CATEGORIES: 'coop_categories_v1',
  WORKERS: 'coop_workers_v1',
  BOOKINGS: 'coop_bookings_v1',
  CURRENT_USER: 'coop_current_user_v1',
  WORKER_STATUS: 'coop_worker_status_v1'
};

const CoopStore = {
  /**
   * Initializes default mock data into localStorage if not present
   */
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(COOP_CATEGORIES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.WORKERS)) {
      localStorage.setItem(STORAGE_KEYS.WORKERS, JSON.stringify(SEED_WORKERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.BOOKINGS)) {
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(SEED_BOOKINGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
      // Default demo user: Rajesh Kumar (Customer)
      const defaultUser = {
        role: 'customer',
        id: 'cust-01',
        name: 'Rajesh Kumar',
        phone: '+91 98765 43210',
        email: 'rajesh.kumar@example.com',
        city: 'New Delhi'
      };
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(defaultUser));
    }
    if (!localStorage.getItem(STORAGE_KEYS.WORKER_STATUS)) {
      localStorage.setItem(STORAGE_KEYS.WORKER_STATUS, 'online');
    }
  },

  /* ---------- CATEGORIES ---------- */
  getCategories() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES)) || COOP_CATEGORIES;
    } catch (e) {
      return COOP_CATEGORIES;
    }
  },

  getCategoryById(id) {
    const categories = this.getCategories();
    return categories.find(c => c.id === id);
  },

  /* ---------- WORKERS ---------- */
  getWorkers() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.WORKERS)) || SEED_WORKERS;
    } catch (e) {
      return SEED_WORKERS;
    }
  },

  getWorkerById(id) {
    const workers = this.getWorkers();
    return workers.find(w => w.id === id);
  },

  addWorker(workerData) {
    const workers = this.getWorkers();
    const newWorker = {
      id: 'wrk-' + Math.floor(100 + Math.random() * 900),
      rating: 5.0,
      reviewsCount: 1,
      completedJobs: 0,
      verified: true,
      initials: (workerData.name || 'W').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      avatarBg: '#0f2b48',
      ...workerData
    };
    workers.unshift(newWorker);
    localStorage.setItem(STORAGE_KEYS.WORKERS, JSON.stringify(workers));
    return newWorker;
  },

  /* ---------- BOOKINGS ---------- */
  getBookings() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS)) || SEED_BOOKINGS;
    } catch (e) {
      return SEED_BOOKINGS;
    }
  },

  getBookingById(id) {
    const bookings = this.getBookings();
    return bookings.find(b => b.id === id);
  },

  createBooking(data) {
    const bookings = this.getBookings();
    const newId = 'SHK-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const newBooking = {
      id: newId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      otp: otp,
      ...data
    };

    bookings.unshift(newBooking);
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
    return newBooking;
  },

  updateBookingStatus(id, newStatus, additionalFields = {}) {
    const bookings = this.getBookings();
    const index = bookings.findIndex(b => b.id === id);
    if (index !== -1) {
      bookings[index].status = newStatus;
      Object.assign(bookings[index], additionalFields);
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
      return bookings[index];
    }
    return null;
  },

  addBookingReview(id, rating, reviewText) {
    const bookings = this.getBookings();
    const index = bookings.findIndex(b => b.id === id);
    if (index !== -1) {
      const numRating = Number(rating);
      bookings[index].rating = numRating;
      bookings[index].review = reviewText;
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));

      // Also update worker aggregate rating in storage
      if (bookings[index].workerId) {
        const workers = this.getWorkers();
        const wIdx = workers.findIndex(w => w.id === bookings[index].workerId);
        if (wIdx !== -1) {
          const w = workers[wIdx];
          const currReviews = w.reviewsCount || 0;
          const currRating = w.rating || 5.0;
          const newReviews = currReviews + 1;
          const newRating = Number(((currRating * currReviews + numRating) / newReviews).toFixed(1));
          w.reviewsCount = newReviews;
          w.rating = newRating;
          localStorage.setItem(STORAGE_KEYS.WORKERS, JSON.stringify(workers));
        }
      }

      return bookings[index];
    }
    return null;
  },

  getCustomerBookings(customerId) {
    const bookings = this.getBookings();
    return bookings.filter(b => b.customerId === customerId);
  },

  getWorkerBookings(workerId) {
    const bookings = this.getBookings();
    return bookings.filter(b => b.workerId === workerId);
  },

  /* ---------- AUTH & SESSION ---------- */
  getCurrentUser() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER));
    } catch (e) {
      return null;
    }
  },

  setCurrentUser(userObj) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userObj));
    // Dispatch custom event for UI updates
    window.dispatchEvent(new CustomEvent('coop_user_changed', { detail: userObj }));
  },

  logoutUser() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    window.dispatchEvent(new CustomEvent('coop_user_changed', { detail: null }));
  },

  /* ---------- WORKER STATUS ---------- */
  getWorkerStatus() {
    return localStorage.getItem(STORAGE_KEYS.WORKER_STATUS) || 'online';
  },

  setWorkerStatus(status) {
    localStorage.setItem(STORAGE_KEYS.WORKER_STATUS, status);
    window.dispatchEvent(new CustomEvent('coop_status_changed', { detail: status }));
  }
};

// Initialize right away
CoopStore.init();
