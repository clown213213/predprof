const robot = {}
robot.x = 0;
robot.y = 0;
robot.img = new Image();
robot.canvas = document.createElement('canvas');
robot.HCELLS = 21;
robot.VCELLS = 21;
robot.CELL_SIZE = 31;
robot.WALL_SIZE = 6;
robot.cells = {};
robot.walls = {};
robot.startPos = {'x': 0, 'y': 0};

class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.top = (robot.CELL_SIZE + robot.WALL_SIZE) * y + robot.WALL_SIZE;
        this.left = (robot.CELL_SIZE + robot.WALL_SIZE) * x + robot.WALL_SIZE;
        this.isFill = false;
        this.isFail = false;
    }
}

class Wall {
    constructor(x, y, isVertical) {
        this.x = x;
        this.y = y;
        this.top = (robot.CELL_SIZE + robot.WALL_SIZE) * y;
        this.left = (robot.CELL_SIZE + robot.WALL_SIZE) * x;
        this.width = (isVertical) ? robot.WALL_SIZE : robot.CELL_SIZE + robot.WALL_SIZE;
        this.height = (isVertical) ? robot.CELL_SIZE + robot.WALL_SIZE : robot.WALL_SIZE;
        this.isActive = false;
        this.isHover = false;
    }
}

robot.create = function (container) {

    for (let i = 0; i <= robot.VCELLS; i++) {
        for (let j = 0; j <= robot.HCELLS; j++) {
            robot.cells[i + '_' + j] = new Cell(j, i);
            robot.walls['v' + i + '_' + j] = new Wall(j, i, true);
            robot.walls['h' + i + '_' + j] = new Wall(j, i, false);
        }
    }
    robot.canvas.width = (robot.CELL_SIZE + robot.WALL_SIZE) * robot.HCELLS + robot.WALL_SIZE;
    robot.canvas.height = (robot.CELL_SIZE + robot.WALL_SIZE) * robot.VCELLS + robot.WALL_SIZE;
    container.appendChild(robot.canvas);

    robot.img.src = 'robot.png';
    robot.img.onload = function () {
        robot.draw();
    }
}

robot.drawQueue = [];
setInterval(function() {
    if (robot.drawQueue.length>0) {
        let ctx = robot.canvas.getContext('2d');
        ctx.drawImage(robot.drawQueue[0],0,0);
        robot.drawQueue.shift();  
    }
},50);

robot.draw = function (move) {

    let ctx = null
    let canvas = null
    
    if(move) {
        canvas = document.createElement('canvas');
        canvas.width = (robot.CELL_SIZE + robot.WALL_SIZE) * robot.HCELLS + robot.WALL_SIZE;
        canvas.height = (robot.CELL_SIZE + robot.WALL_SIZE) * robot.VCELLS + robot.WALL_SIZE;
        ctx = canvas.getContext('2d');
    }
    else ctx = robot.canvas.getContext('2d');


    let robotCell = robot.cells[robot.y + '_' + robot.x];

    for (let i in robot.cells) {
        let cell = robot.cells[i];
        ctx.fillStyle = (cell.isFail) ? '#F44336' : (cell.isFill) ? '#9E9E9E' : '#8BC34A';   /* #5B7BBB */
        ctx.fillRect(cell.left, cell.top, robot.CELL_SIZE, robot.CELL_SIZE);
    }

    ctx.drawImage(robot.img, robotCell.left, robotCell.top, robot.CELL_SIZE, robot.CELL_SIZE);

    for (let i in robot.walls) {
        let wall = robot.walls[i];
        ctx.fillStyle = (wall.isActive || wall.isHover) ? '#FFD54F' : '#4CAF50';   /* #4C64AF */
        ctx.fillRect(wall.left, wall.top, wall.width, wall.height);
    }

    if(move) robot.drawQueue.push(canvas);
}

