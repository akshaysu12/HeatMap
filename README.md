# HeatMap

HeatMap is a Data Visualization tool for players of the online game League of Legends. Entering your summoner name and a 
champion you have played to HeatMap will allow you to visualize where on summoner's rift you are dying the most to help you
improve your game to the next level. By looking up more advanced players and seeing their death statistics, you can start 
to get a better idea of what improvements you need to make. 

HeatMap visualized data by hexagonal binning implemented through the D3 Javascript Library. By aggregating x,y locations 
gathered from the Riot API across a series of games, it is possible to draw hexagons that increase in size and color based 
on density of the plotted x,y coordintes. This allows HeatMap to highlight areas of the map in turn teaching users about
some of their bad habits in League of Legends. 

HeatMap is currently hosted at http://lolheatmap.com. 
