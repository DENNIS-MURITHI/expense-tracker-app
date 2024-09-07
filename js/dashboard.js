document.addEventListener('DOMContentLoaded', async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        window.location.href = 'login.html'; // Redirect to login if not logged in
        return;
    }

    const logoutButton = document.getElementById('logout');
    const addExpenseForm = document.getElementById('add-expense-form');
    const updateExpenseForm = document.getElementById('update-expense-form');
    const expensesList = document.getElementById('expenses-list');
    const expensesChart = document.getElementById('expenses-chart').getContext('2d');

    const fetchExpenses = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/expenses/${userId}`);
            const expenses = await response.json();
            return expenses;
        } catch (error) {
            alert('Failed to fetch expenses');
        }
    };

    const renderExpenses = async () => {
        const expenses = await fetchExpenses();
        expensesList.innerHTML = '';
        expenses.forEach(expense => {
            const expenseItem = document.createElement('div');
            expenseItem.className = 'expense-item';
            expenseItem.innerHTML = `
                <span>${expense.date}</span>
                <span>${expense.category}</span>
                <span>${expense.amount}</span>
                <button class="update-btn" data-id="${expense.id}" data-date="${expense.date}" data-category="${expense.category}" data-amount="${expense.amount}">Update</button>
                <button class="delete-btn" data-id="${expense.id}">Delete</button>
            `;
            expensesList.appendChild(expenseItem);
        });
        renderChart(expenses);
    };

    const renderChart = (expenses) => {
        const categories = [...new Set(expenses.map(exp => exp.category))];
        const data = categories.map(cat => {
            return expenses.filter(exp => exp.category === cat)
                .reduce((total, exp) => total + exp.amount, 0);
        });

        new Chart(expensesChart, {
            type: 'bar',
            data: {
                labels: categories,
                datasets: [{
                    label: 'Expenses by Category',
                    data: data,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    };

    addExpenseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const date = document.getElementById('date').value;
        const category = document.getElementById('category').value;
        const amount = document.getElementById('amount').value;

        try {
            const response = await fetch('http://localhost:3000/api/expenses/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, date, category, amount }),
            });

            if (response.ok) {
                alert('Expense added successfully');
                renderExpenses(); // Refresh expense list
            } else {
                const { error } = await response.json();
                alert(`Failed to add expense: ${error}`);
            }
        } catch (error) {
            alert(`Failed to add expense: ${error.message}`);
        }
    });

    expensesList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const expenseId = e.target.getAttribute('data-id');
            try {
                const response = await fetch(`http://localhost:3000/api/expenses/${expenseId}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    alert('Expense deleted successfully');
                    renderExpenses(); // Refresh expense list
                } else {
                    const { error } = await response.json();
                    alert(`Failed to delete expense: ${error}`);
                }
            } catch (error) {
                alert(`Failed to delete expense: ${error.message}`);
            }
        }

        if (e.target.classList.contains('update-btn')) {
            const expenseId = e.target.getAttribute('data-id');
            const date = e.target.getAttribute('data-date');
            const category = e.target.getAttribute('data-category');
            const amount = e.target.getAttribute('data-amount');

            document.getElementById('expense-id').value = expenseId;
            document.getElementById('update-date').value = date;
            document.getElementById('update-category').value = category;
            document.getElementById('update-amount').value = amount;

            updateExpenseForm.style.display = 'block'; // Show update form
        }
    });

    updateExpenseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('expense-id').value;
        const date = document.getElementById('update-date').value;
        const category = document.getElementById('update-category').value;
        const amount = document.getElementById('update-amount').value;

        try {
            const response = await fetch(`http://localhost:3000/api/expenses/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date, category, amount }),
            });

            if (response.ok) {
                alert('Expense updated successfully');
                updateExpenseForm.style.display = 'none'; // Hide update form
                renderExpenses(); // Refresh expense list
            } else {
                const { error } = await response.json();
                alert(`Failed to update expense: ${error}`);
            }
        } catch (error) {
            alert(`Failed to update expense: ${error.message}`);
        }
    });

    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('userId');
        window.location.href = 'login.html'; // Redirect to login
    });

    renderExpenses(); // Initial render of expenses
});
