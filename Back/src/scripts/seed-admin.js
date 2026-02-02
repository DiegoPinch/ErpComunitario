require('dotenv').config();
const usersModel = require('../models/usersModel');
const systemUsersModel = require('../models/systemUsersModel');
const db = require('../config/db');

async function seedAdmin() {
    try {
        console.log('🚀 Iniciando creación de administrador inicial...');

        // 1. Crear el usuario en la tabla 'users'
        // Usamos datos genéricos para el admin del sistema
        const adminUser = {
            national_id: '0000000000',
            first_name: 'Administrador',
            last_name: 'Sistema',
            address: 'Oficina Central',
            phone: '0999999999',
            email: 'admin@erpagua.com',
            status: true
        };

        let userId;
        try {
            userId = await usersModel.createUser(adminUser);
            console.log(`✅ Usuario 'Administrador' creado con ID: ${userId}`);
        } catch (err) {
            if (err.message.includes('already registered')) {
                console.log('ℹ️ El usuario administrador ya existe en la tabla users.');
                // Intentar obtener el ID si ya existe
                const [rows] = await db.query('SELECT user_id FROM users WHERE national_id = ?', ['0000000000']);
                userId = rows[0].user_id;
            } else {
                throw err;
            }
        }

        // 2. Crear la cuenta de sistema en 'system_users'
        const systemAdmin = {
            user_id: userId,
            username: 'admin',
            password: 'Pinchita411@', // El modelo systemUsersModel se encargará de encriptarla
            role: 'admin'
        };

        try {
            await systemUsersModel.createSystemUser(systemAdmin);
            console.log('✅ Cuenta de sistema creada correctamente.');
            console.log('-------------------------------------------');
            console.log('USUARIO: admin');
            console.log('CLAVE: admin123');
            console.log('-------------------------------------------');
        } catch (err) {
            if (err.message.includes('ya existe')) {
                console.log('ℹ️ La cuenta de sistema "admin" ya existe.');
            } else {
                throw err;
            }
        }

        console.log('✨ Proceso completado. Ya puedes iniciar sesión.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error durante el seeding:', err);
        process.exit(1);
    }
}

seedAdmin();
