 
/***
 * Constants
 */
var STANDARD_TEXT_ERROR = "No empty values. Use numbers, letters, spaces, full stop (.), comma (,), apostrophy (') at (@), colon (:) or underscore (_).";
var BAD_EMAIL_ERROR = "You have not enetered a valid email address";
var ITEM_EXISTS_ERROR = "Item already exists - select the item in the list.";
var CONFIRM_SYNCH = 'Pressing OK will remove all local data and re-synch with the cetral data storage.  Or press cancel to abort procedure.';
var CONFIRM_DELETE = 'This will delete YOUR instance of this shout.';
var CONFIRM_FRIEND_DELETE = 'This will delete YOUR friend and all YOUR shouts with them.';
var MUST_HAVE_NAME_ERROR = "You must enter your name under My details in etc... tab before requesting friends";
var FAILING_TO_CONNECT = "There is currently an issue connecting, please try again later.";
var GEO_LOC_BROWSER_OFF ="You have decided not to use geo location service. To change this you need to clear your browser settings and re-try.";
var REQUEST_ALREADY_PROCESSED = "That request is no longer available to process";
var MY_SHOUT = 'my shout'; 
var debug=null;
var shout_enum = {'me':1,'you':-1};
var enum_shout = {'1':'me','-1':'you'};
/***
 * Instantiate all domain variables
 */
var local_integrate = new Local_integrate();
//var items = new Items();
var local_data = new Data();
var people = new People();
var requests = new Requests();

/***
 * Instantiate all context variables
 */
var page_swap = new Page_swap();
var current_item = null;
var current_person = null;
var current_shout = null; //{'person':current_person, item:"item", who:"me or you"}
var current_friend_request = null;
var delete_shout_key = null;
var start_page = '';
var current_lat_lang='';
var me={};

/***
 * Small fn's
 */
