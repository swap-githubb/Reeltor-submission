
//to create a hashed password for the admin user, run this file using "node HashedPasswordCreationForAdmin.js" in the terminal
//and then manually create the existence of admin user in the database

const bcrypt = require('bcryptjs');

const password = 'admin123'; // Replace with your desired admin password
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) throw err;
    console.log('Hashed Password:', hash);
});