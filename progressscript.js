$(document).ready(function() {
	
	//This sets async:false which is NOT okay, but I can't figure out how to do it another way. If anyone can figure it out go for it, but this is how it is right now.
	loadCommits("71170842",$("#comlistgame"), 10);
    
    loadCommits("75451699",$("#comlistsite"), 10);
   
});

//Function, xtra function, param
function callAsync(f, xf, param) {
	setTimeout(function() {
		if(param != null)
			f(param);
		else
			f();
		if(xf != null)
			xf();
	},0);
}

function loadCommits(singleParam) {
	var id = singleParam.id;
	var $element = singleParam.$element;
	var max = singleParam.max;
	loadCommits(id,$element, max);
}

//This is the code in case this never works

/*
$.get("https://api.github.com/repositories/71170842/commits", function(val) {
        //This actually works
        $commitArray = val;
        var maxCommits = 10;
        var commitsString = "";
        commitsString+="<table class=\"comtable\">";
        for (var i = 0; i < maxCommits; i++) {
            commitsString+=("<tr class=\"commit-item\">");
            name = checkSubs($commitArray[i].commit.author.name) + ", " + formatDate($commitArray[i].commit.author.date);
            commitsString+=("<td>" + name + "</td>");
            comMsg = formatMessage($commitArray[i].commit.message);
            commitsString+=("<td><a href=\"" + $commitArray[i].html_url + "\">" + comMsg + "</a></td>");
            commitsString+="</tr>";
        }
        commitsString+="</table>";
        
        $("#comlistgame").html(commitsString);      //alert($commitArray[0].commit.message);
       });
*/

/*
 $.get("https://api.github.com/repositories/75451699/commits", function(val) {
        //This actually works
        $commitArray = val;
        var maxCommits = 10;
        var commitsString = "";
        commitsString+="<table class=\"comtable\">";
        for (var i = 0; i < maxCommits; i++) {
            commitsString+=("<tr class=\"commit-item\">");
            name = checkSubs($commitArray[i].commit.author.name) + ", " + formatDate($commitArray[i].commit.author.date);
            commitsString+=("<td>" + name + "</td>");
            comMsg = formatMessage($commitArray[i].commit.message);
            commitsString+=("<td><a href=\"" + $commitArray[i].html_url + "\">" + comMsg + "</a></td>");
            commitsString+="</tr>";
        }
        commitsString+="</table>";
        $("#comlistsite").html(commitsString);
        var commit1 = createCommitObject($commitArray[0]);
        var commit2 = new CommitItem($commitArray[1].commit.message,$commitArray[1].commit.author.name,$commitArray[1].commit.author.date);
        alert(commit2.compareDate(commit1));
        //alert($commitArray[0].commit.message);
       });
       */



/* This function takes the repository id, the element to insert
 * the table, and the max rows inserted. It's supposed to iterate
 * through the branches and add all the commits, then sort them by 
 * date from [0] most recent to [.length] oldest. From there it
 * takes the first max_rows and turns them into a table.
 * Right now, that doesn't work. doing /commits/branch only gives
 * the most recent commit instead of a list; so I'm trying to
 * figure out how to get all of the commits from the entire
 * repository then order them. It's very difficult (at least for 
 * me). Good luck if you wanna go try to fix this.
 
    A possible solution would be load all commits from main branch, then do other branches. As loading for other branches, dont load 
    the ones with the same SHA as the ones loaded in the main branch (check $commitObjs to get sha) (the sha isnt included yet but i'll do that soon).
 */

function loadCommits(repoId, $element, max) {
    //Also sort into order
    //First find branches
    //Get commits from each branch then order by date
    //Put top (max) in element
	$.ajaxSetup({async:false});
    $.get("https://api.github.com/repositories/" + repoId + "/branches", function(val) {
        //Retrieved
			var $branchArray = val;
			var $commitArray = [];
		
			for (var i = 0; i < $branchArray.length; i++) {
				//Inside branch i
			
				$.get("https://api.github.com/repositories/" + repoId + "/commits?sha=" + $branchArray[i].name, function(coms) {
					//At commits for branch i
					var $branchICommits = coms;
					//alert($branchICommits[i].commit.author.name);
					for(var x = 0; x < $branchICommits.length; x++) {
						$commitArray.push($branchICommits[x]);
					}
				
				});
			
			}
			var $commitObjs = [];
			//alert("Commit array length: " + $commitArray.length);
			for(var i = 0; i < $commitArray.length; i++) {
				$commitObjs.push(createCommitObject($commitArray[i]));
		}
        $commitObjs = simplifyCommitArrayToMap($commitObjs);
        $commitObjs = orderCommitObjsFromMap($commitObjs);
        //This SHOULD get all the commits
        
        //This should stop when its ordered from [0] youngest to [max] oldest;
      //  alert("length: " + $commitObjs.length);
        var commitsString = "";
        commitsString+="<table class=\"comtable\">";
        if (max > $commitObjs.length) {
            max = $commitObjs.length
        }
        for (var i = 0; i < max; i++) {
            commitsString+=("<tr class=\"commit-item\">");
            name = checkSubs($commitObjs[i].author) + ", " + formatDate($commitObjs[i].date);
            commitsString+=("<td>" + name + "</td>");
            comMsg = formatMessage($commitObjs[i].message);
            commitsString+=("<td><a href=\"" + $commitObjs[i].url + "\">" + comMsg + "</a></td>");
            commitsString+="</tr>";
        }
        commitsString+="</table>";
        
        $element.html(commitsString);
    });
	$.ajaxSetup({async:true});
}


