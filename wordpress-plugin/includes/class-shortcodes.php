<?php
/**
 * Shortcodes Class
 * Handles all LMS shortcodes for frontend display
 */

if (!defined('ABSPATH')) {
    exit;
}

class Codelab_LMS_Shortcodes {
    
    /**
     * Initialize shortcodes
     */
    public static function init() {
        add_shortcode('codelab_courses', array(__CLASS__, 'courses_shortcode'));
        add_shortcode('codelab_course_info', array(__CLASS__, 'course_info_shortcode'));
        add_shortcode('codelab_student_dashboard', array(__CLASS__, 'student_dashboard_shortcode'));
        add_shortcode('codelab_mentor_dashboard', array(__CLASS__, 'mentor_dashboard_shortcode'));
        add_shortcode('codelab_my_courses', array(__CLASS__, 'my_courses_shortcode'));
        add_shortcode('codelab_course_search', array(__CLASS__, 'course_search_shortcode'));
        add_shortcode('codelab_enroll_button', array(__CLASS__, 'enroll_button_shortcode'));
        add_shortcode('codelab_course_progress', array(__CLASS__, 'course_progress_shortcode'));
        add_shortcode('codelab_certificates', array(__CLASS__, 'certificates_shortcode'));
    }
    
    /**
     * Course catalog shortcode
     */
    public static function courses_shortcode($atts) {
        $atts = shortcode_atts(array(
            'category' => '',
            'tag' => '',
            'level' => '',
            'mentor' => '',
            'limit' => 12,
            'orderby' => 'date',
            'order' => 'DESC',
            'featured' => '',
            'columns' => 3
        ), $atts);
        
        $args = array(
            'post_type' => 'lms_course',
            'post_status' => 'publish',
            'posts_per_page' => intval($atts['limit']),
            'orderby' => $atts['orderby'],
            'order' => $atts['order']
        );
        
        // Add taxonomy queries
        $tax_query = array();
        
        if (!empty($atts['category'])) {
            $tax_query[] = array(
                'taxonomy' => 'course_category',
                'field' => 'slug',
                'terms' => explode(',', $atts['category'])
            );
        }
        
        if (!empty($atts['tag'])) {
            $tax_query[] = array(
                'taxonomy' => 'course_tag',
                'field' => 'slug',
                'terms' => explode(',', $atts['tag'])
            );
        }
        
        if (!empty($atts['level'])) {
            $tax_query[] = array(
                'taxonomy' => 'course_level',
                'field' => 'slug',
                'terms' => explode(',', $atts['level'])
            );
        }
        
        if (!empty($tax_query)) {
            $args['tax_query'] = $tax_query;
        }
        
        // Add meta queries
        $meta_query = array();
        
        if (!empty($atts['mentor'])) {
            $meta_query[] = array(
                'key' => '_course_mentor',
                'value' => $atts['mentor'],
                'compare' => '='
            );
        }
        
        if (!empty($atts['featured'])) {
            $meta_query[] = array(
                'key' => '_course_featured',
                'value' => '1',
                'compare' => '='
            );
        }
        
        if (!empty($meta_query)) {
            $args['meta_query'] = $meta_query;
        }
        
        $courses = get_posts($args);
        
        if (empty($courses)) {
            return '<p>' . __('No courses found.', 'codelab-educare-lms') . '</p>';
        }
        
        $columns = max(1, min(4, intval($atts['columns'])));
        $output = '<div class="codelab-courses-grid columns-' . $columns . '">';
        
        foreach ($courses as $course) {
            $output .= self::render_course_card($course);
        }
        
        $output .= '</div>';
        
        // Add CSS
        $output .= self::get_courses_css();
        
        return $output;
    }
    
