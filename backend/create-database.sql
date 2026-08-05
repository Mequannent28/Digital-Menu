-- Run this script in SQL Server Management Studio (SSMS)
-- Connect to MARK\SQLEXPRESS01 and run this

-- Create the database
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'RestaurantDB')
    CREATE DATABASE RestaurantDB;
GO
USE RestaurantDB;
GO
-- Users table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(200) NOT NULL,
    email NVARCHAR(200) UNIQUE NOT NULL,
    password NVARCHAR(200) NOT NULL,
    role NVARCHAR(50) DEFAULT 'admin',
    is_active BIT DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- Restaurant info
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='restaurant' AND xtype='U')
CREATE TABLE restaurant (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(200) NOT NULL,
    name_am NVARCHAR(200),
    tagline NVARCHAR(300),
    description NVARCHAR(MAX),
    logo_url NVARCHAR(500),
    cover_url NVARCHAR(500),
    address NVARCHAR(500),
    phone NVARCHAR(50),
    wifi_password NVARCHAR(100),
    rating FLOAT DEFAULT 4.8,
    review_count INT DEFAULT 0,
    open_now BIT DEFAULT 1,
    working_hours NVARCHAR(200),
    vat_rate FLOAT DEFAULT 0.15,
    service_charge_rate FLOAT DEFAULT 0.10,
    currency NVARCHAR(10) DEFAULT 'ETB'
);
GO

-- Categories
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='categories' AND xtype='U')
CREATE TABLE categories (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    name_am NVARCHAR(100),
    icon NVARCHAR(10),
    color NVARCHAR(20),
    sort_order INT DEFAULT 0,
    is_active BIT DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- Menu Items
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='menu_items' AND xtype='U')
CREATE TABLE menu_items (
    id INT IDENTITY(1,1) PRIMARY KEY,
    category_id INT REFERENCES categories(id),
    name NVARCHAR(200) NOT NULL,
    name_am NVARCHAR(200),
    description NVARCHAR(MAX),
    description_am NVARCHAR(MAX),
    price FLOAT NOT NULL,
    image_url NVARCHAR(500),
    prep_time INT DEFAULT 15,
    is_spicy BIT DEFAULT 0,
    is_vegetarian BIT DEFAULT 0,
    is_available BIT DEFAULT 1,
    is_featured BIT DEFAULT 0,
    is_popular BIT DEFAULT 0,
    is_best_seller BIT DEFAULT 0,
    chef_recommended BIT DEFAULT 0,
    rating FLOAT DEFAULT 4.5,
    review_count INT DEFAULT 0,
    calories INT,
    discount FLOAT DEFAULT 0,
    allergens NVARCHAR(500),
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- Modifier Groups
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='modifier_groups' AND xtype='U')
CREATE TABLE modifier_groups (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(200) NOT NULL,
    name_am NVARCHAR(200),
    required BIT DEFAULT 0,
    multi_select BIT DEFAULT 0,
    max_select INT DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- Modifiers
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='modifiers' AND xtype='U')
CREATE TABLE modifiers (
    id INT IDENTITY(1,1) PRIMARY KEY,
    group_id INT REFERENCES modifier_groups(id) ON DELETE CASCADE,
    name NVARCHAR(200) NOT NULL,
    name_am NVARCHAR(200),
    price FLOAT DEFAULT 0,
    is_available BIT DEFAULT 1
);
GO

-- Tables
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tables' AND xtype='U')
CREATE TABLE tables (
    id INT IDENTITY(1,1) PRIMARY KEY,
    number NVARCHAR(20) UNIQUE NOT NULL,
    capacity INT DEFAULT 4,
    status NVARCHAR(20) DEFAULT 'available',
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- Orders
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='orders' AND xtype='U')
CREATE TABLE orders (
    id INT IDENTITY(1,1) PRIMARY KEY,
    order_ref NVARCHAR(50) UNIQUE NOT NULL,
    table_number NVARCHAR(20),
    customer_name NVARCHAR(200),
    phone NVARCHAR(50),
    notes NVARCHAR(MAX),
    status NVARCHAR(20) DEFAULT 'new',
    subtotal FLOAT,
    vat FLOAT,
    service_charge FLOAT,
    grand_total FLOAT,
    estimated_time INT DEFAULT 20,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

-- Order Items
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='order_items' AND xtype='U')
CREATE TABLE order_items (
    id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_name NVARCHAR(200),
    price FLOAT,
    quantity INT,
    modifiers NVARCHAR(MAX),
    special_instructions NVARCHAR(MAX),
    item_total FLOAT
);
GO

