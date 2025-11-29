// document.addEventListener("DOMContentLoaded", async () => {
//   const token = localStorage.getItem("token");
//   const user = JSON.parse(localStorage.getItem("user"));
//   const mainContent = document.querySelector(".main-content");

//   // --- Helper Functions ---
//   const showToast = (message) => {
//     const toast = document.createElement("div");
//     toast.className = "toast show";
//     toast.textContent = message;
//     document.body.appendChild(toast);
//     setTimeout(() => {
//       toast.classList.remove("show");
//       setTimeout(() => document.body.removeChild(toast), 300);
//     }, 3000);
//   };

//   const createTournamentCard = (tournament) => {
//     const isParticipant = tournament.participants.includes(user?.id);
//     const buttonText = isParticipant ? "Joined ✔️" : "Join Tournament";
//     const buttonDisabled = isParticipant ? "disabled" : "";

//     // Format date for display
//     const eventDate = new Date(tournament.date);
//     const formattedDate = eventDate.toLocaleDateString("en-US", {
//       month: "short",
//       day: "numeric",
//       year: "numeric",
//     });

//     return `
//             <div class="tournament-card" data-id="${tournament._id}">
//                 <img src="images/avatar${
//                   Math.floor(Math.random() * 3) + 1
//                 }.jpeg" alt="${tournament.title}" class="card-banner">
//                 <div class="card-body">
//                     <h3 class="card-title">${tournament.title}</h3>
//                     <div class="card-meta">
//                         <span><i class="fas fa-gamepad"></i> ${
//                           tournament.game
//                         }</span>
//                         <span><i class="fas fa-calendar-alt"></i> ${formattedDate}</span>
//                     </div>
//                     <div class="card-meta">
//                         <span><i class="fas fa-users"></i> ${
//                           tournament.participants.length
//                         } Joined</span>
//                     </div>
//                     <button class="join-button" ${buttonDisabled}>${buttonText}</button>
//                 </div>
//             </div>
//         `;
//   };

//   // --- Main Logic: Fetch and Render Tournaments ---
//   const loadTournaments = async () => {
//     try {
//       const response = await fetch("/api/tournaments");
//       if (!response.ok) throw new Error("Failed to fetch tournaments");
//       const tournaments = await response.json();

//       if (tournaments.length > 0) {
//         mainContent.innerHTML = tournaments.map(createTournamentCard).join("");
//       } else {
//         mainContent.innerHTML =
//           '<p class="no-tournaments">No upcoming tournaments found. Why not create one?</p>';
//       }
//     } catch (error) {
//       console.error("Error loading tournaments:", error);
//       mainContent.innerHTML =
//         '<p class="error">Could not load tournaments. Please try again later.</p>';
//       showToast("Error: Could not load tournaments.");
//     }
//   };

//   // --- Event Listener for Joining Tournaments ---
//   mainContent.addEventListener("click", async (event) => {
//     if (event.target.classList.contains("join-button")) {
//       const button = event.target;
//       const card = button.closest(".tournament-card");
//       const tournamentId = card.dataset.id;

//       if (!token || !user) {
//         showToast("You must be logged in to join.");
//         window.location.href = "login.html";
//         return;
//       }

//       if (button.disabled) return;

//       try {
//         const response = await fetch(`/api/tournaments/${tournamentId}/join`, {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         });

//         if (!response.ok) {
//           const errData = await response.json();
//           throw new Error(errData.error || "Failed to join");
//         }

//         button.textContent = "Joined ✔️";
//         button.disabled = true;
//         showToast(
//           `Successfully joined "${
//             card.querySelector(".card-title").textContent
//           }"!`
//         );

//         // Optionally, update the participant count visually
//         const participantsSpan = card.querySelector(".fa-users").parentElement;
//         const currentCount = parseInt(
//           participantsSpan.textContent.match(/\d+/)[0]
//         );
//         participantsSpan.innerHTML = `<i class="fas fa-users"></i> ${
//           currentCount + 1
//         } Joined`;
//       } catch (error) {
//         console.error("Error joining tournament:", error);
//         showToast(`Error: ${error.message}`);
//       }
//     }
//   });

//   // --- Initial Load ---
//   if (user) {
//     document.getElementById("user-name").textContent = user.name;
//     const initials = user.name
//       .split(" ")
//       .map((n) => n[0])
//       .join("")
//       .toUpperCase();
//     document.getElementById("user-initials").textContent = initials;
//   }

//   loadTournaments();
// js/tournaments.js
// Gaming-style UI behavior (keeps your original fetch/join logic intact, adds UX polish)

document.addEventListener("DOMContentLoaded", () => {
  fetchTournaments();
  setupFilters();
  setupAdminControls();
});

let allTournaments = [];

async function fetchTournaments() {
  try {
    const res = await fetch("/api/tournaments");
    allTournaments = await res.json();
    renderTournaments(allTournaments);
  } catch (err) {
    console.error("Error fetching tournaments:", err);
  }
}

