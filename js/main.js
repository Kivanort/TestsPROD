// Основной файл для главной страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('Main page loaded - DOMContentLoaded fired');
    
    // Инициализация менеджера тестов
    console.log('Initializing TestManager...');
    TestManager.init();
    
    // Инициализация модальных окон
    console.log('Initializing Modal...');
    Modal.init();
    
    // Регистрируем модальные окна
    console.log('Registering modals...');
    Modal.register('addTestModal', {
        onOpen: () => {
            console.log('Modal opened');
            
            // Восстанавливаем состояние вопросов при открытии модалки
            if (typeof renderQuestionsForm === 'function') {
                renderQuestionsForm();
            } else {
                console.error('renderQuestionsForm function not found!');
            }
            
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
            
            // Сбрасываем форму при закрытии
            if (typeof resetForm === 'function') {
                resetForm();
            } else {
                console.error('resetForm function not found!');
            }
        }
    });
    
    // Добавляем обработчик для кнопки добавления теста
    const addButton = document.getElementById('addTestBtn');
    console.log('Looking for addTestBtn:', addButton);
    
    if (addButton) {
        console.log('Add button found, adding click listener...');
        addButton.addEventListener('click', (e) => {
            console.log('Add test button clicked');
            e.preventDefault();
            e.stopPropagation();
            Modal.open('addTestModal');
        });
        
        // Добавим также обработчик для Enter на кнопке
        addButton.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                console.log('Add test button activated via keyboard');
                Modal.open('addTestModal');
            }
        });
    } else {
        console.error('addTestBtn button not found!');
    }
    
    // Добавляем обработчики для кнопок в форме
    setupFormHandlers();
    
    console.log('Main page initialization complete');
});

// Настройка обработчиков формы (только для главной страницы)
function setupFormHandlers() {
    console.log('Setting up form handlers');
    
    // Кнопка добавления вопроса
    const addQuestionBtn = document.getElementById('addQuestionBtn');
    console.log('Add question button:', addQuestionBtn);
    
    if (addQuestionBtn) {
        addQuestionBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Add question button clicked');
            
            if (typeof addQuestion === 'function') {
                addQuestion();
            } else {
                console.error('addQuestion function not found!');
            }
        });
    } else {
        console.warn('addQuestionBtn not found (might be on wrong page)');
    }
    
    // Кнопка удаления вопроса
    const removeQuestionBtn = document.getElementById('removeQuestionBtn');
    console.log('Remove question button:', removeQuestionBtn);
    
    if (removeQuestionBtn) {
        removeQuestionBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Remove question button clicked');
            
            if (typeof removeQuestion === 'function') {
                removeQuestion();
            } else {
                console.error('removeQuestion function not found!');
            }
        });
    } else {
        console.warn('removeQuestionBtn not found (might be on wrong page)');
    }
    
    // Кнопка сохранения теста
    const saveTestBtn = document.getElementById('saveTestBtn');
    console.log('Save test button:', saveTestBtn);
    
    if (saveTestBtn) {
        saveTestBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Save test button clicked');
            
            if (typeof handleSubmitTest === 'function') {
                handleSubmitTest(e);
            } else {
                console.error('handleSubmitTest function not found!');
            }
        });
    } else {
        console.warn('saveTestBtn not found (might be on wrong page)');
    }
    
    // Обработчик формы (для submit по Enter)
    const form = document.getElementById('new-test-form');
    console.log('New test form:', form);
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('Form submitted');
            
            if (typeof handleSubmitTest === 'function') {
                handleSubmitTest(e);
            } else {
                console.error('handleSubmitTest function not found!');
            }
        });
    } else {
        console.warn('new-test-form not found (might be on wrong page)');
    }
    
    console.log('Form handlers setup complete');
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

// Проверка доступности глобальных функций
console.log('Main.js loaded - checking global functions:');
console.log('typeof Modal:', typeof Modal);
console.log('typeof TestManager:', typeof TestManager);
console.log('typeof Utils:', typeof Utils);
console.log('typeof Storage:', typeof Storage);
