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
        console.log('Добавление теста:', testData);
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
window.currentQuestions = [{
    id: 1,
    text: '',
    options: ['', '', '', ''],
    correctAnswer: null
}];

// Получить актуальные данные из формы
function getFormData() {
    console.log('Получение данных из формы');
    
    // Получаем название теста
    const titleInput = document.getElementById('testTitle');
    const title = titleInput?.value.trim() || '';
    
    // Создаем массив для вопросов
    const questions = [];
    
    // Получаем все контейнеры вопросов
    const questionItems = document.querySelectorAll('.question-item');
    
    questionItems.forEach((item, index) => {
        // Получаем текст вопроса
        const questionInput = item.querySelector('.question-text-input');
        const questionText = questionInput?.value.trim() || '';
        
        // Получаем варианты ответов
        const options = [];
        const optionInputs = item.querySelectorAll('.option-input');
        optionInputs.forEach((optInput, optIndex) => {
            options.push(optInput?.value.trim() || '');
        });
        
        // Получаем правильный ответ
        const correctRadio = item.querySelector('input[type="radio"]:checked');
        const correctAnswer = correctRadio ? parseInt(correctRadio.dataset.optionIndex) : null;
        
        // Добавляем вопрос
        questions.push({
            id: index + 1,
            text: questionText,
            options: options,
            correctAnswer: correctAnswer
        });
    });
    
    console.log('Собранные данные:', { title, questions });
    
    return {
        title,
        questions
    };
}

// Валидация данных формы
function validateFormData(formData) {
    console.log('Валидация данных формы:', formData);
    
    let isValid = true;
    
    // Проверка названия теста
    if (!formData.title || formData.title.trim() === '') {
        console.log('Ошибка: название теста не заполнено');
        const titleInput = document.getElementById('testTitle');
        if (titleInput) {
            titleInput.classList.add('error');
            titleInput.focus();
        }
        const titleError = document.getElementById('titleError');
        if (titleError) titleError.style.display = 'block';
        isValid = false;
    }
    
    // Проверка наличия вопросов
    if (!formData.questions || formData.questions.length === 0) {
        console.log('Ошибка: нет ни одного вопроса');
        isValid = false;
    }
    
    // Проверка всех вопросов
    formData.questions.forEach((question, index) => {
        // Проверка текста вопроса
        if (!question.text || question.text.trim() === '') {
            console.log(`Ошибка: текст вопроса ${index + 1} не заполнен`);
            const questionInput = document.querySelector(`.question-text-input[data-question-index="${index}"]`);
            if (questionInput) {
                questionInput.classList.add('error');
                if (isValid) questionInput.focus();
            }
            showError(`questionError${index}`);
            isValid = false;
        }
        
        // Проверка вариантов ответов
        question.options.forEach((option, optIndex) => {
            if (!option || option.trim() === '') {
                console.log(`Ошибка: вариант ответа ${optIndex + 1} в вопросе ${index + 1} не заполнен`);
                const optionInput = document.querySelector(`.option-input[data-question-index="${index}"][data-option-index="${optIndex}"]`);
                if (optionInput) {
                    optionInput.classList.add('error');
                    if (isValid) optionInput.focus();
                }
                isValid = false;
            }
        });
        
        // Проверка правильного ответа
        if (question.correctAnswer === null || question.correctAnswer === undefined) {
            console.log(`Ошибка: не выбран правильный ответ в вопросе ${index + 1}`);
            showError(`optionsError${index}`);
            isValid = false;
        }
    });
    
    return isValid;
}

// Рендеринг формы вопросов
function renderQuestionsForm() {
    console.log('Рендеринг формы вопросов');
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
                       value="${question.text}"
                       placeholder="Введите текст вопроса">
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
                               ${question.correctAnswer === optionIndex ? 'checked' : ''}>
                        <input type="text"
                               class="option-input"
                               data-question-index="${questionIndex}"
                               data-option-index="${optionIndex}"
                               value="${option}"
                               placeholder="Вариант ответа ${optionIndex + 1}">
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
    console.log('Добавление обработчиков для полей ввода');
    
    // Тексты вопросов
    document.querySelectorAll('.question-text-input').forEach(input => {
        const index = parseInt(input.dataset.questionIndex);
        
        input.addEventListener('input', (e) => {
            const idx = parseInt(e.target.dataset.questionIndex);
            if (currentQuestions[idx]) {
                currentQuestions[idx].text = e.target.value;
                console.log(`Обновлен текст вопроса ${idx}:`, currentQuestions[idx].text);
                hideError(`questionError${idx}`);
                e.target.classList.remove('error');
            }
        });
    });
    
    // Варианты ответов
    document.querySelectorAll('.option-input').forEach(input => {
        const questionIndex = parseInt(input.dataset.questionIndex);
        const optionIndex = parseInt(input.dataset.optionIndex);
        
        input.addEventListener('input', (e) => {
            const qIndex = parseInt(e.target.dataset.questionIndex);
            const optIndex = parseInt(e.target.dataset.optionIndex);
            if (currentQuestions[qIndex] && currentQuestions[qIndex].options) {
                currentQuestions[qIndex].options[optIndex] = e.target.value;
                console.log(`Обновлен вариант ответа ${qIndex}-${optIndex}:`, currentQuestions[qIndex].options[optIndex]);
                e.target.classList.remove('error');
            }
        });
    });
    
    // Правильные ответы
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        const questionIndex = parseInt(radio.dataset.questionIndex);
        const optionIndex = parseInt(radio.dataset.optionIndex);
        
        radio.addEventListener('change', (e) => {
            const qIndex = parseInt(e.target.dataset.questionIndex);
            const optIndex = parseInt(e.target.dataset.optionIndex);
            if (currentQuestions[qIndex]) {
                currentQuestions[qIndex].correctAnswer = optIndex;
                console.log(`Выбран правильный ответ для вопроса ${qIndex}:`, optIndex);
                hideError(`optionsError${qIndex}`);
            }
        });
    });
}

