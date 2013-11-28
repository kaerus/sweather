//////////////////////////////////////////////////////////////////////////////////////////////////
// Sweather v1.0 Mac OS X dashboard widget 
// Created by anders@kaerus.org 2007-01-20
// Developed With Dashcode version 0.9 Beta
//
// This software is opensource and freeware, for non-commersial and private use only.
// Suggest changes or send contributions to the above email address.
// Many thanks to jschreiber.com for the weather icons.
//
// TODO: Add night icons
// TODO: Internationalization
// TODO: Include more areas
// TODO: Add support for multiple providers
/////////////////////////////////////////////////////////////////////////////////////////////////

function load()
{
	var widgetInstance;
	setupParts();	
	
	// get instance id
	widgetInstance = setInstance(1);
	document.getElementById("instance").innerText = widgetInstance;
}

function getPreference(key) {
	return widget.preferenceForKey(widget.identifier+":"+key);
}
function setPreference(value,key)
{
	return widget.setPreferenceForKey(value,widget.identifier+":"+key);
}

function setInstance(i)
{
	var key;
	
	key = widget.preferenceForKey(widget.identifier);

	if(!key) key = widget.identifier;
	else {
		if(i>0) widget.setPreferenceForKey(1,key);
		else if (i<0) widget.setPreferenceForKey(0,key);
	}
	
	return(key);
}

function remove()
{
	// your widget has just been removed from the layer
	// remove any preferences as needed
	setInstance(-1);
	//widget.setPreferenceForKey(null, createInstancePreferenceKey("areaID"));
}

function hide()
{
	// your widget has just been hidden stop any timers to
	// prevent cpu usage
}

function show()
{
	// your widget has just been shown.  restart any timers
	// and adjust your interface as needed
	show_weather();
	populate_selectors();
	setTimeout('show_weather',1800000);		
}

function showBack(event)
{
	// your widget needs to show the back
	
	var front = document.getElementById("front");
	var back = document.getElementById("back");

	if (window.widget)
		widget.prepareForTransition("ToBack");

	front.style.display="none";
	back.style.display="block";
	
	if (window.widget)
		setTimeout('widget.performTransition();', 0);
}

function showFront(event)
{
	// your widget needs to show the front
	var new_selection = document.getElementById("selector").options[document.getElementById("selector").selectedIndex].value;
	var old_selection = getPreference("areaId");
	if(new_selection != old_selection) {
		// save selection and refresh weather data
		setPreference(new_selection,"areaId");		
	    show_weather();
	}
		
	var front = document.getElementById("front");
	var back = document.getElementById("back");

	if (window.widget)
		widget.prepareForTransition("ToFront");

	front.style.display="block";
	back.style.display="none";
	
	if (window.widget)
		setTimeout('widget.performTransition();', 0);
	
}

if (window.widget)
{
	widget.onremove = remove;
	widget.onhide = hide;
	widget.onshow = show;
}

function SMHI_forecast(areaId) {
	var req = new XMLHttpRequest();
	var forecast_url = "http://www.smhi.se/natvaderDL/data/jsfiles/forecast_" + areaId +".js";
	var suntime_url = "http://www.smhi.se/natvaderDL/data/jsfiles/suntime_" + areaId + ".js";
	var SMHI_forecastdata = null;
	var SMHI_suntimedata = null;
	this.forecast = null;		
	
	// Grab the local weather forecast data from SMHI
	if(req) {
		req.open("GET", forecast_url, false);
		req.send("");
	}
	
	if(req.status == 200) {
	 SMHI_forecastdata = req.responseText;
	} else { 
		alert("Unable to fetch forecast data from SMHI:\n" + req.statusText); 
	}
	
	if(req) {
		req.open("GET", suntime_url, false);
		req.send("");
	}
	
	if(req.status == 200) {
	 SMHI_suntimedata = req.responseText;
	} else { 
		alert("Unable to fetch suntime data from SMHI:\n" + req.statusText); 
	}
	
	var nuvaderArr = new Array('-','-','-','-','-','-','-',0);
	var ortsNamn = "-";
	
	// TODO: eval is unreliable, create a parser. 
	if(SMHI_forecastdata) {
	   eval(SMHI_forecastdata);
	 } 
		// Example output
		//		valuesArray['22-active'] = 1;
		//		valuesArray['22-datum'] = '2007-01-23';
		//		valuesArray['22-vdag'] = '2';
		//		valuesArray['22-tidsteg'] = 'na';
		//		valuesArray['22-temp'] = -6;
		//		valuesArray['22-fukt'] = 82;
		//		valuesArray['22-vrikt'] = '8';
		//		valuesArray['22-vhast'] = 8;
		//		valuesArray['22-vmax'] = 7;
		//		valuesArray['22-vby'] = 8;
		//		valuesArray['22-nbd'] = 0;
		//		valuesArray['22-nbd_sno'] = 0;
		//		valuesArray['22-symbol'] = 6;
		//		var nuvaderArr = new Array('-1','2007-01-17','07:00:00','5','3','0','77','2');
	
	if(SMHI_suntimedata) {
		eval(SMHI_suntimedata);
	} 	
		// Example output
		// var soltiddataInfo = new Array('Botkyrka','59.15','17.87');
		// var soltidArray = new Array();
		// soltidArray[0] = new Array('2007-02-09','5','07:43','16:24');
		// soltidArray[1] = new Array('2007-02-10','6','07:40','16:27');
		// soltidArray[2] = new Array('2007-02-11','0','07:38','16:29');
		// soltidArray[3] = new Array('2007-02-12','1','07:35','16:32');
		// soltidArray[4] = new Array('2007-02-13','2','07:33','16:34');
		// soltidArray[5] = new Array('2007-02-14','3','07:30','16:37');
		  
	this.area = ortsNamn;
	this.direction = new Array('','↓','↙','←','↖','↑','↗','➔','↘');
	
	this.current = new forecast_data(new Array(1,nuvaderArr[1],0,nuvaderArr[2],
							nuvaderArr[0],nuvaderArr[6],nuvaderArr[3],
							nuvaderArr[4],0,0,nuvaderArr[5],0,nuvaderArr[7]));								
    this.forecast = new Array();
    
	var forecastData = new Array();
	var dataType = new Array();
	var index = 0;
	var entry;
	
	for(entry in valuesArray)
		{
			dataType = entry.split("-");	// separate dateType [xx-yy]
			if(dataType[0] != index) {
				this.forecast[index] = new forecast_data(forecastData);
				delete forecastData;
				forecastData = new Array();	
				index=dataType[0];
			}
				forecastData.push(valuesArray[entry]);	
		}
	this.forecast[index] = new forecast_data(forecastData);	
	
	var index = 0;
	this.suntime = new Array();
	
	for(entry in soltidArray) {
		this.suntime[index++] = new suntime_data(soltidArray[entry]);
	}		
}

function forecast_data(fcd)
{
		this.active = fcd[0];
		this.date = fcd[1];
		this.weekday = fcd[2];
		this.time = fcd[3];
		this.temp = fcd[4];
		this.humidity = fcd[5];
		this.wind_dir = fcd[6];
		this.wind = fcd[7];
		this.vmax = fcd[8];
		this.vby = fcd[9];
		this.precipitation = fcd[10];
		this.snow = fcd[11];
		this.icon = "Images/symbols/" + fcd[12] + ".png";			
}

function suntime_data(suntime) {
	this.date = suntime[0];
	this.weekday = suntime[1];
	this.sunrise = suntime[2];
	this.sunset = suntime[3];
}

function getForecastFromDate(forecast,fdate,fnum) {
		f = new Array();
		for(i in forecast) {
			if(forecast[i].date.value == fdate.value)
			{
				while(fnum--) {
					f.push(forecast[i++]);
				}
				return f;
			}
		}
		return f;		
}	

function getForecastForDay(forecast,fday) {
		var f = new Array();
		for(i in forecast) {
			if(forecast[i].weekday == fday)
			{
				f.push(forecast[i]);
			}
		}
		// return forecast from the middle of array when having multiple entries
		var p = parseInt(f.length/2);				
		return f[p];	
}	
 
function getSuntimeByDate(suntime,sdate) {
	for(i in suntime) {
		if( suntime[i].value == sdate.value ) {
			return suntime[i];
		}
	}
}
 