    /**
     * Single course info shortcode
     */
    public static function course_info_shortcode($atts) {
        $atts = shortcode_atts(array(
            'id' => get_the_ID(),
            'show' => 'all' // all, basic, price, mentor, stats
        ), $atts);
        
        $course_id = intval($atts['id']);
        $course = get_post($course_id);
        
        if (!$course || $course->post_type !== 'lms_course') {
            return '<p>' . __('Course not found.', 'codelab-educare-lms') . '</p>';
        }
        
        $show = explode(',', $atts['show']);
        $output = '<div class="codelab-course-info">';
        
        if (in_array('all', $show) || in_array('basic', $show)) {
            $output .= '<div class="course-basic-info">';
            $output .= '<h3>' . esc_html($course->post_title) . '</h3>';
            $output .= '<div class="course-excerpt">' . get_the_excerpt($course) . '</div>';
            $output .= '</div>';
        }
        
        if (in_array('all', $show) || in_array('price', $show)) {
            $price = get_post_meta($course_id, '_course_price', true);
            $output .= '<div class="course-price">';
            $output .= '<span class="price-label">' . __('Price:', 'codelab-educare-lms') . '</span>';
            $output .= '<span class="price-amount">' . codelab_lms_format_currency($price) . '</span>';
            $output .= '</div>';
        }
        
        if (in_array('all', $show) || in_array('mentor', $show)) {
            $mentor_id = get_post_meta($course_id, '_course_mentor', true);
            if ($mentor_id) {
                $mentor = get_user_by('ID', $mentor_id);
                $output .= '<div class="course-mentor">';
                $output .= '<span class="mentor-label">' . __('Mentor:', 'codelab-educare-lms') . '</span>';
                $output .= '<span class="mentor-name">' . esc_html($mentor->display_name) . '</span>';
                $output .= '</div>';
            }
        }
        
        if (in_array('all', $show) || in_array('stats', $show)) {
            $duration = get_post_meta($course_id, '_course_duration', true);
            $lessons = get_posts(array(
                'post_type' => 'lms_lesson',
                'meta_key' => '_lesson_course',
                'meta_value' => $course_id,
                'numberposts' => -1
            ));
            
            $output .= '<div class="course-stats">';
            if ($duration) {
                $output .= '<div class="stat-item">';
                $output .= '<span class="stat-label">' . __('Duration:', 'codelab-educare-lms') . '</span>';
                $output .= '<span class="stat-value">' . $duration . ' ' . __('hours', 'codelab-educare-lms') . '</span>';
                $output .= '</div>';
            }
            $output .= '<div class="stat-item">';
            $output .= '<span class="stat-label">' . __('Lessons:', 'codelab-educare-lms') . '</span>';
            $output .= '<span class="stat-value">' . count($lessons) . '</span>';
            $output .= '</div>';
            $output .= '</div>';
        }
        
        $output .= '</div>';
        
        return $output;
    }
    
