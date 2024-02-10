const program = {};

document.getElementById('loadButton').addEventListener('click', function() {
	var fileInput = document.getElementById('fileInput');
	if(fileInput.files.length === 0) {
	  alert('Пожалуйста, выберите файл!');
	  return;
	}
  
	var file = fileInput.files[0];
	
	if (file.name.split('.').pop() !== 'txt') {
	  alert('Пожалуйста, выберите текстовый файл с расширением .txt!');
	  return;
	}
	
	var reader = new FileReader();
	
	reader.onload = function(e) {
		try {
		  var commands = e.target.result;
		  program.start(commands); // Здесь 'this' будет ссылаться на 'program', если 'start' вызывается корректно
		} catch(err) {
		  program.error("Ошибка при загрузке файла: " + err.message); // 'error' должен быть методом 'program'
		}
	  };
	
	reader.readAsText(file);
  })
  program.executeCommand = function(command) {
	let [instruction, ...args] = command.trim().split(/\s+/);
	instruction = instruction.toUpperCase();
	console.log('Выполняется команда:', command);
  
	switch (instruction) {
	  case 'RIGHT':
	  case 'LEFT':
	  case 'UP':
	  case 'DOWN': {
		const steps = isNaN(parseInt(args[0], 10)) ? this.variables[args[0]] : parseInt(args[0], 10);
		if (typeof robot[instruction.toLowerCase()] === 'function') {
		  robot[instruction.toLowerCase()](steps);
		} else {
		  this.error("Неверная команда движения робота.");
		}
		break;
	  }
	  case 'SET': {
		if (args.length === 3 && args[1] === "=") {
		  let variableName = args[0];
		  let value = isNaN(parseInt(args[2], 10)) ? this.variables[args[2]] : parseInt(args[2], 10);
		  if (this.variables === undefined) {
			this.variables = {};
		  }
		  this.variables[variableName] = value;
		} else {
		  this.error("Неверный формат команды SET. Используйте: SET <имя_переменной> = <значение>.");
		}
		break;
	  }
	  case 'CALL': {
		let procedureName = args[0].toUpperCase();
		if (this.procedures.hasOwnProperty(procedureName)) {
		  // Выполнить каждую команду в процедуре
		  const procedureCommands = this.procedures[procedureName];
		  for (const procedureCommand of procedureCommands) {
			this.executeCommand(procedureCommand); // Используйте функцию executeCommand для выполнения команды
		  }
		} else {
		  this.error(`Процедура ${procedureName} не определена.`);
		}
		break;
	  }
}
program.error = function(errorMsg) {
	console.error('Ошибка:', errorMsg);
  };
}


program.start = function (commandsText) {
	const self = this;
  
	self.variables = {};
	self.procedures = {};
	const commands = commandsText.split('\n');
	
	let currentBlockCommands = []; // Основной массив для временного хранения всех команд
	let repeatCountStack = []; // Стек для количества повторений
	let insideRepeat = 0; // Уровень вложенности REPEAT
	let recordingIfBlock = false;
	let ifBlockCommands = [];
	let ifBlockConditionDirection;
	let recordingProcedure = false;
	let procedureCommands = [];
	let procedureName;
  
	const MAX_REPEAT_DEPTH = 3; // Максимальный уровень вложенности для REPEAT
  
	const executeBlock = (blockCommands) => {
	  blockCommands.forEach((command) => {
		if (typeof command === 'function') {
		  command();
		} else {
		  processCommand(command);
		}
	  });
	};
  
	const startRecordingCommands = () => {
	  if (insideRepeat < MAX_REPEAT_DEPTH) {
		insideRepeat++;
		repeatCountStack.push(null); // Инициализируем место под количество повторений
	  } else {
		// Превышен максимальный уровень вложенности
		program.error(`Превышен максимальный уровень вложенности REPEAT: ${MAX_REPEAT_DEPTH}`);
	  }
	};
  
	const endRecordingCommands = () => {
	  const times = repeatCountStack.pop(); // Получаем количество повторений для текущего уровня
	  if (times !== null) { // Проверяем, что это не заглушка, означающая пропуск блока из-за ограничения уровней
		const commandsToRepeat = currentBlockCommands;
		currentBlockCommands = []; 
		insideRepeat--;
		for (let i = 0; i < times; i++) {
		  executeBlock(commandsToRepeat);
		}
	  }
	};
  
	const processCommand = (line) => {
	  if (line.toUpperCase().startsWith("REPEAT")) {
		const repeatTimes = parseInt(line.split(/\s+/)[1], 10);
		if (insideRepeat < MAX_REPEAT_DEPTH) {
		  repeatCountStack[insideRepeat] = repeatTimes; // Задаём количество повторений для текущего уровня
		}
		startRecordingCommands();
	  } else if (line.toUpperCase().includes("ENDREPEAT") && insideRepeat > 0) {
		endRecordingCommands();
	  } else if (insideRepeat > 0 && insideRepeat <= MAX_REPEAT_DEPTH) {
		// Если мы внутри блока REPEAT, добавляем команду в стек
		currentBlockCommands.push(line);
	  } else if (line.toUpperCase().startsWith("IFBLOCK")) {
		recordingIfBlock = true;
		ifBlockConditionDirection = line.split(/\s+/)[1]; // Сохраняем направление для проверки
	  } else if (recordingIfBlock && line.toUpperCase() !== "ENDIF") {
		ifBlockCommands.push(line);
	  } else if (line.toUpperCase() === "ENDIF") {
		recordingIfBlock = false;
	  } else if (line.toUpperCase().startsWith("PROCEDURE")) {
		recordingProcedure = true;
		procedureName = line.split(/\s+/)[1].toUpperCase();
	  } else if (recordingProcedure) {
		if (line.toUpperCase() === "ENDPROC") {
		  self.procedures[procedureName] = procedureCommands.slice();
		  procedureCommands = [];
		  recordingProcedure = false;
		} else {
		  procedureCommands.push(line);
		}
	  } else if (insideRepeat === 0) {
		self.executeCommand(line); // Непосредственное выполнение команды за пределами REPEAT
	  }
	};
  
	commands.forEach((line) => {
	  const trimmedLine = line.trim();
	  if (trimmedLine) {
		processCommand(trimmedLine);
	  }
	});
  };
  
  program.error = function (errorMessage) {
	// Вывод сообщения об ошибке
	console.error(errorMessage);
  };
  
  
  

  