-- ============================================
-- SEED DATA
-- ============================================

-- Insert admin user (password = admin123)
IF NOT EXISTS (SELECT id FROM users WHERE email = 'admin@abc.com')
INSERT INTO users (name, email, password, role)
VALUES ('Admin User', 'admin@abc.com',
    '$2a$10$zLByROZ8hW39Q874QZ/ZL.DFOX/6X3lmHhvE49G84vQxBfEW20XIS', 'admin');
GO

-- Insert restaurant info
IF NOT EXISTS (SELECT id FROM restaurant)
INSERT INTO restaurant (name, name_am, tagline, address, phone, wifi_password, working_hours, cover_url)
VALUES (
    N'ABC Restaurant', N'ኤቢሲ ምግብ ቤት', N'Fine Dining & Fast Delivery',
    N'Bole Road, Addis Ababa, Ethiopia', N'+251 91 859 2028',
    N'ABCRest@2024', N'Mon–Sun: 7:00 AM – 11:00 PM',
    N'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80'
);
GO

-- Insert categories
IF NOT EXISTS (SELECT id FROM categories)
BEGIN
    INSERT INTO categories (name, name_am, icon, color, sort_order) VALUES (N'Breakfast', N'ቁርስ', N'🍳', N'#f48c06', 0);
    INSERT INTO categories (name, name_am, icon, color, sort_order) VALUES (N'Lunch', N'ምሳ', N'🥗', N'#2d9d4f', 1);
    INSERT INTO categories (name, name_am, icon, color, sort_order) VALUES (N'Dinner', N'እራት', N'🥩', N'#8b1a1a', 2);
    INSERT INTO categories (name, name_am, icon, color, sort_order) VALUES (N'Pizza', N'ፒዛ', N'🍕', N'#e85d04', 3);
    INSERT INTO categories (name, name_am, icon, color, sort_order) VALUES (N'Burger', N'በርገር', N'🍔', N'#d4a017', 4);
    INSERT INTO categories (name, name_am, icon, color, sort_order) VALUES (N'Pasta', N'ፓስታ', N'🍝', N'#c0392b', 5);
    INSERT INTO categories (name, name_am, icon, color, sort_order) VALUES (N'Drinks', N'መጠጦች', N'🥤', N'#2980b9', 6);
    INSERT INTO categories (name, name_am, icon, color, sort_order) VALUES (N'Desserts', N'ጣፋጭ', N'🍰', N'#e91e8c', 7);
    INSERT INTO categories (name, name_am, icon, color, sort_order) VALUES (N'Coffee', N'ቡና', N'☕', N'#6d4c41', 8);
END
GO

-- Insert tables
IF NOT EXISTS (SELECT id FROM tables)
BEGIN
    INSERT INTO tables (number, capacity) VALUES ('1', 2);
    INSERT INTO tables (number, capacity) VALUES ('2', 4);
    INSERT INTO tables (number, capacity) VALUES ('3', 4);
    INSERT INTO tables (number, capacity) VALUES ('4', 6);
    INSERT INTO tables (number, capacity) VALUES ('5', 2);
    INSERT INTO tables (number, capacity) VALUES ('6', 8);
    INSERT INTO tables (number, capacity) VALUES ('VIP 1', 4);
    INSERT INTO tables (number, capacity) VALUES ('Terrace 1', 6);
END
GO

PRINT 'RestaurantDB setup complete! Admin: admin@abc.com / admin123';
