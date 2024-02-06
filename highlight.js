function startHighlight(fieldId) {
	textarea = document.getElementById(fieldId);
	highlight = createDiv(fieldId);
	var ua = window.navigator.userAgent.toLowerCase();
	isIE = !!ua.match(/msie|trident\/7|edge/);
	
	textarea.oninput = handleInput;
	textarea.onscroll = handleScroll;
	handleInput();
}

	
function applyhighlight(text) {
	var keyword = /(^|\s|\()(START|END|STARTPROC|ENDPROC|REPEAT|ENDREPEAT|PROCEDURE|INPUT|OUTPUT|IFBLOCK|ELSE|BREAK|RUN|CALL|ENDIF|SET X)($|\s|\))/g;
	var assgn = /\:\=/g;
	var variable = /(^|\s|\()(int|float|log|sim|lit|tab|inttab|floattab|logtab|simtab|littab)($|\s|\))/g;
	var number = /(^|\s|\()(1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20)($|\s|\))/g;
	var command = /(^|\s|\()(RIGHT|LEFT|UP|DOWN|CELL)($|\s|\))/g;
	text = text.replace(/\n$/g, '\n\n')
			   .replace(assgn, '<mark style="color:Black;">$&</mark>');
	while (keyword.test(text)) text = text.replace(keyword,'$1<mark style="color:Green;">$2</mark>$3');
	while (variable.test(text)) text = text.replace(variable,'$1<mark style="color:Orange;">$2</mark>$3');
	while (command.test(text)) text = text.replace(command,'$1<mark style="color:Blue;">$2</mark>$3');
	while (number.test(text)) text = text.replace(number,'$1<mark style="color:Orange;">$2</mark>$3');
	if (isIE) text = text.replace(/ /g, ' <wbr>');
	return text;
}

function handleInput() {
  var text = textarea.value;
  var highlightedText = applyhighlight(text);
  highlight.innerHTML = highlightedText;
}

function handleScroll() {
  highlight.scrollTop = textarea.scrollTop;
  highlight.scrollLeft = textarea.scrollLeft;
}

function fixFirefox() {
	if(navigator.userAgent.toLowerCase().indexOf('firefox') > -1)
		return 'top:'+(textarea.offsetTop-1)+'px;left:'+(textarea.offsetLeft-1)+'px'+';height:'+(parseInt( getStyle(textarea,'height') )-8)+'px'
	else 
		return 'top:'+textarea.offsetTop+'px;left:'+textarea.offsetLeft+'px'+';height:'+getStyle(textarea,'height')
}

function createDiv(fieldId) {
	
	var div = document.createElement('div');
	div.id = fieldId+'HighlightDiv';
	
	var sheet = document.createElement('style');
	sheet.innerHTML += '#'+ fieldId+'HighlightDiv mark {background-color:transparent}';
	sheet.innerHTML += '#'+ fieldId+'HighlightDiv{width:'+getStyle(textarea,'width')+';box-sizing:border-box;position:absolute;'+fixFirefox()+';font-family:'+getStyle(textarea,'font-family')+';font-size:'+getStyle(textarea,'font-size')+';padding-top:'+getStyle(textarea,'padding-top')+';padding-right:'+getStyle(textarea,'padding-right')+';padding-bottom:'+getStyle(textarea,'padding-bottom')+';padding-left:'+getStyle(textarea,'padding-left')+';white-space:pre-wrap;color:transparent;overflow:hidden;background-color:transparent;pointer-events:none;border:'+getStyle(textarea,'border-width')+' solid;}'
	document.head.appendChild(sheet);
	return textarea.parentNode.appendChild(div);
}

function getStyle(el, cssprop) {
	if (el.currentStyle) return el.currentStyle[cssprop];
	else if (document.defaultView && document.defaultView.getComputedStyle)
		return document.defaultView.getComputedStyle(el, '')[cssprop];
		else
			return el.style[cssprop];
}



