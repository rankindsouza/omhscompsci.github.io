$(document).ready(function() {
    loadCommits("75451699",$("#comlistsite"), 10);
});

var completedCommitMap = [];
/*
    format:
        
        completedCommitMap[key] = LoadCommitTask;
 */
var LoadCommitTask = function(updatesNeeded, element) {
    this.updatesNeeded = updatesNeeded;
    this.updates = 0;
    this.$element = element;
    this.$commits = [];
    this.updateTask() = function($commitArray) {
        updates++;
        for (var i = 0; i < $commitArray.length; i++) {
            $commits.push($commitArray[i]);
        }
        if(updates>=updatesNeeded) { 
            $commits = simplifyCommitArrayToMap($commits);
            //Turn the commit array into a map of commits. This eliminates duplicates
            $commits = orderCommitObjsFromMap($commits);
            //Turn the commit map into an array of commits. This allows chronological ordering.
        }
    }
}

function loadCommits(repoId, $element, max) {
    //Step one, load branches
    //var commitTask = null;
    var $branchArray = null;
    var $commitArray = [];
    var req = $.ajax("https://api.github.com/repositories/" + repoId + "/branches", {
        success: function(data) {
            //Step two, loadcommits for branches
            $branchArray = data;
            alert("Howdy");
            //commitTask = new LoadCommitTask($branchArray.length,$element);
        },
        error: function() {
            alert("Error loading commits");
        }
    });
    
    $.when(req).done(function() {
        alert("Howdy 2, " + $branchArray[0].name);
            //Load all branches commits into one array
            loadBranch($branchArray.length-1, $branchArray, $commitArray, repoId);
    }).then(function() {
        alert("Golly gee " + $commitArray.length);
        $commitObjs = [];
        for(var i = 0; i < $commitArray.length; i++) { 
            $commitObjs.push(createCommitObject($commitArray[i]));
        }
        $commitObjs = simplifyCommitArrayToMap($commitObjs);
        $commitObjs = orderCommitObjsFromMap($commitObjs);
        
        //Write to element
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
    
}

function loadBranch(branchNumber, $branchArray, $commitArray, repoId) {
    if(!(branchNumber < 0)) {
        alert("Howdy 3 - " + branchNumber);
        var req = $.ajax("https://api.github.com/repositories/" + repoId + "/commits?sha=" + $branchArray[branchNumber].name, {
            success: function(data) {
                var $branchCommits = data;
                //Array
                for(var i = 0; i < $branchCommits.length; i++) {
                    $commitArray.push($branchCommits[i]);
                }
                alert("This should be before Cowboys");
            },
            
            error: function() {
                alert("Error loading branch " + branchNumber);
            }
        }).done(function() {
            alert("Cowboys");
           loadBranch(branchNumber-1,$branchArray,$commitArray);
        });
    }
}

function loadBranchlist() {
    var $ba = null;
    $.ajax("https://api.github.com/repositories/" + "75451699" + "/branches", {
        success: function(val) {
            $ba = val;
        }
    }).done(function() {
        return $ba;
    });
    
}



/*    D E F A U L T  F U N C T I O N S    */

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