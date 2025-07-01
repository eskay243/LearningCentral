<?php
/**
 * Public Class
 * Handles frontend functionality and user interface
 */

if (!defined('ABSPATH')) {
    exit;
}

class Codelab_LMS_Public {
    
    /**
     * Constructor
     */
    public function __construct() {
        add_action('init', array($this, 'init'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_filter('template_include', array($this, 'template_include'));
        add_action('wp_head', array($this, 'add_paystack_script'));
    }
    
    /**
     * Initialize public functionality
     */
    public function init() {
        // Add rewrite rules for custom pages
        add_rewrite_rule('^payment-callback/?', 'index.php?payment_callback=1', 'top');
        add_rewrite_rule('^course/([^/]+)/lesson/([^/]+)/?', 'index.php?course_slug=$matches[1]&lesson_slug=$matches[2]', 'top');
        
        // Add query vars
        add_filter('query_vars', array($this, 'add_query_vars'));
        
        // Handle payment callback
        add_action('template_redirect', array($this, 'handle_payment_callback'));
        
        // Handle course/lesson viewing
        add_action('template_redirect', array($this, 'handle_course_lesson_view'));
    }
    
    /**
     * Enqueue frontend scripts and styles
     */
    public function enqueue_scripts() {
        // Enqueue main public styles
        wp_enqueue_style(
            'codelab-lms-public',
            CODELAB_LMS_PLUGIN_URL . 'public/css/public.css',
            array(),
            CODELAB_LMS_VERSION
        );
        
        // Enqueue main public script
        wp_enqueue_script(
            'codelab-lms-public',
            CODELAB_LMS_PLUGIN_URL . 'public/js/public.js',
            array('jquery'),
            CODELAB_LMS_VERSION,
            true
        );
        
        // Localize script for AJAX and settings
        wp_localize_script('codelab-lms-public', 'codelab_lms', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('codelab_lms_nonce'),
            'currency_symbol' => '₦',
            'paystack_public_key' => get_option('codelab_lms_paystack_public_key', ''),
            'strings' => array(
                'loading' => __('Loading...', 'codelab-educare-lms'),
                'error' => __('An error occurred. Please try again.', 'codelab-educare-lms'),
                'confirm_enrollment' => __('Are you sure you want to enroll in this course?', 'codelab-educare-lms'),
                'payment_processing' => __('Processing payment...', 'codelab-educare-lms'),
                'enrollment_success' => __('Enrollment successful!', 'codelab-educare-lms'),
                'login_required' => __('Please login to continue.', 'codelab-educare-lms')
            )
        ));
        
        // Enqueue course player scripts on course pages
        if (is_singular('lms_course') || is_singular('lms_lesson')) {
            wp_enqueue_script(
                'codelab-lms-course-player',
                CODELAB_LMS_PLUGIN_URL . 'public/js/course-player.js',
                array('jquery'),
                CODELAB_LMS_VERSION,
                true
            );
        }
    }
    
    /**
     * Add Paystack script to head
     */
    public function add_paystack_script() {
        if (is_singular('lms_course') || is_page('courses')) {
            echo '<script src="https://js.paystack.co/v1/inline.js"></script>';
        }
    }
    
    /**
     * Template include filter
     */
    public function template_include($template) {
        // Course single template
        if (is_singular('lms_course')) {
            $custom_template = $this->locate_template('single-course.php');
            if ($custom_template) {
                return $custom_template;
            }
        }
        
        // Lesson single template
        if (is_singular('lms_lesson')) {
            $custom_template = $this->locate_template('single-lesson.php');
            if ($custom_template) {
                return $custom_template;
            }
        }
        
        // Course archive template
        if (is_post_type_archive('lms_course')) {
            $custom_template = $this->locate_template('archive-courses.php');
            if ($custom_template) {
                return $custom_template;
            }
        }
        
        return $template;
    }
    
    /**
     * Locate template file
     */
    private function locate_template($template_name) {
        // Check theme directory first
        $theme_template = locate_template(array('codelab-lms/' . $template_name, $template_name));
        
        if ($theme_template) {
            return $theme_template;
        }
        
        // Check plugin template directory
        $plugin_template = CODELAB_LMS_PLUGIN_PATH . 'templates/' . $template_name;
        
        if (file_exists($plugin_template)) {
            return $plugin_template;
        }
        
        return false;
    }
    
    /**
     * Add query vars
     */
    public function add_query_vars($vars) {
        $vars[] = 'payment_callback';
        $vars[] = 'course_slug';
        $vars[] = 'lesson_slug';
        return $vars;
    }
    
    /**
     * Handle payment callback
     */
    public function handle_payment_callback() {
        if (!get_query_var('payment_callback')) {
            return;
        }
        
        $reference = isset($_GET['reference']) ? sanitize_text_field($_GET['reference']) : '';
        
        if (!$reference) {
            wp_redirect(home_url());
            exit;
        }
        
        // Verify payment with Paystack
        $paystack = new Codelab_LMS_Paystack();
        $payment = $paystack->get_payment_status($reference);
        
        if ($payment && $payment->status === 'successful') {
            // Redirect to course page
            $course_url = get_permalink($payment->course_id);
            wp_redirect($course_url . '?enrolled=1');
        } else {
            // Redirect to courses page with error
            wp_redirect(get_permalink(get_page_by_path('courses')) . '?payment=failed');
        }
        
        exit;
    }
    
    /**
     * Handle course lesson viewing
     */
    public function handle_course_lesson_view() {
        $course_slug = get_query_var('course_slug');
        $lesson_slug = get_query_var('lesson_slug');
        
        if (!$course_slug || !$lesson_slug) {
            return;
        }
        
        // Get course and lesson
        $course = get_page_by_path($course_slug, OBJECT, 'lms_course');
        $lesson = get_page_by_path($lesson_slug, OBJECT, 'lms_lesson');
        
        if (!$course || !$lesson) {
            global $wp_query;
            $wp_query->set_404();
            return;
        }
        
        // Check if user can access lesson
        $user_id = get_current_user_id();
        
        if (!$user_id) {
            wp_redirect(wp_login_url(get_permalink($course->ID)));
            exit;
        }
        
        if (!Codelab_LMS_User_Roles::user_can_access_course($user_id, $course->ID)) {
            wp_redirect(get_permalink($course->ID));
            exit;
        }
        
        // Set global variables for template
        global $codelab_current_course, $codelab_current_lesson;
        $codelab_current_course = $course;
        $codelab_current_lesson = $lesson;
        
        // Track lesson view
        $this->track_lesson_progress($user_id, $lesson->ID);
    }
    
    /**
     * Track lesson progress
     */
    private function track_lesson_progress($user_id, $lesson_id) {
        global $wpdb;
        
        $progress_table = $wpdb->prefix . 'codelab_lms_lesson_progress';
        
        // Check if progress exists
        $existing_progress = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $progress_table WHERE user_id = %d AND lesson_id = %d",
            $user_id,
            $lesson_id
        ));
        
