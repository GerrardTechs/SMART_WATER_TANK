// Pastikan sudah install cors: npm install cors
const express = require('express');
const cors = require('cors');

const app = express();

// Izinkan semua origin (untuk development)
app.use(cors());

// Jika ingin spesifik origin:
app.use(cors({
    origin: 'http://localhost:8080', // ganti sesuai frontend mu
    methods: ['GET','POST','PUT','DELETE'],
    credentials: true
}));

app.use(express.json());

// contoh route
app.post('/api/auth/login', (req, res) => {
    res.json({message: 'Login route works!'});
});

app.listen(5000, () => console.log('Server running on port 5000'));
