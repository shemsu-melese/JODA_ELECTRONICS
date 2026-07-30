
/**
 * DATABASE MIGRATION MODULE
 * This module handles automatic database and table creation.
 * It runs when the server starts and ensures all tables exist
 */

const { initPool, pool } = require('./db');


 //Creates the database if it doesn't exist
const createDatabase = async () => {
    let connection;
    try {
        // Get a connection from the initPool (no database selected)
        connection = await initPool.getConnection();
        
        const dbName = process.env.DB_NAME;
        console.log(`Creating database '${dbName}' if not exists...`);
        
        await connection.execute(
            `CREATE DATABASE IF NOT EXISTS \`${dbName}\` 
             CHARACTER SET utf8mb4 
             COLLATE utf8mb4_unicode_ci`
        );
        
        console.log(`Database '${dbName}' is ready`);
        return true;
        
    } catch (error) {
        console.error('Failed to create database:', error.message);
        throw error;
    } finally {
        // ALWAYS release the connection back to the pool
        if (connection) {
            connection.release();
        }
    }
};

//Creates all tables if they don't exist

const createTables = async () => {
    try {
        console.log('Checking database tables...');
        
        // Create tables in dependency order
        await createRolesTable();
        await createUsersTable();
        await createCategoriesTable();
        await createProductsTable();
        await createProductImagesTable();
        await createProductSpecificationsTable();
        await createWishlistsTable();
        await createReviewsTable();
        await createContactMessagesTable();
        await createSettingsTable();
        
        console.log('All tables created successfully');
        return true;
        
    } catch (error) {
        console.error('Failed to create tables:', error.message);
        throw error;
    }
};


// INDIVIDUAL TABLE CREATION FUNCTIONS

