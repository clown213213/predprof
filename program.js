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
	  case 'SET': {
		if (args.length === 3 && args[1] === "=") {
		  let variableName = args[0];
		  let value = isNaN(Number(args[2])) ? this.variables[args[2]] : parseInt(args[2], 10);
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
	let recordingIfBlock = false;
	let procedureCommands = [];
	let ifBlockCommands = [];
	let procedureName;
	let ifBlockConditionDirection;
	let nestingLevel = 0;
	
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
	
	const createAndExecuteRepeatBlock = (repeatBlock) => {
	  const commands = repeatBlock.commands;
	  const executeRepeatBlock = () => {
		for (let i = 0; i < repeatBlock.times; i++) {
		  executeBlock(commands);
		}
	  };
  
	  if (recordingProcedure) {
		procedureCommands.push(executeRepeatBlock);
	  } else {
		executeRepeatBlock();
	  }
	};
  
	const processCommand = (line) => {
	  if (line.toUpperCase() === "ENDPROC") {
		if (recordingProcedure) {
		  self.procedures[procedureName] = [...procedureCommands];
		  procedureCommands = [];
		  recordingProcedure = false;
		}
	  } else if (line.toUpperCase().startsWith("PROCEDURE")) {
		recordingProcedure = true;
		procedureName = line.split(/\s+/)[1].toUpperCase();
	  } else if (line.toUpperCase().startsWith("IFBLOCK")) {
		recordingIfBlock = true;
		ifBlockConditionDirection = line.split(' ')[1];
	  } else if (line.toUpperCase() === "ENDIF") {
		if (recordingIfBlock) {
		  recordingIfBlock = false;
		  const conditionDirection = ifBlockConditionDirection;
		  const ifCommands = [...ifBlockCommands];
		  ifBlockCommands = [];
	
		  const executeIfBlock = () => {
			if (typeof robot['on' + conditionDirection.toUpperCase()]()) {
			  executeBlock(ifCommands);
			}
		  };
  
		  if (recordingProcedure) {
			procedureCommands.push(executeIfBlock);
		  } else{
			executeIfBlock();
		  }
		}
	  } else if (line.toUpperCase().startsWith("REPEAT")) {
		const times = parseInt(line.split(' ')[1], 10);
		repeatStack.push({ times: times, commands: [] });
	  } else if (line.toUpperCase() === "ENDREPEAT") {
		const repeatBlock = repeatStack.pop();
		createAndExecuteRepeatBlock(repeatBlock);
	  } else {
		if (recordingIfBlock) {
		  ifBlockCommands.push(line);
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
	  const trimmedLine = line.trim();
	  if (trimmedLine) {
		processCommand(trimmedLine);
	  }
	});
  };
  
