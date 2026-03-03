if (!localStorage.getItem('token')) {
    window.location.href = 'login.html';
}

const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
let selectedSpots = new Set();
let placesData = [];
let currentUserRole = parseInt(localStorage.getItem('userRole') || '0');
let selectedReservationUserId = localStorage.getItem('userId');

const USER_ROLES = {
    EMPLOYEE: 0,
    SECRETARY: 1,
    MANAGER: 2,
    ADMIN: 3
};

const container = document.getElementById('parking-container');
const btnValider = document.getElementById('btn-valider');
const btnAnnuler = document.getElementById('btn-annuler');
const linkDashboard = document.getElementById('link-dashboard');
const linkQRCodes = document.getElementById('link-qrcodes');
const userInfo = document.getElementById('user-info');
const btnLogout = document.getElementById('btn-logout');

const userName = localStorage.getItem('userName') || 'Utilisateur';
userInfo.textContent = userName;

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

const adminContainer = document.createElement('div');
adminContainer.id = 'admin-controls';
adminContainer.style.cssText = 'margin: 10px 0; padding: 10px; background-color: #f0f0f0; border-radius: 5px; display: flex; justify-content: space-between; align-items: center;';
adminContainer.innerHTML = `
    <div>
        <button id="btn-expire-selected" style="margin-right: 10px; padding: 8px 15px; background-color: #ff9800; color: white; border: none; border-radius: 4px; cursor: pointer;">Expirer sélectionnées</button>
        <button id="btn-expire-all" style="padding: 8px 15px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">Expirer tout</button>
    </div>
    <div id="selection-info" style="font-size: 0.9em; color: #666;"></div>
`;
document.body.insertBefore(adminContainer, container);

const reservationUserContainer = document.createElement('div');
reservationUserContainer.id = 'reservation-user-select';
reservationUserContainer.style.cssText = 'display: none; margin: 0; padding: 10px 15px; background-color: #e8f4fd; border-bottom: 2px solid #3498db; align-items: center; gap: 12px; flex-wrap: wrap;';
reservationUserContainer.innerHTML = `
    <label for="select-reservation-user" style="font-weight: bold; color: #2c3e50;">Réserver pour :</label>
    <select id="select-reservation-user" style="padding: 8px 12px; border: 2px solid #3498db; border-radius: 6px; font-size: 0.95em; background: white; cursor: pointer; min-width: 220px;">
        <option value="">Chargement...</option>
    </select>
`;
document.body.insertBefore(reservationUserContainer, adminContainer);

const selectReservationUser = document.getElementById('select-reservation-user');
selectReservationUser.addEventListener('change', () => {
    selectedReservationUserId = selectReservationUser.value || localStorage.getItem('userId');
});

