<?php
/**
 * Plugin Name: Codelab Educare LMS
 * Plugin URI: https://codelabeducare.com
 * Description: Comprehensive Learning Management System optimized for the Nigerian education market with Paystack integration, course management, and mentor commission system.
 * Version: 1.0.0
 * Author: Codelab Educare
 * Author URI: https://codelabeducare.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: codelab-educare-lms
 * Domain Path: /languages
 * Requires at least: 5.0
 * Tested up to: 6.4
 * Requires PHP: 7.4
 * Network: false
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('CODELAB_LMS_VERSION', '1.0.0');
define('CODELAB_LMS_PLUGIN_URL', plugin_dir_url(__FILE__));
define('CODELAB_LMS_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('CODELAB_LMS_PLUGIN_BASENAME', plugin_basename(__FILE__));

/**
 * Main Codelab LMS Class
 */
class Codelab_Educare_LMS {
    
    /**
     * Single instance of the class
     */
    private static $instance = null;
    
    /**
     * Get single instance
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Constructor
     */
    private function __construct() {
        $this->init();
    }
    
    /**
     * Initialize the plugin
     */
    private function init() {
        // Load plugin files
        $this->includes();
        
        // Initialize hooks
        $this->init_hooks();
        
        // Load text domain
        add_action('plugins_loaded', array($this, 'load_textdomain'));
    }
    
    /**
     * Include required files
     */
    private function includes() {
        require_once CODELAB_LMS_PLUGIN_PATH . 'includes/class-installer.php';
        require_once CODELAB_LMS_PLUGIN_PATH . 'includes/class-post-types.php';
        require_once CODELAB_LMS_PLUGIN_PATH . 'includes/class-user-roles.php';
        require_once CODELAB_LMS_PLUGIN_PATH . 'includes/class-database.php';
        require_once CODELAB_LMS_PLUGIN_PATH . 'includes/class-ajax.php';
        require_once CODELAB_LMS_PLUGIN_PATH . 'admin/class-admin.php';
        require_once CODELAB_LMS_PLUGIN_PATH . 'public/class-public.php';
        require_once CODELAB_LMS_PLUGIN_PATH . 'api/class-rest-api.php';
        require_once CODELAB_LMS_PLUGIN_PATH . 'includes/class-paystack.php';
        require_once CODELAB_LMS_PLUGIN_PATH . 'includes/class-certificates.php';
        require_once CODELAB_LMS_PLUGIN_PATH . 'includes/class-shortcodes.php';
    }
    
