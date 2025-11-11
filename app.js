// ========================================
// ШКОЛА 1430 - ПРОЕКТ "САПЁР"
// Разработано учениками инженерного класса
// Год: 2025
// ========================================

/**
 * Основной объект игры
 * Содержит всё состояние игры и методы управления
 */
const Game = {
    // Состояние игры
    mode: null, // 'classic' или 'tournament'
    currentPlayer: 1,
    currentRound: 1,
    field: [],
    mines: [],
    fieldSize: { rows: 6, cols: 8 },
    minesCount: 8,
    openedCells: 0,
    totalCells: 0,
    timer: 0,
    timerInterval: null,
    
    // Очки игроков
    scores: {
        player1: 0,
        player2: 0
    },
    
    // Настройки
    soundEnabled: true,
    darkTheme: false,
    
    /**
     * Инициализация игры
     * Вызывается при загрузке страницы
     */
    init() {
        console.log('🎮 Инициализация игры "Сапёр" - Школа 1430');
        this.setupEventListeners();
        this.detectScreenSize();
        this.loadSettings();
        this.showScreen('modeScreen');
    },
    
    /**
     * Настройка всех обработчиков событий
     */
    setupEventListeners() {
        // Кнопки выбора режима
        document.getElementById('classicModeBtn').addEventListener('click', () => {
            this.startMode('classic');
        });
        
        document.getElementById('tournamentModeBtn').addEventListener('click', () => {
            this.startMode('tournament');
        });
        
        // Кнопка начала игры
        document.getElementById('startGameBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        // Кнопки результатов
        document.getElementById('nextRoundBtn').addEventListener('click', () => {
            this.nextRound();
        });
        
        document.getElementById('newGameBtn').addEventListener('click', () => {
            this.resetGame();
        });
        
        // Переключатель темы
        document.getElementById('themeToggle').addEventListener('change', (e) => {
            this.toggleTheme(e.target.checked);
        });
        
        // Переключатель звука
        document.getElementById('soundToggle').addEventListener('change', (e) => {
            this.soundEnabled = e.target.checked;
            this.saveSettings();
        });
        
        // Адаптация при изменении размера окна
        window.addEventListener('resize', () => {
            this.detectScreenSize();
        });
    },
    
    /**
     * Определение размера экрана и адаптация поля
     * Автоматически подбирает размер поля в зависимости от ширины экрана
     */
    detectScreenSize() {
        const width = window.innerWidth;
        
        if (width >= 1024) {
            // Десктоп
            this.fieldSize = { rows: 10, cols: 12 };
            this.minesCount = 18;
        } else if (width >= 768) {
            // Планшет
            this.fieldSize = { rows: 8, cols: 10 };
            this.minesCount = 12;
        } else {
            // Мобильный
            this.fieldSize = { rows: 6, cols: 8 };
            this.minesCount = 8;
        }
        
        this.totalCells = this.fieldSize.rows * this.fieldSize.cols;
        console.log(`📱 Размер экрана: ${width}px, Поле: ${this.fieldSize.rows}x${this.fieldSize.cols}`);
    },
    
    /**
     * Начало игры в выбранном режиме
     * @param {string} mode - 'classic' или 'tournament'
     */
    startMode(mode) {
        this.mode = mode;
        this.currentPlayer = 1;
        this.currentRound = 1;
        this.scores.player1 = 0;
        this.scores.player2 = 0;
        
        console.log(`🎯 Режим игры: ${mode}`);
        this.playSound('start');
        this.setupMines();
    },
    
    /**
     * Настройка экрана расстановки мин
     * Первый игрок расставляет мины на поле
     */
    setupMines() {
        this.showScreen('setupScreen');
        this.updatePlayerIndicator();
        this.mines = [];
        
        // Обновление счётчика мин
        document.getElementById('minesLeft').textContent = this.minesCount;
        document.getElementById('startGameBtn').disabled = true;
        
        // Создание поля для расстановки
        const setupField = document.getElementById('setupField');
        setupField.innerHTML = '';
        setupField.style.gridTemplateColumns = `repeat(${this.fieldSize.cols}, var(--cell-size))`;
        
        for (let i = 0; i < this.totalCells; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = i;
            
            // Обработчик клика для расстановки мин
            cell.addEventListener('click', () => {
                this.toggleMine(i, cell);
            });
            
            setupField.appendChild(cell);
        }
    },
    
    /**
     * Переключение мины в ячейке
     * @param {number} index - индекс ячейки
     * @param {HTMLElement} cell - элемент ячейки
     */
    toggleMine(index, cell) {
        const mineIndex = this.mines.indexOf(index);
        
        if (mineIndex === -1) {
            // Добавить мину
            if (this.mines.length < this.minesCount) {
                this.mines.push(index);
                cell.classList.add('mine');
                cell.textContent = '💣';
                this.playSound('place');
                this.vibrate(50);
            }
        } else {
            // Убрать мину
            this.mines.splice(mineIndex, 1);
            cell.classList.remove('mine');
            cell.textContent = '';
            this.playSound('remove');
        }
        
        // Обновление UI
        const minesLeft = this.minesCount - this.mines.length;
        document.getElementById('minesLeft').textContent = minesLeft;
        document.getElementById('startGameBtn').disabled = minesLeft !== 0;
    },
    
    /**
     * Начало игры (после расстановки мин)
     * Второй игрок начинает разминировать поле
     */
    startGame() {
        this.showScreen('gameScreen');
        this.currentPlayer = 2;
        this.updatePlayerIndicator();
        this.openedCells = 0;
        this.timer = 0;
        
        // Обновление информации
        document.getElementById('minesCount').textContent = this.minesCount;
        document.getElementById('openedCells').textContent = '0';
        document.getElementById('timer').textContent = '0:00';
        
        // Создание игрового поля
        this.createGameField();
        
        // Запуск таймера
        this.startTimer();
        
        console.log('⚡ Игра началась!');
        this.playSound('start');
    },
    
    /**
     * Создание игрового поля для разминирования
     */
    createGameField() {
        const gameField = document.getElementById('gameField');
        gameField.innerHTML = '';
        gameField.style.gridTemplateColumns = `repeat(${this.fieldSize.cols}, var(--cell-size))`;
        
        this.field = [];
        
        for (let i = 0; i < this.totalCells; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = i;
            
            // Обработчик клика для открытия ячейки
            cell.addEventListener('click', () => {
                this.openCell(i, cell);
            });
            
            gameField.appendChild(cell);
            this.field.push({
                index: i,
                opened: false,
                hasMine: this.mines.includes(i),
                element: cell
            });
        }
    },
    
    /**
     * Открытие ячейки
     * @param {number} index - индекс ячейки
     * @param {HTMLElement} cell - элемент ячейки
     */
    openCell(index, cell) {
        const cellData = this.field[index];
        
        // Проверка, открыта ли уже ячейка
        if (cellData.opened) return;
        
        cellData.opened = true;
        cell.classList.add('opened');
        this.openedCells++;
        
        // Проверка на мину
        if (cellData.hasMine) {
            cell.textContent = '💣';
            cell.classList.add('exploded');
            this.playSound('explosion');
            this.vibrate([100, 50, 100]);
            this.gameOver(false);
            return;
        }
        
        // Подсчёт соседних мин
        const nearbyMines = this.countNearbyMines(index);
        
        if (nearbyMines > 0) {
            cell.textContent = nearbyMines;
            cell.dataset.mines = nearbyMines;
        } else {
            // Автоматическое открытие соседних пустых ячеек
            this.openNearbyCells(index);
        }
        
        this.playSound('open');
        this.vibrate(30);
        
        // Обновление счётчика
        document.getElementById('openedCells').textContent = this.openedCells;
        
        // Проверка победы
        if (this.openedCells === this.totalCells - this.minesCount) {
            this.gameOver(true);
        }
    },
    
    /**
     * Подсчёт мин вокруг ячейки
     * @param {number} index - индекс ячейки
     * @returns {number} количество мин вокруг
     */
    countNearbyMines(index) {
        const neighbors = this.getNeighbors(index);
        return neighbors.filter(i => this.mines.includes(i)).length;
    },
    
    /**
     * Получение индексов соседних ячеек
     * @param {number} index - индекс ячейки
     * @returns {Array} массив индексов соседей
     */
    getNeighbors(index) {
        const row = Math.floor(index / this.fieldSize.cols);
        const col = index % this.fieldSize.cols;
        const neighbors = [];
        
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                
                const newRow = row + dr;
                const newCol = col + dc;
                
                if (newRow >= 0 && newRow < this.fieldSize.rows &&
                    newCol >= 0 && newCol < this.fieldSize.cols) {
                    neighbors.push(newRow * this.fieldSize.cols + newCol);
                }
            }
        }
        
        return neighbors;
    },
    
    /**
     * Открытие соседних пустых ячеек
     * @param {number} index - индекс ячейки
     */
    openNearbyCells(index) {
        const neighbors = this.getNeighbors(index);
        
        neighbors.forEach(neighborIndex => {
            const neighborCell = this.field[neighborIndex];
            if (!neighborCell.opened && !neighborCell.hasMine) {
                this.openCell(neighborIndex, neighborCell.element);
            }
        });
    },
    
    /**
     * Запуск таймера
     */
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            const minutes = Math.floor(this.timer / 60);
            const seconds = this.timer % 60;
            document.getElementById('timer').textContent = 
                `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    },
    
    /**
     * Остановка таймера
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    },
    
    /**
     * Завершение игры
     * @param {boolean} won - победил ли игрок
     */
    gameOver(won) {
        this.stopTimer();
        console.log(won ? '🎉 Победа!' : '💥 Поражение!');
        
        // Подсчёт очков
        const score = won ? this.calculateScore() : 0;
        
        if (this.currentPlayer === 1) {
            this.scores.player1 = score;
        } else {
            this.scores.player2 = score;
        }
        
        this.playSound(won ? 'win' : 'lose');
        this.vibrate(won ? [100, 50, 100, 50, 200] : [200, 100, 200]);
        
        setTimeout(() => {
            this.showResults(won);
        }, 1000);
    },
    
    /**
     * Расчёт итогового счёта
     * @returns {number} итоговые очки
     */
    calculateScore() {
        const timeBonus = Math.max(0, 300 - this.timer) * 10;
        const cellBonus = this.openedCells * 50;
        const accuracy = (this.openedCells / (this.totalCells - this.minesCount)) * 100;
        
        return Math.round(timeBonus + cellBonus + accuracy * 10);
    },
    
    /**
     * Показ экрана результатов
     * @param {boolean} won - победил ли игрок
     */
    showResults(won) {
        this.showScreen('resultsScreen');
        
        // Заголовок
        document.getElementById('resultTitle').textContent = 
            won ? '🎉 Победа!' : '💥 Игра окончена';
        
        // Сообщение
        const message = won 
            ? 'Поздравляем! Вы успешно разминировали поле!' 
            : 'К сожалению, вы наткнулись на мину. Попробуйте ещё раз!';
        document.getElementById('resultMessage').textContent = message;
        
        // Статистика
        const minutes = Math.floor(this.timer / 60);
        const seconds = this.timer % 60;
        document.getElementById('finalTime').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('finalOpened').textContent = this.openedCells;
        
        const accuracy = ((this.openedCells / (this.totalCells - this.minesCount)) * 100).toFixed(1);
        document.getElementById('finalAccuracy').textContent = `${accuracy}%`;
        
        const score = this.currentPlayer === 1 ? this.scores.player1 : this.scores.player2;
        document.getElementById('finalScore').textContent = score;
        
        // Турнирная информация
        if (this.mode === 'tournament') {
            document.getElementById('tournamentInfo').classList.remove('hidden');
            document.getElementById('currentRound').textContent = this.currentRound;
            document.getElementById('player1Score').textContent = this.scores.player1;
            document.getElementById('player2Score').textContent = this.scores.player2;
            
            const nextBtn = document.getElementById('nextRoundBtn');
            if (this.currentRound === 1) {
                nextBtn.style.display = 'flex';
            } else {
                nextBtn.style.display = 'none';
                this.announceWinner();
            }
        } else {
            document.getElementById('tournamentInfo').classList.add('hidden');
            document.getElementById('nextRoundBtn').style.display = 'none';
        }
    },
    
    /**
     * Объявление победителя турнира
     */
    announceWinner() {
        const message = document.getElementById('resultMessage');
        if (this.scores.player1 > this.scores.player2) {
            message.textContent = '🏆 Победитель турнира: Игрок 1!';
        } else if (this.scores.player2 > this.scores.player1) {
            message.textContent = '🏆 Победитель турнира: Игрок 2!';
        } else {
            message.textContent = '🤝 Ничья! Оба игрока показали отличный результат!';
        }
    },
    
    /**
     * Переход к следующему раунду
     */
    nextRound() {
        this.currentRound++;
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.playSound('start');
        this.setupMines();
    },
    
    /**
     * Сброс игры и возврат к выбору режима
     */
    resetGame() {
        this.mode = null;
        this.currentPlayer = 1;
        this.currentRound = 1;
        this.scores.player1 = 0;
        this.scores.player2 = 0;
        this.stopTimer();
        this.showScreen('modeScreen');
        console.log('🔄 Игра сброшена');
    },
    
    /**
     * Переключение между экранами
     * @param {string} screenId - ID экрана для показа
     */
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        document.getElementById(screenId).classList.remove('hidden');
    },
    
    /**
     * Обновление индикатора текущего игрока
     */
    updatePlayerIndicator() {
        document.getElementById('playerNumber').textContent = this.currentPlayer;
    },
    
    /**
     * Переключение темы оформления
     * @param {boolean} dark - включить тёмную тему
     */
    toggleTheme(dark) {
        this.darkTheme = dark;
        document.body.classList.toggle('dark-theme', dark);
        this.saveSettings();
        console.log(`🎨 Тема: ${dark ? 'тёмная' : 'светлая'}`);
    },
    
    /**
     * Воспроизведение звука
     * @param {string} type - тип звука
     */
    playSound(type) {
        if (!this.soundEnabled) return;
        
        // Создание аудио-контекста для звуковых эффектов
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Настройка звука в зависимости от типа
        switch(type) {
            case 'start':
                oscillator.frequency.value = 523.25; // C5
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                break;
            case 'open':
                oscillator.frequency.value = 440; // A4
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                break;
            case 'place':
                oscillator.frequency.value = 329.63; // E4
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
                break;
            case 'remove':
                oscillator.frequency.value = 293.66; // D4
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                break;
            case 'explosion':
                oscillator.type = 'sawtooth';
                oscillator.frequency.value = 100;
                gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                break;
            case 'win':
                oscillator.frequency.value = 659.25; // E5
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                break;
            case 'lose':
                oscillator.type = 'triangle';
                oscillator.frequency.value = 200;
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
                break;
        }
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
    },
    
    /**
     * Вибрация устройства
     * @param {number|Array} pattern - паттерн вибрации
     */
    vibrate(pattern) {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    },
    
    /**
     * Сохранение настроек (в памяти приложения)
     * Примечание: настройки сохраняются только в текущей сессии
     */
    saveSettings() {
        // Настройки сохраняются в объекте Game и применяются автоматически
        console.log('💾 Настройки сохранены в памяти');
    },
    
    /**
     * Загрузка настроек (устанавливает значения по умолчанию)
     * Настройки применяются из текущего состояния объекта Game
     */
    loadSettings() {
        // Применение текущих настроек к UI
        document.getElementById('soundToggle').checked = this.soundEnabled;
        document.getElementById('themeToggle').checked = this.darkTheme;
        document.body.classList.toggle('dark-theme', this.darkTheme);
        console.log('⚙️ Настройки загружены');
    }
};

/**
 * Запуск игры при загрузке страницы
 */
window.addEventListener('DOMContentLoaded', () => {
    Game.init();
    console.log('✅ Приложение "Сапёр" загружено - Школа 1430');
});