        if ($existing_progress) {
            // Update last accessed time
            $wpdb->update(
                $progress_table,
                array('last_accessed' => current_time('mysql')),
                array('user_id' => $user_id, 'lesson_id' => $lesson_id),
                array('%s'),
                array('%d', '%d')
            );
        } else {
            // Create new progress record
            $wpdb->insert(
                $progress_table,
                array(
                    'user_id' => $user_id,
                    'lesson_id' => $lesson_id,
                    'last_accessed' => current_time('mysql')
                ),
                array('%d', '%d', '%s')
            );
        }
    }
    
    /**
     * Get course completion percentage
     */
    public static function get_course_completion_percentage($user_id, $course_id) {
        global $wpdb;
        
        // Get total lessons in course
        $total_lessons = get_posts(array(
            'post_type' => 'lms_lesson',
            'meta_key' => '_lesson_course',
            'meta_value' => $course_id,
            'numberposts' => -1,
            'fields' => 'ids'
        ));
        
        if (empty($total_lessons)) {
            return 0;
        }
        
        // Get completed lessons
        $progress_table = $wpdb->prefix . 'codelab_lms_lesson_progress';
        $completed_lessons = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $progress_table 
             WHERE user_id = %d AND lesson_id IN (" . implode(',', array_map('intval', $total_lessons)) . ") 
             AND completed_date IS NOT NULL",
            $user_id
        ));
        
        return round(($completed_lessons / count($total_lessons)) * 100);
    }
    
    /**
     * Mark lesson as complete
     */
    public static function mark_lesson_complete($user_id, $lesson_id) {
        global $wpdb;
        
        $progress_table = $wpdb->prefix . 'codelab_lms_lesson_progress';
        
        // Update or insert lesson completion
        $existing = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM $progress_table WHERE user_id = %d AND lesson_id = %d",
            $user_id,
            $lesson_id
        ));
        
        if ($existing) {
            $wpdb->update(
                $progress_table,
                array(
                    'completed_date' => current_time('mysql'),
                    'last_accessed' => current_time('mysql')
                ),
                array('user_id' => $user_id, 'lesson_id' => $lesson_id),
                array('%s', '%s'),
                array('%d', '%d')
            );
        } else {
            $wpdb->insert(
                $progress_table,
                array(
                    'user_id' => $user_id,
                    'lesson_id' => $lesson_id,
                    'completed_date' => current_time('mysql'),
                    'last_accessed' => current_time('mysql')
                ),
                array('%d', '%d', '%s', '%s')
            );
        }
        
        // Check if course is completed
        $lesson = get_post($lesson_id);
        $course_id = get_post_meta($lesson_id, '_lesson_course', true);
        
        if ($course_id) {
            $completion_percentage = self::get_course_completion_percentage($user_id, $course_id);
            
            // Update enrollment progress
            $enrollments_table = $wpdb->prefix . 'codelab_lms_enrollments';
            $wpdb->update(
                $enrollments_table,
                array('progress_percentage' => $completion_percentage),
                array('user_id' => $user_id, 'course_id' => $course_id),
                array('%d'),
                array('%d', '%d')
            );
            
            // Mark course as completed if 100%
            if ($completion_percentage >= 100) {
                $wpdb->update(
                    $enrollments_table,
                    array(
                        'status' => 'completed',
                        'completion_date' => current_time('mysql')
                    ),
                    array('user_id' => $user_id, 'course_id' => $course_id),
                    array('%s', '%s'),
                    array('%d', '%d')
                );
                
                // Generate certificate if enabled
                $certificate_enabled = get_post_meta($course_id, '_course_certificate_enabled', true);
                if ($certificate_enabled) {
                    self::generate_certificate($user_id, $course_id);
                }
                
                // Send completion email
                self::send_course_completion_email($user_id, $course_id);
                
                // Trigger completion action
                do_action('codelab_lms_course_completed', $user_id, $course_id);
            }
        }
    }
    
    /**
     * Generate certificate for completed course
     */
    private static function generate_certificate($user_id, $course_id) {
        // Check if certificate already exists
        global $wpdb;
        $certificates_table = $wpdb->prefix . 'codelab_lms_certificates';
        
        $existing_certificate = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM $certificates_table WHERE user_id = %d AND course_id = %d",
            $user_id,
            $course_id
        ));
        
        if ($existing_certificate) {
            return;
        }
        
        // Generate certificate
        $certificate_generator = new Codelab_LMS_Certificates();
        $certificate_url = $certificate_generator->generate_certificate($user_id, $course_id);
        
        if ($certificate_url) {
            // Save certificate record
            $certificate_number = 'CLE-' . strtoupper(wp_generate_password(8, false));
            $verification_code = wp_generate_password(12, false);
            
            $wpdb->insert(
                $certificates_table,
                array(
                    'user_id' => $user_id,
                    'course_id' => $course_id,
                    'certificate_number' => $certificate_number,
                    'certificate_url' => $certificate_url,
                    'issued_date' => current_time('mysql'),
                    'verification_code' => $verification_code,
                    'status' => 'issued'
                ),
                array('%d', '%d', '%s', '%s', '%s', '%s', '%s')
            );
        }
    }
    
    /**
     * Send course completion email
     */
    private static function send_course_completion_email($user_id, $course_id) {
        if (!get_option('codelab_lms_email_notifications', 1)) {
            return;
        }
        
        $user = get_user_by('ID', $user_id);
        $course = get_post($course_id);
        
        $subject = sprintf(__('Congratulations! You completed %s', 'codelab-educare-lms'), $course->post_title);
        
        $message = sprintf(
            __('Hi %s,

Congratulations! You have successfully completed the course "%s".

Your certificate will be available in your dashboard shortly.

Keep learning!

Best regards,
Codelab Educare Team', 'codelab-educare-lms'),
            $user->display_name,
            $course->post_title
        );
        
        wp_mail($user->user_email, $subject, $message);
    }
    
    /**
     * Get course lessons
     */
    public static function get_course_lessons($course_id) {
        return get_posts(array(
            'post_type' => 'lms_lesson',
            'meta_key' => '_lesson_course',
            'meta_value' => $course_id,
            'numberposts' => -1,
            'orderby' => 'menu_order',
            'order' => 'ASC',
            'post_status' => 'publish'
        ));
    }
    
    /**
     * Get user's lesson progress
     */
    public static function get_user_lesson_progress($user_id, $lesson_id) {
        global $wpdb;
        
        $progress_table = $wpdb->prefix . 'codelab_lms_lesson_progress';
        return $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $progress_table WHERE user_id = %d AND lesson_id = %d",
            $user_id,
            $lesson_id
        ));
    }
    
    /**
     * Check if lesson is completed
     */
    public static function is_lesson_completed($user_id, $lesson_id) {
        $progress = self::get_user_lesson_progress($user_id, $lesson_id);
        return $progress && !empty($progress->completed_date);
    }
    
    /**
     * Get next lesson in course
     */
    public static function get_next_lesson($course_id, $current_lesson_id) {
        $lessons = self::get_course_lessons($course_id);
        $current_index = false;
        
        foreach ($lessons as $index => $lesson) {
            if ($lesson->ID == $current_lesson_id) {
                $current_index = $index;
                break;
            }
        }
        
        if ($current_index !== false && isset($lessons[$current_index + 1])) {
            return $lessons[$current_index + 1];
        }
        
        return null;
    }
    
    /**
     * Get previous lesson in course
     */
    public static function get_previous_lesson($course_id, $current_lesson_id) {
        $lessons = self::get_course_lessons($course_id);
        $current_index = false;
        
        foreach ($lessons as $index => $lesson) {
            if ($lesson->ID == $current_lesson_id) {
                $current_index = $index;
                break;
            }
        }
        
        if ($current_index !== false && $current_index > 0) {
            return $lessons[$current_index - 1];
        }
        
        return null;
    }
}