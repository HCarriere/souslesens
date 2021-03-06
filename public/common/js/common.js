/*******************************************************************************
 * SOUSLESENS LICENSE************************
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 Claude Fauconnet claude.fauconnet@neuf.fr
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 ******************************************************************************/

var dataPath = "data";
var messageDivId = "stateDisplay";
var dbName;

var isIE8 = false;

var filter;
var filterValue;
var isRadarReadOnly = true;
var http = "";
var currentObject;
var currentObjectId;
var canModifyRadarDetails = false;
var rapahaelItemsSet;
var canModify = false;
var view = "home";

var password = "T0talr@d@r";
var authentify = false;
var identified = false;
var userRole = "all";
var userLogin = "anonymous";
var userName = "anonymous";
var user;

var maxTentatives = 5;
var nTentatives = 0;

var positionControMode = "CONFINED"; // alternatives CHANGE-ATTRS and
										// CONFINED see radarRaphael.js
var radarAxes = [];

var IEversion = getInternetExplorerVersion();
if (IEversion > 0) {
	if (IEversion < 8)
		alert("IE " + bowser.version + " is not suppoted by this application (min IE8 )");
}
if (IEversion <= 9)
	; // console.log("---browser------IE --" + IEversion);

/*
 * var version =parseFloat($.browser.version)
 * 
 * if ($.browser.msie && version<9){ alert("IE " + version + " is not suppoted
 * by this application (min IE9 )"); }
 */

var appname = window.navigator.appName;
var version = window.navigator.appVersion;

var queryParams = getQueryParams(document.location.search);
dbName = queryParams.dbName;

if (queryParams.canModify == "y") {
	
	
	
	  isRadarReadOnly = false; canModifyRadarDetails=true;
	 
}

if (queryParams.admin == "true") {
	var userRole = "admin";
	var userLogin = "CF";
	var userName = "CF";
	/*
	 * isRadarReadOnly = false; canModifyRadarDetails=true;
	 */
}
filter = queryParams.filter;
if (filter) {
	filterValue = queryParams.filterValue;
}
if (queryParams.view)
	view = queryParams.view;

function submitPassword(loginField, passwordField, dontFinish) {
	var password = $(passwordField).val();
	var login = $(loginField).val();
	user = proxy_tryLogin(dbName, login, password);
	userRole = user.role;
	userLogin = user.login;
	if (userRole && userRole != "none" && nTentatives < maxTentatives) {
		if (!dontFinish) {
			$("#loginDiv").css("visibility", "hidden");
			$("#popupMask").css("visibility", "hidden");
			identified = true;
			// Radar_loadRadar();
			initTabs();
		}
		return true;
	} else if (nTentatives++ < maxTentatives) {
		setMessage("invalid login password", "red");
	} else {
		nTentatives++;
		setMessage("too many tentatives, contact administrator", "red");
	}
	setMessage("", "green");
	return false;

}

function showChangePassWordDiv() {
	$("#changePaswordDiv").css("visibility", "visible");
	$("#changePaswordDiv").css("z-index", "top");

}

function changePassword() {

	if (submitPassword("#login2", "#passwordOld", true)) {
		var passwordNew1 = $("#passwordNew1").val();
		var passwordNew2 = $("#passwordNew2").val();
		if (passwordNew1 === "" || passwordNew1 !== passwordNew2) {
			setMessage("passwords does not match", "red");
			return;
		}
		user.password = passwordNew2;
		proxy_updateItem(dbName, "users", user);
		setMessage("password changed", "green");

	} else {

	}
	$("#changePaswordDiv").css("visibility", "hidden");

}

function getQueryParams(qs) {
	qs = qs.split("+").join(" ");

	var params = {}, tokens, re = /[?&]?([^=]+)=([^&]*)/g;

	while (tokens = re.exec(qs)) {
		params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
	}

	return params;
}

