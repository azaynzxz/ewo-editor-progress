const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwZpWsJEOFlOQkDA55JyjV1q6CkpO37VNbFi7bxrJsB2LeheFwSrDQHbm_oR5D1hl0TKQ/exec';

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function simulateClockInOut() {
    console.log('--- STARTING CONCURRENT CLOCK-IN SIMULATION ---');
    const N = 5;
    const inRequests = [];
    const attendanceIds = [];

    for (let i = 1; i <= N; i++) {
        const id = `CLOCKOUT_TEST_${Date.now()}_${i}`;
        attendanceIds.push(id);

        const payloadIn = {
            action: 'clockIn',
            attendanceId: id,
            role: 'video_editor',
            date: new Date().toISOString().split('T')[0],
            name: `ClockOut_User_${i}`,
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
            status: 'Test Status', // The reason it said "On Time" is because we hardcoded it in the test script!
            todo: `Test Todo ${i}`
        };

        const req = fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payloadIn),
            redirect: 'follow', // Fetch wrapper will follow redirects which Apps script requires
        }).then(res => res.json())
            .then(result => ({ user: `ClockOut_User_${i}`, result }))
            .catch(err => ({ user: `ClockOut_User_${i}`, error: err.message }));

        inRequests.push(req);
    }

    console.log(`Sending ${N} Clock-In requests simultaneously...`);
    const inResults = await Promise.all(inRequests);
    inResults.forEach(res => {
        console.log(`Clock-In Result for ${res.user}:`, JSON.stringify(res.result || res.error));
    });

    console.log('\n--- WAITING 5 SECONDS BEFORE CLOCK-OUT ---');
    await delay(5000);

    console.log('\n--- STARTING CONCURRENT CLOCK-OUT SIMULATION ---');
    const outRequests = [];

    for (let i = 1; i <= N; i++) {
        const payloadOut = {
            action: 'clockOut',
            attendanceId: attendanceIds[i - 1], // VERY IMPORTANT: Use the exact same attendanceId we got from Clock In
            role: 'video_editor',
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
            durationHrs: '0.05',
            name: `ClockOut_User_${i}`
        };

        const req = fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payloadOut),
            redirect: 'follow',
        }).then(res => res.json())
            .then(result => ({ user: `ClockOut_User_${i}`, result }))
            .catch(err => ({ user: `ClockOut_User_${i}`, error: err.message }));

        outRequests.push(req);
    }

    console.log(`Sending ${N} Clock-Out requests simultaneously...`);
    const outResults = await Promise.all(outRequests);
    outResults.forEach(res => {
        console.log(`Clock-Out Result for ${res.user}:`, JSON.stringify(res.result || res.error));
    });

    console.log('\nSimulation finished. Check the sheet to verify if Clock Out times appeared on the exact same row as Clock In.');
}

simulateClockInOut();