function orderCommitObjsFromMap($commitsMap) {
    //YOu know what to do/
    var keyArray = Object.keys($commitsMap);
    var commitArray = [];
	for(var i = 0; i < keyArray.length; i++) {
		commitArray.push($commitsMap[keyArray[i]]);
	}
    var changed = true;
    while(changed) {
		changed = false;
		for(var i = 0; i < commitArray.length-1; i++) {
			if(commitArray[i].date < commitArray[i+1].date) {
				var com1 = commitArray[i];
				var com2 = commitArray[i+1];
				commitArray[i] = com2;
				commitArray[i+1] = com1;
				changed = true;
			}
		}
    }
    return commitArray;
}

function simplifyCommitArrayToMap($commits) {
    var commitMap = [];
    for(var i = 0; i < $commits.length; i++) {
        commitMap[$commits[i].sha] = $commits[i];   
    }
    return commitMap;
}

//Creates a commit object (helps reduce code lines + improve readability)
function createCommitObject(commitPre) {
    return new CommitItem(commitPre.commit.message,commitPre.commit.author.name,commitPre.commit.author.date, commitPre.html_url, commitPre.sha);
}

//Formats message to make it look nice in the table
function formatMessage(message) {
    var hasBody = message.includes("\n\n");
    var finString ="";
    if (hasBody) {
        finString+="[<strong>";
        finString+=message.substring(0,message.indexOf("\n\n")) +"</strong>]: <em><span style=\"color:gray;\">" + message.substring(message.indexOf("\n\n")) + "</span></em>";
    } else {
        finString+=message;
    }
    return finString;
    
}


//Constructor for CommitItem(msg,auth,date,url)
var CommitItem = function(message,author,date,url,sha) {
    this.author = author;
    this.message = message;
    this.date = date;
    this.url = url;
    this.sha = sha;
    this.equals = function(commit) {
        return (this.sha === commit.sha);   
    }
    //Compares two commit dates
    this.compareDate = function(commit) {
          //Return 0 for same (almost impossible), 1 for older, -1 for younger
        var thisTime = this.getDateAsTime();
        var thatTime = commit.getDateAsTime();
        //The greater the time the closer to now it is
        if(thisTime > thatTime) {
            return -1;
        } else if (thisTime < thatTime) {
            return 1;
        }
        return 0;
        
    };
    
    //Ex: 2016.2442242114423213356 years
    this.getDateAsTime = function() {
        var thisYear = getYearFromDate(this.date);
        var thisMonth = getMonthFromDate(this.date);
        var thisDay = getDayFromDate(this.date);
        var thisHour = getHourFromDate(this.date);
        var thisMinute = getHourFromDate(this.date);
        var thisSecond = getSecondFromDate(this.date);
        //Terms of year
       // alert(thisYear + " " + thisMonth + " " + thisDay + " " + thisHour + " " + thisMinute + " " + thisSecond);
        return (thisYear) + (thisMonth / 12) + (thisDay / 365) + (thisHour / 8760) + (thisMinute / 525600) + (thisSecond / 31536000);
    }
}

//Gets the year from (commit).date
function getYearFromDate(gitDate) {
    return Number(gitDate.substring(0,4));
}

//Gets the day from (commit).date
function getDayFromDate(gitDate) {
    return Number(gitDate.substring(5,7));
}

//Gets the month from (commit).date
function getMonthFromDate(gitDate) {
    return Number(gitDate.substring(8,10));
}
//Gets the hour from (commit).date
function getHourFromDate(gitDate) {
    return Number(gitDate.substring(11,13));
}

//Gets the minute from the (commit).date
function getMinuteFromDate(gitDate) {
    return Number(gitDate.substring(14,16));
}

//2  0  1  6  -  1  2  -  0  7  T  0  3  :  4  3  :  0  7  Z
//00 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 17 18 19

//Gets the second from (commit).date
function getSecondFromDate(gitDate) {
    return Number(gitDate.substring(17,19));
}


//Format date to look like dd/mm/yyyy
function formatDate(gitDate) {
    var year = gitDate.substring(0,4);
    var day = gitDate.substring(5,7);
    var month = gitDate.substring(8,10);
    return day + "/" + month + "/" + year;
}


//Check for different than normal names
function checkSubs(name) {
    if (name === "MadelynCarr" || name ==="xDestx" || name === "zcarr8445" || name === "xDest | Zach") {
        return "Zachary";
    }
    if (name === "kngo0784" || name === "UltimateSmee") {
        return "Kaleo";
    }
    return name;
}
