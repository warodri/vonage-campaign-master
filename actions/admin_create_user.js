/**
 * VCR provides an REDIS instance we can use as database.
 * 
 * This function will create the first user 
 * if the database is empty.
 * 
 * Body to send: 
 * {
 *      "email": string,
 *      "password": string,
 *      "name": string,
 * }
 */
const { v4: uuidv4 } = require('uuid');
const userStore = require('../common/user_store')
const Config = require('../config')

async function action(req, res, globalState) {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            console.log('Invalid input', req.body);
            returnInvalidInput(res);
            return;
        }

        if (!initialized) {
            // First user setup - set flag immediately to prevent race
            await globalState.set('system:initialized', 'true');
    
            // Create the first admin user
            await userStore.saveUser(globalState, {
                id: uuidv4(),
                email,
                name,
                password,
                isAdmin: true
            });
            return res.status(200).json({ message: 'First user created' });
        }
    
        // System already initialized - require admin auth
        const passportUser = req.user;
        if (!passportUser || passportUser.email !== Config.ADMIN) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }
    
        await userStore.saveUser(globalState, { id: uuidv4(), email, name, password });
        return res.status(200).json({ message: 'User created' });

    } catch (ex) {
        console.log(ex)
        return res.status(500).json({
            message: 'Unexpected error'
        })
    }
}

function returnInvalidInput(res) {
    res.status(400).json({
        message: `Invalid input. Expected 
        {
            "email": string,
            "password": string,
            "name": string,
        }
        `
    })
}

module.exports = { action };