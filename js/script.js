/* =====================================================
   ПРОФЕССИОНАЛЬНЫЙ JAVASCRIPT ДЛЯ САЙТА ПО ПАРАМЕТРАМ
   Версия: 2.0 | Уровень: Университетский
   ===================================================== */

// =====================================================
// 1. ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ И КОНФИГУРАЦИЯ
// =====================================================
const APP_CONFIG = {
  animationDuration: 600,
  scrollThreshold: 300,
  searchDebounceDelay: 300,
  toastDuration: 4000,
  theme: {
    storageKey: 'preferred-theme',
    default: 'light'
  },
  stats: {
    animationDuration: 2000,
    updateInterval: 50
  }
};

// Глобальное состояние приложения
const AppState = {
  currentFilter: 'all',
  searchQuery: '',
  isScrolled: false,
  activeExample: null,
  theme: localStorage.getItem(APP_CONFIG.theme.storageKey) || APP_CONFIG.theme.default
};

// =====================================================
// 2. УТИЛИТЫ И ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// =====================================================

/**
 * Debounce функция для оптимизации частых вызовов
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle функция для ограничения частоты вызовов
 */
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Плавная прокрутка к элементу
 */
function smoothScrollTo(element, offset = 0) {
  const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
  const offsetPosition = elementPosition - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });
}

/**
 * Проверка видимости элемента во viewport
 */
function isElementInViewport(el, threshold = 0) {
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 - threshold &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + threshold &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Генерация уникального ID
 */
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Форматирование числа с анимацией
 */
function animateNumber(element, target, duration = 2000) {
  const start = 0;
  const increment = target / (duration / 16);
  let current = start;

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = Math.round(target);
      clearInterval(timer);
    } else {
      element.textContent = Math.round(current);
    }
  }, 16);
}

// =====================================================
// 3. УПРАВЛЕНИЕ ТЕМОЙ
// =====================================================

class ThemeManager {
  constructor() {
    this.theme = AppState.theme;
    this.init();
  }

  init() {
    this.applyTheme(this.theme);
    this.createToggleButton();
  }

  createToggleButton() {
    const button = document.createElement('button');
    button.className = 'theme-toggle';
    button.setAttribute('aria-label', 'Переключить тему');
    button.innerHTML = `
      <span class="theme-icon">${this.theme === 'dark' ? '☀️' : '🌙'}</span>
      <span class="theme-text">${this.theme === 'dark' ? 'Светлая' : 'Темная'}</span>
    `;
    
    button.addEventListener('click', () => this.toggle());
    
    const nav = document.querySelector('nav');
    if (nav) {
      nav.appendChild(button);
    }
  }

  toggle() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    this.applyTheme(this.theme);
    this.updateButton();
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(APP_CONFIG.theme.storageKey, theme);
    AppState.theme = theme;
  }

  updateButton() {
    const button = document.querySelector('.theme-toggle');
    if (button) {
      button.innerHTML = `
        <span class="theme-icon">${this.theme === 'dark' ? '☀️' : '🌙'}</span>
        <span class="theme-text">${this.theme === 'dark' ? 'Светлая' : 'Темная'}</span>
      `;
    }
  }
}

// =====================================================
// 4. СИСТЕМА УВЕДОМЛЕНИЙ (TOAST)
// =====================================================

class ToastManager {
  constructor() {
    this.container = this.createContainer();
  }

