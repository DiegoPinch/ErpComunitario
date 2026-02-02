# mi-backend

Estructura de proyecto backend con Node.js y Express.

## Estructura

```
mi-backend/
│── node_modules/
│── src/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   └── userController.js
│   ├── models/
│   │   └── userModel.js
│   ├── routes/
│   │   └── userRoutes.js
│   ├── middlewares/
│   │   └── authMiddleware.js
│   ├── services/
│   ├── utils/
│   │   └── logger.js
│   ├── app.js
│   └── index.js
│
├── .env
├── .gitignore
├── package.json
└── README.md
```

## Instalación

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Crea un archivo `.env` (o copia `.env.example`) y configura las variables de conexión a la base de datos. Asegúrate de usar `DB_NAME=water_system` o ajusta a tu preferencia.
3. Ejecuta el servidor:
   ```bash
   node src/index.js
   ```

## Endpoints
Lista de endpoints principales (solo en inglés):
- `/api/users` - Users
- `/api/meters` - Meters
- `/api/meter-history` - Meter history
- `/api/readings` - Readings
- `/api/rates` - Rates
- `/api/invoices` - Invoices
- `/api/additional-concepts` - Additional concepts
- `/api/invoice-concepts` - Invoice concepts
- `/api/payments` - Payments
- `/api/meetings` - Meetings
- `/api/attendance` - Attendance
- `/api/board-members` - Board members
- `/api/system-users` - System users

## Personalización
Agrega tus rutas, modelos y controladores en las carpetas correspondientes.