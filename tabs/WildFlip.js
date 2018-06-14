/*************************** WILD FLIP ********************************/
// @tabversion 20171101

var MAP_SFIELD = 20;
function XMapAjax (){
  this.normalize = normalize;  
  this.request = request;

  function request (left, top, width, notify){
  if(MAP_DELAY_WATCH > Number(unsafeWindow.unixtime())) {
  	notify(left, top, width,  {"ok":false});
  	return;//we're slowing down the requests so the server doesn't get bogged.
  };
    var left = parseInt(left / 5) * 5;
    var top = parseInt(top / 5) * 5;
    var width = parseInt((width+4) / 5) * 5;
    
    var blockString = generateBlockList(left, top, width);
    var params = unsafeWindow.Object.clone(unsafeWindow.g_ajaxparams);
    params.blocks = blockString;
    new MyAjaxRequest(unsafeWindow.g_ajaxpath + "ajax/fetchMapTiles.php" + unsafeWindow.g_ajaxsuffix, {
      method: "post",
      parameters: params,
      onSuccess: function (rslt) {
      	if(!rslt.ok) MAP_DELAY+=100;
		MAP_DELAY_WATCH = Number(unsafeWindow.unixtime())+Number(Number(MAP_DELAY)/1000);
        notify(left, top, width, rslt);
      },
      onFailure: function (rslt) {
        notify(left, top, width, rslt);
      },
    });
    function generateBlockList (left, top, width) {
      var width5 = parseInt(width / 5);
      var bl = [];
      for (x=0; x<width5; x++){
        var xx = left + (x*5);
        if (xx > 745)
          xx -= 750;
        for (y=0; y<width5; y++){
          var yy = top + (y*5);
          if (yy > 745)
            yy -= 750;
          bl.push ('bl_'+ xx +'_bt_'+ yy);
        }
      }
      return bl.join("%2C");
    }
  }
 
  function normalize  (x){
    if ( x >= 750)
      x -= 750;
    else if (x < 0)
      x += 750;
    return parseInt (x/5) * 5;
  }
}

var thief = {
    active: false,
    xcoord: 0,
    ycoord: 0,
    data: [],
    city: 0,
    targetally: 0,
    wildsnap: [],
    minslots: 0,
    cavs: 3000,
    donesearch: false,
    stolen: 0,
};

