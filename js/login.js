document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:3000/api/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            const { userId } = await response.json();
            localStorage.setItem('userId', userId); // Store userId in localStorage
            alert('Login successful');
            window.location.href = 'dashboard.html'; // Redirect to dashboard
        } else {
            const { error } = await response.json();
            alert(`Login failed: ${error}`);
        }
    } catch (error) {
        alert(`Login failed: ${error.message}`);
    }
});
