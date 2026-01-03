// Управление тестами
const TestManager = {
    tests: [],
    userTests: [],
    
    // Инициализация
    async init() {
        try {
            // Загрузка дефолтных тестов
            const response = await fetch('data.json');
            if (response.ok) {
                const data = await response.json();
                this.tests = data.tests || [];
                // Помечаем дефолтные тесты
                this.tests.forEach(test => test.isDefault = true);
                Storage.saveTests(data);
            }
        } catch (error) {
            console.error('Ошибка загрузки тестов:', error);
            this.tests = [];
        }
        
        // Загрузка пользовательских тестов
        this.userTests = Storage.loadUserTests();
        
        // Рендеринг списка тестов
        this.renderTestList();
    },
    
    // Получение всех тестов
    getAllTests() {
        return [...this.tests, ...this.userTests];
    },
    
    // Поиск теста по ID
    findTestById(id) {
        const allTests = this.getAllTests();
        return allTests.find(test => test.id === id);
    },
    
    // Добавление теста
    addTest(testData) {
        const newTest = {
            id: Utils.generateId(),
            title: testData.title,
            questions: testData.questions,
            isDefault: false,
            createdAt: new Date().toISOString()
        };
        
        this.userTests.push(newTest);
        Storage.addUserTest(newTest);
        
        // Обновляем список
        this.renderTestList();
        
        return newTest.id;
    },
    
    // Удаление теста
    deleteTest(testId) {
        const test = this.findTestById(testId);
        if (test?.isDefault) {
            Modal.alert({
                title: 'Ошибка',
                message: 'Нельзя удалить стандартный тест'
            });
            return false;
        }
        
        Modal.confirm({
            title: 'Удалить тест?',
            message: 'Вы уверены, что хотите удалить этот тест?'
        }).then(confirmed => {
            if (confirmed) {
                Storage.deleteUserTest(testId);
                this.userTests = this.userTests.filter(t => t.id !== testId);
                Storage.clearTestProgress(testId);
                this.renderTestList();
                
                Modal.alert({
                    title: 'Успешно',
                    message: 'Тест успешно удален'
                });
            }
        });
    },
    
    // Рендеринг списка тестов
    renderTestList() {
        const container = document.querySelector('[test-id="list-items"]');
        if (!container) return;
        
        const allTests = this.getAllTests();
        
        container.innerHTML = allTests.map(test => `
            <div class="test-card" onclick="window.location.href='test.html?testId=${test.id}'">
                <h3 test-id="list-item-title">${Utils.escapeHtml(test.title)}</h3>
                <div class="test-meta">
                    <span>${test.questions?.length || 0} вопросов</span>
                </div>
                <button class="delete-btn" 
                        test-id="list-item-delete"
                        ${test.isDefault ? 'disabled' : ''}
                        onclick="TestManager.handleDeleteTest(event, '${test.id}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"></path>
                    </svg>
                </button>
            </div>
        `).join('');
    },
    
    // Обработчик удаления теста
    handleDeleteTest(event, testId) {
        event.stopPropagation();
        this.deleteTest(testId);
    }
};

// Переменные для формы создания теста (должны быть глобальными)
let currentQuestions = [{
    id: 1,
    text: '',
    options: ['', '', '', ''],
    correctAnswer: null
}];

