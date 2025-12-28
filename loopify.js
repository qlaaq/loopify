class loopify {
  constructor(data) {
    this.data = data;
  }

  // Основной метод парсинга переменных
  _parseVariables(html, context = {}) {
    return html.replace(/\{\{([\w.\[\]]+)\}\}/g, (match, path) => {
      try {
        // 1. Разбираем путь (поддерживаем точку и квадратные скобки)
        const keys = path
          .replace(/\[/g, '.')  // [ → .
          .replace(/\]/g, '')     // ] → ''
          .split('.');
        
        // 2. Создаём объединённый контекст: локальный + глобальный
        const fullContext = { ...context, ...this.data };
        let value = fullContext;
        
        // 3. Проходим по ключам
        for (const key of keys) {
          if (value == null) return match;
          value = value[key];
        }
        
        return value != null ? String(value) : match;
      } catch (e) {
        return match; // При ошибке возвращаем исходную конструкцию
      }
    });
  }

  // Обработка циклов (с опциональным "as имя")
  _processLoops(html) {
    // Регулярка: ловит LOOP с опциональным "as имя"
    const regex = /<!-- LOOP:(\w+)(?:\s+as\s+(\w+))? -->([\s\S]*?)<!-- ENDLOOP -->/g;
    
    return html.replace(regex, (match, arrayKey, itemVarName, template) => {
      const array = this.data[arrayKey] || [];
      
      // Если имя не задано, используем дефолтное — "item"
      const varName = itemVarName || 'item';
      
      return array.map(item => {
        // Создаём контекст с нужным именем переменной
        const context = { [varName]: item };
        // Парсим переменные в шаблоне с этим контекстом
        return this._parseVariables(template, context);
      }).join('');
    });
  }

  mount(selector = "body") {
    const container = document.querySelector(selector);
    if (!container) throw new Error(`Элемент "${selector}" не найден`);
    
    let result = container.innerHTML;
    result = this._processLoops(result);
    result = this._parseVariables(result);
    container.innerHTML = result;
  }
}