    /**
     * Initialize hooks
     */
    private function init_hooks() {
        // Activation and deactivation hooks
        register_activation_hook(__FILE__, array('Codelab_LMS_Installer', 'activate'));
        register_deactivation_hook(__FILE__, array('Codelab_LMS_Installer', 'deactivate'));
        
        // Initialize components
        add_action('init', array('Codelab_LMS_Post_Types', 'init'));
        add_action('init', array('Codelab_LMS_User_Roles', 'init'));
        add_action('init', array('Codelab_LMS_Shortcodes', 'init'));
        add_action('rest_api_init', array('Codelab_LMS_REST_API', 'init'));
        
        // Initialize admin and public classes
        if (is_admin()) {
            new Codelab_LMS_Admin();
        } else {
            new Codelab_LMS_Public();
        }
        
        // Initialize AJAX handlers
        new Codelab_LMS_Ajax();
        
        // Enqueue scripts and styles
        add_action('wp_enqueue_scripts', array($this, 'enqueue_public_assets'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_assets'));
    }
    
    /**
     * Load plugin text domain
     */
    public function load_textdomain() {
        load_plugin_textdomain(
            'codelab-educare-lms',
            false,
            dirname(CODELAB_LMS_PLUGIN_BASENAME) . '/languages/'
        );
    }
    
    /**
     * Enqueue public assets
     */
    public function enqueue_public_assets() {
        wp_enqueue_style(
            'codelab-lms-public',
            CODELAB_LMS_PLUGIN_URL . 'public/css/public.css',
            array(),
            CODELAB_LMS_VERSION
        );
        
        wp_enqueue_script(
            'codelab-lms-public',
            CODELAB_LMS_PLUGIN_URL . 'public/js/public.js',
            array('jquery'),
            CODELAB_LMS_VERSION,
            true
        );
        
        // Localize script for AJAX
        wp_localize_script('codelab-lms-public', 'codelab_lms_ajax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('codelab_lms_nonce'),
            'currency_symbol' => '₦',
            'paystack_public_key' => get_option('codelab_lms_paystack_public_key', '')
        ));
    }
    
    /**
     * Enqueue admin assets
     */
    public function enqueue_admin_assets($hook) {
        // Only load on LMS pages
        if (strpos($hook, 'codelab-lms') === false) {
            return;
        }
        
        wp_enqueue_style(
            'codelab-lms-admin',
            CODELAB_LMS_PLUGIN_URL . 'admin/css/admin.css',
            array(),
            CODELAB_LMS_VERSION
        );
        
        wp_enqueue_script(
            'codelab-lms-admin',
            CODELAB_LMS_PLUGIN_URL . 'admin/js/admin.js',
            array('jquery', 'wp-util'),
            CODELAB_LMS_VERSION,
            true
        );
        
        wp_localize_script('codelab-lms-admin', 'codelab_lms_admin', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('codelab_lms_admin_nonce'),
            'strings' => array(
                'confirm_delete' => __('Are you sure you want to delete this item?', 'codelab-educare-lms'),
                'processing' => __('Processing...', 'codelab-educare-lms'),
                'success' => __('Operation completed successfully!', 'codelab-educare-lms'),
                'error' => __('An error occurred. Please try again.', 'codelab-educare-lms')
            )
        ));
    }
}

/**
 * Initialize the plugin
 */
function codelab_educare_lms() {
    return Codelab_Educare_LMS::get_instance();
}

// Start the plugin
codelab_educare_lms();

/**
 * Helper functions
 */

/**
 * Check if user is enrolled in course
 */
function codelab_lms_is_user_enrolled($user_id, $course_id) {
    global $wpdb;
    
    $table_name = $wpdb->prefix . 'codelab_lms_enrollments';
    $result = $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM $table_name WHERE user_id = %d AND course_id = %d AND status = 'active'",
        $user_id,
        $course_id
    ));
    
    return $result > 0;
}

/**
 * Get course progress for user
 */
function codelab_lms_get_course_progress($user_id, $course_id) {
    global $wpdb;
    
    $table_name = $wpdb->prefix . 'codelab_lms_enrollments';
    $progress = $wpdb->get_var($wpdb->prepare(
        "SELECT progress_percentage FROM $table_name WHERE user_id = %d AND course_id = %d",
        $user_id,
        $course_id
    ));
    
    return intval($progress);
}

/**
 * Enroll user in course
 */
function codelab_lms_enroll_user($user_id, $course_id, $payment_id = null) {
    global $wpdb;
    
    $table_name = $wpdb->prefix . 'codelab_lms_enrollments';
    
    // Check if already enrolled
    if (codelab_lms_is_user_enrolled($user_id, $course_id)) {
        return false;
    }
    
    $result = $wpdb->insert(
        $table_name,
        array(
            'user_id' => $user_id,
            'course_id' => $course_id,
            'enrolled_date' => current_time('mysql'),
            'status' => 'active',
            'payment_id' => $payment_id
        ),
        array('%d', '%d', '%s', '%s', '%s')
    );
    
    if ($result) {
        // Trigger enrollment action
        do_action('codelab_lms_user_enrolled', $user_id, $course_id, $payment_id);
        return true;
    }
    
    return false;
}

/**
 * Format Nigerian currency
 */
function codelab_lms_format_currency($amount) {
    return '₦' . number_format($amount, 2);
}