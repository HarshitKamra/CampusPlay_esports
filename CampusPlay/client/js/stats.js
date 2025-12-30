document.addEventListener('DOMContentLoaded', () => {
  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  // DOM Elements
  const statsTableBody = document.getElementById('statsTableBody');
  const sumPlayers = document.getElementById('sumPlayers');
  const sumWinRate = document.getElementById('sumWinRate');
  const sumKD = document.getElementById('sumKD');
  const sumTopRating = document.getElementById('sumTopRating');

  const statsSearchPlayer = document.getElementById('statsSearchPlayer');
  const statsFilterGame = document.getElementById('statsFilterGame');
  const statsFilterCampus = document.getElementById('statsFilterCampus');
  const statsApplyBtn = document.getElementById('statsApplyBtn');
  const statsResetBtn = document.getElementById('statsResetBtn');
  const statsDeleteAllBtn = document.getElementById('statsDeleteAllBtn');

  const statsAdminPanel = document.getElementById('statsAdminPanel');
  const statsCsvFile = document.getElementById('statsCsvFile');
  const statsParsePreviewBtn = document.getElementById('statsParsePreviewBtn');
  const statsUploadBtn = document.getElementById('statsUploadBtn');
  const statsPreviewMsg = document.getElementById('statsPreviewMsg');
  const statsPreviewWrap = document.getElementById('statsPreviewWrap');

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

  // Show admin panel if user is admin
  if (user?.role === 'admin' && statsAdminPanel) {
    statsAdminPanel.style.display = 'block';
    // Show action column header
    const actionHeader = document.getElementById('statsActionHeader');
    if (actionHeader) actionHeader.style.display = 'table-cell';
    // Show delete all button
    if (statsDeleteAllBtn) statsDeleteAllBtn.style.display = 'block';
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

  // Load PapaParse library
  function loadPapaParse() {
    return new Promise((resolve) => {
      if (window.Papa) return resolve();
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js';
      script.onload = resolve;
      document.head.appendChild(script);
    });
  }

  // Fetch and display stats
  async function fetchStats() {
    const query = new URLSearchParams();
    if (statsFilterGame?.value) query.set('game', statsFilterGame.value);
    if (statsFilterCampus?.value) query.set('campus', statsFilterCampus.value);
    if (statsSearchPlayer?.value) query.set('playerName', statsSearchPlayer.value);

    try {
      const res = await fetch(`${API_BASE_URL}/api/stats?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      renderStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      statsTableBody.innerHTML = '<tr><td colspan="17" class="small-muted">Error loading stats</td></tr>';
    }
  }

  // Render stats table and summary
  function renderStats(data) {
    if (!data || data.length === 0) {
      statsTableBody.innerHTML = '<tr><td colspan="17" class="small-muted">No stats available</td></tr>';
      sumPlayers.textContent = '0';
      sumWinRate.textContent = '0%';
      sumKD.textContent = '0.00';
      sumTopRating.textContent = '0';
      return;
    }

    // Calculate summary
    sumPlayers.textContent = data.length;

    let totalWinRate = 0;
    let totalKD = 0;
    let topRating = 0;

    data.forEach(stat => {
      const matches = stat.matchesPlayed || 0;
      const wins = stat.wins || 0;
      const kills = stat.kills || 0;
      const deaths = stat.deaths || 0;

      if (matches > 0) totalWinRate += (wins / matches) * 100;
      if (deaths > 0) totalKD += kills / deaths;
      else if (kills > 0) totalKD += kills;

      if (stat.rating > topRating) topRating = stat.rating;
    });

    sumWinRate.textContent = (totalWinRate / data.length).toFixed(1) + '%';
    sumKD.textContent = (totalKD / data.length).toFixed(2);
    sumTopRating.textContent = topRating;

    // Check if user is admin
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = user?.role === 'admin';

    // Render table
    const rows = data.map(stat => {
      const matches = stat.matchesPlayed || 0;
      const wins = stat.wins || 0;
      const kills = stat.kills || 0;
      const deaths = stat.deaths || 0;
      const assists = stat.assists || 0;
      const damage = stat.damage || 0;
      const headshots = stat.headshots || 0;
      const top10s = stat.top10s || 0;
      const revives = stat.revives || 0;
      const distance = stat.distanceTraveled || 0;
      const weapons = stat.weaponsUsed || '—';
      
      const winPct = matches > 0 ? ((wins / matches) * 100).toFixed(1) : '0.0';
      const kd = deaths > 0 ? (kills / deaths).toFixed(2) : (kills > 0 ? '∞' : '0.00');

      // Determine tier/rating display
      let tierDisplay = '—';
      let tierClass = '';
      const game = (stat.game || '').toLowerCase();
      if (game.includes('bgmi') || game.includes('pubg')) {
        tierDisplay = stat.tier || getBGMITier(stat.rating || 0);
        tierClass = getTierClass(tierDisplay);
      } else {
        tierDisplay = stat.rating || 0;
      }

      const deleteBtn = isAdmin ?
        `<button onclick="deleteStat('${stat._id}')" class="btn-delete" style="background:#e74c3c; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:11px;">Delete</button>` :
        '';

      return `
        <tr>
          <td>${stat.playerName || stat.name || stat.playerId || '—'}</td>
          <td>${stat.campus || '—'}</td>
          <td>${stat.game || '—'}</td>
          <td class="center">${matches}</td>
          <td class="center">${wins}</td>
          <td class="center">${winPct}%</td>
          <td class="center">${kd}</td>
          <td class="center">${kills}</td>
          <td class="center">${deaths}</td>
          <td class="center">${assists}</td>
          <td class="center">${damage}</td>
          <td class="center">${headshots}</td>
          <td class="center">${top10s}</td>
          <td class="center">${revives}</td>
          <td class="center">${distance}</td>
          <td class="center">${weapons}</td>
          <td class="center ${tierClass}">${tierDisplay}</td>
          ${isAdmin ? `<td class="center">${deleteBtn}</td>` : ''}
        </tr>
      `;
    }).join('');

    statsTableBody.innerHTML = rows;
  }

  // CSV Preview
  let parsedData = [];

  if (statsParsePreviewBtn) {
    statsParsePreviewBtn.addEventListener('click', async () => {
      const file = statsCsvFile?.files[0];
      if (!file) {
        statsPreviewMsg.textContent = 'Please select a CSV file';
        return;
      }

      try {
        await loadPapaParse();
        statsPreviewMsg.textContent = 'Parsing...';

        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            parsedData = results.data;

            if (!parsedData.length) {
              statsPreviewMsg.textContent = 'CSV file is empty';
              statsPreviewWrap.innerHTML = '';
              statsUploadBtn.disabled = true;
              return;
            }

            // Show preview (first 10 rows)
            const preview = parsedData.slice(0, 10);
            const cols = Object.keys(preview[0]);

            let html = '<table class="stats-table"><thead><tr>';
            cols.forEach(col => html += `<th>${col}</th>`);
            html += '</tr></thead><tbody>';

            preview.forEach(row => {
              html += '<tr>';
              cols.forEach(col => html += `<td>${row[col] || ''}</td>`);
              html += '</tr>';
            });

            html += '</tbody></table>';
            statsPreviewWrap.innerHTML = html;
            statsPreviewMsg.textContent = `Previewing ${parsedData.length} rows (showing ${preview.length})`;
            statsUploadBtn.disabled = false;
          },
          error: (err) => {
            statsPreviewMsg.textContent = 'Parse error: ' + err.message;
            statsPreviewWrap.innerHTML = '';
            statsUploadBtn.disabled = true;
          }
        });
      } catch (err) {
        statsPreviewMsg.textContent = 'Error: ' + err.message;
      }
    });
  }

  // CSV Upload
  if (statsUploadBtn) {
    statsUploadBtn.addEventListener('click', async () => {
      if (!parsedData.length) {
        statsPreviewMsg.textContent = 'No data to upload';
        return;
      }

      if (!token) {
        statsPreviewMsg.textContent = 'You must be logged in as admin';
        return;
      }

      try {
        statsUploadBtn.disabled = true;
        statsUploadBtn.textContent = 'Uploading...';
        statsPreviewMsg.textContent = 'Uploading to database...';

        // Get selected defaults
        const selectedGame = document.getElementById('statsUploadGame')?.value || 'BGMI';
        const selectedCampus = document.getElementById('statsUploadCampus')?.value || '';

        // Get replace mode
        const replaceMode = document.getElementById('statsReplaceMode')?.value || 'game-campus';
        let deleteWarning = '';
        if (replaceMode === 'all') {
          deleteWarning = '⚠️ WARNING: This will DELETE ALL existing stats in the database!';
        } else {
          deleteWarning = `⚠️ This will replace all stats for Game: "${selectedGame}"${selectedCampus ? `, Campus: "${selectedCampus}"` : ''}`;
        }
        
        if (!confirm(`${deleteWarning}\n\nProceed with upload?`)) {
          statsUploadBtn.disabled = false;
          statsUploadBtn.textContent = 'Upload to Database';
          return;
        }

        // Transform CSV data to match backend schema
        const stats = parsedData.map(row => {
          // Normalize column names (handle various spellings and spaces)
          const normalizeKey = (obj, keys) => {
            for (const key of keys) {
              if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
                return String(obj[key]).trim();
              }
            }
            return '';
          };

          const playerName = normalizeKey(row, ['Player_Name', 'Player Name', 'playerName', 'player_name', 'Name', 'name']) || 'Unknown';
          const campus = normalizeKey(row, ['Campus', 'campus']) || selectedCampus || '';
          const game = normalizeKey(row, ['Game', 'game']) || selectedGame || 'BGMI';
          const tier = normalizeKey(row, ['Rank', 'rank', 'Tier', 'tier', 'Rating_Tier', 'rating_tier']);

          return {
            playerId: playerName,
            playerName: playerName,
            campus: campus.trim() || undefined,
            game: game.trim(),
            tier: tier || undefined,
            matchesPlayed: parseInt(normalizeKey(row, ['Matches_Played ', 'Matches_Played', 'Matches Played', 'matchesPlayed', 'Matches', 'Match', 'matches', 'Total_Matches', 'totalMatches']) || '0') || 0,
            kills: parseInt(normalizeKey(row, ['Kills', 'kills', 'Total_Kills', 'total_kills']) || '0') || 0,
            deaths: parseInt(normalizeKey(row, ['Deaths', 'deaths', 'Total_Deaths', 'total_deaths']) || '0') || 0,
            assists: parseInt(normalizeKey(row, ['Assists', 'assists', 'Total_Assists', 'total_assists']) || '0') || 0,
            damage: parseInt(normalizeKey(row, ['Damage_Dealt', 'Damage Dealt', 'damage', 'Damage', 'Total_Damage']) || '0') || 0,
            headshots: parseInt(normalizeKey(row, ['Headshots', 'headshots', 'Total_Headshots']) || '0') || 0,
            wins: parseInt(normalizeKey(row, ['Wins', 'wins', 'Total_Wins', 'total_wins']) || '0') || 0,
            top10s: parseInt(normalizeKey(row, ['Top_10s', 'Top 10s', 'top10s', 'Top10s']) || '0') || 0,
            revives: parseInt(normalizeKey(row, ['Revives', 'revives', 'Total_Revives']) || '0') || 0,
            distanceTraveled: parseInt(normalizeKey(row, ['Distance_Traveled', 'Distance Traveled', 'distanceTraveled', 'Distance']) || '0') || 0,
            weaponsUsed: normalizeKey(row, ['Weapons_Used', 'Weapons Used', 'weaponsUsed', 'Weapons']) || undefined,
            rating: parseInt(normalizeKey(row, ['Rating', 'rating', 'MMR', 'mmr']) || '0') || 0
          };
        }).filter(s => s.playerName && s.playerName !== 'Unknown' && s.game); // Filter out invalid rows

        const res = await fetch(`${API_BASE_URL}/api/stats/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ stats, replaceMode })
        });

        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.error || 'Upload failed');
        }

        statsPreviewMsg.textContent = `✅ Successfully uploaded ${result.count} stats!`;
        statsUploadBtn.textContent = 'Upload to Database';
        statsUploadBtn.disabled = false;

        // Refresh stats display
        await fetchStats();

        // Clear preview after 3 seconds
        setTimeout(() => {
          statsPreviewWrap.innerHTML = '';
          statsPreviewMsg.textContent = '';
          statsCsvFile.value = '';
          parsedData = [];
          statsUploadBtn.disabled = true;
        }, 3000);

      } catch (error) {
        statsPreviewMsg.textContent = '❌ Error: ' + error.message;
        statsUploadBtn.textContent = 'Upload to Database';
        statsUploadBtn.disabled = false;
      }
    });
  }

  // Search debounce
  let searchTimeout;
  if (statsSearchPlayer) {
    statsSearchPlayer.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        fetchStats();
      }, 300);
    });
  }

  // Filter buttons
  if (statsApplyBtn) {
    statsApplyBtn.addEventListener('click', fetchStats);
  }

  if (statsResetBtn) {
    statsResetBtn.addEventListener('click', () => {
      if (statsFilterGame) statsFilterGame.value = '';
      if (statsFilterCampus) statsFilterCampus.value = '';
      if (statsSearchPlayer) statsSearchPlayer.value = '';
      fetchStats();
    });
  }

  // Delete individual stat
  window.deleteStat = async (statId) => {
    if (!confirm('Are you sure you want to delete this stat?')) return;

    const token = localStorage.getItem('token');
    if (!token) {
      statsPreviewMsg.textContent = 'You must be logged in as admin';
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/stats/${statId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete stat');
      }

      statsPreviewMsg.textContent = '✅ Stat deleted successfully!';
      await fetchStats();

      setTimeout(() => {
        statsPreviewMsg.textContent = '';
      }, 3000);
    } catch (error) {
      statsPreviewMsg.textContent = '❌ Error: ' + error.message;
    }
  };

  // Delete all stats (admin only)
  window.deleteAllStats = async () => {
    const game = statsFilterGame?.value || '';
    const campus = statsFilterCampus?.value || '';

    const confirmMsg = game || campus
      ? `Are you sure you want to delete all stats${game ? ` for ${game}` : ''}${campus ? ` from ${campus}` : ''}?`
      : 'Are you sure you want to delete ALL stats? This cannot be undone!';

    if (!confirm(confirmMsg)) return;

    const token = localStorage.getItem('token');
    if (!token) {
      statsPreviewMsg.textContent = 'You must be logged in as admin';
      return;
    }

    try {
      const query = new URLSearchParams();
      if (game) query.set('game', game);
      if (campus) query.set('campus', campus);

      const res = await fetch(`${API_BASE_URL}/api/stats?${query.toString()}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete stats');
      }

      const result = await res.json();
      statsPreviewMsg.textContent = `✅ Successfully deleted ${result.deletedCount} stats!`;
      await fetchStats();

      setTimeout(() => {
        statsPreviewMsg.textContent = '';
      }, 3000);
    } catch (error) {
      statsPreviewMsg.textContent = '❌ Error: ' + error.message;
    }
  };

  // Delete ALL stats regardless of filter (confirmation required)
  window.deleteAllStatsConfirm = async () => {
    if (!confirm('⚠️ WARNING: This will delete ALL stats from the database regardless of filters. Are you ABSOLUTELY SURE?')) return;
    if (!confirm('This action CANNOT be undone. Type YES in the next dialog to confirm.')) return;

    const token = localStorage.getItem('token');
    if (!token) {
      statsPreviewMsg.textContent = 'You must be logged in as admin';
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/stats`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete stats');
      }

      const result = await res.json();
      statsPreviewMsg.textContent = `✅ Successfully deleted ${result.deletedCount} stats!`;
      await fetchStats();

      setTimeout(() => {
        statsPreviewMsg.textContent = '';
      }, 3000);
    } catch (error) {
      statsPreviewMsg.textContent = '❌ Error: ' + error.message;
    }
  };

  // Toast notification function
  function showToast(message, type = 'info') {
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

  // Find My Position functionality
  const statsFindMyPositionBtn = document.getElementById('statsFindMyPositionBtn');
  
  if (statsFindMyPositionBtn) {
    statsFindMyPositionBtn.addEventListener('click', () => {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const playerName = currentUser?.name || '';
      
      if (!playerName) {
        showToast('Please login to find your position', 'error');
        return;
      }

      // Set search input to user's name
      if (statsSearchPlayer) {
        statsSearchPlayer.value = playerName;
      }

      // Apply search
      fetchStats().then(() => {
        // Scroll to the first matching row after a short delay
        setTimeout(() => {
          const rows = statsTableBody.querySelectorAll('tr');
          let found = false;
          rows.forEach((row, index) => {
            const playerCell = row.querySelector('td');
            if (playerCell && playerCell.textContent.toLowerCase().includes(playerName.toLowerCase())) {
              row.style.background = 'rgba(52, 152, 219, 0.3)';
              row.style.border = '2px solid #3498db';
              row.style.transition = 'all 0.3s ease';
              row.scrollIntoView({ behavior: 'smooth', block: 'center' });
              
              // Remove highlight after 5 seconds
              setTimeout(() => {
                row.style.background = '';
                row.style.border = '';
              }, 5000);
              
              if (!found) {
                showToast(`Found your position! (Row ${index + 1})`, 'success');
                found = true;
              }
            }
          });
          
          if (!found) {
            showToast('Your name not found in current stats. Try adjusting filters.', 'error');
          }
        }, 500);
      });
    });
  }

  // Initial load
  fetchStats();
});