Tabs.WildFlip = {
    tabOrder: 8000,
    tabColor: 'brown',
    tabLabel: 'Wild Flip',
    MapAjax: new XMapAjax(),
    myDiv: null,
    tcheck: new XMapAjax(),
    knt: {},
    choice: 0,

    init: function(div) {
        var t = Tabs.WildFlip
        t.readthief();
        t.myDiv = div;
        var selbut = 0;
        if (thief.active) setTimeout(function() {
            t.MapAjax.request(thief.xcoord, thief.ycoord, MAP_SFIELD, t.mapCallback)
        }, 30000);
        setInterval(t.attack, MAP_SFIELD * 1000);

        var m = '<DIV class=divHeader align=center>Wild Thief</div><br>';
        m += '<table><td><input type=submit id=thiefstat value="Thief = ' + (thief.active ? 'ON' : 'OFF') + '" /></td><td><input type=submit id=thiefreset value="reset"/></td></table><br>';
        m += '<DIV id="flipresults" style="height:70; max-height:70px;"> Last Searched: ' + thief.xcoord + ',' + thief.ycoord + '<br> Found: ' + thief.data.length + '<br> Flipped: ' + thief.stolen + '</div>';
        m += '<table><TR align="left"><TD>Attack from: </td> <TD width=310px><DIV style="margin-bottom:10px;"><span id=pwildcity></span></div></td></tr></table>';
        m += '<table><tr><TD>Cavalry to send: </TD><td><INPUT id=wildcav type=text size=6 maxlength=6 value=' + thief.cavs + ' \></td></tr>';
        m += '<tr><TD>Rally slots to keep free: </TD><td><INPUT id=wildmins type=text size=3 maxlength=2 value=' + thief.minslots + ' \></td></tr>';
        m += '<tr><TD>Target from hostile list: </td><td><SELECT id="targetalliance">\
        <option value=0><CENTER>---</center></option>';
        for (i in Seed.allianceDiplomacies.hostile) {
            m += '<option value=' + Seed.allianceDiplomacies.hostile[i].allianceId + '>' + Seed.allianceDiplomacies.hostile[i].allianceName + '</option>';
        };
        m += '</select></tr></table>';
        m += '<br>';
        div.innerHTML = m;

        for (var i = 0; i < Seed.cities.length; i++) {
            if (thief.city == Seed.cities[i][0]) {
                selbut = i;
                break;
            }
        }

        t.tcp = new CdispCityPicker('pwildcityselect', document.getElementById('pwildcity'), true, null, selbut);
        document.getElementById('wildcav').addEventListener('change', function() {
            thief.cavs = this.value;
            t.savethief();
        }, false);
        document.getElementById('wildmins').addEventListener('change', function() {
            thief.minslots = this.value;
            t.savethief();
        }, false);


        document.getElementById('pwildcity').addEventListener('click', function() {
            if (thief.active) t.e_toggleswitch(document.getElementById('thiefstat'));
            thief.city = t.tcp.city.id;
            t.savethief();
        }, false);

        document.getElementById('thiefstat').addEventListener('click', function() {
            t.e_toggleswitch(this);
        }, false);
        document.getElementById('thiefreset').addEventListener('click', function() {
            t.reset();
        }, false);

        document.getElementById('targetalliance').value = thief.targetally;
        document.getElementById('targetalliance').addEventListener('change', function() {
            thief.targetally = this.value;
            t.savethief();
        }, false);


    },
    hide: function() {
        var t = Tabs.WildFlip;
    },

    show: function() {
        var t = Tabs.WildFlip;
    },
    reset: function() {
        var t = Tabs.WildFlip;
        thief.xcoord = 0;
        thief.ycoord = 0;
        thief.data = [];
        thief.donesearch = false;
        t.savethief();
    },
    e_toggleswitch: function(obj) {
        var t = Tabs.WildFlip;
        if (thief.active) {
            obj.value = "Thief = OFF";
            thief.active = false;
        } else {
            obj.value = "Thief = ON";
            t.getwilds();
            thief.active = true;
            setTimeout(function() {
                t.MapAjax.request(thief.xcoord, thief.ycoord, MAP_SFIELD, t.mapCallback)
            }, MAP_DELAY);
        }
        t.savethief();
    },

    mapCallback: function(left, top, width, rslt) {
        var t = Tabs.WildFlip;
        if (!thief.active) return;
        if (!rslt.ok) {
            setTimeout(function() {
                t.MapAjax.request(thief.xcoord, thief.ycoord, MAP_SFIELD, t.mapCallback)
            }, MAP_DELAY);
            return;
        }
        if (rslt.error_code) {
            setTimeout(function() {
                t.MapAjax.request(thief.xcoord, thief.ycoord, MAP_SFIELD, t.mapCallback)
            }, MAP_DELAY);
            return;
        }
        map = rslt.data;
        if (rslt.allianceNames) if (rslt.allianceNames['a' + thief.targetally]) {
            for (i in map) {
                // 0:bog, 10:grassland, 11:lake, 20:woods, 30:hills, 40:mountain, 50:plain, 51:city / barb, 53:misted city
                if (map[i].tileType == 10 || map[i].tileType == 11 || map[i].tileType == 20 || map[i].tileType == 30 || map[i].tileType == 40 || map[i].tileType == 50) if (map[i].tileUserId) {
                    if (rslt.userInfo['u' + map[i].tileUserId] != undefined) if (rslt.userInfo['u' + map[i].tileUserId].a == thief.targetally) {
                        thief.data.push({
                            x: map[i].xCoord,
                            y: map[i].yCoord
                        });
                    }
                };
            };
        };
        document.getElementById('flipresults').innerHTML = 'Searching: ' + thief.xcoord + ',' + thief.ycoord + '<br> Found: ' + thief.data.length + '<br> Flipped: ' + thief.stolen;

        if (left >= 740) {
            if (top >= 740) {
                document.getElementById('flipresults').innerHTML = 'Search Complete<br> Found: ' + thief.data.length + '<br> Flipped: ' + thief.stolen;
                thief.donesearch = true;
                t.savethief();
                //we're done, figure something out.
                return;
            }


            thief.xcoord = t.MapAjax.normalize(0);
            thief.ycoord = t.MapAjax.normalize(top + MAP_SFIELD);
        } else if (left < 750) {
            thief.xcoord = t.MapAjax.normalize(left + MAP_SFIELD);
            thief.ycoord = t.MapAjax.normalize(top);
        };
        t.savethief();

        setTimeout(function() {
            t.MapAjax.request(thief.xcoord, thief.ycoord, MAP_SFIELD, t.mapCallback)
        }, MAP_DELAY);
    },
    getwilds: function() {
        var t = Tabs.WildFlip;
        thief.wildsnap = [];
        var wilds = unsafeWindow.seed.wilderness['city' + thief.city];
        if (wilds) for (k in wilds) {
            if (!thief.wildsnap[wilds[k].tileId]) thief.wildsnap.push(wilds[k].tileId);
        }
        t.savethief();
    },

    dropwilds: function() {
        if (!thief.active) return;
        var t = Tabs.WildFlip;
        var wilds = unsafeWindow.seed.wilderness['city' + thief.city];
        var times = 0;
        if (wilds) for (k in wilds) {
            var dropping = true;
            var tid = wilds[k].tileId
            for (i in thief.wildsnap) {
                if (thief.wildsnap[i] == tid) {
                    dropping = false;
                    break;
                };
            };
            if (dropping) new t.abandonWilderness(wilds[k].tileId, wilds[k].xCoord, wilds[k].yCoord);
        }
    },
    abandonWilderness: function(tid, x, y) {
        var t = Tabs.WildFlip;
        var params = unsafeWindow.Object.clone(unsafeWindow.g_ajaxparams);
        var cityID = thief.city;
        var tileid = tid;
        params.tid = tid;
        params.cid = thief.city;
        params.x = x;
        params.y = y;
        new MyAjaxRequest(unsafeWindow.g_ajaxpath + "ajax/abandonWilderness.php" + unsafeWindow.g_ajaxsuffix, {
            method: "post",
            parameters: params,
            loading: true,
            onSuccess: function(rslt) {
                if (rslt.ok) {
                    thief.stolen += 1;
                    t.savethief();
                    if (rslt.returningMarches) {
                        var cities = Object.keys(rslt.returningMarches);
                        for (var i = 0; i < cities.length; i++) {
                            for (var j = 0; j < rslt.returningMarches[cities[i]].length; j++) {
                                var cid = cities[i].split("c")[1];
                                var mid = rslt.returningMarches[cities[i]][j];
                                var march = Seed.queue_atkp["city" + cid]["m" + mid];
                                if (march) {
                                    var marchtime = Math.abs(parseInt(march.destinationUnixTime) - parseInt(march.marchUnixTime));
                                    var ut = unsafeWindow.unixtime();
                                    Seed.queue_atkp["city" + cid]["m" + mid].destinationUnixTime = ut;
                                    Seed.queue_atkp["city" + cid]["m" + mid].marchUnixTime = ut - marchtime;
                                    Seed.queue_atkp["city" + cid]["m" + mid].returnUnixTime = ut + marchtime;
                                    Seed.queue_atkp["city" + cid]["m" + mid].marchStatus = 8
                                }
                            }
                        }
                    }
                    if (Object.keys(Seed.wilderness["city" + cityID]).length == 1) {
                        Seed.wilderness["city" + cityID] = uWCloneInto([]);
                    } else {
                        delete Seed.wilderness["city" + cityID]["t" + tileid];
                    }
                } else {
                    if (rslt.error_code != 401) {}
                }
            },
            onFailure: function() {}
        },true);
    },

    getAtkKnight: function(cityID) {
        var t = Tabs.WildFlip;
        var knt = new Array();
        for (k in Seed.knights[cityID]) {
            if (Seed.knights[cityID][k]["knightStatus"] == 1 && Seed.leaders[cityID]["resourcefulnessKnightId"] != Seed.knights[cityID][k]["knightId"] && Seed.leaders[cityID]["politicsKnightId"] != Seed.knights[cityID][k]["knightId"] && Seed.leaders[cityID]["combatKnightId"] != Seed.knights[cityID][k]["knightId"] && Seed.leaders[cityID]["intelligenceKnightId"] != Seed.knights[cityID][k]["knightId"]) {
                knt.push({
                    Name: Seed.knights[cityID][k]["knightName"],
                    Combat: parseInt(Seed.knights[cityID][k]["combat"]),
                    ID: Seed.knights[cityID][k]["knightId"],
                });
            }
        }
        knt = knt.sort(function sort(a, b) {
            a = parseInt(a['Combat']);
            b = parseInt(b['Combat']);
            return a == b ? 0 : (a > b ? -1 : 1);
        });
        if (knt[0]) return knt[0].ID;
        else return;
    },

    sendMarch: function(x, y) {
        var t = Tabs.WildFlip;
        var params = unsafeWindow.Object.clone(unsafeWindow.g_ajaxparams);
        params.cid = thief.city;
        params.type = 4;
        params.kid = t.getAtkKnight('city' + thief.city);
        params.xcoord = x;
        params.ycoord = y;
        params.u7 = thief.cavs;
        //params.u8 = thief.cavs;


        March.addMarch(params, function(rslt) {
            if (rslt.ok) {
                document.getElementById('flipresults').innerHTML = 'Search Complete<br> Found: ' + thief.data.length + 'Flipped: ' + thief.stolen + '<br>Marching to ' + x + ',' + y;

                return;
            } else { //onFailure
            }
        });
    },

    tiles: function(left, top, width, rslt) {
        var t = Tabs.WildFlip;
        if (!thief.active) return;
        if (!rslt.ok) {
            setTimeout(function() {
                t.tcheck.request(left, top, MAP_SFIELD, t.tiles)
            }, MAP_DELAY);
            return;
        }
        if (rslt.error_code) {
            setTimeout(function() {
                t.tcheck.request(left, top, MAP_SFIELD, t.tiles)
            }, MAP_DELAY * 10);
            return;
        }
        var wild = rslt.data['l_' + thief.data[t.choice].x + '_t_' + thief.data[t.choice].y];
        if (rslt.userInfo['u' + wild.tileUserId].a == thief.targetally) {
            t.sendMarch(thief.data[t.choice].x, thief.data[t.choice].y);

        };

        thief.data.splice(t.choice, 1);
        t.savethief();
        return;

    },

    attack: function() {
        var t = Tabs.WildFlip;
        if (!thief.active) return;
        t.dropwilds();
        if (!thief.donesearch) return;
        if (March.getEmptySlots < thief.minslots) return;
        if (unsafeWindow.seed.units['city' + thief.city].unt7 < thief.cav) return;
        if (thief.data.length > 0) {
            t.choice = Math.floor(thief.data.length * Math.random())
            logit('tiles');
            t.tcheck.request(thief.data[t.choice].x, thief.data[t.choice].y, MAP_SFIELD, t.tiles);
        } else {
            t.reset();
            setTimeout(function() {
                t.MapAjax.request(thief.xcoord, thief.ycoord, MAP_SFIELD, t.mapCallback)
            }, 30000);
        }
    },

    readthief: function() {
        var serverID = getServerId();
        s = GM_getValue('thief_' + uW.tvuid + '_' + serverID);
        if (s != null) {
            opts = JSON2.parse(s);
            for (k in opts) {
                if (matTypeof(opts[k]) == 'object') for (kk in opts[k])
                thief[k][kk] = opts[k][kk];
                else thief[k] = opts[k];
            }
        }
    },

    savethief: function() {
        var serverID = getServerId();
        setTimeout(function() {
            GM_setValue('thief_' + uW.tvuid + '_' + serverID, JSON2.stringify(thief));
        }, 0);
    },

}