function js_cln(d){return d.split("'").join("\\'");}
function refresh_ui_list(l){try {$(l).listview('refresh');} catch (err){/* initial load fails but does not matter */}}
function do_header(header){$('#header_text').html(header);}
function load_fresh_shout(_key){
	current_person = new Person(_key);
	current_person.add_item(current_item);
}
function delete_shout(_key, _who){
	delete_shout_key = _key;
	if (confirm(CONFIRM_DELETE)) {
		current_shout = {'person':current_person, 'item':current_item, "who":enum_shout[String(_who)]};
		postWeb("delete shout");		
	}
}
function popup(header, body){
	$('#popup_header').html(header);
	$('#popup_body').html(body);
	$("#popup").dialog();
}
function logout(url){
	$('#menu').trigger('close');
	location.href=url;
}
function locationSwitch(_switch_val){
	if (_switch_val=='off'){
		localStorage['location']='off';
	} else {
		if (navigator.geolocation){
			navigator.geolocation.getCurrentPosition(function(position) {
				localStorage['location']='on';
			}, function(err){
				localStorage['location']='off - browser';
				$('#location_comment').html(GEO_LOC_BROWSER_OFF);
			});
	    }
		else {$('#location_comment').html("Sorry, geolocation is not supported by this device.");}		
	}
}
function Data(){
	this.items_data = {};  //every item with a list of associated people and totals
	this.people_data = {};  //every person with a list of associated items and totals
	this.items = []; //simple sorted list of all items
}
Data.prototype.load = function(){
	//assume that the person mapping has been done
	var shoutPattern=new RegExp(".+\\^.+");
	for (var key in localStorage){
		if (shoutPattern.test(key)) {
			this.load_shout(key.split('^')[0],
							key.split('^')[1], 
							JSON.parse(localStorage[key]), false);
		}
	}	
	this.reload_global_items_list();
}
Data.prototype.reload_global_items_list = function(){
	//updates the global item list
	this.items = [];
	for (var item in this.items_data){this.items.push(item)};
	this.items.sort(function(a,b){return a.localeCompare(b);});
}
Data.prototype.delete_shout = function(_name_key, _item, _me_you_dict){
	//Assumes items will always be there
	//all items
	index = this.index_of(this.items_data[_item], _name_key);
	this.items_data[_item][index]['totals'] = _me_you_dict;
	//all people
	index = this.index_of(this.people_data[_name_key], _item);
	this.people_data[_name_key][index]['totals'] = _me_you_dict;
}
Data.prototype.load_shout = function(_name_key, _item, _me_you_dict, sort_me){
	if (!(_name_key in people.people_mapping)){
		//The person has been deleted or is from a different user
		//		ignore everything to do with them
		return false;
	}
	//all items
	require_sorting=false;
	if (_item in this.items_data){
		index = this.index_of(this.items_data[_item], _name_key);
		if (index==-1){
			this.items_data[_item].push({'val':_name_key, 'name':people.people_mapping[_name_key], 'totals':_me_you_dict});
			require_sorting=true;
		} else {
			this.items_data[_item][index]['totals'] = _me_you_dict;
		}
	} else {
		this.items_data[_item]=[{'val':_name_key, 'name':people.people_mapping[_name_key], 'totals':_me_you_dict}];
	}
	
	//all people
	if (_name_key in this.people_data){
		index = this.index_of(this.people_data[_name_key], _item);
		if (index==-1){
			//Add in all but first friend
			this.people_data[_name_key].push({'val':_item, 'item':_item, 'totals':_me_you_dict, 'new':false});
			require_sorting=true;
		} else {
			this.people_data[_name_key][index]['totals'] = _me_you_dict;
		}
	} else {
		//Add in first friend
		this.people_data[_name_key]=[{'val':_item, 'item':_item, 'totals':_me_you_dict, 'new':false}];
	}	
	if (require_sorting && sort_me) this.sort_all();
}
Data.prototype.index_of = function(array, element){
	//all arrays are items of {"val":"xxx":{'me':n,'you':m}} 
	//where we are sorting on xxx
	for (var i=0; i<array.length; i++){
		if (array[i].val==element) return i;
	}
	return -1;
}
Data.prototype.sort_all = function(){	
	for (var item in this.items_data){
		
		this.items_data[item].sort(function(a,b){
			return a.name.localeCompare(b.name);
		});
	}
	for (var person in this.people_data){
		this.people_data[person].sort(function(a,b){
			return a.val.localeCompare(b.val);
		});
	}	
}
Data.prototype.ui_items_listing = function(){
	$('#items_list').empty();
	for (var i=0; i<this.items.length; i++){
		$('#items_list').append("<li><a href=\"javascript:local_data.ui_select_item('"+
				js_cln(this.items[i])+"')\">"+
				this.items[i]+"</a></li>");
	}
	refresh_ui_list('#items_list');	
	page_swap.swap_to("items_list");
}
Data.prototype.ui_select_item = function(_item){
	start_page='items';
	current_item = _item;
	do_header(_item);	
	generateList(this.items_data[_item],'item', '#item_list');
	page_swap.swap_to('item');
}
function Person(_key){
	this.key=_key;
	this.name=people.people_mapping[_key];
	this.items=local_data.people_data[_key];  //{'item':'blue', totals:{'me':0, 'you':0}, 'new':false}
	if (this.items==undefined) this.items = []; //No items for the person yet
}
Person.prototype.new_item = function(_item){
	if (!isValidText(_item)) {writeError([STANDARD_TEXT_ERROR]); return false;}
	if (this.item_exist(_item)) {writeError([ITEM_EXISTS_ERROR]); return false;}
	$('#new_item_input').val('');
	this.items.push({'item':_item.toLowerCase(), 'val':_item.toLowerCase(), totals:{'me':0, 'you':0}, 'new':true}); 
	this.sort();
	return true;	
}
Person.prototype.add_item = function(_item){
	//from the list of items select an item and go to the shout screen
	$('#shout_history').empty();
	current_item = _item;
	$('#shout_button').html(current_person.name + " shout");
	page_swap.swap_to('add_shout');
	this.generate_chart(_item);
}
Person.prototype.generate_chart = function(_item){
	$('#shout_chart').html('');
	item = this.get_item(_item);	
	if ((item.totals.me + item.totals.you)>0) generateGoogleIOUChart(item.totals.me, item.totals.you, current_person.name, 'shout_chart');
}
Person.prototype.add_shout = function(_shout){
	current_shout = {'person':current_person, 'item':current_item, 'who':_shout, 'latt':'', long:''};
	if (localStorage['location']==null) {
		postWeb("shout");
	} else if (localStorage['location']=='off') {
		postWeb("shout");
	} else {
		if (navigator.geolocation){
			$.blockUI({ message: "Connecting...." });
			navigator.geolocation.getCurrentPosition(function(position) {
				$.unblockUI();
				current_shout['latt']=position.coords.latitude;
				current_shout['long']=position.coords.longitude;
				postWeb("shout");
			}, function(err){
				$.unblockUI();
				postWeb("shout");
			});
	    }
		else {postWeb("shout");}		
	}
}
Person.prototype.item_exist = function(_item){
	if (this.get_item(_item)==null) return false;
	return true;
}
Person.prototype.item_decrement = function(_item, _shout){
	key = this.key + "^" + _item;
	data = localStorage.getItem(key);	
	me_you = JSON.parse(data);
	me_you[_shout] = me_you[_shout] - 1;
	localStorage[key] = JSON.stringify(me_you);
	local_data.delete_shout(this.key, _item, me_you);
}

