// PomoTodo App - JavaScript Implementation
// State Management
const appState = {
  tasks: [],
  timer: {
    mode: 'idle', // 'idle', 'work', 'shortBreak', 'longBreak'
    duration: 1500, // 25 minutes in seconds
    remainingTime: 1500,
    isRunning: false,
    isPaused: false,
    currentTaskId: null,
    startedAt: null,
    pomodoroCount: 0
  },
  settings: {
    workDuration: 25, // minutes
    shortBreakDuration: 5, // minutes
    longBreakDuration: 15, // minutes
    longBreakInterval: 4, // pomodoros before long break
    notificationSound: 'beep',
    focusMode: false,
    filterState: 'all'
  },
  selectedTaskId: null
};

// DOM Elements
const elements = {
  taskInput: document.getElementById('task-input'),
  pomodoroInput: document.getElementById('pomodoro-input'),
  addTaskBtn: document.getElementById('add-task-btn'),
  taskList: document.getElementById('task-list'),
  filterBtns: document.querySelectorAll('.filter-btn'),
  timerDisplay: document.getElementById('timer-display'),
  timerMode: document.getElementById('timer-mode'),
  progressFill: document.getElementById('progress-fill'),
  currentTask: document.getElementById('current-task'),
  startBtn: document.getElementById('start-btn'),
  pauseBtn: document.getElementById('pause-btn'),
  resetBtn: document.getElementById('reset-btn'),
  skipBtn: document.getElementById('skip-btn'),
  notification: document.getElementById('notification'),
  todayPomodoros: document.getElementById('today-pomodoros'),
  completedTasks: document.getElementById('completed-tasks'),
  totalTasks: document.getElementById('total-tasks'),
  totalWorkTime: document.getElementById('total-work-time'),
  totalPomodoros: document.getElementById('total-pomodoros'),
  currentTaskStat: document.getElementById('current-task-stat')
};

// Timer interval ID
let timerIntervalId = null;

// Initialize the app
function initializeApp() {
  loadFromLocalStorage();
  renderTasks();
  updateTimerDisplay();
  updateStatistics();
  attachEventListeners();
  
  // Request notification permission
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// Attach event listeners
function attachEventListeners() {
  // Task form submission
  document.querySelector('.task-input-form').addEventListener('submit', function(e) {
    e.preventDefault();
    addTaskFromForm();
  });
  
  // Add task button
  elements.addTaskBtn.addEventListener('click', addTaskFromForm);
  
  // Filter buttons
  elements.filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      filterTasks(filter);
      
      // Update active button
      elements.filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
  
  // Timer buttons
  elements.startBtn.addEventListener('click', startTimer);
  elements.pauseBtn.addEventListener('click', pauseTimer);
  elements.resetBtn.addEventListener('click', resetTimer);
  elements.skipBtn.addEventListener('click', skipTimer);
  
  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyDown);
}

// Handle keyboard shortcuts
function handleKeyDown(e) {
  // Enter to add task when on input field
  if (e.key === 'Enter' && (e.target === elements.taskInput || e.target === elements.pomodoroInput)) {
    addTaskFromForm();
  }
  
  // Escape to clear selection
  if (e.key === 'Escape') {
    appState.selectedTaskId = null;
    renderTasks();
  }
}

// Add task from form input
function addTaskFromForm() {
  const title = elements.taskInput.value.trim();
  const estimatedPomodoros = parseInt(elements.pomodoroInput.value) || 1;
  
  if (addTask(title, estimatedPomodoros)) {
    // Clear form
    elements.taskInput.value = '';
    elements.pomodoroInput.value = '1';
    elements.taskInput.focus();
  }
}

// Task Management Functions
function addTask(title, estimatedPomodoros) {
  // Validation
  if (!validateInput(title, 'taskTitle')) {
    showNotification('E001: タスク名を入力してください', 'error');
    return false;
  }
  
  if (!validateInput(estimatedPomodoros, 'pomodoros')) {
    showNotification('E002: ポモドーロ数は1-20の間で入力してください', 'error');
    return false;
  }
  
  // Create new task
  const newTask = {
    id: `task_${Date.now()}`,
    title: title,
    completed: false,
    estimatedPomodoros: estimatedPomodoros,
    actualPomodoros: 0,
    createdAt: new Date().toISOString(),
    completedAt: null
  };
  
  // Add to beginning of tasks array
  appState.tasks.unshift(newTask);
  
  // Save to localStorage
  saveToLocalStorage('pomotodo_tasks', appState.tasks);
  
  // Update UI
  renderTasks();
  updateStatistics();
  
  // Show success message
  showNotification('タスクを追加しました', 'success');
  
  return true;
}

