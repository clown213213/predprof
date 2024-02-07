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
	
	let substring=commands.match(/'[^']*'|"[^"]*"/g);
	for (let i in substring) commands = commands.replace(substring[i],'$_'+i);
	
	commands = ' ' + commands.replace(/\n/g,' \n ') + ' ';
	commands = commands.replace(/\(/g,' ( ').replace(/\)/g,') ');
	robot.tick = 0;
	if (robot) commands = robot.parseCommand(commands);

	commands = program.parseCommand(commands);
	console.log(commands)
	for (let i in substring) commands = commands.replace('$_'+i,substring[i]);

	console.log(commands)

	try {
		eval('try{'+commands+'}catch(e){if(e=="collision") pro.error("Столкновение с препятствием!"); else program.error("Ошибка в строке "+e.stack.match(/<anonymous>:(\\d+):/)[1]+"!");}');
	}
	catch(e) {program.error('Ошибка синтаксиса!');}
}

program.parseCommand = function(commands) {

	let jsCommand ='';
	
	commands.split('\n').forEach(function(command) {
				if(/\sPROCEDURE\s/.test(command)) command = program.parseFunction(command);
		command = command.replace(/\sIFBLOCK (.+)/g ,'if (robot.on$1()){')
		.replace(/\sENDIF\s/g,' } ')
		.replace(/\sREPEAT (.+)/g,'for(i=1;i<=($1);i++){')
		.replace(/\sENDREPEAT\s/g,' } ')
		.replace(/\sENDPROC\s/g,' }; ')
		.replace(/\sCALL\s(.+)/g,' $1();')
		.replace(/\sSET (.+) =/g,' var $1 =')
		
		
		jsCommand+=command+'\n';
	});
	return jsCommand;
}

program.parseFunction = function(command) {
	return command.replace(/PROCEDURE\s+$/g,'')
				.replace(/PROCEDURE\s(.+)/g,'function $1 (){')
}

program.error = function(errorMsg) {
	let event = new CustomEvent('error',{detail:errorMsg});
	document.dispatchEvent(event);
}
