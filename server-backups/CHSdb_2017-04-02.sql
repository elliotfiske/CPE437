# ************************************************************
# Sequel Pro SQL dump
# Version 4541
#
# http://www.sequelpro.com/
# https://github.com/sequelpro/sequelpro
#
# Host: elliot-free-db.cfjmv2oenm4j.us-west-2.rds.amazonaws.com (MySQL 5.6.27-log)
# Database: CHSdb
# Generation Time: 2017-04-03 05:10:50 +0000
# ************************************************************


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


# Dump of table AssignedTags
# ------------------------------------------------------------

DROP TABLE IF EXISTS `AssignedTags`;

CREATE TABLE `AssignedTags` (
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `ChallengeSanitizedName` varchar(255) NOT NULL DEFAULT '',
  `ChallengeTagId` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`ChallengeSanitizedName`,`ChallengeTagId`),
  KEY `ChallengeTagId` (`ChallengeTagId`),
  CONSTRAINT `AssignedTags_ibfk_1` FOREIGN KEY (`ChallengeSanitizedName`) REFERENCES `Challenge` (`sanitizedName`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `AssignedTags_ibfk_2` FOREIGN KEY (`ChallengeTagId`) REFERENCES `ChallengeTag` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table Attempt
# ------------------------------------------------------------

DROP TABLE IF EXISTS `Attempt`;

CREATE TABLE `Attempt` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pointsEarned` int(11) DEFAULT NULL,
  `correct` tinyint(1) DEFAULT NULL,
  `input` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `challengeName` varchar(255) DEFAULT NULL,
  `personId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `challengeName` (`challengeName`),
  KEY `personId` (`personId`),
  CONSTRAINT `Attempt_ibfk_1` FOREIGN KEY (`challengeName`) REFERENCES `Challenge` (`sanitizedName`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Attempt_ibfk_2` FOREIGN KEY (`personId`) REFERENCES `Person` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

LOCK TABLES `Attempt` WRITE;
/*!40000 ALTER TABLE `Attempt` DISABLE KEYS */;

INSERT INTO `Attempt` (`id`, `pointsEarned`, `correct`, `input`, `createdAt`, `updatedAt`, `challengeName`, `personId`)
VALUES
	(6,0,0,'9.3^10-5m','2017-02-12 23:44:35','2017-02-12 23:44:35','single-slit',3),
	(7,1,0,'9.3*10^-5m','2017-02-12 23:45:00','2017-02-12 23:45:00','single-slit',3),
	(8,1,0,'9.3*10^-5m','2017-02-12 23:45:37','2017-02-12 23:45:37','single-slit',3),
	(15,5,1,'1','2017-02-16 21:04:47','2017-02-16 21:04:47',NULL,5),
	(16,1,0,'Hello','2017-02-16 21:05:20','2017-02-16 21:05:20',NULL,5),
	(17,6,1,'Bellman Ford','2017-02-16 21:05:36','2017-02-16 21:05:36',NULL,5),
	(18,5,1,'-3','2017-02-16 22:45:12','2017-02-16 22:45:12','fun-test-challenge',14),
	(19,5,1,'4','2017-02-16 23:21:36','2017-02-16 23:21:36','fun-test-challenge',16),
	(20,5,1,'4','2017-02-17 00:15:52','2017-02-17 00:15:52','fun-test-challenge',24),
	(21,5,1,'4','2017-02-17 00:18:24','2017-02-17 00:18:24','fun-test-challenge',22),
	(22,5,1,'4','2017-02-17 12:34:59','2017-02-17 12:34:59','fun-test-challenge',25),
	(23,5,1,'4','2017-02-17 22:45:11','2017-02-17 22:45:11','fun-test-challenge',18),
	(24,6,1,'65534','2017-02-17 22:45:46','2017-02-17 22:45:46','simple-cidr-addressing',18),
	(25,5,1,'2','2017-02-19 01:12:38','2017-02-19 01:12:38','manchester-encoding',18),
	(27,6,1,'Explicit congestion notification','2017-02-19 20:39:53','2017-02-19 20:39:53','ecn-meaning',18),
	(32,5,1,'2','2017-03-01 21:39:13','2017-03-01 21:39:13','layer-3',18),
	(33,6,1,'2','2017-03-01 23:24:09','2017-03-01 23:24:09','icmp-purpose',18),
	(37,7,1,'40','2017-03-23 19:57:54','2017-03-23 19:57:54','example-calculus-problem',1);

/*!40000 ALTER TABLE `Attempt` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table Challenge
# ------------------------------------------------------------

DROP TABLE IF EXISTS `Challenge`;

CREATE TABLE `Challenge` (
  `name` varchar(255) DEFAULT NULL,
  `sanitizedName` varchar(255) NOT NULL DEFAULT '',
  `description` text,
  `attsAllowed` int(11) DEFAULT '1',
  `type` enum('multchoice','shortanswer','number') DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `openDate` datetime DEFAULT NULL,
  `answer` varchar(255) DEFAULT NULL,
  `courseName` varchar(255) DEFAULT NULL,
  `dayIndex` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `WeekId` int(11) DEFAULT NULL,
  PRIMARY KEY (`sanitizedName`),
  UNIQUE KEY `challenge_course_name_sanitized_name` (`courseName`,`sanitizedName`),
  KEY `WeekId` (`WeekId`),
  CONSTRAINT `Challenge_ibfk_1` FOREIGN KEY (`WeekId`) REFERENCES `Week` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

LOCK TABLES `Challenge` WRITE;
/*!40000 ALTER TABLE `Challenge` DISABLE KEYS */;

INSERT INTO `Challenge` (`name`, `sanitizedName`, `description`, `attsAllowed`, `type`, `image`, `openDate`, `answer`, `courseName`, `dayIndex`, `createdAt`, `updatedAt`, `WeekId`)
VALUES
	('Bit Rate of a Digital Signal','bit-rate-of-a-digital-signal','Assume we want to digitize an analog signal which we will then transmit. The analog signal has a maximum frequency of 1500 Hz. Each sample can take on a value between 0 and 1023. What is the bit rate of the digital signal, in bits per second?',3,'number',NULL,'2017-02-21 00:00:00','30000','cpe-464',5,'2017-02-21 07:44:11','2017-02-21 07:44:11',15),
	('ECN Meaning','ecn-meaning','What does ECN stand for?',3,'shortanswer',NULL,'2017-02-04 00:00:00','[\"Explicit\",\"Congestion\",\"Notification\"]','cpe-464',3,'2017-02-19 11:11:36','2017-02-19 11:11:36',15),
	('Example Calculus Problem','example-calculus-problem','What is the value of this definite integral?',3,'number','/imgs/integral-example.png','2017-02-20 23:00:00','40','test-course',1,'2017-02-15 23:55:46','2017-02-15 23:55:46',1),
	('Sanity Check','fun-test-challenge','What is 2 + 2?',3,'number',NULL,'2017-02-01 00:00:00','4','cpe-464',0,'2017-02-16 22:44:40','2017-02-16 22:44:40',15),
	('ICMP Purpose','icmp-purpose','Which is NOT a use of ICMP?',1,'multchoice',NULL,'2017-02-22 00:00:00','2','cpe-464',6,'2017-02-21 07:48:52','2017-02-21 07:48:52',15),
	('Layer 3','layer-3','Which of the following is NOT a type of entry in a routing table?',1,'multchoice',NULL,'2017-02-05 00:00:00','2','cpe-464',4,'2017-02-20 08:57:03','2017-02-20 08:57:03',15),
	('Manchester Encoding','manchester-encoding','Which of the following bit strings would have the highest baud rate using Manchester encoding?',1,'multchoice',NULL,'2017-02-03 00:00:00','2','cpe-464',2,'2017-02-18 19:33:03','2017-02-18 19:33:04',15),
	('Short Answer Example','short-answer-example','Enter some words so we can grade them',3,'shortanswer',NULL,'2017-02-03 00:00:00','[\"words\",\"word\",\"some\"]','test-course',2,'2017-03-24 18:51:13','2017-03-24 18:51:13',1),
	('Simple CIDR addressing','simple-cidr-addressing','How many potential host addresses are there in 192.168.0.0/16?',3,'number',NULL,'2017-02-02 00:00:00','65534','cpe-464',1,'2017-02-17 18:18:33','2017-02-17 18:18:33',15),
	('Single slit','single-slit','A narrow slit is illuminated by a violet laser light (lamda=400 nm). A screen is located 3.5m behind the grating. The distance between the first and the second dark fringes on the screen (on the same side of the central bright band) is 1.5 cm. (Hint: use small angle approximation)',3,'shortanswer',NULL,'2017-05-21 00:00:00','[\"9.3*10^-5m\"]','physics-132',0,'2017-02-12 23:39:24','2017-02-12 23:39:24',25),
	('TCP Congestion','tcp-congestion','Name one way TCP can detect congestion.',3,'shortanswer',NULL,'2017-09-18 00:00:00','[\"ECN\",\"explicit\",\"congestion\",\"notification\",\"RED\",\"random\",\"early\",\"detection\"]','cpe-464',0,'2017-02-22 09:19:17','2017-02-22 09:19:18',16),
	('test chl','test-chl','test',3,'number',NULL,'2017-02-19 23:00:00','3','test-course',0,'2017-02-09 18:52:54','2017-02-09 18:52:54',1);

/*!40000 ALTER TABLE `Challenge` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table ChallengeTag
# ------------------------------------------------------------

DROP TABLE IF EXISTS `ChallengeTag`;

CREATE TABLE `ChallengeTag` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `text` varchar(255) DEFAULT NULL,
  `CourseName` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `challenge_tag__course_name_text` (`CourseName`,`text`),
  CONSTRAINT `ChallengeTag_ibfk_1` FOREIGN KEY (`CourseName`) REFERENCES `Course` (`sanitizedName`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

LOCK TABLES `ChallengeTag` WRITE;
/*!40000 ALTER TABLE `ChallengeTag` DISABLE KEYS */;

INSERT INTO `ChallengeTag` (`id`, `text`, `CourseName`, `createdAt`, `updatedAt`)
VALUES
	(1,'routing','cpe-464','2017-02-09 22:28:45','2017-02-09 22:28:45');

/*!40000 ALTER TABLE `ChallengeTag` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table Course
# ------------------------------------------------------------

DROP TABLE IF EXISTS `Course`;

CREATE TABLE `Course` (
  `name` varchar(255) DEFAULT NULL,
  `sanitizedName` varchar(255) NOT NULL DEFAULT '',
  `ownerId` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `hidden` int(11) DEFAULT NULL,
  PRIMARY KEY (`sanitizedName`),
  UNIQUE KEY `Course_sanitizedName_unique` (`sanitizedName`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `Course_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

LOCK TABLES `Course` WRITE;
/*!40000 ALTER TABLE `Course` DISABLE KEYS */;

INSERT INTO `Course` (`name`, `sanitizedName`, `ownerId`, `createdAt`, `updatedAt`, `hidden`)
VALUES
	('CPE 464','cpe-464',1,'2017-02-09 20:01:48','2017-02-09 20:01:48',0),
	('physics 132','physics-132',3,'2017-02-12 23:28:20','2017-02-12 23:28:20',1),
	('Test Course','test-course',1,'2017-02-09 18:52:39','2017-02-09 18:52:39',1);

/*!40000 ALTER TABLE `Course` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table Enrollment
# ------------------------------------------------------------

DROP TABLE IF EXISTS `Enrollment`;

CREATE TABLE `Enrollment` (
  `creditsEarned` int(11) DEFAULT '0',
  `streak` int(11) DEFAULT '0',
  `lastStreakTime` datetime DEFAULT '1970-01-01 00:00:00',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `courseName` varchar(255) NOT NULL DEFAULT '',
  `personEmail` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`courseName`,`personEmail`),
  KEY `personEmail` (`personEmail`),
  CONSTRAINT `Enrollment_ibfk_1` FOREIGN KEY (`courseName`) REFERENCES `Course` (`sanitizedName`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Enrollment_ibfk_2` FOREIGN KEY (`personEmail`) REFERENCES `Person` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

LOCK TABLES `Enrollment` WRITE;
/*!40000 ALTER TABLE `Enrollment` DISABLE KEYS */;

INSERT INTO `Enrollment` (`creditsEarned`, `streak`, `lastStreakTime`, `createdAt`, `updatedAt`, `courseName`, `personEmail`)
VALUES
	(36,0,'2017-02-23 00:00:00','2017-02-09 20:01:48','2017-03-14 18:05:51','cpe-464',1),
	(12,1,'2017-02-17 00:00:00','2017-02-16 21:02:41','2017-02-16 21:05:35','cpe-464',5),
	(5,1,'2017-02-17 00:00:00','2017-02-16 22:42:40','2017-02-16 22:45:12','cpe-464',14),
	(5,1,'2017-02-17 00:00:00','2017-02-16 23:21:27','2017-02-16 23:21:36','cpe-464',16),
	(33,1,'2017-03-02 00:00:00','2017-02-17 00:24:35','2017-03-01 23:24:09','cpe-464',18),
	(5,1,'2017-02-18 00:00:00','2017-02-17 00:17:52','2017-02-17 00:18:23','cpe-464',22),
	(5,1,'2017-02-18 00:00:00','2017-02-17 00:15:26','2017-02-17 00:15:52','cpe-464',24),
	(5,1,'2017-02-18 00:00:00','2017-02-17 12:34:31','2017-02-17 12:34:59','cpe-464',25),
	(0,0,'1970-01-01 00:00:00','2017-02-22 19:18:03','2017-02-22 19:18:03','cpe-464',26),
	(2,1,'2017-02-13 00:00:00','2017-02-12 23:28:20','2017-02-12 23:45:37','physics-132',3),
	(66,3,'2017-03-25 00:00:00','2017-02-09 18:52:39','2017-03-24 18:52:05','test-course',1);

/*!40000 ALTER TABLE `Enrollment` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table MultChoiceAnswers
# ------------------------------------------------------------

DROP TABLE IF EXISTS `MultChoiceAnswers`;

CREATE TABLE `MultChoiceAnswers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `index` int(11) DEFAULT NULL,
  `text` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `ChallengeSanitizedName` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ChallengeSanitizedName` (`ChallengeSanitizedName`),
  CONSTRAINT `MultChoiceAnswers_ibfk_1` FOREIGN KEY (`ChallengeSanitizedName`) REFERENCES `Challenge` (`sanitizedName`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

LOCK TABLES `MultChoiceAnswers` WRITE;
/*!40000 ALTER TABLE `MultChoiceAnswers` DISABLE KEYS */;

INSERT INTO `MultChoiceAnswers` (`id`, `index`, `text`, `createdAt`, `updatedAt`, `ChallengeSanitizedName`)
VALUES
	(1,0,'00001111','2017-02-18 19:33:03','2017-02-18 19:33:04','manchester-encoding'),
	(2,1,'11101111','2017-02-18 19:33:03','2017-02-18 19:33:04','manchester-encoding'),
	(3,2,'00000000','2017-02-18 19:33:03','2017-02-18 19:33:04','manchester-encoding'),
	(4,3,'10101010','2017-02-18 19:33:03','2017-02-18 19:33:04','manchester-encoding'),
	(5,0,'Directly Connected Subnet','2017-02-20 08:57:03','2017-02-20 08:57:03','layer-3'),
	(6,1,'Dynamic Routes','2017-02-20 08:57:03','2017-02-20 08:57:03','layer-3'),
	(7,2,'Temporary Routes','2017-02-20 08:57:03','2017-02-20 08:57:03','layer-3'),
	(8,3,'Gateway of Last Resort','2017-02-20 08:57:03','2017-02-20 08:57:03','layer-3'),
	(9,0,'Relaying error messages','2017-02-21 07:48:52','2017-02-21 07:48:52','icmp-purpose'),
	(10,1,'The \"ping\" utility','2017-02-21 07:48:52','2017-02-21 07:48:52','icmp-purpose'),
	(11,2,'Transmitting large amounts of data','2017-02-21 07:48:52','2017-02-21 07:48:52','icmp-purpose');

/*!40000 ALTER TABLE `MultChoiceAnswers` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table PeerId
# ------------------------------------------------------------

DROP TABLE IF EXISTS `PeerId`;

CREATE TABLE `PeerId` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `peerid` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `color` varchar(255) DEFAULT NULL,
  `lastHeartbeat` datetime DEFAULT NULL,
  `texture` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `RoomId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `PeerId_name_unique` (`name`),
  KEY `RoomId` (`RoomId`),
  CONSTRAINT `PeerId_ibfk_1` FOREIGN KEY (`RoomId`) REFERENCES `Room` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

LOCK TABLES `PeerId` WRITE;
/*!40000 ALTER TABLE `PeerId` DISABLE KEYS */;

INSERT INTO `PeerId` (`id`, `peerid`, `name`, `color`, `lastHeartbeat`, `texture`, `createdAt`, `updatedAt`, `RoomId`)
VALUES
	(1,'dbtwrwc0k9w1att9','rferfe','ab2567','2017-02-12 17:59:22',NULL,'2017-02-12 17:58:01','2017-02-12 17:59:22',NULL),
	(3,'fart','lol','fff000','2017-03-07 05:20:17',NULL,'2017-03-07 05:20:17','2017-03-07 05:20:17',NULL),
	(4,'ockisw94yv9ggb9','smelliot','ab2567','2017-03-22 07:46:29',NULL,'2017-03-22 07:45:45','2017-03-22 07:46:29',NULL),
	(5,'979xyj7pn3fpqfr','adsf','ab2567','2017-03-30 21:13:47',NULL,'2017-03-30 21:13:12','2017-03-30 21:13:47',NULL),
	(7,'hids21u64q11c3di','friendo','ab2567','2017-03-30 21:13:41',NULL,'2017-03-30 21:13:21','2017-03-30 21:13:41',NULL);

/*!40000 ALTER TABLE `PeerId` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table Person
# ------------------------------------------------------------

DROP TABLE IF EXISTS `Person`;

CREATE TABLE `Person` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `facebookId` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` int(11) DEFAULT NULL,
  `userSettings` varchar(255) DEFAULT NULL,
  `activationToken` varchar(255) DEFAULT NULL,
  `checkedDisclaimer` tinyint(1) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `facebookId` (`facebookId`),
  UNIQUE KEY `Person_email_unique` (`email`),
  UNIQUE KEY `Person_facebookId_unique` (`facebookId`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

LOCK TABLES `Person` WRITE;
/*!40000 ALTER TABLE `Person` DISABLE KEYS */;

INSERT INTO `Person` (`id`, `name`, `email`, `facebookId`, `password`, `role`, `userSettings`, `activationToken`, `checkedDisclaimer`, `createdAt`, `updatedAt`)
VALUES
	(1,'AdminMan','Admin@11.com',NULL,'$2a$08$o/ZrC8xeSiLHmLWPW.0yW.78IbpvVl4PHu/46UdMilPsvzXNM2gfu',2,NULL,NULL,NULL,'2017-02-09 18:51:38','2017-02-09 18:51:38'),
	(3,'Ross','rhlevine@calpoly.edu',NULL,'$2a$08$oZxWUhB.lmwi.jsn51bAkuoWL5hev1iiki3F1icyGCQ8IyCdMQcFq',2,NULL,NULL,NULL,'2017-02-12 23:22:54','2017-02-12 23:22:54'),
	(4,'mr.steinke','Steinke@sfhs',NULL,'$2a$08$QU6KLgNNIBhhEAHu9Q7k9ekUWGw//r1J2ncUOyCNpj9gTFNSMvsLq',1,NULL,NULL,NULL,'2017-02-16 20:27:02','2017-02-16 20:27:02'),
	(5,'Vivian','vfong01@calpoly.edu',NULL,'$2a$08$bMP/lGp8bAQxRAORWJvh5efDBQp.qOKRIKfYGcomV02gpLmqRD00u',0,NULL,NULL,NULL,'2017-02-16 21:00:15','2017-02-16 21:00:15'),
	(14,'Katie','kdavis22@calpoly.edu',NULL,'$2a$08$PizS35R76P4aUBxS9N5hMOWNOu7lmwiVzOWNQfYrNajAlvuGroIfC',0,NULL,NULL,1,'2017-02-16 22:40:23','2017-02-16 22:42:15'),
	(16,'Elliot','Efiske@calpoly.edu',NULL,'$2a$08$P8WnEvyM5YLiBWiD4e5Qu.ue4bf3iwykClGrOW1dvRPhg506MAG92',0,NULL,NULL,1,'2017-02-16 23:17:34','2017-02-16 23:21:18'),
	(17,'fart','farts@calpoly.edu',NULL,'$2a$08$YJPxz65yJX/Ck/sUSZZjr.DezN8XjKqBqwxcvemb2CicwuvKO.hZ2',0,NULL,'9a687d224d1c95a7e03eb3008031b7bb',NULL,'2017-02-16 23:26:00','2017-02-16 23:26:00'),
	(18,'Sam','stfreed@calpoly.edu',NULL,'$2a$08$C.6F5uP7zAJg5Fn52w0u8OIhBiUOAHNlIoLc6wDPmOml46Ul54Hom',0,NULL,NULL,1,'2017-02-17 00:10:22','2017-02-17 00:24:18'),
	(19,'Marcel','Mbperez@calpoly.edu',NULL,'$2a$08$kbBQYolQ7UmH4N142Jm6hev5qLMVQtYxJuHBtC9Zjj3lJ8s5NCTBa',0,NULL,'308920d31f08840e8dc569d62b7a1f81',NULL,'2017-02-17 00:10:35','2017-02-17 00:10:35'),
	(20,'Matt','mrgoodri@calpoly.edu',NULL,'$2a$08$M4E/TA6gIFE.ldXuT/fZme6oR7yCbJSDBksyyYSGIv7E8ovPwDqQS',0,NULL,'a6868566afd9027517899b8f0efc6021',NULL,'2017-02-17 00:10:58','2017-02-17 00:10:58'),
	(21,'Ji','jzhang49@calpoly.edu',NULL,'$2a$08$1rBoVgL4aH2l5LtduROCsei3Sh3ndm5NifXulaLw/vdAx0HfeVfQy',0,NULL,NULL,1,'2017-02-17 00:11:18','2017-02-17 00:28:04'),
	(22,'Mike','Mabood@calpoly.edu',NULL,'$2a$08$AfAeG3VDoP5YDBuQecP5wuegRUJvjnhYJ9i2qGj4vqbyHGsmJJ.dq',0,NULL,NULL,1,'2017-02-17 00:11:20','2017-02-17 00:17:13'),
	(23,'Eva','eschen@calpoly.edu',NULL,'$2a$08$AtrnyWN9OTJLTEV30iR5BOCkGuGLuYwq15Ng6XBa3tQPDUZenlaOy',0,NULL,'e8a136073bc7d9aab1b5913a5d65fb88',NULL,'2017-02-17 00:11:22','2017-02-17 00:11:22'),
	(24,'Cory','camayer@calpoly.edu',NULL,'$2a$08$t3aZAMkDldB0jM500n669.vVRDq6QdtIYBSASMjnyywE8UTzz8/am',0,NULL,NULL,1,'2017-02-17 00:11:38','2017-02-17 00:14:20'),
	(25,'Aidan','aimccoy@calpoly.edu',NULL,'$2a$08$w74bBPzMTL5p1MnUMsUFpOIUFS1qk8jUm3/daY.53wvCHOhRrC7Mq',0,NULL,NULL,1,'2017-02-17 12:32:35','2017-02-17 12:34:13'),
	(26,'Nick','ngonella@calpoly.edu',NULL,'$2a$08$mX1JQJkpmOPSpuRzYelD6eCnNyXOMJu/1oknfQ4sIzW7H3p8kwGia',0,NULL,NULL,1,'2017-02-22 19:15:51','2017-02-22 19:17:46'),
	(27,'Antonio','Arodr206@calpoly.edu',NULL,'$2a$08$GvYPGF3eqyyiycicB77vCOtOHAQrBF8HRK0Gw/QFE6PO1YklouBm.',0,NULL,NULL,1,'2017-03-21 20:51:36','2017-03-21 20:53:19');

/*!40000 ALTER TABLE `Person` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table Room
# ------------------------------------------------------------

DROP TABLE IF EXISTS `Room`;

CREATE TABLE `Room` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `Room_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table ShopItem
# ------------------------------------------------------------

DROP TABLE IF EXISTS `ShopItem`;

CREATE TABLE `ShopItem` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `courseName` varchar(255) DEFAULT NULL,
  `cost` int(11) DEFAULT NULL,
  `purchased` tinyint(1) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table StudentPurchase
# ------------------------------------------------------------

DROP TABLE IF EXISTS `StudentPurchase`;

CREATE TABLE `StudentPurchase` (
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `ShopItemId` int(11) NOT NULL DEFAULT '0',
  `PersonId` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`ShopItemId`,`PersonId`),
  KEY `PersonId` (`PersonId`),
  CONSTRAINT `StudentPurchase_ibfk_1` FOREIGN KEY (`ShopItemId`) REFERENCES `ShopItem` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `StudentPurchase_ibfk_2` FOREIGN KEY (`PersonId`) REFERENCES `Person` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table Week
# ------------------------------------------------------------

DROP TABLE IF EXISTS `Week`;

CREATE TABLE `Week` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `weekIndexInCourse` int(11) DEFAULT NULL,
  `startDate` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `CourseSanitizedName` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `CourseSanitizedName` (`CourseSanitizedName`),
  CONSTRAINT `Week_ibfk_1` FOREIGN KEY (`CourseSanitizedName`) REFERENCES `Course` (`sanitizedName`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

LOCK TABLES `Week` WRITE;
/*!40000 ALTER TABLE `Week` DISABLE KEYS */;

INSERT INTO `Week` (`id`, `weekIndexInCourse`, `startDate`, `createdAt`, `updatedAt`, `CourseSanitizedName`)
VALUES
	(1,0,'2017-01-21 00:00:00','2017-02-09 18:52:39','2017-02-09 18:52:40','test-course'),
	(2,1,'2017-01-28 00:00:00','2017-02-09 18:52:39','2017-02-09 18:52:40','test-course'),
	(3,2,'2017-02-04 00:00:00','2017-02-09 18:52:39','2017-02-09 18:52:40','test-course'),
	(4,3,'2017-02-11 00:00:00','2017-02-09 18:52:39','2017-02-09 18:52:40','test-course'),
	(5,4,'2017-02-18 00:00:00','2017-02-09 18:52:39','2017-02-09 18:52:40','test-course'),
	(6,5,'2017-02-25 00:00:00','2017-02-09 18:52:39','2017-02-09 18:52:40','test-course'),
	(7,9,'2017-03-24 23:00:00','2017-02-09 18:52:39','2017-02-09 18:52:40','test-course'),
	(8,6,'2017-03-04 00:00:00','2017-02-09 18:52:39','2017-02-09 18:52:40','test-course'),
	(9,7,'2017-03-11 00:00:00','2017-02-09 18:52:39','2017-02-09 18:52:40','test-course'),
	(10,8,'2017-03-17 23:00:00','2017-02-09 18:52:39','2017-02-09 18:52:40','test-course'),
	(14,7,'2017-03-16 00:00:00','2017-02-09 20:01:48','2017-02-09 20:01:48','cpe-464'),
	(15,3,'2017-02-16 00:00:00','2017-02-09 20:01:48','2017-02-09 20:01:48','cpe-464'),
	(16,4,'2017-02-23 00:00:00','2017-02-09 20:01:48','2017-02-09 20:01:48','cpe-464'),
	(17,5,'2017-03-02 00:00:00','2017-02-09 20:01:48','2017-02-09 20:01:48','cpe-464'),
	(18,6,'2017-03-09 00:00:00','2017-02-09 20:01:48','2017-02-09 20:01:48','cpe-464'),
	(19,8,'2017-03-23 23:00:00','2017-02-09 20:01:48','2017-02-09 20:01:48','cpe-464'),
	(20,9,'2017-03-24 23:00:00','2017-02-09 20:01:48','2017-02-09 20:01:48','cpe-464'),
	(21,0,'2017-01-21 00:00:00','2017-02-12 23:28:20','2017-02-12 23:28:21','physics-132'),
	(22,1,'2017-01-28 00:00:00','2017-02-12 23:28:20','2017-02-12 23:28:21','physics-132'),
	(23,2,'2017-02-04 00:00:00','2017-02-12 23:28:20','2017-02-12 23:28:21','physics-132'),
	(24,5,'2017-02-25 00:00:00','2017-02-12 23:28:20','2017-02-12 23:28:21','physics-132'),
	(25,3,'2017-02-11 00:00:00','2017-02-12 23:28:20','2017-02-12 23:28:21','physics-132'),
	(26,4,'2017-02-18 00:00:00','2017-02-12 23:28:20','2017-02-12 23:28:21','physics-132'),
	(27,8,'2017-03-18 00:00:00','2017-02-12 23:28:20','2017-02-12 23:28:21','physics-132'),
	(28,6,'2017-03-04 00:00:00','2017-02-12 23:28:20','2017-02-12 23:28:21','physics-132'),
	(29,7,'2017-03-11 00:00:00','2017-02-12 23:28:20','2017-02-12 23:28:21','physics-132'),
	(30,9,'2017-03-25 00:00:00','2017-02-12 23:28:20','2017-02-12 23:28:21','physics-132');

/*!40000 ALTER TABLE `Week` ENABLE KEYS */;
UNLOCK TABLES;



/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
