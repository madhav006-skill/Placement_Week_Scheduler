/**
 * Comprehensive Test Script for Placement Week Scheduler
 * Tests all 4 disruption scenarios + edge cases
 */
const axios = require('axios');
const API = 'http://localhost:5000/api';

let passed = 0;
let failed = 0;
const results = [];

function assert(condition, testName, details = '') {
    if (condition) {
        passed++;
        results.push(`✅ PASS: ${testName}`);
    } else {
        failed++;
        results.push(`❌ FAIL: ${testName} ${details}`);
    }
}

async function runTests() {
    console.log('=== PLACEMENT WEEK SCHEDULER - FULL TEST SUITE ===\n');

    // ====== TEST 1: Data Generation ======
    console.log('--- Test 1: Data Generation ---');
    try {
        const genRes = await axios.post(`${API}/generate-data`);
        assert(genRes.status === 200, 'Data generation returns 200');
        
        const companies = (await axios.get(`${API}/companies`)).data;
        assert(companies.length === 35, `35 companies generated (got ${companies.length})`);
        
        const students = (await axios.get(`${API}/students`)).data;
        assert(students.length === 800, `800 students generated (got ${students.length})`);
        
        const rooms = (await axios.get(`${API}/rooms`)).data;
        assert(rooms.length === 20, `20 rooms generated (got ${rooms.length})`);

        // Check tier distribution
        const tier1 = companies.filter(c => c.priorityTier === 1);
        const tier2 = companies.filter(c => c.priorityTier === 2);
        const tier3 = companies.filter(c => c.priorityTier === 3);
        assert(tier1.length > 0, `Tier 1 companies exist (${tier1.length})`);
        assert(tier2.length > 0, `Tier 2 companies exist (${tier2.length})`);
        assert(tier3.length > 0, `Tier 3 companies exist (${tier3.length})`);

        // Check panels exist
        const totalPanels = companies.reduce((sum, c) => sum + (c.panels ? c.panels.length : 0), 0);
        assert(totalPanels > 35, `Panels generated (${totalPanels} total)`);

        // Check shortlists exist
        const studentsWithShortlists = students.filter(s => s.shortlistedCompanyIds && s.shortlistedCompanyIds.length > 0);
        assert(studentsWithShortlists.length > 0, `Students have shortlists (${studentsWithShortlists.length} students shortlisted)`);

        // Check CGPA realism
        const avgCgpa = students.reduce((s, st) => s + st.cgpa, 0) / students.length;
        assert(avgCgpa > 6.5 && avgCgpa < 8.5, `Average CGPA is realistic: ${avgCgpa.toFixed(2)}`);

    } catch (err) {
        assert(false, 'Data generation', err.message);
    }

    // ====== TEST 2: Baseline Schedule ======
    console.log('\n--- Test 2: Baseline Schedule ---');
    try {
        const baseRes = await axios.post(`${API}/schedule/baseline`);
        assert(baseRes.status === 200, 'Baseline schedule returns 200');
        assert(baseRes.data.version, 'Schedule version created');
        assert(baseRes.data.metrics, 'Metrics calculated');

        const versionId = baseRes.data.version._id;
        const latest = (await axios.get(`${API}/schedule/latest`)).data;
        assert(latest.version._id === versionId, 'Latest version matches baseline');

        const interviews = latest.interviews;
        const scheduled = interviews.filter(i => i.status === 'SCHEDULED');
        const unscheduled = interviews.filter(i => i.status === 'UNSCHEDULED');
        
        assert(scheduled.length > 0, `Scheduled interviews exist (${scheduled.length})`);
        assert(unscheduled.length > 0, `Unscheduled interviews tracked (${unscheduled.length})`);
        
        // Check unscheduled have reasons
        const withReasons = unscheduled.filter(i => i.reason && i.reason.length > 0);
        assert(withReasons.length === unscheduled.length, `All unscheduled have reasons (${withReasons.length}/${unscheduled.length})`);

        // ====== TEST 3: Hard Constraint Validation ======
        console.log('\n--- Test 3: Hard Constraint Validation (No Overlaps) ---');
        
        // Check NO student double-booking
        let studentClashes = 0;
        const studentMap = {};
        for (let inv of scheduled) {
            const sid = inv.studentId._id;
            if (!studentMap[sid]) studentMap[sid] = [];
            const [sh, sm] = inv.startTime.split(':').map(Number);
            const [eh, em] = inv.endTime.split(':').map(Number);
            const start = sh * 60 + sm;
            const end = eh * 60 + em;
            
            for (let existing of studentMap[sid]) {
                if (existing.day === inv.day && Math.max(start, existing.start) < Math.min(end, existing.end)) {
                    studentClashes++;
                }
            }
            studentMap[sid].push({ day: inv.day, start, end });
        }
        assert(studentClashes === 0, `No student double-bookings (clashes: ${studentClashes})`);

        // Check NO room double-booking
        let roomClashes = 0;
        const roomMap = {};
        for (let inv of scheduled) {
            const rid = inv.roomId._id;
            if (!roomMap[rid]) roomMap[rid] = [];
            const [sh, sm] = inv.startTime.split(':').map(Number);
            const [eh, em] = inv.endTime.split(':').map(Number);
            const start = sh * 60 + sm;
            const end = eh * 60 + em;
            
            for (let existing of roomMap[rid]) {
                if (existing.day === inv.day && Math.max(start, existing.start) < Math.min(end, existing.end)) {
                    roomClashes++;
                }
            }
            roomMap[rid].push({ day: inv.day, start, end });
        }
        assert(roomClashes === 0, `No room double-bookings (clashes: ${roomClashes})`);

        // Check NO panel double-booking
        let panelClashes = 0;
        const panelMap = {};
        for (let inv of scheduled) {
            if (!inv.panelId) continue;
            const pid = inv.panelId._id;
            if (!panelMap[pid]) panelMap[pid] = [];
            const [sh, sm] = inv.startTime.split(':').map(Number);
            const [eh, em] = inv.endTime.split(':').map(Number);
            const start = sh * 60 + sm;
            const end = eh * 60 + em;
            
            for (let existing of panelMap[pid]) {
                if (existing.day === inv.day && Math.max(start, existing.start) < Math.min(end, existing.end)) {
                    panelClashes++;
                }
            }
            panelMap[pid].push({ day: inv.day, start, end });
        }
        assert(panelClashes === 0, `No panel double-bookings (clashes: ${panelClashes})`);

        // Metrics validation
        console.log('\n--- Test 4: Metrics ---');
        const metrics = (await axios.get(`${API}/metrics/${versionId}`)).data;
        assert(metrics.scheduled > 0, `Metrics: scheduled count (${metrics.scheduled})`);
        assert(Number(metrics.schedulingRate) > 0, `Metrics: scheduling rate (${metrics.schedulingRate}%)`);
        assert(metrics.studentClashes === 0, `Metrics: 0 student clashes`);
        assert(Number(metrics.roomUtilization) > 0, `Metrics: room utilization (${metrics.roomUtilization}%)`);

        // ====== TEST 5: COMPANY DELAY Replan ======
        console.log('\n--- Test 5: Disruption - Company Delay ---');
        const companies = (await axios.get(`${API}/companies`)).data;
        const company1 = companies[0];
        
        const replan1 = await axios.post(`${API}/schedule/replan/${versionId}`, {
            type: 'COMPANY_DELAY',
            targetId: company1._id,
            delayHours: 3
        });
        assert(replan1.status === 200, 'Company delay replan returns 200');
        assert(replan1.data.parentVersionId === versionId, 'Parent version linked');
        assert(replan1.data.disruptionDetails.type === 'COMPANY_DELAY', 'Disruption type recorded');

        const diff1 = (await axios.get(`${API}/diff/${replan1.data._id}`)).data;
        const totalChanges1 = diff1.changes.length;
        assert(totalChanges1 >= 0, `Company delay diff generated (${totalChanges1} changes)`);
        console.log(`   Moved: ${diff1.summary.moved}, Cancelled: ${diff1.summary.cancelled}, Stakeholders: ${diff1.summary.affectedStakeholders.length}`);

        // After replan, verify no new constraint violations
        const replanInterviews1 = (await axios.get(`${API}/schedule/${replan1.data._id}`)).data;
        const replanScheduled1 = replanInterviews1.filter(i => i.status === 'SCHEDULED');
        let replanClashes1 = 0;
        const replanStudentMap1 = {};
        for (let inv of replanScheduled1) {
            const sid = inv.studentId._id || inv.studentId;
            if (!replanStudentMap1[sid]) replanStudentMap1[sid] = [];
            const [sh, sm] = inv.startTime.split(':').map(Number);
            const [eh, em] = inv.endTime.split(':').map(Number);
            const start = sh * 60 + sm;
            const end = eh * 60 + em;
            for (let existing of replanStudentMap1[sid]) {
                if (existing.day === inv.day && Math.max(start, existing.start) < Math.min(end, existing.end)) {
                    replanClashes1++;
                }
            }
            replanStudentMap1[sid].push({ day: inv.day, start, end });
        }
        assert(replanClashes1 === 0, `Post-replan: no student clashes after company delay (${replanClashes1})`);

        // ====== TEST 6: PANEL DROP Replan ======
        console.log('\n--- Test 6: Disruption - Panel Drop ---');
        const companyWithPanels = companies.find(c => c.panels && c.panels.length >= 2);
        if (companyWithPanels) {
            const panelToDrop = companyWithPanels.panels[0];
            const latestV = (await axios.get(`${API}/schedule/latest`)).data.version._id;
            
            const replan2 = await axios.post(`${API}/schedule/replan/${latestV}`, {
                type: 'PANEL_DROP',
                targetId: panelToDrop._id
            });
            assert(replan2.status === 200, 'Panel drop replan returns 200');
            assert(replan2.data.disruptionDetails.type === 'PANEL_DROP', 'Panel drop type recorded');

            const diff2 = (await axios.get(`${API}/diff/${replan2.data._id}`)).data;
            console.log(`   Moved: ${diff2.summary.moved}, Cancelled: ${diff2.summary.cancelled}, Stakeholders: ${diff2.summary.affectedStakeholders.length}`);
        } else {
            assert(false, 'Panel drop test', 'No company with 2+ panels found');
        }

        // ====== TEST 7: STUDENT WITHDRAW Replan ======
        console.log('\n--- Test 7: Disruption - Student Withdraw ---');
        const students = (await axios.get(`${API}/students`)).data;
        // Pick a student who is actually scheduled
        const latestV2 = (await axios.get(`${API}/schedule/latest`)).data;
        const scheduledStudentIds = [...new Set(latestV2.interviews.filter(i => i.status === 'SCHEDULED').map(i => i.studentId._id || i.studentId))];
        
        if (scheduledStudentIds.length > 0) {
            const studentToWithdraw = scheduledStudentIds[0];
            
            const replan3 = await axios.post(`${API}/schedule/replan/${latestV2.version._id}`, {
                type: 'STUDENT_WITHDRAW',
                targetId: studentToWithdraw
            });
            assert(replan3.status === 200, 'Student withdraw replan returns 200');
            assert(replan3.data.disruptionDetails.type === 'STUDENT_WITHDRAW', 'Student withdraw type recorded');

            const diff3 = (await axios.get(`${API}/diff/${replan3.data._id}`)).data;
            console.log(`   Cancelled: ${diff3.summary.cancelled}, Stakeholders: ${diff3.summary.affectedStakeholders.length}`);
            
            // Verify the withdrawn student has no SCHEDULED interviews
            const postWithdraw = (await axios.get(`${API}/schedule/${replan3.data._id}`)).data;
            const studentStillScheduled = postWithdraw.filter(i => 
                (i.studentId._id || i.studentId).toString() === studentToWithdraw.toString() && i.status === 'SCHEDULED'
            );
            assert(studentStillScheduled.length === 0, `Withdrawn student has 0 scheduled interviews (got ${studentStillScheduled.length})`);
        } else {
            assert(false, 'Student withdraw test', 'No scheduled students found');
        }

        // ====== TEST 8: ROOM UNAVAILABLE Replan ======
        console.log('\n--- Test 8: Disruption - Room Unavailable ---');
        const latestV3 = (await axios.get(`${API}/schedule/latest`)).data;
        const usedRoomIds = [...new Set(latestV3.interviews.filter(i => i.status === 'SCHEDULED' && i.roomId).map(i => i.roomId._id || i.roomId))];
        
        if (usedRoomIds.length > 0) {
            const roomToDisable = usedRoomIds[0];
            
            const replan4 = await axios.post(`${API}/schedule/replan/${latestV3.version._id}`, {
                type: 'ROOM_UNAVAILABLE',
                targetId: roomToDisable
            });
            assert(replan4.status === 200, 'Room unavailable replan returns 200');
            assert(replan4.data.disruptionDetails.type === 'ROOM_UNAVAILABLE', 'Room unavailable type recorded');

            const diff4 = (await axios.get(`${API}/diff/${replan4.data._id}`)).data;
            console.log(`   Moved: ${diff4.summary.moved}, Cancelled: ${diff4.summary.cancelled}, Stakeholders: ${diff4.summary.affectedStakeholders.length}`);
        } else {
            assert(false, 'Room unavailable test', 'No rooms in use found');
        }

        // ====== TEST 9: Version Chain (ScheduleVersion linkage) ======
        console.log('\n--- Test 9: Version Chain ---');
        const finalLatest = (await axios.get(`${API}/schedule/latest`)).data;
        assert(finalLatest.version.parentVersionId !== null, 'Latest version has a parent (chain exists)');

    } catch (err) {
        assert(false, 'Test execution error', err.response ? err.response.data.error : err.message);
    }

    // ====== SUMMARY ======
    console.log('\n\n========================================');
    console.log('         TEST RESULTS SUMMARY');
    console.log('========================================');
    for (const r of results) {
        console.log(r);
    }
    console.log('========================================');
    console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
    console.log('========================================');

    process.exit(failed > 0 ? 1 : 0);
}

runTests();
