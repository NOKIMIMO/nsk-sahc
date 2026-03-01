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

if (userRole !== USER_ROLES.SECRETARY && userRole !== USER_ROLES.ADMIN) {
    alert('Accès refusé: QR Codes réservés aux Secrétaires et Admins');
    window.location.href = '/';
}

const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
const spotsPerRow = 10;
const electricRows = ['A', 'F'];

const grid = document.getElementById('qr-grid');
const baseUrl = window.location.origin;

rows.forEach(row => {
    for (let i = 1; i <= spotsPerRow; i++) {
        const placeLabel = row + String(i).padStart(2, '0');
        const isElectric = electricRows.includes(row);
        
        const card = document.createElement('div');
        card.className = 'qr-card';
        
        const title = document.createElement('h3');
        title.textContent = placeLabel;
        card.appendChild(title);
        
        if (isElectric) {
            const badge = document.createElement('span');
            badge.className = 'electric-badge';
            badge.innerHTML = ' Électrique';
            card.appendChild(badge);
        }
        
        const qrDiv = document.createElement('div');
        qrDiv.className = 'qr-code';
        qrDiv.id = 'qr-' + placeLabel;
        card.appendChild(qrDiv);
        
        const instructions = document.createElement('div');
        instructions.className = 'instructions';
        instructions.textContent = 'Scannez pour check-in';
        card.appendChild(instructions);
        
        grid.appendChild(card);
        
        const checkinUrl = `${baseUrl}/?place=${placeLabel}`;
        new QRCode(qrDiv, {
            text: checkinUrl,
            width: 150,
            height: 150
        });
    }
});