// Добавление вопроса
function addQuestion() {
    console.log('Добавление нового вопроса');
    currentQuestions.push({
        id: currentQuestions.length + 1,
        text: '',
        options: ['', '', '', ''],
        correctAnswer: null
    });
    renderQuestionsForm();
    
    // Прокрутка к новому вопросу
    setTimeout(() => {
        const lastQuestion = document.querySelector('.question-item:last-child');
        if (lastQuestion) {
            lastQuestion.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, 100);
}

// Удаление вопроса
function removeQuestion() {
    console.log('Удаление вопроса');
    if (currentQuestions.length > 1) {
        currentQuestions.pop();
        renderQuestionsForm();
    }
}

// Сброс формы
function resetForm() {
    console.log('Сброс формы');
    currentQuestions = [{
        id: 1,
        text: '',
        options: ['', '', '', ''],
        correctAnswer: null
    }];
    
    const form = document.getElementById('new-test-form');
    if (form) form.reset();
    
    const titleInput = document.getElementById('testTitle');
    if (titleInput) {
        titleInput.value = '';
        titleInput.classList.remove('error');
    }
    
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
    console.log('Начало обработки отправки формы');
    
    // Получаем данные из формы
    const formData = getFormData();
    console.log('Полученные данные формы:', formData);
    
    // Валидация формы
    if (!validateFormData(formData)) {
        await Modal.alert({
            title: 'Ошибка заполнения',
            message: 'Пожалуйста, заполните все поля и выберите правильные ответы'
        });
        return;
    }
    
    console.log('Валидация прошла успешно');
    
    // Показываем индикатор загрузки
    Modal.showLoader();
    
    try {
        // Проверяем, что все данные корректны
        if (!formData.title || formData.title.trim() === '') {
            throw new Error('Введите название теста');
        }
        
        if (!formData.questions || formData.questions.length === 0) {
            throw new Error('Добавьте хотя бы один вопрос');
        }
        
        // Дополнительная проверка каждого вопроса
        let hasErrors = false;
        let errorMessage = '';
        
        formData.questions.forEach((q, index) => {
            if (!q.text || q.text.trim() === '') {
                hasErrors = true;
                errorMessage = `Вопрос ${index + 1}: введите текст вопроса`;
                return;
            }
            
            q.options.forEach((opt, optIndex) => {
                if (!opt || opt.trim() === '') {
                    hasErrors = true;
                    errorMessage = `Вопрос ${index + 1}: заполните вариант ответа ${optIndex + 1}`;
                    return;
                }
            });
            
            if (q.correctAnswer === null || q.correctAnswer === undefined) {
                hasErrors = true;
                errorMessage = `Вопрос ${index + 1}: выберите правильный ответ`;
                return;
            }
        });
        
        if (hasErrors) {
            throw new Error(errorMessage);
        }
        
        console.log('Подготовленные данные теста:', formData);
        
        // Сохранение теста
        console.log('Сохранение теста...');
        const testId = TestManager.addTest(formData);
        console.log('Тест сохранен с ID:', testId);
        
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
        console.log('Переход к тесту с ID:', testId);
        window.location.href = `test.html?testId=${testId}`;
        
    } catch (error) {
        console.error('Ошибка создания теста:', error);
        Modal.hideLoader();
        await Modal.alert({
            title: 'Ошибка',
            message: `Не удалось создать тест: ${error.message}`
        });
    }
}

// Функция для скрытия ошибки
function hideError(errorId) {
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

// Функция для показа ошибки
function showError(errorId) {
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
        errorElement.style.display = 'block';
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
    console.log('Инициализация формы создания теста');
    
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
    
    // Инициализация формы при открытии модального окна
    const modal = document.getElementById('addTestModal');
    if (modal) {
        // Используем MutationObserver для отслеживания открытия модального окна
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'style') {
                    if (modal.style.display === 'flex') {
                        console.log('Модальное окно открыто, инициализация формы');
                        // Сбрасываем форму
                        resetForm();
                        // Рендерим форму
                        renderQuestionsForm();
                        
                        // Фокус на поле названия теста
                        setTimeout(() => {
                            const titleInput = document.getElementById('testTitle');
                            if (titleInput) {
                                titleInput.focus();
                            }
                        }, 100);
                    }
                }
            });
        });
        
        observer.observe(modal, { attributes: true });
    }
});
