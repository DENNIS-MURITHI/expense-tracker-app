document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:3000/api/users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            alert('Registration successful');
            window.location.href = 'login.html'; // Redirect to login
        } else {
            const { error } = await response.json();
            alert(`Registration failed: ${error}`);
        }
    } catch (error) {
        alert(`Registration failed: ${error.message}`);
    }
});
