// PomoTodo App

// Task class definition
class Task {
    constructor(id, title, completed = false, estimatedPomodoros = null, actualPomodoros = 0, createdAt = new Date().toISOString(), completedAt = null) {
        this.id = id;
        this.title = title;
        this.completed = completed;
        this.estimatedPomodoros = estimatedPomodoros;
        this.actualPomodoros = actualPomodoros;
        this.createdAt = createdAt;
        this.completedAt = completedAt;
    }
}

// Timer class definition
class Timer {
    constructor() {
        this.mode = 'work'; // 'work', 'shortBreak', 'longBreak', 'idle'
        this.duration = 25 * 60; // in seconds (25 minutes for work)
        this.remainingTime = this.duration;
        this.isRunning = false;
        this.isPaused = false;
        this.currentTaskId = null;
        this.startedAt = null;
        this.pomodoroCount = 0;
        this.completedPomodoroTimestamps = []; // Track completed pomodoros with timestamps
    }
}

// Settings class definition
class Settings {
    constructor() {
        this.workDuration = 25; // minutes
        this.shortBreakDuration = 5; // minutes
        this.longBreakDuration = 15; // minutes
        this.longBreakInterval = 4; // pomodoros
        this.notificationSound = 'beep'; // 'beep', 'bell', 'chime', 'silent'
        this.focusMode = false; // boolean
        this.filterState = 'all'; // 'all', 'active', 'completed'
    }
}

