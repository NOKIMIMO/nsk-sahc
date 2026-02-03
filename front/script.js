const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
let selectedSpots = new Set();
let placesData = [];

const container = document.getElementById('parking-container');
const btnValider = document.getElementById('btn-valider');
const btnAnnuler = document.getElementById('btn-annuler');

async function fetchPlaces() {
    try {
        const response = await fetch('http://localhost:3000/places');
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

        // Filter places for this row
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
    
    // Contenu interne (Icône + ID)
    const icon = isOccupied ? 'fa-times' : 'fa-parking';
    el.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${id}</span>
        ${isElectric ? '<i class="fas fa-bolt electric-icon"></i>' : ''}
    `;

    if (!isOccupied) {
        el.addEventListener('click', () => toggleSpot(id));
    }
    
    return el;
}

function toggleSpot(id) {
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
    btnValider.disabled = !hasSelection;
    btnAnnuler.disabled = !hasSelection;
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
        const response = await fetch('http://localhost:3000/reservations/by-label', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ labels })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            const successMsg = `${result.created} réservation(s) créée(s) sur ${result.total}`;
            if (result.errors.length > 0) {
                const errorMsg = result.errors.map(e => `${e.label}: ${e.error}`).join('\n');
                alert(`${successMsg}\n\nErreurs:\n${errorMsg}`);
            } else {
                alert(`✓ ${successMsg}`);
            }
            
            // Refresh places and reset selection
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

// Initialize parking on load
(async () => {
    const places = await fetchPlaces();
    initParking(places);
})();