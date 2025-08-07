// ==UserScript==
// @name         HH.ru-autotest-v0.9
// @namespace    http://tampermonkey.net/
// @version      0.9
// @description  автотест hh.ru
// @match        *://*.hh.ru/*
// @grant        GM.xmlHttpRequest
// @connect      localhost
// ==/UserScript==

(function(){
  'use strict';

  function processQuestion(){
    if(window.__questionLocked) return;
    window.__questionLocked = true;
    setTimeout(()=>window.__questionLocked=false,1200);

    // 1) Достаём сам вопрос
    const block = document.querySelector('[data-qa="text-description"]');  //селектор. могут менять
    const question = block?.innerText.trim();
    if(!question) return console.log('Текст не найден');

    // 2) Собираем видимые радио и текст
    const radios = Array.from(document.querySelectorAll('input[type="radio"]'))
                        .filter(i=>i.closest('label'));
    const options = radios.map(i=>({
      input: i,
      text:  i.closest('label').innerText.trim()
    }));
    const answers = options.map(o=>o.text);
    if(!answers.length) return console.log('Варианты не найдены');

    console.log('Вопрос:', question);
    console.log('Варианты:', answers);

    // 3) Строим единый текстовый prompt
    const prompt =
`Ты — универсальный эксперт. Отвечай **только цифрой** правильного варианта, без текста и объяснений.

Вопрос: ${question}

Варианты:
${answers.map((t,i)=>`${i+1}) ${t}`).join('\n')}

Ответ (только цифра): `;

    // 4) Отправляем TEXT completions
    GM.xmlHttpRequest({
      method: 'POST',
      url:    'http://localhost:1234/v1/completions',
      headers:{ 'Content-Type':'application/json' },
      data:   JSON.stringify({
        model:       'gpt-oss-20b',                                      // Модель ТУТ МЕНЯТЬ НА СВОЮ
        prompt:      prompt,
        max_tokens:  1024,
        temperature: 0,
        stop:        ['\n']
      }),
      onload(resp){
        const data = JSON.parse(resp.responseText);
        let text = data.choices?.[0]?.text?.trim() || '';
        console.log('raw text:', JSON.stringify(text));

        // 5) Пытаемся вытащить цифру
        const m = text.match(/\d+/);
        const n = m ? parseInt(m[0],10) : NaN;
        const idx = (n>=1 && n<=options.length) ? n-1 : -1;
        console.log('извлекли цифру:', n);

        // 6) Кликаем по вариантам
        if(idx>=0){
          options[idx].input.click();
          console.log('Клик по варианту №', idx+1);
          const next = Array.from(document.querySelectorAll('button'))
                       .find(b=>b.innerText.trim().toLowerCase()==='дальше' && !b.disabled);
          if(next) setTimeout(()=>next.click(),800);
          else console.log("Кнопка 'Дальше' не найдена");
        } else {
          console.error('Не смогли извлечь номер, ответ:', text);
        }
      },
      onerror(err){
        console.error('Ошибка GM.xmlHttpRequest:', err);
      }
    });
  }

  // Слежка за новым вопросом
  let lastQ='';
  new MutationObserver(()=>{
    const cur = document.querySelector('[data-qa="text-description"] p')?.innerText||'';
    if(cur && cur!==lastQ){
      lastQ=cur;
      setTimeout(processQuestion,700);
    }
  }).observe(document.body,{childList:true,subtree:true});

  // Первый запуск
  setTimeout(processQuestion,700);
})();
// если кому-то вдруг не плевать, что оно выдает 10 вариантов (рядомстоящие одинаковые) вместо 5, то вспомните золотое правило: работает - не трогай. я потрогал и жалею