const mongoose = require('mongoose');
const Company = require('../models/Company');
const Panel = require('../models/Panel');
const Student = require('../models/Student');
const Room = require('../models/Room');
const ScheduleVersion = require('../models/ScheduleVersion');
const Interview = require('../models/Interview');

const BRANCHES = ["CSE", "ECE", "MECH", "CIVIL"];
const NAMES = ["Amit", "Neha", "Rahul", "Priya", "Vikram", "Sneha", "Karan", "Pooja", "Arjun", "Riya",
         "Siddharth", "Aisha", "Varun", "Kavya", "Aditya", "Ananya", "Rohan", "Nisha", "Manish", "Divya"];
const LAST_NAMES = ["Sharma", "Verma", "Singh", "Kumar", "Gupta", "Yadav", "Patel", "Reddy", "Nair", "Das"];

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomWeightedChoice(items, weights) {
    let i;
    let sum = weights.reduce((a, b) => a + b, 0);
    let rand = Math.random() * sum;
    for (i = 0; i < items.length; i++) {
        if (rand < weights[i]) return items[i];
        rand -= weights[i];
    }
    return items[items.length - 1];
}

// Normal distribution approximation
function randomGauss(mean, stdev) {
    let u = 1 - Math.random(); // Converting [0,1) to (0,1]
    let v = Math.random();
    let z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    return z * stdev + mean;
}

const generateData = async () => {
    console.log("Clearing existing data...");
    await Interview.deleteMany({});
    await ScheduleVersion.deleteMany({});
    await Student.deleteMany({});
    await Panel.deleteMany({});
    await Company.deleteMany({});
    await Room.deleteMany({});

    console.log("Generating Rooms...");
    const rooms = [];
    for (let i = 1; i <= 20; i++) {
        rooms.push({ name: `Room ${i}` });
    }
    await Room.insertMany(rooms);

    console.log("Generating Students...");
    const students = [];
    for (let i = 0; i < 800; i++) {
        let name = `${randomChoice(NAMES)} ${randomChoice(LAST_NAMES)}`;
        let branch = randomWeightedChoice(BRANCHES, [40, 30, 15, 15]);
        let cgpa = Math.max(5.0, Math.min(10.0, randomGauss(7.5, 1.2)));
        cgpa = Math.round(cgpa * 100) / 100;

        students.push(new Student({
            name, branch, cgpa, shortlistedCompanyIds: []
        }));
    }
    await Student.insertMany(students);
    const savedStudents = await Student.find({});

    console.log("Generating Companies and Panels...");
    const companies = [];
    for (let i = 1; i <= 35; i++) {
        let day = i <= 10 ? 1 : i <= 20 ? 2 : i <= 28 ? 3 : 4;
        let tier = i <= 8 ? 1 : i <= 20 ? 2 : 3;
        let durationMins = randomChoice([30, 45, 60]);
        let numPanels = tier === 1 ? Math.floor(Math.random() * 5) + 2 : Math.floor(Math.random() * 3) + 1; // 2-6 or 1-3
        let cgpaCutoff = tier === 1 ? randomChoice([7.0, 7.5, 8.0, 8.5]) : randomChoice([6.0, 6.5, 7.0]);
        
        let c = new Company({
            name: `Company ${i}`,
            day,
            startTime: "09:00",
            endTime: "17:00",
            cgpaCutoff,
            durationMins,
            priorityTier: tier
        });
        await c.save();
        companies.push(c);

        let panels = [];
        for (let pIdx = 0; pIdx < numPanels; pIdx++) {
            panels.push({ companyId: c._id, name: `Panel ${pIdx + 1}` });
        }
        await Panel.insertMany(panels);
    }

    console.log("Generating Shortlists...");
    for (let c of companies) {
        let eligible = savedStudents.filter(s => s.cgpa >= c.cgpaCutoff);
        let shortlistRatio = c.priorityTier === 1 ? (Math.random() * 0.2 + 0.6) : (Math.random() * 0.2 + 0.3);
        let numToShortlist = Math.floor(eligible.length * shortlistRatio);

        if (numToShortlist > 0 && eligible.length > 0) {
            let weights = eligible.map(s => Math.pow(s.cgpa, 2)); // square CGPA for stronger bias
            let selectedIds = new Set();
            while (selectedIds.size < numToShortlist) {
                let chosen = randomWeightedChoice(eligible, weights);
                selectedIds.add(chosen._id.toString());
            }

            // Update students in bulk
            await Student.updateMany(
                { _id: { $in: Array.from(selectedIds) } },
                { $push: { shortlistedCompanyIds: c._id } }
            );
        }
    }

    console.log("Data Generation Complete.");
};

module.exports = generateData;
