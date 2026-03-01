if (localStorage.getItem('token')) {
    window.location.href = 'index.html';
}

const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('error-message');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    errorMessage.classList.remove('show');
    errorMessage.textContent = '';
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('userRole', data.user.status);
            localStorage.setItem('userName', `${data.user.firstName} ${data.user.lastName}`);
            
            window.location.href = 'index.html';
        } else {
            errorMessage.textContent = data.error || 'Échec de la connexion';
            errorMessage.classList.add('show');
        }
    } catch (error) {
        console.error('Login error:', error);
        errorMessage.textContent = 'Erreur de connexion au serveur';
        errorMessage.classList.add('show');
    }
});

window.quickLogin = function(email) {
    document.getElementById('email').value = email;
    document.getElementById('password').value = 'password123';
    loginForm.dispatchEvent(new Event('submit'));
};
