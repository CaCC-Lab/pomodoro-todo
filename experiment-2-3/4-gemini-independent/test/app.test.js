
const fs = require('fs');
const path = require('path');

// HTMLファイルを読み込んでJSDOMに設定
const html = fs.readFileSync(path.resolve(__dirname, '../output/index.html'), 'utf8');

// DOMContentLoadedの前にjest.useFakeTimers()を呼び出す
jest.useFakeTimers();

describe('PomoTodo App', () => {
    let taskInput, taskForm, taskList, startBtn, pauseBtn, resetBtn, skipBtn, timerDisplay, currentTaskDisplay;

    beforeEach(() => {
        // 各テストの前にDOMをリセットし、スクリプトを再実行
        document.body.innerHTML = html;
        
        // localStorageとalertをクリア
        localStorage.clear();
        window.alert.mockClear();

        // スクリプトを読み込んで実行
        // requireを使うとモジュールキャッシュが効いてしまうため、
        // グローバルスコープで実行されるように工夫する
        const scriptContent = fs.readFileSync(path.resolve(__dirname, '../output/app.js'), 'utf8');
        eval(scriptContent);

        // DOM要素を再取得
        taskInput = document.getElementById('task-input');
        taskForm = document.getElementById('task-form');
        taskList = document.getElementById('task-list');
        startBtn = document.getElementById('start-btn');
        pauseBtn = document.getElementById('pause-btn');
        resetBtn = document.getElementById('reset-btn');
        skipBtn = document.getElementById('skip-btn');
        timerDisplay = document.getElementById('timer-display');
        currentTaskDisplay = document.getElementById('current-task-display');

        // DOMContentLoadedイベントを手動で発火
        document.dispatchEvent(new Event('DOMContentLoaded'));
    });

    // ----------------------------------------
    // Given: 初期状態
    // ----------------------------------------
    describe('Todo List Feature', () => {
        describe('Task Addition', () => {
            // Test Case: 正常系 - 有効なタスクを追加
            test('should add a new task to the top of the list', () => {
                // When: タスク名を入力し、フォームを送信
                taskInput.value = 'My First Task';
                taskForm.dispatchEvent(new Event('submit'));

                // Then: タスクがリストの先頭に追加される
                const tasks = taskList.querySelectorAll('.task-item');
                expect(tasks.length).toBe(1);
                expect(tasks[0].querySelector('.task-title').textContent).toBe('My First Task');
                expect(taskInput.value).toBe(''); // 入力欄がクリアされる
            });

            // Test Case: 異常系 - 空のタスクを追加
            test('should show an alert if task title is empty', () => {
                // When: 何も入力せずにフォームを送信
                taskInput.value = '';
                taskForm.dispatchEvent(new Event('submit'));

                // Then: アラートが表示され、タスクは追加されない
                expect(window.alert).toHaveBeenCalledWith('タスク名を入力してください');
                expect(taskList.children.length).toBe(0);
            });

            // Test Case: 異常系 - 空白のみのタスクを追加
            test('should show an alert if task title is only whitespace', () => {
                // When: 空白のみを入力してフォームを送信
                taskInput.value = '   ';
                taskForm.dispatchEvent(new Event('submit'));

                // Then: アラートが表示され、タスクは追加されない
                expect(window.alert).toHaveBeenCalledWith('タスク名を入力してください');
                expect(taskList.children.length).toBe(0);
            });

            // Test Case: 異常系 - 長すぎるタスクを追加
            test('should show an alert if task title is too long', () => {
                // When: 101文字のタスク名を入力してフォームを送信
                taskInput.value = 'a'.repeat(101);
                taskForm.dispatchEvent(new Event('submit'));

                // Then: アラートが表示され、タスクは追加されない
                expect(window.alert).toHaveBeenCalledWith('タスク名は100文字以内で入力してください');
                expect(taskList.children.length).toBe(0);
            });

            // Test Case: 正常系 - 境界値（100文字）のタスクを追加
            test('should allow adding a task with 100 characters', () => {
                // When: 100文字のタスク名を入力してフォームを送信
                const longTitle = 'b'.repeat(100);
                taskInput.value = longTitle;
                taskForm.dispatchEvent(new Event('submit'));

                // Then: タスクが正常に追加される
                expect(taskList.children.length).toBe(1);
                expect(taskList.querySelector('.task-title').textContent).toBe(longTitle);
            });
        });

        describe('Task Operations', () => {
            beforeEach(() => {
                // Given: 2つのタスクが存在する状態
                taskInput.value = 'Task 2';
                taskForm.dispatchEvent(new Event('submit'));
                taskInput.value = 'Task 1';
                taskForm.dispatchEvent(new Event('submit'));
            });

            // Test Case: 正常系 - タスクを完了にする
            test('should mark a task as completed', () => {
                // When: 最初のタスクのチェックボックスをクリック
                const firstTask = taskList.querySelector('.task-item');
                const checkbox = firstTask.querySelector('input[type="checkbox"]');
                checkbox.click();

                // Then: タスクに 'completed' クラスが付与される
                expect(firstTask.classList.contains('completed')).toBe(true);
            });

            // Test Case: 正常系 - タスクを削除する
            test('should remove a task from the list', () => {
                // When: 最初のタスクの削除ボタンをクリック
                const firstTask = taskList.querySelector('.task-item');
                const deleteBtn = firstTask.querySelector('.delete-btn');
                deleteBtn.click();

                // Then: アニメーションの後にタスクが削除される
                jest.runAllTimers(); // setTimeoutを即時実行
                expect(taskList.children.length).toBe(1);
                expect(taskList.querySelector('.task-title').textContent).toBe('Task 2');
            });

            // Test Case: 正常系 - タスクを選択する
            test('should select a task and update the current task display', () => {
                // When: 2番目のタスクをクリック
                const secondTask = taskList.querySelectorAll('.task-item')[1];
                secondTask.click();

                // Then: タスクが選択され、表示が更新される
                expect(secondTask.classList.contains('selected')).toBe(true);
                expect(currentTaskDisplay.textContent).toBe('実行中: Task 2');
            });
        });
    });

    describe('Timer Feature', () => {
        beforeEach(() => {
            // Given: タスクが1つ存在し、選択されている状態
            taskInput.value = 'Timer Task';
            taskForm.dispatchEvent(new Event('submit'));
            taskList.querySelector('.task-item').click();
        });

        // Test Case: 正常系 - タイマーを開始する
        test('should start the timer', () => {
            // When: 開始ボタンをクリック
            startBtn.click();

            // Then: 1秒後にタイマー表示が更新される
            expect(timerDisplay.textContent).toBe('25:00');
            jest.advanceTimersByTime(1000);
            expect(timerDisplay.textContent).toBe('24:59');
        });

        // Test Case: 正常系 - タイマーを一時停止・再開する
        test('should pause and resume the timer', () => {
            // When: タイマーを開始し、1秒後に一時停止
            startBtn.click();
            jest.advanceTimersByTime(1000);
            pauseBtn.click();
            const pausedTime = timerDisplay.textContent;
            expect(pausedTime).toBe('24:59');

            // When: さらに1秒経過させても時間は変わらない
            jest.advanceTimersByTime(1000);
            expect(timerDisplay.textContent).toBe(pausedTime);

            // When: 再開ボタン（startBtn）をクリック
            startBtn.click();
            jest.advanceTimersByTime(1000);

            // Then: タイマーが再開される
            expect(timerDisplay.textContent).toBe('24:58');
        });

        // Test Case: 正常系 - タイマーをリセットする
        test('should reset the timer', () => {
            // When: タイマーを開始し、数秒後にリセット
            startBtn.click();
            jest.advanceTimersByTime(5000);
            resetBtn.click();

            // Then: タイマーが初期値に戻り、停止する
            expect(timerDisplay.textContent).toBe('25:00');
            jest.advanceTimersByTime(2000);
            expect(timerDisplay.textContent).toBe('25:00'); // 時間は進まない
        });

        // Test Case: 異常系 - タスク未選択でタイマーを開始
        test('should not start timer if no task is selected', () => {
            // Given: タスクを未選択の状態にする
            const taskItem = taskList.querySelector('.task-item');
            const deleteBtn = taskItem.querySelector('.delete-btn');
            deleteBtn.click();
            jest.runAllTimers();

            // When: 開始ボタンをクリック
            startBtn.click();

            // Then: アラートが表示され、タイマーは開始しない
            expect(window.alert).toHaveBeenCalledWith('タイマーを開始するタスクを選択してください。');
            expect(timerDisplay.textContent).toBe('25:00');
            jest.advanceTimersByTime(1000);
            expect(timerDisplay.textContent).toBe('25:00');
        });

        // Test Case: 正常系 - モードをスキップする
        test('should skip to the next mode', () => {
            // When: スキップボタンをクリック
            expect(document.getElementById('timer-mode').textContent).toBe('作業中');
            skipBtn.click();

            // Then: 短い休憩モードに切り替わる
            expect(document.getElementById('timer-mode').textContent).toBe('短い休憩');
            expect(timerDisplay.textContent).toBe('05:00');
        });

        // Test Case: 正常系 - 4サイクル後に長い休憩に入る
        test('should switch to long break after 4 work cycles', () => {
            // When: 4回の作業サイクルを完了する
            for (let i = 0; i < 4; i++) {
                // 作業 -> 休憩
                skipBtn.click();
                // 休憩 -> 作業
                skipBtn.click();
            }

            // Then: 4回目の作業の後の休憩は「長い休憩」になる
            // 4回目の作業モードをスキップ
            skipBtn.click();
            expect(document.getElementById('timer-mode').textContent).toBe('長い休憩');
            expect(timerDisplay.textContent).toBe('15:00');
        });
    });

    describe('Data Persistence', () => {
        // Test Case: 正常系 - タスクがlocalStorageに保存される
        test('should save tasks to localStorage', () => {
            // When: タスクを追加する
            taskInput.value = 'Persistent Task';
            taskForm.dispatchEvent(new Event('submit'));

            // Then: localStorageにタスクが保存される
            const storedTasks = JSON.parse(localStorage.getItem('pomotodo_tasks'));
            expect(storedTasks).toHaveLength(1);
            expect(storedTasks[0].title).toBe('Persistent Task');
        });

        // Test Case: 正常系 - ページロード時にタスクが復元される
        test('should load tasks from localStorage on init', () => {
            // Given: localStorageにタスクデータを保存しておく
            const initialTasks = [{ id: 'task_1', title: 'Loaded Task', completed: false, actualPomodoros: 0 }];
            localStorage.setItem('pomotodo_tasks', JSON.stringify(initialTasks));

            // When: スクリプトを再初期化する
            document.body.innerHTML = html;
            const scriptContent = fs.readFileSync(path.resolve(__dirname, '../output/app.js'), 'utf8');
            eval(scriptContent);
            document.dispatchEvent(new Event('DOMContentLoaded'));

            // Then: タスクがリストに表示される
            const tasks = document.getElementById('task-list').querySelectorAll('.task-item');
            expect(tasks.length).toBe(1);
            expect(tasks[0].textContent).toContain('Loaded Task');
        });

        // Test Case: 異常系 - localStorageの読み込みに失敗する
        test('should handle localStorage parsing error gracefully', () => {
            // Given: 不正なJSONデータをlocalStorageに保存
            localStorage.setItem('pomotodo_tasks', 'invalid-json');

            // When: スクリプトを初期化
            const init = () => {
                document.body.innerHTML = html;
                const scriptContent = fs.readFileSync(path.resolve(__dirname, '../output/app.js'), 'utf8');
                eval(scriptContent);
                document.dispatchEvent(new Event('DOMContentLoaded'));
            };

            // Then: アラートが表示され、アプリはクラッシュしない
            expect(init).not.toThrow();
            expect(window.alert).toHaveBeenCalledWith('タスクの読み込みに失敗しました。');
            const tasks = document.getElementById('task-list').querySelectorAll('.task-item');
            expect(tasks.length).toBe(0); // タスクリストは空になる
        });
    });
});