function renderTournaments(tournaments) {
  const grid = document.getElementById("tournamentsGrid");
  if (!grid) return;
  grid.innerHTML = "";

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.role === "admin";

  tournaments.forEach(t => {
    const card = document.createElement("div");
    card.className = `tournament-card ${t.isFeatured ? 'featured' : ''}`;

    const date = new Date(t.date).toLocaleDateString();
    const isFull = t.participants.length >= (t.maxParticipants || 100);
    const isRegistered = user.id && t.participants.some(p => (p._id || p) === user.id);

    let statusBadge = "";
    if (!t.registrationOpen) statusBadge = '<span class="badge closed">Closed</span>';
    else if (isFull) statusBadge = '<span class="badge full">Full</span>';
    else statusBadge = '<span class="badge open">Open</span>';

    let adminControls = "";
    if (isAdmin) {
      adminControls = `
                <div class="admin-controls">
                    <button onclick="toggleRegistration('${t._id}', ${!t.registrationOpen})" class="btn-sm">
                        ${t.registrationOpen ? 'Close Reg' : 'Open Reg'}
                    </button>
                    <button onclick="toggleFeatured('${t._id}', ${!t.isFeatured})" class="btn-sm">
                        ${t.isFeatured ? 'Unfeature' : 'Feature'}
                    </button>
                </div>
            `;
    }

    let actionBtn = "";
    if (t.registrationOpen && !isFull && !isRegistered) {
      actionBtn = `<button onclick="joinTournament('${t._id}')" class="btn-join">Join Now</button>`;
    } else if (isRegistered) {
      actionBtn = `<button class="btn-registered" disabled>Registered</button>`;
    } else {
      actionBtn = `<button class="btn-closed" disabled>Unavailable</button>`;
    }

    card.innerHTML = `
            <div class="card-header" style="background-image: url('${t.banner || 'images/default-tournament.jpg'}')">
                ${statusBadge}
                ${t.isFeatured ? '<span class="badge featured-badge">Featured</span>' : ''}
            </div>
            <div class="card-body">
                <h3>${t.title}</h3>
                <div class="meta">
                    <span><i class="fas fa-gamepad"></i> ${t.game}</span>
                    <span><i class="fas fa-calendar"></i> ${date}</span>
                    <span><i class="fas fa-clock"></i> ${t.time || 'TBA'}</span>
                </div>
                <p class="prize">Prize Pool: ${t.prize || 'TBA'}</p>
                <div class="participants-info">
                    <span>${t.participants.length} / ${t.maxParticipants || '∞'} Players</span>
                </div>
                ${actionBtn}
                ${adminControls}
            </div>
        `;
    grid.appendChild(card);
  });
}

function setupFilters() {
  const searchInput = document.getElementById("searchTournament");
  const gameFilter = document.getElementById("filterGame");
  const statusFilter = document.getElementById("filterStatus");

  if (!searchInput || !gameFilter || !statusFilter) return;

  function filter() {
    const search = searchInput.value.toLowerCase();
    const game = gameFilter.value;
    const status = statusFilter.value;

    const filtered = allTournaments.filter(t => {
      const matchSearch = t.title.toLowerCase().includes(search);
      const matchGame = game === "all" || t.game === game;

      let matchStatus = true;
      if (status === "open") matchStatus = t.registrationOpen;
      if (status === "closed") matchStatus = !t.registrationOpen;

      return matchSearch && matchGame && matchStatus;
    });

    renderTournaments(filtered);
  }

  searchInput.addEventListener("input", filter);
  gameFilter.addEventListener("change", filter);
  statusFilter.addEventListener("change", filter);
}

function setupAdminControls() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const createBtn = document.getElementById("createTournamentBtn");

  if (user.role === "admin" && createBtn) {
    createBtn.style.display = "block";
    createBtn.addEventListener("click", () => {
      document.getElementById("createTournamentModal").style.display = "block";
    });
  }

  // Modal close logic
  const modal = document.getElementById("createTournamentModal");
  const closeBtn = document.querySelector(".close-modal");
  if (modal && closeBtn) {
    closeBtn.onclick = () => modal.style.display = "none";
    window.onclick = (e) => {
      if (e.target === modal) modal.style.display = "none";
    };
  }

  // Create form submission
  const form = document.getElementById("createTournamentForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/tournaments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(data)
        });

        if (res.ok) {
          alert("Tournament created successfully!");
          modal.style.display = "none";
          form.reset();
          fetchTournaments();
        } else {
          const err = await res.json();
          alert(err.error || "Failed to create tournament");
        }
      } catch (err) {
        console.error(err);
        alert("Error creating tournament");
      }
    });
  }
}

// Global functions for inline onclick handlers
window.joinTournament = async (id) => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  if (!confirm("Confirm registration for this tournament?")) return;

  try {
    const res = await fetch(`/api/tournaments/${id}/join`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (res.ok) {
      alert("Successfully joined!");
      fetchTournaments();
    } else {
      const err = await res.json();
      alert(err.error || "Failed to join");
    }
  } catch (err) {
    console.error(err);
    alert("Error joining tournament");
  }
};

window.toggleRegistration = async (id, status) => {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/tournaments/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ registrationOpen: status })
    });

    if (res.ok) fetchTournaments();
  } catch (err) {
    console.error(err);
  }
};

window.toggleFeatured = async (id, status) => {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/tournaments/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ isFeatured: status })
    });

    if (res.ok) fetchTournaments();
  } catch (err) {
    console.error(err);
  }
};
