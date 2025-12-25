# Инструкция по отладке n8n ноды

## Способ 1: Использование `debugger;` (рекомендуется)

1. **Откройте файл** `nodes/ArrayIfThen/ArrayIfThen.node.ts` в Cursor/VS Code

2. **Добавьте `debugger;` в нужное место**:
   ```typescript
   for (const condition of rule.conditions) {
       let fieldPathToResolve = condition.fieldPath;
       
       debugger; // Остановка здесь
       
       // ... остальной код
   }
   ```

3. **Соберите проект**:
   ```bash
   npm run build
   ```

4. **Запустите dev сервер с отладкой**:
   ```bash
   npm run dev:debug
   ```
   
   **ВАЖНО**: n8n запустится автоматически! Вы увидите в консоли:
   ```
   Debugger listening on ws://0.0.0.0:9229/...
   [n8n] Starting...
   ```

5. **В VS Code/Cursor**:
   - Откройте панель "Run and Debug" (Ctrl+Shift+D или Cmd+Shift+D)
   - Выберите конфигурацию **"Debug n8n Node (Attach)"**
   - Нажмите F5 или кнопку "Start Debugging"
   - Дождитесь сообщения "Debugger attached"

6. **Выполните workflow в n8n** - отладчик остановится на `debugger;`

## Способ 2: Breakpoints в VS Code/Cursor

1. **Откройте TypeScript файл** `nodes/ArrayIfThen/ArrayIfThen.node.ts`

2. **Поставьте breakpoint** (F9 или клик слева от номера строки)

3. **Запустите**:
   ```bash
   npm run dev:debug
   ```

4. **В VS Code/Cursor**:
   - Откройте панель "Run and Debug" (Ctrl+Shift+D)
   - Выберите **"Debug n8n Node (Attach)"**
   - Нажмите F5
   - Дождитесь "Debugger attached"

5. **Выполните workflow** - отладчик остановится на breakpoint

## Способ 3: Chrome DevTools

1. **Запустите**:
   ```bash
   npm run dev:debug
   ```

2. **Откройте Chrome** и перейдите: `chrome://inspect`

3. **Нажмите "inspect"** на процессе Node.js

4. **В DevTools**:
   - Перейдите на вкладку "Sources"
   - Найдите файлы в папке `nodes/ArrayIfThen/`
   - Поставьте breakpoints прямо в DevTools

## Важные замечания

- **Source maps должны быть включены** ✅ (уже настроено в `tsconfig.json`)
- **После изменения кода** нужно пересобрать: `npm run build`
- **Если breakpoints не работают**, попробуйте использовать `debugger;` вместо breakpoints
- **Порт 9229** должен быть свободен (если занят, измените порт в `package.json` и `launch.json`)
- **n8n запускается автоматически** - флаг `--inspect` не блокирует запуск, только включает отладчик

## Отладка через console.log

Если отладчик не работает, используйте уже добавленные логи:
- Все логи имеют префикс `[DEBUG ArrayIfThen]`
- Они выводятся в консоль, где запущен `npm run dev:debug`

## Проблемы и решения

**Проблема**: Breakpoints не останавливаются
- **Решение**: Используйте `debugger;` вместо breakpoints
- **Решение**: Убедитесь, что `npm run build` выполнен после изменений

**Проблема**: "Cannot connect to debugger"
- **Решение**: Проверьте, что порт 9229 свободен
- **Решение**: Убедитесь, что `npm run dev:debug` запущен

**Проблема**: Source maps не работают
- **Решение**: Проверьте `tsconfig.json` - должно быть `"sourceMap": true`
- **Решение**: Пересоберите проект: `npm run build`

