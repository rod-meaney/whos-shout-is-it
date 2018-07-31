/**
 * @author rod
 */

//ie lack of indexOf for Array
if(!Array.indexOf){
    Array.prototype.indexOf = function(obj){
        for(var i=0; i<this.length; i++){if(this[i]==obj){return i;}}
        return -1;
    }
}

Array.prototype.removeObj = function(obj){
	var i=this.indexOf(obj);
	if (this.indexOf(obj)>-1){this.splice(i,1);}
}

function selectBoxIndex(id, value) {
	var temp = document.getElementById(id);
	for (i = 0; i < temp.options.length; i++){   
		if (value==temp[i].text) return i;
	} 
	return -1;
}

function is_int(value){ 
   for (i = 0 ; i < value.length ; i++) { 
      if ((value.charAt(i) < '0') || (value.charAt(i) > '9')) return false 
    } 
   return true; 
}

function rightStr(str, n){
	var iLen = String(str).length; return String(str).substring(iLen, iLen - n);
}

function nowDateTime(){
	var d = new Date();
	return d.getFullYear()+'-'+rightStr('0'+(d.getMonth()+1),2)+'-'+rightStr('0'+d.getDate(),2)+' '+rightStr('0'+d.getHours(), 2)+':'+rightStr('0'+d.getMinutes(),2)
}

function dateFormat(date_milli1970_str){
	var d = new Date(parseFloat(date_milli1970_str));
	//return d.getFullYear()+'-'+rightStr('0'+(d.getMonth()+1),2)+'-'+rightStr('0'+d.getDate(),2)+' '+rightStr('0'+d.getHours(), 2)+':'+rightStr('0'+d.getMinutes(),2)
	return d.getFullYear()+'-'+rightStr('0'+(d.getMonth()+1),2)+'-'+rightStr('0'+d.getDate(),2)
}

function todayF(){
	return dateFormat((new Date()).getTime());
}

function dayDeltaToday(days){
	return dateFormat((new Date()).getTime() + (1000 * 60 * 60 * 24 * days));
}

function nowTime(){
	var d = new Date();
	return rightStr('0'+(d.getHours()+1),2)+':'+rightStr('0'+(d.getMinutes()+1),2)+':'+rightStr('0'+d.getSeconds(),2);	
}

/**
 * @param	date - date in the format yyyy-mm-dd
 */
function isDateStd(date) {
	var dArr = date.split("-");
	try{if (isDate(dArr[1],dArr[2],dArr[0])) return true;} catch (err) {return false;}
}

function isDate(mm_str,dd_str,yyyy_str) {
   var mm=parseInt(mm_str, 10)-1; var dd = parseInt(dd_str, 10); var yyyy = parseInt(yyyy_str, 10);
   var d = new Date(yyyy,mm,dd);
   return (d.getMonth() == mm) && (d.getDate() == dd) && (d.getFullYear() == yyyy);
}

function setSelectBox(id, value){
	document.getElementById(id).selectedIndex=selectBoxIndex(id, value);
}

function getSelectedBox(id){
	return document.getElementById(id).options[document.getElementById(id).selectedIndex].value;
}

function trim(id){
	$('#'+id).val($.trim($('#'+id).val()));
	return $('#'+id).val(); 
}

function basicTextVal(id, error, errors){
	trim(id);
	if ($('#'+id).val()=='') errors.push(error);
}

function isValidText(s, l){
	var test_l=40; if (l) test_l=l;
	if (s.length==0) return false;
	if (s.length>test_l) return false;
	var matchme = /^[A-Za-z0-9@._\-,:' ]*$/;
	return matchme.test(s);	
}

function isJSCleanText(s){
	var matchme = /^[A-Za-z0-9@._\-=() ]*$/;
	return matchme.test(s);	
}

function isValidEMail (s){   
   var matchme = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,6}))$/;
   return matchme.test(s);
}
function isValidAmount (s){   
   var matchme = /^[1-9][0-9]*(\.[0-9]{2})?$/;
   return matchme.test(s);
}

function writeError(error, alert_only) {
	var e_str='';
	if (error.length>0) {
		jQuery.each(error, function() {
			e_str+=this+"\n";
		});
		if (alert_only) alert("== ERROR ==\n\n"+e_str);
		else {
			$('#error_dialog_text').html(e_str);
			$.mobile.changePage( "#errorDialog", { role: "dialog" } );
		}
	}
}
function debugLine(line){
	if (window.console) {
	    console.log(line);
	}
}