function editTask(taskId, newTitle) {
  // Validation
  if (!validateInput(newTitle, 'taskTitle')) {
    showNotification('E001: タスク名を入力してください', 'error');
    return false;
  }
  
  // Find task and update
  const task = appState.tasks.find(t => t.id === taskId);
  if (task) {
    task.title = newTitle;
    
    // Save to localStorage
    saveToLocalStorage('pomotodo_tasks', appState.tasks);
    
    // Update UI
    renderTasks();
    
    return true;
  }
  
  return false;
}

function deleteTask(taskId) {
  // Check if task is currently being timed
  if (appState.timer.currentTaskId === taskId && appState.timer.isRunning) {
    showNotification('E004: タイマーを停止してから削除してください', 'error');
    return false;
  }
  
  // Find task index
  const taskIndex = appState.tasks.findIndex(t => t.id === taskId);
  if (taskIndex !== -1) {
    // Add removing class for animation
    const taskElement = document.querySelector(`.task-item[data-id="${taskId}"]`);
    if (taskElement) {
      taskElement.classList.add('fadeOut');
      
      // Remove after animation
      setTimeout(() => {
        appState.tasks.splice(taskIndex, 1);
        
        // Update selected task if needed
        if (appState.selectedTaskId === taskId) {
          appState.selectedTaskId = null;
        }
        
        // Save to localStorage
        saveToLocalStorage('pomotodo_tasks', appState.tasks);
        
        // Update UI
        renderTasks();
        updateStatistics();
      }, 300);
    } else {
      // If no element found, remove immediately
      appState.tasks.splice(taskIndex, 1);
      
      // Update selected task if needed
      if (appState.selectedTaskId === taskId) {
        appState.selectedTaskId = null;
      }
      
      // Save to localStorage
      saveToLocalStorage('pomotodo_tasks', appState.tasks);
      
      // Update UI
      renderTasks();
      updateStatistics();
    }
    
    return true;
  }
  
  return false;
}

function toggleTaskComplete(taskId) {
  const task = appState.tasks.find(t => t.id === taskId);
  if (task) {
    task.completed = !task.completed;
    
    if (task.completed) {
      task.completedAt = new Date().toISOString();
    } else {
      task.completedAt = null;
    }
    
    // Save to localStorage
    saveToLocalStorage('pomotodo_tasks', appState.tasks);
    
    // Update UI
    renderTasks();
    updateStatistics();
    
    // If this task was selected and is now completed, deselect it
    if (appState.selectedTaskId === taskId && task.completed) {
      appState.selectedTaskId = null;
    }
    
    return true;
  }
  
  return false;
}

function selectTask(taskId) {
  // Check if timer is running
  if (appState.timer.isRunning) {
    showNotification('タイマーを停止してから選択してください', 'warning');
    return false;
  }
  
  // Set selected task
  appState.selectedTaskId = taskId;
  
  // Update UI
  renderTasks();
  
  return true;
}

function filterTasks(filterType) {
  appState.settings.filterState = filterType;
  
  // Save to localStorage
  saveToLocalStorage('pomotodo_settings', appState.settings);
  
  // Update UI
  renderTasks();
}

// Timer Functions
function startTimer() {
  // Check if a task is selected
  if (!appState.selectedTaskId) {
    showNotification('E003: タスクを選択してください', 'error');
    return;
  }
  
  // Check if timer is already running
  if (appState.timer.isRunning) {
    return;
  }
  
  // Set timer state
  appState.timer.isRunning = true;
  appState.timer.isPaused = false;
  appState.timer.currentTaskId = appState.selectedTaskId;
  appState.timer.startedAt = Date.now();
  
  // Clear any existing interval
  if (timerIntervalId) {
    clearInterval(timerIntervalId);
  }
  
  // Start timer interval
  timerIntervalId = setInterval(updateTimer, 1000);
  
  // Update button states
  elements.startBtn.disabled = true;
  elements.pauseBtn.disabled = false;
  
  // Save to localStorage
  saveToLocalStorage('pomotodo_timer', appState.timer);
  
  // Update UI
  updateTimerDisplay();
}