  createContainer() {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  show(message, type = 'info', duration = APP_CONFIG.toastDuration) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <div class="toast-message">${message}</div>
      <button class="toast-close" aria-label="Закрыть">×</button>
    `;

    this.container.appendChild(toast);

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => this.hide(toast));

    if (duration > 0) {
      setTimeout(() => this.hide(toast), duration);
    }

    return toast;
  }

  hide(toast) {
    toast.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  success(message) {
    return this.show(message, 'success');
  }

  error(message) {
    return this.show(message, 'error');
  }

  warning(message) {
    return this.show(message, 'warning');
  }

  info(message) {
    return this.show(message, 'info');
  }
}

// =====================================================
// 5. УПРАВЛЕНИЕ ЗАГРУЗКОЙ
// =====================================================

class LoaderManager {
  constructor() {
    this.loader = this.createLoader();
  }

  createLoader() {
    let loader = document.querySelector('.loader');
    if (!loader) {
      loader = document.createElement('div');
      loader.className = 'loader';
      loader.innerHTML = '<div class="loader-spinner"></div>';
      document.body.appendChild(loader);
    }
    return loader;
  }

  show() {
    this.loader.classList.remove('hidden');
  }

  hide() {
    this.loader.classList.add('hidden');
  }
}

// =====================================================
// 6. ПРОГРЕСС БАР ПРОКРУТКИ
// =====================================================

class ProgressBar {
  constructor() {
    this.bar = this.createBar();
    this.init();
  }

  createBar() {
    let bar = document.querySelector('.progress-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'progress-bar';
      document.body.appendChild(bar);
    }
    return bar;
  }

  init() {
    window.addEventListener('scroll', throttle(() => this.update(), 10));
    this.update();
  }

  update() {
    const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (window.pageYOffset / windowHeight) * 100;
    this.bar.style.width = `${scrolled}%`;
  }
}

// =====================================================
// 7. КНОПКА "НАВЕРХ"
// =====================================================

class ScrollToTop {
  constructor() {
    this.button = this.createButton();
    this.init();
  }

  createButton() {
    let button = document.querySelector('.scroll-to-top');
    if (!button) {
      button = document.createElement('button');
      button.className = 'scroll-to-top';
      button.setAttribute('aria-label', 'Прокрутить наверх');
      button.innerHTML = '↑';
      document.body.appendChild(button);
    }
    return button;
  }

  init() {
    this.button.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });

    window.addEventListener('scroll', throttle(() => this.toggle(), 100));
    this.toggle();
  }

  toggle() {
    if (window.pageYOffset > APP_CONFIG.scrollThreshold) {
      this.button.classList.add('visible');
    } else {
      this.button.classList.remove('visible');
    }
  }
}

// =====================================================
// 8. УПРАВЛЕНИЕ ПРИМЕРАМИ
// =====================================================

class ExamplesManager {
  constructor() {
    this.examples = document.querySelectorAll('.example');
    this.filterSelect = document.getElementById('typeFilter');
    this.searchInput = document.getElementById('searchBox');
    this.init();
  }

  init() {
    if (this.filterSelect) {
      this.filterSelect.addEventListener('change', () => this.filter());
    }

    if (this.searchInput) {
      this.searchInput.addEventListener('input', debounce(() => this.search(), APP_CONFIG.searchDebounceDelay));
    }

    this.setupToggleButtons();
    this.filter();
  }

  setupToggleButtons() {
    const buttons = document.querySelectorAll('.toggle-btn');
    buttons.forEach(button => {
      button.addEventListener('click', () => this.toggleSolution(button));
    });
  }

  toggleSolution(button) {
    const solution = button.nextElementSibling;
    const isVisible = solution.classList.contains('visible');

    if (isVisible) {
      solution.classList.remove('visible');
      button.classList.remove('active');
      button.innerHTML = '<span class="icon">▼</span> Показать решение';
    } else {
      solution.classList.add('visible');
      button.classList.add('active');
      button.innerHTML = '<span class="icon">▲</span> Скрыть решение';
      
      // Плавная прокрутка к решению
      setTimeout(() => {
        smoothScrollTo(solution, 100);
      }, 100);
    }
  }

  filter() {
    const filterValue = this.filterSelect ? this.filterSelect.value : 'all';
    const searchValue = this.searchInput ? this.searchInput.value.toLowerCase() : '';

    AppState.currentFilter = filterValue;
    AppState.searchQuery = searchValue;

    let visibleCount = 0;

    this.examples.forEach(example => {
      const type = example.dataset.type;
      const text = example.textContent.toLowerCase();

      const matchesFilter = filterValue === 'all' || type === filterValue;
      const matchesSearch = searchValue === '' || text.includes(searchValue);

      if (matchesFilter && matchesSearch) {
        example.style.display = 'block';
        example.style.animation = 'none';
        setTimeout(() => {
          example.style.animation = '';
        }, 10);
        visibleCount++;
      } else {
        example.style.display = 'none';
      }
    });

    // Обновляем счетчик найденных примеров
    this.updateResultsCount(visibleCount);
  }

  search() {
    this.filter();
  }

  updateResultsCount(count) {
    let counter = document.querySelector('.results-count');
    if (!counter) {
      counter = document.createElement('div');
      counter.className = 'results-count';
      const controls = document.querySelector('.controls');
      if (controls) {
        controls.insertAdjacentElement('afterend', counter);
      }
    }

    if (AppState.searchQuery || AppState.currentFilter !== 'all') {
      counter.textContent = `Найдено примеров: ${count}`;
      counter.style.display = 'block';
    } else {
      counter.style.display = 'none';
    }
  }
}

// =====================================================
// 9. АНИМАЦИЯ ПОЯВЛЕНИЯ ЭЛЕМЕНТОВ
// =====================================================

class ScrollAnimations {
  constructor() {
    this.elements = document.querySelectorAll('.example, .stat-card');
    this.init();
  }

  init() {
    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    this.elements.forEach(el => this.observer.observe(el));
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        
        // Анимация чисел в статистике
        if (entry.target.classList.contains('stat-card')) {
          const number = entry.target.querySelector('h3');
          if (number && !number.dataset.animated) {
            const target = parseInt(number.textContent);
            animateNumber(number, target);
            number.dataset.animated = 'true';
          }
        }
      }
    });
  }
}

// =====================================================
// 10. ПОДСВЕТКА АКТИВНЫХ ЭЛЕМЕНТОВ
// =====================================================

class ActiveHighlighter {
  constructor() {
    this.examples = document.querySelectorAll('.example');
    this.init();
  }

  init() {
    const observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      {
        threshold: 0.5,
        rootMargin: '-100px 0px -100px 0px'
      }
    );

    this.examples.forEach(el => observer.observe(el));
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Убираем подсветку у всех
        this.examples.forEach(ex => ex.classList.remove('highlighted'));
        
        // Добавляем подсветку текущему
        entry.target.classList.add('highlighted');
        AppState.activeExample = entry.target;
      }
    });
  }
}

// =====================================================
// 11. УПРАВЛЕНИЕ НАВИГАЦИЕЙ
// =====================================================

class NavigationManager {
  constructor() {
    this.header = document.querySelector('header');
    this.links = document.querySelectorAll('.nav-link');
    this.init();
  }

  init() {
    this.highlightCurrentPage();
    this.setupScrollEffect();
    this.setupSmoothScroll();
  }

  highlightCurrentPage() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    this.links.forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPage || (currentPage === '' && href === 'index.html')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  setupScrollEffect() {
    let lastScroll = 0;

    window.addEventListener('scroll', throttle(() => {
      const currentScroll = window.pageYOffset;

      if (currentScroll > 100) {
        this.header.classList.add('scrolled');
      } else {
        this.header.classList.remove('scrolled');
      }

      lastScroll = currentScroll;
    }, 100));
  }

  setupSmoothScroll() {
    this.links.forEach(link => {
      if (link.getAttribute('href').startsWith('#')) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const target = document.querySelector(link.getAttribute('href'));
          if (target) {
            smoothScrollTo(target, 100);
          }
        });
      }
    });
  }
}

// =====================================================
// 12. ГОРЯЧИЕ КЛАВИШИ
// =====================================================

class KeyboardShortcuts {
  constructor() {
    this.init();
  }

  init() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + K - фокус на поиск
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('searchBox');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }

      // Escape - закрыть все модальные окна и сбросить фильтры
      if (e.key === 'Escape') {
        const searchInput = document.getElementById('searchBox');
        if (searchInput && searchInput.value) {
          searchInput.value = '';
          searchInput.dispatchEvent(new Event('input'));
        }
      }

      // Ctrl/Cmd + / - показать справку по горячим клавишам
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        this.showHelpModal();
      }
    });
  }

  showHelpModal() {
    const toast = new ToastManager();
    toast.info('Горячие клавиши: Ctrl+K (поиск), Esc (сброс), Ctrl+/ (справка)');
  }
}

// =====================================================
// 13. ЛОКАЛЬНОЕ ХРАНИЛИЩЕ
// =====================================================

class StorageManager {
  constructor() {
    this.storageKey = 'egeMathData';
  }

  save(key, value) {
    try {
      const data = this.getAll();
      data[key] = value;
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Ошибка сохранения в localStorage:', error);
      return false;
    }
  }

  get(key) {
    try {
      const data = this.getAll();
      return data[key];
    } catch (error) {
      console.error('Ошибка чтения из localStorage:', error);
      return null;
    }
  }

  getAll() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Ошибка парсинга localStorage:', error);
      return {};
    }
  }

  remove(key) {
    try {
      const data = this.getAll();
      delete data[key];
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Ошибка удаления из localStorage:', error);
      return false;
    }
  }

  clear() {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error('Ошибка очистки localStorage:', error);
      return false;
    }
  }
}

// =====================================================
// 14. СТАТИСТИКА ПОЛЬЗОВАТЕЛЯ
// =====================================================

class UserStats {
  constructor() {
    this.storage = new StorageManager();
    this.init();
  }

  init() {
    this.trackVisit();
    this.trackSolvedExamples();
  }

  trackVisit() {
    const visits = this.storage.get('visits') || 0;
    this.storage.save('visits', visits + 1);
    this.storage.save('lastVisit', new Date().toISOString());
  }

  trackSolvedExamples() {
    const buttons = document.querySelectorAll('.toggle-btn');
    buttons.forEach((button, index) => {
      button.addEventListener('click', () => {
        const solved = this.storage.get('solvedExamples') || [];
        if (!solved.includes(index)) {
          solved.push(index);
          this.storage.save('solvedExamples', solved);
        }
      });
    });
  }

  getStats() {
    return {
      visits: this.storage.get('visits') || 0,
      lastVisit: this.storage.get('lastVisit'),
      solvedExamples: (this.storage.get('solvedExamples') || []).length
    };
  }
}

// =====================================================
// 15. КОПИРОВАНИЕ В БУФЕР ОБМЕНА
// =====================================================

class ClipboardManager {
  static async copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      const toast = new ToastManager();
      toast.success('Скопировано в буфер обмена!');
      return true;
    } catch (error) {
      console.error('Ошибка копирования:', error);
      const toast = new ToastManager();
      toast.error('Не удалось скопировать');
      return false;
    }
  }

  static setupCopyButtons() {
    // Добавляем кнопки копирования к формулам
    const formulas = document.querySelectorAll('.task-text');
    formulas.forEach(formula => {
      const button = document.createElement('button');
      button.className = 'copy-button';
      button.textContent = '📋';
      button.title = 'Копировать условие';
      button.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: var(--primary-color);
        color: white;
        border: none;
        border-radius: 6px;
        padding: 5px 10px;
        cursor: pointer;
        font-size: 16px;
        opacity: 0;
        transition: opacity 0.3s;
      `;
      
      formula.style.position = 'relative';
      formula.appendChild(button);

      formula.addEventListener('mouseenter', () => {
        button.style.opacity = '1';
      });

      formula.addEventListener('mouseleave', () => {
        button.style.opacity = '0';
      });

      button.addEventListener('click', () => {
        const text = formula.textContent.replace(button.textContent, '').trim();
        ClipboardManager.copy(text);
      });
    });
  }
}

