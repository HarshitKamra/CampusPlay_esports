// Global variables
let allStats = [];
let csvData = [];

document.addEventListener("DOMContentLoaded", () => {
  fetchStats();
  setupFilters();
  setupAdminPanel();
});

async function fetchStats() {
  try {
    const res = await fetch("/api/stats");
    allStats = await res.json();
    renderTable(allStats);
  } catch (err) {
    console.error("Error fetching stats:", err);
  }
}

function renderTable(stats) {
  const tbody = document.querySelector("#statsTable tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  stats.forEach((player, index) => {
    const tr = document.createElement("tr");

    // Check if user is admin to show delete button
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const isAdmin = user.role === "admin";

    let actionHtml = "";
    if (isAdmin) {
      actionHtml = `<td><button class="delete-btn" onclick="deleteStat('${player._id}')">Delete</button></td>`;
      // Ensure header exists
      const headerRow = document.querySelector("#statsTable thead tr");
      if (headerRow && !headerRow.querySelector(".actions-header")) {
        const th = document.createElement("th");
        th.className = "actions-header";
        th.textContent = "Actions";
        headerRow.appendChild(th);
      }
    }

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${player.name}</td>
      <td>${player.game}</td>
      <td>${player.campus}</td>
      <td>${player.tier}</td>
      <td>${player.matchesPlayed}</td>
      <td>${player.wins}</td>
      <td>${player.kills}</td>
      <td>${player.damage}</td>
      <td>${player.kdRatio}</td>
      <td>${player.winRate}%</td>
      ${actionHtml}
    `;
    tbody.appendChild(tr);
  });
}

function setupFilters() {
  const gameFilter = document.getElementById("gameFilter");
  const campusFilter = document.getElementById("campusFilter");
  const searchInput = document.getElementById("searchInput");

  if (!gameFilter || !campusFilter || !searchInput) return;

  function filterStats() {
    const game = gameFilter.value;
    const campus = campusFilter.value;
    const search = searchInput.value.toLowerCase();

    const filtered = allStats.filter((p) => {
      let matchGame = game === "all" || p.game === game;
      if (game === "Top Tier") {
        // Filter for high tiers (Ace, Conqueror) or high rating
        const tier = (p.tier || "").toLowerCase();
        matchGame = tier.includes("ace") || tier.includes("conqueror") || (p.rating && p.rating >= 3200);
      }

      const matchCampus = campus === "all" || p.campus === campus;
      const matchSearch = p.name.toLowerCase().includes(search);
      return matchGame && matchCampus && matchSearch;
    });

    renderTable(filtered);
  }

  gameFilter.addEventListener("change", filterStats);
  campusFilter.addEventListener("change", filterStats);
  searchInput.addEventListener("input", filterStats);
}

function setupAdminPanel() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const adminPanel = document.getElementById("adminPanel");

  if (user.role !== "admin") {
    if (adminPanel) adminPanel.style.display = "none";
    return;
  }

  if (adminPanel) adminPanel.style.display = "block";

  // CSV Upload Logic
  const fileInput = document.getElementById("csvFileInput");
  const previewBtn = document.getElementById("previewBtn");
  const uploadBtn = document.getElementById("uploadBtn");
  const previewArea = document.getElementById("previewArea");

  if (previewBtn) {
    previewBtn.addEventListener("click", () => {
      const file = fileInput.files[0];
      if (!file) {
        alert("Please select a CSV file first.");
        return;
      }

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
          csvData = results.data;
          renderPreview(csvData);
          uploadBtn.disabled = false;
        },
        error: function (err) {
          console.error("CSV Error:", err);
          alert("Error parsing CSV file.");
        }
      });
    });
  }

  if (uploadBtn) {
    uploadBtn.addEventListener("click", async () => {
      if (csvData.length === 0) return;

      const gameSelect = document.getElementById("csvGameSelect");
      const campusSelect = document.getElementById("csvCampusSelect");
      const selectedGame = gameSelect ? gameSelect.value : "BGMI";
      const selectedCampus = campusSelect ? campusSelect.value : "Patiala";

      // Inject selected game/campus into data if missing
      const processedData = csvData.map(row => ({
        ...row,
        game: row.game || selectedGame,
        campus: row.campus || selectedCampus
      }));

      const replaceMode = document.querySelector('input[name="replaceMode"]:checked')?.value || 'append';

      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/stats/upload?replaceMode=${replaceMode}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(processedData)
        });

        const data = await res.json();
        if (res.ok) {
          alert(`Success: ${data.message}`);
          csvData = [];
          if (previewArea) previewArea.innerHTML = "";
          if (fileInput) fileInput.value = "";
          uploadBtn.disabled = true;
          fetchStats(); // Refresh table
        } else {
          alert(`Error: ${data.error}`);
        }
      } catch (err) {
        console.error("Upload error:", err);
        alert("Failed to upload stats.");
      }
    });
  }

  // Delete All Stats Button
  const deleteAllBtn = document.getElementById("deleteAllStatsBtn");
  if (deleteAllBtn) {
    deleteAllBtn.addEventListener("click", async () => {
      if (!confirm("Are you sure you want to delete ALL stats? This cannot be undone.")) return;

      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/stats?all=true", {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.ok) {
          alert("All stats deleted successfully.");
          fetchStats();
        } else {
          alert("Failed to delete stats.");
        }
      } catch (err) {
        console.error(err);
        alert("Error deleting stats.");
      }
    });
  }
}

function renderPreview(data) {
  const previewArea = document.getElementById("previewArea");
  if (!previewArea) return;

  if (data.length === 0) {
    previewArea.innerHTML = "<p>No data found in CSV.</p>";
    return;
  }

  // Show first 5 rows
  const headers = Object.keys(data[0]);
  let html = '<table class="preview-table"><thead><tr>';
  headers.forEach(h => html += `<th>${h}</th>`);
  html += '</tr></thead><tbody>';

  data.slice(0, 5).forEach(row => {
    html += '<tr>';
    headers.forEach(h => html += `<td>${row[h] || ''}</td>`);
    html += '</tr>';
  });

  html += '</tbody></table>';
  if (data.length > 5) html += `<p>...and ${data.length - 5} more rows.</p>`;

  previewArea.innerHTML = html;
}

// Global function for delete button in table
window.deleteStat = async function (id) {
  if (!confirm("Delete this stat entry?")) return;

  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/stats/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (res.ok) {
      fetchStats();
    } else {
      alert("Failed to delete stat.");
    }
  } catch (err) {
    console.error(err);
    alert("Error deleting stat.");
  }
};
