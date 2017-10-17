//bind a function to the name and champion name submit form that takes that information and sends it to the server
    //to-do check if user is an existing user or not
//server retrieves the user's summonerId from database to query riot API
//server returns summonerId. client makes request to matchList endpoint with this summoner ID.
//server makes an http request to matchList endpoint () and sends data back to the client
//client is then going to check to see what needs to be sent to d3 data vis
//A. everything is updated and client just needs to send deaths array
      //1. no need to store data so just render heatmap
//B. need to make request to matchData to get more data points
      //1. client goes through the matchList and stores all of the match Id's that need to be checked in a new array
        // this will either be 10 matches or it will be until the old matchId has been found
      //2. client sends matchId one at a time to matchData endpoint on server to handle getting the data
        // client will recieve matchData and go through it adding the necessary points to the death array
      //3. old death array and new death array will be combined
      //4. information is up to date and can be sent over to data vis

document.addEventListener('DOMContentLoaded', checkDetails);

/*********
Function: CheckUser
Description: Send request to backend to determine if searched summoner is already in the database.
Input: None
Output:
*********/
function checkDetails()
{
  document.getElementById('Submit').addEventListener('click', function(event)
  {

    var opts = {
    lines: 13,
    // The number of lines to draw
    length: 7,
    // The length of each line
    width: 4,
    // The line thickness
    scale: 3,
    //scales overall size of the spinner
    radius: 10,
    // The radius of the inner circle
    corners: 1,
    // Corner roundness (0..1)
    rotate: 0,
    // The rotation offset
    color: '#000',
    // #rgb or #rrggbb
    speed: 1,
    // Rounds per second
    trail: 60,
    // Afterglow percentage
    shadow: false,
    // Whether to render a shadow
    hwaccel: false,
    // Whether to use hardware acceleration
    className: 'spinner',
    // The CSS class to assign to the spinner
    zIndex: 2e9,
    // The z-index (defaults to 2000000000)
    top: 'auto',
    // Top position relative to parent in px
    left: '50%',
    // Left position relative to parent in px
    visibility: true };

    document.getElementById('spinnerContainer').after(new Spinner(opts).spin().el);

    //get form data from the user
    var summName = document.getElementById('summName').value;
    var champName = document.getElementById('champName').value;


    //exampleUser skips API calls and instead uses built-in DB data to show off heatmap functionality
    if (summName == "exampleUser" && champName == "exampleChamp") {
      console.log("example achieved!")
      heatmap();
    }

    else {
      serverCheckUser(0).then(checkUserResponse, checkUserRetry);
    }
  });
}

function serverCheckUser(count) {
  return new Promise(function(resolve, reject) {
    var summName = document.getElementById('summName').value;
    var champName = document.getElementById('champName').value;
    // new req to check if user is in DB
    var req = new XMLHttpRequest();
    req.open("GET", "http://lolheatmap.com/checkUser?name=" + summName + "&champ=" + champName, true)
    req.send(null);
    req.addEventListener('load', function()
    {
      var resp = JSON.parse(req.response);
      if (resp == '429') {
        reject(count);
      }

      else {
        resolve(resp);
      }
    })
  });
}

//to-do: see if we can make this a re-usable function - problem is need to know name of function to call next
function checkUserResponse(resp) {
  if (resp == '500') {
    window.location.assign("http://lolheatmap.com/error");
  }

  if (resp == 'noData') {
    console.log("summoner does not exist");
    window.location.assign("http://lolheatmap.com/noData");
    return;
  }

  else {
    console.log("inside check user response", resp);
    var response = {};
    getMatchList(0).then(getMatchListResponse, getMatchListRetry);
  }
}

//to-do: see if we can make this a re-usable function - problem is need to know name of function to call again
function checkUserRetry(count) {
  // if 5 successive requests result in 429 requests then too many requests going out currently - stop trying
  if (count == 5) {
    // server under too much load page
    window.location.assign("http://lolheatmap.com/serverError")
  }
  else {
    //wait one second before trying the call again but increment the number of times it has been tried
    window.setTimeout( function() {
      serverCheckUser(count+1).then(getMatchList, checkUserRetry);
    }, 1000);
  }
}

function getMatchList(count)
{
  var summName = document.getElementById('summName').value;
  var champName = document.getElementById('champName').value;

  return new Promise(function(resolve,reject) {
    var req = new XMLHttpRequest();
    req.open("GET", "http://lolheatmap.com/matchList?name=" + summName + "&champ=" + champName, true)
    req.send(null);
    req.addEventListener('load', function()
    {
      var resp = JSON.parse(req.response);
      console.log("inside promise response is: ", resp);
      if (resp == '429') {
        reject(count);
      }

      else {
        resolve(resp);
      }

    })
  })
}