// =====================================================
// 16. ПЕЧАТЬ СТРАНИЦЫ
// =====================================================

class PrintManager {
  static setupPrintButton() {
    const button = document.createElement('button');
    button.className = 'print-button';
    button.innerHTML = '🖨️ Версия для печати';
    button.style.cssText = `
      position: fixed;
      bottom: 6rem;
      right: 2rem;
      background: var(--gradient-blue);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 600;
      box-shadow: var(--shadow-xl);
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s;
    `;

    document.body.appendChild(button);

    // Показываем кнопку при прокрутке
    window.addEventListener('scroll', throttle(() => {
      if (window.pageYOffset > 500) {
        button.style.opacity = '1';
        button.style.visibility = 'visible';
      } else {
        button.style.opacity = '0';
        button.style.visibility = 'hidden';
      }
    }, 100));

    button.addEventListener('click', () => {
      window.print();
    });
  }

  static beforePrint() {
    // Раскрываем все решения перед печатью
    const solutions = document.querySelectorAll('.solution');
    solutions.forEach(solution => {
      solution.style.display = 'block';
    });
  }

  static afterPrint() {
    // Возвращаем состояние после печати
    const solutions = document.querySelectorAll('.solution');
    solutions.forEach(solution => {
      if (!solution.classList.contains('visible')) {
        solution.style.display = 'none';
      }
    });
  }