Person.prototype.item_increment = function(_item, _shout){
	//fix local data store
	key = this.key + "^" + _item;
	data = localStorage.getItem(key);
	me_you = null;
	if (data===null){//nada
		if (_shout=='me'){
			me_you = {'me':1, 'you':0}; 
		} else {
			me_you = {'me':0, 'you':1};
		}
	} else {
		me_you = JSON.parse(data);
		me_you[_shout] = me_you[_shout] + 1;
	}
	localStorage[key] = JSON.stringify(me_you);
	
	//can then re-use load mechanism
	local_data.load_shout(this.key, _item, me_you, true);
	local_data.reload_global_items_list();  //and update the global item list - should re-design!
}

Person.prototype.get_item = function(_item){
	for (var i=0; i<this.items.length; i++){
		if (_item==this.items[i].item) return this.items[i];
	}
	return null;
}
Person.prototype.sort = function(){
	this.items.sort(function(a,b){
		if (a['new'] && (b['new']==false)) return -1;
		if ((a['new']==false) && b['new']) return 1;
		return a.item > b.item;
	});		
}
Person.prototype.ui_listing = function(){
	//$('#person_item_table').html(generateTableHtml(this.items, 'person'));
	generateList(this.items, 'person', '#person_item_list')
}
function People(){
	this.people_list=[];
	this.people_mapping={};
}
People.prototype.add = function(_name, _key, _synch){
	this.people_list.push({"name":_name, "key":_key});
	this.people_mapping[_key]=_name;
	this.people_list.sort(function(a,b){	
		return a.name.localeCompare(b.name);
	});	
}
People.prototype.ui_listing = function(){
	//updates the person list for person and selected item page
	$('#person_list').empty();
	for (var i=0; i<this.people_list.length; i++){
		$('#person_list').append("<li><a href=\"javascript:people.ui_select_person('"+
				js_cln(this.people_list[i].name)+"','"+this.people_list[i].key+"')\">"+
				this.people_list[i].name+"</a></li>");
	}
	refresh_ui_list('#person_list');
}
People.prototype.ui_group_select_listing = function(){
	//updates the person list for person and selected item page
	var group = $( "#group_select_set" );
	group.empty();
	for (var i=0; i<this.people_list.length; i++){
		group.append("<input type='checkbox' name='gs_"+
				this.people_list[i].key+"' id='gs_"+
				this.people_list[i].key+"'><label for='gs_"+
				this.people_list[i].key+"'>"+
				js_cln(this.people_list[i].name)+"</label>").trigger('create');		
	}
}
People.prototype.ui_select_person = function(_name, _key){
	start_page='people';
	current_person = new Person(_key);
	current_person.ui_listing();
	$('#new_item_input').val('');
	page_swap.swap_to('person');
}
People.prototype.remove_person = function(){
	debugLine("Going to remove "+current_person.name+". Lots to think about!");
}