// Рендеринг формы вопросов
function renderQuestionsForm() {
    const container = document.getElementById('questions-container');
    if (!container) return;
    
    container.innerHTML = currentQuestions.map((question, questionIndex) => `
        <div class="question-item" data-question-index="${questionIndex}">
            <div class="question-header">
                <span class="question-number">Вопрос ${questionIndex + 1}</span>
            </div>
            <div class="form-group">
                <label>Текст вопроса:</label>
                <input type="text" 
                       test-id="new-test-question"
                       class="question-text-input"
                       data-question-index="${questionIndex}"
                       value="${Utils.escapeHtml(question.text)}"
                       placeholder="Введите текст вопроса"
                       required>
                <div class="error-message question-error" id="questionError${questionIndex}" style="display: none;">
                    Пожалуйста, введите текст вопроса
                </div>
            </div>
            
            <div class="options-container" test-id="new-test-options">
                ${question.options.map((option, optionIndex) => `
                    <div class="option-row">
                        <input type="radio" 
                               name="correctAnswer${questionIndex}"
                               data-question-index="${questionIndex}"
                               data-option-index="${optionIndex}"
                               ${question.correctAnswer === optionIndex ? 'checked' : ''}
                               required>
                        <input type="text"
                               class="option-input"
                               data-question-index="${questionIndex}"
                               data-option-index="${optionIndex}"
                               value="${Utils.escapeHtml(option)}"
                               placeholder="Вариант ответа ${optionIndex + 1}"
                               required>
                    </div>
                `).join('')}
            </div>
            <div class="error-message options-error" id="optionsError${questionIndex}" style="display: none;">
                Пожалуйста, выберите правильный ответ
            </div>
        </div>
    `).join('');
    
    // Добавляем обработчики
    addQuestionInputListeners();
}

// Добавление обработчиков для полей ввода
function addQuestionInputListeners() {
    // Тексты вопросов
    document.querySelectorAll('.question-text-input').forEach(input => {
        input.addEventListener('input', (e) => {
            const index = parseInt(e.target.dataset.questionIndex);
            currentQuestions[index].text = e.target.value.trim();
            hideError(`questionError${index}`);
            e.target.classList.remove('error');
        });
    });
    
    // Варианты ответов
    document.querySelectorAll('.option-input').forEach(input => {
        input.addEventListener('input', (e) => {
            const questionIndex = parseInt(e.target.dataset.questionIndex);
            const optionIndex = parseInt(e.target.dataset.optionIndex);
            currentQuestions[questionIndex].options[optionIndex] = e.target.value.trim();
            e.target.classList.remove('error');
        });
    });
    
    // Правильные ответы
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const questionIndex = parseInt(e.target.dataset.questionIndex);
            const optionIndex = parseInt(e.target.dataset.optionIndex);
            currentQuestions[questionIndex].correctAnswer = optionIndex;
            hideError(`optionsError${questionIndex}`);
        });
    });
}

// Скрыть ошибку
function hideError(errorId) {
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

// Показать ошибку
function showError(errorId) {
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
        errorElement.style.display = 'block';
    }
}

// Добавление вопроса
function addQuestion() {
    currentQuestions.push({
        id: currentQuestions.length + 1,
        text: '',
        options: ['', '', '', ''],
        correctAnswer: null
    });
    renderQuestionsForm();
}

// Удаление вопроса
function removeQuestion() {
    if (currentQuestions.length > 1) {
        currentQuestions.pop();
        renderQuestionsForm();
    }
}

// Валидация вопроса
function validateQuestion(index) {
    const question = currentQuestions[index];
    let isValid = true;
    
    // Валидация текста вопроса
    const questionInput = document.querySelector(`.question-text-input[data-question-index="${index}"]`);
    const questionError = document.getElementById(`questionError${index}`);
    
    if (!question.text.trim()) {
        if (questionInput) questionInput.classList.add('error');
        if (questionError) questionError.style.display = 'block';
        isValid = false;
    } else {
        if (questionInput) questionInput.classList.remove('error');
        if (questionError) questionError.style.display = 'none';
    }
    
    // Валидация вариантов ответов
    let hasEmptyOptions = false;
    question.options.forEach((option, i) => {
        const optionInput = document.querySelector(`.option-input[data-question-index="${index}"][data-option-index="${i}"]`);
        if (!option.trim()) {
            if (optionInput) optionInput.classList.add('error');
            hasEmptyOptions = true;
            isValid = false;
        } else {
            if (optionInput) optionInput.classList.remove('error');
        }
    });
    
    // Валидация правильного ответа
    const optionsError = document.getElementById(`optionsError${index}`);
    if (question.correctAnswer === null) {
        if (optionsError) optionsError.style.display = 'block';
        isValid = false;
    } else {
        if (optionsError) optionsError.style.display = 'none';
    }
    
    return isValid;
}

// Валидация всей формы
function validateAllQuestions() {
    let allValid = true;
    
    currentQuestions.forEach((_, index) => {
        if (!validateQuestion(index)) {
            allValid = false;
        }
    });
    
    return allValid;
}

