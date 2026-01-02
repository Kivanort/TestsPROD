// Основной файл для главной страницы
document.addEventListener('DOMContentLoaded', () => {
    // Инициализация менеджера тестов
    TestManager.init();
    
    // Инициализация модальных окон
    Modal.init();
    
    // Регистрируем модальные окна
    Modal.register('addTestModal', {
        onOpen: () => {
            renderQuestionsForm();
        },
        onClose: () => {
            resetForm();
        }
    });
    
    // Добавляем обработчик для кнопки добавления теста
    const addButton = document.getElementById('addTestBtn');
    if (addButton) {
        addButton.addEventListener('click', () => {
            Modal.open('addTestModal');
        });
    }
});
