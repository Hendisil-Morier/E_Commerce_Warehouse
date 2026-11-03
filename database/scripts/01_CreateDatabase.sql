
/*
    Project: E-Commerce Marketplace + Warehouse Management
    Database: ECommerceWarehouse
    DBMS: Microsoft SQL Server
    Description: Initialize project database
*/

USE master;
GO

IF DB_ID(N'ECommerceWarehouse') IS NULL
BEGIN
    CREATE DATABASE ECommerceWarehouse;
    PRINT N'Database ECommerceWarehouse created successfully.';
END
ELSE
BEGIN
    PRINT N'Database ECommerceWarehouse already exists.';
END
GO

USE ECommerceWarehouse;
GO

PRINT N'Connected to ECommerceWarehouse successfully.';
GO
