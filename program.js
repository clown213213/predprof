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
		  commandOrBlock(); // Выполнение условных блоков
		} else {
		  self.executeCommand(commandOrBlock);
		}
	  });
	};
  
	const processCommand = (line) => {
	  if (recordingProcedure) {
		if (line.toUpperCase() === "ENDPROC") {
		  self.procedures[procedureName] = procedureCommands.slice();
		  procedureCommands = [];
		  recordingProcedure = false;
		} else {
		  procedureCommands.push(line);
		}
	  } else if (recordingIfBlock) {
		if (line.toUpperCase() === "ENDIF") {
		  recordingIfBlock = false;
		  const currentIfBlockCommands = ifBlockCommands.slice()
		  const executeIfBlock = () => {
			if (robot['on' + ifBlockConditionDirection.toUpperCase()]()) {
			  executeBlock(currentIfBlockCommands);
			}
		  };
		  if (repeatStack.length > 0) {
			repeatStack[repeatStack.length - 1].commands.push(executeIfBlock);
		  } else {
			executeIfBlock();
		  }
		  ifBlockCommands = [];
		} else {
		  ifBlockCommands.push(line);
		}
	  } else if (line.toUpperCase().startsWith("REPEAT")) {
		const parts = line.split(/\s+/);
		const repeatValue = parseInt(parts[1], 10) || self.variables[parts[1].toUpperCase()] || 0;
		repeatStack.push({ times: repeatValue, commands: [] });
	  } else if (line.toUpperCase() === "ENDREPEAT") {
		const repeatBlock = repeatStack.pop();
		const executeRepeatBlock = () => {
		  for (let i = 0; i < repeatBlock.times; i++) {
			executeBlock(repeatBlock.commands);
		  }
		};
		if (repeatStack.length > 0) {
		  repeatStack[repeatStack.length - 1].commands.push(executeRepeatBlock);
		} else {
		  executeRepeatBlock();
		}
	  } else if (line.toUpperCase().startsWith("IFBLOCK")) {
		recordingIfBlock = true;
		ifBlockConditionDirection = line.split(/\s+/)[1];
	  } else if (line.toUpperCase().startsWith("PROCEDURE")) {
		recordingProcedure = true;
		procedureCommands = [];
		procedureName = line.split(/\s+/)[1].toUpperCase();
	  } else {
		// Добавляем команду в текущий блок REPEAT или выполняем немедленно
		if (repeatStack.length > 0) {
		  repeatStack[repeatStack.length - 1].commands.push(line);
		} else {
		  self.executeCommand(line);
		}
	  }
	};
  
	commands.forEach((line) => {
	  const trimmedLine = line.trim();
	  if (trimmedLine) {
		processCommand(trimmedLine);
	  }
	});
  };
  