function Requests(){
	this.received = {};
	this.sent = {};
}
Requests.prototype.load = function(data){
	this.load_received(data.ReceivedFriendRequests);
	this.load_sent(data.SentFriendRequests);	
}
Requests.prototype.load_sent = function(_sent_requests){
	this.sent = {};
	ar = _sent_requests;
	for (var i=0; i<ar.length; i++){
		this.sent[ar[i].key] = {"name":ar[i].name, "email":ar[i].email};
	}	
}
Requests.prototype.load_received = function(_received_requests){
	this.received = {};
	ar = _received_requests;
	for (var i=0; i<ar.length; i++){
		this.received[ar[i].key] = {"name":ar[i].from_name, "email":ar[i].email_from};
	}	
	this.request_count();
}
Requests.prototype.request_count = function(){
	no_requests = Object.keys(this.received).length;
	if (no_requests>0){
		html = "<input type='button' onclick=\"postWeb('friend requests');\" data-inline='true' value='You have " + no_requests+ " friend request(s)' class='ui-input-btn ui-btn ui-btn-inline'>";
		$('#request_count').html(html);		
	} else {
		$('#request_count').html('');
	}	
}
Requests.prototype.remove = function(_key){
	if (_key in this.received) {
		delete this.received[_key];
		this.request_count();
	}
	else if (_key in this.sent) {delete this.sent[_key];}
}
Requests.prototype.ui_listing = function() {
	$('#requests_list').empty();
	$('#requests_list').append("<li data-role='list-divider'>Received<span class='ui-li-count'>"+Object.keys(this.received).length+"</span></li>");
	$.each(this.received, function(key, request){
		$('#requests_list').append("<li><a href=\"javascript:requests.ui_select_request('"+
				js_cln(request.name)+"','"+key+"','"+request.email+"', 'received')\">"+
				request.name+"</a></li>");		
	});
	$('#requests_list').append("<li data-role='list-divider'>Sent<span class='ui-li-count'>"+Object.keys(this.sent).length+"</span></li>");
	$.each(this.sent, function(key, request){
		$('#requests_list').append("<li><a href=\"javascript:requests.ui_select_request('"+
				js_cln(request.name)+"','"+key+"','"+request.email+"', 'sent')\">"+
				request.name+"</a></li>");		
	});	
	refresh_ui_list('#requests_list');
}
Requests.prototype.ui_select_request = function(_name, _key, _email, _type){
	current_friend_request = _key;
	$('#request_header_text').html(_name);
	$('#request_email').html("email : "+_email);
	if (_type=='sent'){
		$('#sent_request_buttons').show();
		$('#request_buttons').hide();
	} else {
		$('#sent_request_buttons').hide();
		$('#request_buttons').show();
	}
	page_swap.swap_to('request');
}
/***
 * Page swapping
 */
