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
  });
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
		let procedureName = args[0];
		if (this.procedures.hasOwnProperty(procedureName)) {
		  this.procedures[procedureName]();
		} else {
		  this.error(`Процедура ${procedureName} не определена.`); // Corrected error message with template literals
		}
		break;
	  }
}
  program.error = function(errorMsg) {
	console.error('Ошибка:', errorMsg);
  };
  
  program.checkCondition = function(condition) {
	return robot[condition];
  };
  
	}
  program.start = function(commands) {
	// Захватываем правильный контекст 'this'
	const self = this;
  
	commands = commands.split('\n');
	let repeatCommands, times, recordingRepeat = false;
	let ifBlockCommands, recordingIfBlock = false, direction;
	let procedureCommands, recordingProcedure = false, procedureName;
	
	self.variables = {};
	self.procedures = {};
	const processCommand = (line) => {
		if (recordingProcedure) {
		  if (line.toUpperCase().startsWith("ENDPROC")) {
			recordingProcedure = false;
			self.procedures[procedureName] = ((cmds) => {
			  return () => {
				cmds.forEach(self.executeCommand.bind(self));
			  };
			})(procedureCommands);
		  } else {
			procedureCommands.push(line);
		  }
		  return;
		}
		if (line.toUpperCase().startsWith("REPEAT")) {
		  let parts = line.split(/\s+/);
		  let repeatValue = parts[1];
		  repeatCommands = [];
		  recordingRepeat = true;
		  if(isNaN(repeatValue)){
			if(self.variables.hasOwnProperty(repeatValue)){
			  times = self.variables[repeatValue];
			} else {
			  self.error("Переменная для повторения не найдена.");
			  recordingRepeat = false;
			}
		  } else {
			times = parseInt(repeatValue, 10);
		  }
		  return;
		}
		if (recordingRepeat && !line.toUpperCase().startsWith("ENDREPEAT")) {
		  repeatCommands.push(line);
		  return;
		}
	  
		if (line.toUpperCase().startsWith("ENDREPEAT")) {
		  recordingRepeat = false;
		  for (let i = 0; i < times; i++) {
			repeatCommands.forEach(self.executeCommand.bind(self));
		  }
		  return;
		}
		if (line.toUpperCase().startsWith("IFBLOCK")) {
		  ifBlockCommands = [];
		  recordingIfBlock = true;
		  let parts = line.split(/\s+/);
		  direction = parts[1];
		  return;
		}
		if (recordingIfBlock && !line.toUpperCase().startsWith("ENDIF")) {
		  ifBlockCommands.push(line);
		  return;
		}
		if (line.toUpperCase().startsWith("ENDIF")) {
		  recordingIfBlock = false;
		  if (self.checkCondition('on' + direction)) {
			ifBlockCommands.forEach(self.executeCommand.bind(self));
		  }
		  return;
		}
	  
		if (!recordingRepeat && !recordingIfBlock && !recordingProcedure) {
		  self.executeCommand(line);
		}
		if (line.toUpperCase().startsWith("PROCEDURE")) {
		  procedureCommands = [];
		  recordingProcedure = true;
		  procedureName = line.split(/\s+/)[1].toUpperCase();
		  return;
		}
		if (recordingProcedure && !line.toUpperCase().startsWith("ENDPROC")) {
			procedureCommands.push(line);
			return;
			}
	  };

for (let line of commands) {
    if (line.trim() === '') continue;
    line = line.trim();
    processCommand(line);
  }
  
 
}
