// ==UserScript==
// @name         HH.ru-autotest
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  автоматизация тестов hh.ru через LLM
// @match        *://*.hh.ru/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Основная функция обработки вопроса
    function processQuestion() {
        // берём текст вопроса
        let question = document.querySelector('[data-qa="text-description"] p')?.innerText;
        if (!question) return console.log('Вопрос не найден');

        // Берём варианты и их инпуты
        let inputs = [...document.querySelectorAll('input[type="radio"]')];
        let answers = inputs.map(input => {
            let label = input.closest('label');
            return label ? label.innerText.trim() : '';
        });
        if (!answers.length) return console.log('Варианты не найдены');
        console.log("Вопрос:", question);
        console.log("Варианты:", answers);

        // Запрос в нейросеть
        fetch('http://localhost:5555/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "mistralai/mistral-7b-instruct-v0.3", // можно свой
                messages: [
                    { role: "user", content: `Вопрос: ${question}\nВарианты: ${answers.join('; ')}\nВыбери только ОДИН вариант и верни его полный текст из списка ВАРИАНТОВ ОТВЕТА выше. Не придумывай, просто скопируй выбранный вариант` } // тут сам ПРОМПТ для нейросетки
                ],
                max_tokens: 1024, // указать тут свое кол-во токенов. мало ли тебе не хватит.
                temperature: 0.1 // это значение, на сколько может расходиться ответ. фантазия нейросети. если тупит - можно менять от 0.001 до 1
            })
        })
        .then(r => r.json())
        .then(data => {
            let answer = data.choices?.[0]?.message?.content?.trim();
            console.log("Ответ нейросети:", answer);

            // Улучшенный подбор: сначала точное совпадение, потом частичное
            let idx = answers.findIndex(a => a.trim() === answer.trim());
            if (idx === -1) {
                idx = answers.findIndex(a => answer.trim().includes(a.trim()) || a.trim().includes(answer.trim()));
            }
            if (idx !== -1) {
                inputs[idx].click();
                console.log("Клик по варианту №", idx + 1);

                // Ищем и жмём "Далее" с задержкой (чтобы успел активироваться)
                let nextBtn = [...document.querySelectorAll('button')]
                    .find(btn => btn.innerText.trim().toLowerCase() === 'дальше' && !btn.disabled);
                if (nextBtn) {
                    setTimeout(() => nextBtn.click(), 700);
                    console.log("Клик по 'Далее'");
                } else {
                    console.log("Кнопка 'Далее' не найдена");
                }
            } else {
                console.log("Вариант не найден для:", answer);
            }
        })
        .catch(e => console.error("Ошибка запроса:", e));
    }

    // MutationObserver — автообработка нового вопроса (после нажатия кнопки "дальше", дабы обновлялись данные.
    let lastQuestion = '';
    const observer = new MutationObserver(() => {
        let current = document.querySelector('[data-qa="text-description"] p')?.innerText;
        if (current && current !== lastQuestion) {
            lastQuestion = current;
            setTimeout(processQuestion, 300); // задержка для прогрузки вариантов. Добавить, если не детектит
        }
    });
    observer.observe(document.body, {childList: true, subtree: true});

    // Для самого первого вопроса (на случай если не сработает observer сразу). Собственно, тоже добавить, если не детектит
    setTimeout(processQuestion, 1200);

})();
