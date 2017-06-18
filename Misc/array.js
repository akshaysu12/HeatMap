/*
var a = [ [ 1672, 12421 ],
  [ 11887, 4081 ],
  [ 7813, 5886 ],
  [ 1800, 7541 ],
  [ 13958, 4241 ],
  [ 5054, 9665 ],
  [ 3552, 3440 ],
  [ 2148, 12456 ],
  [ 4772, 5207 ],
  [ 10001, 7625 ],
  [ 1784, 11876 ],
  [ 11606, 11147 ],
  [ 1252, 11707 ],
  [ 1786, 13142 ],
  [ 5156, 4732 ],
  [ 9854, 9761 ] ];

a = JSON.stringify(a);
console.log(typeof(a));
*/
var coordinate = [1,2];
coordinate = JSON.stringify(coordinate);
var b = "&loc=" + coordinate + "&match=";
console.log(b);
