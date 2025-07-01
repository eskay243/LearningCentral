<?php
/**
 * User Roles Class
 * Handles WordPress user role extensions for LMS functionality
 */

if (!defined('ABSPATH')) {
    exit;
}

class Codelab_LMS_User_Roles {
    
    /**
     * Initialize user roles
     */
    public static function init() {
        add_action('init', array(__CLASS__, 'add_custom_capabilities'));
        add_action('user_register', array(__CLASS__, 'set_default_role'));
        add_action('show_user_profile', array(__CLASS__, 'add_user_profile_fields'));
        add_action('edit_user_profile', array(__CLASS__, 'add_user_profile_fields'));
        add_action('personal_options_update', array(__CLASS__, 'save_user_profile_fields'));
        add_action('edit_user_profile_update', array(__CLASS__, 'save_user_profile_fields'));
    }
    
    /**
     * Add custom capabilities to existing roles
     */
    public static function add_custom_capabilities() {
        // Add LMS capabilities to administrator
        $admin_role = get_role('administrator');
        if ($admin_role) {
            $admin_caps = array(
                'lms_manage_all',
                'lms_manage_settings',
                'lms_manage_payments',
                'lms_manage_commissions',
                'lms_view_reports',
                'lms_create_courses',
                'lms_edit_courses',
                'lms_manage_students',
                'lms_grade_assignments',
                'lms_view_analytics'
            );
            
            foreach ($admin_caps as $cap) {
                $admin_role->add_cap($cap);
            }
        }
        
        // Add capabilities to editor for course management
        $editor_role = get_role('editor');
        if ($editor_role) {
            $editor_caps = array(
                'lms_create_courses',
                'lms_edit_courses',
                'lms_view_analytics'
            );
            
            foreach ($editor_caps as $cap) {
                $editor_role->add_cap($cap);
            }
        }
    }
    
    /**
     * Set default role for new registrations
     */
    public static function set_default_role($user_id) {
        $user = get_user_by('ID', $user_id);
        
        // If no role is set, default to LMS Student
        if (!$user->roles || empty($user->roles)) {
            $user->set_role('lms_student');
        }
        
        // Initialize user meta
        update_user_meta($user_id, '_lms_enrollment_date', current_time('mysql'));
        update_user_meta($user_id, '_lms_total_courses', 0);
        update_user_meta($user_id, '_lms_completed_courses', 0);
        update_user_meta($user_id, '_lms_certificates_earned', 0);
    }
    
    /**
     * Add LMS profile fields to user profile page
     */
    public static function add_user_profile_fields($user) {
        if (!current_user_can('edit_users')) {
            return;
        }
        
        $user_role = self::get_user_lms_role($user->ID);
        $bio = get_user_meta($user->ID, '_lms_bio', true);
        $expertise = get_user_meta($user->ID, '_lms_expertise', true);
        $phone = get_user_meta($user->ID, '_lms_phone', true);
        $location = get_user_meta($user->ID, '_lms_location', true);
        $paystack_recipient_code = get_user_meta($user->ID, '_lms_paystack_recipient_code', true);
        $bank_account = get_user_meta($user->ID, '_lms_bank_account', true);
        $total_earnings = get_user_meta($user->ID, '_lms_total_earnings', true);
        ?>
        
        <h3><?php _e('LMS Profile Information', 'codelab-educare-lms'); ?></h3>
        <table class="form-table">
            <tr>
                <th><label for="lms_role"><?php _e('LMS Role', 'codelab-educare-lms'); ?></label></th>
                <td>
                    <select name="lms_role" id="lms_role">
                        <option value="lms_student" <?php selected($user_role, 'lms_student'); ?>><?php _e('Student', 'codelab-educare-lms'); ?></option>
                        <option value="lms_mentor" <?php selected($user_role, 'lms_mentor'); ?>><?php _e('Mentor', 'codelab-educare-lms'); ?></option>
                    </select>
                    <p class="description"><?php _e('Select the user\'s role in the LMS system.', 'codelab-educare-lms'); ?></p>
                </td>
            </tr>
            
            <tr>
                <th><label for="lms_bio"><?php _e('Bio', 'codelab-educare-lms'); ?></label></th>
                <td>
                    <textarea name="lms_bio" id="lms_bio" rows="4" cols="50"><?php echo esc_textarea($bio); ?></textarea>
                    <p class="description"><?php _e('Professional bio for mentor profile.', 'codelab-educare-lms'); ?></p>
                </td>
            </tr>
            
            <tr>
                <th><label for="lms_expertise"><?php _e('Expertise', 'codelab-educare-lms'); ?></label></th>
                <td>
                    <input type="text" name="lms_expertise" id="lms_expertise" value="<?php echo esc_attr($expertise); ?>" class="regular-text" />
                    <p class="description"><?php _e('Areas of expertise (comma-separated).', 'codelab-educare-lms'); ?></p>
                </td>
            </tr>
            
            <tr>
                <th><label for="lms_phone"><?php _e('Phone Number', 'codelab-educare-lms'); ?></label></th>
                <td>
                    <input type="tel" name="lms_phone" id="lms_phone" value="<?php echo esc_attr($phone); ?>" class="regular-text" />
                    <p class="description"><?php _e('Phone number for contact and verification.', 'codelab-educare-lms'); ?></p>
                </td>
            </tr>
            
            <tr>
                <th><label for="lms_location"><?php _e('Location', 'codelab-educare-lms'); ?></label></th>
                <td>
                    <input type="text" name="lms_location" id="lms_location" value="<?php echo esc_attr($location); ?>" class="regular-text" />
                    <p class="description"><?php _e('City, State, Country.', 'codelab-educare-lms'); ?></p>
                </td>
            </tr>
            
            <?php if (in_array('lms_mentor', $user->roles) || $user_role === 'lms_mentor'): ?>
            <tr>
                <th><label for="lms_bank_account"><?php _e('Bank Account', 'codelab-educare-lms'); ?></label></th>
                <td>
                    <input type="text" name="lms_bank_account" id="lms_bank_account" value="<?php echo esc_attr($bank_account); ?>" class="regular-text" />
                    <p class="description"><?php _e('Bank account number for commission payments.', 'codelab-educare-lms'); ?></p>
                </td>
            </tr>
            
            <tr>
                <th><label for="lms_paystack_recipient_code"><?php _e('Paystack Recipient Code', 'codelab-educare-lms'); ?></label></th>
                <td>
                    <input type="text" name="lms_paystack_recipient_code" id="lms_paystack_recipient_code" value="<?php echo esc_attr($paystack_recipient_code); ?>" class="regular-text" readonly />
                    <p class="description"><?php _e('Auto-generated when bank details are verified.', 'codelab-educare-lms'); ?></p>
                </td>
            </tr>
            
            <tr>
                <th><label><?php _e('Total Earnings', 'codelab-educare-lms'); ?></label></th>
                <td>
                    <strong><?php echo codelab_lms_format_currency($total_earnings ?: 0); ?></strong>
                    <p class="description"><?php _e('Total commission earned from course sales.', 'codelab-educare-lms'); ?></p>
                </td>
            </tr>
            <?php endif; ?>
        </table>
        
        <?php
        // Display user statistics
        self::display_user_statistics($user->ID);
    }
    
