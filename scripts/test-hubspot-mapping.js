#!/usr/bin/env node

/**
 * Test HubSpot Field Mapping
 * Tests that names, emails, and phone numbers are mapped correctly
 */

async function testHubSpotMapping() {
    console.log('🧪 Testing HubSpot Field Mapping...');

    try {
        // Test 1: Create a vote with full voter information
        console.log('\n1️⃣ Testing voter with full information...');

        const fullVoterData = {
            nomineeId: '08a489d3-e482-4be6-82cc-aec6d1eddeee', // Simple Test Nominee
            category: 'Top Recruiter',
            voter: {
                firstName: 'John',
                lastName: 'Smith',
                email: 'john.smith@example.com',
                linkedin: 'https://linkedin.com/in/john-smith',
                phone: '+1-555-123-4567'
            }
        };

        const fullVoterResponse = await fetch('http://localhost:3010/api/votes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fullVoterData)
        });

        if (fullVoterResponse.ok) {
            console.log('✅ Vote with full voter data created successfully');
            console.log('   Expected HubSpot mapping:');
            console.log('   - Name: John Smith (firstname: John, lastname: Smith)');
            console.log('   - Email: john.smith@example.com');
            console.log('   - Phone: +1-555-123-4567');
        } else {
            console.log('❌ Failed to create vote with full voter data');
        }

        // Test 2: Create a vote with minimal voter information
        console.log('\n2️⃣ Testing voter with minimal information...');

        const minimalVoterData = {
            nomineeId: '08a489d3-e482-4be6-82cc-aec6d1eddeee',
            category: 'Top Recruiter',
            voter: {
                firstName: 'Jane',
                lastName: 'Doe',
                email: 'jane.doe@company.com'
                // No phone number
            }
        };

        const minimalVoterResponse = await fetch('http://localhost:3010/api/votes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(minimalVoterData)
        });

        if (minimalVoterResponse.ok) {
            console.log('✅ Vote with minimal voter data created successfully');
            console.log('   Expected HubSpot mapping:');
            console.log('   - Name: Jane Doe (firstname: Jane, lastname: Doe)');
            console.log('   - Email: jane.doe@company.com');
            console.log('   - Phone: (empty - not provided)');
        } else {
            console.log('❌ Failed to create vote with minimal voter data');
        }

        // Test 3: Test nominee tagging
        console.log('\n3️⃣ Testing nominee tagging...');

        // Create a test nomination first
        const nominationData = {
            category: 'Top Recruiter',
            nominator: {
                name: 'Test Nominator',
                email: 'nominator@example.com',
                phone: ''
            },
            nominee: {
                name: 'Sarah Johnson',
                email: 'sarah.johnson@testcompany.com',
                title: 'Senior Recruiter',
                country: 'USA',
                linkedin: 'https://www.linkedin.com/in/sarah-johnson-test',
                imageUrl: '',
                whyVoteForMe: 'Test nominee for HubSpot mapping verification.'
            }
        };

        const nominationResponse = await fetch('http://localhost:3010/api/nominations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nominationData)
        });

        if (nominationResponse.ok) {
            const nominationResult = await nominationResponse.json();
            console.log('✅ Test nomination created:', nominationResult.id);

            // Approve the nomination to trigger HubSpot sync
            const approvalResponse = await fetch('http://localhost:3010/api/nominations', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: nominationResult.id,
                    status: 'approved'
                })
            });

            if (approvalResponse.ok) {
                console.log('✅ Nomination approved - HubSpot nominee sync triggered');
                console.log('   Expected HubSpot mapping:');
                console.log('   - Name: Sarah Johnson (firstname: Sarah, lastname: Johnson)');
                console.log('   - Email: sarah.johnson@testcompany.com');
                console.log('   - Lead Status: NOMINEE_2026');
            } else {
                console.log('❌ Failed to approve nomination');
            }
        } else {
            console.log('❌ Failed to create test nomination');
        }

        console.log('\n🎉 HubSpot mapping test completed!');
        console.log('\n📋 What to check in HubSpot:');
        console.log('1. Go to Contacts in your HubSpot account');
        console.log('2. Look for the contacts created above');
        console.log('3. Verify that:');
        console.log('   - Names are split correctly into firstname/lastname');
        console.log('   - Email addresses are populated');
        console.log('   - Phone numbers are included when provided');
        console.log('   - Lead Status shows VOTER_2026 or NOMINEE_2026');

    } catch (error) {
        console.error('❌ HubSpot mapping test failed:', error.message);
    }
}

testHubSpotMapping();