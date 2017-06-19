CREATE TABLE user (
  id              int(11)           NOT NULL AUTO_INCREMENT,
  summonerName    varchar(255)      NOT NULL,
  accountId       int(11) UNSIGNED  NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY (summonerName)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `user`;


INSERT INTO user (summonerName, summonerId) VALUES ("ftl", 56692694);

CREATE TABLE champion (
  id              int(11)           NOT NULL AUTO_INCREMENT,
  championName    varchar(255)      NOT NULL,
  championId      int(11)           NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY (championId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `champion`;

INSERT INTO champion (championName, championId) VALUES ("Fiora", 114);

CREATE TABLE recentMatch (
  champ             int(11)           NOT NULL,
  summoner          int(11)           NOT NULL,
  recentMatchId     int(11) UNSIGNED,
  PRIMARY KEY (champ, summoner),
  CONSTRAINT match_fk1 FOREIGN KEY (champ) REFERENCES champion (id) ON DELETE CASCADE,
  CONSTRAINT match_fk2 FOREIGN KEY (summoner) REFERENCES user (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO recentMatch (champ, summoner) VALUES ((SELECT user.id FROM user WHERE summonerName = "ftl"), (SELECT champion.id FROM champion WHERE championName = "Fiora"));

DROP TABLE IF EXISTS `recentMatch`;

CREATE TABLE coordinates (
  id              int(11)           NOT NULL AUTO_INCREMENT,
  champId         int(11)           NOT NULL,
  summId          int(11)           NOT NULL,
  coordinate      varchar(255),
  matchId         int(11) UNSIGNED,
  PRIMARY KEY (id),
  CONSTRAINT coord_fk1 FOREIGN KEY (champId) REFERENCES champion (id) ON DELETE CASCADE,
  CONSTRAINT coord_fk2 FOREIGN KEY (summId) REFERENCES user (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `coordinates`;
