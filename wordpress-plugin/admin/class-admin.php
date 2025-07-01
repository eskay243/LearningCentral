<?php
/**
 * Admin Class
 * Handles WordPress admin interface for the LMS
 */

if (!defined('ABSPATH')) {
    exit;
}

class Codelab_LMS_Admin {
    
    /**
     * Constructor
     */
    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menus'));
        add_action('admin_init', array($this, 'admin_init'));
        add_action('admin_notices', array($this, 'admin_notices'));
    }
    
    /**
     * Add admin menus
     */
    public function add_admin_menus() {
        // Main LMS menu
        add_menu_page(
            __('Codelab LMS', 'codelab-educare-lms'),
            __('Codelab LMS', 'codelab-educare-lms'),
            'lms_manage_all',
            'codelab-lms',
            array($this, 'dashboard_page'),
            'dashicons-graduation-cap',
            30
        );
        
        // Dashboard submenu
        add_submenu_page(
            'codelab-lms',
            __('Dashboard', 'codelab-educare-lms'),
            __('Dashboard', 'codelab-educare-lms'),
            'lms_manage_all',
            'codelab-lms',
            array($this, 'dashboard_page')
        );
        
        // Students submenu
        add_submenu_page(
            'codelab-lms',
            __('Students', 'codelab-educare-lms'),
            __('Students', 'codelab-educare-lms'),
            'lms_manage_students',
            'codelab-lms-students',
            array($this, 'students_page')
        );
        
        // Enrollments submenu
        add_submenu_page(
            'codelab-lms',
            __('Enrollments', 'codelab-educare-lms'),
            __('Enrollments', 'codelab-educare-lms'),
            'lms_manage_all',
            'codelab-lms-enrollments',
            array($this, 'enrollments_page')
        );
        
        // Payments submenu
        add_submenu_page(
            'codelab-lms',
            __('Payments', 'codelab-educare-lms'),
            __('Payments', 'codelab-educare-lms'),
            'lms_manage_payments',
            'codelab-lms-payments',
            array($this, 'payments_page')
        );
        
        // Commissions submenu
        add_submenu_page(
            'codelab-lms',
            __('Commissions', 'codelab-educare-lms'),
            __('Commissions', 'codelab-educare-lms'),
            'lms_manage_commissions',
            'codelab-lms-commissions',
            array($this, 'commissions_page')
        );
        
        // Reports submenu
        add_submenu_page(
            'codelab-lms',
            __('Reports', 'codelab-educare-lms'),
            __('Reports', 'codelab-educare-lms'),
            'lms_view_reports',
            'codelab-lms-reports',
            array($this, 'reports_page')
        );
        
        // Settings submenu
        add_submenu_page(
            'codelab-lms',
            __('Settings', 'codelab-educare-lms'),
            __('Settings', 'codelab-educare-lms'),
            'lms_manage_settings',
            'codelab-lms-settings',
            array($this, 'settings_page')
        );
    }
    
    /**
     * Admin initialization
     */
    public function admin_init() {
        // Register settings
        register_setting('codelab_lms_settings', 'codelab_lms_commission_rate');
        register_setting('codelab_lms_settings', 'codelab_lms_currency');
        register_setting('codelab_lms_settings', 'codelab_lms_paystack_public_key');
        register_setting('codelab_lms_settings', 'codelab_lms_paystack_secret_key');
        register_setting('codelab_lms_settings', 'codelab_lms_email_notifications');
        register_setting('codelab_lms_settings', 'codelab_lms_certificate_template');
    }
    
    /**
     * Display admin notices
     */
    public function admin_notices() {
        // Check if Paystack keys are configured
        $public_key = get_option('codelab_lms_paystack_public_key');
        $secret_key = get_option('codelab_lms_paystack_secret_key');
        
        if (empty($public_key) || empty($secret_key)) {
            ?>
            <div class="notice notice-warning is-dismissible">
                <p>
                    <?php _e('Paystack payment keys are not configured.', 'codelab-educare-lms'); ?>
                    <a href="<?php echo admin_url('admin.php?page=codelab-lms-settings'); ?>">
                        <?php _e('Configure now', 'codelab-educare-lms'); ?>
                    </a>
                </p>
            </div>
            <?php
        }
    }
    
    /**
     * Dashboard page
     */
    public function dashboard_page() {
        global $wpdb;
        
        // Get statistics
        $total_courses = wp_count_posts('lms_course')->publish;
        $total_students = count(get_users(array('role' => 'lms_student')));
        $total_mentors = count(get_users(array('role' => 'lms_mentor')));
        
        // Get enrollment stats
        $enrollments_table = $wpdb->prefix . 'codelab_lms_enrollments';
        $total_enrollments = $wpdb->get_var("SELECT COUNT(*) FROM $enrollments_table WHERE status = 'active'");
        $completed_courses = $wpdb->get_var("SELECT COUNT(*) FROM $enrollments_table WHERE status = 'completed'");
        
        // Get revenue stats
        $payments_table = $wpdb->prefix . 'codelab_lms_payments';
        $total_revenue = $wpdb->get_var("SELECT SUM(amount) FROM $payments_table WHERE status = 'successful'");
        $monthly_revenue = $wpdb->get_var("SELECT SUM(amount) FROM $payments_table WHERE status = 'successful' AND MONTH(created_date) = MONTH(CURRENT_DATE()) AND YEAR(created_date) = YEAR(CURRENT_DATE())");
        
        ?>
        <div class="wrap">
            <h1><?php _e('Codelab LMS Dashboard', 'codelab-educare-lms'); ?></h1>
            
            <div class="codelab-dashboard-stats">
                <div class="codelab-stat-card">
                    <h3><?php _e('Total Courses', 'codelab-educare-lms'); ?></h3>
                    <div class="codelab-stat-number"><?php echo number_format($total_courses); ?></div>
                </div>
                
                <div class="codelab-stat-card">
                    <h3><?php _e('Active Students', 'codelab-educare-lms'); ?></h3>
                    <div class="codelab-stat-number"><?php echo number_format($total_students); ?></div>
                </div>
                
                <div class="codelab-stat-card">
                    <h3><?php _e('Mentors', 'codelab-educare-lms'); ?></h3>
                    <div class="codelab-stat-number"><?php echo number_format($total_mentors); ?></div>
                </div>
                
                <div class="codelab-stat-card">
                    <h3><?php _e('Enrollments', 'codelab-educare-lms'); ?></h3>
                    <div class="codelab-stat-number"><?php echo number_format($total_enrollments); ?></div>
                </div>
                
                <div class="codelab-stat-card">
                    <h3><?php _e('Completed Courses', 'codelab-educare-lms'); ?></h3>
                    <div class="codelab-stat-number"><?php echo number_format($completed_courses); ?></div>
                </div>
                
                <div class="codelab-stat-card">
                    <h3><?php _e('Total Revenue', 'codelab-educare-lms'); ?></h3>
                    <div class="codelab-stat-number"><?php echo codelab_lms_format_currency($total_revenue ?: 0); ?></div>
                </div>
                
                <div class="codelab-stat-card">
                    <h3><?php _e('Monthly Revenue', 'codelab-educare-lms'); ?></h3>
                    <div class="codelab-stat-number"><?php echo codelab_lms_format_currency($monthly_revenue ?: 0); ?></div>
                </div>
            </div>
            
            <div class="codelab-dashboard-widgets">
                <div class="codelab-widget">
                    <h3><?php _e('Recent Enrollments', 'codelab-educare-lms'); ?></h3>
                    <?php $this->recent_enrollments_widget(); ?>
                </div>
                
                <div class="codelab-widget">
                    <h3><?php _e('Popular Courses', 'codelab-educare-lms'); ?></h3>
                    <?php $this->popular_courses_widget(); ?>
                </div>
            </div>
        </div>
        
        <style>
        .codelab-dashboard-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        
        .codelab-stat-card {
            background: #fff;
            border: 1px solid #ccd0d4;
            border-radius: 4px;
            padding: 20px;
            text-align: center;
        }
        
        .codelab-stat-card h3 {
            margin: 0 0 10px 0;
            font-size: 14px;
            color: #666;
        }
        
        .codelab-stat-number {
            font-size: 32px;
            font-weight: bold;
            color: #2271b1;
        }
        
        .codelab-dashboard-widgets {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
        }
        
        .codelab-widget {
            background: #fff;
            border: 1px solid #ccd0d4;
            border-radius: 4px;
            padding: 20px;
        }
        
        .codelab-widget h3 {
            margin: 0 0 15px 0;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        }
        </style>
        <?php
    }
    
    /**
     * Recent enrollments widget
     */
    private function recent_enrollments_widget() {
        global $wpdb;
        
        $enrollments_table = $wpdb->prefix . 'codelab_lms_enrollments';
        $recent_enrollments = $wpdb->get_results($wpdb->prepare("
            SELECT e.*, u.display_name, p.post_title as course_title
            FROM $enrollments_table e
            LEFT JOIN {$wpdb->users} u ON e.user_id = u.ID
            LEFT JOIN {$wpdb->posts} p ON e.course_id = p.ID
            WHERE e.status = 'active'
            ORDER BY e.enrolled_date DESC
            LIMIT %d
        ", 5));
        
        if ($recent_enrollments) {
            echo '<ul>';
            foreach ($recent_enrollments as $enrollment) {
                echo '<li>';
                echo '<strong>' . esc_html($enrollment->display_name) . '</strong> ';
                echo __('enrolled in', 'codelab-educare-lms') . ' ';
                echo '<em>' . esc_html($enrollment->course_title) . '</em>';
                echo '<br><small>' . human_time_diff(strtotime($enrollment->enrolled_date)) . ' ' . __('ago', 'codelab-educare-lms') . '</small>';
                echo '</li>';
            }
            echo '</ul>';
        } else {
            echo '<p>' . __('No recent enrollments.', 'codelab-educare-lms') . '</p>';
        }
    }
    
    /**
     * Popular courses widget
     */
    private function popular_courses_widget() {
        global $wpdb;
        
        $enrollments_table = $wpdb->prefix . 'codelab_lms_enrollments';
        $popular_courses = $wpdb->get_results($wpdb->prepare("
            SELECT p.post_title, COUNT(e.id) as enrollment_count
            FROM {$wpdb->posts} p
            LEFT JOIN $enrollments_table e ON p.ID = e.course_id
            WHERE p.post_type = 'lms_course' AND p.post_status = 'publish'
            GROUP BY p.ID
            ORDER BY enrollment_count DESC
            LIMIT %d
        ", 5));
        
        if ($popular_courses) {
            echo '<ul>';
            foreach ($popular_courses as $course) {
                echo '<li>';
                echo '<strong>' . esc_html($course->post_title) . '</strong>';
                echo '<br><small>' . sprintf(_n('%d student', '%d students', $course->enrollment_count, 'codelab-educare-lms'), $course->enrollment_count) . '</small>';
                echo '</li>';
            }
            echo '</ul>';
        } else {
            echo '<p>' . __('No course data available.', 'codelab-educare-lms') . '</p>';
        }
    }
    
    /**
     * Students page
     */
    public function students_page() {
        ?>
        <div class="wrap">
            <h1><?php _e('Students', 'codelab-educare-lms'); ?></h1>
            <p><?php _e('Manage student accounts and enrollments.', 'codelab-educare-lms'); ?></p>
            
            <?php
            // Create students list table
            $students_table = new Codelab_LMS_Students_List_Table();
            $students_table->prepare_items();
            $students_table->display();
            ?>
        </div>
        <?php
    }
    
    /**
     * Enrollments page
     */
    public function enrollments_page() {
        ?>
        <div class="wrap">
            <h1><?php _e('Enrollments', 'codelab-educare-lms'); ?></h1>
            <p><?php _e('View and manage course enrollments.', 'codelab-educare-lms'); ?></p>
            
            <a href="#" class="page-title-action"><?php _e('Add New Enrollment', 'codelab-educare-lms'); ?></a>
            
            <!-- Enrollments table would go here -->
        </div>
        <?php
    }
    
    /**
     * Payments page
     */
    public function payments_page() {
        ?>
        <div class="wrap">
            <h1><?php _e('Payments', 'codelab-educare-lms'); ?></h1>
            <p><?php _e('View payment transactions and history.', 'codelab-educare-lms'); ?></p>
            
            <!-- Payments table would go here -->
        </div>
        <?php
    }
    
    /**
     * Commissions page
     */
    public function commissions_page() {
        ?>
        <div class="wrap">
            <h1><?php _e('Commissions', 'codelab-educare-lms'); ?></h1>
            <p><?php _e('Manage mentor commissions and payouts.', 'codelab-educare-lms'); ?></p>
            
            <!-- Commissions table would go here -->
        </div>
        <?php
    }
    
    /**
     * Reports page
     */
    public function reports_page() {
        ?>
        <div class="wrap">
            <h1><?php _e('Reports', 'codelab-educare-lms'); ?></h1>
            <p><?php _e('View detailed analytics and reports.', 'codelab-educare-lms'); ?></p>
            
            <!-- Reports content would go here -->
        </div>
        <?php
    }
    
    /**
     * Settings page
     */
    public function settings_page() {
        if (isset($_POST['submit'])) {
            // Save settings
            update_option('codelab_lms_commission_rate', floatval($_POST['commission_rate']));
            update_option('codelab_lms_currency', sanitize_text_field($_POST['currency']));
            update_option('codelab_lms_paystack_public_key', sanitize_text_field($_POST['paystack_public_key']));
            update_option('codelab_lms_paystack_secret_key', sanitize_text_field($_POST['paystack_secret_key']));
            update_option('codelab_lms_email_notifications', intval($_POST['email_notifications']));
            update_option('codelab_lms_certificate_template', sanitize_text_field($_POST['certificate_template']));
            
            echo '<div class="notice notice-success"><p>' . __('Settings saved successfully!', 'codelab-educare-lms') . '</p></div>';
        }
        
        $commission_rate = get_option('codelab_lms_commission_rate', 37.0);
        $currency = get_option('codelab_lms_currency', 'NGN');
        $paystack_public_key = get_option('codelab_lms_paystack_public_key', '');
        $paystack_secret_key = get_option('codelab_lms_paystack_secret_key', '');
        $email_notifications = get_option('codelab_lms_email_notifications', 1);
        $certificate_template = get_option('codelab_lms_certificate_template', 'default');
        ?>
        
        <div class="wrap">
            <h1><?php _e('LMS Settings', 'codelab-educare-lms'); ?></h1>
            
            <form method="post" action="">
                <?php wp_nonce_field('codelab_lms_settings', 'codelab_lms_settings_nonce'); ?>
                
                <table class="form-table">
                    <tr>
                        <th scope="row"><?php _e('Commission Rate (%)', 'codelab-educare-lms'); ?></th>
                        <td>
                            <input type="number" name="commission_rate" value="<?php echo esc_attr($commission_rate); ?>" step="0.01" min="0" max="100" />
                            <p class="description"><?php _e('Percentage of course price paid to mentors as commission.', 'codelab-educare-lms'); ?></p>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row"><?php _e('Currency', 'codelab-educare-lms'); ?></th>
                        <td>
                            <select name="currency">
                                <option value="NGN" <?php selected($currency, 'NGN'); ?>>Nigerian Naira (₦)</option>
                                <option value="USD" <?php selected($currency, 'USD'); ?>>US Dollar ($)</option>
                                <option value="GBP" <?php selected($currency, 'GBP'); ?>>British Pound (£)</option>
                            </select>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row"><?php _e('Paystack Public Key', 'codelab-educare-lms'); ?></th>
                        <td>
                            <input type="text" name="paystack_public_key" value="<?php echo esc_attr($paystack_public_key); ?>" class="regular-text" />
                            <p class="description"><?php _e('Your Paystack public key (starts with pk_).', 'codelab-educare-lms'); ?></p>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row"><?php _e('Paystack Secret Key', 'codelab-educare-lms'); ?></th>
                        <td>
                            <input type="password" name="paystack_secret_key" value="<?php echo esc_attr($paystack_secret_key); ?>" class="regular-text" />
                            <p class="description"><?php _e('Your Paystack secret key (starts with sk_).', 'codelab-educare-lms'); ?></p>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row"><?php _e('Email Notifications', 'codelab-educare-lms'); ?></th>
                        <td>
                            <label>
                                <input type="checkbox" name="email_notifications" value="1" <?php checked($email_notifications, 1); ?> />
                                <?php _e('Send email notifications for enrollments and completions', 'codelab-educare-lms'); ?>
                            </label>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row"><?php _e('Certificate Template', 'codelab-educare-lms'); ?></th>
                        <td>
                            <select name="certificate_template">
                                <option value="default" <?php selected($certificate_template, 'default'); ?>><?php _e('Default Template', 'codelab-educare-lms'); ?></option>
                                <option value="modern" <?php selected($certificate_template, 'modern'); ?>><?php _e('Modern Template', 'codelab-educare-lms'); ?></option>
                                <option value="classic" <?php selected($certificate_template, 'classic'); ?>><?php _e('Classic Template', 'codelab-educare-lms'); ?></option>
                            </select>
                        </td>
                    </tr>
                </table>
                
                <?php submit_button(); ?>
            </form>
        </div>
        <?php
    }
}