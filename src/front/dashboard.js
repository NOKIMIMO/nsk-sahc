if (!localStorage.getItem('token')) {
    window.location.href = 'login.html';
}

const USER_ROLES = { EMPLOYEE: 0, SECRETARY: 1, MANAGER: 2, ADMIN: 3 };
const userRole = parseInt(localStorage.getItem('userRole') || '0');

const userName = localStorage.getItem('userName') || 'Utilisateur';
const userInfo = document.getElementById('user-info');
userInfo.textContent = userName;

const btnLogout = document.getElementById('btn-logout');
btnLogout.addEventListener('click', async () => {
    try {
        const token = localStorage.getItem('token');
        await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    } catch (error) {
        console.error('Logout error:', error);
    }
    localStorage.clear();
    window.location.href = 'login.html';
});

if (userRole !== USER_ROLES.MANAGER && userRole !== USER_ROLES.ADMIN) {
    alert('Accès refusé: Dashboard réservé aux Managers et Admins');
    window.location.href = '/';
}

async function loadAnalytics() {
    const loading = document.getElementById('loading');
    const dashboard = document.getElementById('dashboard');
    
    loading.style.display = 'block';
    dashboard.style.display = 'none';
    
    try {
        const response = await fetch('/dashboard/analytics');
        const data = await response.json();
        
        console.log('Analytics data:', data);
        
        document.getElementById('total-places').textContent = data.totalPlaces || 0;
        document.getElementById('electric-places').textContent = data.electricPlaces || 0;
        document.getElementById('electric-percentage').textContent = data.electricPlacesPercentage || 0;
        
        document.getElementById('current-occupancy').textContent = (data.currentOccupancyRate || 0) + '%';
        document.getElementById('current-spots').textContent = data.currentOccupancy || 0;
        
        document.getElementById('average-occupancy').textContent = (data.averageOccupancyRate || 0) + '%';
        document.getElementById('average-spots').textContent = data.averageOccupancy || 0;
        
        document.getElementById('total-reservations').textContent = data.totalReservations || 0;
        
        document.getElementById('no-show-rate').textContent = (data.noShowRate || 0) + '%';
        document.getElementById('no-show-count').textContent = data.noShowReservations || 0;
        
        document.getElementById('recent-reservations').textContent = data.totalReservationsLast30Days || 0;
        document.getElementById('checked-in').textContent = data.checkedInReservations || 0;
        document.getElementById('no-shows').textContent = data.noShowReservations || 0;
        
        const occupancyBar = document.getElementById('occupancy-bar');
        const occupancyRate = data.currentOccupancyRate || 0;
        occupancyBar.style.width = occupancyRate + '%';
        occupancyBar.textContent = occupancyRate + '%';
        
        if (occupancyRate < 50) {
            occupancyBar.style.background = 'linear-gradient(90deg, #4caf50, #66bb6a)';
        } else if (occupancyRate < 80) {
            occupancyBar.style.background = 'linear-gradient(90deg, #ff9800, #ffb74d)';
        } else {
            occupancyBar.style.background = 'linear-gradient(90deg, #f44336, #ef5350)';
        }
        
        loading.style.display = 'none';
        dashboard.style.display = 'block';
    } catch (error) {
        console.error('Error loading analytics:', error);
        loading.innerHTML = '<i class="fas fa-exclamation-triangle"></i><br>Erreur lors du chargement des statistiques<br><small>' + error.message + '</small>';
        
        setTimeout(() => {
            loading.style.display = 'none';
            dashboard.style.display = 'block';
        }, 2000);
    }
}

async function loadHistory() {
    const tbody = document.getElementById('history-tbody');
    
    try {
        const response = await fetch('/dashboard/history?limit=50');
        const data = await response.json();
        
        if (data.history && data.history.length > 0) {
            tbody.innerHTML = data.history.map(item => {
                const statusLabels = {
                    'LOCKED': 'Réservée',
                    'CHECKED_IN': 'Check-in',
                    'EXPIRED': 'Expirée',
                    'NO_SHOW': 'No-show',
                    'CANCELLED': 'Annulée'
                };
                
                const statusClass = item.status.toLowerCase().replace('_', '-');
                const checkinInfo = item.isCheckedIn && item.checkedInAt 
                    ? new Date(item.checkedInAt).toLocaleString('fr-FR')
                    : '-';
                
                return `
                    <tr>
                        <td>${item.id}</td>
                        <td><strong>${item.placeLabel || '-'}</strong></td>
                        <td>${item.userName || 'Utilisateur inconnu'}</td>
                        <td>${new Date(item.reservationDate).toLocaleDateString('fr-FR')}</td>
                        <td>${checkinInfo}</td>
                        <td><span class="status-badge ${statusClass}">${statusLabels[item.status] || item.status}</span></td>
                    </tr>
                `;
            }).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px; color: #999;">Aucune réservation dans l\'historique</td></tr>';
        }
    } catch (error) {
        console.error('Error loading history:', error);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px; color: #f44336;">Erreur lors du chargement de l\'historique</td></tr>';
    }
}

async function exportHistory() {
    try {
        const response = await fetch('/dashboard/history?limit=1000');
        const data = await response.json();
        
        if (!data.history || data.history.length === 0) {
            alert('Aucune donnée à exporter');
            return;
        }
        
        // Create CSV content
        const headers = ['ID', 'Place', 'Utilisateur', 'Email', 'Date réservation', 'Check-in', 'Heure check-in', 'Statut'];
        const csvRows = [headers.join(',')];
        
        data.history.forEach(item => {
            const row = [
                item.id,
                `"${item.placeLabel || '-'}"`,
                `"${item.userName || 'Inconnu'}"`,
                `"${item.userEmail || '-'}"`,
                new Date(item.reservationDate).toLocaleDateString('fr-FR'),
                item.isCheckedIn ? 'Oui' : 'Non',
                item.checkedInAt ? new Date(item.checkedInAt).toLocaleString('fr-FR') : '-',
                `"${item.status}"`
            ];
            csvRows.push(row.join(','));
        });
        
        const csvContent = csvRows.join('\n');
        
        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `historique-parking-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Error exporting history:', error);
        alert('Erreur lors de l\'export de l\'historique');
    }
}

// Load analytics and history on page load
loadAnalytics();
loadHistory();
