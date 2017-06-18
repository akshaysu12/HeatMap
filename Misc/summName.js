function getSummName()
{
  var req = new XMLHttpRequest();
  req.open("GET", 'https://na.api.riotgames.com/api/lol/NA/v1.4/summoner/46063719/name?api_key=90f3289d-8a5b-42cd-9f23-c9f16a6c7213', true)
  req.addEventListener('load', function()
  {
    var res = JSON.parse(req.responseText);
    console.log(res);
  })
  req.send(null);
}

getSummName();
