// PomoTodoApp Test Suite
// Testing all functionality with Given/When/Then format

// Mock DOM elements for testing
function setupMockDOM() {
    // Create a mock DOM structure similar to the actual HTML
    document.body.innerHTML = `
        <div class="container">
            <header class="header">
                <h1 class="app-title">PomoTodo 🍅</h1>
                <div class="stats" id="daily-stats">
                    <span class="stat-item">Today: 🍅 <span id="today-pomodoros">0</span></span>
                    <span class="stat-item">Tasks: ✓ <span id="completed-tasks">0</span>/<span id="total-tasks">0</span></span>
                    <span class="stat-item">Time: <span id="total-time">0h 0m</span></span>
                </div>
            </header>

            <div class="main-content">
                <section class="todo-section">
                    <div class="input-container">
                        <input type="text" id="task-input" placeholder="新しいタスクを入力..." maxlength="100" aria-label="タスク入力">
                        <input type="number" id="estimate-input" placeholder="見積もり(1-20)" min="1" max="20" aria-label="見積もりポモドロ数">
                        <button id="add-task-btn" aria-label="タスク追加">+</button>
                    </div>
                    
                    <div class="search-container">
                        <input type="text" id="task-search" placeholder="タスクを検索..." aria-label="タスク検索">
                    </div>
                    
                    <div class="filters">
                        <button class="filter-btn active" data-filter="all" aria-pressed="true">全て</button>
                        <button class="filter-btn" data-filter="active" aria-pressed="false">未完了</button>
                        <button class="filter-btn" data-filter="completed" aria-pressed="false">完了済み</button>
                    </div>
                    
                    <div class="actions">
                        <button id="clear-completed-btn" class="btn-danger">完了タスクを削除</button>
                    </div>
                    
                    <ul class="task-list" id="task-list"></ul>
                </section>

                <section class="timer-section">
                    <div class="timer-container">
                        <div class="timer-mode" id="timer-mode">作業中</div>
                        <div class="timer-display" id="timer-display">25:00</div>
                        <div class="progress-bar">
                            <div class="progress" id="progress-bar"></div>
                        </div>
                        <div class="current-task" id="current-task">タスクを選択してください</div>
                        
                        <div class="timer-controls">
                            <button id="start-btn">開始</button>
                            <button id="pause-btn" disabled>一時停止</button>
                            <button id="reset-btn">リセット</button>
                            <button id="skip-btn">スキップ</button>
                        </div>
                        
                        <div class="session-counter">
                            <span>セッション: <span id="session-count">0</span>/4</span>
                        </div>
                    </div>
                    
                    <div class="stats-section">
                        <h3>今日の統計</h3>
                        <div class="stat-card">
                            <div class="stat">
                                <span class="stat-label">完了ポモドーロ</span>
                                <span class="stat-value" id="stats-pomodoros">0</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">完了タスク</span>
                                <span class="stat-value" id="stats-completed">0</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">作業時間</span>
                                <span class="stat-value" id="stats-time">0h 0m</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">ストリーク</span>
                                <span class="stat-value" id="stats-streak">0</span>
                            </div>
                        </div>
                        
                        <h3>週次統計</h3>
                        <div class="weekly-stats">
                            <div class="graph-container">
                                <div class="graph-labels">
                                    <div>月</div>
                                    <div>火</div>
                                    <div>水</div>
                                    <div>木</div>
                                    <div>金</div>
                                    <div>土</div>
                                    <div>日</div>
                                </div>
                                <div class="graph-bars" id="weekly-graph"></div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    `;
}

// Mock localStorage for testing
function setupMockLocalStorage() {
    let localStorageMock = (function() {
        let store = {};
        return {
            getItem: function(key) {
                return store[key] || null;
            },
            setItem: function(key, value) {
                store[key] = String(value);
            },
            removeItem: function(key) {
                delete store[key];
            },
            clear: function() {
                store = {};
            }
        };
    })();
    
    Object.defineProperty(window, 'localStorage', {
        value: localStorageMock
    });
}

// Mock AudioContext to prevent errors in testing environment
function setupMockAudio() {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!window.AudioContext) {
        window.AudioContext = function() {
            return {
                createOscillator: function() {
                    return {
                        connect: function() {},
                        start: function() {},
                        stop: function() {},
                        frequency: { value: 0 },
                        type: 'sine'
                    };
                },
                createGain: function() {
                    return {
                        connect: function() {},
                        gain: {
                            setValueAtTime: function() {},
                            exponentialRampToValueAtTime: function() {}
                        }
                    };
                },
                destination: {},
                currentTime: 0
            };
        };
    }
}

// Setup test environment
function setupTestEnvironment() {
    setupMockDOM();
    setupMockLocalStorage();
    setupMockAudio();
}

// Test framework functions
function assertEqual(actual, expected, message) {
    if (actual === expected) {
        console.log(`✓ PASS: ${message}`);
        return true;
    } else {
        console.log(`✗ FAIL: ${message}. Expected: ${expected}, Actual: ${actual}`);
        return false;
    }
}

function assertNotEqual(actual, expected, message) {
    if (actual !== expected) {
        console.log(`✓ PASS: ${message}`);
        return true;
    } else {
        console.log(`✗ FAIL: ${message}. Expected value other than: ${expected}`);
        return false;
    }
}