function isMultiValuedData(array, field, splitChar) {
	for (var i = 0; i < array.length; i++) {
		if (array[i][field] && ("" + array[i][field]).indexOf(splitChar) > -1)
			return true;
	}
	return false;
}

// si on dépasse maxVals on retourne un tableau vide
function getDistinctValues(array, field, splitChar, maxVals) {
	var distinctValues = new Array();
	for (var i = 0; i < array.length; i++) {
		var val = "" + array[i][field];

		if (val.indexOf(splitChar) > -1) { // gestion des chgamps multivalueé
											// séparés par splitChar
			var vals = val.split(splitChar);
			for (var j = 0; j < vals.length; j++) {
				if ($.inArray(vals[i], distinctValues) < 0) {
					distinctValues.push(vals[i]);
				}
			}
			continue;
		}

		if ($.inArray(val, distinctValues) < 0) {
			distinctValues.push(val);
		}

		if (maxVals && distinctValues.length > maxVals)
			return [];
	}
	return distinctValues.sort();

}

function getInputField(radarXmlUrl, key, val, isTextArea, className) {
	var enumX = [];
	var Xml_enumerations = radarXmls[currentRadarType].Xml_enumerations;
	if (!xmlDoc) {
		xmlDoc = getXmlDoc(radarXmlUrl);
		initEnumerations(xmlDoc);
	}
	for (var k = 0; k < Xml_enumerations.length; k++) {

		if (Xml_enumerations[k].fieldRealName == key)
			enumX.push(Xml_enumerations[k].label);
	}
	// var span = document.createElement("span");
	var field;

	if (key == "id") {
		field = document.createTextNode(val);
		var hiddenId = getInput("id", val, "hidden");
		span.appendChild(hiddenId);
	} else if (enumX && enumX.length > 0) {
		field = getSelect(key, enumX, val, null);
	} else if (isTextArea) {
		field = getTextArea(key, val, className);
	} else
		field = getInput(key, val);
	// span.appendChild(field);
	// span.setAttribute("class", "editFormInput");
	return field;

}

function getSelect(name, values, currentVal, callback) {
	if (!currentVal)
		currentVal = "";
	var select = document.createElement("SELECT");
	var id = "field#" + name;
	select.setAttribute("name", name);
	select.setAttribute("id", id);
	select.style.width = "400px";
	// select.style.width = "200px";
	for (i = 0; i < values.length; i++) {
		var value = values[i];
		var option = document.createElement("option");
		option.setAttribute("value", value);
		if (currentVal == value)
			option.setAttribute("selected", "selected");
		option.innerHTML = value;
		select.appendChild(option);
	}

	if (callback) {
		select.onchange = function(evt) {
			if (evt.target.selectedIndex > 0)
				callback(evt.target);
		}
	}
	return select;
}

function getInput(name, value, type) {
	if (!value)
		value = "";
	var input = document.createElement("INPUT");
	input.setAttribute("name", name);
	input.setAttribute("value", value);
	if (type)
		input.setAttribute("type", type);
	input.style.width = "400px";
	// input.style.width = "200px";
	return input;
}

function getTextArea(name, value, className) {
	if (!value)
		value = "";
	var input = document.createElement('TEXTAREA');

	input.setAttribute("name", name);
	input.setAttribute("id", name);
	input.className = className;

	valueElt = document.createTextNode(value);
	input.appendChild(valueElt);
	var rows = 3;
	if (value.length > 0)
		rows = Math.min((value.length / 30) + 3, 6);
	// input.setAttribute("rows", Math.round(rows,0));

	// input.setAttribute("cols", 40);
	// input.style.width = "400px";

	return input;
}

function getInternetExplorerVersion()
// Returns the version of Internet Explorer or a -1
// (indicating the use of another browser).
{
	var rv = -1; // Return value assumes failure.
	if (navigator.appName == 'Microsoft Internet Explorer') {
		var ua = navigator.userAgent;
		var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
		if (re.exec(ua) != null)
			rv = parseFloat(RegExp.$1);
	}
	return rv;
}