async function loadUsers() {
    try {
        const response = await fetch('/users', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const users = await response.json();
        selectReservationUser.innerHTML = users.filter(u => u.status === 0 || u.status === 1 || u.status === 2).map(u =>
            `<option value="${u.id}">${u.firstName} ${u.lastName} (${['Employé','Secrétaire','Manager','Admin'][u.status] || u.status})</option>`
        ).join('');
        selectReservationUser.value = localStorage.getItem('userId');
        selectedReservationUserId = localStorage.getItem('userId');
    } catch (error) {
        console.error('Error loading users:', error);
        selectReservationUser.innerHTML = '<option value="">Erreur de chargement</option>';
    }
}

const btnExpireSelected = document.getElementById('btn-expire-selected');
const btnExpireAll = document.getElementById('btn-expire-all');
const selectionInfo = document.getElementById('selection-info');

const checkinInput = document.getElementById('checkin-place');
const checkinTimeInput = document.getElementById('checkin-time');
const btnCheckin = document.getElementById('btn-checkin');
const checkinMessage = document.getElementById('checkin-message');

const now = new Date();
checkinTimeInput.value = now.toTimeString().slice(0, 5);

function loadUserRole() {
    const savedRole = localStorage.getItem('userRole');
    if (savedRole !== null) {
        currentUserRole = parseInt(savedRole);
    }
    updateUIForRole();
}

function updateUIForRole() {
    const isAdmin = currentUserRole === USER_ROLES.ADMIN;
    const isManager = currentUserRole === USER_ROLES.MANAGER;
    const isSecretary = currentUserRole === USER_ROLES.SECRETARY;
    const isPrivileged = isSecretary || isManager || isAdmin;
    
    if (isManager || isAdmin) {
        linkDashboard.style.display = 'inline';
    } else {
        linkDashboard.style.display = 'none';
    }
    
    if (isSecretary || isAdmin) {
        linkQRCodes.style.display = 'inline';
    } else {
        linkQRCodes.style.display = 'none';
    }
    
    if (isPrivileged) {
        adminContainer.style.display = 'flex';
    } else {
        adminContainer.style.display = 'none';
    }

    if (isSecretary) {
        reservationUserContainer.style.display = 'flex';
        loadUsers();
    } else {
        reservationUserContainer.style.display = 'none';
        selectedReservationUserId = localStorage.getItem('userId');
    }
}

async function fetchPlaces() {
    try {
        const response = await fetch('/places'); 
        const data = await response.json();
        placesData = data.places;
        return placesData;
    } catch (error) {
        console.error('Error fetching places:', error);
        return [];
    }
}

function initParking(places) {
    container.innerHTML = '';
    
    rows.forEach(rowLetter => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'parking-row';

        const label = document.createElement('div');
        label.className = 'row-label';
        label.textContent = rowLetter;

        const spotsList = document.createElement('div');
        spotsList.className = 'spots-list';

        const rowPlaces = places.filter(p => p.id.startsWith(rowLetter));
        
        rowPlaces.forEach(place => {
            const spot = createSpotElement(place.id, place.isOccupied, place.isElectric);
            spotsList.appendChild(spot);
        });

        rowDiv.appendChild(label);
        rowDiv.appendChild(spotsList);
        container.appendChild(rowDiv);
    });
}

