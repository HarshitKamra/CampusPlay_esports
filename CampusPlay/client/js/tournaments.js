document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  // DOM targets
  const featuredGrid = document.getElementById("featured-tournaments-grid");
  const upcomingGrid = document.getElementById("upcoming-tournaments-grid");

  // Modal Elements
  const createBtn = document.getElementById('createTournamentBtn');
  const modal = document.getElementById('createTournamentModal');
  const closeBtn = document.getElementById('closeModal');
  const submitBtn = document.getElementById('submitTournament');

  // Search/Filter Elements
  const searchInput = document.getElementById('search-input');
  const featuredFilterBtn = document.getElementById('filter-featured');
  const sortSelect = document.getElementById('sort-select');

  // State
  let allTournaments = [];
  let currentFilter = 'all'; // 'all', 'featured'
  let currentSort = 'upcoming'; // 'upcoming', 'popular', 'prize'
  let searchQuery = '';

  // Ensure Toast Container
  let toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);
  }

  // Hide create tournament button for non-admin users
  if (createBtn && (!user || user.role !== 'admin')) {
    createBtn.style.display = 'none';
  }

  // User Info Display
  if (user) {
    const nameEl = document.getElementById("user-name");
    const initialsEl = document.getElementById("user-initials");
    if (nameEl) nameEl.textContent = user.name || "User";
    if (initialsEl) {
      initialsEl.textContent = (user.name || "U").charAt(0).toUpperCase();
    }

    const adminActions = document.getElementById("admin-actions");
    if (adminActions && user.role === 'admin') {
      adminActions.style.display = "block";
    }
  }

  // --- Helper Functions ---
  function showToast(message, type = "info") {
    const t = document.createElement("div");
    t.className = `toast ${type}`;
    t.textContent = message;
    toastContainer.appendChild(t);

    setTimeout(() => {
      t.style.opacity = "1";
    }, 10);

    setTimeout(() => {
      t.style.opacity = "0";
      setTimeout(() => t.remove(), 300);
    }, 3000);
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // --- API Calls ---
  async function loadTournaments() {
    try {
      const res = await fetch("/api/tournaments");
      if (!res.ok) throw new Error("Failed to fetch tournaments");
      allTournaments = await res.json();
      filterAndDisplayTournaments();
    } catch (err) {
      console.error("Error loading tournaments:", err);
      showToast("Could not load tournaments", "error");
    }
  }

  function filterAndDisplayTournaments() {
    if (!featuredGrid || !upcomingGrid) return;

    let filtered = [...allTournaments];

    // 1. Search Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.game && t.game.toLowerCase().includes(q)) ||
        (t.prize && t.prize.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }

    // 2. Featured Filter (Toggle)
    if (currentFilter === 'featured') {
      filtered = filtered.filter(t => t.isFeatured);
    }

    // 3. Sorting
    if (currentSort === 'popular') {
      filtered.sort((a, b) => (b.participants?.length || 0) - (a.participants?.length || 0));
    } else if (currentSort === 'prize') {
      filtered.sort((a, b) => {
        const prizeA = parseInt((a.prize || "0").replace(/[^0-9]/g, '')) || 0;
        const prizeB = parseInt((b.prize || "0").replace(/[^0-9]/g, '')) || 0;
        return prizeB - prizeA;
      });
    } else {
      // Default: Upcoming (Date ascending)
      filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    renderGrids(filtered);
  }

  function renderGrids(tournaments) {
    featuredGrid.innerHTML = "";
    upcomingGrid.innerHTML = "";

    tournaments.forEach(t => {
      const card = createTournamentCard(t);
      if (t.isFeatured) {
        featuredGrid.appendChild(card);
      } else {
        upcomingGrid.appendChild(card);
      }
    });

    if (featuredGrid.children.length === 0) {
      featuredGrid.innerHTML = '<div class="no-tournaments">No featured tournaments yet.</div>';
    }
    if (upcomingGrid.children.length === 0) {
      upcomingGrid.innerHTML = '<div class="no-tournaments">No upcoming tournaments found.</div>';
    }
  }

  function createTournamentCard(t) {
    // Check if user is a participant - handle both ObjectId strings and populated user objects
    const isParticipant = user && Array.isArray(t.participants) && t.participants.some(p => {
      const participantId = typeof p === 'object' && p._id ? p._id.toString() : p.toString();
      return participantId === user.id.toString();
    });
    const eventDate = new Date(t.date);
    const formattedDate = isNaN(eventDate.getTime())
      ? "TBA"
      : eventDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    const timeDisplay = t.time ? ` • ${t.time}` : "";
    const bannerSrc = t.banner || "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80";

    // Status badges
    let statusBadge = '';
    let joinButtonState = '';
    let buttonText = isParticipant ? "Joined ✔️" : "Join Now";

    // Check registration status (default to open if undefined)
    const isRegOpen = t.registrationOpen !== false;

    if (!isRegOpen) {
      statusBadge = `<span class="status-badge closed" style="background:#e74c3c; color:white; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:700; margin-left:8px;">CLOSED</span>`;
      joinButtonState = 'disabled style="opacity:0.6; cursor:not-allowed; background:#555;"';
      buttonText = "Closed";
    } else if (isParticipant) {
      joinButtonState = 'disabled';
    }

    // Admin controls
    let adminControls = '';
    if (user && user.role === 'admin') {
      adminControls = `
        <div class="admin-controls" style="margin-top:12px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.1); display:flex; gap:8px;">
          <button onclick="toggleRegistration('${t._id}', ${isRegOpen})" class="btn-mini" style="font-size:11px; padding:4px 8px; background:${isRegOpen ? '#e74c3c' : '#2ecc71'}; color:white; border:none; border-radius:4px; cursor:pointer;">
            ${isRegOpen ? 'Close Reg' : 'Open Reg'}
          </button>
          <button onclick="toggleFeatured('${t._id}', ${t.isFeatured})" class="btn-mini" style="font-size:11px; padding:4px 8px; background:${t.isFeatured ? '#f1c40f' : '#3498db'}; color:${t.isFeatured ? 'black' : 'white'}; border:none; border-radius:4px; cursor:pointer;">
            ${t.isFeatured ? 'Unfeature' : 'Feature'}
          </button>
        </div>
      `;
    }

    // Entry price display
    const entryPrice = t.entryPrice || 0;
    const entryPriceDisplay = entryPrice > 0 
      ? `<div style="margin: 8px 0; padding: 8px; background: rgba(255, 71, 87, 0.1); border-radius: 6px; border: 1px solid rgba(255, 71, 87, 0.3);">
          <span style="color: #ff4757; font-weight: 600;"><i class="fas fa-rupee-sign"></i> ${entryPrice} Entry Fee</span>
        </div>`
      : `<div style="margin: 8px 0; padding: 8px; background: rgba(46, 204, 113, 0.1); border-radius: 6px; border: 1px solid rgba(46, 204, 113, 0.3);">
          <span style="color: #2ecc71; font-weight: 600;"><i class="fas fa-gift"></i> Free Entry</span>
        </div>`;

    const cardHtml = `
      <div class="tournament-card" data-id="${t._id}">
        <div class="card-banner" style="background-image: url('${bannerSrc}'); background-size: cover; background-position: center;">
          <span class="game-tag">${escapeHtml(t.game)}</span>
          ${t.prize ? `<span class="prize-tag" style="position:absolute; top:10px; right:10px; background:#ffd700; color:black; font-weight:800; padding:4px 8px; border-radius:4px; font-size:12px;">🏆 ${escapeHtml(t.prize)}</span>` : ''}
        </div>
        <div class="card-body">
          <div style="display:flex; justify-content:space-between; align-items:start;">
            <h3 class="card-title">${escapeHtml(t.title)} ${statusBadge}</h3>
            <span class="date badge"><i class="fas fa-calendar-alt"></i> ${formattedDate}</span>
          </div>
          ${t.time ? `<div style="color:var(--text-medium); font-size:12px; margin-top:4px; margin-bottom:8px;"><i class="far fa-clock"></i> ${escapeHtml(t.time)}</div>` : ''}
          ${entryPriceDisplay}
          ${t.description ? `<div class="card-desc">${escapeHtml(t.description)}</div>` : ''}
          
          <div class="card-footer">
            <div class="slots"><i class="fas fa-users"></i>&nbsp; <span class="participant-count">${t.participants ? t.participants.length : 0}</span> Joined</div>
            <div><button class="join-button" onclick="${entryPrice > 0 && !isParticipant ? `initiatePayment('${t._id}', ${entryPrice})` : `joinTournament('${t._id}')`}" ${joinButtonState}>${entryPrice > 0 && !isParticipant ? `Pay ₹${entryPrice}` : buttonText}</button></div>
            ${entryPrice > 0 && !isParticipant ? `<div style="margin-top: 8px; font-size: 0.85em; color: #888; text-align: center;">Payment via UPI</div>` : ''}
          </div>
          ${adminControls}
        </div>
      </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = cardHtml.trim();
    return div.firstChild;
  }

  async function createTournament() {
    const nameInput = document.getElementById('tournamentName');
    const dateInput = document.getElementById('tournamentDate');
    const timeInput = document.getElementById('tournamentTime');
    const prizeInput = document.getElementById('tournamentPrize');
    const bannerInput = document.getElementById('tournamentBanner');
    const descInput = document.getElementById('tournamentDescription');
    const featuredInput = document.getElementById('tournamentFeatured');

    const title = nameInput.value.trim();
    const date = dateInput.value;
    const time = timeInput.value.trim();
    const banner = bannerInput.value.trim();
    const prize = prizeInput.value.trim();
    const description = descInput.value.trim();
    const isFeatured = featuredInput ? featuredInput.checked : false;

    if (!title || !date) {
      showToast("Please enter name and date", "error");
      return;
    }

    const game = "General Esports";
    const dateObj = new Date(date);
    const isoDate = dateObj.toISOString();

    try {
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ title, date: isoDate, game, banner, prize, description, time, isFeatured })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create");
      }

      showToast("Tournament created successfully!", "success");
      modal.style.display = 'none';
      loadTournaments();

      // Reset form
      nameInput.value = "";
      dateInput.value = "";
      timeInput.value = "";
      bannerInput.value = "";
      prizeInput.value = "";
      descInput.value = "";
      if (featuredInput) featuredInput.checked = false;
    } catch (err) {
      console.error(err);
      showToast(err.message, "error");
    }
  }

  // --- Global Functions for inline onclick ---
  window.joinTournament = async (id) => {
    if (!token) {
      showToast("Please login to join", "error");
      return;
    }

    try {
      const res = await fetch(`/api/tournaments/${id}/join`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res.ok) {
        const data = await res.json();
        // If payment required, initiate payment
        if (res.status === 402 && data.entryPrice) {
          initiatePayment(id, data.entryPrice);
          return;
        }
        throw new Error(data.error || "Failed to join");
      }

      showToast("Joined tournament!", "success");
      loadTournaments();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // Payment functions - UPI Payment Flow
  window.initiatePayment = async (tournamentId, amount) => {
    if (!token) {
      showToast("Please login to make payment", "error");
      return;
    }

    try {
      // Get tournament details to show UPI ID
      const tournamentRes = await fetch(`/api/tournaments`);
      if (!tournamentRes.ok) throw new Error("Failed to fetch tournament details");
      
      const tournaments = await tournamentRes.json();
      const tournament = tournaments.find(t => t._id === tournamentId);
      
      if (!tournament) {
        showToast("Tournament not found", "error");
        return;
      }

      if (!tournament.upiId) {
        showToast("UPI ID not configured for this tournament. Please contact admin.", "error");
        return;
      }

      // Create payment record
      const paymentRes = await fetch("/api/payments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ tournamentId })
      });

      if (!paymentRes.ok) {
        const data = await paymentRes.json();
        throw new Error(data.error || "Failed to create payment record");
      }

      const paymentData = await paymentRes.json();

      // Get payment status to check if transaction ID is already submitted
      const statusRes = await fetch(`/api/payments/status/${tournamentId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      let paymentStatus = null;
      if (statusRes.ok) {
        paymentStatus = await statusRes.json();
      }

      // Store tournament for later use
      window.currentTournament = tournament;
      window.currentTournamentId = tournamentId;

      // Show UPI payment modal
      showUpiPaymentModal(tournament, amount, paymentData.payment.id, paymentStatus);

    } catch (err) {
      console.error("Payment initiation error:", err);
      showToast(err.message || "Failed to initiate payment", "error");
    }
  };

  // Show UPI Payment Modal
  function showUpiPaymentModal(tournament, amount, paymentId, paymentStatus) {
    const hasTransactionId = paymentStatus?.playerTransactionId || false;
    const submittedTransactionId = paymentStatus?.playerTransactionId || "";

    // Create modal
    const modal = document.createElement("div");
    modal.id = "upiPaymentModal";
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;

    modal.innerHTML = `
      <div style="background: linear-gradient(180deg, rgba(26,26,26,0.95), rgba(20,20,20,0.9)); 
                   border: 1px solid #333; 
                   border-radius: 12px; 
                   padding: 30px; 
                   max-width: 500px; 
                   width: 90%;
                   max-height: 90vh;
                   overflow-y: auto;
                   box-shadow: 0 8px 32px rgba(0,0,0,0.5);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 style="color: #fff; margin: 0; font-size: 1.5em;">Payment Instructions</h2>
          <button onclick="this.closest('#upiPaymentModal').remove()" 
                  style="background: none; border: none; color: #888; font-size: 1.5em; cursor: pointer; padding: 0; width: 30px; height: 30px;">&times;</button>
        </div>
        
        <div style="margin-bottom: 20px;">
          <p style="color: #ccc; margin-bottom: 15px;">Please send ₹${amount} to the following UPI ID:</p>
          <div style="background: rgba(255, 71, 87, 0.1); 
                      border: 2px solid rgba(255, 71, 87, 0.3); 
                      border-radius: 8px; 
                      padding: 20px; 
                      text-align: center;
                      margin-bottom: 15px;">
            <div style="color: #888; font-size: 0.9em; margin-bottom: 8px;">UPI ID</div>
            <div id="upiIdDisplay" style="color: #ff4757; font-size: 1.3em; font-weight: 700; word-break: break-all; cursor: pointer;" 
                 onclick="copyUpiId('${tournament.upiId}')">${tournament.upiId}</div>
            <button onclick="copyUpiId('${tournament.upiId}')" 
                    style="margin-top: 10px; background: #ff4757; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.9em;">
              <i class="fas fa-copy"></i> Copy UPI ID
            </button>
          </div>
          
          <div style="background: rgba(255, 255, 255, 0.05); 
                      border: 1px solid #333; 
                      border-radius: 8px; 
                      padding: 15px; 
                      margin-bottom: 15px;">
            <div style="color: #888; font-size: 0.85em; margin-bottom: 5px;">Tournament</div>
            <div style="color: #fff; font-weight: 600;">${escapeHtml(tournament.title)}</div>
            <div style="color: #888; font-size: 0.85em; margin-top: 5px;">Amount: ₹${amount}</div>
          </div>
          
          ${hasTransactionId ? `
            <div style="background: rgba(46, 204, 113, 0.1); 
                        border: 1px solid rgba(46, 204, 113, 0.3); 
                        border-radius: 8px; 
                        padding: 15px; 
                        margin-bottom: 15px;">
              <div style="color: #2ecc71; font-size: 0.9em; margin-bottom: 8px;">
                <i class="fas fa-check-circle"></i> <strong>Transaction ID Submitted</strong>
              </div>
              <div style="color: #fff; font-size: 0.9em; word-break: break-all; font-family: monospace;">
                ${escapeHtml(submittedTransactionId)}
              </div>
              <div style="color: #888; font-size: 0.8em; margin-top: 8px;">
                Your payment is pending admin confirmation.
              </div>
            </div>
          ` : `
            <div style="background: rgba(255, 193, 7, 0.1); 
                        border: 1px solid rgba(255, 193, 7, 0.3); 
                        border-radius: 8px; 
                        padding: 15px; 
                        margin-bottom: 15px;">
              <div style="color: #ffc107; font-size: 0.9em; margin-bottom: 10px;">
                <i class="fas fa-info-circle"></i> <strong>After Payment:</strong> Submit your transaction ID below
              </div>
              <form id="transactionIdForm" onsubmit="submitTransactionId(event, '${paymentId}'); return false;">
                <input type="text" 
                       id="transactionIdInput" 
                       placeholder="Enter transaction ID from your payment app" 
                       required
                       style="width: 100%; 
                              padding: 10px; 
                              border-radius: 6px; 
                              border: 1px solid #444; 
                              background: #1a1a1a; 
                              color: #fff; 
                              font-size: 0.9em;
                              margin-bottom: 10px;
                              box-sizing: border-box;">
                <button type="submit" 
                        style="width: 100%; 
                               background: #2ecc71; 
                               color: white; 
                               border: none; 
                               padding: 10px; 
                               border-radius: 6px; 
                               cursor: pointer; 
                               font-weight: 600;
                               font-size: 0.9em;">
                  <i class="fas fa-paper-plane"></i> Submit Transaction ID
                </button>
              </form>
              <div id="transactionIdMessage" style="margin-top: 10px; display: none; padding: 8px; border-radius: 4px; font-size: 0.85em;"></div>
            </div>
          `}
          
          <div style="background: rgba(52, 152, 219, 0.1); 
                      border: 1px solid rgba(52, 152, 219, 0.3); 
                      border-radius: 8px; 
                      padding: 15px; 
                      margin-bottom: 20px;">
            <div style="color: #3498db; font-size: 0.9em;">
              <i class="fas fa-info-circle"></i> <strong>Note:</strong> Your registration will be pending until admin confirms the payment. You will be notified once confirmed.
            </div>
          </div>
        </div>
        
        <div style="display: flex; gap: 10px;">
          <button onclick="this.closest('#upiPaymentModal').remove()" 
                  style="flex: 1; background: #444; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-weight: 600;">
            Close
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close on outside click
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  // Submit transaction ID
  window.submitTransactionId = async function(event, paymentId) {
    event.preventDefault();
    
    const token = localStorage.getItem("token");
    const transactionIdInput = document.getElementById("transactionIdInput");
    const messageDiv = document.getElementById("transactionIdMessage");
    const submitButton = event.target.querySelector('button[type="submit"]');
    
    if (!transactionIdInput || !transactionIdInput.value.trim()) {
      showToast("Please enter a transaction ID", "error");
      return;
    }

    const transactionId = transactionIdInput.value.trim();
    
    // Disable button
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    messageDiv.style.display = "none";

    try {
      const res = await fetch(`/api/payments/submit-transaction/${paymentId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ transactionId })
      });

      const data = await res.json();

      if (res.ok) {
        messageDiv.style.display = "block";
        messageDiv.style.background = "rgba(46, 204, 113, 0.2)";
        messageDiv.style.color = "#2ecc71";
        messageDiv.style.border = "1px solid #2ecc71";
        messageDiv.textContent = "✓ Transaction ID submitted successfully!";
        
        transactionIdInput.value = "";
        transactionIdInput.disabled = true;
        
        showToast("Transaction ID submitted successfully!", "success");
        
        // Reload payment status and update modal
        setTimeout(() => {
          const tournamentId = window.currentTournamentId;
          if (tournamentId) {
            fetch(`/api/payments/status/${tournamentId}`, {
              headers: { "Authorization": `Bearer ${token}` }
            })
            .then(r => r.json())
            .then(status => {
              // Close and reopen modal with updated status
              document.getElementById("upiPaymentModal")?.remove();
              const tournament = window.currentTournament;
              if (tournament) {
                showUpiPaymentModal(tournament, tournament.entryPrice, paymentId, status);
              }
            });
          }
        }, 1500);
      } else {
        messageDiv.style.display = "block";
        messageDiv.style.background = "rgba(231, 76, 60, 0.2)";
        messageDiv.style.color = "#e74c3c";
        messageDiv.style.border = "1px solid #e74c3c";
        messageDiv.textContent = data.error || "Failed to submit transaction ID";
        showToast(data.error || "Failed to submit transaction ID", "error");
      }
    } catch (error) {
      console.error("Error submitting transaction ID:", error);
      messageDiv.style.display = "block";
      messageDiv.style.background = "rgba(231, 76, 60, 0.2)";
      messageDiv.style.color = "#e74c3c";
      messageDiv.style.border = "1px solid #e74c3c";
      messageDiv.textContent = "Error submitting transaction ID. Please try again.";
      showToast("Error submitting transaction ID", "error");
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Transaction ID';
    }
  };

  // Copy UPI ID to clipboard
  window.copyUpiId = function(upiId) {
    navigator.clipboard.writeText(upiId).then(() => {
      showToast("UPI ID copied to clipboard!", "success");
    }).catch(() => {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = upiId;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      showToast("UPI ID copied to clipboard!", "success");
    });
  };

  window.toggleRegistration = async (id, currentStatus) => {
    if (!token) {
      showToast("Please login to manage tournaments", "error");
      return;
    }
    
    const newStatus = !currentStatus;
    const action = newStatus ? "opened" : "closed";
    
    try {
      const res = await fetch(`/api/tournaments/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ registrationOpen: newStatus })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to ${action} registration`);
      }

      const data = await res.json();
      showToast(`Registration ${action} successfully!`, "success");
      loadTournaments();
    } catch (err) {
      console.error("Error toggling registration:", err);
      showToast(err.message || "Failed to update registration status", "error");
    }
  };

  window.toggleFeatured = async (id, currentStatus) => {
    if (!token) {
      showToast("Please login to manage tournaments", "error");
      return;
    }
    
    const newStatus = !currentStatus;
    const action = newStatus ? "featured" : "unfeatured";
    
    try {
      const res = await fetch(`/api/tournaments/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isFeatured: newStatus })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to ${action} tournament`);
      }

      showToast(`Tournament ${action} successfully!`, "success");
      loadTournaments();
    } catch (err) {
      console.error("Error toggling featured:", err);
      showToast(err.message || "Failed to update featured status", "error");
    }
  };

  // --- Event Listeners ---
  if (createBtn && modal) {
    createBtn.addEventListener('click', () => {
      if (!token) {
        showToast("Please login to create a tournament", "error");
        return;
      }
      modal.style.display = 'flex';
    });
  }
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
  }
  if (submitBtn) {
    submitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      createTournament();
    });
  }

  // Search/Filter Listeners
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      filterAndDisplayTournaments();
    });
  }

  if (featuredFilterBtn) {
    featuredFilterBtn.addEventListener('click', () => {
      currentFilter = currentFilter === 'featured' ? 'all' : 'featured';
      featuredFilterBtn.style.background = currentFilter === 'featured'
        ? 'linear-gradient(90deg, rgba(255,71,87,0.12), rgba(157,31,31,0.06))'
        : 'rgba(255,255,255,0.01)';
      filterAndDisplayTournaments();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      filterAndDisplayTournaments();
    });
  }

  // Initial Load
  loadTournaments();
});
