// Modal Management System
const Modal = {
    // Активное модальное окно
    activeModal: null,
    
    // Конфигурация модальных окон
    modals: {},
    
    // Инициализация
    init() {
        // Закрытие модальных окон при клике вне контента
        document.addEventListener('click', (e) => {
            if (this.activeModal && e.target.classList.contains('modal-overlay')) {
                this.close();
            }
        });
        
        // Закрытие по ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.close();
            }
        });
        
        // Регистрируем существующие модальные окна
        this.registerExistingModals();
        
        return this;
    },
    
    // Регистрация существующих модальных окон
    registerExistingModals() {
        const existingModals = document.querySelectorAll('.modal-overlay');
        existingModals.forEach(modal => {
            if (modal.id) {
                this.register(modal.id);
            }
        });
    },
    
    // Регистрация модального окна
    register(id, options = {}) {
        const modalElement = document.getElementById(id);
        if (!modalElement) {
            console.warn(`Modal element with id "${id}" not found`);
            return this;
        }
        
        this.modals[id] = {
            id,
            element: modalElement,
            onOpen: options.onOpen || null,
            onClose: options.onClose || null,
            closeOnOverlayClick: options.closeOnOverlayClick !== false,
            closeOnEsc: options.closeOnEsc !== false
        };
        
        // Находим кнопки закрытия внутри модалки
        const closeButtons = modalElement.querySelectorAll('[data-modal-close], .close-btn');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.close();
            });
        });
        
        return this;
    },
    
    // Открытие модального окна
    open(id, data = {}) {
        // Закрываем текущее модальное окно
        if (this.activeModal) {
            this.close();
        }
        
        const modal = this.modals[id];
        if (!modal) {
            console.error(`Modal "${id}" not registered`);
            return;
        }
        
        this.activeModal = modal;
        
        // Показываем модальное окно
        modal.element.style.display = 'flex';
        
        // Блокируем скролл страницы
        document.body.style.overflow = 'hidden';
        
        // Добавляем класс для анимации
        modal.element.classList.add('modal-open');
        
        // Вызываем callback onOpen
        if (modal.onOpen && typeof modal.onOpen === 'function') {
            modal.onOpen(data);
        }
        
        // Фокусируемся на первом интерактивном элементе
        setTimeout(() => {
            const focusable = modal.element.querySelector('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
            if (focusable) {
                focusable.focus();
            }
        }, 100);
    },
    
    // Закрытие модального окна
    close() {
        if (!this.activeModal) return;
        
        const modal = this.activeModal;
        
        // Скрываем модальное окно
        modal.element.style.display = 'none';
        modal.element.classList.remove('modal-open');
        
        // Разблокируем скролл страницы
        document.body.style.overflow = '';
        
        // Вызываем callback onClose
        if (modal.onClose && typeof modal.onClose === 'function') {
            modal.onClose();
        }
        
        this.activeModal = null;
    },
    
    // Создание модального окна на лету
    create(options) {
        const {
            id = `modal-${Date.now()}`,
            title = '',
            content = '',
            showCloseButton = true,
            buttons = [],
            width = '500px',
            onClose = null
        } = options;
        
        // Создаем HTML структуру
        const modalHTML = `
            <div class="modal-overlay" id="${id}">
                <div class="modal" style="max-width: ${width}">
                    <div class="modal-header">
                        <h2>${title}</h2>
                        ${showCloseButton ? '<button class="close-btn" data-modal-close>✕</button>' : ''}
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    ${buttons.length > 0 ? `
                        <div class="form-actions">
                            ${buttons.map(btn => `
                                <button type="button" 
                                        class="btn ${btn.className || 'btn-secondary'}"
                                        ${btn.id ? `id="${btn.id}"` : ''}>
                                    ${btn.text}
                                </button>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        // Добавляем в DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Регистрируем модальное окно
        this.register(id, { onClose });
        
        // Назначаем обработчики для кнопок
        if (buttons.length > 0) {
            setTimeout(() => {
                buttons.forEach((btn, index) => {
                    if (btn.onClick) {
                        const buttonElement = document.querySelector(`#${id} .btn:nth-child(${index + 1})`);
                        if (buttonElement) {
                            buttonElement.addEventListener('click', btn.onClick);
                        }
                    }
                });
            }, 0);
        }
        
        return id;
    },
    
    // Показать подтверждение
    confirm(options) {
        return new Promise((resolve) => {
            const {
                title = 'Подтверждение',
                message = 'Вы уверены?',
                confirmText = 'Да',
                cancelText = 'Отмена',
                confirmClass = 'btn-primary',
                cancelClass = 'btn-secondary'
            } = options;
            
            const modalId = this.create({
                title,
                content: `<p>${message}</p>`,
                buttons: [
                    {
                        text: cancelText,
                        className: cancelClass,
                        onClick: () => {
                            resolve(false);
                            this.remove(modalId);
                        }
                    },
                    {
                        text: confirmText,
                        className: confirmClass,
                        onClick: () => {
                            resolve(true);
                            this.remove(modalId);
                        }
                    }
                ]
            });
            
            this.open(modalId);
        });
    },
    
    // Показать алерт
    alert(options) {
        return new Promise((resolve) => {
            const {
                title = 'Уведомление',
                message = '',
                buttonText = 'OK',
                buttonClass = 'btn-primary'
            } = options;
            
            const modalId = this.create({
                title,
                content: `<p>${message}</p>`,
                buttons: [{
                    text: buttonText,
                    className: buttonClass,
                    onClick: () => {
                        resolve();
                        this.remove(modalId);
                    }
                }]
            });
            
            this.open(modalId);
        });
    },
    
    // Удаление модального окна
    remove(id) {
        const modal = this.modals[id];
        if (modal) {
            if (this.activeModal && this.activeModal.id === id) {
                this.close();
            }
            if (modal.element && modal.element.parentNode) {
                modal.element.parentNode.removeChild(modal.element);
            }
            delete this.modals[id];
        }
    },
    
    // Обновление содержимого модального окна
    updateContent(id, content) {
        const modal = this.modals[id];
        if (modal && modal.element) {
            const body = modal.element.querySelector('.modal-body');
            if (body) {
                body.innerHTML = content;
            }
        }
    },
    
    // Показать индикатор загрузки
    showLoader(id = 'loader-modal') {
        if (this.modals[id]) {
            this.open(id);
            return;
        }
        
        const modalId = this.create({
            id,
            title: 'Загрузка',
            content: '<div class="loader"><div></div><div></div><div></div><div></div></div>',
            showCloseButton: false,
            buttons: [],
            width: '300px'
        });
        
        this.open(modalId);
    },
    
    // Скрыть индикатор загрузки
    hideLoader(id = 'loader-modal') {
        if (this.modals[id]) {
            this.close();
            this.remove(id);
        }
    },
    
    // Проверка, открыто ли модальное окно
    isOpen(id = null) {
        if (id) {
            return this.activeModal && this.activeModal.id === id;
        }
        return this.activeModal !== null;
    }
};

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    Modal.init();
});
