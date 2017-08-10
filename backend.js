//this is a from scratch file to test backend skills with node.js

/********
Set Up Modules
********/
//set up express
var express = require('express');
var app = express();

//set up handlebars and set up file to look for main
//{defaultLayout:'main'}
var handlebars = require('express-handlebars').create();

//set up request modules to make the get request
var request = require('request');

//reference credentials for var in request URI and for database access
var credentials = require('./credentials.js');
var mysql = require('./dbAccess.js');

// set up the handlebars engine and set the port that it will run on
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port',3033);

//use the public folder to serve all static files
app.use(express.static('public'));


/********
Render Pages
********/

//set up main pages to get request data then for now just display it on diff page like before
app.get('/', function(req,res) {
  res.render('welcome');
});

app.get('/noData', function(req,res) {
  res.render('noData');
});

/*
Endpoint to insert all champion data into database --commented out for now
app.get('/insertData', function(req,res)
{
  res.render('insertData');
});


/****
Functions to reinsert all champion data back into the database
****/
app.get('/getChampionListData', function(req,res,next) {
  request('https://na1.api.riotgames.com/lol/static-data/v3/champions?locale=en_US&dataById=false&api_key=90f3289d-8a5b-42cd-9f23-c9f16a6c7213', function(err,response,body) {
    if (err){
      next(err);
      return;
    }
    console.log(body);
    var champData = JSON.parse(body);
    res.send(champData);
  })
})

app.get('/insertChampData', function(req,res,next){
  console.log(req.query.name);
  mysql.pool.query('INSERT INTO champion (`championName`, `championId`) VALUES (?,?)', [req.query.name, req.query.id], function(err, result)
  {
    if(err)
    {
      next(err);
      return;
    }
    console.log(result);
    res.send(JSON.stringify(result));
  });
});



app.get('/heatmap', function(req,res) {
  console.log("heatmap db");
  var context = {};
  context.summoner = req.query.name;
  context.champion = req.query.champ;
  res.render('heatmap', context);
});

app.get('/checkUser', function(req,res,next)
{
  mysql.pool.query('SELECT * FROM user WHERE summonerName = ?', [req.query.name], function(err, rows)
  {
    if (err){
      next(err);
      return;
    }
    res.send(rows);
  })
})


/*******************
Function:
*******************/
app.get('/addUser', function(req,res,next)
{
  var summName = req.query.name;
  console.log(summName);
  request('https://na1.api.riotgames.com/lol/summoner/v3/summoners/by-name/' + req.query.name+ '?' + credentials.apiKEY, function(err, response, body)
  {
    if (err){
      next(err);
      return;
    }

    if (!err && response.statusCode < 400)
    {
      var summData = JSON.parse(body);
      console.log(summData);
      var id = summData.accountId;
      var exists = true;
      /*
      for (var key in summData) {
        console.log(key);
        id = summData[key].id;
      }
      */
      console.log(id);

      console.log("insert");
      mysql.pool.query('INSERT INTO user (`summonerName`, `accountId`) VALUES (?,?)', [summName, id], function (err,result)
      {
        if(err)
        {
          next(err);
          return;
        }
        res.send(result);
      });
    }

    else if (response.statusCode == 404)
    {
      var noSumm = JSON.parse(body);
      console.log(noSumm);
      if (noSumm.status.message == "Not found") {
        res.render('noSumm');
      }
    }
  });
});


app.get('/getDatabaseData', function(req,res,next) {
  var summ = {};
  mysql.pool.query('SELECT m.recentMatchId, u.accountId, c.championId FROM recentMatch m INNER JOIN user u ON u.id = m.summoner INNER JOIN champion c ON c.id = m.champ WHERE champ = (SELECT id FROM champion WHERE championName = ?) AND summoner = (SELECT id FROM user WHERE summonerName = ?)', [req.query.champ, req.query.name], function(err, rows)
  {
    if (err){
      next(err);
      return;
    }
    if (rows.length == 0)
    {
      res.send(rows);
    }

    else {
      console.log(rows);
      summ.accountId = rows[0].accountId;
      summ.recentMatchId = rows[0].recentMatchId;
      summ.championId = rows[0].championId;
      res.send(summ);
    }
  });
});

app.get('/insertIntorecentMatch', function(req,res,next)
{
  var summ = {};
  console.log("insert recentMatch");
  mysql.pool.query('INSERT INTO recentMatch (`champ`, `summoner`) VALUES ((SELECT id FROM champion WHERE championName = ?), (SELECT id FROM user WHERE summonerName = ?))', [req.query.champ, req.query.name], function(err,result)
  {
    if(err)
    {
      next(err);
      return;
    }
    res.send(JSON.stringify(result));
  });
});