function Page_swap (){
	//now unnecessary
	this.pages = ['feedback', 'my_details', 'location', 'full_synch', 'stats', 'item', 'person', 'items_list', 'add_person', 'add_shout', 'requests', 'request', 'map_canvas'];
}
Page_swap.prototype.swap_to = function(page){
	switch (page) {
		case "friend_edit":
			$('#friend_edit_header_text').html(current_person.name);
			$("#friend_edit_name").val(current_person.name);
		case "add_person":
			$("#add_person_local_name_div").hide();
			$("#add_person_local_name_div").val('');
		break
		case "person":
			$('#person_header_text').html(current_person.name);
		break
		case "group_shout":
			people.ui_group_select_listing()
		break
		case "add_shout":
			$('#shout_header_text').html(current_person.name + " / " + current_item);
		break		
		case "item":
			$('#item_header_text').html(current_item);
		break
		case "request":
		break
		case "requests":
		case "my_details":
		case "feedback":
		case "full_synch":
		case "items_list":
		case "location":
			if (localStorage['location']=='off - browser'){
				$('#location_comment').html(GEO_LOC_BROWSER_OFF);
			} else {$('#location_comment').html('');}
			if (localStorage['location']=='on'){
				$('#location_choice').val('on');
			} else {$('#location_choice').val('off');}
			do_header("Location service");
			$('#menu').trigger('close');
		break	
		case "FAQ":
			$('#FAQ_list').empty();
			hd = help_data['FAQ']['items'];
			for (var faq in hd) {
				$('#FAQ_list').append("<li><a href=\"javascript:FAQ_help("+faq+");\"><h2>"+hd[faq].title+"</h2>"+
						"<p>"+hd[faq].heading+"</p></a></li>")
			} 
			refresh_ui_list("#FAQ_list");
		break
		case "released_features":
			$('#released_features_list').empty();
			$.each(help_data['Releases'], function(key, release){
				$('#released_features_list').append("<li><h2>"+release.title+"</h2>"+
						"<p><strong>"+release.date+"</strong></p>"+
						"<p>"+release.detail+"</p></li>")
			});
			refresh_ui_list("#released_features_list");
		break
		case "planned":
			priority = {'l':'Low', 'm':'Medium', 'h':'High'}
			$('#planned_list').empty();
			$.each(help_data['Planned enhancements'], function(key, plan){
				$('#planned_list').append("<li><h2>"+plan.title+"</h2>"+
						"<p><strong>Priority : "+priority[plan.priority]+"</strong></p>"+
						"<p>"+plan.detail+"</p></li>")
			});
			refresh_ui_list("#planned_list");
		break
	} //switch
	$.mobile.changePage('#'+page+'_div');
	$('#menu').trigger('close');
}

function FAQ_help(_line){
	$('#FAQ_detail_header_text').html(help_data['FAQ']['items'][_line].title);
	$('#FAQ_detail_body').html(help_data['FAQ']['items'][_line].detail);
	$.mobile.changePage('#FAQ_detail_div');
}

/***
 * This is loading from local storage
 */
function Local_integrate() {}
/*
Local_load.prototype.items = function () {
	if (localStorage.getItem('items_json')===null){//nada 
	} else {items.item_list=JSON.parse(localStorage.items_json);}
}
*/

/***
 * event adding section
 */
function clear(){
	for (var key in localStorage){
		localStorage.removeItem(key);
	}	
}
function initialise_page(){
	postWeb("load check");
	
	//Enter for add item field
	$("#new_item_input").keyup(function (e) {
	    if (e.keyCode == 13) {
	    	if (current_person.new_item($("#new_item_input").val())) {
	    		current_person.ui_listing();
	    	}
	    }
	});
	//Enter for people field
	$("#add_person_input").keyup(function (e) {
	    if (e.keyCode == 13) {
	    	checkForEmailInPerson();
	    }
	});		
	//Enter for people field
	$("#add_person_local_name").keyup(function (e) {
	    if (e.keyCode == 13) {
	    	postWeb("Add friend")
	    }
	});
	//Switching data for location services
	if (localStorage['location']==null) {localStorage['location']='off';}
	$("#location_choice").change(function () {
		   locationSwitch($(this).val());
		});
}

function checkForEmailInPerson(){
	person_str = trim('add_person_input');
	if (person_str.indexOf('@')>-1) {
		if (!isValidEMail(person_str)) {
			writeError([BAD_EMAIL_ERROR]);
		} else if (me.name==''){  
			writeError([MUST_HAVE_NAME_ERROR]);
		} else {
			$("#add_person_local_name_div").show();
			$("#add_person_local_name").focus();			
		}
	}
	else {postWeb("Add friend");}	
}

