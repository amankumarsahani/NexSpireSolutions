const baseUrl = 'http://localhost:5000';

async function createAdminUser() {
    try {
        const response = await fetch(`${baseUrl}/api/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@nexspire.com',
                password: 'admin123',
                firstName: 'Admin',
                lastName: 'User'
            })
        });

        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));

        if (response.ok) {
            console.log('\n✅ Admin user created successfully!');
            console.log('Email: admin@nexspire.com');
            console.log('Password: admin123');
        } else {
            console.log('\n❌ Error:', data.error || data.message);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

createAdminUser();
