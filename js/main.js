// Основной файл для главной страницы
document.addEventListener('DOMContentLoaded', () => {
    // Инициализация менеджера тестов
    TestManager.init();
    
    // Инициализация модальных окон
    Modal.init();
    
    // Регистрируем модальные окна
    Modal.register('addTestModal', {
        onOpen: () => {
            console.log('Modal opened');
            renderQuestionsForm();
            // Фокус на поле названия теста
            setTimeout(() => {
                const titleInput = document.getElementById('testTitle');
                if (titleInput) {
                    titleInput.focus();
                }
            }, 100);
        },
        onClose: () => {
            console.log('Modal closed');
            resetForm();
        }
    });
    
    // Добавляем обработчик для кнопки добавления теста
    const addButton = document.getElementById('addTestBtn');
    if (addButton) {
        addButton.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Add test button clicked');
            Modal.open('addTestModal');
        });
    }
    
    // Добавляем обработчики для кнопок в форме
    setupFormHandlers();
});

// Настройка обработчиков формы
function setupFormHandlers() {
    // Кнопка добавления вопроса
    const addQuestionBtn = document.getElementById('addQuestionBtn');
    if (addQuestionBtn) {
        addQuestionBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Add question button clicked');
            addQuestion();
        });
    }
    
    // Кнопка удаления вопроса
    const removeQuestionBtn = document.getElementById('removeQuestionBtn');
    if (removeQuestionBtn) {
        removeQuestionBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Remove question button clicked');
            removeQuestion();
        });
    }
    
    // Кнопка сохранения теста
    const saveTestBtn = document.getElementById('saveTestBtn');
    if (saveTestBtn) {
        saveTestBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Save test button clicked');
            handleSubmitTest(e);
        });
    }
    
    // Обработчик формы
    const form = document.getElementById('new-test-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('Form submitted');
            handleSubmitTest(e);
        });
    }
}

// Переменные для формы создания теста
let currentQuestions = [{
    id: 1,
    text: '',
    options: ['', '', '', ''],
    correctAnswer: null
}];

// Рендеринг формы вопросов
function renderQuestionsForm() {
    const container = document.getElementById('questions-container');
    if (!container) {
        console.error('questions-container not found');
        return;
    }
    
    console.log('Rendering questions form with', currentQuestions.length, 'questions');
    
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
    console.log('Adding input listeners');
    
    // Тексты вопросов
    document.querySelectorAll('.question-text-input').forEach(input => {
        input.addEventListener('input', (e) => {
            const index = parseInt(e.target.dataset.questionIndex);
            currentQuestions[index].text = e.target.value.trim();
            console.log('Question text updated:', currentQuestions[index].text);
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
            console.log('Option updated:', currentQuestions[questionIndex].options[optionIndex]);
            e.target.classList.remove('error');
        });
    });
    
    // Правильные ответы
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const questionIndex = parseInt(e.target.dataset.questionIndex);
            const optionIndex = parseInt(e.target.dataset.optionIndex);
            currentQuestions[questionIndex].correctAnswer = optionIndex;
            console.log('Correct answer updated:', currentQuestions[questionIndex].correctAnswer);
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
    console.log('Adding new question');
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
    console.log('Removing question');
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
    console.log('Resetting form');
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
    console.log('Handling form submission');
    
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // Валидация названия теста
    const titleInput = document.getElementById('testTitle');
    const titleError = document.getElementById('titleError');
    const title = titleInput?.value.trim() || '';
    
    console.log('Test title:', title);
    
    if (!title) {
        if (titleInput) titleInput.classList.add('error');
        if (titleError) {
            titleError.style.display = 'block';
            titleError.textContent = 'Пожалуйста, введите название теста';
        }
        if (titleInput) titleInput.focus();
        return;
    }
    
    if (titleInput) titleInput.classList.remove('error');
    if (titleError) titleError.style.display = 'none';
    
    // Валидация всех вопросов
    if (!validateAllQuestions()) {
        console.log('Validation failed');
        await Modal.alert({
            title: 'Ошибка',
            message: 'Пожалуйста, заполните все поля и выберите правильные ответы'
        });
        return;
    }
    
    console.log('All validation passed, creating test...');
    
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
        
        console.log('Test data prepared:', testData);
        
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
        console.log('Test created with ID:', testId);
        
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