    /**
     * Save LMS profile fields
     */
    public static function save_user_profile_fields($user_id) {
        if (!current_user_can('edit_user', $user_id)) {
            return;
        }
        
        // Update LMS role if changed
        if (isset($_POST['lms_role'])) {
            $new_role = sanitize_text_field($_POST['lms_role']);
            $user = get_user_by('ID', $user_id);
            
            if ($new_role && in_array($new_role, array('lms_student', 'lms_mentor'))) {
                // Remove old LMS roles
                $user->remove_role('lms_student');
                $user->remove_role('lms_mentor');
                
                // Add new role
                $user->add_role($new_role);
            }
        }
        
        // Update profile fields
        $fields = array(
            'lms_bio' => 'sanitize_textarea_field',
            'lms_expertise' => 'sanitize_text_field',
            'lms_phone' => 'sanitize_text_field',
            'lms_location' => 'sanitize_text_field',
            'lms_bank_account' => 'sanitize_text_field'
        );
        
        foreach ($fields as $field => $sanitize_function) {
            if (isset($_POST[$field])) {
                update_user_meta($user_id, '_' . $field, $sanitize_function($_POST[$field]));
            }
        }
        
        // Create Paystack recipient if bank account is provided and user is mentor
        if (isset($_POST['lms_bank_account']) && !empty($_POST['lms_bank_account'])) {
            $user_role = self::get_user_lms_role($user_id);
            if ($user_role === 'lms_mentor') {
                self::create_paystack_recipient($user_id);
            }
        }
    }
    
    /**
     * Get user's LMS role
     */
    public static function get_user_lms_role($user_id) {
        $user = get_user_by('ID', $user_id);
        
        if (!$user) {
            return false;
        }
        
        if (in_array('lms_mentor', $user->roles)) {
            return 'lms_mentor';
        }
        
        if (in_array('lms_student', $user->roles)) {
            return 'lms_student';
        }
        
        return false;
    }
    
