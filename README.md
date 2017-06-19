# HeatMap

HeatMap is a Data Visualization tool for players of the online game League of Legends. Entering your summoner name and a 
champion you have played to HeatMap will allow you to visualize where on summoner's rift you are dying the most to help you
improve your game to the next level. By looking up more advanced players and seeing their death statistics, you can start 
to get a better idea of what improvements you need to make. 

HeatMap visualized data by hexagonal binning implemented through the D3 Javascript Library. By aggregating x,y locations 
gathered from the Riot API across a series of games, it is possible to draw hexagons that increase in size and color based 
on density of the plotted x,y coordintes. This allows HeatMap to highlight areas of the map in turn teaching users about
some of their bad habits in League of Legends. 

HeatMap is currently hosted at dev.akshaysubramanian.com. 

Developer Note: Due to the recent shift in the Riot Games API to V3 endpoints we are currenly still working on updating the 
                the API query's to receive live data. Submission will still work for users but data is not currently being 
                 displayed. For those interested in learning about the site, check out the link on the main page. 
