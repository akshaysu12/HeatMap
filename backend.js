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

//set up middleware for post
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var RateLimiter = require('limiter').RateLimiter;

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

app.get('/error', function(req, res) {
  res.render('500');
})

//Endpoint to insert all champion data into database --commented out for now
app.get('/insertData', function(req,res)
{
  res.render('insertData');
});

app.get('/return429', function(req,res) {
  res.send('429');
  return;
});


/****
Functions to reinsert all champion data back into the database

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
****/

app.get('/challengerMatchList', function(req,res) {
  console.log("call to matchList params are id=" + req.query.accountId + "champ id = " + req.query.champId);
  request('https://na1.api.riotgames.com/lol/match/v3/matchlists/by-account/'+ req.query.accountId + '?champion=' + req.query.champId + '&' + credentials.apiKEY, function(err,response,body)
  {
    if (err){
      next(err);
      return;
    }

    if (!err && response.statusCode < 400)
    {
      var matchList = JSON.parse(body);
      //console.log(matchList);
      res.send(matchList);
    }

    else if (response.statusCode == 404)
    {
      var noSumm = JSON.parse(body);
      console.log(noSumm);
      res.send(JSON.stringify("noData"));
    }
  });
})

app.get('/heatmap', function(req,res) {
  console.log("heatmap db");
  var context = {};
  context.summoner = req.query.name;
  context.champion = req.query.champ;
  res.render('heatmap', context);
});


/*****************
Description: Checks whether current user is in the database. If not checks if
Output: recentMatch if there is one in the database. If not then none.
****************/
app.get('/checkUser', function(req,res,next) {
  mysql.pool.query('SELECT * FROM user WHERE summonerName = ?', [req.query.name], function(err, rows)
  {
    // if server error send 500 error
    if (err){
      next(err);
      return;
    }
    //need to verify if summoner name is valid and if so add to database
    if (rows.length == 0) {
      console.log("making request to riot about summoner validity");
      request('https://na1.api.riotgames.com/lol/summoner/v3/summoners/by-name/' + req.query.name+ '?' + credentials.apiKEY, function(err, response, body)
      {
        // if server error send 500 error
        if (err){
          next(err);
          return;
        }

        if (response.statusCode == 429) {
          res.send('429');
          return;
        }

        // user exists in riot database - add it to local db
        if (!err && response.statusCode < 400)
        {
          console.log("adding new user to db");

          //response body contains summoner data from Riot
          var summData = JSON.parse(body);
          console.log(summData);
          var id = summData.accountId;

          //insert new user into database
          mysql.pool.query('INSERT INTO user (`summonerName`, `accountId`) VALUES (?,?)', [req.query.name, id], function (err,result)
          {
            if(err)
            {
              next(err);
              return;
            }

            console.log("adding new row to recentMatch");
            //insert new row into recentMatch table
            mysql.pool.query('INSERT INTO recentMatch (`champ`, `summoner`) VALUES ((SELECT id FROM champion WHERE championName = ?), (SELECT id FROM user WHERE summonerName = ?))', [req.query.champ, req.query.name], function(err,result)
            {
              if(err)
              {
                next(err);
                return;
              }
              res.send(JSON.stringify(null));
            });
          });
        }

        else if (response.statusCode == 404)
        {
          var noSumm = JSON.parse(body);
          console.log(noSumm);
          res.send(JSON.stringify("noData"));
        }
      });
    }

    else {
      summ = {};

      console.log("already in db");
      mysql.pool.query('SELECT m.recentMatchId, u.accountId, c.championId FROM recentMatch m INNER JOIN user u ON u.id = m.summoner INNER JOIN champion c ON c.id = m.champ WHERE champ = (SELECT id FROM champion WHERE championName = ?) AND summoner = (SELECT id FROM user WHERE summonerName = ?)', [req.query.champ, req.query.name], function(err, rows)
      {
        if (err){
          next(err);
          return;
        }

        //object to send back to client
        if (rows.length == 0)
        {
          console.log("user already in db but adding new row to recentMatch");
          //insert new row into recentMatch table
          mysql.pool.query('INSERT INTO recentMatch (`champ`, `summoner`) VALUES ((SELECT id FROM champion WHERE championName = ?), (SELECT id FROM user WHERE summonerName = ?))', [req.query.champ, req.query.name], function(err,result)
          {
            if(err)
            {
              next(err);
              return;
            }
          });

          res.send(JSON.stringify(null));
        }

        //user in db and there is a row in recentMatch to send to client
        else {
          console.log("user in db and there is a row in recentMatch");
          res.send(JSON.stringify(rows[0].recentMatchId));
        }
      });

    }
  })
});


