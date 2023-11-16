<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the installation.
 * You don't have to use the web site, you can copy this file to "wp-config.php"
 * and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * Database settings
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * @link https://wordpress.org/support/article/editing-wp-config-php/
 *
 * @package WordPress
 */

// ** Database settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', 'webbersunited_jum_db' );

/** Database username */
define( 'DB_USER', 'webbersunited_jum_db' );

/** Database password */
define( 'DB_PASSWORD', 'Xl;PE-pYBr?4' );

/** Database hostname */
define( 'DB_HOST', 'localhost' );

/** Database charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8mb4' );

/** The database collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication unique keys and salts.
 *
 * Change these to different unique phrases! You can generate these using
 * the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}.
 *
 * You can change these at any point in time to invalidate all existing cookies.
 * This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',         '&@x:w:snum9N<ukF6yq&.Uv<lm7LeBQXb#u*d `6F=#=7Cs|Jd7?Y)~>a6cn-o:Q' );
define( 'SECURE_AUTH_KEY',  'EU5/5vElC*>[3>5eM9>qNk;Ig.b%?iQ*o$m#X%qOy;a?wj$YiIEbkU6*ke7m1*Tb' );
define( 'LOGGED_IN_KEY',    'UH8b(3IAec9@*cb`J!Hi;S:Y)*=H14fTz:_}3Ge {<x78i9Y(!N%~)-.$a),M9Ii' );
define( 'NONCE_KEY',        '8pUx E5u_*]670jG.R?438:0jv8EmuK@~/MH9RD47Ju6,y*UD:{#lE+wx2q%!j @' );
define( 'AUTH_SALT',        'jV[js=%`{Vru>cXm11vO35WNa5i5f.86z7Ow=1Ck:[K5tb]R@n)}o4*/N[HRjc,e' );
define( 'SECURE_AUTH_SALT', 'Di9/zkfvnh:}y4l8$TgQq}^rcaiQL3ZY%G ecjy<8]y9.y)e%[<f7q{0<)MBrJxv' );
define( 'LOGGED_IN_SALT',   '`u!0-J4/44U8mHus1K>(X9cBwv>5rNS:a+#]Na6c0rb&T,ZzSLT!pz#dzg;^n~{0' );
define( 'NONCE_SALT',       '{M| y/Sen v7`$1E]GZkJcX`6rmbQSH5KK/v9VKdU~,PoQi?=bbY~G5_la ._k67' );

/**#@-*/

/**
 * WordPress database table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix = 'wp_';

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://wordpress.org/support/article/debugging-in-wordpress/
 */
define( 'WP_DEBUG', false );

/* Add any custom values between this line and the "stop editing" line. */



/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';
