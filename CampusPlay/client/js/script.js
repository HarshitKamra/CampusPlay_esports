document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  setupMobileMenu();
  setupDropdownToggle();
  loadDashboardLeaderboard();
});

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("campusPlayUser");
  window.location.href = "index.html";
}

function setupDropdownToggle() {
  // Setup dropdown toggle for user profile
  const userDropdown = document.getElementById("user-dropdown");
  const userInitials = document.querySelector(".user-initials") || document.getElementById("user-initials");
  const userProfile = document.querySelector(".user-profile");
  
  // Handle click on user dropdown (for index.html and stats.html style)
  if (userDropdown) {
    // Check if it's the tournaments page style (has user-profile class)
    if (userDropdown.classList.contains("user-profile")) {
      // Tournaments page style - click on the whole profile area
      userDropdown.addEventListener("click", (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle("open");
        const menu = userDropdown.querySelector(".dropdown-menu");
        if (menu) {
          menu.style.display = userDropdown.classList.contains("open") ? "block" : "none";
        }
      });
    } else {
      // Index/stats page style - click on initials
      if (userInitials) {
        userInitials.addEventListener("click", (e) => {
          e.stopPropagation();
          userDropdown.classList.toggle("open");
        });
      }
    }
    
    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (userDropdown && !userDropdown.contains(e.target)) {
        userDropdown.classList.remove("open");
        const menu = userDropdown.querySelector(".dropdown-menu");
        if (menu) {
          menu.style.display = "none";
        }
      }
    });
  }
}

function checkAuth() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || localStorage.getItem("campusPlayUser") || "{}");
  const userDropdown = document.getElementById("user-dropdown");
  const userInitials = document.getElementById("user-initials");
  const userName = document.getElementById("user-name");

  if (token && user.name) {
    // User is logged in
    if (userInitials) {
      const initials = user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
      userInitials.textContent = initials;
    }

    // Update user name if element exists (tournaments page)
    if (userName) {
      userName.textContent = user.name;
    }

    // Setup signout link
    const signoutLink = document.getElementById("signout-link");
    if (signoutLink) {
      signoutLink.href = "#";
      signoutLink.onclick = (e) => {
        e.preventDefault();
        logout();
      };
    }
    
    // Setup profile link (if exists)
    const profileLink = document.getElementById("profile-link");
    if (profileLink) {
      profileLink.href = "#";
      profileLink.onclick = (e) => {
        e.preventDefault();
        // Profile page can be added later, for now just close dropdown
        const userDropdown = document.getElementById("user-dropdown");
        if (userDropdown) {
          userDropdown.classList.remove("open");
          const menu = userDropdown.querySelector(".dropdown-menu");
          if (menu) {
            menu.style.display = "none";
          }
        }
      };
    }
  } else {
    // User is not logged in
    if (userDropdown) {
      userDropdown.innerHTML = '<a href="login.html" style="color: white; text-decoration: none; font-weight: 600;">Login</a>';
    }

    // For tournaments page - update to show login option
    if (userName) {
      userName.innerHTML = '<a href="login.html" style="color: var(--text-light); text-decoration: none; font-weight: 800;">Login</a>';
    }
    if (userInitials) {
      userInitials.textContent = "?";
    }
  }
}

function setupMobileMenu() {
  const burger = document.querySelector(".burger");
  const nav = document.querySelector(".nav-links");

  if (burger) {
    burger.addEventListener("click", () => {
      nav.classList.toggle("nav-active");
      burger.classList.toggle("toggle");
    });
  }
}

// BGMI Tier Hierarchy (same as leaderboard.js)
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

function calculateBGMICompositeScore(player) {
  const tier = player.tier || getBGMITier(player.rating || 0);
  const tierHierarchy = getTierHierarchyValue(tier);
  const tierScore = tierHierarchy * 2.5;
  const deaths = player.deaths || 0;
  const kd = deaths > 0 ? (player.kills || 0) / deaths : (player.kills || 0);
  const kdScore = Math.min(kd * 6, 60);
  const matches = player.matchesPlayed || 0;
  const winRate = matches > 0 ? ((player.wins || 0) / matches) * 100 : 0;
  const winRateScore = Math.min(winRate * 0.5, 50);
  const avgKills = matches > 0 ? (player.kills || 0) / matches : 0;
  const killsScore = Math.min(avgKills * 1.0, 40);
  const avgDamage = matches > 0 ? (player.damage || 0) / matches : 0;
  const damageScore = Math.min(avgDamage / 30, 25);
  const headshotRate = (player.kills || 0) > 0 ? ((player.headshots || 0) / (player.kills || 1)) * 100 : 0;
  const headshotScore = Math.min(headshotRate * 0.1, 10);
  const top10Rate = matches > 0 ? ((player.top10s || 0) / matches) * 100 : 0;
  const top10Score = Math.min(top10Rate * 0.1, 10);
  const matchesBonus = Math.min(matches / 3, 5);
  const totalScore = tierScore + kdScore + winRateScore + killsScore + damageScore +
    headshotScore + top10Score + matchesBonus;
  return totalScore;
}

