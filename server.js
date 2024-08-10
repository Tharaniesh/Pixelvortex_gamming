const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MySQL connection setup
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('MySQL connected...');
});

// Endpoint to handle team registration
app.post('/api/registerTeam', (req, res) => {
    const teamData = req.body;

    // Insert team details into team_details table
    const sql = `
        INSERT INTO team_details (team_name, leader_name, leader_email, leader_mobile, leader_player_id, leader_in_game_name, leader_id_level, player1_id, player1_name, player1_level, player2_id, player2_name, player2_level, player3_id, player3_name, player3_level, player4_id, player4_name, player4_level, sub1_id, sub1_name, sub2_id, sub2_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        teamData.teamName, teamData.leaderName, teamData.leaderEmail, teamData.leaderMobile,
        teamData.players[0].id, teamData.players[0].inGameName, teamData.players[0].level,
        teamData.players[1].id, teamData.players[1].inGameName, teamData.players[1].level,
        teamData.players[2].id, teamData.players[2].inGameName, teamData.players[2].level,
        teamData.players[3].id, teamData.players[3].inGameName, teamData.players[3].level,
        teamData.substitutes[0]?.id || null, teamData.substitutes[0]?.inGameName || null,
        teamData.substitutes[1]?.id || null, teamData.substitutes[1]?.inGameName || null
    ];

    db.query(sql, values, (err, result) => {
        if (err) throw err;

        const teamId = result.insertId;

        // Allocate room and slot
        const roomSql = `
            INSERT INTO room_details (team_id, room_number, slot_number)
            SELECT ?, FLOOR(COUNT(*) / 25) + 1 AS room_number, (COUNT(*) % 25) + 1 AS slot_number
            FROM room_details
        `;
        db.query(roomSql, [teamId], (err, result) => {
            if (err) throw err;

            const roomNumber = Math.floor((result.insertId - 1) / 25) + 1; // Calculate room number
            const slotNumber = (result.insertId - 1) % 25 + 1; // Calculate slot number

            // Sending Email to the leader
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: teamData.leaderEmail,
                subject: 'Team Registration Successful',
                text: `Your team has been registered successfully! Room: ${roomNumber}, Slot: ${slotNumber}`
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });

            // Send the response back to the client
            res.json({ message: 'Team registered successfully!', room: roomNumber, slot: slotNumber });
        });
    });
});

// Endpoint to authenticate admin login
app.post('/api/admin/login', async (req, res) => {
    const { leaderName, leaderPassword } = req.body;

    const sql = 'SELECT * FROM admins WHERE username = ?';
    db.query(sql, [leaderName], async (err, results) => {
        if (err || results.length === 0) {
            return res.status(400).send('Admin not found.');
        }

        const admin = results[0];
        const match = await bcrypt.compare(leaderPassword, admin.password);
        if (!match) return res.status(400).send('Invalid password.');

        res.send('Login successful!');
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
