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
      var id;
      var exists = true;
      for (var key in summData) {
        console.log(key);
        id = summData[key].id;
      }
      console.log(id);

      console.log("insert");
      mysql.pool.query('INSERT INTO user (`summonerName`, `summonerId`) VALUES (?,?)', [summName, id], function (err,result)
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
  mysql.pool.query('SELECT m.recentMatchId, u.summonerId, c.championId FROM recentMatch m INNER JOIN user u ON u.id = m.summoner INNER JOIN champion c ON c.id = m.champ WHERE champ = (SELECT id FROM champion WHERE championName = ?) AND summoner = (SELECT id FROM user WHERE summonerName = ?)', [req.query.champ, req.query.name], function(err, rows)
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
      summ.summonerId = rows[0].summonerId;
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
  /*
  feel like this should work but it only works sometimes? need to look more into this. For now just moved getting the data into a new function
  mysql.pool.query('SELECT u.summonerId, c.championId FROM user u INNER JOIN recentMatch r ON r.summoner = u.id INNER JOIN champion c ON c.id = r.champ WHERE u.summonerName = ? AND c.championName = ?', [req.query.name, req.query.champ], function(err, rows)
  {
    if(err)
    {
      next(err);
      return;
    }
    console.log(rows);
    summ.summonerId = rows[0].summonerId;
    summ.championId = rows[0].championId;
    summ.recentMatchId = 0;
    res.send(summ);
  });
  */
});

app.get('/postInsertData', function(req,res,next) {
  var summ = {};
  mysql.pool.query('SELECT m.recentMatchId, u.summonerId, c.championId FROM recentMatch m INNER JOIN user u ON u.id = m.summoner INNER JOIN champion c ON c.id = m.champ WHERE champ = (SELECT id FROM champion WHERE championName = ?) AND summoner = (SELECT id FROM user WHERE summonerName = ?)', [req.query.champ, req.query.name], function(err, rows)
  {
    if (err){
      next(err);
      return;
    }

    console.log(rows);
    summ.summonerId = rows[0].summonerId;
    summ.recentMatchId = rows[0].recentMatchId;
    summ.championId = rows[0].championId;
    res.send(summ);
  });
});

app.get('/matchList', function(req,res,next)
{
  //need to add condition if there is no games played
  request('https://na.api.riotgames.com/api/lol/NA/v2.2/matchlist/by-summoner/'+ req.query.id + '?championIds=' + req.query.champid + '&' + credentials.apiKEY, function(err,response,body)
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
  console.log("retrieving match Data");
  request('https://na.api.riotgames.com/api/lol/NA/v2.2/match/'+req.query.matchId+'?includeTimeline=True&'+credentials.apiKEY, function(err,response,body)
  {
    if (!err && response.statusCode < 400)
    {
      var matchData = JSON.parse(body);
      res.send(matchData);
    }
    else {
      console.log(err);
      if(response){
        console.log(response.statusCode);
      }
    }
  });
});

app.get('/addCoordinate', function(req,res,next)
{
  console.log("add coordinate");
  var context = {};
  mysql.pool.query('INSERT INTO coordinates (`champId`, `summId`, `coordinate`, `matchId`) VALUES ((SELECT id FROM champion WHERE championId = ?),(SELECT id FROM user WHERE summonerId = ?),?,?)', [req.query.champ, req.query.summ, req.query.loc, req.query.match], function(err,result)
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
  mysql.pool.query('UPDATE recentMatch SET recentMatchId = ? WHERE champ=(SELECT id FROM champion WHERE championId = ?) AND summoner=(SELECT id FROM user WHERE summonerId = ?)', [req.query.match, req.query.champ, req.query.summ], function(err,result)
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
  console.log('Express started on http://localhost:'+ app.get('port') + '; press Ctrl-C to terminate.');
});
