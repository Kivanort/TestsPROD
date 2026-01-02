// Работа с localStorage
const Storage = {
    // Ключи для хранения данных
    KEYS: {
        TESTS: 'platform_tests',
        PROGRESS: 'test_progress',
        USER_TESTS: 'user_tests'
    },
    
    // Сохранение тестов
    saveTests(tests) {
        try {
            localStorage.setItem(this.KEYS.TESTS, JSON.stringify(tests));
            return true;
        } catch (error) {
            console.error('Ошибка сохранения тестов:', error);
            return false;
        }
    },
    
    // Загрузка тестов
    loadTests() {
        try {
            const data = localStorage.getItem(this.KEYS.TESTS);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Ошибка загрузки тестов:', error);
            return null;
        }
    },
    
    // Сохранение прогресса
    saveProgress(testId, progress) {
        try {
            const allProgress = this.loadAllProgress();
            allProgress[testId] = progress;
            localStorage.setItem(this.KEYS.PROGRESS, JSON.stringify(allProgress));
            return true;
        } catch (error) {
            console.error('Ошибка сохранения прогресса:', error);
            return false;
        }
    },
    
    // Загрузка прогресса
    loadProgress(testId) {
        try {
            const allProgress = this.loadAllProgress();
            return allProgress[testId] || null;
        } catch (error) {
            console.error('Ошибка загрузки прогресса:', error);
            return null;
        }
    },
    
    // Загрузка всего прогресса
    loadAllProgress() {
        try {
            const data = localStorage.getItem(this.KEYS.PROGRESS);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Ошибка загрузки прогресса:', error);
            return {};
        }
    },
    
    // Сохранение пользовательских тестов
    saveUserTests(tests) {
        try {
            localStorage.setItem(this.KEYS.USER_TESTS, JSON.stringify(tests));
            return true;
        } catch (error) {
            console.error('Ошибка сохранения пользовательских тестов:', error);
            return false;
        }
    },
    
    // Загрузка пользовательских тестов
    loadUserTests() {
        try {
            const data = localStorage.getItem(this.KEYS.USER_TESTS);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Ошибка загрузки пользовательских тестов:', error);
            return [];
        }
    },
    
    // Добавление пользовательского теста
    addUserTest(test) {
        try {
            const tests = this.loadUserTests();
            tests.push(test);
            return this.saveUserTests(tests);
        } catch (error) {
            console.error('Ошибка добавления теста:', error);
            return false;
        }
    },
    
    // Обновление пользовательского теста
    updateUserTest(testId, updatedTest) {
        try {
            const tests = this.loadUserTests();
            const index = tests.findIndex(t => t.id === testId);
            if (index !== -1) {
                tests[index] = updatedTest;
                return this.saveUserTests(tests);
            }
            return false;
        } catch (error) {
            console.error('Ошибка обновления теста:', error);
            return false;
        }
    },
    
    // Удаление пользовательского теста
    deleteUserTest(testId) {
        try {
            const tests = this.loadUserTests();
            const filtered = tests.filter(test => test.id !== testId);
            return this.saveUserTests(filtered);
        } catch (error) {
            console.error('Ошибка удаления теста:', error);
            return false;
        }
    },
    
    // Очистка прогресса теста
    clearTestProgress(testId) {
        try {
            const allProgress = this.loadAllProgress();
            delete allProgress[testId];
            localStorage.setItem(this.KEYS.PROGRESS, JSON.stringify(allProgress));
            return true;
        } catch (error) {
            console.error('Ошибка очистки прогресса:', error);
            return false;
        }
    },
    
    // Получить все тесты (дефолтные + пользовательские)
    getAllTests() {
        try {
            const defaultTests = this.loadTests()?.tests || [];
            const userTests = this.loadUserTests() || [];
            return [...defaultTests, ...userTests];
        } catch (error) {
            console.error('Ошибка загрузки всех тестов:', error);
            return [];
        }
    }
};