    /**
     * Student dashboard shortcode
     */
    public static function student_dashboard_shortcode($atts) {
        if (!is_user_logged_in()) {
            return '<p>' . __('Please login to access your dashboard.', 'codelab-educare-lms') . '</p>';
        }
        
        $user_id = get_current_user_id();
        $user_role = Codelab_LMS_User_Roles::get_user_lms_role($user_id);
        
        if ($user_role !== 'lms_student') {
            return '<p>' . __('Access denied. Student account required.', 'codelab-educare-lms') . '</p>';
        }
        
        global $wpdb;
        $enrollments_table = $wpdb->prefix . 'codelab_lms_enrollments';
        
        // Get enrolled courses
        $enrolled_courses = $wpdb->get_results($wpdb->prepare("
            SELECT e.*, p.post_title, p.ID as course_id
            FROM $enrollments_table e
            JOIN {$wpdb->posts} p ON e.course_id = p.ID
            WHERE e.user_id = %d AND e.status = 'active'
            ORDER BY e.enrolled_date DESC
        ", $user_id));
        
        // Get completed courses
        $completed_courses = $wpdb->get_results($wpdb->prepare("
            SELECT e.*, p.post_title, p.ID as course_id
            FROM $enrollments_table e
            JOIN {$wpdb->posts} p ON e.course_id = p.ID
            WHERE e.user_id = %d AND e.status = 'completed'
            ORDER BY e.completion_date DESC
        ", $user_id));
        
        // Get certificates
        $certificates_table = $wpdb->prefix . 'codelab_lms_certificates';
        $certificates = $wpdb->get_results($wpdb->prepare("
            SELECT c.*, p.post_title
            FROM $certificates_table c
            JOIN {$wpdb->posts} p ON c.course_id = p.ID
            WHERE c.user_id = %d
            ORDER BY c.issued_date DESC
        ", $user_id));
        
        $output = '<div class="codelab-student-dashboard">';
        
        // Dashboard stats
        $output .= '<div class="dashboard-stats">';
        $output .= '<div class="stat-card">';
        $output .= '<h4>' . __('Enrolled Courses', 'codelab-educare-lms') . '</h4>';
        $output .= '<span class="stat-number">' . count($enrolled_courses) . '</span>';
        $output .= '</div>';
        $output .= '<div class="stat-card">';
        $output .= '<h4>' . __('Completed Courses', 'codelab-educare-lms') . '</h4>';
        $output .= '<span class="stat-number">' . count($completed_courses) . '</span>';
        $output .= '</div>';
        $output .= '<div class="stat-card">';
        $output .= '<h4>' . __('Certificates', 'codelab-educare-lms') . '</h4>';
        $output .= '<span class="stat-number">' . count($certificates) . '</span>';
        $output .= '</div>';
        $output .= '</div>';
        
        // Current courses
        $output .= '<div class="dashboard-section">';
        $output .= '<h3>' . __('Current Courses', 'codelab-educare-lms') . '</h3>';
        
        if (!empty($enrolled_courses)) {
            $output .= '<div class="courses-list">';
            foreach ($enrolled_courses as $enrollment) {
                $output .= '<div class="course-item">';
                $output .= '<h4><a href="' . get_permalink($enrollment->course_id) . '">' . esc_html($enrollment->post_title) . '</a></h4>';
                $output .= '<div class="progress-bar">';
                $output .= '<div class="progress-fill" style="width: ' . $enrollment->progress_percentage . '%"></div>';
                $output .= '</div>';
                $output .= '<span class="progress-text">' . $enrollment->progress_percentage . '% ' . __('complete', 'codelab-educare-lms') . '</span>';
                $output .= '</div>';
            }
            $output .= '</div>';
        } else {
            $output .= '<p>' . __('No enrolled courses yet.', 'codelab-educare-lms') . ' <a href="' . get_permalink(get_page_by_path('courses')) . '">' . __('Browse courses', 'codelab-educare-lms') . '</a></p>';
        }
        
        $output .= '</div>';
        
        // Certificates section
        if (!empty($certificates)) {
            $output .= '<div class="dashboard-section">';
            $output .= '<h3>' . __('My Certificates', 'codelab-educare-lms') . '</h3>';
            $output .= '<div class="certificates-list">';
            
            foreach ($certificates as $certificate) {
                $output .= '<div class="certificate-item">';
                $output .= '<h4>' . esc_html($certificate->post_title) . '</h4>';
                $output .= '<p>' . __('Issued on:', 'codelab-educare-lms') . ' ' . date('F j, Y', strtotime($certificate->issued_date)) . '</p>';
                $output .= '<a href="' . esc_url($certificate->certificate_url) . '" class="download-certificate" target="_blank">' . __('Download Certificate', 'codelab-educare-lms') . '</a>';
                $output .= '</div>';
            }
            
            $output .= '</div>';
            $output .= '</div>';
        }
        
        $output .= '</div>';
        
        // Add CSS
        $output .= self::get_dashboard_css();
        
        return $output;
    }
    
    /**
     * Mentor dashboard shortcode
     */
    public static function mentor_dashboard_shortcode($atts) {
        if (!is_user_logged_in()) {
            return '<p>' . __('Please login to access your dashboard.', 'codelab-educare-lms') . '</p>';
        }
        
        $user_id = get_current_user_id();
        $user_role = Codelab_LMS_User_Roles::get_user_lms_role($user_id);
        
        if ($user_role !== 'lms_mentor') {
            return '<p>' . __('Access denied. Mentor account required.', 'codelab-educare-lms') . '</p>';
        }
        
        // Get mentor courses
        $courses = get_posts(array(
            'post_type' => 'lms_course',
            'meta_key' => '_course_mentor',
            'meta_value' => $user_id,
            'numberposts' => -1,
            'post_status' => array('publish', 'draft')
        ));
        
        // Get commission data
        $paystack = new Codelab_LMS_Paystack();
        $commissions = $paystack->get_mentor_commissions($user_id);
        $pending_commissions = $paystack->get_mentor_commissions($user_id, 'pending');
        $paid_commissions = $paystack->get_mentor_commissions($user_id, 'paid');
        
        $total_earnings = array_sum(array_column($paid_commissions, 'amount'));
        $pending_earnings = array_sum(array_column($pending_commissions, 'amount'));
        
        $output = '<div class="codelab-mentor-dashboard">';
        
        // Dashboard stats
        $output .= '<div class="dashboard-stats">';
        $output .= '<div class="stat-card">';
        $output .= '<h4>' . __('My Courses', 'codelab-educare-lms') . '</h4>';
        $output .= '<span class="stat-number">' . count($courses) . '</span>';
        $output .= '</div>';
        $output .= '<div class="stat-card">';
        $output .= '<h4>' . __('Total Earnings', 'codelab-educare-lms') . '</h4>';
        $output .= '<span class="stat-number">' . codelab_lms_format_currency($total_earnings) . '</span>';
        $output .= '</div>';
        $output .= '<div class="stat-card">';
        $output .= '<h4>' . __('Pending Earnings', 'codelab-educare-lms') . '</h4>';
        $output .= '<span class="stat-number">' . codelab_lms_format_currency($pending_earnings) . '</span>';
        $output .= '</div>';
        $output .= '</div>';
        
        // My courses section
        $output .= '<div class="dashboard-section">';
        $output .= '<h3>' . __('My Courses', 'codelab-educare-lms') . '</h3>';
        
        if (!empty($courses)) {
            $output .= '<div class="courses-table">';
            $output .= '<table>';
            $output .= '<thead><tr><th>' . __('Course', 'codelab-educare-lms') . '</th><th>' . __('Status', 'codelab-educare-lms') . '</th><th>' . __('Students', 'codelab-educare-lms') . '</th><th>' . __('Actions', 'codelab-educare-lms') . '</th></tr></thead>';
            $output .= '<tbody>';
            
            foreach ($courses as $course) {
                global $wpdb;
                $enrollments_table = $wpdb->prefix . 'codelab_lms_enrollments';
                $student_count = $wpdb->get_var($wpdb->prepare(
                    "SELECT COUNT(*) FROM $enrollments_table WHERE course_id = %d AND status = 'active'",
                    $course->ID
                ));
                
                $output .= '<tr>';
                $output .= '<td><a href="' . get_permalink($course->ID) . '">' . esc_html($course->post_title) . '</a></td>';
                $output .= '<td><span class="status-' . $course->post_status . '">' . ucfirst($course->post_status) . '</span></td>';
                $output .= '<td>' . $student_count . '</td>';
                $output .= '<td><a href="' . admin_url('post.php?post=' . $course->ID . '&action=edit') . '">' . __('Edit', 'codelab-educare-lms') . '</a></td>';
                $output .= '</tr>';
            }
            
            $output .= '</tbody></table>';
            $output .= '</div>';
        } else {
            $output .= '<p>' . __('No courses created yet.', 'codelab-educare-lms') . ' <a href="' . admin_url('post-new.php?post_type=lms_course') . '">' . __('Create your first course', 'codelab-educare-lms') . '</a></p>';
        }
        
        $output .= '</div>';
        
        $output .= '</div>';
        
        // Add CSS
        $output .= self::get_dashboard_css();
        
        return $output;
    }
    
    /**
     * Enroll button shortcode
     */
    public static function enroll_button_shortcode($atts) {
        $atts = shortcode_atts(array(
            'course_id' => get_the_ID(),
            'text' => __('Enroll Now', 'codelab-educare-lms'),
            'class' => 'codelab-enroll-button'
        ), $atts);
        
        $course_id = intval($atts['course_id']);
        $user_id = get_current_user_id();
        
        if (!$user_id) {
            return '<a href="' . wp_login_url(get_permalink()) . '" class="' . esc_attr($atts['class']) . '">' . __('Login to Enroll', 'codelab-educare-lms') . '</a>';
        }
        
        if (codelab_lms_is_user_enrolled($user_id, $course_id)) {
            return '<span class="enrolled-status">' . __('Enrolled', 'codelab-educare-lms') . '</span>';
        }
        
        $price = get_post_meta($course_id, '_course_price', true);
        
        if ($price > 0) {
            return '<button class="' . esc_attr($atts['class']) . '" data-course-id="' . $course_id . '" onclick="initializePayment(' . $course_id . ')">' . esc_html($atts['text']) . ' - ' . codelab_lms_format_currency($price) . '</button>';
        } else {
            return '<button class="' . esc_attr($atts['class']) . '" data-course-id="' . $course_id . '" onclick="enrollFree(' . $course_id . ')">' . __('Enroll Free', 'codelab-educare-lms') . '</button>';
        }
    }
    
    /**
     * Render course card
     */
    private static function render_course_card($course) {
        $course_id = $course->ID;
        $price = get_post_meta($course_id, '_course_price', true);
        $mentor_id = get_post_meta($course_id, '_course_mentor', true);
        $mentor = get_user_by('ID', $mentor_id);
        $thumbnail = get_the_post_thumbnail($course, 'medium');
        
        global $wpdb;
        $enrollments_table = $wpdb->prefix . 'codelab_lms_enrollments';
        $student_count = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $enrollments_table WHERE course_id = %d AND status = 'active'",
            $course_id
        ));
        
        $output = '<div class="course-card">';
        
        if ($thumbnail) {
            $output .= '<div class="course-thumbnail">';
            $output .= '<a href="' . get_permalink($course) . '">' . $thumbnail . '</a>';
            $output .= '</div>';
        }
        
        $output .= '<div class="course-content">';
        $output .= '<h3><a href="' . get_permalink($course) . '">' . esc_html($course->post_title) . '</a></h3>';
        $output .= '<div class="course-excerpt">' . wp_trim_words(get_the_excerpt($course), 15) . '</div>';
        
        if ($mentor) {
            $output .= '<div class="course-mentor">' . __('By', 'codelab-educare-lms') . ' ' . esc_html($mentor->display_name) . '</div>';
        }
        
        $output .= '<div class="course-meta">';
        $output .= '<span class="student-count">' . sprintf(_n('%d student', '%d students', $student_count, 'codelab-educare-lms'), $student_count) . '</span>';
        $output .= '<span class="course-price">' . ($price > 0 ? codelab_lms_format_currency($price) : __('Free', 'codelab-educare-lms')) . '</span>';
        $output .= '</div>';
        
        $output .= '</div>';
        $output .= '</div>';
        
        return $output;
    }
    
    /**
     * Get courses CSS
     */
    private static function get_courses_css() {
        return '
        <style>
        .codelab-courses-grid {
            display: grid;
            gap: 20px;
            margin: 20px 0;
        }
        .codelab-courses-grid.columns-1 { grid-template-columns: 1fr; }
        .codelab-courses-grid.columns-2 { grid-template-columns: repeat(2, 1fr); }
        .codelab-courses-grid.columns-3 { grid-template-columns: repeat(3, 1fr); }
        .codelab-courses-grid.columns-4 { grid-template-columns: repeat(4, 1fr); }
        
        .course-card {
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
            transition: transform 0.2s;
        }
        .course-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .course-thumbnail img {
            width: 100%;
            height: 200px;
            object-fit: cover;
        }
        .course-content {
            padding: 15px;
        }
        .course-content h3 {
            margin: 0 0 10px 0;
            font-size: 18px;
        }
        .course-content h3 a {
            text-decoration: none;
            color: #333;
        }
        .course-excerpt {
            color: #666;
            margin-bottom: 10px;
            line-height: 1.5;
        }
        .course-mentor {
            font-size: 14px;
            color: #888;
            margin-bottom: 10px;
        }
        .course-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 14px;
        }
        .course-price {
            font-weight: bold;
            color: #2563eb;
        }
        
        @media (max-width: 768px) {
            .codelab-courses-grid.columns-3,
            .codelab-courses-grid.columns-4 {
                grid-template-columns: repeat(2, 1fr);
            }
        }
        @media (max-width: 480px) {
            .codelab-courses-grid {
                grid-template-columns: 1fr;
            }
        }
        </style>';
    }
    
    /**
     * Get dashboard CSS
     */
    private static function get_dashboard_css() {
        return '
        <style>
        .dashboard-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .stat-card h4 {
            margin: 0 0 10px 0;
            color: #666;
            font-size: 14px;
        }
        .stat-number {
            font-size: 32px;
            font-weight: bold;
            color: #2563eb;
        }
        .dashboard-section {
            margin-bottom: 30px;
        }
        .dashboard-section h3 {
            border-bottom: 2px solid #2563eb;
            padding-bottom: 10px;
        }
        .courses-list, .certificates-list {
            display: grid;
            gap: 15px;
        }
        .course-item, .certificate-item {
            background: #fff;
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 8px;
        }
        .progress-bar {
            background: #e9ecef;
            height: 8px;
            border-radius: 4px;
            margin: 10px 0 5px 0;
            overflow: hidden;
        }
        .progress-fill {
            background: #28a745;
            height: 100%;
            transition: width 0.3s ease;
        }
        .progress-text {
            font-size: 12px;
            color: #666;
        }
        .courses-table table {
            width: 100%;
            border-collapse: collapse;
        }
        .courses-table th,
        .courses-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        .courses-table th {
            background: #f8f9fa;
            font-weight: bold;
        }
        .status-publish { color: #28a745; }
        .status-draft { color: #ffc107; }
        .download-certificate {
            display: inline-block;
            padding: 8px 16px;
            background: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-size: 14px;
        }
        </style>';
    }
}