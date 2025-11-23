// Test login with the user we created
const baseUrl = 'http://localhost:5000';

async function testLogin() {
    const credentials = [
        { email: 'admin@nexspire.com', password: 'admin123' },
        { email: 'testuser@nexspire.com', password: 'password123' }
    ];

    for (const cred of credentials) {
        console.log(`\n=== Testing: ${cred.email} ===`);
        try {
            const response = await fetch(`${baseUrl}/api/auth/signin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cred)
            });

            const data = await response.json();

            if (response.ok) {
                console.log('✅ LOGIN SUCCESS!');
                console.log('User:', data.user);
                console.log('Token:', data.token.substring(0, 30) + '...');
            } else {
                console.log('❌ LOGIN FAILED');
                console.log('Error:', data.error || data.message);
            }
        } catch (error) {
            console.log('❌ ERROR:', error.message);
        }
    }
}

testLogin();