app.get('/postInsertData', function(req,res,next) {
  var summ = {};
  mysql.pool.query('SELECT m.recentMatchId, u.accountId, c.championId FROM recentMatch m INNER JOIN user u ON u.id = m.summoner INNER JOIN champion c ON c.id = m.champ WHERE champ = (SELECT id FROM champion WHERE championName = ?) AND summoner = (SELECT id FROM user WHERE summonerName = ?)', [req.query.champ, req.query.name], function(err, rows)
  {
    if (err){
      next(err);
      return;
    }

    //console.log(rows);
    summ.accountId = rows[0].accountId;
    summ.recentMatchId = rows[0].recentMatchId;
    summ.championId = rows[0].championId;
    res.send(summ);
  });
});

app.get('/matchList', function(req,res,next)
{
  console.log("call to matchList params are id=" + req.query.id + "champ id = " + req.query.champid)
  //need to add condition if there is no games played
  request('https://na1.api.riotgames.com/lol/match/v3/matchlists/by-account/'+ req.query.id + '?champion=' + req.query.champid + '&' + credentials.apiKEY, function(err,response,body)
  {
    if (!err && response.statusCode < 400)
    {
      var matchList = JSON.parse(body);
      res.send(matchList);
    }
    else {
      console.log(err);
      if(response){
        console.log(response.statusCode);
      }
    }
  });
});

app.get('/matchData', function(req,res,next)
{
  console.log("retrieving match Data for match: " + req.query.matchId);
  request('https://na1.api.riotgames.com/lol/match/v3/timelines/by-match/'+req.query.matchId+'?'+credentials.apiKEY, function(err,response,body)
  {
    if (!err && response.statusCode < 400)
    {
      var timelineData = JSON.parse(body);
      res.send(timelineData);
    }
    else {
      console.log(err);
      if(response){
        console.log(response.statusCode);
      }
    }
  });
});

app.get('/getParticipantData', function(req,res,next)
{
  console.log("get participant data called for match: " + req.query.matchId);
  request('https://na1.api.riotgames.com/lol/match/v3/matches/' + req.query.matchId + '?' + credentials.apiKEY, function(err, response, body)
  {
    if (!err && response.statusCode < 400)
    {
      var matchData = JSON.parse(body);
      //console.log(matchData)
      res.send(matchData);
    }
    else {
      console.log(err);
      if(response){
        console.log(response.statusCode);
      }
    }
  })

});

app.get('/addCoordinate', function(req,res,next)
{
  console.log("add coordinate");
  var context = {};
  mysql.pool.query('INSERT INTO coordinates (`champId`, `summId`, `coordinate`, `matchId`) VALUES ((SELECT id FROM champion WHERE championId = ?),(SELECT id FROM user WHERE accountId = ?),?,?)', [req.query.champ, req.query.summ, req.query.loc, req.query.match], function(err,result)
  {
    if(err)
    {
      next(err);
      return;
    }
    context.results = result.insertId;
    res.send(JSON.stringify(context));
  });
});

app.get('/updateMatch', function(req,res,next)
{
  var context = {};
  console.log("update recent match");
  mysql.pool.query('UPDATE recentMatch SET recentMatchId = ? WHERE champ=(SELECT id FROM champion WHERE championId = ?) AND summoner=(SELECT id FROM user WHERE accountId = ?)', [req.query.match, req.query.champ, req.query.summ], function(err,result)
  {
    if(err)
    {
      next(err);
      return;
    }
    context.results = result.insertId;
    res.send(JSON.stringify(context));
  });
});

app.get('/returnData', function(req,res,next)
{
  console.log("return data for render");
  mysql.pool.query('SELECT coordinate FROM coordinates WHERE summId = (SELECT id FROM user WHERE summonerName = ?) AND champId = (SELECT id FROM champion WHERE championName = ?)', [req.query.name, req.query.champ], function(err, rows, fields)
  {
    if (err)
    {
      next(err);
      return;
    }
    res.send(JSON.stringify(rows));
  });
});


//set up error pages

app.use(function(res,req)
{
  res.status(404);
  res.render('404');
});

app.use(function(err,res,req,next)
{
  console.error(err.stack);
  res.status(500);
  res.render('500');
});


/******
Set up server to listen on port
*******/

app.listen(app.get('port'), function()
{
  console.log('Express started on http://lolheatmap.com:'+ app.get('port') + '; press Ctrl-C to terminate.');
});
