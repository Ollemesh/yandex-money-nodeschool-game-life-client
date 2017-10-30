'use strict';

// const url = 'ws://ws.rudenko.tech/life/api'; // оставил для удобства переключения хоста
const url = 'ws://localhost:8080';
let game, ws;

App.onToken = initConnection; // Переопределить метод onToken;

/**
 * Инициирует соединение
 * @param {string} userName - имя, введённое пользователем
 */
function initConnection(userName) { // Получить токен;
    ws = new WebSocket(`${url}?token=${userName}`); // Отправить токен в opening handshake к серверу игры;
    setHandlers(ws); // Установить соединение с сервером, определить обработчики событий ws;
}

/**
 * Устанавливает обработчики событий объекта WebSocket
 * @param {WebSocket} ws
 */
function setHandlers(ws) {
    ws.onmessage = gameProgress;
    ws.onopen = openHandler;
    ws.onclose = closeHandler;
    ws.onerror = errorHandler;
}

/**
 * Транслирует серверные данные о состоянии игры в соответствующие обработчики клиента 
 * @param {Object} event
 */
function gameProgress(event) {
    try {
        let {type, data} = JSON.parse(event.data);

        switch (type) {
            case 'INITIALIZE':
                initGame(data); // Инициализировать игру исходя из приходящих данных;
                break;
            case 'UPDATE_STATE':
                updateGame(data);
                break;
            default:
                errorHandler(new Error('Unknown event type'));
                break;
        }
    } catch (error) { // для обработки ошибок парсинга JSON-a
        errorHandler(error);
    }
}

/**
 * Инициирует игру
 * @param {{user: string, settings: Object, state: Array}}
 */
function initGame({user, settings, state}) {
    game = new LifeGame(user, settings);
    game.send = send; // Метод send должен отправлять данные на сервер;

    game.init();
    game.setState(state);
}

/**
 * Обновляет состояние игрового поля
 * @param {Object} data
 */
function updateGame(data) {
    game.setState(data);
}

/**
 * Отправляет на сервер информацию о действиях игрока
 * @param {Object} data 
 */
function send(data) {
    ws.send(JSON.stringify({
        type: 'ADD_POINT',
        data
    }));
}

function openHandler(event) {
    console.log('Connection established');
}

function closeHandler(event) {
    console.log(`Connection closed. Closed clean: ${event.wasClean}. Code: ${event.code}. Reason: ${event.reason}`);
};

function errorHandler(error) {
    console.log(error.stack || 'Socket Error. Connection Closed');
}