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
	if (typeof command === 'function') {
	  // Если команда представлена функцией, прямо её исполняем
	  command();
	  return;
	}
  
	let [instruction, ...args] = command.trim().split(/\s+/);
	instruction = instruction.toUpperCase();
	console.log('Выполняется команда:', command);
  
	switch (instruction) {
	  case 'RIGHT':
	  case 'LEFT':
	  case 'UP':
	  case 'DOWN': {
		// Используйте isNaN(Number()) для надежной проверки, является ли args[0] числом или переменной
		const steps = isNaN(Number(args[0])) ? this.variables[args[0]] : parseInt(args[0], 10);
		if (typeof robot[instruction.toLowerCase()] === 'function') {
		  robot[instruction.toLowerCase()](steps);
		} else {
		  this.error("Неверная команда движения робота.");
		}
		break;
	  }
	  case 'SET': 
	  if (args.length === 3 && args[1] === "=") {
		let variableName = args[0];
		let value = args[2]; // Имя переменной или числовое значение.
		
		// Пытаемся получить значение переменной из текущего контекста:
		if (!isNaN(Number(value))) {
		  // Если 'value' - это число, преобразуем его в число:
		  this.variables[variableName] = parseInt(value, 10);
		} else if (this.variables.hasOwnProperty(value)) {
		  // Если 'value' - это имя другой переменной, получаем её значение:
		  this.variables[variableName] = this.variables[value];
		} else {
		  // Если 'value' не может быть разрешено, выводим ошибку:
		  this.error(`Переменная ${value} не определена.`);
		}
	  } else {
		this.error("Неверный формат команды SET. Используйте: SET <имя_переменной> = <значение>.");
	  }
	  break;
	  case 'CALL': {
		let procedureName = args[0].toUpperCase();
		if (this.procedures.hasOwnProperty(procedureName)) {
		  // Выполнить каждую команду в процедуре
		  const procedureCommands = this.procedures[procedureName];
		  procedureCommands.forEach(cmd => this.executeCommand(cmd));
		} else {
		  this.error(`Процедура ${procedureName} не определена.`);
		}
		break;
	  }
	  default:
		this.error(`Неизвестная или неподдерживаемая команда: ${instruction}.`);
	}
  };
  
  program.error = function(errorMsg) {
	console.error('Ошибка:', errorMsg);
  };


  program.start = function(commandsText) {
	const self = this;
	
	const commands = commandsText.split('\n');
	let repeatStack = [];
	let recordingProcedure = false;
	let procedureCommands = [];
	let procedureName;
	let ifBlockStack = []; // Стек для условных блоков
	
	self.variables = {};
	self.procedures = {};
	
	const executeBlock = (blockCommands) => {
	  blockCommands.forEach(commandOrBlock => {
		if (typeof commandOrBlock === 'function') {
		  commandOrBlock();
		} else {
		  self.executeCommand(commandOrBlock);
		}
	  });
	};
	
	const processCommand = (line) => {
	  const commandParts = line.toUpperCase().split(' ');
	  const command = commandParts[0];
	  const args = commandParts.slice(1);
	  
	  if (command === "ENDPROC") {
		if (recordingProcedure) {
		  self.procedures[procedureName] = procedureCommands.slice();
		  procedureCommands = [];
		  recordingProcedure = false;
		}
	  } else if (command === "PROCEDURE") {
		recordingProcedure = true;
		procedureName = args[0];
	  } else if (command === "IFBLOCK") {
		ifBlockStack.push({
		  condition: args[0].toUpperCase(), // Normalize the direction
		  commands: []
		});
	  } else if (command === "ENDIF") {
		if (ifBlockStack.length > 0) {
		  let ifBlock = ifBlockStack.pop();
		  
		  const executeIfBlock = () => {
			if (robot['on' + ifBlock.condition]()) {
				executeBlock(ifBlock.commands);
			  }
		  };
		  
		  if (repeatStack.length > 0) {
			repeatStack[repeatStack.length - 1].commands.push(executeIfBlock);
		  } else if (recordingProcedure) {
			procedureCommands.push(executeIfBlock);
		  } else {
			executeIfBlock();
		  }
		}
	  } else if (command === "REPEAT") {
		let repeatTimes = isNaN(Number(args[0])) ? parseInt(self.variables[args[0]], 10) : parseInt(args[0], 10);
		repeatStack.push({ times: repeatTimes, commands: [] });
	  } else if (command === "ENDREPEAT") {
		const repeatBlock = repeatStack.pop();
  
		const executeRepeatBlock = () => {
		  for (let i = 0; i < repeatBlock.times; i++) {
			executeBlock(repeatBlock.commands);
		  }
		};
  
		if (repeatStack.length > 0) {
		  repeatStack[repeatStack.length - 1].commands.push(executeRepeatBlock);
		} else if(recordingProcedure) {
		  procedureCommands.push(executeRepeatBlock);
		} else {
		  executeRepeatBlock();
		}
	  } else {
		if (ifBlockStack.length > 0) {
		  ifBlockStack[ifBlockStack.length - 1].commands.push(line);
		} else if (repeatStack.length > 0) {
		  repeatStack[repeatStack.length - 1].commands.push(line);
		} else if (recordingProcedure) {
		  procedureCommands.push(line);
		} else {
		  self.executeCommand(line);
		}
	  }
	};
	
	commands.forEach(line => {
	  processCommand(line.trim());
	});
  };
  
