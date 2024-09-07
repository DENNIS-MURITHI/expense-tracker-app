const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database connection
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

// Create database and tables if not exist
const createDatabaseAndTables = () => {
    // Create the database if it doesn't exist
    connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`, (err) => {
        if (err) {
            console.error('Error creating database:', err.message);
            return;
        }

        // Use the created database
        connection.changeUser({ database: process.env.DB_NAME }, (err) => {
            if (err) {
                console.error('Error switching to database:', err.message);
                return;
            }

            // Users table
            const usersTable = `CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL
            )`;

            connection.query(usersTable, (err) => {
                if (err) {
                    console.error('Error creating users table:', err.message);
                    return;
                }

                // Expenses table
                const expensesTable = `CREATE TABLE IF NOT EXISTS expenses (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT,
                    date DATE,
                    category VARCHAR(255),
                    amount DECIMAL(10, 2),
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )`;

                connection.query(expensesTable, (err) => {
                    if (err) {
                        console.error('Error creating expenses table:', err.message);
                        return;
                    }
                    console.log('Database and tables created');
                });
            });
        });
    });
};

createDatabaseAndTables();

// Routes
app.post('/api/users/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        connection.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err) => {
            if (err) {
                console.error('Error inserting user:', err.message);
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ message: 'User registered successfully' });
        });
    } catch (error) {
        console.error('Error hashing password:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/users/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    connection.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) {
            console.error('Error querying user:', err.message);
            return res.status(500).json({ error: err.message });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = results[0];

        bcrypt.compare(password, user.password, (err, result) => {
            if (err) {
                console.error('Error comparing password:', err.message);
                return res.status(500).json({ error: 'Server error' });
            }

            if (result) {
                res.status(200).json({ userId: user.id });
            } else {
                res.status(401).json({ error: 'Invalid credentials' });
            }
        });
    });
});

app.post('/api/expenses/add', (req, res) => {
    const { userId, date, category, amount } = req.body;
    if (!userId || !date || !category || !amount) {
        return res.status(400).json({ error: 'User ID, date, category, and amount are required' });
    }

    connection.query('INSERT INTO expenses (user_id, date, category, amount) VALUES (?, ?, ?, ?)', [userId, date, category, amount], (err) => {
        if (err) {
            console.error('Error adding expense:', err.message);
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Expense added successfully' });
    });
});

// Update expense route
app.put('/api/expenses/:id', (req, res) => {
    const { id } = req.params;
    const { date, category, amount } = req.body;

    if (!date || !category || !amount) {
        return res.status(400).json({ error: 'Date, category, and amount are required' });
    }

    connection.query(
        'UPDATE expenses SET date = ?, category = ?, amount = ? WHERE id = ?',
        [date, category, amount, id],
        (err, result) => {
            if (err) {
                console.error('Error updating expense:', err.message);
                return res.status(500).json({ error: 'Failed to update expense' });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Expense not found' });
            }

            res.status(200).json({ message: 'Expense updated successfully' });
        }
    );
});

// Delete expense route
app.delete('/api/expenses/:id', (req, res) => {
    const { id } = req.params;

    connection.query('DELETE FROM expenses WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error('Error deleting expense:', err.message);
            return res.status(500).json({ error: 'Failed to delete expense' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        res.status(200).json({ message: 'Expense deleted successfully' });
    });
});

app.get('/api/expenses/:userId', (req, res) => {
    const { userId } = req.params;
    connection.query('SELECT * FROM expenses WHERE user_id = ?', [userId], (err, results) => {
        if (err) {
            console.error('Error fetching expenses:', err.message);
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(results);
    });
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running at http://localhost:${process.env.PORT || 3000}`);
});
