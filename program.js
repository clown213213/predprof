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
  
	const commands = commandsText.split('\n');
	let repeatStack = [];
	let recordingIfBlock = false;
	let ifBlockCommands = [];
	let recordingProcedure = false;
	let procedureCommands = [];
	let procedureName;
	let ifBlockConditionDirection;
  
	self.variables = {};
	self.procedures = {};
  
	const executeBlock = (blockCommands) => {
	  blockCommands.forEach((commandOrBlock) => {
		if (typeof commandOrBlock === 'function') {
		  commandOrBlock(); // Условные функции теперь напрямую выполняют ifBlock
		} else {
		  self.executeCommand(commandOrBlock);
		}
	  });
	};
  
	const processCommand = (line) => {
	  if (line.toUpperCase().startsWith("REPEAT")) {
		const parts = line.split(/\s+/);
		const repeatValue = parts[1];
		let times = parseInt(repeatValue, 10);
  
		if (isNaN(times)) {
		  times = self.variables[repeatValue.toUpperCase()] || 0;
		}
  
		repeatStack.push({ times, commands: [] });
	  } else if (line.toUpperCase() === "ENDREPEAT") {
		const repeatBlock = repeatStack.pop();
		for (let i = 0; i < repeatBlock.times; i++) {
		  executeBlock(repeatBlock.commands);
		}
	  } else if (line.toUpperCase().startsWith("IFBLOCK")) {
		// Запись команд в условный блок начинается после обнаружения IFBLOCK
		recordingIfBlock = true;
		ifBlockConditionDirection = line.split(/\s+/)[1]; // Сохраняем направление для проверки
	  } else if (recordingIfBlock && line.toUpperCase() !== "ENDIF") {
		// Добавление команд воздействия в условный блок
		ifBlockCommands.push(line);
	  } else if (line.toUpperCase() === "ENDIF") {
		// В конце условного блока
		recordingIfBlock = false;
		const currentIfBlockCommands = ifBlockCommands.slice(); // Копирование команд блока для выполнения
		const ifBlockCondition = ifBlockConditionDirection.toUpperCase(); // Перевод направления в верхний регистр для совпадения с именами функций
		
		// Переписанная функция для проверки условия и выполнения блока команд
		const executeIfBlock = () => {
		  if (robot['on' + ifBlockCondition]()) { // Проверка условия без лишнего условия на typeof
			executeBlock(currentIfBlockCommands);
		  }
		};
		
		// Добавление условного блока или его немедленное выполнение
		if (repeatStack.length > 0) {
		  repeatStack[repeatStack.length - 1].commands.push(executeIfBlock);
		} else {
		  executeIfBlock();
		}
		ifBlockCommands = []; // Очистка команд условного блока после использования
	  }  else if (repeatStack.length > 0) {
		repeatStack[repeatStack.length - 1].commands.push(line);
	  } else if (line.toUpperCase().startsWith("PROCEDURE")) {
		procedureCommands = [];
		recordingProcedure = true;
		procedureName = line.split(/\s+/)[1].toUpperCase();
	  } else if (line.toUpperCase() === "ENDPROC") {
		recordingProcedure = false;
		self.procedures[procedureName] = procedureCommands.slice();
		procedureCommands = [];
	  } else if (recordingProcedure) {
		procedureCommands.push(line);
	  } else {
		self.executeCommand(line);
	  }
	};
  
	for (const line of commands) {
	  const trimmedLine = line.trim();
	  if (trimmedLine) {
		processCommand(trimmedLine);
	  }
	}
  };
  