    /**
     * Create Paystack recipient for mentor
     */
    private static function create_paystack_recipient($user_id) {
        $user = get_user_by('ID', $user_id);
        $bank_account = get_user_meta($user_id, '_lms_bank_account', true);
        
        if (!$user || !$bank_account) {
            return false;
        }
        
        $paystack_secret = get_option('codelab_lms_paystack_secret_key');
        if (!$paystack_secret) {
            return false;
        }
        
        // Create transfer recipient via Paystack API
        $response = wp_remote_post('https://api.paystack.co/transferrecipient', array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $paystack_secret,
                'Content-Type' => 'application/json'
            ),
            'body' => json_encode(array(
                'type' => 'nuban',
                'name' => $user->display_name,
                'account_number' => $bank_account,
                'bank_code' => '044', // Access Bank default - should be configurable
                'currency' => 'NGN'
            ))
        ));
        
        if (!is_wp_error($response)) {
            $body = json_decode(wp_remote_retrieve_body($response), true);
            
            if ($body && $body['status'] && isset($body['data']['recipient_code'])) {
                update_user_meta($user_id, '_lms_paystack_recipient_code', $body['data']['recipient_code']);
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Display user statistics
     */
    private static function display_user_statistics($user_id) {
        global $wpdb;
        
        $user_role = self::get_user_lms_role($user_id);
        
        if ($user_role === 'lms_student') {
            // Student statistics
            $enrollments_table = $wpdb->prefix . 'codelab_lms_enrollments';
            $enrolled_courses = $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM $enrollments_table WHERE user_id = %d AND status = 'active'",
                $user_id
            ));
            
            $completed_courses = $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM $enrollments_table WHERE user_id = %d AND status = 'completed'",
                $user_id
            ));
            
            $certificates_table = $wpdb->prefix . 'codelab_lms_certificates';
            $certificates = $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM $certificates_table WHERE user_id = %d",
                $user_id
            ));
            
            ?>
            <h3><?php _e('Student Statistics', 'codelab-educare-lms'); ?></h3>
            <table class="form-table">
                <tr>
                    <th><?php _e('Enrolled Courses', 'codelab-educare-lms'); ?></th>
                    <td><strong><?php echo intval($enrolled_courses); ?></strong></td>
                </tr>
                <tr>
                    <th><?php _e('Completed Courses', 'codelab-educare-lms'); ?></th>
                    <td><strong><?php echo intval($completed_courses); ?></strong></td>
                </tr>
                <tr>
                    <th><?php _e('Certificates Earned', 'codelab-educare-lms'); ?></th>
                    <td><strong><?php echo intval($certificates); ?></strong></td>
                </tr>
            </table>
            <?php
            
        } elseif ($user_role === 'lms_mentor') {
            // Mentor statistics
            $courses = get_posts(array(
                'post_type' => 'lms_course',
                'meta_key' => '_course_mentor',
                'meta_value' => $user_id,
                'post_status' => 'publish',
                'numberposts' => -1
            ));
            
            $enrollments_table = $wpdb->prefix . 'codelab_lms_enrollments';
            $total_students = $wpdb->get_var($wpdb->prepare("
                SELECT COUNT(DISTINCT e.user_id) 
                FROM $enrollments_table e
                INNER JOIN {$wpdb->postmeta} pm ON e.course_id = pm.post_id
                WHERE pm.meta_key = '_course_mentor' AND pm.meta_value = %d
            ", $user_id));
            
            $commissions_table = $wpdb->prefix . 'codelab_lms_commissions';
            $total_commissions = $wpdb->get_var($wpdb->prepare(
                "SELECT SUM(amount) FROM $commissions_table WHERE mentor_id = %d AND status = 'paid'",
                $user_id
            ));
            
            $pending_commissions = $wpdb->get_var($wpdb->prepare(
                "SELECT SUM(amount) FROM $commissions_table WHERE mentor_id = %d AND status = 'pending'",
                $user_id
            ));
            
            ?>
            <h3><?php _e('Mentor Statistics', 'codelab-educare-lms'); ?></h3>
            <table class="form-table">
                <tr>
                    <th><?php _e('Courses Created', 'codelab-educare-lms'); ?></th>
                    <td><strong><?php echo count($courses); ?></strong></td>
                </tr>
                <tr>
                    <th><?php _e('Total Students', 'codelab-educare-lms'); ?></th>
                    <td><strong><?php echo intval($total_students); ?></strong></td>
                </tr>
                <tr>
                    <th><?php _e('Total Commissions Earned', 'codelab-educare-lms'); ?></th>
                    <td><strong><?php echo codelab_lms_format_currency($total_commissions ?: 0); ?></strong></td>
                </tr>
                <tr>
                    <th><?php _e('Pending Commissions', 'codelab-educare-lms'); ?></th>
                    <td><strong><?php echo codelab_lms_format_currency($pending_commissions ?: 0); ?></strong></td>
                </tr>
            </table>
            <?php
        }
    }
    
    /**
     * Get user dashboard URL based on role
     */
    public static function get_user_dashboard_url($user_id = null) {
        if (!$user_id) {
            $user_id = get_current_user_id();
        }
        
        $role = self::get_user_lms_role($user_id);
        
        switch ($role) {
            case 'lms_student':
                return get_permalink(get_page_by_path('student-dashboard'));
            case 'lms_mentor':
                return get_permalink(get_page_by_path('mentor-dashboard'));
            default:
                return home_url();
        }
    }
    
    /**
     * Check if user can access course
     */
    public static function user_can_access_course($user_id, $course_id) {
        // Check if user is enrolled
        if (codelab_lms_is_user_enrolled($user_id, $course_id)) {
            return true;
        }
        
        // Check if user is the mentor for this course
        $mentor_id = get_post_meta($course_id, '_course_mentor', true);
        if ($mentor_id == $user_id) {
            return true;
        }
        
        // Check if user is admin
        if (current_user_can('lms_manage_all')) {
            return true;
        }
        
        return false;
    }
}