function show_weather() 
{
   //<script type="text/javascript" src="http://www.smhi.se/natvaderDL/data/jsfiles/satellit.js"></script> 
    //var weather = new Weather();	
	
	var areaId = getPreference("areaId");
	if(!areaId||areaId>10040000000) areaId = "10010201027";

	try {
		var weather = new SMHI_forecast(areaId);
	}	
	catch (er) {
			alert(er.name);			
	}
	
	// display current weather
	document.getElementById("topic").innerText = weather.area; 
    document.getElementById("temp").innerText = weather.current.temp + " °C";
	document.getElementById("time").innerText = weather.current.time;
	document.getElementById("humidity").innerText = weather.current.humidity + "%";
	document.getElementById("precipitation").innerText = weather.current.precipitation +" mm/h";
    document.getElementById("wind").innerText = weather.direction[weather.current.wind_dir]  + " " + weather.current.wind +" m/s";
	
	symbol = document.getElementById("img");
	symbol.src = weather.current.icon;
	
	// Get the 4 first entries from date and display forecasted weather 
    var forecast = getForecastFromDate(weather.forecast,weather.current.date,4);
	if(forecast && forecast.length>=4) {
		document.getElementById("td06").innerText = forecast[0].temp;
		document.getElementById("td12").innerText = forecast[1].temp;
		document.getElementById("td18").innerText = forecast[2].temp;
		document.getElementById("td24").innerText = forecast[3].temp;		
		document.getElementById("img20").src = forecast[0].icon;
		document.getElementById("img21").src = forecast[1].icon;
		document.getElementById("img22").src = forecast[2].icon;
		document.getElementById("img23").src = forecast[3].icon;	
	}
	
	forecast = getForecastForDay(weather.forecast,1);
	if(forecast) {
		document.getElementById("td1").innerText = forecast.temp;
		document.getElementById("img13").src = forecast.icon;
	}
	
	forecast = getForecastForDay(weather.forecast,2);
	if(forecast) {	
		document.getElementById("td2").innerText = forecast.temp;
		document.getElementById("img14").src = forecast.icon;
	}
	
	forecast = getForecastForDay(weather.forecast,3);
	if(forecast) {
		document.getElementById("td3").innerText = forecast.temp;
		document.getElementById("img15").src = forecast.icon;
	}
	
	forecast = getForecastForDay(weather.forecast,4);
	if(forecast) {
		document.getElementById("td4").innerText = forecast.temp;
		document.getElementById("img16").src = forecast.icon;
	}
	
	forecast = getForecastForDay(weather.forecast,5);
	if(forecast) {
		document.getElementById("td5").innerText = forecast.temp;
		document.getElementById("img17").src = forecast.icon;
	}
	
	forecast = getForecastForDay(weather.forecast,6);
	if(forecast) {
		document.getElementById("td6").innerText = forecast.temp;
		document.getElementById("img18").src = forecast.icon;
	}
	
	forecast = getForecastForDay(weather.forecast,0);
	if(forecast) {
		document.getElementById("td7").innerText = forecast.temp;
		document.getElementById("img19").src = forecast.icon;
	}
	
	var suntime = getSuntimeByDate(weather.suntime,weather.current.date);
	if(suntime) {
		document.getElementById("sunrisetime").innerText = suntime.sunrise;
		document.getElementById("sunsettime").innerText = suntime.sunset;		
	}
					
	do_refresh = false;
}

	
function Areas() {
nodeArray = new Array(776);
this.list = nodeArray;

  selectedNodeNum = 7;
  nodeArray[0]	= new Array("Världen", 1, "worldMap", "world.gif", "worldIconMap", null, [2,3,6,1,4,5]);
  nodeArray[1]	= new Array("Europa", 10, "europeMap", "europe.gif", "europeIconMap", [0], [19,12,15,10,11,9,13,14,16,17,18,8,21,22,23,24,25,20,26,27,7,28,29,30,31,32,33,34]);
  nodeArray[2]	= new Array("Afrika", 11, "africaMap", "africa.gif", null, [0], [747,748,749,750,751,752,753,754,755,756,757,758,759,760,761,762,763,764,765,766,767,768,769,770,771,772,773,774,775]);
  nodeArray[3]	= new Array("Asien", 12, "asiaMap", "asia.gif", null, [0], [711,712,713,714,715,716,717,718,719,720,721,722,723,724,725,726,727,728,729,730,731,732,733,734,735,736,737,738,746,739,740,741,742,743,744,745]);
  nodeArray[4]	= new Array("Nordamerika", 13, "northamericaMap", "northamerica.gif", null, [0], [657,681,682,683,684,685,686,687,688,689,690,691,692,693,694,695,696,697,698,699,700,701,702,703,710,704,705,706,707,708,709]);
  nodeArray[5]	= new Array("Sydamerika", 14, "southamericaMap", "southamerica.gif", null, [0], [658,659,660,661,662,663,664,665,666,667,668,669,670,671]);
  nodeArray[6]	= new Array("Australien", 15, "australiaMap", "australia.gif", null, [0], [672,673,674,675,676,677,678,679,680]);
  nodeArray[7]	= new Array("Sverige", 1001, "swedenMap", "sweden.gif", "swedenIconMap", [0,1], [35,39,40,38,37,36]);
  nodeArray[8]	= new Array("Norge", 1002, "norgeMap", "norge.gif", null, [0,1], [331,332,333,334,335,336,337,338,339,340,341]);
  nodeArray[9]	= new Array("Finland", 1003, "finlandMap", "finland.gif", null, [0,1], [343,344,345,346,347,348,349,350,351,352,353,354,355,356,357,358,359,374,360,361,362,363,364,365,366,367,368,369,370,371,372,373]);
  nodeArray[10]	= new Array("Bulgarien", 1005, "bulgarienMap", "bulgarien.gif", null, [0,1], [383,384,385,381,386,382]);
  nodeArray[11]	= new Array("Danmark", 1007, "danmarkMap", "danmark.gif", null, [0,1], [392,393,405,402,404,400,399,391,401,395,409,394,410,406,396,408,407,398,403,397]);
  nodeArray[12]	= new Array("Baltikum", 1008, "baltikumMap", "baltikum.gif", null, [0,1], [508,507,511,510,506,412,512,414,505,411,413,509]);
  nodeArray[13]	= new Array("Frankrike", 1010, "frankrikeMap", "frankrike.gif", null, [0,1], [415,416,422,417,424,418,425,429,428,423,431,432,426,419,420,433,430,427,421]);
  nodeArray[14]	= new Array("Grekland", 1011, "greklandMap", "grekland.gif", null, [0,1], [434,444,435,446,440,439,443,438,436,442,441,445,437]);
  nodeArray[15]	= new Array("Benelux", 1012, "beneluxMap", "benelux.gif", null, [0,1], [447,379,450,376,375,378,380,448,451,377,486,449]);
  nodeArray[16]	= new Array("Irland", 1013, "irlandMap", "irland.gif", null, [0,1], [453,452,454,455]);
  nodeArray[17]	= new Array("Island", 1014, "islandMap", "island.gif", null, [0,1], [458,459,457,456,460]);
  nodeArray[18]	= new Array("Italien", 1015, "italienMap", "italien.gif", null, [0,1], [471,481,461,472,473,462,463,474,475,464,465,466,467,476,477,478,468,469,479,480,470]);
  nodeArray[19]	= new Array("Balkan", 1016, "jugoslavienMap", "jugoslavien.gif", null, [0,1], [496,495,490,500,489,485,488,487,491,499,484,492,497,483,501,498,493,482,494]);
  nodeArray[20]	= new Array("Slovakien", 1018, "slovakienMap", "slovakien.gif", null, [0,1], [502,503,504]);
  nodeArray[21]	= new Array("Polen", 1020, "polenMap", "polen.gif", null, [0,1], [520,523,521,514,528,522,519,524,518,529,516,527,526,515,525,513,517]);
  nodeArray[22]	= new Array("Portugal", 1021, "portugalMap", "portugal.gif", null, [0,1], [535,536,537,538,530,531,534,532,533]);
  nodeArray[23]	= new Array("Rumänien", 1022, "romaniaMap", "romania.gif", null, [0,1], [540,539,542,541,543,544]);
  nodeArray[24]	= new Array("Ryssland", 1023, "rysslandMap", "ryssland.gif", null, [0,1], [545,553,546,548,551,547,549,552,550]);
  nodeArray[25]	= new Array("Schweiz", 1024, "schweizMap", "schweiz.gif", null, [0,1], [558,554,559,555,556,557]);
  nodeArray[26]	= new Array("Spanien", 1025, "spanienMap", "spanien.gif", null, [0,1], [578,560,580,561,572,579,577,569,571,570,568,562,563,564,565,573,581,566,567,576,574,575]);
  nodeArray[27]	= new Array("Storbritannien", 1026, "storbritannienMap", "storbritannien.gif", null, [0,1], [593,590,594,588,582,584,595,586,583,585,587,592,589,591]);
  nodeArray[28]	= new Array("Tjeckien", 1027, "tjeckienMap", "tjeckien.gif", null, [0,1], [598,599,597,596]);
  nodeArray[29]	= new Array("Turkiet", 1029, "turkietMap", "turkiet.gif", null, [0,1], [605,600,601,603,604,602,606,387,390,389,388,607]);
  nodeArray[30]	= new Array("Tyskland", 1030, "tysklandMap", "tyskland.gif", null, [0,1], [608,617,612,613,616,609,627,611,614,618,610,615,621,625,623,626,620,624,622,619]);
  nodeArray[31]	= new Array("Ukraina", 1031, "ukrainaMap", "ukraina.gif", null, [0,1], [630,631,629,632,628]);
  nodeArray[32]	= new Array("Ungern", 1032, "ungernMap", "ungern.gif", null, [0,1], [633,638,636,637,634,635,639]);
  nodeArray[33]	= new Array("Vitryssland", 1033, "belarusMap", "belarus.gif", null, [0,1], [642,641,645,640,643,644,646]);
  nodeArray[34]	= new Array("Österrike", 1034, "austriaMap", "austria.gif", null, [0,1], [647,656,654,648,649,655,653,650,651,652]);
  nodeArray[35]	= new Array("Götaland", 100101, "sweden_gotalandMap", "sweden_gotaland.gif", "sweden_gotalandIconMap", [0,1,7], [129,130,131,132,124,133,134,135,136,263,137,138,139,125,140,141,142,143,144,145,146,147,148,149,150,151,126,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,127,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,249,250,251,252,248,253,254,257,258,128,255,256,259,260,261,262]);
  nodeArray[36]	= new Array("Östra Svealand", 100102, "sweden_osvealandMap", "sweden_osvealand.gif", "sweden_osvealandIconMap", [0,1,7], [287,292,293,294,295,296,278,297,298,279,299,280,300,301,302,303,288,281,282,304,305,283,306,307,290,308,291,284,309,310,285,311,312,313,314,315,286,316,317,318,319,320,321,322,323,324,325,326,327,289,328,329,330]);
  nodeArray[37]	= new Array("Västra Svealand", 100103, "sweden_vsvealandMap", "sweden_vsvealand.gif", "sweden_vsvealandIconMap", [0,1,7], [66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,107,106,108]);
  nodeArray[38]	= new Array("Södra Norrland", 100104, "sweden_snorrlandMap", "sweden_snorrland.gif", "sweden_snorrlandIconMap", [0,1,7], [41,60,42,55,56,61,59,43,44,45,62,63,57,64,46,58,47,48,49,65,50,51,52,53,54]);
  nodeArray[39]	= new Array("Mellersta Norrland", 100105, "sweden_mnorrlandMap", "sweden_mnorrland.gif", "sweden_mnorrlandIconMap", [0,1,7], [109,110,111,112,113,114,115,116,117,118,119,120,121,122,123]);
  nodeArray[40]	= new Array("Norra Norrland", 100106, "sweden_nnorrlandMap", "sweden_nnorrland.gif", "sweden_nnorrlandIconMap", [0,1,7], [264,265,266,267,268,269,270,271,272,273,274,275,276,277]);
  
  
  nodeArray[41]	= new Array("Berg", 10010423026, null, null, null, [0,1,7,38], null);
  nodeArray[42]	= new Array("Bräcke", 10010423005, null, null, null, [0,1,7,38], null);
  nodeArray[43]	= new Array("Härnösand", 10010422080, null, null, null, [0,1,7,38], null);
  nodeArray[44]	= new Array("Kramfors", 10010422082, null, null, null, [0,1,7,38], null);
  nodeArray[45]	= new Array("Krokom", 10010423009, null, null, null, [0,1,7,38], null);
  nodeArray[46]	= new Array("Ragunda", 10010423003, null, null, null, [0,1,7,38], null);
  nodeArray[47]	= new Array("Sollefteå", 10010422083, null, null, null, [0,1,7,38], null);
  nodeArray[48]	= new Array("Strömsund", 10010423013, null, null, null, [0,1,7,38], null);
  nodeArray[49]	= new Array("Sundsvall", 10010422081, null, null, null, [0,1,7,38], null);
  nodeArray[50]	= new Array("Timrå", 10010422062, null, null, null, [0,1,7,38], null);
  nodeArray[51]	= new Array("Ånge", 10010422060, null, null, null, [0,1,7,38], null);
  nodeArray[52]	= new Array("Åre", 10010423021, null, null, null, [0,1,7,38], null);
  nodeArray[53]	= new Array("Örnsköldsvik", 10010422084, null, null, null, [0,1,7,38], null);
  nodeArray[54]	= new Array("Östersund", 10010423080, null, null, null, [0,1,7,38], null);
  nodeArray[55]	= new Array("Gävle", 10010421080, null, null, null, [0,1,7,38], null);
  nodeArray[56]	= new Array("Hofors", 10010421004, null, null, null, [0,1,7,38], null);
  nodeArray[57]	= new Array("Ockelbo", 10010421001, null, null, null, [0,1,7,38], null);
  nodeArray[58]	= new Array("Sandviken", 10010421081, null, null, null, [0,1,7,38], null);
  nodeArray[59]	= new Array("Härjedalen", 10010423061, null, null, null, [0,1,7,38], null);
  nodeArray[60]	= new Array("Bollnäs", 10010421083, null, null, null, [0,1,7,38], null);
  nodeArray[61]	= new Array("Hudiksvall", 10010421084, null, null, null, [0,1,7,38], null);
  nodeArray[62]	= new Array("Ljusdal", 10010421061, null, null, null, [0,1,7,38], null);
  nodeArray[63]	= new Array("Nordanstig", 10010421032, null, null, null, [0,1,7,38], null);
  nodeArray[64]	= new Array("Ovanåker", 10010421021, null, null, null, [0,1,7,38], null);
  nodeArray[65]	= new Array("Söderhamn", 10010421082, null, null, null, [0,1,7,38], null);
  nodeArray[66]	= new Array("Arvika", 10010317084, null, null, null, [0,1,7,37], null);
  nodeArray[67]	= new Array("Askersund", 10010318082, null, null, null, [0,1,7,37], null);
  nodeArray[68]	= new Array("Avesta", 10010320084, null, null, null, [0,1,7,37], null);
  nodeArray[69]	= new Array("Borlänge", 10010320081, null, null, null, [0,1,7,37], null);
  nodeArray[70]	= new Array("Degerfors", 10010318062, null, null, null, [0,1,7,37], null);
  nodeArray[71]	= new Array("Eda", 10010317030, null, null, null, [0,1,7,37], null);
  nodeArray[72]	= new Array("Falun", 10010320080, null, null, null, [0,1,7,37], null);
  nodeArray[73]	= new Array("Filipstad", 10010317082, null, null, null, [0,1,7,37], null);
  nodeArray[74]	= new Array("Forshaga", 10010317063, null, null, null, [0,1,7,37], null);
  nodeArray[75]	= new Array("Gagnef", 10010320026, null, null, null, [0,1,7,37], null);
  nodeArray[76]	= new Array("Grums", 10010317064, null, null, null, [0,1,7,37], null);
  nodeArray[77]	= new Array("Hagfors", 10010317083, null, null, null, [0,1,7,37], null);
  nodeArray[78]	= new Array("Hallsberg", 10010318061, null, null, null, [0,1,7,37], null);
  nodeArray[79]	= new Array("Hammarö", 10010317061, null, null, null, [0,1,7,37], null);
  nodeArray[80]	= new Array("Hedemora", 10010320083, null, null, null, [0,1,7,37], null);
  nodeArray[81]	= new Array("Hällefors", 10010318063, null, null, null, [0,1,7,37], null);
  nodeArray[82]	= new Array("Karlskoga", 10010318083, null, null, null, [0,1,7,37], null);
  nodeArray[83]	= new Array("Karlstad", 10010317080, null, null, null, [0,1,7,37], null);
  nodeArray[84]	= new Array("Kil", 10010317015, null, null, null, [0,1,7,37], null);
  nodeArray[85]	= new Array("Kristinehamn", 10010317081, null, null, null, [0,1,7,37], null);
  nodeArray[86]	= new Array("Kumla", 10010318081, null, null, null, [0,1,7,37], null);
  nodeArray[87]	= new Array("Laxå", 10010318060, null, null, null, [0,1,7,37], null);
  nodeArray[88]	= new Array("Lekeberg", 10010318014, null, null, null, [0,1,7,37], null);
  nodeArray[89]	= new Array("Leksand", 10010320029, null, null, null, [0,1,7,37], null);
  nodeArray[90]	= new Array("Lindesberg", 10010318085, null, null, null, [0,1,7,37], null);
  nodeArray[91]	= new Array("Ljusnarsberg", 10010318064, null, null, null, [0,1,7,37], null);
  nodeArray[92]	= new Array("Ludvika", 10010320085, null, null, null, [0,1,7,37], null);
  nodeArray[93]	= new Array("Malung", 10010320023, null, null, null, [0,1,7,37], null);
  nodeArray[94]	= new Array("Mora", 10010320062, null, null, null, [0,1,7,37], null);
  nodeArray[95]	= new Array("Munkfors", 10010317062, null, null, null, [0,1,7,37], null);
  nodeArray[96]	= new Array("Nora", 10010318084, null, null, null, [0,1,7,37], null);
  nodeArray[97]	= new Array("Orsa", 10010320034, null, null, null, [0,1,7,37], null);
  nodeArray[98]	= new Array("Rättvik", 10010320031, null, null, null, [0,1,7,37], null);
  nodeArray[99]	= new Array("Smedjebacken", 10010320061, null, null, null, [0,1,7,37], null);
  nodeArray[100]	= new Array("Storfors", 10010317060, null, null, null, [0,1,7,37], null);
  nodeArray[101]	= new Array("Sunne", 10010317066, null, null, null, [0,1,7,37], null);
  nodeArray[102]	= new Array("Säffle", 10010317085, null, null, null, [0,1,7,37], null);
  nodeArray[103]	= new Array("Säter", 10010320082, null, null, null, [0,1,7,37], null);
  nodeArray[104]	= new Array("Torsby", 10010317037, null, null, null, [0,1,7,37], null);
  nodeArray[105]	= new Array("Vansbro", 10010320021, null, null, null, [0,1,7,37], null);
  nodeArray[106]	= new Array("Årjäng", 10010317065, null, null, null, [0,1,7,37], null);
  nodeArray[107]	= new Array("Älvdalen", 10010320039, null, null, null, [0,1,7,37], null);
  nodeArray[108]	= new Array("Örebro", 10010318080, null, null, null, [0,1,7,37], null);
  nodeArray[109]	= new Array("Bjurholm", 10010524003, null, null, null, [0,1,7,39], null);
  nodeArray[110]	= new Array("Dorotea", 10010524025, null, null, null, [0,1,7,39], null);
  nodeArray[111]	= new Array("Lycksele", 10010524081, null, null, null, [0,1,7,39], null);
  nodeArray[112]	= new Array("Malå", 10010524018, null, null, null, [0,1,7,39], null);
  nodeArray[113]	= new Array("Nordmaling", 10010524001, null, null, null, [0,1,7,39], null);
  nodeArray[114]	= new Array("Norsjö", 10010524017, null, null, null, [0,1,7,39], null);
  nodeArray[115]	= new Array("Robertsfors", 10010524009, null, null, null, [0,1,7,39], null);
  nodeArray[116]	= new Array("Skellefteå", 10010524082, null, null, null, [0,1,7,39], null);
  nodeArray[117]	= new Array("Sorsele", 10010524022, null, null, null, [0,1,7,39], null);
  nodeArray[118]	= new Array("Storuman", 10010524021, null, null, null, [0,1,7,39], null);
  nodeArray[119]	= new Array("Umeå", 10010524080, null, null, null, [0,1,7,39], null);
  nodeArray[120]	= new Array("Vilhelmina", 10010524062, null, null, null, [0,1,7,39], null);
  nodeArray[121]	= new Array("Vindeln", 10010524004, null, null, null, [0,1,7,39], null);
  nodeArray[122]	= new Array("Vännäs", 10010524060, null, null, null, [0,1,7,39], null);
  nodeArray[123]	= new Array("Åsele", 10010524063, null, null, null, [0,1,7,39], null);
  nodeArray[124]	= new Array("Bengtsfors", 10010115060, null, null, null, [0,1,7,35], null);
  nodeArray[125]	= new Array("Dals-Ed", 10010115004, null, null, null, [0,1,7,35], null);
  nodeArray[126]	= new Array("Gullspång", 10010116043, null, null, null, [0,1,7,35], null);
  nodeArray[127]	= new Array("Mellerud", 10010115061, null, null, null, [0,1,7,35], null);
  nodeArray[128]	= new Array("Åmål", 10010115085, null, null, null, [0,1,7,35], null);
  nodeArray[129]	= new Array("Ale", 10010115021, null, null, null, [0,1,7,35], null);
  nodeArray[130]	= new Array("Alingsås", 10010115082, null, null, null, [0,1,7,35], null);
  nodeArray[131]	= new Array("Alvesta", 10010107064, null, null, null, [0,1,7,35], null);
  nodeArray[132]	= new Array("Aneby", 10010106004, null, null, null, [0,1,7,35], null);
  nodeArray[133]	= new Array("Bjuv", 10010112060, null, null, null, [0,1,7,35], null);
  nodeArray[134]	= new Array("Bollebygd", 10010114043, null, null, null, [0,1,7,35], null);
  nodeArray[135]	= new Array("Borgholm", 10010108085, null, null, null, [0,1,7,35], null);
  nodeArray[136]	= new Array("Borås", 10010115083, null, null, null, [0,1,7,35], null);
  nodeArray[137]	= new Array("Bromölla", 10010111062, null, null, null, [0,1,7,35], null);
  nodeArray[138]	= new Array("Burlöv", 10010112031, null, null, null, [0,1,7,35], null);
  nodeArray[139]	= new Array("Båstad", 10010111068, null, null, null, [0,1,7,35], null);
  nodeArray[140]	= new Array("Eksjö", 10010106086, null, null, null, [0,1,7,35], null);
  nodeArray[141]	= new Array("Emmaboda", 10010108062, null, null, null, [0,1,7,35], null);
  nodeArray[142]	= new Array("Eslöv", 10010112085, null, null, null, [0,1,7,35], null);
  nodeArray[143]	= new Array("Essunga", 10010116003, null, null, null, [0,1,7,35], null);
  nodeArray[144]	= new Array("Falkenberg", 10010113082, null, null, null, [0,1,7,35], null);
  nodeArray[145]	= new Array("Falköping", 10010116086, null, null, null, [0,1,7,35], null);
  nodeArray[146]	= new Array("Finspång", 10010105062, null, null, null, [0,1,7,35], null);
  nodeArray[147]	= new Array("Färgelanda", 10010115007, null, null, null, [0,1,7,35], null);
  nodeArray[148]	= new Array("Gislaved", 10010106062, null, null, null, [0,1,7,35], null);
  nodeArray[149]	= new Array("Gnosjö", 10010106017, null, null, null, [0,1,7,35], null);
  nodeArray[150]	= new Array("Gotland", 10010109080, null, null, null, [0,1,7,35], null);
  nodeArray[151]	= new Array("Grästorp", 10010116002, null, null, null, [0,1,7,35], null);
  nodeArray[152]	= new Array("Göteborg", 10010114080, null, null, null, [0,1,7,35], null);
  nodeArray[153]	= new Array("Götene", 10010116061, null, null, null, [0,1,7,35], null);
  nodeArray[154]	= new Array("Habo", 10010116023, null, null, null, [0,1,7,35], null);
  nodeArray[155]	= new Array("Halmstad", 10010113080, null, null, null, [0,1,7,35], null);
  nodeArray[156]	= new Array("Helsingborg", 10010112083, null, null, null, [0,1,7,35], null);
  nodeArray[157]	= new Array("Herrljunga", 10010115066, null, null, null, [0,1,7,35], null);
  nodeArray[158]	= new Array("Hjo", 10010116084, null, null, null, [0,1,7,35], null);
  nodeArray[159]	= new Array("Hultsfred", 10010108060, null, null, null, [0,1,7,35], null);
  nodeArray[160]	= new Array("Hylte", 10010113015, null, null, null, [0,1,7,35], null);
  nodeArray[161]	= new Array("Härryda", 10010114001, null, null, null, [0,1,7,35], null);
  nodeArray[162]	= new Array("Hässleholm", 10010111083, null, null, null, [0,1,7,35], null);
  nodeArray[163]	= new Array("Höganäs", 10010112084, null, null, null, [0,1,7,35], null);
  nodeArray[164]	= new Array("Högsby", 10010108021, null, null, null, [0,1,7,35], null);
  nodeArray[165]	= new Array("Hörby", 10010112066, null, null, null, [0,1,7,35], null);
  nodeArray[166]	= new Array("Höör", 10010112067, null, null, null, [0,1,7,35], null);
  nodeArray[167]	= new Array("Jönköping", 10010106080, null, null, null, [0,1,7,35], null);
  nodeArray[168]	= new Array("Kalmar", 10010108080, null, null, null, [0,1,7,35], null);
  nodeArray[169]	= new Array("Karlsborg", 10010116037, null, null, null, [0,1,7,35], null);
  nodeArray[170]	= new Array("Karlshamn", 10010110082, null, null, null, [0,1,7,35], null);
  nodeArray[171]	= new Array("Karlskrona", 10010110080, null, null, null, [0,1,7,35], null);
  nodeArray[172]	= new Array("Kinda", 10010105013, null, null, null, [0,1,7,35], null);
  nodeArray[173]	= new Array("Klippan", 10010111066, null, null, null, [0,1,7,35], null);
  nodeArray[174]	= new Array("Kristianstad", 10010111080, null, null, null, [0,1,7,35], null);
  nodeArray[175]	= new Array("Kungsbacka", 10010113084, null, null, null, [0,1,7,35], null);
  nodeArray[176]	= new Array("Kungälv", 10010114082, null, null, null, [0,1,7,35], null);
  nodeArray[177]	= new Array("Kävlinge", 10010112061, null, null, null, [0,1,7,35], null);
  nodeArray[178]	= new Array("Laholm", 10010113081, null, null, null, [0,1,7,35], null);
  nodeArray[179]	= new Array("Landskrona", 10010112082, null, null, null, [0,1,7,35], null);
  nodeArray[180]	= new Array("Lerum", 10010115024, null, null, null, [0,1,7,35], null);
  nodeArray[181]	= new Array("Lessebo", 10010107061, null, null, null, [0,1,7,35], null);
  nodeArray[182]	= new Array("Lidköping", 10010116081, null, null, null, [0,1,7,35], null);
  nodeArray[183]	= new Array("Lilla Edet", 10010115062, null, null, null, [0,1,7,35], null);
  nodeArray[184]	= new Array("Linköping", 10010105080, null, null, null, [0,1,7,35], null);
  nodeArray[185]	= new Array("Ljungby", 10010107081, null, null, null, [0,1,7,35], null);
  nodeArray[186]	= new Array("Lomma", 10010112062, null, null, null, [0,1,7,35], null);
  nodeArray[187]	= new Array("Lund", 10010112081, null, null, null, [0,1,7,35], null);
  nodeArray[188]	= new Array("Lysekil", 10010114084, null, null, null, [0,1,7,35], null);
  nodeArray[189]	= new Array("Malmö", 10010112080, null, null, null, [0,1,7,35], null);
  nodeArray[190]	= new Array("Mariestad", 10010116080, null, null, null, [0,1,7,35], null);
  nodeArray[191]	= new Array("Mark", 10010115063, null, null, null, [0,1,7,35], null);
  nodeArray[192]	= new Array("Markaryd", 10010107067, null, null, null, [0,1,7,35], null);
  nodeArray[193]	= new Array("Mjölby", 10010105086, null, null, null, [0,1,7,35], null);
  nodeArray[194]	= new Array("Motala", 10010105083, null, null, null, [0,1,7,35], null);
  nodeArray[195]	= new Array("Mullsjö", 10010116022, null, null, null, [0,1,7,35], null);
  nodeArray[196]	= new Array("Munkedal", 10010114030, null, null, null, [0,1,7,35], null);
  nodeArray[197]	= new Array("Mölndal", 10010114081, null, null, null, [0,1,7,35], null);
  nodeArray[198]	= new Array("Mönsterås", 10010108061, null, null, null, [0,1,7,35], null);
  nodeArray[199]	= new Array("Mörbylånga", 10010108040, null, null, null, [0,1,7,35], null);
  nodeArray[200]	= new Array("Norrköping", 10010105081, null, null, null, [0,1,7,35], null);
  nodeArray[201]	= new Array("Nybro", 10010108081, null, null, null, [0,1,7,35], null);
  nodeArray[202]	= new Array("Nässjö", 10010106082, null, null, null, [0,1,7,35], null);
  nodeArray[203]	= new Array("Olofström", 10010110060, null, null, null, [0,1,7,35], null);
  nodeArray[204]	= new Array("Orust", 10010114021, null, null, null, [0,1,7,35], null);
  nodeArray[205]	= new Array("Osby", 10010111063, null, null, null, [0,1,7,35], null);
  nodeArray[206]	= new Array("Oskarshamn", 10010108082, null, null, null, [0,1,7,35], null);
  nodeArray[207]	= new Array("Partille", 10010114002, null, null, null, [0,1,7,35], null);
  nodeArray[208]	= new Array("Perstorp", 10010111065, null, null, null, [0,1,7,35], null);
  nodeArray[209]	= new Array("Ronneby", 10010110081, null, null, null, [0,1,7,35], null);
  nodeArray[210]	= new Array("Simrishamn", 10010111081, null, null, null, [0,1,7,35], null);
  nodeArray[211]	= new Array("Sjöbo", 10010112065, null, null, null, [0,1,7,35], null);
  nodeArray[212]	= new Array("Skara", 10010116082, null, null, null, [0,1,7,35], null);
  nodeArray[213]	= new Array("Skurup", 10010112064, null, null, null, [0,1,7,35], null);
  nodeArray[214]	= new Array("Skövde", 10010116083, null, null, null, [0,1,7,35], null);
  nodeArray[215]	= new Array("Sotenäs", 10010114027, null, null, null, [0,1,7,35], null);
  nodeArray[216]	= new Array("Staffanstorp", 10010112030, null, null, null, [0,1,7,35], null);
  nodeArray[217]	= new Array("Stenungsund", 10010114015, null, null, null, [0,1,7,35], null);
  nodeArray[218]	= new Array("Strömstad", 10010114086, null, null, null, [0,1,7,35], null);
  nodeArray[219]	= new Array("Svalöv", 10010112014, null, null, null, [0,1,7,35], null);
  nodeArray[220]	= new Array("Svedala", 10010112063, null, null, null, [0,1,7,35], null);
  nodeArray[221]	= new Array("Svenljunga", 10010115065, null, null, null, [0,1,7,35], null);
  nodeArray[222]	= new Array("Sävsjö", 10010106084, null, null, null, [0,1,7,35], null);
  nodeArray[223]	= new Array("Söderköping", 10010105082, null, null, null, [0,1,7,35], null);
  nodeArray[224]	= new Array("Sölvesborg", 10010110083, null, null, null, [0,1,7,35], null);
  nodeArray[225]	= new Array("Tanum", 10010114035, null, null, null, [0,1,7,35], null);
  nodeArray[226]	= new Array("Tibro", 10010116062, null, null, null, [0,1,7,35], null);
  nodeArray[227]	= new Array("Tidaholm", 10010116085, null, null, null, [0,1,7,35], null);
  nodeArray[228]	= new Array("Tingsryd", 10010107063, null, null, null, [0,1,7,35], null);
  nodeArray[229]	= new Array("Tjörn", 10010114019, null, null, null, [0,1,7,35], null);
  nodeArray[230]	= new Array("Tomelilla", 10010111060, null, null, null, [0,1,7,35], null);
  nodeArray[231]	= new Array("Torsås", 10010108034, null, null, null, [0,1,7,35], null);
  nodeArray[232]	= new Array("Tranemo", 10010115052, null, null, null, [0,1,7,35], null);
  nodeArray[233]	= new Array("Tranås", 10010106087, null, null, null, [0,1,7,35], null);
  nodeArray[234]	= new Array("Trelleborg", 10010112087, null, null, null, [0,1,7,35], null);
  nodeArray[235]	= new Array("Trollhättan", 10010115081, null, null, null, [0,1,7,35], null);
  nodeArray[236]	= new Array("Töreboda", 10010116063, null, null, null, [0,1,7,35], null);
  nodeArray[237]	= new Array("Uddevalla", 10010114085, null, null, null, [0,1,7,35], null);
  nodeArray[238]	= new Array("Ulricehamn", 10010115084, null, null, null, [0,1,7,35], null);
  nodeArray[239]	= new Array("Uppvidinge", 10010107060, null, null, null, [0,1,7,35], null);
  nodeArray[240]	= new Array("Vadstena", 10010105084, null, null, null, [0,1,7,35], null);
  nodeArray[241]	= new Array("Vaggeryd", 10010106065, null, null, null, [0,1,7,35], null);
  nodeArray[242]	= new Array("Valdemarsvik", 10010105063, null, null, null, [0,1,7,35], null);
  nodeArray[243]	= new Array("Vara", 10010116060, null, null, null, [0,1,7,35], null);
  nodeArray[244]	= new Array("Varberg", 10010113083, null, null, null, [0,1,7,35], null);
  nodeArray[245]	= new Array("Vellinge", 10010112033, null, null, null, [0,1,7,35], null);
  nodeArray[246]	= new Array("Vetlanda", 10010106085, null, null, null, [0,1,7,35], null);
  nodeArray[247]	= new Array("Vimmerby", 10010108084, null, null, null, [0,1,7,35], null);
  nodeArray[248]	= new Array("Vårgårda", 10010115027, null, null, null, [0,1,7,35], null);
  nodeArray[249]	= new Array("Vänersborg", 10010115080, null, null, null, [0,1,7,35], null);
  nodeArray[250]	= new Array("Värnamo", 10010106083, null, null, null, [0,1,7,35], null);
  nodeArray[251]	= new Array("Västervik", 10010108083, null, null, null, [0,1,7,35], null);
  nodeArray[252]	= new Array("Växjö", 10010107080, null, null, null, [0,1,7,35], null);
  nodeArray[253]	= new Array("Ydre", 10010105012, null, null, null, [0,1,7,35], null);
  nodeArray[254]	= new Array("Ystad", 10010112086, null, null, null, [0,1,7,35], null);
  nodeArray[255]	= new Array("Åstorp", 10010111067, null, null, null, [0,1,7,35], null);
  nodeArray[256]	= new Array("Åtvidaberg", 10010105061, null, null, null, [0,1,7,35], null);
  nodeArray[257]	= new Array("Älmhult", 10010107065, null, null, null, [0,1,7,35], null);
  nodeArray[258]	= new Array("Ängelholm", 10010111082, null, null, null, [0,1,7,35], null);
  nodeArray[259]	= new Array("Öckerö", 10010114007, null, null, null, [0,1,7,35], null);
  nodeArray[260]	= new Array("Ödeshög", 10010105009, null, null, null, [0,1,7,35], null);
  nodeArray[261]	= new Array("Örkelljunga", 10010111037, null, null, null, [0,1,7,35], null);
  nodeArray[262]	= new Array("Östra Göinge", 10010111021, null, null, null, [0,1,7,35], null);
  nodeArray[263]	= new Array("Boxholm", 10010105060, null, null, null, [0,1,7,35], null);
  nodeArray[264]	= new Array("Arjeplog", 10010625006, null, null, null, [0,1,7,40], null);
  nodeArray[265]	= new Array("Arvidsjaur", 10010625005, null, null, null, [0,1,7,40], null);
  nodeArray[266]	= new Array("Boden", 10010625082, null, null, null, [0,1,7,40], null);
  nodeArray[267]	= new Array("Gällivare", 10010625023, null, null, null, [0,1,7,40], null);
  nodeArray[268]	= new Array("Haparanda", 10010625083, null, null, null, [0,1,7,40], null);
  nodeArray[269]	= new Array("Jokkmokk", 10010625010, null, null, null, [0,1,7,40], null);
  nodeArray[270]	= new Array("Kalix", 10010625014, null, null, null, [0,1,7,40], null);
  nodeArray[271]	= new Array("Kiruna", 10010625084, null, null, null, [0,1,7,40], null);
  nodeArray[272]	= new Array("Luleå", 10010625080, null, null, null, [0,1,7,40], null);
  nodeArray[273]	= new Array("Pajala", 10010625021, null, null, null, [0,1,7,40], null);
  nodeArray[274]	= new Array("Piteå", 10010625081, null, null, null, [0,1,7,40], null);
  nodeArray[275]	= new Array("Älvsbyn", 10010625060, null, null, null, [0,1,7,40], null);
  nodeArray[276]	= new Array("Överkalix", 10010625013, null, null, null, [0,1,7,40], null);
  nodeArray[277]	= new Array("Övertorneå", 10010625018, null, null, null, [0,1,7,40], null);
  nodeArray[278]	= new Array("Fagersta", 10010219082, null, null, null, [0,1,7,36], null);
  nodeArray[279]	= new Array("Hallstahammar", 10010219061, null, null, null, [0,1,7,36], null);
  nodeArray[280]	= new Array("Heby", 10010219017, null, null, null, [0,1,7,36], null);
  nodeArray[281]	= new Array("Kungsör", 10010219060, null, null, null, [0,1,7,36], null);
  nodeArray[282]	= new Array("Köping", 10010219083, null, null, null, [0,1,7,36], null);
  nodeArray[283]	= new Array("Norberg", 10010219062, null, null, null, [0,1,7,36], null);
  nodeArray[284]	= new Array("Sala", 10010219081, null, null, null, [0,1,7,36], null);
  nodeArray[285]	= new Array("Skinnskatteberg", 10010219004, null, null, null, [0,1,7,36], null);
  nodeArray[286]	= new Array("Surahammar", 10010219007, null, null, null, [0,1,7,36], null);
  nodeArray[287]	= new Array("Arboga", 10010219084, null, null, null, [0,1,7,36], null);
  nodeArray[288]	= new Array("Knivsta", 10010203083, null, null, null, [0,1,7,36], null);
  nodeArray[289]	= new Array("Västerås", 10010219080, null, null, null, [0,1,7,36], null);
  nodeArray[290]	= new Array("Nyköping", 10010204080, null, null, null, [0,1,7,36], null);
  nodeArray[291]	= new Array("Oxelösund", 10010204081, null, null, null, [0,1,7,36], null);
  nodeArray[292]	= new Array("Botkyrka", 10010201027, null, null, null, [0,1,7,36], null);
  nodeArray[293]	= new Array("Danderyd", 10010201062, null, null, null, [0,1,7,36], null);
  nodeArray[294]	= new Array("Ekerö", 10010201025, null, null, null, [0,1,7,36], null);
  nodeArray[295]	= new Array("Enköping", 10010203081, null, null, null, [0,1,7,36], null);
  nodeArray[296]	= new Array("Eskilstuna", 10010204084, null, null, null, [0,1,7,36], null);
  nodeArray[297]	= new Array("Flen", 10010204082, null, null, null, [0,1,7,36], null);
  nodeArray[298]	= new Array("Gnesta", 10010204061, null, null, null, [0,1,7,36], null);
  nodeArray[299]	= new Array("Haninge", 10010201036, null, null, null, [0,1,7,36], null);
  nodeArray[300]	= new Array("Huddinge", 10010201026, null, null, null, [0,1,7,36], null);
  nodeArray[301]	= new Array("Håbo", 10010203005, null, null, null, [0,1,7,36], null);
  nodeArray[302]	= new Array("Järfälla", 10010201023, null, null, null, [0,1,7,36], null);
  nodeArray[303]	= new Array("Katrineholm", 10010204083, null, null, null, [0,1,7,36], null);
  nodeArray[304]	= new Array("Lidingö", 10010201086, null, null, null, [0,1,7,36], null);
  nodeArray[305]	= new Array("Nacka", 10010201082, null, null, null, [0,1,7,36], null);
  nodeArray[306]	= new Array("Norrtälje", 10010201088, null, null, null, [0,1,7,36], null);
  nodeArray[307]	= new Array("Nykvarn", 10010201040, null, null, null, [0,1,7,36], null);
  nodeArray[308]	= new Array("Nynäshamn", 10010201092, null, null, null, [0,1,7,36], null);
  nodeArray[309]	= new Array("Salem", 10010201028, null, null, null, [0,1,7,36], null);
  nodeArray[310]	= new Array("Sigtuna", 10010201091, null, null, null, [0,1,7,36], null);
  nodeArray[311]	= new Array("Sollentuna", 10010201063, null, null, null, [0,1,7,36], null);
  nodeArray[312]	= new Array("Solna", 10010201084, null, null, null, [0,1,7,36], null);
  nodeArray[313]	= new Array("Stockholm", 10010201080, null, null, null, [0,1,7,36], null);
  nodeArray[314]	= new Array("Strängnäs", 10010204086, null, null, null, [0,1,7,36], null);
  nodeArray[315]	= new Array("Sundbyberg", 10010201083, null, null, null, [0,1,7,36], null);
  nodeArray[316]	= new Array("Södertälje", 10010201081, null, null, null, [0,1,7,36], null);
  nodeArray[317]	= new Array("Tierp", 10010203060, null, null, null, [0,1,7,36], null);
  nodeArray[318]	= new Array("Trosa", 10010204088, null, null, null, [0,1,7,36], null);
  nodeArray[319]	= new Array("Tyresö", 10010201038, null, null, null, [0,1,7,36], null);
  nodeArray[320]	= new Array("Täby", 10010201060, null, null, null, [0,1,7,36], null);
  nodeArray[321]	= new Array("Upplands-Bro", 10010201039, null, null, null, [0,1,7,36], null);
  nodeArray[322]	= new Array("Upplands-Väsby", 10010201014, null, null, null, [0,1,7,36], null);
  nodeArray[323]	= new Array("Uppsala", 10010203080, null, null, null, [0,1,7,36], null);
  nodeArray[324]	= new Array("Vallentuna", 10010201015, null, null, null, [0,1,7,36], null);
  nodeArray[325]	= new Array("Vaxholm", 10010201087, null, null, null, [0,1,7,36], null);
  nodeArray[326]	= new Array("Vingåker", 10010204028, null, null, null, [0,1,7,36], null);
  nodeArray[327]	= new Array("Värmdö", 10010201020, null, null, null, [0,1,7,36], null);
  nodeArray[328]	= new Array("Älvkarleby", 10010203019, null, null, null, [0,1,7,36], null);
  nodeArray[329]	= new Array("Österåker", 10010201017, null, null, null, [0,1,7,36], null);
  nodeArray[330]	= new Array("Östhammar", 10010203082, null, null, null, [0,1,7,36], null);
  nodeArray[331]	= new Array("Bergen", 10020212004, null, null, null, [0,1,8], null);
  nodeArray[332]	= new Array("Bodø", 10020218006, null, null, null, [0,1,8], null);
  nodeArray[333]	= new Array("Geilo", 10020206007, null, null, null, [0,1,8], null);
  nodeArray[334]	= new Array("Kirkenes", 10020220016, null, null, null, [0,1,8], null);
  nodeArray[335]	= new Array("Lillehammer", 10020205008, null, null, null, [0,1,8], null);
  nodeArray[336]	= new Array("Oslo", 10020203001, null, null, null, [0,1,8], null);
  nodeArray[337]	= new Array("Stavanger", 10020211020, null, null, null, [0,1,8], null);
  nodeArray[338]	= new Array("Tromsø", 10020219025, null, null, null, [0,1,8], null);
  nodeArray[339]	= new Array("Trondheim", 10020216022, null, null, null, [0,1,8], null);
  nodeArray[340]	= new Array("Trysil", 10020204018, null, null, null, [0,1,8], null);
  nodeArray[341]	= new Array("Ålesund", 10020215036, null, null, null, [0,1,8], null);
  nodeArray[342]	= new Array("Nordkap", 10020220014, null, null, null, null, null);
  nodeArray[343]	= new Array("Björneborg", 10030403031, null, null, null, [0,1,9], null);
  nodeArray[344]	= new Array("Helsingfors", 10030404018, null, null, null, [0,1,9], null);
  nodeArray[345]	= new Array("Tavastehus", 10030404004, null, null, null, [0,1,9], null);
  nodeArray[346]	= new Array("Ilomantsi", 10030405023, null, null, null, [0,1,9], null);
  nodeArray[347]	= new Array("Jakobstad", 10030403003, null, null, null, [0,1,9], null);
  nodeArray[348]	= new Array("Joensuu", 10030405013, null, null, null, [0,1,9], null);
  nodeArray[349]	= new Array("Jokioinen", 10030404051, null, null, null, [0,1,9], null);
  nodeArray[350]	= new Array("Jyväskylä", 10030403022, null, null, null, [0,1,9], null);
  nodeArray[351]	= new Array("Kajana", 10030402008, null, null, null, [0,1,9], null);
  nodeArray[352]	= new Array("Kauhava", 10030403006, null, null, null, [0,1,9], null);
  nodeArray[353]	= new Array("Kemi", 10030401008, null, null, null, [0,1,9], null);
  nodeArray[354]	= new Array("Kilpisjärvi", 10030401002, null, null, null, [0,1,9], null);
  nodeArray[355]	= new Array("Kittilä", 10030401003, null, null, null, [0,1,9], null);
  nodeArray[356]	= new Array("Kotka", 10030404022, null, null, null, [0,1,9], null);
  nodeArray[357]	= new Array("Kuopio", 10030405007, null, null, null, [0,1,9], null);
  nodeArray[358]	= new Array("Kuusamo", 10030402021, null, null, null, [0,1,9], null);
  nodeArray[359]	= new Array("Lahtis", 10030404005, null, null, null, [0,1,9], null);
  nodeArray[360]	= new Array("St Michel", 10030405002, null, null, null, [0,1,9], null);
  nodeArray[361]	= new Array("Muonio", 10030401011, null, null, null, [0,1,9], null);
  nodeArray[362]	= new Array("Nivala", 10030402005, null, null, null, [0,1,9], null);
  nodeArray[363]	= new Array("Pello", 10030401013, null, null, null, [0,1,9], null);
  nodeArray[364]	= new Array("Pudasjärvi", 10030402031, null, null, null, [0,1,9], null);
  nodeArray[365]	= new Array("Rovaniemi", 10030401006, null, null, null, [0,1,9], null);
  nodeArray[366]	= new Array("Salla", 10030401017, null, null, null, [0,1,9], null);
  nodeArray[367]	= new Array("Nyslott", 10030405003, null, null, null, [0,1,9], null);
  nodeArray[368]	= new Array("Sodankylä", 10030401004, null, null, null, [0,1,9], null);
  nodeArray[369]	= new Array("Suomussalmi", 10030402044, null, null, null, [0,1,9], null);
  nodeArray[370]	= new Array("Tammerfors", 10030403025, null, null, null, [0,1,9], null);
  nodeArray[371]	= new Array("Uleåborg", 10030402001, null, null, null, [0,1,9], null);
  nodeArray[372]	= new Array("Vasa", 10030403005, null, null, null, [0,1,9], null);
  nodeArray[373]	= new Array("Åbo", 10030403043, null, null, null, [0,1,9], null);
  nodeArray[374]	= new Array("Mariehamn", 10030404001, null, null, null, [0,1,9], null);
  nodeArray[375]	= new Array("Bryssel", 10040620001, null, null, null, [0,1,15], null);
  nodeArray[376]	= new Array("Brugge", 10120621001, null, null, null, [0,1,15], null);
  nodeArray[377]	= new Array("Liege", 10120626001, null, null, null, [0,1,15], null);
  nodeArray[378]	= new Array("Charleroi", 10120623001, null, null, null, [0,1,15], null);
  nodeArray[379]	= new Array("Antwerpen", 10120628001, null, null, null, [0,1,15], null);
  nodeArray[380]	= new Array("Gent", 10120622001, null, null, null, [0,1,15], null);
  nodeArray[381]	= new Array("Sofia", 10054401001, null, null, null, [0,1,10], null);
  nodeArray[382]	= new Array("Varna", 10054401009, null, null, null, [0,1,10], null);
  nodeArray[383]	= new Array("Burgas", 10054401003, null, null, null, [0,1,10], null);
  nodeArray[384]	= new Array("Plovdiv", 10054401007, null, null, null, [0,1,10], null);
  nodeArray[385]	= new Array("Ruse", 10054401015, null, null, null, [0,1,10], null);
  nodeArray[386]	= new Array("Stara Zagora", 10054401017, null, null, null, [0,1,10], null);
  nodeArray[387]	= new Array("Larnaca", 10062001208, null, null, null, [0,1,29], null);
  nodeArray[388]	= new Array("Paphos", 10062001770, null, null, null, [0,1,29], null);
  nodeArray[389]	= new Array("Nicosia", 10062001286, null, null, null, [0,1,29], null);
  nodeArray[390]	= new Array("Limassol", 10062001771, null, null, null, [0,1,29], null);
  nodeArray[391]	= new Array("Köpenhamn", 10072001204, null, null, null, [0,1,11], null);
  nodeArray[392]	= new Array("Aalborg", 10070301002, null, null, null, [0,1,11], null);
  nodeArray[393]	= new Array("Esbjerg", 10070304006, null, null, null, [0,1,11], null);
  nodeArray[394]	= new Array("Odense", 10070308019, null, null, null, [0,1,11], null);
  nodeArray[395]	= new Array("Nyköbing", 10070310011, null, null, null, [0,1,11], null);
  nodeArray[396]	= new Array("Skagen", 10070301025, null, null, null, [0,1,11], null);
  nodeArray[397]	= new Array("Århus", 10070307026, null, null, null, [0,1,11], null);
  nodeArray[398]	= new Array("Thisted", 10070302015, null, null, null, [0,1,11], null);
  nodeArray[399]	= new Array("Kolding", 10070306011, null, null, null, [0,1,11], null);
  nodeArray[400]	= new Array("Kalundborg", 10070309012, null, null, null, [0,1,11], null);
  nodeArray[401]	= new Array("Nakskov", 10070310010, null, null, null, [0,1,11], null);
  nodeArray[402]	= new Array("Holbæk", 10070309008, null, null, null, [0,1,11], null);
  nodeArray[403]	= new Array("Viborg", 10070302017, null, null, null, [0,1,11], null);
  nodeArray[404]	= new Array("Holstebro", 10070303007, null, null, null, [0,1,11], null);
  nodeArray[405]	= new Array("Herning", 10070303005, null, null, null, [0,1,11], null);
  nodeArray[406]	= new Array("Silkeborg", 10070307022, null, null, null, [0,1,11], null);
  nodeArray[407]	= new Array("Sønderborg", 10070305020, null, null, null, [0,1,11], null);
  nodeArray[408]	= new Array("Svendborg", 10070308024, null, null, null, [0,1,11], null);
  nodeArray[409]	= new Array("Næstved", 10070310009, null, null, null, [0,1,11], null);
  nodeArray[410]	= new Array("Rønne", 10070314005, null, null, null, [0,1,11], null);
  
  nodeArray[411]	= new Array("Tallinn", 10081101013, null, null, null, [0,1,12], null);
  nodeArray[412]	= new Array("Narva", 10081101005, null, null, null, [0,1,12], null);
  nodeArray[413]	= new Array("Tartu", 10081101014, null, null, null, [0,1,12], null);
  nodeArray[414]	= new Array("Pärnu", 10081101009, null, null, null, [0,1,12], null);
  nodeArray[415]	= new Array("Biarritz", 10102001481, null, null, null, [0,1,13], null);
  nodeArray[416]	= new Array("Bordeaux", 10102001054, null, null, null, [0,1,13], null);
  nodeArray[417]	= new Array("Chamonix", 10100801111, null, null, null, [0,1,13], null);
  nodeArray[418]	= new Array("Korsika", 10102001009, null, null, null, [0,1,13], null);
  nodeArray[419]	= new Array("Nice", 10100801040, null, null, null, [0,1,13], null);
  nodeArray[420]	= new Array("Paris", 10100801049, null, null, null, [0,1,13], null);
  nodeArray[421]	= new Array("Val d'Isere", 10100801130, null, null, null, [0,1,13], null);
  nodeArray[422]	= new Array("Brest", 10100801013, null, null, null, [0,1,13], null);
  nodeArray[423]	= new Array("Lyon", 10100801106, null, null, null, [0,1,13], null);
  nodeArray[424]	= new Array("Dijon", 10100801034, null, null, null, [0,1,13], null);
  nodeArray[425]	= new Array("Le Havre", 10100801141, null, null, null, [0,1,13], null);
  nodeArray[426]	= new Array("Nantes", 10100801015, null, null, null, [0,1,13], null);
  nodeArray[427]	= new Array("Toulouse", 10100801142, null, null, null, [0,1,13], null);
  nodeArray[428]	= new Array("Limoges", 10100801143, null, null, null, [0,1,13], null);
  nodeArray[429]	= new Array("Le Mans", 10100801144, null, null, null, [0,1,13], null);
  nodeArray[430]	= new Array("Strasbourg", 10100801145, null, null, null, [0,1,13], null);
  nodeArray[431]	= new Array("Marseille", 10100801140, null, null, null, [0,1,13], null);
  nodeArray[432]	= new Array("Montpellier", 10100801147, null, null, null, [0,1,13], null);
  nodeArray[433]	= new Array("Perpignan", 10102001310, null, null, null, [0,1,13], null);
  nodeArray[434]	= new Array("Aten", 10114501001, null, null, null, [0,1,14], null);
  nodeArray[435]	= new Array("Kreta", 10114501014, null, null, null, [0,1,14], null);
  nodeArray[436]	= new Array("Rhodos", 10114501013, null, null, null, [0,1,14], null);
  nodeArray[437]	= new Array("Thessaloniki", 10114501003, null, null, null, [0,1,14], null);
  nodeArray[438]	= new Array("Naxos", 10114501011, null, null, null, [0,1,14], null);
  nodeArray[439]	= new Array("Limnos", 10114501007, null, null, null, [0,1,14], null);
  nodeArray[440]	= new Array("Lesvos", 10114501026, null, null, null, [0,1,14], null);
  nodeArray[441]	= new Array("Skyros", 10114501025, null, null, null, [0,1,14], null);
  nodeArray[442]	= new Array("Samos", 10114501027, null, null, null, [0,1,14], null);
  nodeArray[443]	= new Array("Milos", 10114501028, null, null, null, [0,1,14], null);
  nodeArray[444]	= new Array("Korfu", 10114501005, null, null, null, [0,1,14], null);
  nodeArray[445]	= new Array("Souda(Kreta)", 10114501022, null, null, null, [0,1,14], null);
  nodeArray[446]	= new Array("Kythira", 10114501023, null, null, null, [0,1,14], null);
  nodeArray[447]	= new Array("Amsterdam", 10120601039, null, null, null, [0,1,15], null);
  nodeArray[448]	= new Array("Gronningen", 10120601021, null, null, null, [0,1,15], null);
  nodeArray[449]	= new Array("Maastricht", 10120601025, null, null, null, [0,1,15], null);
  nodeArray[450]	= new Array("Arnhem", 10120601014, null, null, null, [0,1,15], null);
  nodeArray[451]	= new Array("Haag", 10120601083, null, null, null, [0,1,15], null);
  nodeArray[452]	= new Array("Dublin", 10132516001, null, null, null, [0,1,16], null);
  nodeArray[453]	= new Array("Cork", 10132526001, null, null, null, [0,1,16], null);
  nodeArray[454]	= new Array("Limerick", 10132522001, null, null, null, [0,1,16], null);
  nodeArray[455]	= new Array("Longford", 10132510001, null, null, null, [0,1,16], null);
  nodeArray[456]	= new Array("Reykjavik", 10144701001, null, null, null, [0,1,17], null);
  nodeArray[457]	= new Array("Isafjördhur", 10144701005, null, null, null, [0,1,17], null);
  nodeArray[458]	= new Array("Akureyri", 10144701002, null, null, null, [0,1,17], null);
  nodeArray[459]	= new Array("Husavik", 10144701003, null, null, null, [0,1,17], null);
  nodeArray[460]	= new Array("Vestmannaeyjar", 10144701006, null, null, null, [0,1,17], null);
  nodeArray[461]	= new Array("Bolzano", 10151001035, null, null, null, [0,1,18], null);
  nodeArray[462]	= new Array("Catania", 10151001042, null, null, null, [0,1,18], null);
  nodeArray[463]	= new Array("Cortina", 10151001006, null, null, null, [0,1,18], null);
  nodeArray[464]	= new Array("Locarno", 10150701019, null, null, null, [0,1,18], null);
  nodeArray[465]	= new Array("Milano", 10151001074, null, null, null, [0,1,18], null);
  nodeArray[466]	= new Array("Neapel", 10151001073, null, null, null, [0,1,18], null);
  nodeArray[467]	= new Array("Palermo", 10151001082, null, null, null, [0,1,18], null);
  nodeArray[468]	= new Array("Rimini", 10151001095, null, null, null, [0,1,18], null);
  nodeArray[469]	= new Array("Rom", 10151001096, null, null, null, [0,1,18], null);
  nodeArray[470]	= new Array("Venedig", 10151001118, null, null, null, [0,1,18], null);
  nodeArray[471]	= new Array("Bari", 10151001029, null, null, null, [0,1,18], null);
  nodeArray[472]	= new Array("Brindisi", 10151001037, null, null, null, [0,1,18], null);
  nodeArray[473]	= new Array("Cagliari", 10151001038, null, null, null, [0,1,18], null);
  nodeArray[474]	= new Array("Florens", 10151001053, null, null, null, [0,1,18], null);
  nodeArray[475]	= new Array("Genua", 10151001057, null, null, null, [0,1,18], null);
  nodeArray[476]	= new Array("Perugia", 10151001083, null, null, null, [0,1,18], null);
  nodeArray[477]	= new Array("Pescara", 10151001085, null, null, null, [0,1,18], null);
  nodeArray[478]	= new Array("Pisa", 10151001087, null, null, null, [0,1,18], null);
  nodeArray[479]	= new Array("Taranto", 10151001106, null, null, null, [0,1,18], null);
  nodeArray[480]	= new Array("Trieste", 10151001112, null, null, null, [0,1,18], null);
  nodeArray[481]	= new Array("Bologna", 10151001034, null, null, null, [0,1,18], null);
  nodeArray[482]	= new Array("Zagreb", 10164803003, null, null, null, [0,1,19], null);
  nodeArray[483]	= new Array("Split", 10164803001, null, null, null, [0,1,19], null);
  nodeArray[484]	= new Array("Pula", 10164803002, null, null, null, [0,1,19], null);
  nodeArray[485]	= new Array("Dubrovnik", 10164803004, null, null, null, [0,1,19], null);
  nodeArray[486]	= new Array("Luxemburg", 10120650001, null, null, null, [0,1,15], null);
  nodeArray[487]	= new Array("Ljubljana", 10163401001, null, null, null, [0,1,19], null);
  nodeArray[488]	= new Array("Izola", 10163401002, null, null, null, [0,1,19], null);
  nodeArray[489]	= new Array("Celje", 10163401003, null, null, null, [0,1,19], null);
  nodeArray[490]	= new Array("Bihac", 10164301002, null, null, null, [0,1,19], null);
  nodeArray[491]	= new Array("Mostar", 10164301005, null, null, null, [0,1,19], null);
  nodeArray[492]	= new Array("Sarajevo", 10164301001, null, null, null, [0,1,19], null);
  nodeArray[493]	= new Array("Tuzla", 10164301007, null, null, null, [0,1,19], null);
  nodeArray[494]	= new Array("Zenica", 10164301008, null, null, null, [0,1,19], null);
  nodeArray[495]	= new Array("Belgrad", 10164601001, null, null, null, [0,1,19], null);
  nodeArray[496]	= new Array("Bar", 10164601003, null, null, null, [0,1,19], null);
  nodeArray[497]	= new Array("Skopje", 10162601001, null, null, null, [0,1,19], null);
  nodeArray[498]	= new Array("Strumica", 10162601007, null, null, null, [0,1,19], null);
  nodeArray[499]	= new Array("Prilep", 10162601006, null, null, null, [0,1,19], null);
  nodeArray[500]	= new Array("Bitola", 10162601002, null, null, null, [0,1,19], null);
  nodeArray[501]	= new Array("Stip", 10162601008, null, null, null, [0,1,19], null);
  nodeArray[502]	= new Array("Bratislava", 10183702001, null, null, null, [0,1,20], null);
  nodeArray[503]	= new Array("Bystrica", 10183702003, null, null, null, [0,1,20], null);
  nodeArray[504]	= new Array("Kosice", 10183702002, null, null, null, [0,1,20], null);
  nodeArray[505]	= new Array("Riga", 10182201001, null, null, null, [0,1,12], null);
  nodeArray[506]	= new Array("Liepaja", 10082201023, null, null, null, [0,1,12], null);
  nodeArray[507]	= new Array("Daugavpils", 10082201038, null, null, null, [0,1,12], null);
  nodeArray[508]	= new Array("Aluksne", 10082201004, null, null, null, [0,1,12], null);
  nodeArray[509]	= new Array("Vilnius", 10082401001, null, null, null, [0,1,12], null);
  nodeArray[510]	= new Array("Klaipeda", 10082401016, null, null, null, [0,1,12], null);
  nodeArray[511]	= new Array("Kaunas", 10082401003, null, null, null, [0,1,12], null);
  nodeArray[512]	= new Array("Panevezys", 10082401025, null, null, null, [0,1,12], null);
  nodeArray[513]	= new Array("Warszawa", 10201201290, null, null, null, [0,1,21], null);
  nodeArray[514]	= new Array("Gdansk", 10201201047, null, null, null, [0,1,21], null);
  nodeArray[515]	= new Array("Szczecin", 10201201255, null, null, null, [0,1,21], null);
  nodeArray[516]	= new Array("Poznan", 10201201201, null, null, null, [0,1,21], null);
  nodeArray[517]	= new Array("Wroclaw", 10201201305, null, null, null, [0,1,21], null);
  nodeArray[518]	= new Array("Lublin", 10201201135, null, null, null, [0,1,21], null);
  nodeArray[519]	= new Array("Krakow", 10201201105, null, null, null, [0,1,21], null);
  nodeArray[520]	= new Array("Bialystok", 10201201009, null, null, null, [0,1,21], null);
  nodeArray[521]	= new Array("Elblag", 10201201044, null, null, null, [0,1,21], null);
  nodeArray[522]	= new Array("Koszalin", 10201201103, null, null, null, [0,1,21], null);
  nodeArray[523]	= new Array("Czestochowa", 10201201036, null, null, null, [0,1,21], null);
  nodeArray[524]	= new Array("Lodz", 10201201127, null, null, null, [0,1,21], null);
  nodeArray[525]	= new Array("Torun", 10201201279, null, null, null, [0,1,21], null);
  nodeArray[526]	= new Array("Rzeszow", 10201201227, null, null, null, [0,1,21], null);
  nodeArray[527]	= new Array("Radom", 10201201216, null, null, null, [0,1,21], null);
  nodeArray[528]	= new Array("Katowice", 10201201086, null, null, null, [0,1,21], null);
  nodeArray[529]	= new Array("Olsztyn", 10201201173, null, null, null, [0,1,21], null);
  nodeArray[530]	= new Array("Lagos", 10213011002, null, null, null, [0,1,22], null);
  nodeArray[531]	= new Array("Lissabon", 10213007002, null, null, null, [0,1,22], null);
  nodeArray[532]	= new Array("Porto", 10213003001, null, null, null, [0,1,22], null);
  nodeArray[533]	= new Array("Viana do Castelo", 10213001002, null, null, null, [0,1,22], null);
  nodeArray[534]	= new Array("Portalegre", 10213009001, null, null, null, [0,1,22], null);
  nodeArray[535]	= new Array("Braga", 10213001001, null, null, null, [0,1,22], null);
  nodeArray[536]	= new Array("Evora", 10213009002, null, null, null, [0,1,22], null);
  nodeArray[537]	= new Array("Funchal", 10213012001, null, null, null, [0,1,22], null);
  nodeArray[538]	= new Array("Horta", 10213013004, null, null, null, [0,1,22], null);
  nodeArray[539]	= new Array("Bukarest", 10223101001, null, null, null, [0,1,23], null);
  nodeArray[540]	= new Array("Arad", 10223101002, null, null, null, [0,1,23], null);
  nodeArray[541]	= new Array("Constanta", 10223101014, null, null, null, [0,1,23], null);
  nodeArray[542]	= new Array("Cluj Napoca", 10223101004, null, null, null, [0,1,23], null);
  nodeArray[543]	= new Array("Iasi", 10223101003, null, null, null, [0,1,23], null);
  nodeArray[544]	= new Array("Sibiu", 10223101007, null, null, null, [0,1,23], null);
  nodeArray[545]	= new Array("Arkhangelsk", 10233201003, null, null, null, [0,1,24], null);
  nodeArray[546]	= new Array("Moskva", 10233201001, null, null, null, [0,1,24], null);
  nodeArray[547]	= new Array("Perm", 10233201006, null, null, null, [0,1,24], null);
  nodeArray[548]	= new Array("Murmansk", 10233201009, null, null, null, [0,1,24], null);
  nodeArray[549]	= new Array("S:t Petersburg", 10233201002, null, null, null, [0,1,24], null);
  nodeArray[550]	= new Array("Volgograd", 10233201008, null, null, null, [0,1,24], null);
  nodeArray[551]	= new Array("Nizjnij Novgorod", 10233201005, null, null, null, [0,1,24], null);
  nodeArray[552]	= new Array("Smolensk", 10233201007, null, null, null, [0,1,24], null);
  nodeArray[553]	= new Array("Astrachan", 10233201004, null, null, null, [0,1,24], null);
  nodeArray[554]	= new Array("Geneve", 10240701007, null, null, null, [0,1,25], null);
  nodeArray[555]	= new Array("Verbier", 10240701030, null, null, null, [0,1,25], null);
  nodeArray[556]	= new Array("Zermatt", 10240701032, null, null, null, [0,1,25], null);
  nodeArray[557]	= new Array("Zurich", 10240701024, null, null, null, [0,1,25], null);
  nodeArray[558]	= new Array("Basel", 10240701004, null, null, null, [0,1,25], null);
  nodeArray[559]	= new Array("S.t moritz", 10240701029, null, null, null, [0,1,25], null);
  nodeArray[560]	= new Array("Alicante", 10253515001, null, null, null, [0,1,26], null);
  nodeArray[561]	= new Array("Barcelona", 10253510001, null, null, null, [0,1,26], null);
  nodeArray[562]	= new Array("Las Palmas", 10253506007, null, null, null, [0,1,26], null);
  nodeArray[563]	= new Array("Madrid", 10253501001, null, null, null, [0,1,26], null);
  nodeArray[564]	= new Array("Malaga", 10253502007, null, null, null, [0,1,26], null);
  nodeArray[565]	= new Array("Mallorca (Palma)", 10253505002, null, null, null, [0,1,26], null);
  nodeArray[566]	= new Array("Sevilla", 10253502008, null, null, null, [0,1,26], null);
  nodeArray[567]	= new Array("Teneriffa", 10253506006, null, null, null, [0,1,26], null);
  nodeArray[568]	= new Array("Lanzarote", 10253506005, null, null, null, [0,1,26], null);
  nodeArray[569]	= new Array("Fuerteventura", 10253506008, null, null, null, [0,1,26], null);
  nodeArray[570]	= new Array("La Coruna", 10253511001, null, null, null, [0,1,26], null);
  nodeArray[571]	= new Array("Gijón", 10253504001, null, null, null, [0,1,26], null);
  nodeArray[572]	= new Array("Bilbao", 10253514001, null, null, null, [0,1,26], null);
  nodeArray[573]	= new Array("Pamplona", 10253513001, null, null, null, [0,1,26], null);
  nodeArray[574]	= new Array("Valladolid", 10253508007, null, null, null, [0,1,26], null);
  nodeArray[575]	= new Array("Zaragoza", 10253503003, null, null, null, [0,1,26], null);
  nodeArray[576]	= new Array("Valencia", 10253515003, null, null, null, [0,1,26], null);
  nodeArray[577]	= new Array("Cordoba", 10253502003, null, null, null, [0,1,26], null);
  nodeArray[578]	= new Array("Albacete", 10253507001, null, null, null, [0,1,26], null);
  nodeArray[579]	= new Array("Cartagena", 10253518001, null, null, null, [0,1,26], null);
  nodeArray[580]	= new Array("Badajoz", 10253517006, null, null, null, [0,1,26], null);
  nodeArray[581]	= new Array("Salamanca", 10253508006, null, null, null, [0,1,26], null);
  nodeArray[582]	= new Array("Edinburgh", 10263662001, null, null, null, [0,1,27], null);
  nodeArray[583]	= new Array("London", 10263601001, null, null, null, [0,1,27], null);
  nodeArray[584]	= new Array("Glasgow", 10263657001, null, null, null, [0,1,27], null);
  nodeArray[585]	= new Array("Newcastle", 10263603001, null, null, null, [0,1,27], null);
  nodeArray[586]	= new Array("Liverpool", 10263612001, null, null, null, [0,1,27], null);
  nodeArray[587]	= new Array("Nottingham", 10263626001, null, null, null, [0,1,27], null);
  nodeArray[588]	= new Array("Bristol", 10263635001, null, null, null, [0,1,27], null);
  nodeArray[589]	= new Array("Plymoth", 10263644001, null, null, null, [0,1,27], null);
  nodeArray[590]	= new Array("Belfast", 10263655004, null, null, null, [0,1,27], null);
  nodeArray[591]	= new Array("Portsmouth", 10263641001, null, null, null, [0,1,27], null);
  nodeArray[592]	= new Array("Orkney öarna", 10263660002, null, null, null, [0,1,27], null);
  nodeArray[593]	= new Array("Aberdeen", 10263658001, null, null, null, [0,1,27], null);
  nodeArray[594]	= new Array("Birmingham", 10263629002, null, null, null, [0,1,27], null);
  nodeArray[595]	= new Array("Jersey", 10263665001, null, null, null, [0,1,27], null);
  nodeArray[596]	= new Array("Prag", 10272001323, null, null, null, [0,1,28], null);
  nodeArray[597]	= new Array("Plzen", 10273701002, null, null, null, [0,1,28], null);
  nodeArray[598]	= new Array("Brno", 10273701003, null, null, null, [0,1,28], null);
  nodeArray[599]	= new Array("Ostrava", 10273701004, null, null, null, [0,1,28], null);
  nodeArray[600]	= new Array("Ankara", 10294101001, null, null, null, [0,1,29], null);
  nodeArray[601]	= new Array("Antalya", 10294101008, null, null, null, [0,1,29], null);
  nodeArray[602]	= new Array("Izmir", 10294101010, null, null, null, [0,1,29], null);
  nodeArray[603]	= new Array("Balikesir", 10294101005, null, null, null, [0,1,29], null);
  nodeArray[604]	= new Array("Istanbul", 10294101009, null, null, null, [0,1,29], null);
  nodeArray[605]	= new Array("Adana", 10294101019, null, null, null, [0,1,29], null);
  nodeArray[606]	= new Array("Kayseri", 10294101020, null, null, null, [0,1,29], null);
  nodeArray[607]	= new Array("Samsun", 10294101018, null, null, null, [0,1,29], null);
  nodeArray[608]	= new Array("Berlin", 10300508001, null, null, null, [0,1,30], null);
  nodeArray[609]	= new Array("Frankfurt", 10300510018, null, null, null, [0,1,30], null);
  nodeArray[610]	= new Array("Kiel", 10300501005, null, null, null, [0,1,30], null);
  nodeArray[611]	= new Array("Hamburg", 10300503001, null, null, null, [0,1,30], null);
  nodeArray[612]	= new Array("Bremen", 10300505001, null, null, null, [0,1,30], null);
  nodeArray[613]	= new Array("Dortmund", 10300509019, null, null, null, [0,1,30], null);
  nodeArray[614]	= new Array("Hannover", 10300504030, null, null, null, [0,1,30], null);
  nodeArray[615]	= new Array("Leipzig", 10300512003, null, null, null, [0,1,30], null);
  nodeArray[616]	= new Array("Dresden", 10300512012, null, null, null, [0,1,30], null);
  nodeArray[617]	= new Array("Bonn", 10300509058, null, null, null, [0,1,30], null);
  nodeArray[618]	= new Array("Kassel", 10300510001, null, null, null, [0,1,30], null);
  nodeArray[619]	= new Array("Zwickau", 10300512022, null, null, null, [0,1,30], null);
  nodeArray[620]	= new Array("Saarbrücken", 10300514005, null, null, null, [0,1,30], null);
  nodeArray[621]	= new Array("Mannheim", 10300515001, null, null, null, [0,1,30], null);
  nodeArray[622]	= new Array("Würzburg", 10300516018, null, null, null, [0,1,30], null);
  nodeArray[623]	= new Array("Nürnberg", 10300516037, null, null, null, [0,1,30], null);
  nodeArray[624]	= new Array("Stuttgart", 10300515021, null, null, null, [0,1,30], null);
  nodeArray[625]	= new Array("München", 10300516081, null, null, null, [0,1,30], null);
  nodeArray[626]	= new Array("Regensburg", 10300516045, null, null, null, [0,1,30], null);
  nodeArray[627]	= new Array("Freiburg", 10300515034, null, null, null, [0,1,30], null);
  nodeArray[628]	= new Array("Odessa", 10313801008, null, null, null, [0,1,31], null);
  nodeArray[629]	= new Array("Kiev", 10313801001, null, null, null, [0,1,31], null);
  nodeArray[630]	= new Array("Dnipropetrovsk", 10313801006, null, null, null, [0,1,31], null);
  nodeArray[631]	= new Array("Kharkiv", 10313801004, null, null, null, [0,1,31], null);
  nodeArray[632]	= new Array("Lviv", 10313801011, null, null, null, [0,1,31], null);
  nodeArray[633]	= new Array("Budapest", 10323901001, null, null, null, [0,1,32], null);
  nodeArray[634]	= new Array("Pécs", 10323901008, null, null, null, [0,1,32], null);
  nodeArray[635]	= new Array("Szeged", 10323901012, null, null, null, [0,1,32], null);
  nodeArray[636]	= new Array("Györ", 10323901004, null, null, null, [0,1,32], null);
  nodeArray[637]	= new Array("Miskolc", 10323901002, null, null, null, [0,1,32], null);
  nodeArray[638]	= new Array("Debrecen", 10323901006, null, null, null, [0,1,32], null);
  nodeArray[639]	= new Array("Szombathely", 10323901003, null, null, null, [0,1,32], null);
  nodeArray[640]	= new Array("Minsk", 10334001001, null, null, null, [0,1,33], null);
  nodeArray[641]	= new Array("Brest", 10334001004, null, null, null, [0,1,33], null);
  nodeArray[642]	= new Array("Babruysk", 10334001007, null, null, null, [0,1,33], null);
  nodeArray[643]	= new Array("Orsha", 10334001005, null, null, null, [0,1,33], null);
  nodeArray[644]	= new Array("Pinsk", 10334001002, null, null, null, [0,1,33], null);
  nodeArray[645]	= new Array("Mazyr", 10334001003, null, null, null, [0,1,33], null);
  nodeArray[646]	= new Array("Polatsk", 10334001006, null, null, null, [0,1,33], null);
  nodeArray[647]	= new Array("Badgastein", 10340901029, null, null, null, [0,1,34], null);
  nodeArray[648]	= new Array("Innsbruck", 10340901010, null, null, null, [0,1,34], null);
  nodeArray[649]	= new Array("Kitzbühel", 10340901036, null, null, null, [0,1,34], null);
  nodeArray[650]	= new Array("Saalbach", 10340901041, null, null, null, [0,1,34], null);
  nodeArray[651]	= new Array("Salzburg", 10340901019, null, null, null, [0,1,34], null);
  nodeArray[652]	= new Array("Wien", 10340901024, null, null, null, [0,1,34], null);
  nodeArray[653]	= new Array("Linz", 10340901017, null, null, null, [0,1,34], null);
  nodeArray[654]	= new Array("Graz", 10340901008, null, null, null, [0,1,34], null);
  nodeArray[655]	= new Array("Klagenfurt", 10340901012, null, null, null, [0,1,34], null);
  nodeArray[656]	= new Array("Bregenz", 10340901046, null, null, null, [0,1,34], null);
  nodeArray[657]	= new Array("Acapulco", 142001005, null, null, null, [0,4], null);
  nodeArray[658]	= new Array("Asuncion", 141603001, null, null, null, [0,5], null);
  nodeArray[659]	= new Array("Barbados", 142001035, null, null, null, [0,5], null);
  nodeArray[660]	= new Array("Bogota", 141501003, null, null, null, [0,5], null);
  nodeArray[661]	= new Array("Buenos Aires", 141901002, null, null, null, [0,5], null);
  nodeArray[662]	= new Array("Caracas", 141403001, null, null, null, [0,5], null);
  nodeArray[663]	= new Array("Havanna", 142001157, null, null, null, [0,5], null);
  nodeArray[664]	= new Array("Kingston", 142001193, null, null, null, [0,5], null);
  nodeArray[665]	= new Array("La Paz", 141601003, null, null, null, [0,5], null);
  nodeArray[666]	= new Array("Lima", 141405001, null, null, null, [0,5], null);
  nodeArray[667]	= new Array("Montevideo", 142001265, null, null, null, [0,5], null);
  nodeArray[668]	= new Array("Port au Prince", 142001319, null, null, null, [0,5], null);
  nodeArray[669]	= new Array("Quito", 141404001, null, null, null, [0,5], null);
  nodeArray[670]	= new Array("Rio de Janeiro", 142101008, null, null, null, [0,5], null);
  nodeArray[671]	= new Array("Santiago", 141701001, null, null, null, [0,5], null);
  nodeArray[672]	= new Array("Adelaide", 152001008, null, null, null, [0,6], null);
  nodeArray[673]	= new Array("Auckland", 158201002, null, null, null, [0,6], null);
  nodeArray[674]	= new Array("Cairns", 152001074, null, null, null, [0,6], null);
  nodeArray[675]	= new Array("Christchurch", 158202005, null, null, null, [0,6], null);
  nodeArray[676]	= new Array("Darwin", 152001102, null, null, null, [0,6], null);
  nodeArray[677]	= new Array("Melbourne", 152001252, null, null, null, [0,6], null);
  nodeArray[678]	= new Array("Perth", 152001311, null, null, null, [0,6], null);
  nodeArray[679]	= new Array("Sydney", 152001386, null, null, null, [0,6], null);
  nodeArray[680]	= new Array("Wellington", 158201010, null, null, null, [0,6], null);
  nodeArray[681]	= new Array("Anchorage", 136102002, null, null, null, [0,4], null);
  nodeArray[682]	= new Array("Aspen", 132001863, null, null, null, [0,4], null);
  nodeArray[683]	= new Array("Atlanta", 136110001, null, null, null, [0,4], null);
  nodeArray[684]	= new Array("Calgary", 135001003, null, null, null, [0,4], null);
  nodeArray[685]	= new Array("Chicago", 136112002, null, null, null, [0,4], null);
  nodeArray[686]	= new Array("Dallas", 136142003, null, null, null, [0,4], null);
  nodeArray[687]	= new Array("Denver", 136106001, null, null, null, [0,4], null);
  nodeArray[688]	= new Array("Fairbanks", 136102003, null, null, null, [0,4], null);
  nodeArray[689]	= new Array("Guatemala", 132001148, null, null, null, [0,4], null);
  nodeArray[690]	= new Array("Honolulu", 136149001, null, null, null, [0,4], null);
  nodeArray[691]	= new Array("Houston", 136142004, null, null, null, [0,4], null);
  nodeArray[692]	= new Array("Los Angeles", 136105003, null, null, null, [0,4], null);
  nodeArray[693]	= new Array("Managua", 132001241, null, null, null, [0,4], null);
  nodeArray[694]	= new Array("Memphis", 136141002, null, null, null, [0,4], null);
  nodeArray[695]	= new Array("Mexico city", 132001255, null, null, null, [0,4], null);
  nodeArray[696]	= new Array("Miami", 136109004, null, null, null, [0,4], null);
  nodeArray[697]	= new Array("Minneapolis", 136122002, null, null, null, [0,4], null);
  nodeArray[698]	= new Array("Montreal", 135009001, null, null, null, [0,4], null);
  nodeArray[699]	= new Array("New Orleans", 136117002, null, null, null, [0,4], null);
  nodeArray[700]	= new Array("New York", 136131003, null, null, null, [0,4], null);
  nodeArray[701]	= new Array("Phoenix", 136103001, null, null, null, [0,4], null);
  nodeArray[702]	= new Array("Quebec", 135009002, null, null, null, [0,4], null);
  nodeArray[703]	= new Array("San Franscisco", 136105002, null, null, null, [0,4], null);
  nodeArray[704]	= new Array("Seattle", 136146002, null, null, null, [0,4], null);
  nodeArray[705]	= new Array("Toronto", 135007002, null, null, null, [0,4], null);
  nodeArray[706]	= new Array("Vancouver", 135003001, null, null, null, [0,4], null);
  nodeArray[707]	= new Array("Washington", 132001425, null, null, null, [0,4], null);
  nodeArray[708]	= new Array("Whistler", 135003002, null, null, null, [0,4], null);
  nodeArray[709]	= new Array("Winnipeg", 135004001, null, null, null, [0,4], null);
  nodeArray[710]	= new Array("San José", 131406001, null, null, null, [0,4], null);
  nodeArray[711]	= new Array("Abu Dhabi", 122001004, null, null, null, [0,3], null);
  nodeArray[712]	= new Array("Bagdad", 122001029, null, null, null, [0,3], null);
  nodeArray[713]	= new Array("Bali (Denpasar)", 122001103, null, null, null, [0,3], null);
  nodeArray[714]	= new Array("Bangkok", 122001034, null, null, null, [0,3], null);
  nodeArray[715]	= new Array("Beirut", 122001039, null, null, null, [0,3], null);
  nodeArray[716]	= new Array("Bombay", 122001052, null, null, null, [0,3], null);
  nodeArray[717]	= new Array("Calcutta", 122001076, null, null, null, [0,3], null);
  nodeArray[718]	= new Array("Eilat", 122001118, null, null, null, [0,3], null);
  nodeArray[719]	= new Array("Hongkong", 125101010, null, null, null, [0,3], null);
  nodeArray[720]	= new Array("Irkutsk", 122001170, null, null, null, [0,3], null);
  nodeArray[721]	= new Array("Jakarta (Djakarta)", 122001107, null, null, null, [0,3], null);
  nodeArray[722]	= new Array("Jakutsk", 122001172, null, null, null, [0,3], null);
  nodeArray[723]	= new Array("Jerusalem", 122001176, null, null, null, [0,3], null);
  nodeArray[724]	= new Array("Kabul", 122001179, null, null, null, [0,3], null);
  nodeArray[725]	= new Array("Karachi (Pakistan)", 122001185, null, null, null, [0,3], null);
  nodeArray[726]	= new Array("Manila", 122001245, null, null, null, [0,3], null);
  nodeArray[727]	= new Array("Mauritius", 122001457, null, null, null, [0,3], null);
  nodeArray[728]	= new Array("New Delhi", 122001281, null, null, null, [0,3], null);
  nodeArray[729]	= new Array("Novosibirsk", 122001290, null, null, null, [0,3], null);
  nodeArray[730]	= new Array("Peking", 122001309, null, null, null, [0,3], null);
  nodeArray[731]	= new Array("Phuket air", 122001464, null, null, null, [0,3], null);
  nodeArray[732]	= new Array("Riadh (Rijad)", 122001338, null, null, null, [0,3], null);
  nodeArray[733]	= new Array("Rostov", 122001487, null, null, null, [0,3], null);
  nodeArray[734]	= new Array("Ho Chi Minh City", 122001347, null, null, null, [0,3], null);
  nodeArray[735]	= new Array("Seuol", 122001366, null, null, null, [0,3], null);
  nodeArray[736]	= new Array("Shanghai", 125101008, null, null, null, [0,3], null);
  nodeArray[737]	= new Array("Singapore", 122001370, null, null, null, [0,3], null);
  nodeArray[738]	= new Array("Sri Lanka", 122001091, null, null, null, [0,3], null);
  nodeArray[739]	= new Array("Tasjkent", 122001393, null, null, null, [0,3], null);
  nodeArray[740]	= new Array("Tbilisi", 125601001, null, null, null, [0,3], null);
  nodeArray[741]	= new Array("Teheran", 122001396, null, null, null, [0,3], null);
  nodeArray[742]	= new Array("Tel Aviv", 122001395, null, null, null, [0,3], null);
  nodeArray[743]	= new Array("Tokyo", 122001400, null, null, null, [0,3], null);
  nodeArray[744]	= new Array("Ulan Bator", 122001411, null, null, null, [0,3], null);
  nodeArray[745]	= new Array("Vladivostok", 123229001, null, null, null, [0,3], null);
  nodeArray[746]	= new Array("Taipei", 125105001, null, null, null, [0,3], null);
  nodeArray[747]	= new Array("Abidjan", 112001003, null, null, null, [0,2], null);
  nodeArray[748]	= new Array("Accra", 112001006, null, null, null, [0,2], null);
  nodeArray[749]	= new Array("Addis Abeba", 112001007, null, null, null, [0,2], null);
  nodeArray[750]	= new Array("Alger", 112001011, null, null, null, [0,2], null);
  nodeArray[751]	= new Array("Antananarivo", 112001391, null, null, null, [0,2], null);
  nodeArray[752]	= new Array("Casablanca", 112001081, null, null, null, [0,2], null);
  nodeArray[753]	= new Array("Dakar", 112001098, null, null, null, [0,2], null);
  nodeArray[754]	= new Array("Dar-es-Salaam", 112001101, null, null, null, [0,2], null);
  nodeArray[755]	= new Array("Durban", 112001114, null, null, null, [0,2], null);
  nodeArray[756]	= new Array("Free Town", 112001129, null, null, null, [0,2], null);
  nodeArray[757]	= new Array("Gabarone", 117202001, null, null, null, [0,2], null);
  nodeArray[758]	= new Array("Gambia", 112001133, null, null, null, [0,2], null);
  nodeArray[759]	= new Array("Harare", 112001156, null, null, null, [0,2], null);
  nodeArray[760]	= new Array("Johannesburg", 112001177, null, null, null, [0,2], null);
  nodeArray[761]	= new Array("Kairo", 112001180, null, null, null, [0,2], null);
  nodeArray[762]	= new Array("Kapstaden", 112001184, null, null, null, [0,2], null);
  nodeArray[763]	= new Array("Kinshasa", 112001484, null, null, null, [0,2], null);
  nodeArray[764]	= new Array("Lagos", 112001206, null, null, null, [0,2], null);
  nodeArray[765]	= new Array("Libreville", 117105001, null, null, null, [0,2], null);
  nodeArray[766]	= new Array("Luanda", 112001232, null, null, null, [0,2], null);
  nodeArray[767]	= new Array("Maputo", 117204001, null, null, null, [0,2], null);
  nodeArray[768]	= new Array("Mombasa", 112001461, null, null, null, [0,2], null);
  nodeArray[769]	= new Array("Monrovia", 112001264, null, null, null, [0,2], null);
  nodeArray[770]	= new Array("Nairobi", 112001272, null, null, null, [0,2], null);
  nodeArray[771]	= new Array("Nampula", 117204004, null, null, null, [0,2], null);
  nodeArray[772]	= new Array("Port Elizabeth", 117901006, null, null, null, [0,2], null);
  nodeArray[773]	= new Array("Seychellerna", 112001367, null, null, null, [0,2], null);
  nodeArray[774]	= new Array("Tarapolis (Tripoli)", 112001405, null, null, null, [0,2], null);
  nodeArray[775]	= new Array("Tunis", 112001409, null, null, null, [0,2], null);

}

