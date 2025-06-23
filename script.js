document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const taskInput = document.getElementById('task-input');
    const projectInput = document.getElementById('project-input');
    const prioritySelect = document.getElementById('priority-select');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskList = document.getElementById('task-list');
    const projectFilter = document.getElementById('project-filter');
    const priorityFilter = document.getElementById('priority-filter');
    const statusFilter = document.getElementById('status-filter');
    const totalTasksElement = document.getElementById('total-tasks');
    const completedTasksElement = document.getElementById('completed-tasks');
    const pendingTasksElement = document.getElementById('pending-tasks');
    const criticalTasksElement = document.getElementById('critical-tasks');
    const themeToggle = document.getElementById('theme-toggle');
    const themeStyle = document.getElementById('theme-style');

    // State
    let tasks = JSON.parse(localStorage.getItem('engineering-tasks')) || [];
    let currentTheme = localStorage.getItem('engineering-theme') || 'default';

    // Initialize
    updateTheme();
    renderTaskList();
    updateStats();
    updateProjectFilterOptions();

    // Event Listeners
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addTask();
    });
    projectInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addTask();
    });
    projectFilter.addEventListener('change', renderTaskList);
    priorityFilter.addEventListener('change', renderTaskList);
    statusFilter.addEventListener('change', renderTaskList);
    themeToggle.addEventListener('click', toggleTheme);

    // Functions
    function addTask() {
        const taskText = taskInput.value.trim();
        const projectText = projectInput.value.trim();
        const priority = prioritySelect.value;
        
        if (taskText === '') {
            alert('Please enter a task description');
            return;
        }
        
        const newTask = {
            id: Date.now(),
            text: taskText,
            project: projectText || 'Uncategorized',
            priority: priority,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        tasks.push(newTask);
        saveTasks();
        renderTaskList();
        updateStats();
        updateProjectFilterOptions();
        
        // Clear inputs
        taskInput.value = '';
        projectInput.value = '';
        taskInput.focus();
    }

    function renderTaskList() {
        // Get filter values
        const projectFilterValue = projectFilter.value;
        const priorityFilterValue = priorityFilter.value;
        const statusFilterValue = statusFilter.value;
        
        // Filter tasks
        let filteredTasks = tasks.filter(task => {
            const projectMatch = projectFilterValue === 'all' || task.project === projectFilterValue;
            const priorityMatch = priorityFilterValue === 'all' || task.priority === priorityFilterValue;
            const statusMatch = statusFilterValue === 'all' || 
                              (statusFilterValue === 'completed' && task.completed) || 
                              (statusFilterValue === 'pending' && !task.completed);
            
            return projectMatch && priorityMatch && statusMatch;
        });
        
        // Sort tasks: critical first, then by completion status (pending first)
        filteredTasks.sort((a, b) => {
            if (a.priority === 'critical' && b.priority !== 'critical') return -1;
            if (b.priority === 'critical' && a.priority !== 'critical') return 1;
            if (a.completed && !b.completed) return 1;
            if (!a.completed && b.completed) return -1;
            return new Date(a.createdAt) - new Date(b.createdAt);
        });
        
        // Render tasks
        taskList.innerHTML = '';
        
        if (filteredTasks.length === 0) {
            taskList.innerHTML = '<li class="no-tasks">No tasks found matching your filters</li>';
            return;
        }
        
        filteredTasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.className = `task-item ${task.priority} ${task.completed ? 'completed' : ''}`;
            taskItem.dataset.id = task.id;
            
            taskItem.innerHTML = `
                <div class="task-content">
                    <div class="task-text">
                        <span class="task-priority ${task.priority}">${task.priority}</span>
                        ${task.text}
                        <div class="task-project">${task.project}</div>
                    </div>
                    <div class="task-actions">
                        <button class="complete-btn" title="Mark as ${task.completed ? 'pending' : 'completed'}">
                            <i class="fas fa-${task.completed ? 'undo' : 'check'}"></i>
                        </button>
                        <button class="edit-btn" title="Edit task">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-btn" title="Delete task">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            
            taskList.appendChild(taskItem);
            
            // Add event listeners to the buttons
            const completeBtn = taskItem.querySelector('.complete-btn');
            const editBtn = taskItem.querySelector('.edit-btn');
            const deleteBtn = taskItem.querySelector('.delete-btn');
            
            completeBtn.addEventListener('click', () => toggleTaskCompletion(task.id));
            editBtn.addEventListener('click', () => editTask(task.id));
            deleteBtn.addEventListener('click', () => deleteTask(task.id));
        });
    }

    function toggleTaskCompletion(taskId) {
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            tasks[taskIndex].completed = !tasks[taskIndex].completed;
            saveTasks();
            renderTaskList();
            updateStats();
        }
    }

    function editTask(taskId) {
        const task = tasks.find(task => task.id === taskId);
        if (!task) return;
        
        const newText = prompt('Edit task description:', task.text);
        if (newText !== null && newText.trim() !== '') {
            task.text = newText.trim();
            
            const newProject = prompt('Edit project:', task.project);
            if (newProject !== null) {
                task.project = newProject.trim() || 'Uncategorized';
            }
            
            const newPriority = prompt('Edit priority (low/medium/high/critical):', task.priority);
            if (newPriority !== null && ['low', 'medium', 'high', 'critical'].includes(newPriority.toLowerCase())) {
                task.priority = newPriority.toLowerCase();
            }
            
            saveTasks();
            renderTaskList();
            updateStats();
            updateProjectFilterOptions();
        }
    }

    function deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            tasks = tasks.filter(task => task.id !== taskId);
            saveTasks();
            renderTaskList();
            updateStats();
            updateProjectFilterOptions();
        }
    }

    function updateStats() {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.completed).length;
        const pendingTasks = totalTasks - completedTasks;
        const criticalTasks = tasks.filter(task => task.priority === 'critical').length;
        
        totalTasksElement.textContent = totalTasks;
        completedTasksElement.textContent = completedTasks;
        pendingTasksElement.textContent = pendingTasks;
        criticalTasksElement.textContent = criticalTasks;
    }

    function updateProjectFilterOptions() {
        // Get all unique projects
        const projects = ['all', ...new Set(tasks.map(task => task.project))];
        
        // Save current selection
        const currentSelection = projectFilter.value;
        
        // Update options
        projectFilter.innerHTML = '';
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project;
            option.textContent = project === 'all' ? 'All Projects' : project;
            projectFilter.appendChild(option);
        });
        
        // Restore selection if it still exists
        if (projects.includes(currentSelection)) {
            projectFilter.value = currentSelection;
        }
    }

    function saveTasks() {
        localStorage.setItem('engineering-tasks', JSON.stringify(tasks));
    }

    function toggleTheme() {
        const themes = ['default', 'light-theme', 'high-contrast-theme', 'engineering-blue-theme'];
        const currentIndex = themes.indexOf(currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        currentTheme = themes[nextIndex];
        
        localStorage.setItem('engineering-theme', currentTheme);
        updateTheme();
    }

    function updateTheme() {
        // Update the theme stylesheet
        if (currentTheme === 'default') {
            themeStyle.setAttribute('href', 'themes.css');
        } else {
            // Create a style element with the selected theme
            themeStyle.setAttribute('href', 'themes.css');
        }
        
        // Add class to body for theme-specific styles
        document.body.className = currentTheme === 'default' ? '' : currentTheme;
        
        // Update the theme button text and icon
        const themeNames = {
            'default': 'Dark Mode',
            'light-theme': 'Light Mode',
            'high-contrast-theme': 'High Contrast',
            'engineering-blue-theme': 'Engineering Blue'
        };
        
        const themeIcons = {
            'default': 'moon',
            'light-theme': 'sun',
            'high-contrast-theme': 'adjust',
            'engineering-blue-theme': 'cogs'
        };
        
        themeToggle.innerHTML = `<i class="fas fa-${themeIcons[currentTheme]}"></i> ${themeNames[currentTheme]}`;
    }
});