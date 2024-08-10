// Handle form submission and slot allocation
document.getElementById('registrationForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    // Retrieve form data
    const teamName = document.getElementById('teamName').value;
    const leaderName = document.getElementById('leaderName').value;
    const leaderEmail = document.getElementById('leaderEmail').value;
    
    // Add more code here to retrieve player details

    // Slot allocation logic
    const slot = allocateSlot();

    // Store or send the data as needed
    saveTeamData(teamName, leaderName, leaderEmail, slot);

    // Notify the team leader via email
    sendEmail(leaderEmail, slot);

    alert('Team registered successfully!');
});

function allocateSlot() {
    // Basic slot allocation logic
    const lastAllocatedSlot = localStorage.getItem('lastAllocatedSlot') || 'Room 1 Slot 0';
    let [room, slot] = lastAllocatedSlot.split(' ');
    slot = parseInt(slot) + 1;
    if (slot > 25) {
        room = `Room ${parseInt(room.split(' ')[1]) + 1}`;
        slot = 1;
    }
    const newSlot = `${room} Slot ${slot}`;
    localStorage.setItem('lastAllocatedSlot', newSlot);
    return newSlot;
}

function saveTeamData(teamName, leaderName, leaderEmail, slot) {
    // Save team data (you may want to use a database or API instead)
    const teams = JSON.parse(localStorage.getItem('teams')) || [];
    teams.push({ teamName, leaderName, leaderEmail, slot });
    localStorage.setItem('teams', JSON.stringify(teams));
}

function sendEmail(email, slot) {
    // Dummy function to simulate sending an email
    console.log(`Email sent to ${email} with slot information: ${slot}`);
}

function loadRegisteredTeams() {
    // Load registered teams in the admin dashboard
    const teams = JSON.parse(localStorage.getItem('teams')) || [];
    const teamsTable = document.getElementById('teamsTable');
    teams.forEach(team => {
        const row = `<tr>
                        <td>${team.teamName}</td>
                        <td>${team.slot}</td>
                        <td>${team.leaderName}</td>
                    </tr>`;
        teamsTable.innerHTML += row;
    });
}

// Call loadRegisteredTeams in admin-dashboard.html
if (document.getElementById('teamsTable')) {
    loadRegisteredTeams();
}