  static init() {
    window.addEventListener('beforeprint', PrintManager.beforePrint);
    window.addEventListener('afterprint', PrintManager.afterPrint);
    PrintManager.setupPrintButton();
  }
}

// =====================================================
// 17. ЭКСПОРТ ДАННЫХ
// =====================================================

class DataExporter {
  static exportToJSON() {
    const examples = [];
    document.querySelectorAll('.example').forEach((example, index) => {
      const title = example.querySelector('h3').textContent;
      const task = example.querySelector('.task-text').textContent;
      const solution = example.querySelector('.solution').textContent;
      const type = example.dataset.type;

      examples.push({
        id: index + 1,
        title,
        task,
        solution,
        type
      });
    });

    const dataStr = JSON.stringify(examples, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `ege-math-examples-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    
    const toast = new ToastManager();
    toast.success('Данные экспортированы в JSON!');
  }
}

// =====================================================
// 18. АНАЛИТИКА (ПРОСТАЯ)
// =====================================================

class Analytics {
  constructor() {
    this.events = [];
  }

  track(eventName, data = {}) {
    const event = {
      name: eventName,
      data,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };
    
    this.events.push(event);
    console.log('📊 Analytics:', event);
    
    // Сохраняем в localStorage
    const storage = new StorageManager();
    const allEvents = storage.get('analyticsEvents') || [];
    allEvents.push(event);
    storage.save('analyticsEvents', allEvents.slice(-100)); // Храним последние 100 событий
  }

  getEvents() {
    const storage = new StorageManager();
    return storage.get('analyticsEvents') || [];
  }
}

// =====================================================
// 19. ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
// =====================================================

class App {
  constructor() {
    this.components = {};
    this.init();
  }

  async init() {
    // Показываем загрузчик
    this.components.loader = new LoaderManager();
    this.components.loader.show();

    // Ждем загрузки DOM
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }

    // Инициализируем компоненты
    this.initializeComponents();

    // Скрываем загрузчик
    setTimeout(() => {
      this.components.loader.hide();
    }, 500);

    // Трекаем загрузку
    this.components.analytics.track('page_load', {
      page: window.location.pathname
    });
  }

  initializeComponents() {
    // Основные компоненты
    this.components.theme = new ThemeManager();
    this.components.toast = new ToastManager();
    this.components.analytics = new Analytics();
    
    // UI компоненты
    this.components.progressBar = new ProgressBar();
    this.components.scrollToTop = new ScrollToTop();
    this.components.navigation = new NavigationManager();
    
    // Управление контентом
    this.components.examples = new ExamplesManager();
    this.components.scrollAnimations = new ScrollAnimations();
    this.components.highlighter = new ActiveHighlighter();
    
    // Дополнительные функции
    this.components.shortcuts = new KeyboardShortcuts();
    this.components.userStats = new UserStats();
    
    // Утилиты
    ClipboardManager.setupCopyButtons();
    PrintManager.init();

  }
}

// =====================================================
// 20. ЗАПУСК ПРИЛОЖЕНИЯ
// =====================================================

// Создаем глобальный экземпляр приложения
const app = new App();

// Экспортируем в глобальную область для доступа из консоли
window.EGE_APP = {
  app,
  config: APP_CONFIG,
  state: AppState,
  utils: {
    debounce,
    throttle,
    smoothScrollTo,
    isElementInViewport,
    generateId,
    animateNumber
  },
  managers: {
    ThemeManager,
    ToastManager,
    LoaderManager,
    StorageManager
  },
  exportToJSON: DataExporter.exportToJSON
};

// Вывод информации в консоль для разработчиков
console.log(`
%c🎓 ЕГЭ Математика - Параметры %c
Версия: 2.0
Разработано для школьного проекта

Доступные команды:
- EGE_APP.state - текущее состояние
- EGE_APP.exportToJSON() - экспорт данных
- EGE_APP.app.components.toast.success('text') - показать уведомление

`, 'color: #2563eb; font-size: 16px; font-weight: bold;', '');