// Main application class
class PomoTodoApp {
    constructor() {
        // Data
        this.tasks = [];
        this.timer = new Timer();
        this.settings = new Settings();
        
        // DOM Elements
        this.taskInput = document.getElementById('task-input');
        this.estimateInput = document.getElementById('estimate-input');
        this.addTaskBtn = document.getElementById('add-task-btn');
        this.taskList = document.getElementById('task-list');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.taskSearch = document.getElementById('task-search');
        this.clearCompletedBtn = document.getElementById('clear-completed-btn');
        this.timerDisplay = document.getElementById('timer-display');
        this.timerMode = document.getElementById('timer-mode');
        this.progressBar = document.getElementById('progress-bar');
        this.startBtn = document.getElementById('start-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.skipBtn = document.getElementById('skip-btn');
        this.currentTaskEl = document.getElementById('current-task');
        this.sessionCountEl = document.getElementById('session-count');
        
        // Stats elements
        this.todayPomodorosEl = document.getElementById('today-pomodoros');
        this.completedTasksEl = document.getElementById('completed-tasks');
        this.totalTasksEl = document.getElementById('total-tasks');
        this.totalTimeEl = document.getElementById('total-time');
        this.statsPomodorosEl = document.getElementById('stats-pomodoros');
        this.statsCompletedEl = document.getElementById('stats-completed');
        this.statsTimeEl = document.getElementById('stats-time');
        this.statsStreakEl = document.getElementById('stats-streak');
        
        // State
        this.editingTaskId = null;
        this.audioContext = null;
        this.intervalId = null;
        this.searchTerm = '';
        
        // Initialize the app
        this.init();
    }
    
    init() {
        // Load data from localStorage
        this.loadData();
        
        // Add event listeners
        this.addEventListeners();
        
        // Render initial UI
        this.renderTasks();
        this.updateTimerDisplay();
        this.updateStats();
        this.updateFilterButtons();
    }
    
    addEventListeners() {
        // Task input and button
        this.addTaskBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTask();
            }
        });
        
        // Filter buttons
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                this.setFilter(filter);
            });
            
            // Add keyboard support for filter buttons
            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const filter = btn.dataset.filter;
                    this.setFilter(filter);
                }
            });
        });
        
        // Timer controls
        this.startBtn.addEventListener('click', () => this.startTimer());
        this.pauseBtn.addEventListener('click', () => this.pauseTimer());
        this.resetBtn.addEventListener('click', () => this.resetTimer());
        this.skipBtn.addEventListener('click', () => this.skipTimer());
        
        // Add keyboard support for timer controls
        this.startBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.startTimer();
            }
        });
        
        this.pauseBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.pauseTimer();
            }
        });
        
        this.resetBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.resetTimer();
            }
        });
        
        this.skipBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.skipTimer();
            }
        });
        
        // Add global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Space to toggle current task completion (if focused on a task)
            if (e.key === ' ' && e.target.classList.contains('task-checkbox')) {
                e.preventDefault();
                // The checkbox will be toggled by its own event handler
            }
            
            // Escape to cancel task editing
            if (e.key === 'Escape') {
                if (this.editingTaskId) {
                    this.cancelTaskEdit();
                }
            }
        });
        
        // Add focus mode toggle functionality
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+F to toggle focus mode
            if (e.ctrlKey && e.shiftKey && e.key === 'F') {
                e.preventDefault();
                this.toggleFocusMode();
            }
        });
        
        // Add search functionality
        this.taskSearch.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.renderTasks();
        });
        
        // Add clear completed tasks functionality
        this.clearCompletedBtn.addEventListener('click', () => {
            this.clearCompletedTasks();
        });
        
        // Update settings on change
        this.updateSettings();
    }
    
    toggleFocusMode() {
        this.settings.focusMode = !this.settings.focusMode;
        
        // Update UI to reflect focus mode
        this.updateFocusModeUI();
        
        // Save settings
        this.saveData();
    }
    
    updateFocusModeUI() {
        const todoSection = document.querySelector('.todo-section');
        
        if (this.settings.focusMode && this.timer.isRunning) {
            // Apply focus mode styles
            todoSection.classList.add('focus-mode');
            
            // Disable task inputs and buttons
            this.taskInput.disabled = true;
            this.addTaskBtn.disabled = true;
            
            // Disable task editing and deletion
            document.querySelectorAll('.edit-btn, .delete-btn').forEach(btn => {
                btn.disabled = true;
                btn.style.opacity = '0.5';
            });
            
            // Disable task addition UI
            document.querySelectorAll('.input-container, .filters').forEach(el => {
                el.style.opacity = '0.5';
                el.style.pointerEvents = 'none';
            });
        } else {
            // Remove focus mode styles
            todoSection.classList.remove('focus-mode');
            
            // Re-enable task inputs and buttons
            this.taskInput.disabled = false;
            this.addTaskBtn.disabled = false;
            
            // Re-enable task editing and deletion
            document.querySelectorAll('.edit-btn, .delete-btn').forEach(btn => {
                btn.disabled = false;
                btn.style.opacity = '1';
            });
            
            // Re-enable task addition UI
            document.querySelectorAll('.input-container, .filters').forEach(el => {
                el.style.opacity = '1';
                el.style.pointerEvents = 'auto';
            });
        }
    }
    
    clearCompletedTasks() {
        if (!confirm('完了済みのタスクをすべて削除しますか？')) {
            return; // User cancelled
        }
        
        // Filter out completed tasks
        this.tasks = this.tasks.filter(task => !task.completed);
        
        // Save and update UI
        this.saveData();
        this.renderTasks();
        this.updateStats();
    }
    
    updateSettings() {
        // Update timer duration based on settings
        this.updateTimerDuration();
    }
    
    updateTimerDuration() {
        if (this.timer.mode === 'work') {
            this.timer.duration = this.settings.workDuration * 60;
        } else if (this.timer.mode === 'shortBreak') {
            this.timer.duration = this.settings.shortBreakDuration * 60;
        } else if (this.timer.mode === 'longBreak') {
            this.timer.duration = this.settings.longBreakDuration * 60;
        }
        
        // Reset remaining time if not running
        if (!this.timer.isRunning) {
            this.timer.remainingTime = this.timer.duration;
        }
        
        this.updateTimerDisplay();
    }
    
    // Task management
    addTask() {
        const title = this.taskInput.value.trim();
        const estimatedPomodoros = parseInt(this.estimateInput.value) || null;
        
        // Validation
        if (!title) {
            alert('タスク名を入力してください'); // E001
            return;
        }
        
        if (title.length > 100) {
            alert('タスク名は100文字以内で入力してください'); // E002
            return;
        }
        
        // Create new task
        const newTask = new Task(
            `task_${Date.now()}`,
            title,
            false,
            estimatedPomodoros,
            0
        );
        
        // Add to the beginning of the list
        this.tasks.unshift(newTask);
        
        // Clear inputs
        this.taskInput.value = '';
        this.estimateInput.value = '';
        
        // Save and render
        this.saveData();
        this.renderTasks();
    }
    
    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        // Store the ID of the task being edited
        this.editingTaskId = taskId;
        this.renderTasks();
        
        // Focus on the input field
        setTimeout(() => {
            const editInput = document.getElementById(`edit-input-${taskId}`);
            if (editInput) {
                editInput.focus();
                editInput.select();
            }
        }, 0);
    }
    
    saveTaskEdit(taskId, newTitle) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        // Validation
        if (!newTitle.trim()) {
            alert('タスク名は必須です');
            return;
        }
        
        if (newTitle.length > 100) {
            alert('タスク名は100文字以内で入力してください'); // E002
            return;
        }
        
        task.title = newTitle.trim();
        this.editingTaskId = null;
        this.saveData();
        this.renderTasks();
    }
    
    cancelTaskEdit() {
        this.editingTaskId = null;
        this.renderTasks();
    }
    
    deleteTask(taskId) {
        // Check if the task is currently running
        if (this.timer.currentTaskId === taskId && this.timer.isRunning) {
            alert('タイマーを停止してから削除してください'); // E004
            return;
        }
        
        // Find the task and remove it with animation
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            // Add removing class for animation
            const taskElement = document.querySelector(`.task-item[data-id="${taskId}"]`);
            if (taskElement) {
                taskElement.classList.add('removing');
                
                // Remove after animation completes
                setTimeout(() => {
                    this.tasks.splice(taskIndex, 1);
                    this.saveData();
                    this.renderTasks();
                }, 300);
            } else {
                // If no animation needed, remove immediately
                this.tasks.splice(taskIndex, 1);
                this.saveData();
                this.renderTasks();
            }
        }
    }
    
    toggleTaskCompletion(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;
        
        this.saveData();
        this.renderTasks();
        this.updateStats();
    }
    
    selectTask(taskId) {
        // Don't allow task selection while timer is running
        if (this.timer.isRunning) {
            alert('タイマーを停止してから選択してください');
            return;
        }
        
        // Unselect all tasks
        this.timer.currentTaskId = taskId;
        this.renderTasks();
        this.updateCurrentTaskDisplay();
    }
    
    // Timer management
    startTimer() {
        // Check if a task is selected
        if (!this.timer.currentTaskId) {
            alert('タスクを選択してください'); // E003
            return;
        }
        
        // Check if currently editing a task
        if (this.editingTaskId) {
            alert('編集を完了してください'); // E008
            return;
        }
        
        // Set timer as running
        this.timer.isRunning = true;
        this.timer.isPaused = false;
        
        // Set start time
        this.timer.startedAt = new Date().toISOString();
        
        // Update UI
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;
        
        // Update focus mode UI if enabled
        this.updateFocusModeUI();
        
        // Start the timer countdown
        this.startTimerCountdown();
    }
    
    pauseTimer() {
        if (!this.timer.isRunning) return;
        
        this.timer.isPaused = true;
        this.timer.isRunning = false;
        
        // Update UI
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        
        // Update focus mode UI if enabled
        this.updateFocusModeUI();
        
        // Clear the interval
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
    
    resetTimer() {
        if (confirm('タイマーをリセットしますか？')) { // E007
            this.timer.isRunning = false;
            this.timer.isPaused = false;
            this.timer.remainingTime = this.timer.duration;
            
            // Update UI
            this.startBtn.disabled = false;
            this.pauseBtn.disabled = true;
            
            // Update focus mode UI if enabled
            this.updateFocusModeUI();
            
            // Clear interval if exists
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
            
            this.updateTimerDisplay();
        }
    }
    
    skipTimer() {
        if (!this.timer.isRunning) return;
        
        // Clear interval
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        // Skip to next mode
        this.moveToNextMode();
    }
    
    startTimerCountdown() {
        // Clear any existing interval
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        
        // Store start time for drift correction
        this.startTime = Date.now();
        
        // Update timer duration based on current mode
        this.updateTimerDuration();
        
        // Start the countdown
        this.intervalId = setInterval(() => {
            // Calculate expected remaining time based on system time
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const expectedRemaining = Math.max(0, this.timer.duration - elapsed);
            
            // Update to the expected time to correct for drift
            this.timer.remainingTime = expectedRemaining;
            
            if (this.timer.remainingTime <= 0) {
                this.timerFinished();
                return;
            }
            
            // Update display
            this.updateTimerDisplay();
            
            // Update progress bar
            const progressPercent = (this.timer.duration - this.timer.remainingTime) / this.timer.duration * 100;
            this.progressBar.style.width = `${progressPercent}%`;
        }, 1000);
    }
    
    timerFinished() {
        // Clear the interval
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        // Play notification sound
        this.playNotificationSound();
        
        // Show visual notification
        this.showVisualNotification();
        
        // Update task's pomodoro count if it was a work session
        if (this.timer.mode === 'work' && this.timer.currentTaskId) {
            const task = this.tasks.find(t => t.id === this.timer.currentTaskId);
            if (task) {
                task.actualPomodoros++;
                this.timer.pomodoroCount++;
                
                // Add timestamp to completed pomodoros
                this.timer.completedPomodoroTimestamps.push(new Date().toISOString());
                
                this.saveData();
            }
        }
        
        // Move to next mode
        this.moveToNextMode();
        
        // Update stats
        this.updateStats();
    }
    
    moveToNextMode() {
        // Determine the next mode based on the current mode and completed pomodoros
        if (this.timer.mode === 'work') {
            // Check if it's time for a long break
            const completedPomodoros = this.timer.pomodoroCount % this.settings.longBreakInterval;
            if (completedPomodoros === 0 && this.timer.pomodoroCount > 0) {
                this.timer.mode = 'longBreak';
            } else {
                this.timer.mode = 'shortBreak';
            }
        } else {
            // If it was a break, move back to work
            this.timer.mode = 'work';
        }
        
        // Reset timer for new mode
        this.updateTimerDuration();
        this.timer.isRunning = false;
        this.timer.isPaused = false;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        
        // Update focus mode UI if enabled
        this.updateFocusModeUI();
        
        // Update display
        this.updateTimerDisplay();
        this.updateSessionCounter();
    }
    
    updateSessionCounter() {
        const completedPomodoros = this.timer.pomodoroCount % this.settings.longBreakInterval;
        this.sessionCountEl.textContent = completedPomodoros;
    }
    
    playNotificationSound() {
        // Create audio context if it doesn't exist
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // Play sound based on settings
        if (this.settings.notificationSound !== 'silent') {
            // Different sound types based on settings
            switch (this.settings.notificationSound) {
                case 'bell':
                    this.playBellSound();
                    break;
                case 'chime':
                    this.playChimeSound();
                    break;
                case 'beep':
                default:
                    this.playBeepSound();
                    break;
            }
        }
    }
    
    playBeepSound() {
        // Create simple beep sound
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.value = 800;
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }
    
    playBellSound() {
        // Create bell-like sound
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.value = 600;
        
        // Create the bell sound effect with a harmonic
        const harmonicOsc = this.audioContext.createOscillator();
        harmonicOsc.type = 'sine';
        harmonicOsc.frequency.value = 800;
        harmonicOsc.connect(gainNode);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1.0);
        
        oscillator.start(this.audioContext.currentTime);
        harmonicOsc.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 1.0);
        harmonicOsc.stop(this.audioContext.currentTime + 1.0);
    }
    
    playChimeSound() {
        // Create chime-like sound
        const frequencies = [659, 784, 932, 1047]; // C-E-G-C chord
        
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.type = 'sine';
                oscillator.frequency.value = freq;
                
                gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.5);
            }, index * 150); // Stagger each tone slightly
        });
    }
    
    showVisualNotification() {
        // Add pulse animation to timer
        const timerContainer = document.querySelector('.timer-container');
        timerContainer.classList.add('running');
        
        // Remove animation after 2 seconds
        setTimeout(() => {
            timerContainer.classList.remove('running');
        }, 2000);
    }
    
    // Filter management
    setFilter(filter) {
        this.settings.filterState = filter;
        this.saveData();
        this.renderTasks();
        this.updateFilterButtons();
    }
    
    updateFilterButtons() {
        this.filterBtns.forEach(btn => {
            if (btn.dataset.filter === this.settings.filterState) {
                btn.classList.add('active');
                btn.setAttribute('aria-pressed', 'true');
            } else {
                btn.classList.remove('active');
                btn.setAttribute('aria-pressed', 'false');
            }
        });
    }
    
    // UI rendering
    renderTasks() {
        // Clear the task list
        this.taskList.innerHTML = '';
        
        // Get filtered tasks based on the current filter
        let filteredTasks = this.tasks;
        
        switch (this.settings.filterState) {
            case 'active':
                filteredTasks = this.tasks.filter(task => !task.completed);
                break;
            case 'completed':
                filteredTasks = this.tasks.filter(task => task.completed);
                break;
            case 'all':
            default:
                filteredTasks = this.tasks;
        }
        
        // Apply search filter if there's a search term
        if (this.searchTerm) {
            filteredTasks = filteredTasks.filter(task => 
                task.title.toLowerCase().includes(this.searchTerm)
            );
        }
        
        // Render each task
        filteredTasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.className = 'task-item';
            taskItem.dataset.id = task.id;
            
            // Add selected class if this is the current task
            if (this.timer.currentTaskId === task.id) {
                taskItem.classList.add('selected');
            }
            
            // Add drag and drop attributes
            taskItem.draggable = true;
            taskItem.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', task.id);
                taskItem.classList.add('dragging');
            });
            
            taskItem.addEventListener('dragend', (e) => {
                taskItem.classList.remove('dragging');
            });
            
            // Add selected class if this is the current task
            if (this.timer.currentTaskId === task.id) {
                taskItem.classList.add('selected');
            }
            
            // Check if this task is currently being edited
            const isEditing = this.editingTaskId === task.id;
            
            if (isEditing) {
                // Editing view
                taskItem.innerHTML = `
                    <input 
                        type="checkbox" 
                        class="task-checkbox" 
                        ${task.completed ? 'checked' : ''}
                        onchange="app.toggleTaskCompletion('${task.id}')"
                    >
                    <input 
                        type="text" 
                        id="edit-input-${task.id}"
                        class="task-input-edit" 
                        value="${task.title}"
                        onkeypress="if(event.key==='Enter') app.saveTaskEdit('${task.id}', event.target.value)"
                        onblur="app.saveTaskEdit('${task.id}', event.target.value)"
                    >
                    <span class="task-pomodoros">${task.actualPomodoros}${task.estimatedPomodoros ? '/' + task.estimatedPomodoros : ''}</span>
                    <div class="task-actions">
                        <button class="edit-btn" onclick="app.cancelTaskEdit()">キャンセル</button>
                    </div>
                `;
            } else {
                // Normal view
                // Determine the class based on actual vs estimated pomodoros
                let pomodoroClass = '';
                if (task.estimatedPomodoros) {
                    if (task.actualPomodoros < task.estimatedPomodoros) {
                        pomodoroClass = 'pomodoros-under'; // Under estimation
                    } else if (task.actualPomodoros > task.estimatedPomodoros) {
                        pomodoroClass = 'pomodoros-over'; // Over estimation
                    } else {
                        pomodoroClass = 'pomodoros-met'; // Met estimation
                    }
                }
                
                taskItem.innerHTML = `
                    <input 
                        type="checkbox" 
                        class="task-checkbox" 
                        ${task.completed ? 'checked' : ''}
                        onchange="app.toggleTaskCompletion('${task.id}')"
                    >
                    <span class="task-title" ondblclick="app.editTask('${task.id}')">${task.title}</span>
                    <span class="task-pomodoros ${pomodoroClass}">${task.actualPomodoros}${task.estimatedPomodoros ? '/' + task.estimatedPomodoros : ''}</span>
                    <div class="task-actions">
                        <button class="edit-btn" onclick="app.editTask('${task.id}')">編集</button>
                        <button class="delete-btn" onclick="app.deleteTask('${task.id}')">削除</button>
                    </div>
                `;
            }
            
            // Add completed class if task is completed
            if (task.completed) {
                taskItem.classList.add('completed');
            }
            
            // Add click event to select task
            taskItem.addEventListener('click', (e) => {
                // Don't select if clicking on checkbox, edit or delete buttons
                if (!e.target.classList.contains('task-checkbox') && 
                    !e.target.classList.contains('edit-btn') && 
                    !e.target.classList.contains('delete-btn')) {
                    this.selectTask(task.id);
                }
            });
            
            // Add drag and drop event listeners
            taskItem.addEventListener('dragover', (e) => {
                e.preventDefault(); // Necessary to allow dropping
                const afterElement = this.getDragAfterElement(this.taskList, e.clientY);
                const draggable = document.querySelector('.dragging');
                if (afterElement == null) {
                    this.taskList.appendChild(draggable);
                } else {
                    this.taskList.insertBefore(draggable, afterElement);
                }
            });
            
            taskItem.addEventListener('drop', (e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData('text/plain');
                this.moveTask(id);
            });
            
            this.taskList.appendChild(taskItem);
        });
        
        // Add event listener for the task list itself for drag and drop
        this.taskList.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
    }
    
    updateTimerDisplay() {
        // Update mode display
        if (this.timer.mode === 'work') {
            this.timerMode.textContent = '作業中';
            this.timerMode.className = 'timer-mode';
        } else if (this.timer.mode === 'shortBreak' || this.timer.mode === 'longBreak') {
            this.timerMode.textContent = this.timer.mode === 'shortBreak' ? '短い休憩' : '長い休憩';
            this.timerMode.className = 'timer-mode break';
        }
        
        // Update time display (MM:SS format)
        const minutes = Math.floor(this.timer.remainingTime / 60);
        const seconds = this.timer.remainingTime % 60;
        this.timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update progress bar color based on mode
        if (this.timer.mode === 'work') {
            this.progressBar.className = 'progress';
        } else {
            this.progressBar.className = 'progress break';
        }
        
        // Calculate and set the progress percentage
        const progressPercent = this.timer.duration > 0 ? 
            (this.timer.duration - this.timer.remainingTime) / this.timer.duration * 100 : 0;
        this.progressBar.style.width = `${progressPercent}%`;
    }
    
    updateCurrentTaskDisplay() {
        const currentTask = this.tasks.find(t => t.id === this.timer.currentTaskId);
        if (currentTask) {
            this.currentTaskEl.textContent = currentTask.title;
        } else {
            this.currentTaskEl.textContent = 'タスクを選択してください';
        }
    }
    
    updateStats() {
        // Calculate stats
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(t => t.completed).length;
        const todayPomodoros = this.timer.pomodoroCount;
        
        // Update DOM elements
        this.totalTasksEl.textContent = totalTasks;
        this.completedTasksEl.textContent = completedTasks;
        this.todayPomodorosEl.textContent = todayPomodoros;
        
        // Update stats section
        this.statsPomodoroEl.textContent = todayPomodoros;
        this.statsCompletedEl.textContent = completedTasks;
        
        // Calculate total time (in hours and minutes)
        const totalTimeInMinutes = todayPomodoros * 25; // 25 minutes per pomodoro
        const hours = Math.floor(totalTimeInMinutes / 60);
        const minutes = totalTimeInMinutes % 60;
        this.totalTimeEl.textContent = `${hours}h ${minutes}m`;
        this.statsTimeEl.textContent = `${hours}h ${minutes}m`;
        
        // Calculate and display the streak (for now, we'll calculate consecutive days with pomodoros)
        const streak = this.calculateStreak();
        this.statsStreakEl.textContent = streak;
        
        // Update weekly graph
        this.updateWeeklyGraph();
    }
    
    calculateStreak() {
        if (this.timer.completedPomodoroTimestamps.length === 0) {
            return 0;
        }
        
        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Convert timestamps to dates and sort them
        const dates = this.timer.completedPomodoroTimestamps
            .map(timestamp => {
                const date = new Date(timestamp);
                date.setHours(0, 0, 0, 0); // Set time to beginning of day
                return date;
            })
            .filter((date, index, arr) => arr.indexOf(date) === index) // Remove duplicates
            .sort((a, b) => a - b);
        
        if (dates.length === 0) {
            return 0;
        }
        
        // Check if today has any pomodoros
        const lastDate = dates[dates.length - 1];
        if (lastDate.getTime() === today.getTime()) {
            // We've already had pomodoros today, check the streak from yesterday
            return this.calculateStreakFromDates(dates, today);
        } else if (lastDate.getTime() === new Date(today.getTime() - 24 * 60 * 60 * 1000).getTime()) {
            // Yesterday had pomodoros, so today could continue the streak if we calculate accordingly
            return this.calculateStreakFromDates(dates, today);
        } else {
            // There's a gap, streak is broken, calculate from the last date
            return this.calculateStreakFromDates(dates, new Date(lastDate.getTime()));
        }
    }
    
    updateWeeklyGraph() {
        const weeklyGraph = document.getElementById('weekly-graph');
        if (!weeklyGraph) return;
        
        // Get today's date to calculate the week
        const today = new Date();
        const week = this.getWeekPomodoroCounts(today);
        
        // Clear the current graph
        weeklyGraph.innerHTML = '';
        
        // Find the max value to scale the graph
        const maxValue = Math.max(...week.map(day => day.count), 1);
        
        // Create bars for each day of the week
        week.forEach(day => {
            const barContainer = document.createElement('div');
            barContainer.className = 'graph-bar';
            
            // Calculate the height percentage based on max value
            const percentage = (day.count / maxValue) * 100;
            barContainer.style.height = `${percentage}%`;
            
            // Add the value label on top of the bar
            const valueLabel = document.createElement('div');
            valueLabel.className = 'graph-bar-value';
            valueLabel.textContent = day.count;
            
            barContainer.appendChild(valueLabel);
            weeklyGraph.appendChild(barContainer);
        });
    }
    
    getWeekPomodoroCounts(referenceDate) {
        // Calculate the start of the week (Sunday)
        const startOfWeek = new Date(referenceDate);
        startOfWeek.setDate(referenceDate.getDate() - referenceDate.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        
        // Create an array for the 7 days of the week
        const week = [];
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            
            // Count pomodoros for this day
            const count = this.timer.completedPomodoroTimestamps.filter(timestamp => {
                const tsDate = new Date(timestamp);
                return tsDate.toDateString() === date.toDateString();
            }).length;
            
            week.push({
                date: date,
                count: count,
                dayName: ['日', '月', '火', '水', '木', '金', '土'][i]
            });
        }
        
        return week;
    }
    
    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            // If offset is negative, it means we're above the element
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    
    moveTask(id) {
        // Don't allow moving when filtering is active
        if (this.settings.filterState !== 'all') {
            alert('フィルター適用中は並び替え不可');
            return;
        }
        
        const taskElement = document.querySelector(`.task-item[data-id="${id}"]`);
        if (!taskElement) return;
        
        // Find the task in the tasks array
        const taskIndex = this.tasks.findIndex(t => t.id === id);
        if (taskIndex === -1) return;
        
        // Get the new position in the list
        const newElements = Array.from(this.taskList.children);
        const newTaskIndex = newElements.findIndex(el => el.dataset.id === id);
        
        if (newTaskIndex !== taskIndex) {
            // Remove the task from its current position
            const [task] = this.tasks.splice(taskIndex, 1);
            
            // Insert it at the new position
            // Adjust index if moving down since we've already removed the element
            const adjustedIndex = taskIndex > newTaskIndex ? newTaskIndex : newTaskIndex;
            this.tasks.splice(adjustedIndex, 0, task);
            
            // Save the new order
            this.saveData();
        }
    }
    
    calculateStreakFromDates(dates, referenceDate) {
        let streak = 0;
        let currentDate = new Date(referenceDate);
        currentDate.setHours(0, 0, 0, 0);
        
        // Go backwards day by day to see how many consecutive days have pomodoros
        for (let i = dates.length - 1; i >= 0; i--) {
            if (dates[i].getTime() === currentDate.getTime()) {
                // Found a pomodoro for this day
                streak++;
                // Move to previous day
                currentDate.setDate(currentDate.getDate() - 1);
            } else if (dates[i].getTime() < currentDate.getTime()) {
                // There's a gap, streak is broken
                break;
            }
        }
        
        return streak;
    }
    
    // Data persistence
    saveData() {
        try {
            localStorage.setItem('pomotodo_tasks', JSON.stringify(this.tasks));
            localStorage.setItem('pomotodo_timer', JSON.stringify(this.timer));
            localStorage.setItem('pomotodo_settings', JSON.stringify(this.settings));
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                alert('保存容量が不足しています'); // E005
            } else {
                alert('データの保存ができません'); // E006
            }
        }
    }
    
    loadData() {
        try {
            const savedTasks = localStorage.getItem('pomotodo_tasks');
            const savedTimer = localStorage.getItem('pomotodo_timer');
            const savedSettings = localStorage.getItem('pomotodo_settings');
            
            if (savedTasks) {
                this.tasks = JSON.parse(savedTasks).map(task => new Task(
                    task.id,
                    task.title,
                    task.completed,
                    task.estimatedPomodoros,
                    task.actualPomodoros,
                    task.createdAt,
                    task.completedAt
                ));
            }
            
            if (savedTimer) {
                const timerData = JSON.parse(savedTimer);
                this.timer = new Timer();
                // Copy all properties from saved data to the new timer object
                Object.keys(timerData).forEach(key => {
                    if (this.timer.hasOwnProperty(key)) {
                        this.timer[key] = timerData[key];
                    }
                });
            }
            
            if (savedSettings) {
                const settingsData = JSON.parse(savedSettings);
                this.settings = new Settings();
                Object.assign(this.settings, settingsData);
            }
        } catch (e) {
            console.error('Error loading data from localStorage:', e);
        }
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PomoTodoApp();
});