robot.delay=null;
robot.canvas.addEventListener('touchstart', function(e) {
    e.offsetX = e.touches[0].pageX-robot.canvas.offsetLeft
    e.offsetY = e.touches[0].pageY-robot.canvas.offsetTop
    robot.delay = setTimeout(()=>check(e),1000)

    function check(e){
        for (let i in robot.cells) {
            let cell = robot.cells[i];
            let x = e.offsetX - cell.left;
            let y = e.offsetY - cell.top;
            if ((x > 0) && (x < robot.CELL_SIZE) && (y > 0) && (y < robot.CELL_SIZE)) {
                robot.startPos = {'x': cell.x, 'y': cell.y};
                robot.setPosition(cell.x, cell.y);
            }
        }
    }
},true)
robot.canvas.addEventListener('touchend', function (e) {clearTimeout(robot.delay)});
robot.canvas.addEventListener('touchmove', function (e) {clearTimeout(robot.delay)});


robot.moveRobot = function (x, y) {
    if (x != 0 && x > 0) {
        for(let k = 0; k != x; k++) {
            robot.x += 1;
            robot.draw(true);
        }
    }
    if (x != 0 && x < 0) {
        for(let k = 0; k != x; k--) {
            robot.x -= 1;
            robot.draw(true);
        }
    }
    if (y != 0 && y > 0) {
        for(let k = 0; k != y; k++) {
            robot.y += 1;
            robot.draw(true);
        }
    }
    if (y != 0 && y < 0) {
        for(let k = 0; k != y; k--) {
            robot.y -= 1;
            robot.draw(true);
        }
    }
}

robot.isFill = function (fill) {
    return robot.cells[robot.y + '_' + robot.x].isFill == fill;
}
robot.onRIGHT = function (wall) {
    return !((robot.walls['v' + robot.y + '_' + (robot.x + 1)].isActive || (robot.x == robot.HCELLS - 1)) == wall);
}
robot.onLEFT = function (wall) {
    return !((robot.walls['v' + robot.y + '_' + robot.x].isActive || (robot.x == 0)) == wall);
}
robot.onUP = function (wall) {
    return !((robot.walls['h' + robot.y + '_' + robot.x].isActive || (robot.y == 0)) == wall);
}
robot.onDOWN = function (wall) {
    return !((robot.walls['h' + (robot.y + 1) + '_' + robot.x].isActive || (robot.y == robot.VCELLS - 1)) == wall);
}

robot.right = function (n) {
	console.log(n)
    if (robot.onRIGHT(true)) robot.moveRobot(n, 0);
    else robot.fail();
}
robot.left = function (n) {
	console.log(n)
    if (robot.onLEFT(true)) robot.moveRobot(-n, 0);
    else robot.fail();
}
robot.up = function (n) {
	console.log(n)
    if (robot.onUP(true)) robot.moveRobot(0, -n);
    else robot.fail();
}
robot.down = function (n) {
	console.log(n)
    if (robot.onDOWN(true)) robot.moveRobot(0, n);
    else robot.fail();
}

robot.fail = function () {
    robot.cells[robot.y + '_' + robot.x].isFail = true;
    robot.draw(true);
    throw 'collision';
}

robot.clean = function () {
    for (let i in robot.cells) {
        robot.cells[i].isFill = false;
        robot.cells[i].isFail = false;
    }
    robot.draw();
}

robot.parseCommand = function (commands) {
    robot.clean();
    robot.x = robot.startPos.x;
    robot.y = robot.startPos.y;
    robot.moveRobot(0,0);
    let jsCommand = '';
    if (commands) {
        commands.split('\n').forEach(function (command) {
            command = command.replace(/\sRIGHT (.+)/g , ' robot.right ($1)');
            command = command.replace(/\sLEFT (.+)/g, ' robot.left ($1)');
            command = command.replace(/\sUP (.+)/g, ' robot.up ($1)');
            command = command.replace(/\sDOWN (.+)/g, ' robot.down ($1)');

            jsCommand += command + '\n';
        });
        commands = jsCommand;
    }
    return commands;
}
