-- Create syntax for TABLE 'friendship'
CREATE TABLE `friendship` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `requester_user_id` int(11) NOT NULL,
  `target_user_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8;

-- Create syntax for TABLE 'interests'
CREATE TABLE `interests` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `interest` varchar(40) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=131 DEFAULT CHARSET=utf8;

-- Create syntax for TABLE 'sessions'
CREATE TABLE `sessions` (
  `session_id` varchar(128) NOT NULL,
  `expires` int(11) unsigned NOT NULL,
  `data` text,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Create syntax for TABLE 'users'
CREATE TABLE `users` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL DEFAULT '',
  `firstname` varchar(40) NOT NULL DEFAULT '',
  `lastname` varchar(40) NOT NULL DEFAULT '',
  `age` smallint(5) unsigned NOT NULL,
  `gender` enum('m','f') NOT NULL DEFAULT 'm',
  `city` varchar(40) NOT NULL DEFAULT '',
  `password` varchar(255) NOT NULL DEFAULT '',
  `salt` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8;