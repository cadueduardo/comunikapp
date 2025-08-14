CREATE DATABASE IF NOT EXISTS comunikapp;
CREATE USER IF NOT EXISTS 'comunikapp'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON comunikapp.* TO 'comunikapp'@'localhost';
FLUSH PRIVILEGES;