// Load dashboard leaderboard
async function loadDashboardLeaderboard() {
  const topPlayersList = document.getElementById('topPlayersList');
  if (!topPlayersList) return; // Not on index page

  try {
    // Fetch all stats
    const res = await fetch(`${API_BASE_URL}/api/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    let players = await res.json();

    if (!players || players.length === 0) {
      topPlayersList.innerHTML = '<li><div class="player-info"><p>No players found</p><small>—</small></div></li>';
      return;
    }

    // Calculate composite scores for BGMI players and sort
    players.forEach(player => {
      const game = (player.game || '').toLowerCase();
      if (game.includes('bgmi') || game.includes('pubg')) {
        player._compositeScore = calculateBGMICompositeScore(player);
      } else {
        // For other games, use wins as score
        player._compositeScore = { totalScore: player.wins || 0 };
      }
    });

    // Sort by composite score (or wins for non-BGMI)
    players.sort((a, b) => {
      const scoreA = a._compositeScore?.totalScore || a.wins || 0;
      const scoreB = b._compositeScore?.totalScore || b.wins || 0;
      if (scoreB !== scoreA) return scoreB - scoreA;
      // Tiebreaker: K/D ratio
      const kdA = (a.deaths || 0) > 0 ? (a.kills || 0) / (a.deaths || 1) : (a.kills || 0);
      const kdB = (b.deaths || 0) > 0 ? (b.kills || 0) / (b.deaths || 1) : (b.kills || 0);
      return kdB - kdA;
    });

    // Get top 5 players
    const top5 = players.slice(0, 5);
    renderTopPlayers(top5);

    // Find and render current user's rank
    const user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('campusPlayUser') || '{}');
    if (user && user.name) {
      const userPlayer = players.find(p => {
        const playerName = (p.playerName || p.name || '').toLowerCase();
        const userName = (user.name || '').toLowerCase();
        return playerName === userName || playerName.includes(userName) || userName.includes(playerName);
      });
      
      if (userPlayer) {
        const userRank = players.findIndex(p => p._id === userPlayer._id) + 1;
        renderUserRank(userPlayer, userRank, players.length, players);
      } else {
        renderUserRank(null, null, players.length, players);
      }
    } else {
      renderUserRank(null, null, players.length, players);
    }

    // Update stats bar
    updateStatsBar(players);

  } catch (error) {
    console.error('Error loading dashboard leaderboard:', error);
    topPlayersList.innerHTML = '<li><div class="player-info"><p>Error loading leaderboard</p><small>—</small></div></li>';
  }
}

function updateStatsBar(players) {
  // Update active players count
  const statItems = document.querySelectorAll('.stats-bar .stat-item');
  if (statItems && statItems.length > 0 && players) {
    const uniquePlayers = new Set(players.map(p => p.playerName || p.name || p.playerId)).size;
    const activePlayersStrong = statItems[0]?.querySelector('strong');
    if (activePlayersStrong) {
      activePlayersStrong.textContent = uniquePlayers || players.length;
    }
  }

  // Update tournaments count (fetch from tournaments API)
  fetch(`${API_BASE_URL}/api/tournaments`)
    .then(res => res.json())
    .then(tournaments => {
      const statItems = document.querySelectorAll('.stats-bar .stat-item');
      if (statItems && statItems.length > 2) {
        const tournamentStrong = statItems[2].querySelector('strong');
        if (tournamentStrong) {
          tournamentStrong.textContent = tournaments.length || 0;
        }
      }
    })
    .catch(err => console.error('Error fetching tournaments:', err));
}

function renderTopPlayers(players) {
  const topPlayersList = document.getElementById('topPlayersList');
  if (!topPlayersList) return;

  if (players.length === 0) {
    topPlayersList.innerHTML = '<li><div class="player-info"><p>No players found</p><small>—</small></div></li>';
    return;
  }

  const rankIcons = ['👑', '🥈', '🥉', '🏅', '🏅'];
  
  const html = players.map((player, index) => {
    const rank = index + 1;
    const rankIcon = rankIcons[index] || '🏅';
    const playerName = player.playerName || player.name || 'Unknown';
    const campus = player.campus || '—';
    const wins = player.wins || 0;
    
    return `
      <li>
        <span class="rank-icon">${rankIcon}</span>
        <div class="player-info">
          <p>${playerName}</p>
          <small>${campus}</small>
        </div>
        <span class="player-stats"><strong>${wins}</strong> wins</span>
      </li>
    `;
  }).join('');

  topPlayersList.innerHTML = html;
}

function renderUserRank(player, rank, totalPlayers, allPlayers = []) {
  const user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('campusPlayUser') || '{}');
  
  const userRankAvatar = document.getElementById('userRankAvatar');
  const userRankNumber = document.getElementById('userRankNumber');
  const userRankName = document.getElementById('userRankName');
  const userRankDept = document.getElementById('userRankDept');
  const userRankRating = document.getElementById('userRankRating');
  const userNextRank = document.getElementById('userNextRank');
  const userRankProgress = document.getElementById('userRankProgress');
  const weeklyGames = document.getElementById('weeklyGames');
  const weeklyWinRate = document.getElementById('weeklyWinRate');
  const weeklyRatingChange = document.getElementById('weeklyRatingChange');

  if (!player || !user.name) {
    // User not logged in or no stats
    if (userRankAvatar) userRankAvatar.textContent = '?';
    if (userRankNumber) userRankNumber.textContent = '#—';
    if (userRankName) userRankName.textContent = user.name || '—';
    if (userRankDept) userRankDept.textContent = '—';
    if (userRankRating) userRankRating.textContent = '—';
    if (userNextRank) userNextRank.textContent = 'Login to see your rank';
    if (userRankProgress) userRankProgress.style.width = '0%';
    if (weeklyGames) weeklyGames.textContent = '—';
    if (weeklyWinRate) {
      weeklyWinRate.textContent = '—';
      weeklyWinRate.className = '';
    }
    if (weeklyRatingChange) {
      weeklyRatingChange.textContent = '—';
      weeklyRatingChange.className = '';
    }
    return;
  }

  // Set user avatar initials
  const userName = user.name || player.playerName || player.name || 'User';
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  if (userRankAvatar) userRankAvatar.textContent = initials;

  // Set rank
  if (userRankNumber) userRankNumber.textContent = `#${rank || '—'}`;
  
  // Set name and department
  if (userRankName) userRankName.textContent = userName;
  if (userRankDept) userRankDept.textContent = player.campus || '—';

  // Calculate rating (use composite score for BGMI, wins for others)
  const game = (player.game || '').toLowerCase();
  let rating = 0;
  if (game.includes('bgmi') || game.includes('pubg')) {
    rating = Math.round(player._compositeScore?.totalScore || 0);
  } else {
    rating = player.wins || 0;
  }

  if (userRankRating) userRankRating.textContent = rating.toLocaleString();

  // Calculate progress to next rank (simplified - based on tier for BGMI)
  if (game.includes('bgmi') || game.includes('pubg')) {
    const tier = player.tier || getBGMITier(player.rating || 0);
    const tierValue = getTierHierarchyValue(tier);
    const nextTierValue = tierValue + 1;
    const currentTierProgress = tierValue / 8; // 8 tiers total
    const nextTierProgress = nextTierValue / 8;
    const progress = ((currentTierProgress / nextTierProgress) * 100);
    
    if (userNextRank) {
      if (tierValue >= 8) {
        userNextRank.textContent = 'Max rank achieved!';
      } else {
        const pointsNeeded = Math.max(1, Math.round((nextTierProgress - currentTierProgress) * 220));
        userNextRank.textContent = `${pointsNeeded} points to next rank`;
      }
    }
    if (userRankProgress) {
      userRankProgress.style.width = `${Math.min(progress, 100)}%`;
    }
  } else {
    // For other games, show progress based on wins
    if (userNextRank) {
      const nextRankWins = rank > 1 && allPlayers.length > 0 ? (allPlayers[rank - 2]?.wins || 0) : rating + 100;
      const pointsNeeded = Math.max(0, nextRankWins - rating);
      userNextRank.textContent = pointsNeeded > 0 ? `${pointsNeeded} wins to next rank` : 'Top rank!';
    }
    if (userRankProgress) {
      const maxWins = allPlayers.length > 0 ? (allPlayers[0]?.wins || rating) : rating;
      const progress = maxWins > 0 ? (rating / maxWins) * 100 : 0;
      userRankProgress.style.width = `${Math.min(progress, 100)}%`;
    }
  }

  // Weekly stats (using current stats as approximation)
  const matches = player.matchesPlayed || 0;
  const wins = player.wins || 0;
  const winRate = matches > 0 ? ((wins / matches) * 100) : 0;

  if (weeklyGames) weeklyGames.textContent = matches || '0';
  if (weeklyWinRate) {
    weeklyWinRate.textContent = `${winRate.toFixed(0)}%`;
    weeklyWinRate.className = winRate >= 50 ? 'positive' : '';
  }
  if (weeklyRatingChange) {
    // Since we don't have historical data, show a placeholder or calculate from recent activity
    weeklyRatingChange.textContent = '+0';
    weeklyRatingChange.className = 'positive';
  }
}
