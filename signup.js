document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        console.log("Starting Sign-Up Process...");

        // Step 1: Sign Up the User
        const signupResponse = await fetch('/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
        });

        const signupData = await signupResponse.json();
        console.log("Sign-Up Response:", signupData);

        if (!signupData.success) {
            alert('Sign-up failed: ' + signupData.message);
            return;
        }

        console.log("Sign-Up Successful! Attempting Login...");

        // Step 2: Automatically Log in the User
        const loginResponse = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const loginData = await loginResponse.json();
        console.log("Login Response:", loginData);

        if (loginData.success) {
            alert('Sign-up & Login successful! Redirecting...');
            window.location.href = '/input-display.html'; // Redirect after login
        } else {
            alert('Sign-up was successful, but login failed: ' + loginData.message);
        }
    } catch (err) {
        console.error('Error:', err);
        alert('An unexpected error occurred.');
    }
});