function pauseTimer() {
  if (!appState.timer.isRunning) {
    return;
  }
  
  // Pause timer
  clearInterval(timerIntervalId);
  appState.timer.isPaused = true;
  appState.timer.isRunning = false;
  
  // Update button states
  elements.startBtn.disabled = false;
  elements.pauseBtn.disabled = true;
  
  // Save to localStorage
  saveToLocalStorage('pomotodo_timer', appState.timer);
  
  // Update UI
  updateTimerDisplay();
}

function resetTimer() {
  const confirmed = confirm('E007: タイマーをリセットしますか？');
  if (!confirmed) {
    return;
  }
  
  // Reset timer
  clearInterval(timerIntervalId);
  appState.timer.remainingTime = appState.timer.duration;
  appState.timer.isRunning = false;
  appState.timer.isPaused = false;
  appState.timer.currentTaskId = null;
  appState.timer.startedAt = null;
  
  // Update button states
  elements.startBtn.disabled = false;
  elements.pauseBtn.disabled = true;
  
  // Save to localStorage
  saveToLocalStorage('pomotodo_timer', appState.timer);
  
  // Update UI
  updateTimerDisplay();
}

function skipTimer() {
  // Stop current timer
  clearInterval(timerIntervalId);
  
  // Determine next mode and switch
  if (appState.timer.mode === 'work') {
    switchToBreak();
  } else {
    switchToWork();
  }
  
  // Save to localStorage
  saveToLocalStorage('pomotodo_timer', appState.timer);
  
  // Update UI
  updateTimerDisplay();
}

function updateTimer() {
  // Calculate actual elapsed time to account for system clock adjustments
  const actualElapsedTime = Math.floor((Date.now() - appState.timer.startedAt) / 1000);
  appState.timer.remainingTime = Math.max(0, appState.timer.duration - actualElapsedTime);
  
  // Check if timer completed
  if (appState.timer.remainingTime <= 0) {
    onTimerComplete();
    return;
  }
  
  // Update UI
  updateTimerDisplay();
}

function onTimerComplete() {
  // Play notification sound
  playNotificationSound();
  
  // Show browser notification
  showBrowserNotification('タイマーが終了しました');
  
  // Handle based on timer mode
  if (appState.timer.mode === 'work') {
    // Add to actual pomodoros for the current task
    const currentTask = appState.tasks.find(t => t.id === appState.timer.currentTaskId);
    if (currentTask) {
      currentTask.actualPomodoros = (currentTask.actualPomodoros || 0) + 1;
    }
    
    // Increment today's pomodoro count
    appState.timer.pomodoroCount++;
    
    // Check if we should take a long break
    const completedWorkSessions = appState.timer.pomodoroCount;
    if (completedWorkSessions % appState.settings.longBreakInterval === 0) {
      switchToLongBreak();
    } else {
      switchToShortBreak();
    }
  } else { // break mode
    switchToWork();
  }
  
  // Save to localStorage
  saveToLocalStorage('pomotodo_tasks', appState.tasks);
  saveToLocalStorage('pomotodo_timer', appState.timer);
  
  // Update UI
  renderTasks();
  updateTimerDisplay();
  updateStatistics();
}

function switchToWork() {
  appState.timer.mode = 'work';
  appState.timer.duration = appState.settings.workDuration * 60;
  appState.timer.remainingTime = appState.timer.duration;
  appState.timer.startedAt = Date.now();
  
  // Update display to show selected task
  const selectedTask = appState.tasks.find(t => t.id === appState.selectedTaskId);
  if (selectedTask) {
    elements.currentTask.textContent = `選択中: ${selectedTask.title}`;
    elements.currentTaskStat.textContent = selectedTask.title;
  }
  
  // Start timer automatically if it should continue running
  if (!appState.timer.isPaused) {
    clearInterval(timerIntervalId);
    timerIntervalId = setInterval(updateTimer, 1000);
  }
}

function switchToShortBreak() {
  appState.timer.mode = 'shortBreak';
  appState.timer.duration = appState.settings.shortBreakDuration * 60;
  appState.timer.remainingTime = appState.timer.duration;
  appState.timer.startedAt = Date.now();
  
  // Update display to show break mode
  elements.currentTask.textContent = '休憩中';
  elements.currentTaskStat.textContent = '休憩中';
  
  // Start timer automatically if it should continue running
  if (!appState.timer.isPaused) {
    clearInterval(timerIntervalId);
    timerIntervalId = setInterval(updateTimer, 1000);
  }
}

