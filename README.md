# HH.ru-autotest
Помогает вам автоматически решать тесты на HH.ru с помощью локального ИИ
(нужно установить ЛЮБУЮ модель через LM Studio) и расширение Tampermonkey.

По сути ваши шаги таковы:
1.1 Скачайте LM Studio: https://lmstudio.ai/;
В LM Studio выберите и загрузите любую языковую модель (например, Mistral, Llama, GPT-3 и т.д.);
После загрузки — выберите модель вверху и нажмите “Launch” или “Загрузить модель”;

1.2 Перейдите на вкладку Developer (или “Разработка”) — это иконка консоли;
В левом верхнем углу включите Status: Running;
Запомните адрес: должен быть http://127.0.0.1:1234 или localhost:1234 (если порт другой — меняйте в скрипте);

1.3 Иногда браузер блокирует запросы из-за CORS (штука для безопасности, используйте отключение на свой страх и риск, особенно через плагины)
Как это обходил я: создал скрипт для проксирования corsproxy.js
>>
      const express = require('express');
      const cors = require('cors');
      const { createProxyMiddleware } = require('http-proxy-middleware');
      const app = express();
      app.use(cors());
      app.use('/', createProxyMiddleware({ target: 'http://localhost:1234', changeOrigin: true }));
      app.listen(5555, () => console.log('CORS Proxy на http://localhost:5555'));
>>
Кидаем файл в удобную директорию. Для примера будет C:\Users\User\CORS. Закидываем в неё наш файл.
Далее заходим в директорию командой cd (полный синтаксис в командной строке - cd C:\Users\User\CORS) и прописываем
npm install express cors http-proxy-middleware
node corsproxy.js