const createRolesTable = async () => {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS roles (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            name VARCHAR(50) NOT NULL,
            description VARCHAR(255) DEFAULT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uk_roles_name (name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('   ✓ roles');
};

const createUsersTable = async () => {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS users (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            role_id INT UNSIGNED NOT NULL,
            full_name VARCHAR(100) NOT NULL,
            email VARCHAR(255) NOT NULL,
            password VARCHAR(255) NOT NULL COMMENT 'bcrypt hashed password',
            phone VARCHAR(20) DEFAULT NULL,
            avatar VARCHAR(255) DEFAULT NULL,
            is_active TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1=active, 0=disabled',
            remember_token VARCHAR(100) DEFAULT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uk_users_email (email),
            KEY idx_users_role_id (role_id),
            CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (id)
                ON DELETE RESTRICT
                ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('   ✓ users');
};

const createCategoriesTable = async () => {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS categories (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            name VARCHAR(100) NOT NULL,
            slug VARCHAR(150) NOT NULL,
            description TEXT DEFAULT NULL,
            image VARCHAR(255) DEFAULT NULL,
            is_active TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1=active, 0=hidden',
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uk_categories_slug (slug),
            KEY idx_categories_is_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('   ✓ categories');
};

const createProductsTable = async () => {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS products (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            category_id INT UNSIGNED NOT NULL,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(300) NOT NULL,
            model VARCHAR(100) DEFAULT NULL,
            price DECIMAL(10,2) NOT NULL COMMENT 'Product price - NEVER use FLOAT for money',
            description TEXT DEFAULT NULL,
            warranty VARCHAR(255) DEFAULT NULL COMMENT 'Warranty information text',
            status ENUM('ACTIVE', 'INACTIVE', 'FEATURED') NOT NULL DEFAULT 'ACTIVE',
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uk_products_slug (slug),
            KEY idx_products_category_id (category_id),
            KEY idx_products_status (status),
            KEY idx_products_name (name),
            CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories (id)
                ON DELETE RESTRICT
                ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('   ✓ products');
};

const createProductImagesTable = async () => {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS product_images (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            product_id INT UNSIGNED NOT NULL,
            image_url VARCHAR(255) NOT NULL COMMENT 'Path relative to uploads directory',
            is_primary TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1=primary image, 0=additional',
            sort_order INT UNSIGNED NOT NULL DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_product_images_product_id (product_id),
            KEY idx_product_images_is_primary (is_primary),
            CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products (id)
                ON DELETE CASCADE
                ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('   ✓ product_images');
};

const createProductSpecificationsTable = async () => {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS product_specifications (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            product_id INT UNSIGNED NOT NULL,
            specification VARCHAR(255) NOT NULL COMMENT 'Spec name (e.g., RAM, Battery, Display)',
            value VARCHAR(255) NOT NULL COMMENT 'Spec value (e.g., 8GB, 5000mAh, 6.7 inch)',
            sort_order INT UNSIGNED NOT NULL DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_product_specs_product_id (product_id),
            CONSTRAINT fk_product_specs_product FOREIGN KEY (product_id) REFERENCES products (id)
                ON DELETE CASCADE
                ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('   ✓ product_specifications');
};

const createWishlistsTable = async () => {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS wishlists (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id INT UNSIGNED NOT NULL,
            product_id INT UNSIGNED NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uk_wishlist_user_product (user_id, product_id),
            KEY idx_wishlists_user_id (user_id),
            KEY idx_wishlists_product_id (product_id),
            CONSTRAINT fk_wishlists_user FOREIGN KEY (user_id) REFERENCES users (id)
                ON DELETE CASCADE
                ON UPDATE CASCADE,
            CONSTRAINT fk_wishlists_product FOREIGN KEY (product_id) REFERENCES products (id)
                ON DELETE CASCADE
                ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('   ✓ wishlists');
};

const createReviewsTable = async () => {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS reviews (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id INT UNSIGNED NOT NULL,
            product_id INT UNSIGNED NOT NULL,
            rating TINYINT UNSIGNED NOT NULL COMMENT 'Rating from 1 to 5',
            comment TEXT DEFAULT NULL,
            status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uk_review_user_product (user_id, product_id),
            KEY idx_reviews_user_id (user_id),
            KEY idx_reviews_product_id (product_id),
            KEY idx_reviews_status (status),
            CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users (id)
                ON DELETE CASCADE
                ON UPDATE CASCADE,
            CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products (id)
                ON DELETE CASCADE
                ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('   ✓ reviews');
};

const createContactMessagesTable = async () => {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS contact_messages (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id INT UNSIGNED DEFAULT NULL COMMENT 'NULL for guest messages',
            name VARCHAR(100) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(20) DEFAULT NULL,
            subject VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            status ENUM('NEW', 'READ', 'REPLIED', 'ARCHIVED') NOT NULL DEFAULT 'NEW',
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_contact_messages_user_id (user_id),
            KEY idx_contact_messages_status (status),
            CONSTRAINT fk_contact_messages_user FOREIGN KEY (user_id) REFERENCES users (id)
                ON DELETE SET NULL
                ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('   ✓ contact_messages');
};

const createSettingsTable = async () => {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS settings (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            business_name VARCHAR(255) NOT NULL DEFAULT 'JODA ELECTRONICS',
            logo VARCHAR(255) DEFAULT NULL,
            phone VARCHAR(20) DEFAULT NULL,
            email VARCHAR(255) DEFAULT NULL,
            address TEXT DEFAULT NULL,
            business_hours TEXT DEFAULT NULL,
            facebook VARCHAR(255) DEFAULT NULL,
            telegram VARCHAR(255) DEFAULT NULL,
            instagram VARCHAR(255) DEFAULT NULL,
            tiktok VARCHAR(255) DEFAULT NULL,
            footer_text TEXT DEFAULT NULL,
            meta_title VARCHAR(255) DEFAULT NULL,
            meta_description TEXT DEFAULT NULL,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('   ✓ settings');
};

/**
 * Insert initial seed data
 * Uses INSERT IGNORE to safely skip if data already exists
 */
const seedData = async () => {
    try {
        console.log('🌱 Checking seed data...');
        
        // Seed roles
        const [roleRows] = await pool.execute('SELECT COUNT(*) AS count FROM roles');
        if (roleRows[0].count === 0) {
            await pool.execute(`
                INSERT INTO roles (id, name, description) VALUES 
                (1, 'ADMIN', 'System administrator with full access'),
                (2, 'CUSTOMER', 'Regular customer account')
            `);
            console.log('   ✓ Roles seeded');
        } else {
            console.log('   ✓ Roles already exist (skipped)');
        }
        
        // Seed categories
        const [categoryRows] = await pool.execute('SELECT COUNT(*) AS count FROM categories');
        if (categoryRows[0].count === 0) {
            await pool.execute(`
                INSERT INTO categories (id, name, slug, description, is_active) VALUES 
                (1, 'Smartphones', 'smartphones', 'Latest smartphones from top brands with cutting-edge technology', 1),
                (2, 'Smart Watches', 'smart-watches', 'Premium smartwatches with fitness tracking and health monitoring', 1),
                (3, 'Ring Lights', 'ring-lights', 'Professional ring lights for photography, videography, and content creation', 1),
                (4, 'Headsets', 'headsets', 'High-quality headsets for gaming, music, and professional use', 1),
                (5, 'Bluetooth Speakers', 'bluetooth-speakers', 'Portable bluetooth speakers with superior sound quality', 1)
            `);
            console.log('   ✓ Categories seeded');
        } else {
            console.log('   ✓ Categories already exist (skipped)');
        }
        
        // Seed default settings
        const [settingsRows] = await pool.execute('SELECT COUNT(*) AS count FROM settings');
        if (settingsRows[0].count === 0) {
            await pool.execute(`
                INSERT INTO settings (
                    business_name, phone, email, address, business_hours,
                    footer_text, meta_title, meta_description
                ) VALUES (
                    'JODA ELECTRONICS',
                    '+251-000-000-000',
                    'info@jodaelectronics.com',
                    'Addis Ababa, Ethiopia',
                    'Monday - Friday: 9:00 AM - 6:00 PM\\nSaturday: 9:00 AM - 2:00 PM\\nSunday: Closed',
                    '© 2024 JODA ELECTRONICS. All rights reserved.',
                    'JODA ELECTRONICS - Your Trusted Electronics Store',
                    'Shop the latest smartphones, smartwatches, headsets, bluetooth speakers, and ring lights at JODA ELECTRONICS.'
                )
            `);
            console.log('   ✓ Settings seeded');
        } else {
            console.log('   ✓ Settings already exist (skipped)');
        }
        
        console.log('✅ Seed data verified');
        
    } catch (error) {
        console.error('❌ Failed to seed data:', error.message);
        throw error;
    }
};

// MAIN MIGRATION FUNCTION

/**
 * Run the complete migration process
 */
const runMigration = async () => {
    // Check if auto-migration is enabled
    const autoMigrate = process.env.AUTO_MIGRATE || 'true';
    
    if (autoMigrate !== 'true') {
        console.log('Auto-migration is disabled');
        return;
    }
    
    console.log('   DATABASE MIGRATION STARTING');
    
    try {
        // Step 1: Create database (if not exists)
        await createDatabase();
        // Step 2: Create all tables (if not exists)
        await createTables();
        
        // Step 3: Insert seed data (if not exists)
        await seedData();

        console.log('  MIGRATION COMPLETED SUCCESSFULLY');
    } catch (error) {
        console.error('MIGRATION FAILED', error.message);
        throw error;
    }
};

module.exports = runMigration;