// Сброс формы
function resetForm() {
    currentQuestions = [{
        id: 1,
        text: '',
        options: ['', '', '', ''],
        correctAnswer: null
    }];
    
    const form = document.getElementById('new-test-form');
    if (form) form.reset();
    
    const titleInput = document.getElementById('testTitle');
    if (titleInput) titleInput.value = '';
    
    // Скрываем все ошибки
    document.querySelectorAll('.error-message').forEach(el => {
        el.style.display = 'none';
    });
    
    document.querySelectorAll('.error').forEach(el => {
        el.classList.remove('error');
    });
}

// Обработчик отправки формы
async function handleSubmitTest(e) {
    e.preventDefault();
    
    // Валидация названия теста
    const titleInput = document.getElementById('testTitle');
    const titleError = document.getElementById('titleError');
    const title = titleInput?.value.trim() || '';
    
    if (!title) {
        if (titleInput) titleInput.classList.add('error');
        if (titleError) titleError.style.display = 'block';
        if (titleInput) titleInput.focus();
        return;
    }
    
    if (titleInput) titleInput.classList.remove('error');
    if (titleError) titleError.style.display = 'none';
    
    // Валидация всех вопросов
    if (!validateAllQuestions()) {
        await Modal.alert({
            title: 'Ошибка',
            message: 'Пожалуйста, заполните все поля и выберите правильные ответы'
        });
        return;
    }
    
    // Показываем индикатор загрузки
    Modal.showLoader();
    
    try {
        // Подготовка данных теста
        const testData = {
            title: title,
            questions: currentQuestions.map(q => ({
                id: q.id,
                text: q.text.trim(),
                options: q.options.map(opt => opt.trim()),
                correctAnswer: q.correctAnswer
            }))
        };
        
        // Проверяем, что все вопросы имеют правильные ответы
        const hasInvalidQuestion = testData.questions.some(q => 
            q.correctAnswer === null || 
            q.correctAnswer < 0 || 
            q.correctAnswer > 3
        );
        
        if (hasInvalidQuestion) {
            throw new Error('Не все вопросы имеют правильный ответ');
        }
        
        // Сохранение теста
        const testId = TestManager.addTest(testData);
        
        // Скрываем индикатор загрузки
        Modal.hideLoader();
        
        // Закрываем модальное окно
        Modal.close();
        
        // Показываем успешное сообщение
        await Modal.alert({
            title: 'Успешно!',
            message: 'Тест успешно создан'
        });
        
        // Переход к созданному тесту
        window.location.href = `test.html?testId=${testId}`;
        
    } catch (error) {
        console.error('Ошибка создания теста:', error);
        Modal.hideLoader();
        await Modal.alert({
            title: 'Ошибка',
            message: 'Не удалось создать тест. Убедитесь, что все поля заполнены правильно.'
        });
    }
}

// Экспорт функций для main.js
window.renderQuestionsForm = renderQuestionsForm;
window.addQuestion = addQuestion;
window.removeQuestion = removeQuestion;
window.handleSubmitTest = handleSubmitTest;
window.resetForm = resetForm;
window.hideError = hideError;
window.showError = showError;

// Инициализация событий формы (для страницы создания теста)
document.addEventListener('DOMContentLoaded', () => {
    // Кнопки управления вопросами
    const addQuestionBtn = document.getElementById('addQuestionBtn');
    const removeQuestionBtn = document.getElementById('removeQuestionBtn');
    const saveTestBtn = document.getElementById('saveTestBtn');
    
    if (addQuestionBtn) {
        addQuestionBtn.addEventListener('click', addQuestion);
    }
    
    if (removeQuestionBtn) {
        removeQuestionBtn.addEventListener('click', removeQuestion);
    }
    
    if (saveTestBtn) {
        // Обработчик для кнопки Сохранить
        saveTestBtn.addEventListener('click', handleSubmitTest);
    }
    
    // Обработчик формы
    const form = document.getElementById('new-test-form');
    if (form) {
        form.addEventListener('submit', handleSubmitTest);
    }
});
