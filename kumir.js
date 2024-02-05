const kumir = {};

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
		kumir.start(commands);
	  } catch(err) {
		kumir.error("Ошибка при загрузке файла: " + err.message);
	  }
	};
	
	reader.onerror = function(e) {
	  kumir.error("Не удалось прочитать файл: " + e.target.error);
	};
	
	reader.readAsText(file);
  });

//запуск транспайлера
kumir.start = function(commands) {
	
	//Скрытие текста с кавычками (чтобы он не менялся)
	let substring=commands.match(/'[^']*'|"[^"]*"/g);
	for (let i in substring) commands = commands.replace(substring[i],'$_'+i);
	
	commands = ' ' + commands.replace(/\n/g,' \n ') + ' '; //волшебный костыль №1
	commands = commands.replace(/\(/g,' ( ').replace(/\)/g,' ) '); //волшебный костыль №2 (добавление пробелов перед и после скобок)
	
	//Проверка на наличие и парсинг команд для исполнителя Робот
	robot.tick = 0;
	if (robot) commands = robot.parseCommand(commands);

	commands = kumir.parseCommand(commands); //трансляция в JavaScript
	console.log(commands)
	for (let i in substring) commands = commands.replace('$_'+i,substring[i]); //Возврат текста в кавычках

	console.log(commands)

	/**
	* Данная конструкция отлавливает ошибки,
	* основной catch отлавливает ошибки синтаксиса,
	* catch внутри eval отлавливает остальные ошибки программы
	*/
	try {
		eval('try{'+commands+'}catch(e){if(e=="collision") kumir.error("Столкновение с препятствием!"); else kumir.error("Ошибка в строке "+e.stack.match(/<anonymous>:(\\d+):/)[1]+"!");}');
	}
	catch(e) {kumir.error('Ошибка синтаксиса!');}
}

//Парсинг команд
kumir.parseCommand = function(commands) {

	let jsCommand ='';
	
	//Парсинг основных команд
	commands.split('\n').forEach(function(command) {
				if(/\sprocedure\s/.test(command)) command = kumir.parseFunction(command); //замена объявления функции
		command = command.replace(/\sifBlock (.+)/g ,'if (robot.on$1){')
		.replace(/\selse\s/g,' }else{ ') //замена начала альтернативных команд
		.replace(/\sendif\s/g,' } ') //замена конца условия
		.replace(/\srepeat (.+)/g,'for(i=1;i<=($1);i++){')
		.replace(/\sendrepeat\s/g,' } ') //замена конца цикла while или for
		.replace(/\sendproc\s/g,' }; ')
		.replace(/\sstartproc\s/g,' { ')	
		.replace(/\scall\s(.+)/g,' $1();')
		
		
		jsCommand+=command+'\n';
	});
	return jsCommand;
}

//Парсинг объявления функций
kumir.parseFunction = function(command) {
	return command.replace(/procedure\s+$/g,'')
				.replace(/procedure\s(.+)/g,'function $1 (){')
				.replace(/\s*(?:log|lit|str|int|float)/g,' ')
}

//вывод сообщений
kumir.print = function() {
	let message = '';
	for (let i in arguments) message+=arguments[i];
	let event = new CustomEvent('print',{detail:message});
	document.dispatchEvent(event);
}

//вывод ошибок
kumir.error = function(errorMsg) {
	let event = new CustomEvent('error',{detail:errorMsg});
	document.dispatchEvent(event);
}

//ввод переменных
kumir.read = function(args) {
	let s = prompt('Введите переменные через пробел');
	s = s.split(' ');
	for(let i in args) isNaN(s[i]) ? args[i] = s[i] : args[i] = +s[i];
	return args;
}
