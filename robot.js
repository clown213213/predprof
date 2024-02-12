const robot = {}
robot.x = 0;
robot.y = 0;
robot.img = new Image();
robot.canvas = document.createElement('canvas');
robot.HCELLS = 21;
robot.VCELLS = 21;
robot.CELL_SIZE = 21;
robot.WALL_SIZE = 6;
robot.cells = {};
robot.walls = {};
robot.startPos = {'x': 0, 'y': 0};

class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.UP = (robot.CELL_SIZE + robot.WALL_SIZE) * y + robot.WALL_SIZE;
        this.LEFT = (robot.CELL_SIZE + robot.WALL_SIZE) * x + robot.WALL_SIZE;
        this.isFill = false;
        this.isFail = false;
    }
}

class Wall {
    constructor(x, y, isVertical) {
        this.x = x;
        this.y = y;
        this.UP = (robot.CELL_SIZE + robot.WALL_SIZE) * y;
        this.LEFT = (robot.CELL_SIZE + robot.WALL_SIZE) * x;
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
    if (robotCell===undefined){
        robotCell = robot.cells[0+ '_' + 0];
    }
    for (let i in robot.cells) {
        let cell = robot.cells[i];
        ctx.fillStyle = (cell.isFail) ? '#F44336' : (cell.isFill) ? '#9E9E9E' : '#8BC34A';   /* #5B7BBB */
        ctx.fillRect(cell.LEFT, cell.UP, robot.CELL_SIZE, robot.CELL_SIZE);
    }

    ctx.drawImage(robot.img, robotCell.LEFT, robotCell.UP, robot.CELL_SIZE, robot.CELL_SIZE);

    for (let i in robot.walls) {
        let wall = robot.walls[i];
        ctx.fillStyle = (wall.isActive) ? '#FFD54F' : '#4CAF50';   /* #4C64AF */
        ctx.fillRect(wall.LEFT, wall.UP, wall.width, wall.height);
    }

    if(move) robot.drawQueue.push(canvas);
}

robot.delay=null;
robot.canvas.addEventListener('touchstart', function(e) {
    e.offsetX = e.touches[0].pageX-robot.canvas.offsetLEFT
    e.offsetY = e.touches[0].pageY-robot.canvas.offsetUP
    robot.delay = setTimeout(()=>check(e),1000)

    function check(e){
        for (let i in robot.cells) {
            let cell = robot.cells[i];
            let x = e.offsetX - cell.LEFT;
            let y = e.offsetY - cell.UP;
            if ((x > 0) && (x < robot.CELL_SIZE) && (y > 0) && (y < robot.CELL_SIZE)) {
                robot.startPos = {'x': cell.x, 'y': cell.y};
                robot.setPosition(cell.x, cell.y);
            }
        }
    }
},true)
robot.canvas.addEventListener('touchend', function (e) {clearTimeout(robot.delay)});
robot.canvas.addEventListener('touchmove', function (e) {clearTimeout(robot.delay)});
let stopMoving = false
startMoving = function(){
    stopMoving = false
}
stopRobot = function(){
    stopMoving = true
}


robot.moveRobot = function (x, y) {
    if (x != 0 && x > 0) {
        for(let k = 0; (k != x); k++) {
            if (robot.x < robot.HCELLS - 1) {
                robot.x += 1;
                robot.draw(true);
            } else {
                robot.fail()
                break
            }
        }
    }
    if (x != 0 && -x > 0) {
        for(let k = 0; (k != x); k--) {
            if (robot.x > 0) {
                robot.x -= 1;
                robot.draw(true);
            } else {
                robot.fail()
                break
            }
        }
    }
    if (y != 0 && y > 0) {
        for(let k = 0; (k != y); k++) {
            if (robot.y < robot.HCELLS - 1) {
                robot.y += 1;
                robot.draw(true);
            } else {
                robot.fail()
                break
            }
        }
    }
    if (y != 0 && -y > 0) {
        for(let k = 0; (k != y); k--) {
            if (robot.y > 0) {
                robot.y -= 1;
                robot.draw(true);
            } else {
                robot.fail()
                break
            }
        }
    }
    console.log(stopMoving)
}
robot.isFill = function (fill) {
    return robot.cells[robot.y + '_' + robot.x].isFill == fill;
}

robot.onRIGHT = function () {
    if (robot.x == robot.HCELLS - 1) {
        return  true;
    } else {
        return false;
    }
}
robot.onLEFT = function () {
    if (robot.x == 0) {
        return  true;
    } else {
        return false;
    }
}
robot.onUP = function () {
    if (robot.y == 0) {
        return  true;
    } else {
        return false;
    }
}
robot.onDOWN= function () {
    if (robot.y == robot.VCELLS - 1) {
        return  true;
    } else {
        return false;
    }
}

robot.right = function (n) {
	console.log(n)
    robot.moveRobot(n, 0);
}
robot.left = function (n) {
	console.log(n)
    robot.moveRobot(-n, 0);
}
robot.up = function (n) {
	console.log(n)
    robot.moveRobot(0, -n);
}
robot.down = function (n) {
	console.log(n)
    robot.moveRobot(0, n);
}

let k = false

robot.fail = function () {
    let k = true
    robot.cells[robot.y + '_' + robot.x].isFail = true;
    robot.draw(true);
    alert('Столкновение с препятствием!')
    throw 'collision'
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
    
    if (typeof stopMoving !== 'undefined' && stopMoving) {
        return;
    }
    
    if (!commands) {
        return;
    }
}