String.prototype.replaceAll = function(find, replace) {
	var str = this;
	return str.replace(new RegExp(find, 'g'), replace);
};

function setMessage(message, color) {
	var div=document.getElementById(messageDivId)
	if (!div) {
		 div=window.parent.document.getElementById(messageDivId)
	}
	if(!div){
		console.log("No div  with ID stateDisplay  to display messages");
		console.log(message);
		return;
	}
	div.innerHTML = message;
	if (!color)
		color = "black";
	div.style.color = color;
}

function isNumber(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

function getColors(startColor, endColor, steps) {
	var colors = [];
	var base = new KolorWheel(startColor);
	var target = base.abs(endColor, steps);
	var drawBox = function(color) {
		// return '<span class="box"
		// style="background-color:'+color+'"></span>';
		return color;
	};

	for (var n = 0; n < steps; n++) {
		colors.push(drawBox(target.get(n).getHex()));
	}
	;
	return colors;
}

function getSortOrderArray() {
	var sortOrder = [];
	sortOrder.push(radarXmls[currentRadarType].XML_getFieldForRole("label"));
	sortOrder.push(radarXmls[currentRadarType].XML_getFieldForRole("color"));
	sortOrder.push(radarXmls[currentRadarType].XML_getFieldForRole("horizontalAxis"));
	sortOrder.push(radarXmls[currentRadarType].XML_getFieldForRole("radialAxis"));
	sortOrder = sortOrder.concat(radarXmls[currentRadarType].Xml_getfilterNames());
	return sortOrder;
}

function cleanTextForJsonImport(text) {
	text = "" + text;
	// str=str.replace(/[^\x-\x1F]/g, " ");
	return text.replace(/%/g, "percent").replace(/\"/g, "").replace(/'/g, " ").replace(/\'/g, " ").replace(/&/g, "-").replace(/>/g, "").replace(/</g, "").replace(/\n/g, " ").replace(/\r/g, " ")
			.replace(/\t/g, " ");

}

function fillSelectOptionsWithStringArray(select, data) {
	select.options.length = 0;
	$.each(data, function(i, item) {
		$(select).append($('<option>', {
			value : item,
			text : item
		}));
	});
}
function fillSelectOptions(select, data, textfield, valueField) {
	select.options.length = 0;
	if (!textfield || !valueField) {
		fillSelectOptionsWithStringArray(select, data);
		return;
	}
	$.each(data, function(i, item) {
		$(select).append($('<option>', {
			text : item[textfield],
			value : item[valueField]
		}));
	});
}

function formatResultToCsv(result, sep) {
	if (!sep)
		sep = "\t";
	var header = "";
	var headerTab = [];
	var body = "";
	for (var i = 0; i < result.length; i++) {
		for ( var key in result[i]) {
			if ($.inArray(key, headerTab) < 0) {
				header += key + sep;
				headerTab.push(key);
			}
		}
	}
	
	
//	var regex = new RegExp("/[\n\r" + sep + "]/g");
	//var regex = new RegExp("/(\s\r\n|\n|\r\t" + sep + ")" +");
	
	var regex = new RegExp("/\n|\r|\t\|;|\s/");
	for (var i = 0; i < result.length; i++) {
		var line = result[i];
		for (var j = 0; j < headerTab.length; j++) {
			var str = line[headerTab[j]];
			if($.isArray(str)){
				body +=JSON.stringify(str)+ sep;
			}
			else if($.isPlainObject(str)){
				body +=JSON.stringify(str)+ sep;
			}
			else if($.isNumeric(str))
				body += str + sep;
			else if (str && str.length>0){
				str=str.replace(sep,". ");
				
				body += str.replace(/(\n|\r|\t\|;|\s|[\r\n]+)/, ".") + sep;
			}
			else
				body += "" + sep;
		}
		body += "\n";
	}

	body = header + "\n" + body;
	return body;
}