app.get('/matchList', function(req,res,next)
{
  //need to add condition if there is no games played
  mysql.pool.query('SELECT m.recentMatchId, u.accountId, c.championId FROM recentMatch m INNER JOIN user u ON u.id = m.summoner INNER JOIN champion c ON c.id = m.champ WHERE champ = (SELECT id FROM champion WHERE championName = ?) AND summoner = (SELECT id FROM user WHERE summonerName = ?)', [req.query.champ, req.query.name], function(err, rows)
  {
    if (err){
      next(err);
      return;
    }

    summ = {};
    summ.accountId = rows[0].accountId;
    summ.champId = rows[0].championId;
    summ.recentMatchId = rows[0].recentMatchId;
    summ.matchList = [];

    console.log("accountId", summ.accountId);
    console.log("champId", summ.champId);
    console.log("call to matchList params are id=" + summ.accountId + "champ id = " + summ.champId);

    request('https://na1.api.riotgames.com/lol/match/v3/matchlists/by-account/'+ summ.accountId + '?champion=' + summ.champId + '&' + credentials.apiKEY, function(err,response,body)
    {
      if (err){
        next(err);
        return;
      }

      if (!err && response.statusCode < 400)
      {
        var matchList = JSON.parse(body);
        summ.matchList = matchList;
        res.send(summ);
      }

      else if (response.statusCode == 404)
      {
        var noSumm = JSON.parse(body);
        console.log(noSumm);
        res.send(JSON.stringify("noData"));
      }
    });
  });

});

app.get('/matchData', function(req,res,next)
{
  //console.log("matchDataStatusCode",res.statusCode);
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
        console.log(res.statusCode);
      }
    }
  });
});

app.get('/getParticipantData', function(req,res,next)
{
  request('https://na1.api.riotgames.com/lol/match/v3/matches/' + req.query.matchId + '?' + credentials.apiKEY, function(err, response, body)
  {
    //console.log("getPartStatusCode",response.statusCode);
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

app.post('/addCoordinate', function(req,res,next)
{
  var body = req.body;
  //console.log(req.body);
  //console.log("add coordinate");
  var context = {};
  mysql.pool.query('INSERT INTO coordinates (`champId`, `summId`, `coordinate`, `matchId`, `side`) VALUES ((SELECT id FROM champion WHERE championId = ?),(SELECT id FROM user WHERE accountId = ?),?,?,?)', [body.champ, body.summ, body.loc, body.match, body.side], function(err,result)
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
  mysql.pool.query('SELECT coordinate FROM coordinates WHERE summId = (SELECT id FROM user WHERE summonerName = ?) AND champId = (SELECT id FROM champion WHERE championName = ?) AND side = ?', [req.query.name, req.query.champ, req.query.side], function(err, rows, fields)
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

app.use(function(req, res)
{
  res.status(404);
  res.send('404');
});

app.use(function(err, req, res, next)
{
  console.error(err.stack);
  res.status(500);
  res.send('500');
});


/******
Set up server to listen on port
*******/

app.listen(app.get('port'), function()
{
  console.log('Express started on http://lolheatmap.com:'+ app.get('port') + '; press Ctrl-C to terminate.');
});
