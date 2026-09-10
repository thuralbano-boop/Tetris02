const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const menu = document.getElementById('menu');
const menuTitle = document.getElementById('menu-title');
const startBtn = document.getElementById('start-btn');

// Escalonar o contexto para blocos de 20x20px
context.scale(20, 20);

// Cores das peças do Tetris
const colors = [
    null,
    '#FF0d72', // T
    '#0dc2ff', // I
    '#0dffd8', // S
    '#f538ff', // Z
    '#ff8e0d', // L
    '#ffe10d', // J
    '#3877ff', // O
];

// Gerador de peças (Tetrominós)
function createPiece(type) {
    if (type === 'T') {
        return [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0],
        ];
    } else if (type === 'I') {
        return [
            [0, 2, 0, 0],
            [0, 2, 0, 0],
            [0, 2, 0, 0],
            [0, 2, 0, 0],
        ];
    } else if (type === 'S') {
        return [
            [0, 3, 3],
            [3, 3, 0],
            [0, 0, 0],
        ];
    } else if (type === 'Z') {
        return [
            [4, 4, 0],
            [0, 4, 4],
            [0, 0, 0],
        ];
    } else if (type === 'L') {
        return [
            [0, 5, 0],
            [0, 5, 0],
            [0, 5, 5],
        ];
    } else if (type === 'J') {
        return [
            [0, 6, 0],
            [0, 6, 0],
            [6, 6, 0],
        ];
    } else if (type === 'O') {
        return [
            [7, 7],
            [7, 7],
        ];
    }
}

// Criação da matriz do jogo (12 colunas x 20 linhas)
function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

const arena = createMatrix(12, 20);

const player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    score: 0,
    level: 1,
};

// Colisão entre a peça e a matriz
function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
               (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

// Fixa a peça na matriz quando ela atinge o fundo
function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

// Limpeza de linhas completas
function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;

        player.score += rowCount * 10;
        rowCount *= 2;
        
        // Atualiza o nível a cada 100 pontos
        player.level = Math.floor(player.score / 100) + 1;
    }
}

// Movimentação do jogador
function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

function playerHardDrop() {
    while (!collide(arena, player)) {
        player.pos.y++;
    }
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
    updateScore();
    dropCounter = 0;
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

function playerReset() {
    const pieces = 'TJSLIOZ';
    player.matrix = createPiece(pieces[(pieces.length * Math.random()) | 0]);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
    
    if (collide(arena, player)) {
        // Game Over
        gameOver = true;
        menuTitle.innerText = "GAME OVER";
        startBtn.innerText = "TENTAR DE NOVO";
        menu.style.display = 'flex';
    }
}

function playerRotate(dir) {
    const posX = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = posX;
            return;
        }
    }
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

// Loop do Jogo
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let gameOver = true;

function update(time = 0) {
    if (gameOver) return;

    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;

    // Velocidade aumenta conforme o nível
    let currentInterval = Math.max(150, dropInterval - (player.level - 1) * 100);

    if (dropCounter > currentInterval) {
        playerDrop();
    }

    draw();
    requestAnimationFrame(update);
}

function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawMatrix(arena, { x: 0, y: 0 });
    drawMatrix(player.matrix, player.pos);
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[value];
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
                
                // Pequeno detalhe estético no bloco
                context.strokeStyle = '#000';
                context.lineWidth = 0.05;
                context.strokeRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function updateScore() {
    scoreElement.innerText = player.score;
    levelElement.innerText = player.level;
}

// Iniciar Jogo
function startGame() {
    arena.forEach(row => row.fill(0));
    player.score = 0;
    player.level = 1;
    updateScore();
    playerReset();
    gameOver = false;
    menu.style.display = 'none';
    lastTime = performance.now();
    update();
}

// Eventos dos Botões Touch (Celular)
document.getElementById('btn-left').addEventListener('click', () => { if (!gameOver) playerMove(-1); });
document.getElementById('btn-right').addEventListener('click', () => { if (!gameOver) playerMove(1); });
document.getElementById('btn-down').addEventListener('click', () => { if (!gameOver) playerDrop(); });
document.getElementById('btn-rotate').addEventListener('click', () => { if (!gameOver) playerRotate(1); });
document.getElementById('btn-drop').addEventListener('click', () => { if (!gameOver) playerHardDrop(); });

// Suporte a Teclado (Caso queira testar no PC também)
document.addEventListener('keydown', event => {
    if (gameOver) return;
    if (event.key === 'ArrowLeft') {
        playerMove(-1);
    } else if (event.key === 'ArrowRight') {
        playerMove(1);
    } else if (event.key === 'ArrowDown') {
        playerDrop();
    } else if (event.key === 'ArrowUp') {
        playerRotate(1);
    } else if (event.key === ' ') {
        playerHardDrop();
    }
});

startBtn.addEventListener('click', startGame);