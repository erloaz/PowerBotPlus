/**************************** Boss Tab ****************************************/
// @tabversion 20180702

Tabs.Boss = {
	tabOrder: 2120,
	tabLabel : 'Boss',
	tabColor : 'brown',
	ValidBoss: false,
        ValidJousting: false,
	isBusy: false,
	myDiv : null,
	timer : null,
	CurrentBoss : null,
        CurrentJousting : null,
	TokensLeft : 0,
	championId : 0,
	Options: {
		MaxLevel:0,
		StopIfDefeated:true,
  },
            init : function (div){
		var t = Tabs.Boss;
		t.myDiv = div;
		
		if (!Options.BossOptions) {
			Options.BossOptions = t.Options;
		}
		else {
			for (var y in t.Options) {
				if (!Options.BossOptions.hasOwnProperty(y)) {
					Options.BossOptions[y] = t.Options[y];
				}
			}
		}
		t.CheckEvent(t.show);
                t.CheckJousting();
     },
	    CheckEvent : function (notify) {
		var t = Tabs.Boss;
		t.CurrentBoss = uW.cm.BossModel.getEvent();
		if (!t.CurrentBoss.eventId) {
			setTimeout (function () { t.CheckEvent(notify); }, 1000);
			return;
		}
              if (t.CurrentBoss.state == 0) {
			t.StartBossBattle(notify);
			notify = null;
		}
		var now = uW.unixtime();
		var end = parseIntNan(t.CurrentBoss.endTime);
		var elem = ById("bttcBoss");
		if (end-now>0) {
			t.ValidBoss = true;
			elem.setAttribute("style","color:#f00");
		}
		else {
			t.ValidBoss = false;
//				elem.setAttribute("style","display:none");
		}
		if (notify) { notify(); }
    },
	  StartBossBattle : function(notify) {
		var t = Tabs.Boss;
		var params = uW.Object.clone(uW.g_ajaxparams);
		params.eventId = uW.cm.BossModel.getEventId();
		params.userId = uW.tvuid;
		new MyAjaxRequest(uW.g_ajaxpath+"ajax/championBossBegin.php"+uW.g_ajaxsuffix,{
			method:"post",
			parameters:params,
			onSuccess:function(rslt) {
				if (rslt.ok){
					OldTokens = parseIntNan(uW.ksoItems[t.CurrentBoss.tokenItemId].count);
					rslt.state = 1;
					uW.cm.BossModel.updateEvent(uWCloneInto(rslt));
					Seed.items["i"+t.CurrentBoss.tokenItemId] = parseIntNan(uW.ksoItems[t.CurrentBoss.tokenItemId].count);
					actionLog(Number(parseIntNan(rslt.tokens)-OldTokens)+' '+uW.itemlist["i"+t.CurrentBoss.tokenItemId].name+' Collected','BOSS');
					if (notify) { notify(); }
				}
			}
		},true);
    },
           eventDoBoss: function () {
		var t = Tabs.Boss;
                var div = $("pbboss_info");
                var params = uW.Object.clone(uW.g_ajaxparams);
		params.champid = t.championId;
		params.eventId = uW.cm.BossModel.getEventId();
		params.tokenCost = t.CurrentBoss.cost;
		params.userId = uW.tvuid;
		params.tokens = parseIntNan(uW.ksoItems[t.CurrentBoss.tokenItemId].count)
		new MyAjaxRequest(uW.g_ajaxpath+"ajax/championBossFight.php"+uW.g_ajaxsuffix,{
			method:"post",
			parameters:params,
			onSuccess:function(rslt) {
				if (rslt.ok){
					t.TokensLeft = t.TokensLeft - t.CurrentBoss.cost;
					var FightText = "";
					if (parseIntNan(rslt.health)>0) {
						FightText = uW.g_js_strings.boss["tier_names_"+t.getBossTier(t.CurrentBoss.level)]+' - '+uW.g_js_strings.commonstr.level+'&nbsp;'+t.CurrentBoss.level+' - <b>'+tx('Defeat')+'!&nbsp</b>'+tx('Remaining Health')+':&nbsp;'+parseIntNan(rslt.health)+"%";
						if (Options.BossOptions.StopIfDefeated) {
							FightText = '<span style="color:#800;">'+tx('Boss Battle Stopped')+'</span><br>'+FightText;
							ById('pbBossCancel').firstChild.innerHTML = uW.g_js_strings.commonstr.close;
							t.isBusy = false;
						}
					}
					else {
						FightText = uW.g_js_strings.boss["tier_names_"+t.getBossTier(t.CurrentBoss.level)]+' - '+uW.g_js_strings.commonstr.level+'&nbsp;'+t.CurrentBoss.level+' - <b>'+tx('Victory')+'!&nbsp;</b>';
						if (rslt.loot) {
							var loot={};
							for (var i=0;i<rslt.loot.length;i++) {
								if (typeof loot[rslt.loot[i].itemId] !== "undefined") {
									loot[rslt.loot[i].itemId] += +rslt.loot[i].quantity;
								} else {
									loot[rslt.loot[i].itemId] = +rslt.loot[i].quantity;
								}
								FightText = '<span>'+tx('You received')+' '+rslt.loot[i].quantity+' '+ uW.itemlist["i"+rslt.loot[i].itemId].name+'</span><br>'+FightText;
							}
							uW.update_inventory(uWCloneInto(loot));
						}
					}
					div.innerHTML = '<span>'+FightText+'</span><br>'+div.innerHTML;
					uW.ksoItems[t.CurrentBoss.tokenItemId].count=parseIntNan(rslt.tokens);
					Seed.items["i"+t.CurrentBoss.tokenItemId] = parseIntNan(uW.ksoItems[t.CurrentBoss.tokenItemId].count);
                                        CM.BossModel.updateEvent(uWCloneInto(rslt));
                                        if (parseIntNan(rslt.health)<=0) {
						params.userId=uW.tvuid;
						params.eventId = uW.cm.BossModel.getEventId();
						new MyAjaxRequest(uW.g_ajaxpath+"ajax/championBossNext.php"+uW.g_ajaxsuffix,{method:"post",parameters:params,
							onSuccess:function(rslt) {
								if (rslt.ok){
									CM.BossModel.updateEvent(uWCloneInto(rslt));
									setTimeout(t.nextfight, 500);
								}
								else {
									div.innerHTML = '<span style="color:#800;">'+tx('Server Error')+' '+rslt.debug+'</span><br>'+div.innerHTML;
									ById('pbBossCancel').firstChild.innerHTML = uW.g_js_strings.commonstr.close;
									t.isBusy = false;
								}
							},
							onFailure: function () {
								div.innerHTML = '<span style="color:#800;">'+tx('Server Error')+'!</span><br>'+div.innerHTML;
								ById('pbBossCancel').firstChild.innerHTML = uW.g_js_strings.commonstr.close;
								t.isBusy = false;
							},
						},true);
					}
					else {
						setTimeout(t.nextfight, 500);
					}
				}
				else {
					div.innerHTML = '<span style="color:#800;">'+tx('Server Error')+' '+rslt.debug+'</span><br>'+div.innerHTML;
					ById('pbBossCancel').firstChild.innerHTML = uW.g_js_strings.commonstr.close;
					t.isBusy = false;
					// try and fix
					params.userId=uW.tvuid;
					params.eventId = uW.cm.BossModel.getEventId();
					new MyAjaxRequest(uW.g_ajaxpath+"ajax/championBossNext.php"+uW.g_ajaxsuffix,{method:"post",parameters:params,
						onSuccess:function(rslt) {
							if (rslt.ok){
								CM.BossModel.updateEvent(uWCloneInto(rslt));
							}
							else {
								div.innerHTML = '<span style="color:#800;">'+tx('Server Error')+' '+rslt.debug+'</span><br>'+div.innerHTML;
								ById('pbBossCancel').firstChild.innerHTML = uW.g_js_strings.commonstr.close;
								t.isBusy = false;
							}
						},
						onFailure: function () {
							div.innerHTML = '<span style="color:#800;">'+tx('Server Error')+'!</span><br>'+div.innerHTML;
							ById('pbBossCancel').firstChild.innerHTML = uW.g_js_strings.commonstr.close;
							t.isBusy = false;
						},
					},true);
				}
			},
			onFailure: function () {
				div.innerHTML = '<span style="color:#800;">'+tx('Server Error')+'!</span><br>'+div.innerHTML;
				ById('pbBossCancel').firstChild.innerHTML = uW.g_js_strings.commonstr.close;
				t.isBusy = false;
			},
		},true);
    },
	    show : function (){
		var t = Tabs.Boss;
		   if (!t.isBusy) {
		var m = '<DIV class=divHeader align=center>'+uW.g_js_strings.boss.modal_title.toUpperCase()+'</div>';
			m += '<div style="min-height:400px;">';
		   if (t.ValidBoss) {
				var str = t.CurrentBoss.bossArtString;
				var now = uW.unixtime();
				var end = parseIntNan(t.CurrentBoss.endTime);
				var elem = ById("bttcBoss");
				if (end-now>0) {
					m += '<br><DIV align=center>';
					m += uW.g_js_strings.boss.quest_ends.replace("%1$s","")+' <span btBossEndTime>'+timestr(end-now)+'</span><br><br>';
					m += '<b>'+uW.g_js_strings.boss["name_"+str]+'</b><br>';
					m += uW.g_js_strings.boss["description_"+str]+'<br><br>';
					m += uW.g_js_strings.boss["tier_names_"+t.getBossTier(t.CurrentBoss.level)]+' - '+uW.g_js_strings.commonstr.level+'&nbsp;'+t.CurrentBoss.level+'<br><br>';
					m += '</div><div align=center><table class=xtab>';
					m += '<TR><td align=right>'+uW.itemlist["i"+t.CurrentBoss.tokenItemId].name+':&nbsp;</td><td><b>'+(Seed.items["i"+t.CurrentBoss.tokenItemId]?Seed.items["i"+t.CurrentBoss.tokenItemId]:0)+'</b></td></tr>';
					m += '<TR><td align=right>'+tx('Cost per Battle')+':&nbsp;</td><td><b>'+t.CurrentBoss.cost+'</b></td></tr>';
					m += '<TR><td align=right>'+tx('Amount to Use')+':</td><td><INPUT size=4 id=btBossItemAmount type=text value="'+t.TokensLeft+'"></td></tr>';
					m += '</table></div><DIV align=center>'+uW.g_js_strings.boss.yourChampion+': <select id=btBossChamp>';
					var champ = Seed.champion.champions;
					for (var ch=0;ch<champ.length;ch++) {
						currentch=champ[ch];
						m += '<option value="'+currentch.championId+'" '+((currentch.championId==t.championId)?'selected':'')+'>'+currentch.name + '</option>';
					}
					m+='</select></div>';
					m+='<br><br><center><input type=button value="'+uW.g_js_strings.modal_mmb.playnow+'" id=btBossStart></center>';
				}
				else {
					m += '<br><div align=center>'+tx('No active event')+'</div>';
				}
			}
			else {
				m += '<br><div align=center>'+tx('No active event')+'</div>';
			}
			m += '</div>';
			m += '<div align=center><div style="position:absolute;bottom:0px;width:'+GlobalOptions.btWinSize.x+'px;"><br><hr>';
			m += '<form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_blank">\
					<input type="hidden" name="cmd" value="_s-xclick">\
					<input type="hidden" name="hosted_button_id" value="8VEDPV3X9X82L">\
					<input type="image" src="https://www.paypalobjects.com/en_US/GB/i/btn/btn_donateCC_LG.gif" border="0" name="submit" alt="PayPal  The safer, easier way to pay online!">\
					<img alt="" border="0" src="https://www.paypalobjects.com/en_GB/i/scr/pixel.gif" width="1" height="1">\
					</form>';
			m += '<br>'+tx('This additional tab has been provided free of charge for the benefit of players. Please donate to help with future support and development of this and other features')+'.<br>'+tx('Thanks')+',&nbsp;Barbarossa.<br>&nbsp;</div></div>';
			
	              t.myDiv.innerHTML = m;
			ResetFrameSize('btMain',100,GlobalOptions.btWinSize.x);
                  if (t.ValidBoss) {
				ById('btBossItemAmount').addEventListener('change', function(){
					t.TokensLeft = parseIntNan(ById('btBossItemAmount').value);
					ById('btBossItemAmount').value = t.TokensLeft;
				} , false);
				ById('btBossStart').addEventListener('click', function(){t.start();} , false);
			}
		}
		else { // reset curtain position..
			t.setCurtain(true);
		}
    },
	  getBossTier : function(lvl) {
		var t = Tabs.Boss;
		for (var k=0;k<t.CurrentBoss.tiers.length;k++) {
			if (lvl>=t.CurrentBoss.tiers[k][0] && lvl<=t.CurrentBoss.tiers[k][1]) {
				return k;
			}
		}
		return (t.CurrentBoss.tiers.length-1); // must be highest level!
    },
	  setPopup: function (onoff) {
		var t = Tabs.Boss;
		if (onoff) {
			var div = document.createElement('div');
			div.id = 'ptBossPop';
			div.style.backgroundColor = '#fff';
			div.style.zindex = mainPop.div.zIndex + 2;
			div.style.opacity = '1';
			div.style.border = '3px outset black';
			div.style.width = (GlobalOptions.btWinSize.x-200)+'px';
			div.style.height = '300px';
			div.style.display = 'block';
			div.style.position = 'absolute';
			div.style.top = '100px';
			div.style.left = '100px';
			t.myDiv.appendChild(div);
			return div;
		} else {
			t.myDiv.removeChild(ById('ptBossPop'));
		}
	},

	setCurtain: function (onoff) {
		var t = Tabs.Boss;
		if (onoff) {
			var off = getAbsoluteOffsets(t.myDiv);
			var curtain = ById('ptBossCurtain');
			if (!curtain) {
				curtain = document.createElement('div');
				curtain.id = 'ptBossCurtain';
				curtain.style.zindex = mainPop.div.zIndex + 1;
				curtain.style.backgroundColor = "#000000";
				curtain.style.opacity = '0.5';
				curtain.style.display = 'block';
				curtain.style.position = 'absolute';
				t.myDiv.appendChild(curtain);
			}
			curtain.style.width = (t.myDiv.clientWidth+4) + 'px';
			curtain.style.height = (t.myDiv.clientHeight+4) + 'px';
			curtain.style.top = off.top + 'px';
			curtain.style.left = off.left + 'px';
		} else {
			t.myDiv.removeChild(ById('ptBossCurtain'));
		}
	},

	e_Cancel: function () {
		var t = Tabs.Boss;
		if (t.isBusy) {
			t.isBusy = false;
			var div = $("pbboss_info");
			div.innerHTML += "<br><span>"+tx('Cancelled')+"!</span>";
			ById('pbBossCancel').firstChild.innerHTML = uW.g_js_strings.commonstr.close;
			return;
		}
		t.setCurtain(false);
		t.setPopup(false);
		t.show();
   },

	start : function (){
		var t = Tabs.Boss;

		t.championId = ById("btBossChamp").value;
		
		if ((t.championId!=0) && (t.TokensLeft>=t.CurrentBoss.cost)) {
			t.isBusy = true;
			t.setCurtain(true);
			var popDiv = t.setPopup(true);
			popDiv.innerHTML = '<TABLE class=xtab width=100% height=100%><TR><TD align=center>\
			<DIV class=divHeader align=center>'+tx('Boss Battle Results')+'...</div>\
				<DIV id=pbboss_info style="padding:10px; height:225px; max-height:225px; overflow-y:auto"></div>\
				</td></tr><TR><TD align=center>' + strButton20(uW.g_js_strings.commonstr.cancel, 'id=pbBossCancel') + '</td></tr></table>';
				ById('pbBossCancel').addEventListener('click', t.e_Cancel, false);

			t.nextfight();
		}
    },
             nextfight : function (){
		var t = Tabs.Boss;
		if(!t.isBusy)
			return;
		var div = $("pbboss_info");
		if(t.TokensLeft<t.CurrentBoss.cost){
			if (div) {
				div.innerHTML = "<span>"+tx('Completed')+"!</span><br>"+div.innerHTML;
				ById('pbBossCancel').firstChild.innerHTML = 'Close';
			}
			t.isBusy = false;
			return;
		}
		t.eventDoBoss();
     },
	
	   CheckEvent : function (notify) {
		var t = Tabs.Boss;
		t.CurrentJousting = uW.cm.JoustingModel.getEvent();
		if (!t.CurrentJousting.eventId) {
			setTimeout (function () { t.CheckEvent(notify); }, 1000);
			return;
		}

		if (t.CurrentJousting.state == 0) {
			t.StartJoustingEvent(notify);
			notify = null;
		}
		var now = uW.unixtime();
		var end = parseIntNan(t.CurrentJousting.endTime);
		var elem = ById("bttcJousting");
		if (end-now>0) {
			t.ValidJousting = true;
			elem.setAttribute("style","color:#f00");
		}
		else {
			t.ValidJousting = false;
//				elem.setAttribute("style","display:none");
		}
		if (notify) { notify(); }
	},
           StartJoustingEvent : function(notify) {
		var t = Tabs.Boss;
		var params = uW.Object.clone(uW.g_ajaxparams);
		params.eventId = uW.cm.JoustingModel.getEventId();
		params.userId = uW.tvuid;
		new MyAjaxRequest(uW.g_ajaxpath+"ajax/championJoustingEvent.php"+uW.g_ajaxsuffix,{
			method:"post",
			parameters:params,
			onSuccess:function(rslt) {
				if (rslt.ok){
					Clicks = parseIntNan(uW.ksoItems[t.CurrentJousting.clickItemId].count);
					rslt.state = 1;
					uW.cm.JoustingModel.updateEvent(uWCloneInto(rslt));
					Seed.items["i"+t.CurrentJousting.clickItemId] = parseIntNan(uW.ksoItems[t.CurrentJousting.clickItemId].count);
					actionLog(Number(parseIntNan(rslt.clicks)-Clicks)+' '+uW.itemlist["i"+t.CurrentJousting.clickItemId].name+' Collected','Jousting');
					if (notify) { notify(); }
				}
			}
		},true);
	},
            eventDoJousting: function () {
		var t = Tabs.Boss;
                var div = $("pbJousting_info");
                var params = uW.Object.clone(uW.g_ajaxparams);
		params.champid = t.championId;
		params.eventId = uW.cm.JoustingModel.getEventId();
		params.clickCost = t.CurrentJousting.cost;
		params.userId = uW.tvuid;
		params.clicks = parseIntNan(uW.ksoItems[t.CurrentJousting.ClickItemId].count)
		new MyAjaxRequest(uW.g_ajaxpath+"ajax/championJoustingFight.php"+uW.g_ajaxsuffix,{
			method:"post",
			parameters:params,
			onSuccess:function(rslt) {
				if (rslt.ok){
					t.ClicksLeft = t.ClicksLeft - t.CurrentJousting.cost;
					var FightText = "";
					if (parseIntNan(rslt.health)>0) {
						FightText = uW.g_js_strings.Jousting["tier_names_"+t.getJoustingTier(t.CurrentJousting.level)]+' - '+uW.g_js_strings.commonstr.level+'&nbsp;'+t.CurrentJousting.level+' - <b>'+tx('Defeat')+'!&nbsp</b>'+tx('Remaining Health')+':&nbsp;'+parseIntNan(rslt.health)+"%";
						if (Options.BossOptions.StopIfDefeated) {
							FightText = '<span style="color:#800;">'+tx('Boss Battle Stopped')+'</span><br>'+FightText;
							ById('pbJoustingCancel').firstChild.innerHTML = uW.g_js_strings.commonstr.close;
							t.isBusy = false;
						}
					}
					else {
						FightText = uW.g_js_strings.Jousting["tier_names_"+t.getJoustingTier(t.CurrentJousting.level)]+' - '+uW.g_js_strings.commonstr.level+'&nbsp;'+t.CurrentJousting.level+' - <b>'+tx('Victory')+'!&nbsp;</b>';
						if (rslt.loot) {
							var loot={};
							for (var i=0;i<rslt.loot.length;i++) {
								if (typeof loot[rslt.loot[i].itemId] !== "undefined") {
									loot[rslt.loot[i].itemId] += +rslt.loot[i].quantity;
								} else {
									loot[rslt.loot[i].itemId] = +rslt.loot[i].quantity;
								}
								FightText = '<span>'+tx('You received')+' '+rslt.loot[i].quantity+' '+ uW.itemlist["i"+rslt.loot[i].itemId].name+'</span><br>'+FightText;
							}
							uW.update_inventory(uWCloneInto(loot));
						}
					}
					div.innerHTML = '<span>'+FightText+'</span><br>'+div.innerHTML;
					uW.ksoItems[t.CurrentJousting.clickItemId].count=parseIntNan(rslt.clicks);
					Seed.items["i"+t.CurrentJousting.clickItemId] = parseIntNan(uW.ksoItems[t.CurrentJousting.clickItemId].count);
                                        CM.JoustingModel.updateEvent(uWCloneInto(rslt));
                                        if (parseIntNan(rslt.health)<=0) {
						params.userId=uW.tvuid;
						params.eventId = uW.cm.JoustingModel.getEventId();
						new MyAjaxRequest(uW.g_ajaxpath+"ajax/championJoustingEvent.php"+uW.g_ajaxsuffix,{method:"post",parameters:params,
							onSuccess:function(rslt) {
								if (rslt.ok){
									CM.JoustingModel.updateEvent(uWCloneInto(rslt));
									setTimeout(t.nextfight, 500);
								}
								else {
									div.innerHTML = '<span style="color:#800;">'+tx('Server Error')+' '+rslt.debug+'</span><br>'+div.innerHTML;
									ById('pbJoustingCancel').firstChild.innerHTML = uW.g_js_strings.commonstr.close;
									t.isBusy = false;
								}
							},
							onFailure: function () {
								div.innerHTML = '<span style="color:#800;">'+tx('Server Error')+'!</span><br>'+div.innerHTML;
								ById('pbJoustingCancel').firstChild.innerHTML = uW.g_js_strings.commonstr.close;
								t.isBusy = false;
							},
						},true);
					}
					else {
						setTimeout(t.nextfight, 500);
					}
				}
				else {
					div.innerHTML = '<span style="color:#800;">'+tx('Server Error')+' '+rslt.debug+'</span><br>'+div.innerHTML;
					ById('pbJoustingCancel').firstChild.innerHTML = uW.g_js_strings.commonstr.close;
					t.isBusy = false;
					// try and fix
					params.userId=uW.tvuid;
					params.eventId = uW.cm.JoustingModel.getEventId();
					new MyAjaxRequest(uW.g_ajaxpath+"ajax/championJoustingEvent.php"+uW.g_ajaxsuffix,{method:"post",parameters:params,
						onSuccess:function(rslt) {
							if (rslt.ok){
								CM.JoustingModel.updateEvent(uWCloneInto(rslt));
							}
							else {
								div.innerHTML = '<span style="color:#800;">'+tx('Server Error')+' '+rslt.debug+'</span><br>'+div.innerHTML;
								ById('pbJoustingCancel').firstChild.innerHTML = uW.g_js_strings.commonstr.close;
								t.isBusy = false;
							}
						},
						onFailure: function () {
							div.innerHTML = '<span style="color:#800;">'+tx('Server Error')+'!</span><br>'+div.innerHTML;
							ById('pbJoustingCancel').firstChild.innerHTML = uW.g_js_strings.commonstr.close;
							t.isBusy = false;
						},
					},true);
				}
			},
			onFailure: function () {
				div.innerHTML = '<span style="color:#800;">'+tx('Server Error')+'!</span><br>'+div.innerHTML;
				ById('pbJoustingCancel').firstChild.innerHTML = uW.g_js_strings.commonstr.close;
				t.isBusy = false;
			},
		},true);
    },
            show : function (){
		var t = Tabs.Boss;
		if (!t.isBusy) {
			var m = '<DIV class=divHeader align=center>'+uW.g_js_strings.jousting.modal_title.toUpperCase()+'</div>';
			m += '<div style="min-height:400px;">';
			if (t.ValidJousting) {
				var str = t.CurrentJousting.JoustingArtString;
				var now = uW.unixtime();
				var end = parseIntNan(t.CurrentJousting.endTime);
				var elem = ById("bttcJousting");
				if (end-now>0) {
					m += '<br><DIV align=center>';
					m += uW.g_js_strings.Jousting.quest_ends.replace("%1$s","")+' <span btJoustingEndTime>'+timestr(end-now)+'</span><br><br>';
					m += '<b>'+uW.g_js_strings.jousting["name_"+str]+'</b><br>';
					m += uW.g_js_strings.jousting["description_"+str]+'<br><br>';
					m += uW.g_js_strings.Jousting["tier_names_"+t.getJoustingTier(t.CurrentJousting.level)]+' - '+uW.g_js_strings.commonstr.level+'&nbsp;'+t.CurrentJousting.level+'<br><br>';
					m += '</div><div align=center><table class=xtab>';
					m += '<TR><td align=right>'+uW.itemlist["i"+t.CurrentJousting.clickItemId].name+':&nbsp;</td><td><b>'+(Seed.items["i"+t.CurrentJousting.clickItemId]?Seed.items["i"+t.CurrentJousting.clickItemId]:0)+'</b></td></tr>';
					m += '<TR><td align=right>'+tx('Cost per joust')+':&nbsp;</td><td><b>'+t.CurrentJousting.cost+'</b></td></tr>';
					m += '<TR><td align=right>'+tx('Amount to Use')+':</td><td><INPUT size=4 id=btJoustingItemAmount type=text value="'+t.clicksLeft+'"></td></tr>';
					m += '</table></div><DIV align=center>'+uW.g_js_strings.Jousting.yourChampion+': <select id=btJoustingChamp>';
					var champ = Seed.champion.champions;
					for (var ch=0;ch<champ.length;ch++) {
						currentch=champ[ch];
						m += '<option value="'+currentch.championId+'" '+((currentch.championId==t.championId)?'selected':'')+'>'+currentch.name + '</option>';
					}
					m+='</select></div>';
					m+='<br><br><center><input type=button value="'+uW.g_js_strings.modal_mmb.playnow+'" id=btBossStart></center>';
				}
				else {
					m += '<br><div align=center>'+tx('No active event')+'</div>';
				}
			}
			else {
				m += '<br><div align=center>'+tx('No active event')+'</div>';
			}
			m += '</div>';
			m += '<div align=center><div style="position:absolute;bottom:0px;width:'+GlobalOptions.btWinSize.x+'px;"><br><hr>';
			m += '<form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_blank">\
					<input type="hidden" name="cmd" value="_s-xclick">\
					<input type="hidden" name="hosted_button_id" value="8VEDPV3X9X82L">\
					<input type="image" src="https://www.paypalobjects.com/en_US/GB/i/btn/btn_donateCC_LG.gif" border="0" name="submit" alt="PayPal  The safer, easier way to pay online!">\
					<img alt="" border="0" src="https://www.paypalobjects.com/en_GB/i/scr/pixel.gif" width="1" height="1">\
					</form>';
			m += '<br>'+tx('This additional tab has been provided free of charge for the benefit of players. Please donate to help with future support and development of this and other features')+'.<br>'+tx('Thanks')+',&nbsp;Barbarossa.<br>&nbsp;</div></div>';
			
			t.myDiv.innerHTML = m;
			ResetFrameSize('btMain',100,GlobalOptions.btWinSize.x);
                     if (t.ValidJousting) {
				ById('btJoustingItemAmount').addEventListener('change', function(){
					t.ClicksLeft = parseIntNan(ById('btJoustingItemAmount').value);
					ById('btJoustingItemAmount').value = t.ClicksLeft;
				} , false);
				ById('btJoustingEvent').addEventListener('click', function(){t.start();} , false);
			}
		}
		else { // reset curtain position..
			t.setCurtain(true);
		}
  },
	   getJoustingTier : function(lvl) {
		var t = Tabs.Boss;
		for (var k=0;k<t.CurrentJousting.tiers.length;k++) {
			if (lvl>=t.CurrentJousting.tiers[k][0] && lvl<=t.CurrentJousting.tiers[k][1]) {
				return k;
			}
		}
		return (t.CurrentJousting.tiers.length-1); // must be highest level!
   },
           getJoustingMatchMakingOpponents : function(opponent){
                 var t = Tabs.Boss;
                 for (var j=0;j<t.CurrentJousting.matchmakingopponents.length;j++) {
                    if(opponent>=t.CurrentJousting.matchmakingopponents[j][0] && opponent<=t.CurrentJousting.matchmaking[j][1]) {
		    }
		 }
   },
           setPopup: function (onoff) {
		var t = Tabs.Boss;
		if (onoff) {
			var div = document.createElement('div');
			div.id = 'ptJoustingPop';
			div.style.backgroundColor = '#fff';
			div.style.zindex = mainPop.div.zIndex + 2;
			div.style.opacity = '1';
			div.style.border = '3px outset black';
			div.style.width = (GlobalOptions.btWinSize.x-200)+'px';
			div.style.height = '300px';
			div.style.display = 'block';
			div.style.position = 'absolute';
			div.style.top = '100px';
			div.style.left = '100px';
			t.myDiv.appendChild(div);
			return div;
		} else {
			t.myDiv.removeChild(ById('ptJoustingPop'));
		}
  },
	    setCurtain: function (onoff) {
		var t = Tabs.Boss;
		if (onoff) {
			var off = getAbsoluteOffsets(t.myDiv);
			var curtain = ById('ptJoustingCurtain');
			if (!curtain) {
				curtain = document.createElement('div');
				curtain.id = 'ptJoustingCurtain';
				curtain.style.zindex = mainPop.div.zIndex + 1;
				curtain.style.backgroundColor = "#000000";
				curtain.style.opacity = '0.5';
				curtain.style.display = 'block';
				curtain.style.position = 'absolute';
				t.myDiv.appendChild(curtain);
			}
			curtain.style.width = (t.myDiv.clientWidth+4) + 'px';
			curtain.style.height = (t.myDiv.clientHeight+4) + 'px';
			curtain.style.top = off.top + 'px';
			curtain.style.left = off.left + 'px';
		} else {
			t.myDiv.removeChild(ById('ptJoustingCurtain'));
		}
     },
             e_Cancel: function () {
		var t = Tabs.Boss;
		if (t.isBusy) {
			t.isBusy = false;
			var div = $("pbjousting_info");
			div.innerHTML += "<br><span>"+tx('Cancelled')+"!</span>";
			ById('pbJoustingCancel').firstChild.innerHTML = uW.g_js_strings.commonstr.close;
			return;
		}
		t.setCurtain(false);
		t.setPopup(false);
		t.show();
     },
           start : function (){
		var t = Tabs.Boss;
                t.championId = ById("btJoustingChamp").value;
		if ((t.championId!=0) && (t.ClicksLeft>=t.CurrentJousting.cost)) {
			t.isBusy = true;
			t.setCurtain(true);
			var popDiv = t.setPopup(true);
			popDiv.innerHTML = '<TABLE class=xtab width=100% height=100%><TR><TD align=center>\
			<DIV class=divHeader align=center>'+tx('Jousting Battle Results')+'...</div>\
				<DIV id=pbjousting_info style="padding:10px; height:225px; max-height:225px; overflow-y:auto"></div>\
				</td></tr><TR><TD align=center>' + strButton20(uW.g_js_strings.commonstr.cancel, 'id=pbJoustingCancel') + '</td></tr></table>';
				ById('pbJoustingCancel').addEventListener('click', t.e_Cancel, false);

			t.nextfight();
		}
    },
             nextfight : function (){
		var t = Tabs.Boss;
		if(!t.isBusy)
			return;
		var div = $("pbjousting_info");
		if(t.ClicksLeft<t.CurrentJousting.cost){
			if (div) {
				div.innerHTML = "<span>"+tx('Completed')+"!</span><br>"+div.innerHTML;
				ById('pbJoustingCancel').firstChild.innerHTML = 'Close';
			}
			t.isBusy = false;
			return;
		}
		t.eventDoJousting();
	  }
},

