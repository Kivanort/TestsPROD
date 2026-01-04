// Запуск и управление тестом
const TestRunner = {
    currentTest: null,
    currentQuestionIndex: 0,
    userAnswers: {},
    isCompleted: false,
    
    // Инициализация теста
    async init() {
        const testId = Utils.getUrlParam('testId');
        if (!testId) {
            window.location.href = 'index.html';
            return;
        }
        
        // Загрузка теста
        try {
            await TestManager.init();
            this.currentTest = TestManager.findTestById(testId);
            
            if (!this.currentTest) {
                await Modal.alert({
                    title: 'Ошибка',
                    message: 'Тест не найден'
                });
                window.location.href = 'index.html';
                return;
            }
            
            // Проверяем структуру теста
            if (!this.currentTest.questions || !Array.isArray(this.currentTest.questions)) {
                console.error('Некорректная структура теста:', this.currentTest);
                await Modal.alert({
                    title: 'Ошибка',
                    message: 'Некорректная структура теста'
                });
                window.location.href = 'index.html';
                return;
            }
            
            // Загрузка прогресса
            this.loadProgress();
            
            // Настройка кнопок
            this.setupEventListeners();
            
            // Отображение теста
            this.renderTest();
            this.renderNavigation();
            this.showQuestion(this.currentQuestionIndex);
            
        } catch (error) {
            console.error('Ошибка инициализации теста:', error);
            await Modal.alert({
                title: 'Ошибка',
                message: 'Не удалось загрузить тест'
            });
            window.location.href = 'index.html';
        }
    },
    
    // Настройка обработчиков событий
    setupEventListeners() {
        // Кнопки навигации
        const prevBtn = document.getElementById('prevQuestionBtn');
        const nextBtn = document.getElementById('nextQuestionBtn');
        const finishBtn = document.getElementById('finishTestBtn');
        const resetBtn = document.getElementById('resetTestBtn');
        const backBtn = document.getElementById('backToListBtn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.prevQuestion());
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextQuestion());
        }
        
        if (finishBtn) {
            finishBtn.addEventListener('click', () => this.finishTest());
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetTest());
        }
        
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.location.href = 'index.html';
            });
        }
    },
    
    // Загрузка прогресса
    loadProgress() {
        const progress = Storage.loadProgress(this.currentTest.id);
        if (progress) {
            this.userAnswers = progress.answers || {};
            this.currentQuestionIndex = progress.currentIndex || 0;
            this.isCompleted = progress.isCompleted || false;
        }
    },
    
    // Сохранение прогресса
    saveProgress() {
        Storage.saveProgress(this.currentTest.id, {
            answers: this.userAnswers,
            currentIndex: this.currentQuestionIndex,
            isCompleted: this.isCompleted,
            lastUpdated: new Date().toISOString()
        });
    },
    
    // Отображение теста
    renderTest() {
        const testTitle = document.getElementById('testTitle');
        if (testTitle) {
            testTitle.textContent = this.currentTest.title;
        }
        
        if (this.isCompleted) {
            this.showResults();
        }
    },
    
    // Отображение навигации
    renderNavigation() {
        const navList = document.getElementById('navigationList');
        if (!navList || !this.currentTest || !this.currentTest.questions) return;
        
        navList.innerHTML = this.currentTest.questions.map((question, index) => {
            const isAnswered = this.userAnswers[index] !== undefined;
            const isCorrect = isAnswered && 
                question.correctAnswer !== undefined &&
                this.userAnswers[index] === question.correctAnswer;
            
            let className = 'nav-item';
            if (index === this.currentQuestionIndex) className += ' active';
            if (isAnswered) {
                className += isCorrect ? ' correct' : ' incorrect';
            }
            
            return `
                <div class="${className}" 
                     test-id="navigation-item"
                     onclick="TestRunner.goToQuestion(${index})">
                    <span class="nav-number">${index + 1}</span>
                    <span class="nav-text">Вопрос ${index + 1}</span>
                </div>
            `;
        }).join('');
    },
    
    // Показать вопрос
    showQuestion(index) {
        if (!this.currentTest || !this.currentTest.questions) return;
        if (index < 0 || index >= this.currentTest.questions.length) return;
        
        this.currentQuestionIndex = index;
        const question = this.currentTest.questions[index];
        
        if (!question) return;
        
        // Обновляем навигацию
        this.renderNavigation();
        
        // Обновляем кнопки навигации
        const prevBtn = document.getElementById('prevQuestionBtn');
        const nextBtn = document.getElementById('nextQuestionBtn');
        
        if (prevBtn) prevBtn.disabled = index === 0;
        if (nextBtn) nextBtn.disabled = index === this.currentTest.questions.length - 1;
        
        // Отображаем вопрос
        const questionText = document.getElementById('questionText');
        if (questionText) {
            questionText.textContent = question.text;
        }
        
        // Отображаем варианты ответов
        const optionsList = document.getElementById('optionsList');
        if (!optionsList) return;
        
        const letters = ['A', 'B', 'C', 'D'];
        const userAnswer = this.userAnswers[index];
        const isAnswered = userAnswer !== undefined;
        
        optionsList.innerHTML = question.options.map((option, optionIndex) => {
            let className = 'option-btn';
            let statusIcon = '';
            
            if (isAnswered && question.correctAnswer !== undefined) {
                if (optionIndex === question.correctAnswer) {
                    className += ' correct';
                    statusIcon = '✓';
                } else if (optionIndex === userAnswer && optionIndex !== question.correctAnswer) {
                    className += ' incorrect';
                    statusIcon = '✗';
                }
                
                if (optionIndex === userAnswer) {
                    className += ' selected';
                }
            }
            
            return `
                <button type="button" 
                        class="${className}"
                        test-id="question-option"
                        ${isAnswered ? 'disabled' : ''}
                        onclick="TestRunner.selectAnswer(${optionIndex})">
                    <div class="option-content">
                        <span class="option-letter">${letters[optionIndex]}</span>
                        <span class="option-text">${Utils.escapeHtml(option)}</span>
                        ${statusIcon ? `<span class="option-status">${statusIcon}</span>` : ''}
                    </div>
                </button>
            `;
        }).join('');
        
        this.saveProgress();
    },
    
    // Выбор ответа
    selectAnswer(answerIndex) {
        if (this.isCompleted || !this.currentTest) return;
        
        this.userAnswers[this.currentQuestionIndex] = answerIndex;
        this.saveProgress();
        this.showQuestion(this.currentQuestionIndex);
        this.renderNavigation();
    },
    
    // Переход к вопросу
    goToQuestion(index) {
        this.showQuestion(index);
    },
    
    // Следующий вопрос
    nextQuestion() {
        if (!this.currentTest || !this.currentTest.questions) return;
        if (this.currentQuestionIndex < this.currentTest.questions.length - 1) {
            this.showQuestion(this.currentQuestionIndex + 1);
        }
    },
    
    // Предыдущий вопрос
    prevQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.showQuestion(this.currentQuestionIndex - 1);
        }
    },
    
    // Завершение теста
    async finishTest() {
        if (!this.currentTest || !this.currentTest.questions) return;
        
        const answeredCount = Object.keys(this.userAnswers).length;
        const totalQuestions = this.currentTest.questions.length;
        
        // Если не все вопросы отвечены, показываем подтверждение
        if (answeredCount < totalQuestions) {
            const confirmed = await Modal.confirm({
                title: 'Завершить тест?',
                message: `Вы ответили на ${answeredCount} из ${totalQuestions} вопросов. Завершить тест?`,
                confirmText: 'Завершить',
                cancelText: 'Продолжить'
            });
            
            if (!confirmed) {
                return;
            }
        }
        
        this.isCompleted = true;
        this.saveProgress();
        await this.showResultsModal();
    },
    
    // Показать модальное окно с результатами
    async showResultsModal() {
        if (!this.currentTest) return;
        
        const results = this.calculateResults();
        
        // Проверяем, все ли вопросы отвечены
        const allAnswered = results.unanswered === 0;
        
        const modalId = `results-modal-${Date.now()}`;
        
        const content = `
            <div class="results-content">
                <h3>Результаты теста</h3>
                <div class="results-stats">
                    <div class="stat-item">
                        <span class="stat-label">Правильных ответов:</span>
                        <span class="stat-value correct">${results.correct}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Неправильных ответов:</span>
                        <span class="stat-value incorrect">${results.incorrect}</span>
                    </div>
                    ${results.unanswered > 0 ? `
                        <div class="stat-item">
                            <span class="stat-label">Вопросов без ответа:</span>
                            <span class="stat-value unanswered">${results.unanswered}</span>
                        </div>
                    ` : ''}
                </div>
                <p>Всего вопросов: ${results.total}</p>
            </div>
        `;
        
        const buttons = [];
        
        if (allAnswered) {
            buttons.push({
                text: 'Пройти заново',
                className: 'btn-primary',
                onClick: () => {
                    TestRunner.resetTestFromModal(modalId);
                }
            });
        } else {
            buttons.push({
                text: 'Понятно',
                className: 'btn-primary',
                onClick: () => {
                    Modal.close();
                    Modal.remove(modalId);
                }
            });
        }
        
        // Создаем и открываем модальное окно
        Modal.create({
            id: modalId,
            title: 'Результаты',
            content: content,
            buttons: buttons,
            width: '500px'
        });
        
        await Modal.open(modalId);
        
        // После закрытия модального окна показываем результаты
        if (!allAnswered) {
            this.showResults();
        }
    },
    
    // Рассчитать результаты
    calculateResults() {
        if (!this.currentTest || !this.currentTest.questions) {
            return { correct: 0, incorrect: 0, unanswered: 0, total: 0 };
        }
        
        let correct = 0;
        let incorrect = 0;
        
        this.currentTest.questions.forEach((question, index) => {
            const userAnswer = this.userAnswers[index];
            
            if (userAnswer !== undefined && question.correctAnswer !== undefined) {
                if (userAnswer === question.correctAnswer) {
                    correct++;
                } else {
                    incorrect++;
                }
            }
        });
        
        const unanswered = this.currentTest.questions.length - (correct + incorrect);
        
        return {
            correct,
            incorrect,
            unanswered,
            total: this.currentTest.questions.length
        };
    },
    
    // Сбросить тест из модального окна
    resetTestFromModal(modalId) {
        Modal.close();
        Modal.remove(modalId);
        this.resetTest();
    },
    
    // Сбросить тест
    async resetTest() {
        const confirmed = await Modal.confirm({
            title: 'Пройти заново?',
            message: 'Вы уверены, что хотите начать тест заново? Весь прогресс будет потерян.',
            confirmText: 'Да',
            cancelText: 'Отмена'
        });
        
        if (confirmed) {
            this.userAnswers = {};
            this.currentQuestionIndex = 0;
            this.isCompleted = false;
            
            Storage.clearTestProgress(this.currentTest.id);
            this.saveProgress();
            
            // Показываем кнопку завершения
            const finishBtn = document.getElementById('finishTestBtn');
            const resetBtn = document.getElementById('resetTestBtn');
            
            if (finishBtn) finishBtn.style.display = 'inline-block';
            if (resetBtn) resetBtn.style.display = 'none';
            
            this.showQuestion(0);
            this.renderNavigation();
        }
    },
    
    // Показать результаты на странице
    showResults() {
        const finishBtn = document.getElementById('finishTestBtn');
        const resetBtn = document.getElementById('resetTestBtn');
        
        if (finishBtn) finishBtn.style.display = 'none';
        if (resetBtn) resetBtn.style.display = 'inline-block';
    }
};

// Глобальные функции для теста
window.selectAnswer = function(index) {
    TestRunner.selectAnswer(index);
};

window.nextQuestion = function() {
    TestRunner.nextQuestion();
};

window.prevQuestion = function() {
    TestRunner.prevQuestion();
};

window.finishTest = function() {
    TestRunner.finishTest();
};

window.resetTest = function() {
    TestRunner.resetTest();
};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    TestRunner.init();
});
