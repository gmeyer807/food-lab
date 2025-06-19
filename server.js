const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8080;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Simple file-based storage
const DATA_FILE = 'data.json';

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ users: {} }));
}

// Helper functions
function readData() {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Routes
app.get('/api/users', (req, res) => {
    const data = readData();
    const userList = Object.keys(data.users).map(userId => ({
        id: userId,
        name: data.users[userId].name || userId
    }));
    res.json(userList);
});

app.post('/api/users', (req, res) => {
    const data = readData();
    const { name } = req.body;
    const userId = name.toLowerCase().replace(/\s+/g, '_');
    
    if (!data.users[userId]) {
        data.users[userId] = { 
            name: name,
            recipes: [] 
        };
        writeData(data);
        res.json({ success: true, userId: userId });
    } else {
        res.json({ success: false, error: 'User already exists' });
    }
});

app.get('/api/users/:userId/recipes', (req, res) => {
    const data = readData();
    const userId = req.params.userId;
    const userRecipes = data.users[userId]?.recipes || [];
    res.json(userRecipes);
});

app.post('/api/users/:userId/recipes', (req, res) => {
    const data = readData();
    const userId = req.params.userId;
    const { recipe } = req.body;
    
    if (!data.users[userId]) {
        data.users[userId] = { recipes: [] };
    }
    
    if (!data.users[userId].recipes.includes(recipe)) {
        data.users[userId].recipes.push(recipe);
        writeData(data);
    }
    
    res.json({ success: true });
});

app.delete('/api/users/:userId/recipes/:recipe', (req, res) => {
    const data = readData();
    const userId = req.params.userId;
    const recipe = decodeURIComponent(req.params.recipe);
    
    if (data.users[userId]?.recipes) {
        data.users[userId].recipes = data.users[userId].recipes.filter(r => r !== recipe);
        writeData(data);
    }
    
    res.json({ success: true });
});

app.get('/api/users/:userId/menu', (req, res) => {
    const data = readData();
    const userId = req.params.userId;
    const userRecipes = data.users[userId]?.recipes || [];
    
    if (userRecipes.length === 0) {
        return res.json({ error: 'No recipes available' });
    }
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const menu = {};
    
    days.forEach(day => {
        const randomRecipe = userRecipes[Math.floor(Math.random() * userRecipes.length)];
        menu[day] = randomRecipe;
    });
    
    res.json(menu);
});

// Create public directory and index.html
const publicDir = 'public';
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
}

const indexHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Weekly Menu Generator</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 15px;
            background-color: #f5f5f5;
            -webkit-user-select: none;
            user-select: none;
        }
        .container {
            background: white;
            padding: 20px;
            border-radius: 15px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            max-width: 100%;
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 25px;
            font-size: 24px;
        }
        .welcome-screen {
            text-align: center;
            max-width: 400px;
            margin: 0 auto;
        }
        .welcome-screen h2 {
            color: #555;
            margin-bottom: 25px;
            font-size: 20px;
        }
        .user-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 25px;
        }
        .user-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 12px;
            cursor: pointer;
            border: none;
            font-size: 16px;
            font-weight: 600;
            transition: transform 0.2s;
            text-align: center;
            min-height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .user-card:hover {
            transform: translateY(-2px);
        }
        .user-card:active {
            transform: scale(0.98);
        }
        .add-user-btn {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            padding: 20px;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            min-height: 60px;
        }
        .add-user-btn:hover {
            transform: translateY(-2px);
        }
        .add-user-btn:active {
            transform: scale(0.98);
        }
        .add-user-form {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 12px;
            margin-top: 20px;
        }
        .add-user-form input {
            width: 100%;
            padding: 15px;
            border: 2px solid #ddd;
            border-radius: 10px;
            font-size: 16px;
            margin-bottom: 15px;
            box-sizing: border-box;
        }
        .add-user-form input:focus {
            outline: none;
            border-color: #007bff;
        }
        .form-buttons {
            display: flex;
            gap: 10px;
        }
        .form-buttons button {
            flex: 1;
            padding: 15px;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
        }
        .save-btn {
            background-color: #007bff;
            color: white;
        }
        .save-btn:active {
            background-color: #0056b3;
        }
        .cancel-btn {
            background-color: #6c757d;
            color: white;
        }
        .cancel-btn:active {
            background-color: #545b62;
        }
        .user-section {
            margin-bottom: 25px;
            text-align: center;
        }
        .section {
            margin-bottom: 25px;
        }
        .section h2 {
            color: #555;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 8px;
            font-size: 18px;
        }
        .input-group {
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
        }
        input[type="text"] {
            flex: 1;
            padding: 15px;
            border: 2px solid #ddd;
            border-radius: 10px;
            font-size: 16px;
            -webkit-appearance: none;
            appearance: none;
        }
        input[type="text"]:focus {
            outline: none;
            border-color: #007bff;
        }
        button {
            padding: 15px 20px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
            min-height: 50px;
        }
        button:active {
            background-color: #0056b3;
            transform: scale(0.98);
        }
        .generate-btn {
            background-color: #28a745;
            font-size: 18px;
            padding: 20px 40px;
            display: block;
            margin: 25px auto;
            width: 100%;
            max-width: 300px;
            min-height: 60px;
        }
        .generate-btn:active {
            background-color: #1e7e34;
        }
        .back-btn {
            background-color: #6c757d;
            margin-bottom: 20px;
        }
        .back-btn:active {
            background-color: #545b62;
        }
        .recipe-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-top: 15px;
        }
        .recipe-item {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 16px;
        }
        .delete-btn {
            background-color: #dc3545;
            padding: 10px 15px;
            font-size: 14px;
            min-height: 40px;
        }
        .delete-btn:active {
            background-color: #c82333;
        }
        .menu-grid {
            display: flex;
            flex-direction: column;
            gap: 15px;
            margin-top: 20px;
        }
        .day-menu {
            background-color: #e9ecef;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
        }
        .day-menu h3 {
            margin: 0 0 12px 0;
            color: #495057;
            font-size: 18px;
        }
        .meal {
            background-color: white;
            padding: 15px;
            margin: 8px 0;
            border-radius: 8px;
            font-weight: 600;
            color: #333;
            font-size: 16px;
        }
        .hidden {
            display: none;
        }
        .current-user-info {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
            text-align: center;
        }
        .current-user-info h3 {
            margin: 0 0 10px 0;
            color: #1976d2;
        }
        
        @media (max-width: 480px) {
            body {
                padding: 10px;
            }
            .container {
                padding: 15px;
                border-radius: 12px;
            }
            h1 {
                font-size: 22px;
            }
            .input-group {
                flex-direction: column;
                gap: 12px;
            }
            button {
                width: 100%;
            }
            .user-grid {
                grid-template-columns: 1fr;
            }
            .form-buttons {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🍽️ Weekly Menu Generator</h1>
        
        <!-- Welcome/User Selection Screen -->
        <div id="welcomeScreen" class="welcome-screen">
            <h2>Welcome! Please select or create your profile:</h2>
            <div id="userGrid" class="user-grid">
                <!-- Users will be loaded here -->
            </div>
            
            <div id="addUserForm" class="add-user-form hidden">
                <input type="text" id="newUserName" placeholder="Enter your name..." maxlength="30">
                <div class="form-buttons">
                    <button class="save-btn" onclick="saveNewUser()">Save User</button>
                    <button class="cancel-btn" onclick="cancelAddUser()">Cancel</button>
                </div>
            </div>
        </div>

        <!-- Main App -->
        <div id="mainApp" class="hidden">
            <div class="current-user-info">
                <h3>👋 Welcome, <span id="currentUserName"></span>!</h3>
                <button class="back-btn" onclick="backToUserSelection()">← Back to User Selection</button>
            </div>

            <div class="section">
                <h2>Add Recipes</h2>
                <div class="input-group">
                    <input type="text" id="recipeInput" placeholder="Enter recipe name..." maxlength="50">
                    <button onclick="addRecipe()">Add Recipe</button>
                </div>
                <div id="recipeList" class="recipe-list"></div>
            </div>

            <div class="section">
                <button class="generate-btn" onclick="generateMenu()">🎲 Generate Weekly Menu</button>
            </div>

            <div class="section">
                <h2>This Week's Menu</h2>
                <div id="weeklyMenu" class="menu-grid"></div>
            </div>
        </div>
    </div>

    <script>
        let currentUserId = null;
        let currentUserName = null;

        // Initialize app
        document.addEventListener('DOMContentLoaded', function() {
            loadUsers();
        });

        async function loadUsers() {
            try {
                const response = await fetch('/api/users');
                const users = await response.json();
                displayUsers(users);
            } catch (error) {
                console.error('Error loading users:', error);
                displayUsers([]);
            }
        }

        function displayUsers(users) {
            const userGrid = document.getElementById('userGrid');
            userGrid.innerHTML = '';
            
            // Add existing users
            users.forEach(user => {
                const userCard = document.createElement('button');
                userCard.className = 'user-card';
                userCard.textContent = user.name;
                userCard.onclick = () => selectUser(user.id, user.name);
                userGrid.appendChild(userCard);
            });
            
            // Add "Add User" button
            const addUserBtn = document.createElement('button');
            addUserBtn.className = 'add-user-btn';
            addUserBtn.innerHTML = '+ Add User';
            addUserBtn.onclick = showAddUserForm;
            userGrid.appendChild(addUserBtn);
        }

        function showAddUserForm() {
            document.getElementById('addUserForm').classList.remove('hidden');
            document.getElementById('newUserName').focus();
        }

        function cancelAddUser() {
            document.getElementById('addUserForm').classList.add('hidden');
            document.getElementById('newUserName').value = '';
        }

        async function saveNewUser() {
            const nameInput = document.getElementById('newUserName');
            const name = nameInput.value.trim();
            
            if (!name) {
                alert('Please enter a name');
                return;
            }
            
            try {
                const response = await fetch('/api/users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name: name }),
                });
                
                const result = await response.json();
                
                if (result.success) {
                    cancelAddUser();
                    await loadUsers();
                    // Automatically select the new user
                    selectUser(result.userId, name);
                } else {
                    alert(result.error || 'Error creating user');
                }
            } catch (error) {
                console.error('Error creating user:', error);
                alert('Error creating user');
            }
        }

        function selectUser(userId, userName) {
            currentUserId = userId;
            currentUserName = userName;
            document.getElementById('currentUserName').textContent = userName;
            document.getElementById('welcomeScreen').classList.add('hidden');
            document.getElementById('mainApp').classList.remove('hidden');
            loadRecipes();
        }

        function backToUserSelection() {
            currentUserId = null;
            currentUserName = null;
            document.getElementById('welcomeScreen').classList.remove('hidden');
            document.getElementById('mainApp').classList.add('hidden');
            document.getElementById('weeklyMenu').innerHTML = '';
        }

        async function loadRecipes() {
            if (!currentUserId) return;
            
            try {
                const response = await fetch('/api/users/' + currentUserId + '/recipes');
                const recipes = await response.json();
                displayRecipes(recipes);
            } catch (error) {
                console.error('Error loading recipes:', error);
            }
        }

        async function addRecipe() {
            if (!currentUserId) return;
            
            const input = document.getElementById('recipeInput');
            const recipeName = input.value.trim();
            
            if (recipeName) {
                try {
                    await fetch('/api/users/' + currentUserId + '/recipes', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ recipe: recipeName }),
                    });
                    
                    input.value = '';
                    await loadRecipes();
                } catch (error) {
                    console.error('Error adding recipe:', error);
                }
            }
        }

        async function deleteRecipe(recipeName) {
            if (!currentUserId) return;
            
            try {
                await fetch('/api/users/' + currentUserId + '/recipes/' + encodeURIComponent(recipeName), {
                    method: 'DELETE',
                });
                
                await loadRecipes();
            } catch (error) {
                console.error('Error deleting recipe:', error);
            }
        }

        function displayRecipes(recipes) {
            const recipeList = document.getElementById('recipeList');
            recipeList.innerHTML = '';
            
            recipes.forEach(recipe => {
                const recipeDiv = document.createElement('div');
                recipeDiv.className = 'recipe-item';
                recipeDiv.innerHTML = '<span>' + recipe + '</span><button class="delete-btn" onclick="deleteRecipe(\\'' + recipe + '\\')">Delete</button>';
                recipeList.appendChild(recipeDiv);
            });
        }

        async function generateMenu() {
            if (!currentUserId) return;
            
            try {
                const response = await fetch('/api/users/' + currentUserId + '/menu');
                const menu = await response.json();
                
                if (menu.error) {
                    alert('Please add some recipes first!');
                    return;
                }
                
                const menuContainer = document.getElementById('weeklyMenu');
                menuContainer.innerHTML = '';

                Object.entries(menu).forEach(([day, recipe]) => {
                    const dayDiv = document.createElement('div');
                    dayDiv.className = 'day-menu';
                    dayDiv.innerHTML = '<h3>' + day + '</h3><div class="meal">' + recipe + '</div>';
                    menuContainer.appendChild(dayDiv);
                });
            } catch (error) {
                console.error('Error generating menu:', error);
            }
        }

        // Allow Enter key functionality
        document.getElementById('newUserName').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') saveNewUser();
        });
        
        document.addEventListener('keypress', function(e) {
            const recipeInput = document.getElementById('recipeInput');
            if (e.target === recipeInput && e.key === 'Enter') {
                addRecipe();
            }
        });
    </script>
</body>
</html>`;

fs.writeFileSync(path.join(publicDir, 'index.html'), indexHTML);

app.listen(PORT, '0.0.0.0', () => {
    console.log('Menu Generator Server running on http://localhost:' + PORT);
    console.log('Access from other devices at http://[YOUR_SERVER_IP]:' + PORT);
});

module.exports = app;