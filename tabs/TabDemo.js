Tabs.TabDemo = {
	tabOrder : 8000,
	tabLabel : 'Demo Tab',
	tabColor : 'blue',
	myDiv : null,
	Options : {
		Counter : 0,
	},

	init : function (div){
		var t = Tabs.TabDemo;
		t.myDiv = div;
		
		if (!Options.TabDemo) {
			Options.TabDemo = t.Options;
		}
		else {
			for (var y in t.Options) {
				if (!Options.TabDemo.hasOwnProperty(y)) {
					Options.TabDemo[y] = t.Options[y];
				}	
			}
		}
	},

	hide : function (){
		var t = Tabs.TabDemo;
	},

	show : function (){
		var t = Tabs.TabDemo;

		var m = '<br><CENTER>This tab does nothing!!! It is just an example of how to write a tab!<BR><BR>The source code can be seen at:-<br><a href="http://markbranscombe.com/barbarossa/PowerBotPlus/tabs/TabDemo.js" target="_blank">http://markbranscombe.com/barbarossa/PowerBotPlus/tabs/TabDemo.js</a><BR><BR>This tab has been displayed for a total of <span id=pbpdemotime>&nbsp;</span> seconds...<br>'+strButton20('RESET TIMER','id=pbpdemoreset')+'</center><br>';
		t.myDiv.innerHTML = m;
		
		ById('pbpdemoreset').addEventListener('click',t.ResetTimer);
	},
	
	EverySecond : function () {
		var t = Tabs.TabDemo;
		
		if (tabManager.currentTab.name == 'TabDemo' && Options.btWinIsOpen){
			Options.TabDemo.Counter++;
			saveOptions();
			ById('pbpdemotime').innerHTML = Options.TabDemo.Counter;
		}	
	},
	
	ResetTimer : function () {
		var t = Tabs.TabDemo;
		Options.TabDemo.Counter  = 0;
		saveOptions();
	},
}
