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

document.addEventListener('DOMContentLoaded', checkUser);

function checkUser()
{
  document.getElementById('Submit').addEventListener('click', function(event)
  {
    var summName = document.getElementById('summName').value;
    var champName = document.getElementById('champName').value;

    console.log(summName);
    console.log(champName);

    var req = new XMLHttpRequest();
    req.open("GET", "http://dev.akshaysubramanian.com/checkUser?name=" + summName, true)
    req.addEventListener('load', function()
    {
      var summ = JSON.parse(req.response);
      console.log(summ);
      if (summ.length == 0)
      {
        console.log("add User");
        addUser(summName,champName);
      }

      else {
        console.log("getData");
        getDatabaseData(summName, champName);
      }

    })
    req.send(null);
  });
}

function addUser(summName,champName)
{
  var req = new XMLHttpRequest();
  req.open("GET", "http://dev.akshaysubramanian.com/addUser?name=" + summName, true)
  req.addEventListener('load', function()
  {
    var summ = JSON.parse(req.response);
    console.log(summ);
    getDatabaseData(summName, champName);
  })
  req.send(null);
}

function getDatabaseData(summName, champName)
{
  var req = new XMLHttpRequest();
  req.open("GET", "http://dev.akshaysubramanian.com/getDatabaseData?name=" + summName + "&champ="+champName, true)
  req.addEventListener('load', function()
  {
    var summ = JSON.parse(req.response);
    console.log(summ);
    if (summ.length == 0)
    {
      console.log("insert");
      insertNewrow(summName, champName);
    }
    else
    {
      console.log("matchList");
      getMatchList(summ);
    }
  })
  req.send(null);
}

function insertNewrow(summName, champName)
{
  var req = new XMLHttpRequest();
  req.open("GET", "http://dev.akshaysubramanian.com/insertIntorecentMatch?name="+summName+"&champ="+champName, true)
  req.addEventListener('load', function()
  {
    var res = JSON.parse(req.response);
    console.log(res);
    getPostInsertData(summName, champName);
  })
  req.send(null);
}

function getPostInsertData(summName, champName)
{
  var req = new XMLHttpRequest();
  req.open("GET", "http://dev.akshaysubramanian.com/postInsertData?name="+summName+"&champ="+champName, true)
  req.addEventListener('load', function()
  {
    var summ = JSON.parse(req.response);
    console.log(summ);
    getMatchList(summ);
  })
  req.send(null);
}

function getMatchList(summ)
{
  console.log("inside getMatchList summ looks like: ");
  console.log(summ);
  var req = new XMLHttpRequest();
  req.open("GET", "http://dev.akshaysubramanian.com/matchList?id=" + summ.accountId +'&champid=' + summ.championId, true)
  req.addEventListener('load', function()
  {
    var matchList = JSON.parse(req.response);
    console.log(matchList);
    if (matchList.endIndex == 0){
      window.location.replace("http://dev.akshaysubramanian.com/noData");
    }

    if (summ.recentMatchId == matchList.matches[0].gameId)
    {
      console.log("skipped getting coordinates");
      heatmap();
    }
    else
    {
      console.log("calling getMatchData");
      summ.recentMatchId = matchList.matches[0].gameId;
      console.log("most recent match id is: " + summ.recentMatchId);
      getMatchData(summ, matchList);
      //findParticipantData(summ, matchList)
    }

  })
  req.send(null);
}

function getMatchData(summ, matchList)
{
  var matchCount = 0;
  var deaths = [];

  while (matchCount < 8 && matchList.matches[matchCount] != summ.recentMatchId)
  {
    (function(x)
    {
      var matchId = matchList.matches[x].gameId;
      var req = new XMLHttpRequest();
      req.open("GET", "http://dev.akshaysubramanian.com/matchData?matchId="+matchId,true)
      req.addEventListener('load', function()
      {
        var matchData = JSON.parse(req.response);
        var participantID = findParticipantId(summ.accountId);
        console.log("curent part id is: " + participantID)
        if (participantID != 11)
        {
          var frames = matchData.frames;
          for (var i = 2; i < frames.length; i++)
          {
            var events = frames[i].events;
            for (var r = 0; r < events.length; r++) {
              if (events[r].eventType == "CHAMPION_KILL" && events[r].victimId == participantID)
              {
                var location = [];
                location.push(events[r].position.x);
                location.push(events[r].position.y);
                location = JSON.stringify(location);
                addCoordinate(summ.championId, summ.accountId, location, matchId);
              }
            }
          }
        }

        console.log(matchCount);

        if (x == 7 || matchList.matches[x+1] == summ.recentMatchId)
        {
          console.log("calling heatmap");
          updateMatch(summ.championId,summ.accountId,summ.recentMatchId);
        }
      })
      req.send(null);
    }(matchCount));
    matchCount = matchCount + 1;
  }
}

function findParticipantId(accountId)
{
  console.log(accountId)
  var req = new XMLHttpRequest();
  req.open("GET", 'http://dev.akshaysubramanian.com/getParticipantData?accountId='+accountId, true)
  req.addEventListener('load', function()
  {
    var participantData = JSON.parse(req.response);
    var participants = participantData.participantIdentities;
    for (summoner in participants)
    {
      if (participants.player.currentAccountId == accountId)
      {
        //only taking data from blue side so participant id must be 1-5
        if (participants.player.currentAccountId < 6) {
          return participants.participantId;
        }
        else {
          return participants.participantId;
        }
      }
    }
  })
  req.send(null);
}

function addCoordinate(champName, summName, coordinate, matchId)
{
  console.log("add coordinate");
  var req  = new XMLHttpRequest();
  req.open("GET", "http://dev.akshaysubramanian.com/addCoordinate?champ="+ champName +"&summ="+ summName + "&loc=" + coordinate + "&match=" + matchId, true);
  req.addEventListener('load', function()
  {
    var res = JSON.parse(req.response);
    console.log(res);
  });
  req.send(null);
}

function updateMatch(champName, summName, matchId)
{
  console.log("update:" + champName);
  console.log("update:" + summName);
  console.log("update:" + matchId);
  console.log("updating match");
  var req = new XMLHttpRequest();
  req.open("GET", "http://dev.akshaysubramanian.com/updateMatch?champ="+ champName +"&summ="+ summName + "&match=" + matchId, true);
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
  console.log("heatmap client");
  window.location.replace("http://dev.akshaysubramanian.com/heatmap?name="+summDisplay+"&champ=" +champDisplay);
};