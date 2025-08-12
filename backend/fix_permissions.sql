GRANT CREATE ON *.* TO 'comunikapp'@'localhost';
GRANT ALL PRIVILEGES ON comunikapp.* TO 'comunikapp'@'localhost';
GRANT CREATE TEMPORARY TABLES ON *.* TO 'comunikapp'@'localhost';
GRANT LOCK TABLES ON comunikapp.* TO 'comunikapp'@'localhost';
GRANT SELECT ON INFORMATION_SCHEMA.* TO 'comunikapp'@'localhost';
FLUSH PRIVILEGES;
SHOW GRANTS FOR 'comunikapp'@'localhost';
