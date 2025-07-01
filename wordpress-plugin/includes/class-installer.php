<?php
/**
 * Plugin Installer Class
 * Handles plugin activation, deactivation, and database setup
 */

if (!defined('ABSPATH')) {
    exit;
}

class Codelab_LMS_Installer {
    
    /**
     * Plugin activation hook
     */
    public static function activate() {
        // Create database tables
        self::create_tables();
        
        // Setup user roles and capabilities
        self::setup_roles();
        
        // Create default pages
        self::create_pages();
        
        // Set default options
        self::set_default_options();
        
        // Flush rewrite rules
        flush_rewrite_rules();
        
        // Set activation flag
        update_option('codelab_lms_activated', true);
    }
    
    /**
     * Plugin deactivation hook
     */
    public static function deactivate() {
        // Flush rewrite rules
        flush_rewrite_rules();
        
        // Remove activation flag
        delete_option('codelab_lms_activated');
    }
    
    /**
     * Create plugin database tables
     */
    private static function create_tables() {
        global $wpdb;
        
        $charset_collate = $wpdb->get_charset_collate();
        
        // Enrollments table
        $table_enrollments = $wpdb->prefix . 'codelab_lms_enrollments';
        $sql_enrollments = "CREATE TABLE $table_enrollments (
            id int(11) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            course_id bigint(20) NOT NULL,
            enrolled_date datetime NOT NULL,
            completion_date datetime NULL,
            progress_percentage int(3) DEFAULT 0,
            status enum('active', 'completed', 'suspended', 'expired') DEFAULT 'active',
            payment_id varchar(100) NULL,
            PRIMARY KEY (id),
            KEY user_id (user_id),
            KEY course_id (course_id),
            UNIQUE KEY user_course (user_id, course_id)
        ) $charset_collate;";
        