function getMatchListResponse(summ) {
  console.log("inside get match list resp summ is: ", summ);
  var matchList = summ.matchList;
  //set up error handling
  if (summ == '500') {
    window.location.assign("http://lolheatmap.com/error");
  }

  if (summ == 'noData') {
    console.log("summoner does not exist");
    window.location.assign("http://lolheatmap.com/noData");
    return;
  }


  if (summ.recentMatchId == matchList.matches[0].gameId)
  {
    console.log("skipped getting coordinates");
    heatmap();
  }

  else
  {
    var traceBack = 20;
    if (summ.recentMatchId)
    {
      while (matchList.matches[traceBack].gameId != summ.recentMatchId)
      {
        console.log("current match is: " + matchList.matches[traceBack].gameId)
        console.log("match to stop at is: " + summ.recentMatchId)
        traceBack = traceBack + 1;
      }
      if (traceBack > 20) {
        traceBack = 20;
      }
    }
    //console.log("number of games to go backwards = " + traceBack);
    //console.log("calling getMatchData");
    summ.recentMatchId = matchList.matches[0].gameId;
    summ.traceBack = traceBack;
    summ.count = 0;
    console.log(summ);
    /*
    if (summ.traceBack == 0) {
      newMatchData(summ);
    }
    else {
      traceBackMatchData(summ);
    }
    */
    getMatchData(summ, matchList, traceBack);
  }
}

//to-do: see if we can make this a re-usable function - problem is need to know name of function to call again
function getMatchListRetry(count) {
  // if 5 successive requests result in 429 requests then too many requests going out currently - stop trying
  if (count == 5) {
    // server under too much load page
    addCoordinate("pass in -1 as something to know to stop")
  }
  else {
    //wait one second before trying the call again but increment the number of times it has been tried
    window.setTimeout( function() {
      getMatchList(count+1).then(getMatchListResponse, getMatchListRetry);
    }, 1000);
  }
}

/*
function newMatchData(summ, ) {

}


function newMatchData(summ) {
  return new Promise(function(resolve, reject) {
    var matchCount = traceBack;

    var matchId = matchList.matches[x].gameId;
    var req = new XMLHttpRequest();
    req.open("GET", "http://lolheatmap.com/matchData?matchId=" + matchId,true)
    req.send(null);
    req.addEventListener('load', function()
    {
      var matchData = JSON.parse(req.response);
    });
}
*/

function getMatchData(summ, matchList, traceBack)
{
  console.log("number of games to go backwards in getMatchData = " + traceBack);
  var matchCount = traceBack;

  while (matchCount >= 0)
  {
    (function(x)
    {
      var matchId = matchList.matches[x].gameId;
      var req = new XMLHttpRequest();
      req.open("GET", "http://lolheatmap.com/matchData?matchId=" + matchId,true)
      req.send(null);
      req.addEventListener('load', function()
      {
        var matchData = JSON.parse(req.response);
        var reqTwo = new XMLHttpRequest();
        reqTwo.open("GET", 'http://lolheatmap.com/getParticipantData?matchId='+ matchId, true)
        reqTwo.send(null);
        reqTwo.addEventListener('load', function()
        {
          var side = null;
          var participantID = null;
          var participantData = JSON.parse(reqTwo.response);
          var participants = participantData.participantIdentities;
          for (i = 0; i < participants.length; i++)
          {
            if (participants[i].player.currentAccountId == summ.accountId)
            {
              participantID = participants[i].participantId;
              if (participants[i].participantId < 6) {
                side = "blue";
              }
              else {
                side = "purple";
              }

            }
          }

          var frames = matchData.frames;
          for (var i = 2; i < frames.length; i++)
          {
            var events = frames[i].events;
            for (var r = 0; r < events.length; r++) {
              if (events[r].type == "CHAMPION_KILL" && events[r].victimId == participantID)
              {
                var location = [];
                location.push(events[r].position.x);
                location.push(events[r].position.y);
                location = JSON.stringify(location);
                addCoordinate(summ.champId, summ.accountId, location, matchId, side);
              }
            }
          }

          console.log("x is:" + x);

          if (matchList.matches[x].gameId == summ.recentMatchId)
          {
            console.log("calling heatmap");
            updateMatch(summ.champId, summ.accountId, summ.recentMatchId);
          }
        })
      })
    }(matchCount));
    matchCount = matchCount - 1;
  }
}

function addCoordinate(champName, summName, coordinate, matchId, side)
{
  var postData = {"champ":champName, "summ":summName, "loc": coordinate, "match":matchId, "side":side};

  console.log(postData);
  var req = new XMLHttpRequest();
  req.open('POST', "http://lolheatmap.com/addCoordinate", true);
  req.setRequestHeader('Content-Type', 'application/json');
  req.addEventListener('load', function() {
    var resp = JSON.parse(req.response);
    console.log(resp);
  })
  req.send(JSON.stringify(postData));

}

function updateMatch(champName, summName, matchId)
{
  var req = new XMLHttpRequest();
  req.open("GET", "http://lolheatmap.com/updateMatch?champ="+ champName +"&summ="+ summName + "&match=" + matchId, true);
  req.addEventListener('load', function()
  {
    var res = JSON.parse(req.response);
    console.log("update match response:")
    console.log(res);
    heatmap();
  });
  req.send(null);
}


function heatmap()
{
  var summDisplay = document.getElementById('summName').value;
  var champDisplay = document.getElementById('champName').value;
  window.location.replace("http://lolheatmap.com/heatmap?name="+summDisplay+"&champ=" +champDisplay);
};