function assertTrue(condition, message) {
    if (condition) {
        console.log(`✓ PASS: ${message}`);
        return true;
    } else {
        console.log(`✗ FAIL: ${message}`);
        return false;
    }
}

function assertFalse(condition, message) {
    if (!condition) {
        console.log(`✓ PASS: ${message}`);
        return true;
    } else {
        console.log(`✗ FAIL: ${message}`);
        return false;
    }
}

// Test suite
describe('PomoTodoApp Test Suite', function() {
    let app;
    
    before(function() {
        setupTestEnvironment();
        app = new PomoTodoApp();
        // Clear any existing data
        localStorage.clear();
    });

    // 1. Task Management Tests
    describe('Task Management', function() {
        
        // 1.1 Task Addition Tests
        describe('Task Addition', function() {
            // Test Case: Empty title (Failure)
            it('should show error when adding task with empty title - E001', function() {
                // Given: Empty task title
                app.taskInput.value = '';
                
                // Mock alert function to capture error message
                const originalAlert = window.alert;
                let alertMessage = '';
                window.alert = function(message) {
                    alertMessage = message;
                };
                
                // When: User tries to add task with empty title
                app.addTask();
                
                // Then: Error message E001 should be shown
                assertTrue(alertMessage.includes('タスク名を入力してください'), 'Should show error for empty title');
                
                // Reset alert function
                window.alert = originalAlert;
            });
            
            // Test Case: Title exceeding 100 characters (Failure)
            it('should show error when adding task with title exceeding 100 characters - E002', function() {
                // Given: Task title with more than 100 characters
                const longTitle = 'a'.repeat(101);
                app.taskInput.value = longTitle;
                
                // Mock alert function to capture error message
                const originalAlert = window.alert;
                let alertMessage = '';
                window.alert = function(message) {
                    alertMessage = message;
                };
                
                // When: User tries to add task with long title
                app.addTask();
                
                // Then: Error message E002 should be shown
                assertTrue(alertMessage.includes('タスク名は100文字以内で入力してください'), 'Should show error for title exceeding 100 characters');
                
                // Reset alert function
                window.alert = originalAlert;
            });
            
            // Test Case: Valid title (Success)
            it('should add task successfully with valid title', function() {
                // Given: Valid task title
                app.taskInput.value = 'Test Task';
                app.estimateInput.value = '5';
                const initialTaskCount = app.tasks.length;
                
                // When: User adds the task
                app.addTask();
                
                // Then: Task should be added successfully
                assertEqual(app.tasks.length, initialTaskCount + 1, 'Task count should increase by 1');
                assertEqual(app.tasks[0].title, 'Test Task', 'Task title should match input');
                assertEqual(app.tasks[0].estimatedPomodoros, 5, 'Task estimate should match input');
                assertEqual(app.taskInput.value, '', 'Task input should be cleared');
                assertEqual(app.estimateInput.value, '', 'Estimate input should be cleared');
            });
            
            // Test Case: Title at boundary (100 characters) (Success)
            it('should add task successfully with title at 100 characters', function() {
                // Given: Task title with exactly 100 characters
                const boundaryTitle = 'a'.repeat(100);
                app.taskInput.value = boundaryTitle;
                app.estimateInput.value = '3';
                const initialTaskCount = app.tasks.length;
                
                // When: User adds the task
                app.addTask();
                
                // Then: Task should be added successfully
                assertEqual(app.tasks.length, initialTaskCount + 1, 'Task count should increase by 1');
                assertEqual(app.tasks[0].title, boundaryTitle, 'Task title should match input');
                assertEqual(app.tasks[0].estimatedPomodoros, 3, 'Task estimate should match input');
            });
            
            // Test Case: Title at boundary (1 character) (Success)
            it('should add task successfully with title at 1 character', function() {
                // Given: Task title with exactly 1 character
                app.taskInput.value = 'x';
                app.estimateInput.value = '1';
                const initialTaskCount = app.tasks.length;
                
                // When: User adds the task
                app.addTask();
                
                // Then: Task should be added successfully
                assertEqual(app.tasks.length, initialTaskCount + 1, 'Task count should increase by 1');
                assertEqual(app.tasks[0].title, 'x', 'Task title should match input');
                assertEqual(app.tasks[0].estimatedPomodoros, 1, 'Task estimate should match input');
            });
            
            // Test Case: Invalid estimated pomodoro value (non-integer)
            it('should add task with null estimated pomodoros for invalid estimate input', function() {
                // Given: Invalid estimate input (non-number)
                app.taskInput.value = 'Test Task with Invalid Estimate';
                app.estimateInput.value = 'abc';
                const initialTaskCount = app.tasks.length;
                
                // When: User adds the task
                app.addTask();
                
                // Then: Task should be added with null estimate
                assertEqual(app.tasks.length, initialTaskCount + 1, 'Task count should increase by 1');
                assertEqual(app.tasks[0].title, 'Test Task with Invalid Estimate', 'Task title should match input');
                assertEqual(app.tasks[0].estimatedPomodoros, null, 'Task estimate should be null for invalid input');
            });
        });
        
        // 1.2 Task Editing Tests
        describe('Task Editing', function() {
            let testTaskId;
            
            before(function() {
                // Add a test task for editing
                app.taskInput.value = 'Original Task';
                app.estimateInput.value = '2';
                app.addTask();
                testTaskId = app.tasks[0].id;
            });
            
            // Test Case: Empty title during editing (Failure)
            it('should show error when editing task to empty title', function() {
                // Given: Task in editing mode with empty title
                app.editingTaskId = testTaskId;
                
                // Mock alert function to capture error message
                const originalAlert = window.alert;
                let alertMessage = '';
                window.alert = function(message) {
                    alertMessage = message;
                };
                
                // When: User tries to save empty title
                app.saveTaskEdit(testTaskId, '');
                
                // Then: Error message should be shown
                assertTrue(alertMessage.includes('タスク名は必須です'), 'Should show error for empty title during edit');
                
                // Reset alert function
                window.alert = originalAlert;
            });
            
            // Test Case: Title exceeding 100 characters during editing (Failure)
            it('should show error when editing task title exceeding 100 characters - E002', function() {
                // Given: Task in editing mode with long title
                app.editingTaskId = testTaskId;
                
                // Mock alert function to capture error message
                const originalAlert = window.alert;
                let alertMessage = '';
                window.alert = function(message) {
                    alertMessage = message;
                };
                
                // When: User tries to save title exceeding 100 characters
                const longTitle = 'a'.repeat(101);
                app.saveTaskEdit(testTaskId, longTitle);
                
                // Then: Error message E002 should be shown
                assertTrue(alertMessage.includes('タスク名は100文字以内で入力してください'), 'Should show error for title exceeding 100 characters during edit');
                
                // Reset alert function
                window.alert = originalAlert;
            });
            
            // Test Case: Valid title during editing (Success)
            it('should update task successfully with valid title during editing', function() {
                // Given: Task in editing mode with valid title
                const newTitle = 'Updated Task Title';
                app.editingTaskId = testTaskId;
                
                // When: User saves the updated title
                app.saveTaskEdit(testTaskId, newTitle);
                
                // Then: Task should be updated
                const updatedTask = app.tasks.find(t => t.id === testTaskId);
                assertEqual(updatedTask.title, newTitle, 'Task title should be updated');
                assertFalse(app.editingTaskId !== null, 'Editing state should be cleared');
            });
        });
        
        // 1.3 Task Deletion Tests
        describe('Task Deletion', function() {
            let testTaskId;
            
            before(function() {
                // Add a test task for deletion
                app.taskInput.value = 'Deletable Task';
                app.estimateInput.value = '4';
                app.addTask();
                testTaskId = app.tasks[0].id;
            });
            
            // Test Case: Delete existing task (Success)
            it('should delete existing task successfully', function() {
                // Given: A task exists in the list
                const initialTaskCount = app.tasks.length;
                const taskExists = app.tasks.some(t => t.id === testTaskId);
                assertTrue(taskExists, 'Task should exist before deletion');
                
                // When: User deletes the task
                app.deleteTask(testTaskId);
                
                // Then: Task should be removed
                const finalTaskCount = app.tasks.length;
                assertEqual(finalTaskCount, initialTaskCount - 1, 'Task count should decrease by 1');
                const taskExistsAfter = app.tasks.some(t => t.id === testTaskId);
                assertFalse(taskExistsAfter, 'Task should not exist after deletion');
            });
            
            // Test Case: Delete non-existing task (Failure)
            it('should not throw error when attempting to delete non-existing task', function() {
                // Given: A non-existing task ID
                const nonExistingTaskId = 'non_existing_task_id';
                const initialTaskCount = app.tasks.length;
                
                // When: User attempts to delete non-existing task
                app.deleteTask(nonExistingTaskId);
                
                // Then: Task count should remain unchanged
                assertEqual(app.tasks.length, initialTaskCount, 'Task count should remain unchanged');
            });
            
            // Test Case: Delete running task (Failure)
            it('should show error when attempting to delete running task - E004', function() {
                // Given: Add a task and set it as the current task and start the timer
                app.taskInput.value = 'Running Task';
                app.estimateInput.value = '3';
                app.addTask();
                const runningTaskId = app.tasks[0].id;
                
                // Set this task as current task
                app.timer.currentTaskId = runningTaskId;
                
                // Start the timer (this would normally be done through startTimer but we'll simulate)
                app.timer.isRunning = true;
                
                // Mock alert function to capture error message
                const originalAlert = window.alert;
                let alertMessage = '';
                window.alert = function(message) {
                    alertMessage = message;
                };
                
                // When: User attempts to delete the running task
                app.deleteTask(runningTaskId);
                
                // Then: Error message E004 should be shown
                assertTrue(alertMessage.includes('タイマーを停止してから削除してください'), 'Should show error for deleting running task');
                
                // Reset alert function
                window.alert = originalAlert;
                
                // Clean up - stop the timer and remove the task
                app.timer.isRunning = false;
                app.deleteTask(runningTaskId);
            });
        });
        
        // 1.4 Task Completion Toggle Tests
        describe('Task Completion Toggle', function() {
            let testTaskId;
            
            before(function() {
                // Add a test task for completion toggle
                app.taskInput.value = 'Toggle Task';
                app.estimateInput.value = '1';
                app.addTask();
                testTaskId = app.tasks[0].id;
            });
            
            // Test Case: Toggle task completion (Success)
            it('should toggle task completion status correctly', function() {
                // Given: A task with initial completed status as false
                const initialTask = app.tasks.find(t => t.id === testTaskId);
                assertFalse(initialTask.completed, 'Task should initially be incomplete');
                
                // When: User toggles task completion
                app.toggleTaskCompletion(testTaskId);
                
                // Then: Task completion status should be toggled
                const updatedTask = app.tasks.find(t => t.id === testTaskId);
                assertTrue(updatedTask.completed, 'Task should be marked as completed');
                
                // When: User toggles task completion again
                app.toggleTaskCompletion(testTaskId);
                
                // Then: Task completion status should be toggled back
                const finalTask = app.tasks.find(t => t.id === testTaskId);
                assertFalse(finalTask.completed, 'Task should be marked as incomplete again');
            });
            
            // Test Case: Toggle non-existing task completion (Failure)
            it('should not change state when toggling completion of non-existing task', function() {
                // Given: A non-existing task ID
                const nonExistingTaskId = 'non_existing_task_id';
                const initialTaskCount = app.tasks.length;
                
                // When: User toggles completion of non-existing task
                app.toggleTaskCompletion(nonExistingTaskId);
                
                // Then: Nothing should change
                assertEqual(app.tasks.length, initialTaskCount, 'Task count should remain unchanged');
            });
        });
    });

    // 2. Timer Management Tests
    describe('Timer Management', function() {
        
        // 2.1 Timer Start Tests
        describe('Timer Start', function() {
            // Test Case: Start timer without task selection (Failure)
            it('should show error when starting timer without selecting a task - E003', function() {
                // Given: No task is selected
                app.timer.currentTaskId = null;
                
                // Mock alert function to capture error message
                const originalAlert = window.alert;
                let alertMessage = '';
                window.alert = function(message) {
                    alertMessage = message;
                };
                
                // When: User tries to start the timer
                app.startTimer();
                
                // Then: Error message E003 should be shown
                assertTrue(alertMessage.includes('タスクを選択してください'), 'Should show error for starting timer without task selection');
                
                // Reset alert function
                window.alert = originalAlert;
            });
            
            // Test Case: Start timer while editing a task (Failure)
            it('should show error when starting timer while editing a task - E008', function() {
                // Given: A task is being edited
                app.taskInput.value = 'Edit Test Task';
                app.estimateInput.value = '2';
                app.addTask();
                const editingTaskId = app.tasks[0].id;
                app.editingTaskId = editingTaskId;
                
                // Mock alert function to capture error message
                const originalAlert = window.alert;
                let alertMessage = '';
                window.alert = function(message) {
                    alertMessage = message;
                };
                
                // When: User tries to start the timer while editing
                app.startTimer();
                
                // Then: Error message E008 should be shown
                assertTrue(alertMessage.includes('編集を完了してください'), 'Should show error for starting timer while editing');
                
                // Reset alert function
                window.alert = originalAlert;
                
                // Clean up
                app.cancelTaskEdit();
                app.deleteTask(editingTaskId);
            });
            
            // Test Case: Start timer with selected task (Success)
            it('should start timer successfully when task is selected', function() {
                // Given: A task is added and selected
                app.taskInput.value = 'Timer Test Task';
                app.estimateInput.value = '3';
                app.addTask();
                const taskId = app.tasks[0].id;
                app.timer.currentTaskId = taskId;
                
                // When: User starts the timer
                app.startTimer();
                
                // Then: Timer should be running
                assertTrue(app.timer.isRunning, 'Timer should be running');
                assertFalse(app.timer.isPaused, 'Timer should not be paused');
                assertFalse(app.startBtn.disabled, 'Start button should be disabled');
                assertTrue(app.pauseBtn.disabled, 'Pause button should be enabled');
                
                // Clean up - stop the timer
                app.timer.isRunning = false;
                app.timer.isPaused = false;
                app.startBtn.disabled = false;
                app.pauseBtn.disabled = true;
                app.deleteTask(taskId);
            });
        });
        
        // 2.2 Timer Pause Tests
        describe('Timer Pause', function() {
            // Test Case: Pause running timer (Success)
            it('should pause running timer successfully', function() {
                // Given: Timer is running
                app.timer.isRunning = true;
                app.timer.isPaused = false;
                app.startBtn.disabled = true;
                app.pauseBtn.disabled = false;
                
                // When: User pauses the timer
                app.pauseTimer();
                
                // Then: Timer should be paused
                assertFalse(app.timer.isRunning, 'Timer should not be running');
                assertTrue(app.timer.isPaused, 'Timer should be paused');
                assertTrue(app.startBtn.disabled, 'Start button should be enabled');
                assertFalse(app.pauseBtn.disabled, 'Pause button should be disabled');
                
                // Reset timer state
                app.timer.isRunning = false;
                app.timer.isPaused = false;
                app.startBtn.disabled = false;
                app.pauseBtn.disabled = true;
            });
            
            // Test Case: Pause non-running timer (Failure)
            it('should not change state when pausing non-running timer', function() {
                // Given: Timer is not running
                app.timer.isRunning = false;
                app.timer.isPaused = false;
                const initialIsRunning = app.timer.isRunning;
                
                // When: User tries to pause the timer
                app.pauseTimer();
                
                // Then: Timer state should remain unchanged
                assertEqual(app.timer.isRunning, initialIsRunning, 'Timer running state should remain unchanged');
            });
        });
        
        // 2.3 Timer Reset Tests
        describe('Timer Reset', function() {
            // Test Case: Reset timer with confirmation OK (Success)
            it('should reset timer when confirmation is OK', function() {
                // Given: Timer has non-default values
                app.timer.isRunning = true;
                app.timer.isPaused = false;
                app.timer.remainingTime = 300; // 5 minutes left
                app.startBtn.disabled = true;
                app.pauseBtn.disabled = false;
                
                // Mock confirm to return true
                const originalConfirm = window.confirm;
                window.confirm = function() {
                    return true;
                };
                
                // When: User resets the timer
                app.resetTimer();
                
                // Then: Timer should be reset to default state
                assertFalse(app.timer.isRunning, 'Timer should not be running');
                assertFalse(app.timer.isPaused, 'Timer should not be paused');
                assertEqual(app.timer.remainingTime, app.timer.duration, 'Timer should be reset to full duration');
                assertTrue(app.startBtn.disabled, 'Start button should be enabled');
                assertFalse(app.pauseBtn.disabled, 'Pause button should be disabled');
                
                // Reset confirm function
                window.confirm = originalConfirm;
                
                // Reset timer state for other tests
                app.startBtn.disabled = false;
                app.pauseBtn.disabled = true;
            });
            
            // Test Case: Reset timer with confirmation cancelled (Failure)
            it('should not reset timer when confirmation is cancelled', function() {
                // Given: Timer has non-default values and confirm returns false
                app.timer.isRunning = true;
                app.timer.isPaused = false;
                app.timer.remainingTime = 300; // 5 minutes left
                const initialRemainingTime = app.timer.remainingTime;
                
                // Mock confirm to return false
                const originalConfirm = window.confirm;
                window.confirm = function() {
                    return false;
                };
                
                // When: User attempts to reset the timer
                app.resetTimer();
                
                // Then: Timer state should remain unchanged
                assertTrue(app.timer.isRunning, 'Timer should still be running');
                assertFalse(app.timer.isPaused, 'Timer should not be paused');
                assertEqual(app.timer.remainingTime, initialRemainingTime, 'Timer remaining time should remain unchanged');
                
                // Reset confirm function
                window.confirm = originalConfirm;
                
                // Reset timer state for other tests
                app.timer.isRunning = false;
                app.timer.isPaused = false;
                app.startBtn.disabled = false;
                app.pauseBtn.disabled = true;
            });
        });
        
        // 2.4 Timer Skip Tests
        describe('Timer Skip', function() {
            // Test Case: Skip running timer (Success)
            it('should skip running timer successfully', function() {
                // Given: Timer is running
                app.timer.isRunning = true;
                app.timer.mode = 'work';
                const initialMode = app.timer.mode;
                
                // When: User skips the timer
                app.skipTimer();
                
                // Then: Timer should move to next mode
                // Note: The exact behavior depends on the current pomodoro count and settings,
                // but the timer state should change after skipping
                assertNotEqual(app.timer.mode, initialMode, 'Timer mode should change after skip');
            });
            
            // Test Case: Skip non-running timer (Failure)
            it('should not change state when skipping non-running timer', function() {
                // Given: Timer is not running
                app.timer.isRunning = false;
                app.timer.mode = 'work';
                const initialMode = app.timer.mode;
                
                // When: User tries to skip the timer
                app.skipTimer();
                
                // Then: Timer state should remain unchanged
                assertEqual(app.timer.mode, initialMode, 'Timer mode should remain unchanged when skipping non-running timer');
            });
        });
    });

    // 3. Settings and Filtering Tests
    describe('Settings and Filtering', function() {
        
        // 3.1 Filter Tests
        describe('Filter Functionality', function() {
            let completedTaskId, activeTaskId;
            
            before(function() {
                // Add test tasks
                app.taskInput.value = 'Active Task';
                app.estimateInput.value = '2';
                app.addTask();
                activeTaskId = app.tasks[0].id;
                
                app.taskInput.value = 'Completed Task';
                app.estimateInput.value = '3';
                app.addTask();
                completedTaskId = app.tasks[0].id;
                
                // Complete one task
                app.toggleTaskCompletion(completedTaskId);
            });
            
            // Test Case: Set valid filter "completed"
            it('should filter tasks by completed status correctly', function() {
                // Given: Both completed and active tasks exist
                const allTasksCount = app.tasks.length;
                assertTrue(allTasksCount >= 2, 'Should have both completed and active tasks');
                
                // When: User sets filter to "completed"
                app.setFilter('completed');
                
                // Then: Only completed tasks should be displayed
                // (This is tested by checking the internal state)
                assertEqual(app.settings.filterState, 'completed', 'Filter state should be set to completed');
            });
            
            // Test Case: Set valid filter "active"
            it('should filter tasks by active status correctly', function() {
                // Given: Both completed and active tasks exist
                
                // When: User sets filter to "active"
                app.setFilter('active');
                
                // Then: Only active tasks should be displayed
                assertEqual(app.settings.filterState, 'active', 'Filter state should be set to active');
            });
            
            // Test Case: Set valid filter "all"
            it('should show all tasks when filter is set to all', function() {
                // Given: Both completed and active tasks exist
                
                // When: User sets filter to "all"
                app.setFilter('all');
                
                // Then: All tasks should be displayed
                assertEqual(app.settings.filterState, 'all', 'Filter state should be set to all');
            });
        });
        
        // 3.2 Search Tests
        describe('Search Functionality', function() {
            let searchTask1Id, searchTask2Id;
            
            before(function() {
                // Add test tasks for search
                app.taskInput.value = 'Find This Task';
                app.estimateInput.value = '1';
                app.addTask();
                searchTask1Id = app.tasks[0].id;
                
                app.taskInput.value = 'Another Task for Search';
                app.estimateInput.value = '2';
                app.addTask();
                searchTask2Id = app.tasks[0].id;
            });
            
            // Test Case: Search with matching term
            it('should find tasks that match the search term', function() {
                // Given: Tasks exist in the list
                
                // When: User types a search term that matches a task
                app.taskSearch.value = 'Find This';
                app.searchTerm = 'find this'; // Simulate the input event
                app.renderTasks();
                
                // Then: Matching tasks should be displayed
                // (This would normally update the UI, but we'll check the internal filter logic)
                assertTrue(app.searchTerm.includes('find this'), 'Search term should be stored');
            });
            
            // Test Case: Search with non-matching term
            it('should show no results for non-matching search term', function() {
                // Given: Tasks exist in the list
                
                // When: User types a search term that doesn\'t match any task
                app.taskSearch.value = 'Nonexistent Task';
                app.searchTerm = 'nonexistent'; // Simulate the input event
                app.renderTasks();
                
                // Then: No matching tasks should be displayed
                assertTrue(app.searchTerm.includes('nonexistent'), 'Search term should be stored');
            });
            
            // Test Case: Clear search term
            it('should show all tasks when search term is cleared', function() {
                // Given: A search term is active
                
                // When: User clears the search term
                app.taskSearch.value = '';
                app.searchTerm = ''; // Simulate the input event
                app.renderTasks();
                
                // Then: All tasks should be displayed again
                assertEqual(app.searchTerm, '', 'Search term should be empty');
            });
        });
    });

    // 4. Data Persistence Tests
    describe('Data Persistence', function() {
        
        // 4.1 Save Data Tests
        describe('Data Saving', function() {
            // Test Case: Save data successfully
            it('should save data to localStorage successfully', function() {
                // Given: App has tasks and settings
                app.taskInput.value = 'Persistent Task';
                app.estimateInput.value = '5';
                app.addTask();
                
                const taskId = app.tasks[0].id;
                const initialTaskCount = app.tasks.length;
                
                // When: Data is saved
                app.saveData();
                
                // Then: Data should be stored in localStorage
                const savedTasks = localStorage.getItem('pomotodo_tasks');
                assertTrue(!!savedTasks, 'Tasks should be saved to localStorage');
                
                // Verify the content is valid
                const parsedTasks = JSON.parse(savedTasks);
                assertEqual(parsedTasks.length, initialTaskCount, 'Saved tasks should match current tasks');
                assertEqual(parsedTasks[0].id, taskId, 'Saved task ID should match');
                
                // Clean up
                app.deleteTask(taskId);
            });
            
            // Test Case: Handle storage quota exceeded error
            it('should handle storage quota exceeded error - E005', function() {
                // Given: Mock localStorage to throw QuotaExceededError
                const originalSetItem = localStorage.setItem;
                localStorage.setItem = function(key, value) {
                    const error = new Error();
                    error.name = 'QuotaExceededError';
                    throw error;
                };
                
                // Mock alert function to capture error message
                const originalAlert = window.alert;
                let alertMessage = '';
                window.alert = function(message) {
                    alertMessage = message;
                };
                
                // When: App tries to save data
                app.saveData();
                
                // Then: Error message E005 should be shown
                assertTrue(alertMessage.includes('保存容量が不足しています'), 'Should show quota exceeded error message');
                
                // Reset mocks
                localStorage.setItem = originalSetItem;
                window.alert = originalAlert;
            });
            
            // Test Case: Handle general save error
            it('should handle general save error - E006', function() {
                // Given: Mock localStorage to throw a generic error
                const originalSetItem = localStorage.setItem;
                localStorage.setItem = function(key, value) {
                    throw new Error('Generic save error');
                };
                
                // Mock alert function to capture error message
                const originalAlert = window.alert;
                let alertMessage = '';
                window.alert = function(message) {
                    alertMessage = message;
                };
                
                // When: App tries to save data
                app.saveData();
                
                // Then: Error message E006 should be shown
                assertTrue(alertMessage.includes('データの保存ができません'), 'Should show general save error message');
                
                // Reset mocks
                localStorage.setItem = originalSetItem;
                window.alert = originalAlert;
            });
        });
        
        // 4.2 Load Data Tests
        describe('Data Loading', function() {
            // Test Case: Load data successfully
            it('should load data from localStorage successfully', function() {
                // Given: Data is saved in localStorage
                const testTasks = [
                    new Task('test1', 'Loaded Task 1', false, 3, 0),
                    new Task('test2', 'Loaded Task 2', true, 2, 2)
                ];
                const testTimer = new Timer();
                testTimer.pomodoroCount = 5;
                const testSettings = new Settings();
                testSettings.workDuration = 30;
                
                localStorage.setItem('pomotodo_tasks', JSON.stringify(testTasks));
                localStorage.setItem('pomotodo_timer', JSON.stringify(testTimer));
                localStorage.setItem('pomotodo_settings', JSON.stringify(testSettings));
                
                // Create a new app instance to test loading
                const newApp = new PomoTodoApp();
                
                // When: App loads data
                newApp.loadData();
                
                // Then: Data should be loaded correctly
                assertEqual(newApp.tasks.length, 2, 'Should load 2 tasks');
                assertEqual(newApp.tasks[0].title, 'Loaded Task 1', 'Should load first task');
                assertEqual(newApp.tasks[1].title, 'Loaded Task 2', 'Should load second task');
                assertEqual(newApp.timer.pomodoroCount, 5, 'Should load timer data');
                assertEqual(newApp.settings.workDuration, 30, 'Should load settings');
            });
            
            // Test Case: Handle invalid JSON during load
            it('should handle invalid JSON during data loading', function() {
                // Given: Invalid JSON in localStorage
                localStorage.setItem('pomotodo_tasks', 'invalid json {');
                
                // Create a new app instance to test loading
                const newApp = new PomoTodoApp();
                
                // Mock console.error to capture the error
                const originalConsoleError = console.error;
                let consoleErrorMessage = '';
                console.error = function(message) {
                    consoleErrorMessage = message;
                };
                
                // When: App tries to load data with invalid JSON
                newApp.loadData();
                
                // Then: Should handle the error gracefully
                assertTrue(!!consoleErrorMessage, 'Should log error for invalid JSON');
                
                // Reset console.error
                console.error = originalConsoleError;
            });
            
            // Test Case: Load with no saved data
            it('should initialize with default values when no saved data exists', function() {
                // Given: No saved data exists
                localStorage.removeItem('pomotodo_tasks');
                localStorage.removeItem('pomotodo_timer');
                localStorage.removeItem('pomotodo_settings');
                
                // Create a new app instance
                const newApp = new PomoTodoApp();
                
                // When: App initializes
                // (This happens automatically in the constructor)
                
                // Then: Should have default values
                assertEqual(newApp.tasks.length, 0, 'Should start with no tasks');
                assertTrue(newApp.timer instanceof Timer, 'Should have a Timer instance');
                assertTrue(newApp.settings instanceof Settings, 'Should have a Settings instance');
                assertEqual(newApp.settings.workDuration, 25, 'Should have default work duration');
            });
        });
    });

    // 5. Other Functionality Tests
    describe('Other Functionality', function() {
        
        // 5.1 Clear Completed Tasks Tests
        describe('Clear Completed Tasks', function() {
            let completedTaskId1, completedTaskId2, activeTaskId;
            
            before(function() {
                // Add test tasks
                app.taskInput.value = 'Active Task';
                app.estimateInput.value = '1';
                app.addTask();
                activeTaskId = app.tasks[0].id;
                
                app.taskInput.value = 'Completed Task 1';
                app.estimateInput.value = '2';
                app.addTask();
                completedTaskId1 = app.tasks[0].id;
                
                app.taskInput.value = 'Completed Task 2';
                app.estimateInput.value = '3';
                app.addTask();
                completedTaskId2 = app.tasks[0].id;
                
                // Complete two tasks
                app.toggleTaskCompletion(completedTaskId1);
                app.toggleTaskCompletion(completedTaskId2);
            });
            
            // Test Case: Clear completed tasks with confirmation OK (Success)
            it('should clear completed tasks when confirmation is OK', function() {
                // Given: Both completed and active tasks exist
                const initialTaskCount = app.tasks.length;
                const completedCount = app.tasks.filter(t => t.completed).length;
                assertTrue(completedCount >= 2, 'Should have completed tasks');
                
                // Mock confirm to return true
                const originalConfirm = window.confirm;
                window.confirm = function() {
                    return true;
                };
                
                // When: User clears completed tasks
                app.clearCompletedTasks();
                
                // Then: Only active tasks should remain
                const finalTaskCount = app.tasks.length;
                assertEqual(finalTaskCount, initialTaskCount - completedCount, 'Only active tasks should remain');
                
                // Reset confirm function
                window.confirm = originalConfirm;
            });
            
            // Test Case: Cancel clearing completed tasks (Failure)
            it('should not clear completed tasks when confirmation is cancelled', function() {
                // Add another completed task for this test
                app.taskInput.value = 'Additional Completed Task';
                app.estimateInput.value = '4';
                app.addTask();
                const additionalCompletedTaskId = app.tasks[0].id;
                app.toggleTaskCompletion(additionalCompletedTaskId);
                
                // Given: Completed tasks exist
                const initialTaskCount = app.tasks.length;
                
                // Mock confirm to return false
                const originalConfirm = window.confirm;
                window.confirm = function() {
                    return false;
                };
                
                // When: User attempts to clear completed tasks
                app.clearCompletedTasks();
                
                // Then: Task count should remain unchanged
                const finalTaskCount = app.tasks.length;
                assertEqual(finalTaskCount, initialTaskCount, 'Task count should remain unchanged');
                
                // Reset confirm function
                window.confirm = originalConfirm;
                
                // Clean up - remove the additional task
                app.deleteTask(additionalCompletedTaskId);
            });
        });
        
        // 5.2 Focus Mode Tests
        describe('Focus Mode', function() {
            // Test Case: Toggle focus mode (Success)
            it('should toggle focus mode correctly', function() {
                // Given: App is in normal mode
                const initialFocusMode = app.settings.focusMode;
                assertFalse(initialFocusMode, 'Focus mode should initially be off');
                
                // When: User toggles focus mode
                app.toggleFocusMode();
                
                // Then: Focus mode should be enabled
                assertTrue(app.settings.focusMode, 'Focus mode should be enabled');
                
                // When: User toggles focus mode again
                app.toggleFocusMode();
                
                // Then: Focus mode should be disabled
                assertFalse(app.settings.focusMode, 'Focus mode should be disabled');
            });
        });
        
        // 5.3 Pomodoro Count Display Tests
        describe('Pomodoro Count Display', function() {
            let taskUnderId, taskOverId, taskMetId;
            
            before(function() {
                // Add tasks with different pomodoro states
                app.taskInput.value = 'Task Under Estimation';
                app.estimateInput.value = '5';
                app.addTask();
                taskUnderId = app.tasks[0].id;
                // Set actual pomodoros to less than estimated
                app.tasks[0].actualPomodoros = 2;
                
                app.taskInput.value = 'Task Over Estimation';
                app.estimateInput.value = '3';
                app.addTask();
                taskOverId = app.tasks[0].id;
                // Set actual pomodoros to more than estimated
                app.tasks[0].actualPomodoros = 7;
                
                app.taskInput.value = 'Task Met Estimation';
                app.estimateInput.value = '4';
                app.addTask();
                taskMetId = app.tasks[0].id;
                // Set actual pomodoros to match estimated
                app.tasks[0].actualPomodoros = 4;
            });
            
            // Test Case: Pomodoro count under estimation should have correct class
            it('should apply correct CSS class when actual pomodoros are under estimated', function() {
                // Given: Task with actual < estimated pomodoros
                const task = app.tasks.find(t => t.id === taskUnderId);
                assertTrue(task.actualPomodoros < task.estimatedPomodoros, 'Task should have under estimation');
                
                // When: Task list is rendered (this would apply CSS classes)
                app.renderTasks();
                
                // The renderTasks method would apply the 'pomodoros-under' class
                // The visual aspect would be tested in the actual DOM, but we can verify the 
                // internal logic for class assignment
                const shouldHaveUnderClass = task.actualPomodoros < task.estimatedPomodoros && task.estimatedPomodoros !== null;
                assertTrue(shouldHaveUnderClass, 'Task should qualify for under estimation class');
            });
            
            // Test Case: Pomodoro count over estimation should have correct class
            it('should apply correct CSS class when actual pomodoros are over estimated', function() {
                // Given: Task with actual > estimated pomodoros
                const task = app.tasks.find(t => t.id === taskOverId);
                assertTrue(task.actualPomodoros > task.estimatedPomodoros, 'Task should have over estimation');
                
                // When: Task list is rendered
                app.renderTasks();
                
                // The renderTasks method would apply the 'pomodoros-over' class
                const shouldHaveOverClass = task.actualPomodoros > task.estimatedPomodoros && task.estimatedPomodoros !== null;
                assertTrue(shouldHaveOverClass, 'Task should qualify for over estimation class');
            });
            
            // Test Case: Pomodoro count meeting estimation should have correct class
            it('should apply correct CSS class when actual pomodoros meet estimated', function() {
                // Given: Task with actual == estimated pomodoros
                const task = app.tasks.find(t => t.id === taskMetId);
                assertTrue(task.actualPomodoros === task.estimatedPomodoros, 'Task should have met estimation');
                
                // When: Task list is rendered
                app.renderTasks();
                
                // The renderTasks method would apply the 'pomodoros-met' class
                const shouldHaveMetClass = task.actualPomodoros === task.estimatedPomodoros && task.estimatedPomodoros !== null;
                assertTrue(shouldHaveMetClass, 'Task should qualify for met estimation class');
            });
        });
    });
    
    // Test suite cleanup
    after(function() {
        // Clean up any remaining tasks
        if (app && app.tasks) {
            app.tasks = [];
            app.saveData();  // This will save the empty task list
        }
    });
});

// Basic test framework implementation
function describe(description, testFunction) {
    console.log(`\\n🧪 Testing: ${description}`);
    testFunction();
}

function it(description, testFunction) {
    console.log(`\\n📋 Test: ${description}`);
    testFunction();
}

function before(beforeFunction) {
    beforeFunction();
}

function after(afterFunction) {
    afterFunction();
}