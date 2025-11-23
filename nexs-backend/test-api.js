const baseUrl = 'http://localhost:5000';
let authToken = '';
let userId = '';

// Helper function to make requests
async function makeRequest(endpoint, options = {}) {
    const url = `${baseUrl}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (authToken && !options.skipAuth) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers
        });
        const data = await response.json();
        return { status: response.status, data };
    } catch (error) {
        return { error: error.message };
    }
}

// Test functions
async function testHealthCheck() {
    console.log('\n=== Testing Health Check ===');
    const result = await makeRequest('/health', { skipAuth: true });
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
}

async function testSignUp() {
    console.log('\n=== Testing Sign Up ===');
    const result = await makeRequest('/api/auth/signup', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({
            email: 'testuser@nexspire.com',
            password: 'password123',
            firstName: 'Test',
            lastName: 'User'
        })
    });
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
    if (result.data.success) {
        console.log('✓ User created successfully');
    }
}

async function testSignIn() {
    console.log('\n=== Testing Sign In ===');
    const result = await makeRequest('/api/auth/signin', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({
            email: 'testuser@nexspire.com',
            password: 'password123'
        })
    });
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
    if (result.data && result.data.token) {
        authToken = result.data.token;
        userId = result.data.user.id;
        console.log('✓ Signed in successfully');
        console.log('Token saved:', authToken.substring(0, 20) + '...');
    } else {
        console.log('Response structure:', result);
    }
}

async function testCreateTeamMember() {
    console.log('\n=== Testing Create Team Member ===');
    const result = await makeRequest('/api/team', {
        method: 'POST',
        body: JSON.stringify({
            name: 'Alice Johnson',
            email: 'alice@nexspire.com',
            phone: '+1234567890',
            position: 'Senior Developer',
            department: 'Engineering',
            status: 'active',
            workload: 75,
            joinDate: '2025-01-15'
        })
    });
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
    if (result.data.success) {
        console.log('✓ Team member created');
    }
}

async function testGetAllTeamMembers() {
    console.log('\n=== Testing Get All Team Members ===');
    const result = await makeRequest('/api/team');
    console.log('Status:', result.status);
    console.log('Count:', result.data.count);
    console.log('Response:', JSON.stringify(result.data, null, 2));
}

async function testTeamStats() {
    console.log('\n=== Testing Team Statistics ===');
    const result = await makeRequest('/api/team/stats');
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
}

async function testCreateClient() {
    console.log('\n=== Testing Create Client ===');
    const result = await makeRequest('/api/clients', {
        method: 'POST',
        body: JSON.stringify({
            companyName: 'TechCorp Inc',
            contactName: 'John Smith',
            email: 'john@techcorp.com',
            phone: '+1987654321',
            industry: 'Technology',
            status: 'active',
            city: 'San Francisco',
            country: 'USA'
        })
    });
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
}

async function testGetAllClients() {
    console.log('\n=== Testing Get All Clients ===');
    const result = await makeRequest('/api/clients');
    console.log('Status:', result.status);
    console.log('Count:', result.data.count);
    console.log('Response:', JSON.stringify(result.data, null, 2));
}

async function testSendMessage() {
    console.log('\n=== Testing Send Message ===');
    const result = await makeRequest('/api/messages', {
        method: 'POST',
        body: JSON.stringify({
            recipientId: userId,
            subject: 'Welcome to NexSpire!',
            message: 'This is a test message from the messaging system.'
        })
    });
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
}

async function testGetInbox() {
    console.log('\n=== Testing Get Inbox ===');
    const result = await makeRequest('/api/messages/inbox');
    console.log('Status:', result.status);
    console.log('Count:', result.data.count);
    console.log('Response:', JSON.stringify(result.data, null, 2));
}

async function testGetUnreadCount() {
    console.log('\n=== Testing Get Unread Count ===');
    const result = await makeRequest('/api/messages/unread-count');
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
}

// Run all tests
async function runAllTests() {
    console.log('🧪 Starting API Tests for NexSpire Solutions Backend\n');
    console.log('Server:', baseUrl);
    console.log('='.repeat(60));

    try {
        await testHealthCheck();
        await testSignUp();
        await testSignIn();

        if (!authToken) {
            console.log('\n❌ Authentication failed. Stopping tests.');
            return;
        }

        await testCreateTeamMember();
        await testGetAllTeamMembers();
        await testTeamStats();
        await testCreateClient();
        await testGetAllClients();
        await testSendMessage();
        await testGetInbox();
        await testGetUnreadCount();

        console.log('\n' + '='.repeat(60));
        console.log('✅ All tests completed!\n');
    } catch (error) {
        console.error('\n❌ Test failed:', error);
    }
}

// Run tests
runAllTests();