function switchToLongBreak() {
  appState.timer.mode = 'longBreak';
  appState.timer.duration = appState.settings.longBreakDuration * 60;
  appState.timer.remainingTime = appState.timer.duration;
  appState.timer.startedAt = Date.now();
  
  // Update display to show break mode
  elements.currentTask.textContent = '長い休憩中';
  elements.currentTaskStat.textContent = '長い休憩中';
  
  // Start timer automatically if it should continue running
  if (!appState.timer.isPaused) {
    clearInterval(timerIntervalId);
    timerIntervalId = setInterval(updateTimer, 1000);
  }
}

// Rendering Functions
function renderTasks() {
  // Get filtered tasks based on current filter state
  let filteredTasks = [];
  switch (appState.settings.filterState) {
    case 'active':
      filteredTasks = appState.tasks.filter(task => !task.completed);
      break;
    case 'completed':
      filteredTasks = appState.tasks.filter(task => task.completed);
      break;
    case 'all':
    default:
      filteredTasks = [...appState.tasks];
      break;
  }
  
  // Clear current task list
  elements.taskList.innerHTML = '';
  
  // Render each task
  filteredTasks.forEach(task => {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''} ${appState.selectedTaskId === task.id ? 'selected' : ''}`;
    li.dataset.id = task.id;
    
    // Create checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => toggleTaskComplete(task.id));
    
    // Create task title
    const titleSpan = document.createElement('span');
    titleSpan.className = 'task-title';
    titleSpan.textContent = task.title;
    
    // Add edit functionality on double click
    titleSpan.addEventListener('dblclick', () => {
      const newTitle = prompt('タスクを編集:', task.title);
      if (newTitle !== null) {
        editTask(task.id, newTitle.trim());
      }
    });
    
    // Create pomodoro count
    const pomodoroSpan = document.createElement('span');
    pomodoroSpan.className = 'pomodoro-count';
    pomodoroSpan.textContent = `🍅 ${task.actualPomodoros || 0}/${task.estimatedPomodoros}`;
    
    // Create action buttons container
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'task-actions';
    
    // Create edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.textContent = '✏️';
    editBtn.title = '編集';
    editBtn.addEventListener('click', () => {
      const newTitle = prompt('タスクを編集:', task.title);
      if (newTitle !== null) {
        editTask(task.id, newTitle.trim());
      }
    });
    
    // Create delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '✕';
    deleteBtn.title = '削除';
    deleteBtn.addEventListener('click', () => deleteTask(task.id));
    
    // Add event listener to select task on click
    li.addEventListener('click', (e) => {
      // Don't select if clicking on checkbox, edit, or delete button
      if (!e.target.classList.contains('task-checkbox') && 
          !e.target.classList.contains('edit-btn') && 
          !e.target.classList.contains('delete-btn')) {
        selectTask(task.id);
      }
    });
    
    // Append elements
    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);
    li.appendChild(checkbox);
    li.appendChild(titleSpan);
    li.appendChild(pomodoroSpan);
    li.appendChild(actionsDiv);
    elements.taskList.appendChild(li);
  });
}

function updateTimerDisplay() {
  // Format time for display
  elements.timerDisplay.textContent = formatTime(appState.timer.remainingTime);
  
  // Update timer mode display
  switch (appState.timer.mode) {
    case 'work':
      elements.timerMode.textContent = '作業中';
      elements.timerMode.style.color = '#e74c3c'; // var(--primary-red)
      break;
    case 'shortBreak':
    case 'longBreak':
      elements.timerMode.textContent = appState.timer.mode === 'longBreak' ? '長い休憩中' : '休憩中';
      elements.timerMode.style.color = '#27ae60'; // var(--primary-green)
      break;
    default:
      elements.timerMode.textContent = '準備中';
      elements.timerMode.style.color = '#6c757d'; // var(--text-secondary)
  }
  
  // Update progress bar
  const progressPercent = appState.timer.duration > 0 
    ? (1 - appState.timer.remainingTime / appState.timer.duration) * 100 
    : 0;
  elements.progressFill.style.width = `${progressPercent}%`;
  
  // Update current task display if available
  if (appState.timer.currentTaskId) {
    const currentTask = appState.tasks.find(t => t.id === appState.timer.currentTaskId);
    if (currentTask) {
      elements.currentTask.textContent = `選択中: ${currentTask.title}`;
      elements.currentTaskStat.textContent = currentTask.title;
    }
  }
  
  // Add pulse animation if timer is running
  if (appState.timer.isRunning) {
    elements.timerDisplay.classList.add('pulse');
  } else {
    elements.timerDisplay.classList.remove('pulse');
  }
}

function updateStatistics() {
  // Calculate stats
  const completedTasksCount = appState.tasks.filter(task => task.completed).length;
  const totalTasksCount = appState.tasks.length;
  const totalWorkTimeInMinutes = appState.timer.pomodoroCount * appState.settings.workDuration;
  const totalHours = Math.floor(totalWorkTimeInMinutes / 60);
  const totalMinutes = totalWorkTimeInMinutes % 60;
  
  // Update stats elements
  elements.todayPomodoros.textContent = appState.timer.pomodoroCount;
  elements.completedTasks.textContent = completedTasksCount;
  elements.totalTasks.textContent = totalTasksCount;
  elements.totalWorkTime.textContent = `${totalHours}h ${totalMinutes}m`;
  elements.totalPomodoros.textContent = appState.timer.pomodoroCount;
}

// Notification Functions
function showNotification(message, type) {
  elements.notification.textContent = message;
  elements.notification.className = `notification ${type}`;
  elements.notification.style.display = 'block';
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    elements.notification.style.display = 'none';
  }, 3000);
}

function playNotificationSound() {
  // Use Web Audio API for a simple beep sound
  if (appState.settings.notificationSound !== 'silent') {
    try {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 800;
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
      }, 200);
    } catch (e) {
      // Fallback: no sound if Web Audio API is not supported
      console.log("Could not play notification sound:", e);
    }
  }
}

function showBrowserNotification(message) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('PomoTodo', { 
      body: message,
      icon: '🍅',
      tag: 'pomotodo-timer'
    });
  }
}

// Utility Functions
function formatTime(seconds) {
  const mins = Math.floor(Math.abs(seconds) / 60);
  const secs = Math.abs(seconds) % 60;
  const sign = seconds < 0 ? '-' : '';
  
  return `${sign}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function validateInput(input, type) {
  switch (type) {
    case 'taskTitle':
      return input && input.length <= 100;
    case 'pomodoros':
      return input >= 1 && input <= 20;
    default:
      return !!input;
  }
}

// LocalStorage Functions
function saveToLocalStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    if (e instanceof QuotaExceededError) {
      showNotification('E005: 保存容量が不足しています', 'error');
    } else {
      console.error('LocalStorage error:', e);
    }
  }
}

