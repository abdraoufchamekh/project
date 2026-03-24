UPDATE users SET password = '$2a$10$wCb0rTXfrOUwAGV31bYK9OtqLdzUTPZUj0azawpgQjfdqPo7T.2X2' WHERE role = 'admin';
UPDATE users SET password = '$2a$10$1hLGmRm5.ip3yBBqBngR3uSkh/smFG.VbOOVgZTM85nYNW0Obv2VW' WHERE role = 'designer';
ALTER USER postgres WITH PASSWORD 'AureaDB@Secure!26';
