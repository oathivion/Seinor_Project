document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        if (data.success) {
            localStorage.setItem('userId', data.userId); // Store userId for later use
            alert('Login successful!');
            window.location.href = 'message-board.html'; // Redirect 
        } else {
            alert(`Error: ${data.message}`);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Unexpected login error.');
    }
});
