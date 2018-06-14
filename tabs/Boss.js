Tabs.Boss = {
	tabOrder: 2120,
	tabLabel : 'Boss',
	tabColor : 'brown',
	myDiv : null,
	timer : null,
	init : function (div){
		var t = Tabs.Boss;
		t.myDiv = div;
	},
	hide : function (){ },

	jetonBoss:function() {
		var t = Tabs.Boss;
		var params = uW.Object.clone(uW.g_ajaxparams);
		params.champid = ById("boBossChamp").value;
		params.eventId = uW.cm.BossModel.getEventId();
		params.tokenCost=1;
		params.userId=uW.tvuid;
		params.tokens = parseIntNan(uW.ksoItems[22500].count)
		new MyAjaxRequest(uW.g_ajaxpath+"ajax/championBossFight.php"+uW.g_ajaxsuffix,{
			method:"post",
			parameters:params,
			onSuccess:function(rslt) {
				if (rslt.ok){
					ById("BOJetonBossresult").innerHTML="";
					if (parseIntNan(m.health)>0) {
						ById("BOJetonBossresult").innerHTML="<br>Reste " + parseIntNan(rslt.health) + " % de vie<br>";
					}else{
						ById("BOJetonBossresult").innerHTML="<br>Vous avez gagn&eacute; !<br>";
					}
					uW.ksoItems[22500].count=parseIntNan(rslt.tokens);
	
					if (rslt.loot) {
						aD = rslt.loot;
						var aC={};
						for (var aB = 0; aB < aD.length; aB++) {
							if (typeof aC[aD[aB].itemId] !== "undefined") {
								aC[aD[aB].itemId] += +aD[aB].quantity
							} else {
								aC[aD[aB].itemId] = +aD[aB].quantity
							}
							ById("BOJetonBossresult").innerHTML += aD[aB].quantity + " x " + uW.ksoItems[aD[aB].itemId].name+" <img align=absmiddle width=20 src='"+uW.ksoItems[aD[aB].itemId].getImage(70)+"'><br>";
						}
						uW.update_inventory(aC);
					}
					params.userId=uW.tvuid;
					params.eventId = uW.cm.BossModel.getEventId();
					new MyAjaxRequest(uW.g_ajaxpath+"ajax/championBossNext.php"+uW.g_ajaxsuffix,{
						method:"post",
						parameters:params,
						onSuccess:function(rslt) {
							if (rslt.ok){
								ById("BOJetonBoss").value=uW.g_js_strings.modal_mmb.playnow+" ("+parseIntNan(uW.ksoItems[22500].count)+")";
							}
						}
					},true);
				}else{
					ById("BOJetonBossresult").innerHTML="Erreur....";
				}
			},
		},true);
	},
  
	StartjetonBoss:function() {
		var t = Tabs.Boss;
		var params = uW.Object.clone(uW.g_ajaxparams);
		params.eventId = uW.cm.BossModel.getEventId();
		params.userId=uW.tvuid;
		new MyAjaxRequest(uW.g_ajaxpath+"ajax/championBossBegin.php"+uW.g_ajaxsuffix,{
			method:"post",
			parameters:params,
			onSuccess:function(rslt) {
				if (rslt.ok){
					uW.ksoItems[22500].count=parseIntNan(m.tokens);
					var aB = uW.cm.BossModel.getEvent();
					aB.state=1;
					uW.cm.BossModel.updateEvent(aB);
					t.show();
				}
			}
		},true);
	},
	
	show : function (){
		var t = Tabs.Boss;
		var m = '<DIV class=divHeader align=center>'+uW.g_js_strings.boss.modal_title.toUpperCase()+'</div>';

		if (!uW.cm.BossController.isOldEvent()) {
			var str = uW.cm.BossModel.getEvent()["bossArtString"];
			var aB = uW.unixtime();
			var aC = uW.cm.BossModel.getEvent().endTime;
			var aD = -1;
			if (aC) {
				aD = (Number(aC) - aB);
			}
			if (aD>0) {
				m+="<br><DIV align=center><b>"+uW.g_js_strings.boss.modal_title+"</b>";
				m+="<br>" +uW.g_js_strings.boss["name_" +str] + " - "+uW.g_js_strings.boss.quest_ends.replace("%1$s","")+" "  + timestr(aD) + "</div>";
				if (uW.cm.BossModel.getEvent().state == 0 ) {
					m+="<br><br><center><input type=button class=pbButton value='"+uW.g_js_strings.boss.begin+"' id=BOStartJetonBoss></center><br>";
				}else{
					m+="<DIV align=center><br><br>" + uW.g_js_strings.boss.yourChampion+': <select id=boBossChamp name=boBossChamp>';
					var champ = Seed.champion.champions;
					for (var ch=0;ch<champ.length;ch++) {
						currentch=champ[ch];
						m += '<option value='+currentch.championId+'>'+currentch.name + '</option>';
					}
					m+='</select></div>';
					m+="<br><br><center><input type=button class=pbButton value='"+uW.g_js_strings.modal_mmb.playnow+" ("+parseIntNan(uW.ksoItems[22500].count)+")' id=BOJetonBoss>&nbsp;&nbsp;<a id=BObbhBuyMoreBtn class=buttonGreen20><span>Buy More</span></a><br><div id=BOJetonBossresult style='max-width:400px;width:400px'>&nbsp;</div>";
				}
			}
			else {
				m += '<br><div align=center>'+tx('No active event')+'</div>';
			}
		}
		else {
			m += '<br><div align=center>'+tx('No active event')+'</div>';
		}
		t.myDiv.innerHTML = m;
		if (!uW.cm.BossController.isOldEvent() && aD>0) {
			if (uW.cm.BossModel.getEvent().state == 0 ) {
				ById('BOStartJetonBoss').addEventListener('click', function(){t.StartjetonBoss();} , false);
			}else{
				ById('BOJetonBoss').addEventListener('click', function(){t.jetonBoss();} , false);
				ById('BObbhBuyMoreBtn').addEventListener('click', function(){ uW.cm.ShopView.openShop(1, function() { var t = Tabs.Boss;t.show(); }); } , false);
			}
		}
	},
}

