document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  const leaderboardGame = document.getElementById('leaderboardGame');
  const leaderboardCampus = document.getElementById('leaderboardCampus');
  const leaderboardMetric = document.getElementById('leaderboardMetric');
  const leaderboardSearchPlayer = document.getElementById('leaderboardSearchPlayer');
  const leaderboardFindMyPositionBtn = document.getElementById('leaderboardFindMyPositionBtn');
  const applyFiltersBtn = document.getElementById('applyFiltersBtn');
  const podiumContainer = document.getElementById('podiumContainer');
  const leaderboardTableBody = document.getElementById('leaderboardTableBody');

  // User display
  if (user?.name) {
    const nameEl = document.getElementById('user-name');
    const initialsEl = document.getElementById('user-initials');
    if (nameEl) nameEl.textContent = user.name;
    if (initialsEl) {
      const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
      initialsEl.textContent = initials;
    }
  }

  // BGMI Tier Hierarchy
  const BGMITIER_HIERARCHY = {
    'Bronze': 1,
    'Silver': 2,
    'Gold': 3,
    'Platinum': 4,
    'Diamond': 5,
    'Crown': 6,
    'Ace': 7,
    'Conqueror': 8
  };

  function getTierHierarchyValue(tierName) {
    const tier = (tierName || '').toString().trim();
    for (const [tierKey, value] of Object.entries(BGMITIER_HIERARCHY)) {
      if (tier.toLowerCase().includes(tierKey.toLowerCase())) {
        return value;
      }
    }
    return 0;
  }

  function getBGMITier(rating) {
    if (!rating || rating === 0) return 'Unranked';
    if (rating < 1200) return 'Bronze';
    if (rating < 1600) return 'Silver';
    if (rating < 2000) return 'Gold';
    if (rating < 2400) return 'Platinum';
    if (rating < 2800) return 'Diamond';
    if (rating < 3200) return 'Crown';
    if (rating < 4000) return 'Ace';
    return 'Conqueror';
  }

  function getTierClass(tier) {
    const tierLower = (tier || '').toLowerCase();
    if (tierLower.includes('conqueror')) return 'tier-conqueror';
    if (tierLower.includes('ace')) return 'tier-ace';
    if (tierLower.includes('crown')) return 'tier-crown';
    if (tierLower.includes('diamond')) return 'tier-diamond';
    if (tierLower.includes('platinum')) return 'tier-platinum';
    if (tierLower.includes('gold')) return 'tier-gold';
    if (tierLower.includes('silver')) return 'tier-silver';
    if (tierLower.includes('bronze')) return 'tier-bronze';
    return '';
  }

  // Calculate comprehensive score for BGMI players
  // UPDATED LOGIC: Reduced tier weight (~10%), increased skill metrics
  function calculateBGMICompositeScore(player) {
    const tier = player.tier || getBGMITier(player.rating || 0);
    const tierHierarchy = getTierHierarchyValue(tier);

    // 1. Tier Score (Reduced to ~10% weight)
    // Max 20 points (was 100)
    const tierScore = tierHierarchy * 2.5; // 8 tiers * 2.5 = 20 max

    // 2. K/D Ratio score (Increased weight)
    // Max 60 points (was 30)
    const deaths = player.deaths || 0;
    const kd = deaths > 0 ? (player.kills || 0) / deaths : (player.kills || 0);
    const kdScore = Math.min(kd * 6, 60); // Cap at 60 points (10 K/D = 60 points)

    // 3. Win Rate score (Increased weight)
    // Max 50 points (was 25)
    const matches = player.matchesPlayed || 0;
    const winRate = matches > 0 ? ((player.wins || 0) / matches) * 100 : 0;
    const winRateScore = Math.min(winRate * 0.5, 50); // 100% win rate = 50 points

    // 4. Total Kills score (Increased weight)
    // Max 40 points (was 20)
    const avgKills = matches > 0 ? (player.kills || 0) / matches : 0;
    const killsScore = Math.min(avgKills * 1.0, 40); // 40 avg kills per match = 40 points

    // 5. Damage score (Increased weight)
    // Max 25 points (was 15)
    const avgDamage = matches > 0 ? (player.damage || 0) / matches : 0;
    const damageScore = Math.min(avgDamage / 30, 25); // 750 avg damage = 25 points

    // 6. Headshot accuracy score (Same)
    // Max 10 points
    const headshotRate = (player.kills || 0) > 0 ? ((player.headshots || 0) / (player.kills || 1)) * 100 : 0;
    const headshotScore = Math.min(headshotRate * 0.1, 10); // 100% headshot rate = 10 points

    // 7. Top 10 consistency score (Same)
    // Max 10 points
    const top10Rate = matches > 0 ? ((player.top10s || 0) / matches) * 100 : 0;
    const top10Score = Math.min(top10Rate * 0.1, 10); // 100% top 10 = 10 points

    // 8. Matches played bonus (Same)
    // Max 5 points
    const matchesBonus = Math.min(matches / 3, 5); // 15+ matches = 5 points

    // Total composite score (max ~220 points)
    const totalScore = tierScore + kdScore + winRateScore + killsScore + damageScore +
      headshotScore + top10Score + matchesBonus;

    return {
      totalScore,
      breakdown: {
        tierScore,
        kdScore,
        winRateScore,
        killsScore,
        damageScore,
        headshotScore,
        top10Score,
        matchesBonus
      }
    };
  }

  // Sort players based on selected metric
  function sortPlayers(players, metric, game) {
    const sorted = [...players];

    if (metric === 'tier' && (game.toLowerCase().includes('bgmi') || game.toLowerCase().includes('pubg'))) {
      // Use comprehensive scoring for BGMI
      sorted.forEach(player => {
        player._compositeScore = calculateBGMICompositeScore(player);
      });

      sorted.sort((a, b) => {
        // Primary sort by composite score
        if (b._compositeScore.totalScore !== a._compositeScore.totalScore) {
          return b._compositeScore.totalScore - a._compositeScore.totalScore;
        }

        // If scores are equal, use K/D as tiebreaker (skill over tier)
        const kdA = (a.deaths || 0) > 0 ? (a.kills || 0) / (a.deaths || 1) : (a.kills || 0);
        const kdB = (b.deaths || 0) > 0 ? (b.kills || 0) / (b.deaths || 1) : (b.kills || 0);
        if (kdB !== kdA) return kdB - kdA;

        // Then by tier hierarchy
        const tierA = a.tier || getBGMITier(a.rating || 0);
        const tierB = b.tier || getBGMITier(b.rating || 0);
        const hierarchyA = getTierHierarchyValue(tierA);
        const hierarchyB = getTierHierarchyValue(tierB);
        return hierarchyB - hierarchyA;
      });
    } else if (metric === 'kd') {
      sorted.sort((a, b) => {
        const kdA = (a.deaths || 0) > 0 ? (a.kills || 0) / (a.deaths || 1) : (a.kills || 0);
        const kdB = (b.deaths || 0) > 0 ? (b.kills || 0) / (b.deaths || 1) : (b.kills || 0);
        return kdB - kdA;
      });
    } else if (metric === 'wins') {
      sorted.sort((a, b) => (b.wins || 0) - (a.wins || 0));
    } else if (metric === 'kills') {
      sorted.sort((a, b) => (b.kills || 0) - (a.kills || 0));
    } else {
      sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return sorted;
  }

  // Fetch and display leaderboard
  async function loadLeaderboard() {
    const game = leaderboardGame?.value || 'BGMI';
    const campus = leaderboardCampus?.value || '';
    const metric = leaderboardMetric?.value || 'tier';

    try {
      const query = new URLSearchParams();
      if (game) query.set('game', game);
      if (campus) query.set('campus', campus);

      const res = await fetch(`/api/stats?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch leaderboard');

      let players = await res.json();

      // Sort players based on selected metric
      players = sortPlayers(players, metric, game);

      // Get top 3 for podium
      const top3 = players.slice(0, 3);
      renderPodium(top3, game);

      // Render full leaderboard table
      renderFullLeaderboard(players, game);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      podiumContainer.innerHTML = '<div class="error-message">Error loading leaderboard. Please try again.</div>';
      leaderboardTableBody.innerHTML = '<tr><td colspan="8" class="error">Error loading data</td></tr>';
    }
  }

  // Render podium (top 3)
  function renderPodium(top3, game) {
    if (top3.length === 0) {
      podiumContainer.innerHTML = '<div class="no-data">No players found for the selected filters.</div>';
      return;
    }

    const [first, second, third] = top3;

    // Calculate stats for display
    const getKD = (player) => {
      const deaths = player.deaths || 0;
      return deaths > 0 ? ((player.kills || 0) / deaths).toFixed(2) : (player.kills || 0).toFixed(2);
    };

    const getWinRate = (player) => {
      const matches = player.matchesPlayed || 0;
      return matches > 0 ? (((player.wins || 0) / matches) * 100).toFixed(1) : '0.0';
    };

    const getTier = (player) => {
      if (game.toLowerCase().includes('bgmi') || game.toLowerCase().includes('pubg')) {
        return player.tier || getBGMITier(player.rating || 0);
      }
      return player.rating || 0;
    };

    const getTierClassForPlayer = (player) => {
      const tier = getTier(player);
      return getTierClass(tier);
    };

    podiumContainer.innerHTML = `
      <div class="podium">
        <!-- 2nd Place (Left) -->
        <div class="podium-place second-place">
          <div class="medal">🥈</div>
          <div class="player-card">
            <div class="player-avatar">${second ? (second.playerName || 'N/A').charAt(0).toUpperCase() : '—'}</div>
            <div class="player-name">${second ? (second.playerName || 'Unknown') : '—'}</div>
            <div class="player-tier ${getTierClassForPlayer(second)}">${second ? getTier(second) : '—'}</div>
            <div class="player-stats">
              <div class="stat-item">
                <span class="stat-label">K/D</span>
                <span class="stat-value">${second ? getKD(second) : '—'}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Kills</span>
                <span class="stat-value">${second ? (second.kills || 0) : '—'}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Wins</span>
                <span class="stat-value">${second ? (second.wins || 0) : '—'}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Win Rate</span>
                <span class="stat-value">${second ? getWinRate(second) + '%' : '—'}</span>
              </div>
            </div>
          </div>
          <div class="podium-base second-base">
            <span class="rank-number">2</span>
          </div>
        </div>

        <!-- 1st Place (Center) -->
        <div class="podium-place first-place">
          <div class="medal">🥇</div>
          <div class="player-card">
            <div class="player-avatar">${first ? (first.playerName || 'N/A').charAt(0).toUpperCase() : '—'}</div>
            <div class="player-name">${first ? (first.playerName || 'Unknown') : '—'}</div>
            <div class="player-tier ${getTierClassForPlayer(first)}">${first ? getTier(first) : '—'}</div>
            <div class="player-stats">
              <div class="stat-item">
                <span class="stat-label">K/D</span>
                <span class="stat-value">${first ? getKD(first) : '—'}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Kills</span>
                <span class="stat-value">${first ? (first.kills || 0) : '—'}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Wins</span>
                <span class="stat-value">${first ? (first.wins || 0) : '—'}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Win Rate</span>
                <span class="stat-value">${first ? getWinRate(first) + '%' : '—'}</span>
              </div>
            </div>
          </div>
          <div class="podium-base first-base">
            <span class="rank-number">1</span>
          </div>
        </div>

        <!-- 3rd Place (Right) -->
        <div class="podium-place third-place">
          <div class="medal">🥉</div>
          <div class="player-card">
            <div class="player-avatar">${third ? (third.playerName || 'N/A').charAt(0).toUpperCase() : '—'}</div>
            <div class="player-name">${third ? (third.playerName || 'Unknown') : '—'}</div>
            <div class="player-tier ${getTierClassForPlayer(third)}">${third ? getTier(third) : '—'}</div>
            <div class="player-stats">
              <div class="stat-item">
                <span class="stat-label">K/D</span>
                <span class="stat-value">${third ? getKD(third) : '—'}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Kills</span>
                <span class="stat-value">${third ? (third.kills || 0) : '—'}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Wins</span>
                <span class="stat-value">${third ? (third.wins || 0) : '—'}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Win Rate</span>
                <span class="stat-value">${third ? getWinRate(third) + '%' : '—'}</span>
              </div>
            </div>
          </div>
          <div class="podium-base third-base">
            <span class="rank-number">3</span>
          </div>
        </div>
      </div>
    `;
  }

  // Store players globally for search functionality
  let currentPlayers = [];
  let currentGame = '';

  // Render full leaderboard table
  function renderFullLeaderboard(players, game) {
    currentPlayers = players;
    currentGame = game;

    if (players.length === 0) {
      leaderboardTableBody.innerHTML = '<tr><td colspan="8" class="no-data">No players found</td></tr>';
      return;
    }

    const rows = players.map((player, index) => {
      const rank = index + 1;
      const kd = (player.deaths || 0) > 0 ? ((player.kills || 0) / (player.deaths || 1)).toFixed(2) : (player.kills || 0).toFixed(2);
      const winRate = (player.matchesPlayed || 0) > 0 ? (((player.wins || 0) / (player.matchesPlayed || 1)) * 100).toFixed(1) : '0.0';

      let tier = '—';
      let tierClass = '';
      if (game.toLowerCase().includes('bgmi') || game.toLowerCase().includes('pubg')) {
        tier = player.tier || getBGMITier(player.rating || 0);
        tierClass = getTierClass(tier);
      } else {
        tier = player.rating || 0;
      }

      const rankClass = rank <= 3 ? `rank-${rank}` : '';
      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';

      // Show composite score for BGMI if available
      const scoreDisplay = (game.toLowerCase().includes('bgmi') || game.toLowerCase().includes('pubg')) && player._compositeScore
        ? `<div style="font-size:0.85em; color:var(--text-medium); margin-top:2px;">Score: ${player._compositeScore.totalScore.toFixed(1)}</div>`
        : '';

      const playerName = player.playerName || player.playerId || 'Unknown';
      const rowId = `leaderboard-row-${index}`;

      return `
        <tr id="${rowId}" class="${rankClass}" data-player-name="${playerName.toLowerCase()}">
          <td class="rank-cell">
            <span class="rank-number" style="display:inline-block; min-width:40px; text-align:right; font-weight:800; font-size:1.25em; color:#ffffff;">${rank}</span>
            ${medal ? `<span class="medal-icon" style="font-size:1.4em; margin-left:8px;">${medal}</span>` : ''}
          </td>
          <td class="player-cell">
            <div style="font-weight:700; color:#ffffff; font-size:1.1em; margin-bottom:4px;">${playerName}</div>
            ${scoreDisplay}
          </td>
          <td class="tier-cell ${tierClass}">${tier}</td>
          <td class="center" style="font-weight:800; color:#ffffff; font-size:1.1em; letter-spacing:0.5px;">${kd}</td>
          <td class="center" style="font-weight:800; color:#ffffff; font-size:1.1em;">${(player.kills || 0).toLocaleString()}</td>
          <td class="center" style="font-weight:800; color:#ffffff; font-size:1.1em;">${player.wins || 0}</td>
          <td class="center" style="font-weight:800; color:#ffffff; font-size:1.1em;">${player.matchesPlayed || 0}</td>
          <td class="center" style="font-weight:800; color:#ffffff; font-size:1.1em;">${winRate}%</td>
        </tr>
      `;
    }).join('');

    leaderboardTableBody.innerHTML = rows;
  }

  // Find player position function
  function findPlayerPosition(searchName) {
    if (!searchName || !searchName.trim()) {
      showToast('Please enter a player name', 'error');
      return;
    }

    const searchLower = searchName.toLowerCase().trim();
    const matchingPlayer = currentPlayers.find((player, index) => {
      const playerName = (player.playerName || player.playerId || '').toLowerCase();
      return playerName.includes(searchLower);
    });

    if (!matchingPlayer) {
      showToast(`Player "${searchName}" not found in current leaderboard`, 'error');
      return;
    }

    // Find the row index
    const playerIndex = currentPlayers.findIndex((player) => {
      const playerName = (player.playerName || player.playerId || '').toLowerCase();
      return playerName.includes(searchLower);
    });

    if (playerIndex === -1) return;

    const rank = playerIndex + 1;
    const rowId = `leaderboard-row-${playerIndex}`;
    const row = document.getElementById(rowId);

    if (row) {
      // Highlight the row
      row.style.background = 'rgba(52, 152, 219, 0.3)';
      row.style.border = '2px solid #3498db';
      row.style.transition = 'all 0.3s ease';

      // Scroll to the row
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Remove highlight after 5 seconds
      setTimeout(() => {
        row.style.background = '';
        row.style.border = '';
      }, 5000);

      // Show success message
      const playerName = matchingPlayer.playerName || matchingPlayer.playerId || 'Unknown';
      showToast(`Found ${playerName} at Rank #${rank}!`, 'success');
    }
  }

  // Find My Position button handler
  if (leaderboardFindMyPositionBtn) {
    leaderboardFindMyPositionBtn.addEventListener('click', () => {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const playerName = currentUser?.name || '';

      if (!playerName) {
        showToast('Please login to find your position', 'error');
        return;
      }

      // Set search input
      if (leaderboardSearchPlayer) {
        leaderboardSearchPlayer.value = playerName;
      }

      // Find position
      findPlayerPosition(playerName);
    });
  }

  // Search input handler (Enter key or search button)
  if (leaderboardSearchPlayer) {
    leaderboardSearchPlayer.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const searchName = leaderboardSearchPlayer.value.trim();
        if (searchName) {
          findPlayerPosition(searchName);
        }
      }
    });
  }

  // Toast notification function
  function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
      `;
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    const bgColor = type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : '#3498db';
    toast.style.cssText = `
      background: ${bgColor};
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-weight: 600;
      animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Event listeners
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', loadLeaderboard);
  }

  // Ranking Criteria Toggle
  const toggleCriteriaBtn = document.getElementById('toggleCriteriaBtn');
  const criteriaContent = document.getElementById('criteriaContent');
  
  if (toggleCriteriaBtn && criteriaContent) {
    toggleCriteriaBtn.addEventListener('click', () => {
      const isOpen = criteriaContent.style.display !== 'none';
      criteriaContent.style.display = isOpen ? 'none' : 'block';
      toggleCriteriaBtn.classList.toggle('active', !isOpen);
    });
  }

  // User dropdown functionality
  const userInitials = document.getElementById('user-initials');
  const userDropdown = document.getElementById('user-dropdown');
  const signoutLink = document.getElementById('signout-link');

  if (userInitials && userDropdown) {
    userInitials.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('open');
    });
  }

  document.addEventListener('click', (e) => {
    if (userDropdown && !userDropdown.contains(e.target)) {
      userDropdown.classList.remove('open');
    }
  });

  if (signoutLink) {
    signoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.href = 'login.html';
    });
  }

  // Initial load
  loadLeaderboard();
});