function populate_selectors()
{
    var area = new Areas();
	var o1 = 0;
	var o2 = 0;
	var id = 0;
	
	var selected_countryId = getPreference("countryId");
	// Limit country selections to sweden, norway & finland 
	// TODO: Adapt weather readings from other countries
	if(selected_countryId < 1001 || selected_countryId > 1004 ) { selected_countryId = 1001; }
	
	for( i in area.list ) { 
		id = area.list[i][1];
		//if( id < 9999 && id > 10 ){
		if( id <= 1004 && id >= 1001 ){
			// populate country indexes
			document.getElementById("popup").options[o1] = new Option(area.list[i][0],id);
			if(id == selected_countryId)
				document.getElementById("popup").selectedIndex = o1;
					
			o1++;
		//} else if (id > 10000000) {
		} else if(id > 10000000000) {
			// populate area indexes
			document.getElementById("selector").options[o2] = new Option(area.list[i][0],id);						
			o2++;
		} 	
	}
	update_selector();
}

function selected_area(event) 
{
	// Insert Code Here

}


function update_selector(event) 
{
	// Insert Code Here
	var area = new Areas();
	var o = 0;
	var id = 0;
	var x,y;
	
	var selection = document.getElementById("popup");
	var value = selection.options[selection.selectedIndex].value;

	var selected_areaId = getPreference("areaId");
	
	setPreference(value,"countryId");
	delete document.getElementById("selector").options;
	
	x = value*10000000;
	value++;	
	y = (value)*10000000;
	for( i in area.list ) { 
		id = area.list[i][1];
		if(id > x && id < y) {
				document.getElementById("selector").options[o] = new Option(area.list[i][0],id);
				if(id == selected_areaId)
					document.getElementById("selector").selectedIndex = o;	
				o++;
		}
	}
	document.getElementById("selector").options.length = o; 
}
