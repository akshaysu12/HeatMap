

document.addEventListener('DOMContentLoaded', getchampList);

function getchampList()
{
  var req = new XMLHttpRequest();
  req.open("GET", 'https://global.api.riotgames.com/api/lol/static-data/NA/v1.2/champion?api_key=90f3289d-8a5b-42cd-9f23-c9f16a6c7213', true)
  req.addEventListener('load', function()
  {
    var res = JSON.parse(req.responseText);
    var champs = res.data;
    console.log(champs);
    insertData(champs);
  })
  req.send(null);
}


function insertData(champs)
{
  for (key in champs)
  {
    console.log("insert");
    var req = new XMLHttpRequest();
    req.open("GET", 'http://dev.akshaysubramanian.com/insertChampData?name=' + champs[key].name + '&id=' + champs[key].id, true)
    req.addEventListener('load', function()
    {
      res = JSON.parse(req.response);
      console.log(res);
    });
    req.send(null);
  }
}

/* Add this endpoint to backend.js if you need to reinsert all of the champions
app.get('/insertChampData', function(req,res,next){
  console.log(req.query.name);
  mysql.pool.query('INSERT INTO champion (`championName`, `championId`) VALUES (?,?)', [req.query.name, req.query.id], function(err, result)
  {
    if(err)
    {
      next(err);
      return;
    }
    res.send(JSON.stringify(result));
  });
});
*/
