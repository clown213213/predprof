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


program.start = function(commandsText) {
	const self = this;
  
	const commands = commandsText.split('\n'); // Разбить текст на команды, разделённые новыми строками
	let repeatStack = []; // Стек для хранения информации о повторениях
	let recordingIfBlock = false; // Флаг записи условного блока
	let ifBlockCommands = []; // Команды условного блока
	let recordingProcedure = false; // Флаг записи процедуры
	let procedureCommands = []; // Команды процедуры
	let procedureName; // Имя процедуры
  
	self.variables = {}; // Переменные программы
	self.procedures = {}; // Процедуры программы
	self.ifBlockCommands = {}; // Условные блоки программы
  
	// Функция для выполнения блока команд
	const executeBlock = (blockCommands) => {
	  for (const command of blockCommands) {
		self.executeCommand(command);
	  }
	};
  
	// Функция для обработки отдельной команды
	const processCommand = (line) => {
	  if (line.toUpperCase().startsWith("REPEAT")) {
		const parts = line.split(/\s+/);
		const repeatValue = parts[1];
		let times = parseInt(repeatValue, 10);
  
		if (isNaN(times)) {
		  times = self.variables[repeatValue.toUpperCase()] || 0;
		}
  
		repeatStack.push({ times, commands: [] }); // Начать новый блок повторения
	  }
	  else if (line.toUpperCase().startsWith("ENDREPEAT")) {
		const repeatBlock = repeatStack.pop(); // Завершить текущий блок повторения
		const repeatCommands = repeatBlock.commands;
  
		// Если есть вложенные блоки повторения, добавить команды к предыдущему блоку
		if (repeatStack.length > 0) {
		  repeatStack[repeatStack.length - 1].commands.push(...Array(repeatBlock.times).fill(repeatCommands).flat());
		} else {
		  // Если повторение на верхнем уровне, выполнить блок команд
		  executeBlock(Array(repeatBlock.times).fill(repeatCommands).flat());
		}
	  }
	  else if (repeatStack.length > 0) {
		repeatStack[repeatStack.length - 1].commands.push(line); // Добавить команду в текущий блок повторения
	  }
	  else if (line.toUpperCase().startsWith("IFBLOCK")) {
		ifBlockCommands = [];
	recordingIfBlock = true;
	const parts = line.split(/\s+/);  // Use 'trim()' to remove leading and trailing whitespace
	direction = parts[1];
	return;
  }
	  else if (recordingIfBlock && !line.toUpperCase().startsWith("ENDIF")) {
		ifBlockCommands.push(line); // Добавить команду в условный блок
	  }
	  else if (line.toUpperCase().startsWith("ENDIF")) {
		recordingIfBlock = false; // Завершить запись условного блока
		if (typeof robot['on' + direction] === 'function' &&
		robot['on' + direction.toUpperCase()]()) {
			executeBlock(ifBlockCommands);;
			console.log(robot['on' + direction]())
		  }	
	  return;
	}
	  else if (line.toUpperCase().startsWith("PROCEDURE")) {
		procedureCommands = []; // Начать запись процедуры
		recordingProcedure = true;
		procedureName = line.split(/\s+/)[1].toUpperCase(); // Сохранение имени процедуры
	  }
	  else if (line.toUpperCase().startsWith("ENDPROC")) {
		recordingProcedure = false; // Завершить запись процедуры
		self.procedures[procedureName] = procedureCommands; // Сохранить процедуру
	  }
	  else if (recordingProcedure) {
		procedureCommands.push(line); // Добавить команду в процедуру
	  }
	  else {
		self.executeCommand(line); // Выполнить команду
	  }
	};
  
	// Обработка каждой команды в тексте
	for (const line of commands) {
	  const trimmedLine = line.trim();
	  if (trimmedLine) {
		processCommand(trimmedLine);
	  }
	}
  };
  