/***
 * Wipe the local client and download all the relevant data
 * should also be run on a blank client
 * 
 * @param _confirm	if it exists then confirm with user before performing
 * 
 */
function fullSynch(_confirm) {
	proceed = true;
	if (_confirm) {
		if (!confirm(CONFIRM_SYNCH)) proceed = false;
	}
	if (proceed){
		for (var key in localStorage){
			localStorage.removeItem(key);
		}
		location.reload();
	}
}

function localDateValue(ls) {
	if (localStorage[ls]!=null) {return JSON.parse(localStorage[ls])['dt'];}else return ""};

function postWeb(ucase) {
	all_urls = {'friend requests':'/auth/friend_requests',
				'accept friend requests':'/auth/accept_friend_requests',
				'cancel friend requests':'/auth/cancel_friend_requests',
				'reject friend requests':'/auth/reject_friend_requests',
				'load check':'/auth/check',
				'Add friend':'/auth/add_friend',
				'Edit friend':'/auth/edit_friend',
				'Delete friend':'/auth/delete_friend',
				'update my details':'/auth/update_person',
				'feedback':'/add_feedback',
				'history':'/auth/history',
				'delete shout':'/auth/delete_shout',
				'shout':'/auth/add_shout'};
	url = all_urls[ucase];
	/*
	 * The standard function to post and save data and handle responses
	 */
	load={};
	errors=[];
	switch (ucase) {
		case "load check":
			load['shouts_last_updated'] = localDateValue('shouts_last_updated');
		break;
		case "delete shout":
			load['key']=delete_shout_key;
		break;
		case "friend requests":
		break;
		case "accept friend requests":
		case "reject friend requests":
		case "cancel friend requests":
			if ((current_friend_request in requests.sent) || (current_friend_request in requests.received)) {
				load['key']=current_friend_request;
			} else {
				errors.push(REQUEST_ALREADY_PROCESSED);
			}
		break;
		case "Edit friend":
			if (!isValidText(trim('friend_edit_name'))) {errors.push(STANDARD_TEXT_ERROR);}
			load['friend_name']=$('#friend_edit_name').val();
			load['key']=current_person.key
		break;
		case "Delete friend":
			load['key']=current_person.key
		break;			
		case "Add friend":
			load['friend_id']='';
			if (trim('add_person_local_name')=='') {
				//local friend
				if (!isValidText(trim('add_person_input'))) {errors.push(STANDARD_TEXT_ERROR);}
				load['friend_name']=$('#add_person_input').val();
			} else {
				//friend request
				if (!isValidEMail(trim('add_person_input'))) {errors.push(BAD_EMAIL_ERROR);}
				else if (!isValidText(trim('add_person_local_name'))) {errors.push(STANDARD_TEXT_ERROR);}
				load['friend_name']=$('#add_person_local_name').val();
				load['friend_id']=$('#add_person_input').val();
			}
		break;
		case "feedback":
			trim('feedback_in');
			if ($('#feedback_in').val()==0) errors.push("Please ensure you provide valid feedback in.");
			load['feedback_in']=$('#feedback_in').val();
		break;
		case "shout":
			load['key']=current_shout.person.key;
			load['item']=current_shout.item;
			load['who']=shout_enum[current_shout.who];
			load['date_time']=nowDateTime();
			load['shouts_last_updated'] = localDateValue('shouts_last_updated');
			load['latt']=current_shout.latt;
			load['long']=current_shout.long;
		break;
		case "update my details":
			my_name = trim('my_name');
			if (!isValidText(my_name)) {errors.push(STANDARD_TEXT_ERROR);}
			load['name']=my_name;		
		break;
		case "history":
			my_name = trim('my_name');
			if (!isValidText(my_name)) {errors.push(STANDARD_TEXT_ERROR);}
			load['key']=current_person.key;
			load['item']=current_item;
		break;		
	}
	if (errors.length > 0) {
		writeError(errors);
	} else {
		$.blockUI({ message: "Connecting...." });
		$.post(url, load,  
		function(data) {
			if (data.error) {writeError(data.error);} else {
				switch (ucase) {
					case "Edit friend":
						//its ugly - but saves a whole lot of complex code
						location.reload();
					break;	
					case "Delete friend":
						fullSynch(false);
					break;		
					case "history":
						if ('history' in data.response) {
							generateList(data.response.history, 'history', '#shout_history');
						}
					break;
					case "feedback":
						$('#feedback_in').val('');
						alert("Thanks for your feedback");
					break;
					case "Add friend":
						$('#add_person_input').val('');
						$('#add_person_local_name').val('');
						$("#add_person_local_name_div").hide();
						$('#add_person_input').blur();
					break;	
					case "update my details":
						me.name=load['name'];
						$('#my_name').val(load['name']);
						page_swap.swap_to('add_person');
					break;
					case "load check":
						//load friends each time
						$.each(data.response.friends, function(key, friend){
							people.add(friend[0], friend[1], friend[2]);
						});
						me['name']=data.response.me.name;
						$('#my_name').val(me.name);
						if (me.name==''){page_swap.swap_to('my_details');}
						else {
							//Go to the friend page unless already on it
							load_page=true;
							loc_array=location.href.split('#');
							if (loc_array.length>1){
								if (loc_array[1]=='add_person_div'){
									$("#add_person_local_name_div").val('');
									$("#add_person_local_name_div").hide();
									load_page=false;
								}
							}
							//Load to the friend page
							if (load_page) page_swap.swap_to('add_person'); //$.mobile.changePage('#add_person_div');							
						}
						people.ui_listing();
						if (!('updates' in data.response)){
							//its a bit naff, but this will be done later of there are updates
							local_data.load();
							local_data.sort_all();							
						}
					break;
					case "friend requests":
						requests.load(data.response);
						requests.ui_listing();
						page_swap.swap_to('requests');
					break;
					case "accept friend requests":
					case "reject friend requests":
					case "cancel friend requests":
						requests.remove(load['key']);
						requests.ui_listing();
						page_swap.swap_to('requests');
					break;										
					case "delete shout":
						current_person.item_decrement(current_item, current_shout.who);
						current_person.generate_chart(current_item);
						setTimeout(function() {postWeb("history");}, 500);
					break;					
					case "shout":
						current_person.item_increment(load['item'], current_shout.who);
						if (start_page=='items') {
							local_data.ui_select_item(load['item']);
						} else {
							people.ui_select_person(current_person.name, current_person.key);
						}
						current_person.generate_chart(load['item']);
					break;
				} //switch	
				//Common responses
				if ('ReceivedFriendRequests' in data.response) {
					requests.load_received(data.response.ReceivedFriendRequests);
				} 
				if ('add_person' in data.response) {
					people.add(data.response.add_person.name, data.response.add_person.id, data.response.add_person.local);
					people.ui_listing();
				}
				if ('updates' in data.response) {
					$.each(data.response.updates, function( key, value ) {
						localStorage[key]=JSON.stringify(value);
					});
					//re-load as new data has arrived
					local_data.load();
					local_data.sort_all();					
				}
				if ('shouts' in data.response) {
					$.each(data.response.shouts, function( key, shout ) {
						current_person = new Person(shout.key);
						if (shout.type=="add"){
							current_person.item_increment(shout.item, shout.shout);
						} else {
							current_person.item_decrement(shout.item, shout.shout);
						}
					});					
				}
			} //data.error
			$.unblockUI();
		},'json').fail(function() { //function data and $.post
			switch (ucase) {
				case "feedback":
				case "IOU":
				case "update my details":
					alert(FAILING_TO_CONNECT);
				break
			} //switch
			$.unblockUI();
		}).always(function() {      // .fail

		});;	 					// .always
	}	
}

