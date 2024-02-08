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
		program.start(commands);
	  } catch(err) {
		program.error("Ошибка при загрузке файла: " + err.message);
	  }
	};
	
	reader.onerror = function(e) {
	  program.error("Не удалось прочитать файл: " + e.target.error);
	};
	
	reader.readAsText(file);
  });
  program.start = function(commands) {
	commands = commands.split('\n');
	
	let repeatCommands = [];
	let recording = false;
	let record = false;
	let times = 0;
  
	for (let line of commands) {
	  if (line.trim() === '') continue;
  
	  if (line.toUpperCase().startsWith("REPEAT")) {
		repeatCommands = [];
		recording = true;
		let parts = line.split(/\s+/);
		times = parseInt(parts[1]);
		continue;
	  }
	  if (recording && !line.toUpperCase().startsWith("ENDREPEAT")) {
		repeatCommands.push(line);
		continue;
	  }
  
	  if (line.toUpperCase().startsWith("ENDREPEAT")) {
		recording = false;
		for (let i = 0; i < times; i++) {
		  repeatCommands.forEach(this.executeCommand);
		}
		continue;
	  }
	  if (line.toUpperCase().startsWith("IFBLOCK")) {
		ifBlockCommands = [];
		record = true;
		let parts = line.split(/\s+/);
		direction = parts[1];
		continue;
	  }
	  if (record && !line.toUpperCase().startsWith("ENDIF")) {
		ifBlockCommands.push(line);
		continue;
	  }
	  if (line.toUpperCase().startsWith("ENDIF")) {
		record = false;
		if (robot['on' + direction.toLowerCase()]) {
		  ifBlockCommands.forEach(this.executeCommand);
		}
		continue;
	  }
  
	  if (!recording) {
		this.executeCommand(line);
	  }
	  // The rest of the code for IFBLOCK, ENDIF, and other logic should be implemented in executeCommand
	}
	console.log(ifBlockCommands)
  };
  
  program.executeCommand = function(command) {
	let [instruction, ...args] = command.split(/\s+/);
	instruction = instruction.toUpperCase();
	let steps, direction;
  
	switch (instruction) {
	  case 'RIGHT':
	  case 'LEFT':
	  case 'UP':
	  case 'DOWN':
		if (typeof stopMoving !== 'undefined' && stopMoving) {
		  return;
		}
		steps = parseInt(args[0]);
		robot[instruction.toLowerCase()](steps);
		break;
	  case 'IFBLOCK':
		direction = args[0].toUpperCase();
		// If IFBLOCK is meant to trigger event handlers, call them like so:
		if (robot['on' + direction.toLowerCase()]) {
		  robot['on' + direction.toLowerCase()]();
		}
		break;
	  case 'ENDIF':
		// End of IFBLOCK condition
		break;
	  case 'SET':
		
	}
  };
program.error = function(errorMsg) {
  let event = new CustomEvent('error', { detail: errorMsg });
  document.dispatchEvent(event);
	}