function createSpotElement(id, isOccupied, isElectric) {
    const el = document.createElement('div');
    el.id = id;
    el.className = `spot ${isOccupied ? 'occupied' : 'available'} ${isElectric ? 'electric' : ''}`;
    el.dataset.occupied = isOccupied;
    
    const icon = isOccupied ? 'fa-times' : 'fa-parking';
    el.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${id}</span>
        ${isElectric ? '<i class="fas fa-bolt electric-icon"></i>' : ''}
    `;

    el.addEventListener('click', () => toggleSpot(id, isOccupied));
    
    return el;
}

function toggleSpot(id, isOccupied) {
    const el = document.getElementById(id);
    
    if (selectedSpots.has(id)) {
        selectedSpots.delete(id);
        el.classList.remove('selected');
    } else {
        selectedSpots.add(id);
        el.classList.add('selected');
    }
    updateButtons();
}

function updateButtons() {
    const hasSelection = selectedSpots.size > 0;
    
    let availableCount = 0;
    let occupiedCount = 0;
    
    selectedSpots.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.dataset.occupied === 'true') {
            occupiedCount++;
        } else if (el && el.dataset.occupied === 'false') {
            availableCount++;
        }
    });
    
    btnValider.disabled = availableCount === 0;
    btnAnnuler.disabled = !hasSelection;
    btnExpireSelected.disabled = occupiedCount === 0;
    
    if (hasSelection) {
        const parts = [];
        if (availableCount > 0) parts.push(`${availableCount} disponible(s)`);
        if (occupiedCount > 0) parts.push(`${occupiedCount} occupée(s)`);
        selectionInfo.textContent = `Sélection: ${parts.join(', ')}`;
    } else {
        selectionInfo.textContent = '';
    }
}

btnAnnuler.addEventListener('click', () => {
    selectedSpots.forEach(id => {
        document.getElementById(id).classList.remove('selected');
    });
    selectedSpots.clear();
    updateButtons();
});

btnValider.addEventListener('click', async () => {
    const labels = Array.from(selectedSpots);
    console.log('Places sélectionnées :', labels);
    
    try {
        const response = await fetch('/reservations/by-label', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ labels, userId: selectedReservationUserId })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            const successMsg = `${result.created} réservation(s) créée(s) sur ${result.total}`;
            if (result.errors.length > 0) {
                const errorMsg = result.errors.map(e => `${e.label}: ${e.error}`).join('\n');
                alert(`${successMsg}\n\nErreurs:\n${errorMsg}`);
            } else {
                alert(successMsg);
            }
            
            const places = await fetchPlaces();
            initParking(places);
            selectedSpots.clear();
            updateButtons();
        } else {
            alert('Erreur: ' + result.error);
        }
    } catch (error) {
        console.error('Error creating reservations:', error);
        alert('Erreur lors de la création des réservations');
    }
});

(async () => {
    loadUserRole();
    const places = await fetchPlaces();
    initParking(places);
})();

btnExpireSelected.addEventListener('click', async () => {
    const occupiedLabels = Array.from(selectedSpots).filter(id => {
        const el = document.getElementById(id);
        return el && el.dataset.occupied === 'true';
    });
    
    if (occupiedLabels.length === 0) {
        alert('Aucune place occupée sélectionnée');
        return;
    }
    
    if (!confirm(`Êtes-vous sûr ? Cela annulera ${occupiedLabels.length} réservation(s) active(s).`)) {
        return;
    }
    
    try {
        const response = await fetch('/reservations/expire/selected', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ labels: occupiedLabels })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert(`${result.count} réservation(s) expirée(s)`);
            const places = await fetchPlaces();
            initParking(places);
            selectedSpots.clear();
            updateButtons();
        } else {
            alert('Erreur: ' + result.error);
        }
    } catch (error) {
        console.error('Error expiring reservations:', error);
        alert('Erreur lors de l\'expiration des réservations');
    }
});

btnCheckin.addEventListener('click', async () => {
    const placeLabel = checkinInput.value.trim().toUpperCase();
    const checkinTime = checkinTimeInput.value;
    
    if (!placeLabel) {
        showCheckinMessage('Veuillez entrer un numéro de place', 'error');
        return;
    }
    
    if (!checkinTime) {
        showCheckinMessage('Veuillez sélectionner une heure d\'arrivée', 'error');
        return;
    }
    
    if (!/^[A-F]\d{2}$/.test(placeLabel)) {
        showCheckinMessage('Format invalide. Utilisez le format: A01, B05, etc.', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/reservations/checkin/${placeLabel}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ time: checkinTime })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showCheckinMessage(`Check-in réussi pour la place ${placeLabel} à ${checkinTime}`, 'success');
            checkinInput.value = '';
            const now = new Date();
            checkinTimeInput.value = now.toTimeString().slice(0, 5);
            
            const places = await fetchPlaces();
            initParking(places);
        } else {
            showCheckinMessage(`Erreur: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Error during check-in:', error);
        showCheckinMessage('Erreur lors du check-in', 'error');
    }
});

checkinInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        btnCheckin.click();
    }
});

function showCheckinMessage(message, type) {
    checkinMessage.textContent = message;
    checkinMessage.style.color = type === 'success' ? '#28a745' : '#dc3545';
    checkinMessage.style.fontWeight = 'bold';
    
    setTimeout(() => {
        checkinMessage.textContent = '';
    }, 5000);
}

const urlParams = new URLSearchParams(window.location.search);
const qrPlace = urlParams.get('place');
if (qrPlace) {
    checkinInput.value = qrPlace.toUpperCase();
    setTimeout(() => {
        btnCheckin.click();
    }, 500);
}

btnExpireAll.addEventListener('click', async () => {
    if (!confirm('Êtes-vous sûr ? Cela expirera TOUTES les réservations.')) {
        return;
    }
    
    try {
        const response = await fetch('/reservations/expire/all', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert(`${result.count} réservation(s) expirée(s)`);
            const places = await fetchPlaces();
            initParking(places);
            selectedSpots.clear();
            updateButtons();
        } else {
            alert('Erreur: ' + result.error);
        }
    } catch (error) {
        console.error('Error expiring all reservations:', error);
        alert('Erreur lors de l\'expiration des réservations');
    }
});