var output="";
var collapse_keys=[];
function line(test_set) {
	//return true if we are currently developing
	developing_result = false;
	$.each(test_set, function(key, test){
		if ((key=='test status') && (test=='developing')) developing_result = true; 
		output = output + "<input type='checkbox'>"+key + " : " + test + "<br>";		
	});
	return developing_result;
}

function setup(){
	$.each(tests, function(key, test_set){
		key_str = key.split(' ').join("_");
		output = output + "<h4 onClick=\"$('#"+key_str+"').toggle();\">"+key+"</h4><div id='"+key_str+"'>"
		if (!line(test_set)) {collapse_keys.push(key_str);}
		output = output + "</div>"
	});
	$('#output_div').html(output);
	//Close any that are not under development
	$.each(collapse_keys, function(key, tg){$('#'+tg).toggle();});
};