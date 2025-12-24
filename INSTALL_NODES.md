# 🚀 Установка и запуск кастомных нод n8n

## Проблема: ноды не отображаются в n8n

Если ваши кастомные ноды не отображаются в n8n после запуска, следуйте этим шагам:

---

## ✅ Решение 1: Установка через npm install (РЕКОМЕНДУЕТСЯ)

### 1. Соберите проект:
```powershell
cd D:\repos\GNIVC\nodes\n8n-nodes-starter
npm run build
```

### 2. Установите пакет в n8n:
```powershell
cd ~/.n8n
npm install "D:\repos\GNIVC\nodes\n8n-nodes-starter" --force
```

### 3. Запустите n8n:
```powershell
cd D:\repos\GNIVC\nodes\n8n-nodes-starter
npx n8n start
```

### 4. Откройте браузер:
http://localhost:5678

---

## ✅ Решение 2: Автоматическая пересборка (для разработки)

### Вариант A: Два терминала (рекомендуется для разработки)

**Терминал 1 - Watch режим для автопересборки:**
```powershell
cd D:\repos\GNIVC\nodes\n8n-nodes-starter
npm run build:watch
```

**Терминал 2 - Запуск n8n:**
```powershell
cd D:\repos\GNIVC\nodes\n8n-nodes-starter
# Сначала установите в ~/.n8n (только один раз)
cd ~/.n8n
npm install "D:\repos\GNIVC\nodes\n8n-nodes-starter" --force
cd D:\repos\GNIVC\nodes\n8n-nodes-starter
# Затем запустите n8n
npx n8n start
```

### Вариант B: Один терминал (проще, но без автопересборки)
```powershell
cd D:\repos\GNIVC\nodes\n8n-nodes-starter
npm run dev:manual
```

---

## 🔄 При изменении кода нод

### Если используете Watch режим (Терминал 1 + 2):
1. Сохраните изменения в файле `.ts`
2. TypeScript автоматически пересоберет в `dist/`
3. **Перезапустите n8n** (Ctrl+C в Терминале 2, затем `npx n8n start`)

### Если НЕ используете Watch режим:
```powershell
# 1. Остановите n8n (Ctrl+C или)
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. Пересоберите:
npm run build

# 3. Переустановите в ~/.n8n:
cd ~/.n8n
npm install "D:\repos\GNIVC\nodes\n8n-nodes-starter" --force

# 4. Запустите n8n:
cd D:\repos\GNIVC\nodes\n8n-nodes-starter
npx n8n start
```

---

## 🐛 Отладка (Debugging)

### Запуск n8n с отладчиком:
```powershell
cd D:\repos\GNIVC\nodes\n8n-nodes-starter
$env:NODE_OPTIONS="--inspect=0.0.0.0:9229"
npx n8n start
```

Затем в VS Code/Cursor:
1. Откройте "Run and Debug" (Ctrl+Shift+D)
2. Выберите "Debug n8n Node (Attach)"
3. Нажмите F5

---

## 📋 Проверка установки

### Проверьте, что пакет установлен:
```powershell
Test-Path "~/.n8n/node_modules/n8n-nodes-starter"
# Должно вернуть: True
```

### Проверьте, что dist/ содержит скомпилированные файлы:
```powershell
ls ~/.n8n/node_modules/n8n-nodes-starter/dist/nodes/
# Должны быть папки: ArrayCondition, ArrayIfThen, HeaderCondition
```

---

## ❌ Остановка всех процессов node

Если n8n не запускается (порт занят):
```powershell
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
```

---

## 🎯 Быстрый старт (TL;DR)

```powershell
# 1. Убить старые процессы
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. Собрать и установить
cd D:\repos\GNIVC\nodes\n8n-nodes-starter
npm run build
cd ~/.n8n
npm install "D:\repos\GNIVC\nodes\n8n-nodes-starter" --force

# 3. Запустить n8n
cd D:\repos\GNIVC\nodes\n8n-nodes-starter
npx n8n start

# 4. Открыть браузер
# http://localhost:5678
```

---

## 📚 Дополнительная информация

- **Логи n8n:** Смотрите в терминале, где запущен n8n
- **Логи сборки:** Смотрите вывод `npm run build`
- **Отладка:** См. файл `DEBUG_INSTRUCTIONS.md`