function loadFromLocalStorage(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('LocalStorage error:', e);
    return null;
  }
}

function loadFromLocalStorage(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    showNotification(`E006: データ読み込みエラー (${key})`, 'error');
    return null;
  }
}

function loadAppData() {
  // Load tasks
  const savedTasks = loadFromLocalStorage('pomotodo_tasks');
  if (savedTasks) {
    appState.tasks = savedTasks;
  }
  
  // Load timer state
  const savedTimer = loadFromLocalStorage('pomotodo_timer');
  if (savedTimer) {
    appState.timer = { ...appState.timer, ...savedTimer };
  }
  
  // Load settings
  const savedSettings = loadFromLocalStorage('pomotodo_settings');
  if (savedSettings) {
    appState.settings = { ...appState.settings, ...savedSettings };
  }
}

function saveAppData() {
  saveToLocalStorage('pomotodo_tasks', appState.tasks);
  saveToLocalStorage('pomotodo_timer', appState.timer);
  saveToLocalStorage('pomotodo_settings', appState.settings);
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Handle page visibility changes to pause timer when tab is hidden
document.addEventListener('visibilitychange', () => {
  if (document.hidden && appState.timer.isRunning) {
    // Save the current timer state before pausing
    appState.timer.isPaused = true;
    appState.timer.isRunning = false;
    clearInterval(timerIntervalId);
    
    // Update button states
    elements.startBtn.disabled = false;
    elements.pauseBtn.disabled = true;
    
    // Save to localStorage
    saveToLocalStorage('pomotodo_timer', appState.timer);
    
    // Update UI
    updateTimerDisplay();
  }
});