        // Lesson Progress table
        $table_progress = $wpdb->prefix . 'codelab_lms_lesson_progress';
        $sql_progress = "CREATE TABLE $table_progress (
            id int(11) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            lesson_id bigint(20) NOT NULL,
            completed_date datetime NULL,
            time_spent int(11) DEFAULT 0,
            last_accessed datetime NULL,
            PRIMARY KEY (id),
            KEY user_id (user_id),
            KEY lesson_id (lesson_id),
            UNIQUE KEY user_lesson (user_id, lesson_id)
        ) $charset_collate;";
        
        // Quizzes table
        $table_quizzes = $wpdb->prefix . 'codelab_lms_quizzes';
        $sql_quizzes = "CREATE TABLE $table_quizzes (
            id int(11) NOT NULL AUTO_INCREMENT,
            lesson_id bigint(20) NOT NULL,
            title varchar(255) NOT NULL,
            description text,
            time_limit int(11) DEFAULT 0,
            pass_percentage int(3) DEFAULT 70,
            max_attempts int(3) DEFAULT 3,
            question_order enum('fixed', 'random') DEFAULT 'fixed',
            status enum('draft', 'published') DEFAULT 'draft',
            created_date datetime NOT NULL,
            PRIMARY KEY (id),
            KEY lesson_id (lesson_id)
        ) $charset_collate;";
        
        // Quiz Questions table
        $table_questions = $wpdb->prefix . 'codelab_lms_quiz_questions';
        $sql_questions = "CREATE TABLE $table_questions (
            id int(11) NOT NULL AUTO_INCREMENT,
            quiz_id int(11) NOT NULL,
            question_text text NOT NULL,
            question_type enum('multiple_choice', 'true_false', 'essay', 'fill_blank') NOT NULL,
            points int(3) DEFAULT 1,
            correct_answer text,
            options text,
            explanation text,
            question_order int(3) DEFAULT 0,
            PRIMARY KEY (id),
            KEY quiz_id (quiz_id)
        ) $charset_collate;";
        
        // Quiz Attempts table
        $table_attempts = $wpdb->prefix . 'codelab_lms_quiz_attempts';
        $sql_attempts = "CREATE TABLE $table_attempts (
            id int(11) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            quiz_id int(11) NOT NULL,
            score decimal(5,2) DEFAULT 0,
            max_score decimal(5,2) DEFAULT 0,
            passed tinyint(1) DEFAULT 0,
            attempt_number int(3) DEFAULT 1,
            started_date datetime NOT NULL,
            completed_date datetime NULL,
            time_taken int(11) DEFAULT 0,
            answers text,
            PRIMARY KEY (id),
            KEY user_id (user_id),
            KEY quiz_id (quiz_id)
        ) $charset_collate;";
        
        // Messages table
        $table_messages = $wpdb->prefix . 'codelab_lms_messages';
        $sql_messages = "CREATE TABLE $table_messages (
            id int(11) NOT NULL AUTO_INCREMENT,
            sender_id bigint(20) NOT NULL,
            recipient_id bigint(20) NOT NULL,
            course_id bigint(20) NULL,
            subject varchar(255) NOT NULL,
            message text NOT NULL,
            attachment_url varchar(500) NULL,
            sent_date datetime NOT NULL,
            read_date datetime NULL,
            status enum('sent', 'read', 'archived') DEFAULT 'sent',
            PRIMARY KEY (id),
            KEY sender_id (sender_id),
            KEY recipient_id (recipient_id),
            KEY course_id (course_id)
        ) $charset_collate;";
        
        // Commissions table
        $table_commissions = $wpdb->prefix . 'codelab_lms_commissions';
        $sql_commissions = "CREATE TABLE $table_commissions (
            id int(11) NOT NULL AUTO_INCREMENT,
            mentor_id bigint(20) NOT NULL,
            enrollment_id int(11) NOT NULL,
            amount decimal(10,2) NOT NULL,
            commission_rate decimal(5,2) DEFAULT 37.00,
            status enum('pending', 'paid', 'cancelled') DEFAULT 'pending',
            created_date datetime NOT NULL,
            paid_date datetime NULL,
            notes text,
            PRIMARY KEY (id),
            KEY mentor_id (mentor_id),
            KEY enrollment_id (enrollment_id)
        ) $charset_collate;";
        
        // Certificates table
        $table_certificates = $wpdb->prefix . 'codelab_lms_certificates';
        $sql_certificates = "CREATE TABLE $table_certificates (
            id int(11) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            course_id bigint(20) NOT NULL,
            certificate_number varchar(100) NOT NULL,
            certificate_url varchar(500) NOT NULL,
            issued_date datetime NOT NULL,
            verification_code varchar(50) NOT NULL,
            status enum('issued', 'revoked') DEFAULT 'issued',
            PRIMARY KEY (id),
            KEY user_id (user_id),
            KEY course_id (course_id),
            UNIQUE KEY certificate_number (certificate_number),
            UNIQUE KEY verification_code (verification_code)
        ) $charset_collate;";
        
        // Payments table
        $table_payments = $wpdb->prefix . 'codelab_lms_payments';
        $sql_payments = "CREATE TABLE $table_payments (
            id int(11) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            course_id bigint(20) NOT NULL,
            payment_method varchar(50) NOT NULL,
            transaction_id varchar(100) NOT NULL,
            reference varchar(100) NOT NULL,
            amount decimal(10,2) NOT NULL,
            currency varchar(3) DEFAULT 'NGN',
            status enum('pending', 'successful', 'failed', 'cancelled') DEFAULT 'pending',
            gateway_response text,
            created_date datetime NOT NULL,
            updated_date datetime NULL,
            PRIMARY KEY (id),
            KEY user_id (user_id),
            KEY course_id (course_id),
            KEY transaction_id (transaction_id),
            KEY reference (reference)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        
        dbDelta($sql_enrollments);
        dbDelta($sql_progress);
        dbDelta($sql_quizzes);
        dbDelta($sql_questions);
        dbDelta($sql_attempts);
        dbDelta($sql_messages);
        dbDelta($sql_commissions);
        dbDelta($sql_certificates);
        dbDelta($sql_payments);
        
        // Update database version
        update_option('codelab_lms_db_version', CODELAB_LMS_VERSION);
    }
    
    /**
     * Setup user roles and capabilities
     */
    private static function setup_roles() {
        // LMS Student role
        add_role('lms_student', __('LMS Student', 'codelab-educare-lms'), array(
            'read' => true,
            'lms_access_courses' => true,
            'lms_submit_assignments' => true,
            'lms_take_quizzes' => true,
            'lms_view_progress' => true
        ));
        
        // LMS Mentor role
        add_role('lms_mentor', __('LMS Mentor', 'codelab-educare-lms'), array(
            'read' => true,
            'edit_posts' => true,
            'delete_posts' => true,
            'publish_posts' => true,
            'upload_files' => true,
            'lms_create_courses' => true,
            'lms_edit_courses' => true,
            'lms_manage_students' => true,
            'lms_grade_assignments' => true,
            'lms_view_analytics' => true,
            'lms_manage_commissions' => true
        ));
        
        // Add capabilities to administrator
        $admin_role = get_role('administrator');
        if ($admin_role) {
            $admin_role->add_cap('lms_manage_all');
            $admin_role->add_cap('lms_manage_settings');
            $admin_role->add_cap('lms_manage_payments');
            $admin_role->add_cap('lms_manage_commissions');
            $admin_role->add_cap('lms_view_reports');
        }
    }
    
    /**
     * Create default pages
     */
    private static function create_pages() {
        $pages = array(
            'student-dashboard' => array(
                'title' => __('Student Dashboard', 'codelab-educare-lms'),
                'content' => '[codelab_student_dashboard]'
            ),
            'mentor-dashboard' => array(
                'title' => __('Mentor Dashboard', 'codelab-educare-lms'),
                'content' => '[codelab_mentor_dashboard]'
            ),
            'courses' => array(
                'title' => __('Courses', 'codelab-educare-lms'),
                'content' => '[codelab_courses]'
            ),
            'my-courses' => array(
                'title' => __('My Courses', 'codelab-educare-lms'),
                'content' => '[codelab_my_courses]'
            )
        );
        
        foreach ($pages as $slug => $page) {
            // Check if page already exists
            $existing_page = get_page_by_path($slug);
            if (!$existing_page) {
                wp_insert_post(array(
                    'post_title' => $page['title'],
                    'post_content' => $page['content'],
                    'post_status' => 'publish',
                    'post_type' => 'page',
                    'post_name' => $slug
                ));
            }
        }
    }
    
    /**
     * Set default plugin options
     */
    private static function set_default_options() {
        $defaults = array(
            'commission_rate' => 37.0,
            'currency' => 'NGN',
            'currency_symbol' => '₦',
            'paystack_public_key' => '',
            'paystack_secret_key' => '',
            'email_notifications' => 1,
            'certificate_template' => 'default',
            'quiz_pass_percentage' => 70,
            'max_quiz_attempts' => 3
        );
        
        foreach ($defaults as $option => $value) {
            $option_name = 'codelab_lms_' . $option;
            if (!get_option($option_name)) {
                update_option($option_name, $value);
            }
        }
    }
}