function generateGoogleIOUChart(_my_total, _your_total, _your_name, _div){
	var data_list = [];
	data_list.push(['Name', 'Total']);
	data_list.push([_your_name + ' (' + _your_total +')', _your_total]);
	data_list.push(['Me ('+_my_total+')', _my_total]);
	var data = google.visualization.arrayToDataTable(data_list);
	var options = {
      title: 'Karma',
      is3D: true,
      backgroundColor: '#f9f9f9',
    };
	var chart = new google.visualization.PieChart(document.getElementById(_div));
    chart.draw(data, options);
}

function generateList(_data, _ucase, _ul){
	me=0; you=0;
	$(_ul).empty();
	
	$.each(_data, function( key, value ) {
		//data
		switch (_ucase) {
			case "person":
				$(_ul).append("<li><a href=\"javascript:current_person.add_item('"
						+js_cln(value.item)+"');\">"+value.item+"<span class='ui-li-count'>"
						+value.totals.me+" / "+value.totals.you+"</span></a></li>");
				me=me+value.totals.me;
				you=you+value.totals.you;
			break
			case "item":
				$(_ul).append("<li><a href=\"javascript:load_fresh_shout('"
						+js_cln(value.val)+"');\">"+value.name+"<span class='ui-li-count'>"
						+value.totals.me+" / "+value.totals.you+"</span></a></li>");
				me=me+value.totals.me;
				you=you+value.totals.you;
			break		
			case "history":
				m_s = 'my shout';
				if (value.shout.my_shout==-1) m_s = current_person.name + " shout";
				if (value.shout.gl!='') {
					$(_ul).append("<li><a href=\"javascript:swap_to_map('"+value.shout.gl+"');\"><h2>"+value.shout.date+" (map)</h2>"+
							"<p>"+m_s+"</p></a><a href=\"javascript:delete_shout('"+value.shout.key+"',"+value.shout.my_shout+");\">delete</a></li>");					
				} else {
					$(_ul).append("<li><a href=\"javascript:void(0)\"><h2>"+value.shout.date+"</h2>"+
							"<p>"+m_s+"</p></a>" +
							"<a href=\"javascript:delete_shout('"+value.shout.key+"',"+value.shout.my_shout+");\">delete</a></li>");
				}
			break	
		}
	});		
	switch (_ucase) {
	//headers, footers and other data on the screen
		case "person":
			whos_shout="";
			if (me>you) whos_shout = current_person.name + " turn";
			if (me<you) whos_shout = "my turn";
			$("#person_item_comment").html(whos_shout);
			
			pre = "<li>Totals<span class='ui-li-count'>me ("+me+") / "+current_person.name +" ("+you+")</span></li>";
			$(_ul).append(pre); //footer
			$(_ul).prepend(pre); //header
			
		break
		case "item":
			whos_shout="";
			if (me>you) whos_shout = "their turn";
			if (me<you) whos_shout = "my turn";
			$("#person_item_comment").html(whos_shout);
			
			pre = "<li>Totals<span class='ui-li-count'>me ("+me+") / "+current_item +" ("+you+")</span></li>";
			$(_ul).append(pre); //footer
			$(_ul).prepend(pre); //header
		break			
	}
	refresh_ui_list(_ul);
}
function swap_to_map(latlng) {
	$('#map_heading').html(current_item + " with " + current_person.name);
	$.mobile.changePage("#map-page");	
	lat = parseFloat(latlng.split(",")[0]);
	long = parseFloat(latlng.split(",")[1]);
	drawMap(new google.maps.LatLng(lat, long));
}
function drawMap(latlng) {
    setTimeout(function() {
     var myOptions = {
             zoom:12,
             center: latlng,
             mapTypeId: google.maps.MapTypeId.ROADMAP
         };
         var map = new google.maps.Map(document.getElementById("map-canvas"), myOptions);
         // Add an overlay to the map of current lat/lng
         var marker = new google.maps.Marker({
             position: latlng,
             map: map,
             title: current_item + " with " + current_person.name,
         });       
 }, 500);
}
