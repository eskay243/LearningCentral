<?php
/**
 * AJAX Class
 * Handles all AJAX requests for the LMS
 */

if (!defined('ABSPATH')) {
    exit;
}

class Codelab_LMS_Ajax {
    
    /**
     * Constructor
     */
    public function __construct() {
        // Public AJAX actions (logged in and non-logged in users)
        add_action('wp_ajax_codelab_lms_enroll_free', array($this, 'enroll_free'));
        add_action('wp_ajax_nopriv_codelab_lms_enroll_free', array($this, 'require_login'));
        
        add_action('wp_ajax_codelab_lms_mark_lesson_complete', array($this, 'mark_lesson_complete'));
        add_action('wp_ajax_nopriv_codelab_lms_mark_lesson_complete', array($this, 'require_login'));
        
        add_action('wp_ajax_codelab_lms_get_course_progress', array($this, 'get_course_progress'));
        add_action('wp_ajax_nopriv_codelab_lms_get_course_progress', array($this, 'require_login'));
        
        add_action('wp_ajax_codelab_lms_send_message', array($this, 'send_message'));
        add_action('wp_ajax_nopriv_codelab_lms_send_message', array($this, 'require_login'));
        
        add_action('wp_ajax_codelab_lms_get_messages', array($this, 'get_messages'));
        add_action('wp_ajax_nopriv_codelab_lms_get_messages', array($this, 'require_login'));
        
        add_action('wp_ajax_codelab_lms_submit_quiz', array($this, 'submit_quiz'));
        add_action('wp_ajax_nopriv_codelab_lms_submit_quiz', array($this, 'require_login'));
        
        add_action('wp_ajax_codelab_lms_load_lesson_content', array($this, 'load_lesson_content'));
        add_action('wp_ajax_nopriv_codelab_lms_load_lesson_content', array($this, 'require_login'));
        
        // Admin AJAX actions
        add_action('wp_ajax_codelab_lms_bulk_enroll', array($this, 'bulk_enroll'));
        add_action('wp_ajax_codelab_lms_transfer_commission', array($this, 'transfer_commission'));
        add_action('wp_ajax_codelab_lms_get_course_stats', array($this, 'get_course_stats'));
    }
    
    /**
     * Verify nonce for security
     */
    private function verify_nonce() {
        if (!wp_verify_nonce($_POST['nonce'], 'codelab_lms_nonce')) {
            wp_send_json_error(array('message' => __('Security check failed', 'codelab-educare-lms')));
        }
    }
    
    /**
     * Require login response
     */
    public function require_login() {
        wp_send_json_error(array('message' => __('Please login to continue', 'codelab-educare-lms')));
    }
    
    /**
     * Enroll in free course
     */
    public function enroll_free() {
        $this->verify_nonce();
        
        $course_id = intval($_POST['course_id']);
        $user_id = get_current_user_id();
        
        if (!$course_id) {
            wp_send_json_error(array('message' => __('Invalid course', 'codelab-educare-lms')));
        }
        
        // Check if course is free
        $price = get_post_meta($course_id, '_course_price', true);
        if ($price > 0) {
            wp_send_json_error(array('message' => __('This course is not free', 'codelab-educare-lms')));
        }
        
        // Check if already enrolled
        if (codelab_lms_is_user_enrolled($user_id, $course_id)) {
            wp_send_json_error(array('message' => __('Already enrolled in this course', 'codelab-educare-lms')));
        }
        
        // Enroll user
        if (codelab_lms_enroll_user($user_id, $course_id)) {
            wp_send_json_success(array(
                'message' => __('Successfully enrolled in course!', 'codelab-educare-lms'),
                'redirect_url' => get_permalink($course_id)
            ));
        } else {
            wp_send_json_error(array('message' => __('Enrollment failed. Please try again.', 'codelab-educare-lms')));
        }
    }
    
    /**
     * Mark lesson as complete
     */
    public function mark_lesson_complete() {
        $this->verify_nonce();
        
        $lesson_id = intval($_POST['lesson_id']);
        $user_id = get_current_user_id();
        
        if (!$lesson_id) {
            wp_send_json_error(array('message' => __('Invalid lesson', 'codelab-educare-lms')));
        }
        
        // Get course ID from lesson
        $course_id = get_post_meta($lesson_id, '_lesson_course', true);
        
        if (!$course_id) {
            wp_send_json_error(array('message' => __('Lesson not associated with a course', 'codelab-educare-lms')));
        }
        
        // Check if user can access course
        if (!Codelab_LMS_User_Roles::user_can_access_course($user_id, $course_id)) {
            wp_send_json_error(array('message' => __('Access denied', 'codelab-educare-lms')));
        }
        
        // Mark lesson complete
        Codelab_LMS_Public::mark_lesson_complete($user_id, $lesson_id);
        
        // Get updated progress
        $progress_percentage = Codelab_LMS_Public::get_course_completion_percentage($user_id, $course_id);
        
        // Get next lesson
        $next_lesson = Codelab_LMS_Public::get_next_lesson($course_id, $lesson_id);
        
        $response = array(
            'message' => __('Lesson marked as complete!', 'codelab-educare-lms'),
            'progress_percentage' => $progress_percentage,
            'course_completed' => $progress_percentage >= 100
        );
        
        if ($next_lesson) {
            $response['next_lesson_url'] = get_permalink($next_lesson->ID);
            $response['next_lesson_title'] = $next_lesson->post_title;
        }
        
        if ($progress_percentage >= 100) {
            $response['completion_message'] = __('Congratulations! You have completed this course!', 'codelab-educare-lms');
        }
        
        wp_send_json_success($response);
    }
    
    /**
     * Get course progress
     */
    public function get_course_progress() {
        $this->verify_nonce();
        
        $course_id = intval($_POST['course_id']);
        $user_id = get_current_user_id();
        
        if (!$course_id) {
            wp_send_json_error(array('message' => __('Invalid course', 'codelab-educare-lms')));
        }
        
        // Check if user can access course
        if (!Codelab_LMS_User_Roles::user_can_access_course($user_id, $course_id)) {
            wp_send_json_error(array('message' => __('Access denied', 'codelab-educare-lms')));
        }
        
        $progress_percentage = Codelab_LMS_Public::get_course_completion_percentage($user_id, $course_id);
        $lessons = Codelab_LMS_Public::get_course_lessons($course_id);
        
        $lesson_progress = array();
        foreach ($lessons as $lesson) {
            $completed = Codelab_LMS_Public::is_lesson_completed($user_id, $lesson->ID);
            $lesson_progress[] = array(
                'id' => $lesson->ID,
                'title' => $lesson->post_title,
                'completed' => $completed,
                'url' => get_permalink($lesson->ID)
            );
        }
        
        wp_send_json_success(array(
            'progress_percentage' => $progress_percentage,
            'lessons' => $lesson_progress,
            'total_lessons' => count($lessons),
            'completed_lessons' => count(array_filter($lesson_progress, function($l) { return $l['completed']; }))
        ));
    }
    
    /**
     * Send message
     */
    public function send_message() {
        $this->verify_nonce();
        
        $recipient_id = intval($_POST['recipient_id']);
        $course_id = intval($_POST['course_id']);
        $subject = sanitize_text_field($_POST['subject']);
        $message = sanitize_textarea_field($_POST['message']);
        $user_id = get_current_user_id();
        
        if (!$recipient_id || !$subject || !$message) {
            wp_send_json_error(array('message' => __('Please fill in all required fields', 'codelab-educare-lms')));
        }
        
        // Validate recipient exists
        $recipient = get_user_by('ID', $recipient_id);
        if (!$recipient) {
            wp_send_json_error(array('message' => __('Invalid recipient', 'codelab-educare-lms')));
        }
        
        // Save message to database
        global $wpdb;
        $messages_table = $wpdb->prefix . 'codelab_lms_messages';
        
        $result = $wpdb->insert(
            $messages_table,
            array(
                'sender_id' => $user_id,
                'recipient_id' => $recipient_id,
                'course_id' => $course_id ?: null,
                'subject' => $subject,
                'message' => $message,
                'sent_date' => current_time('mysql'),
                'status' => 'sent'
            ),
            array('%d', '%d', '%d', '%s', '%s', '%s', '%s')
        );
        
        if ($result) {
            // Send email notification if enabled
            if (get_option('codelab_lms_email_notifications', 1)) {
                $sender = get_user_by('ID', $user_id);
                $email_subject = '[Codelab LMS] ' . $subject;
                $email_message = sprintf(
                    __('You have received a new message from %s:

Subject: %s

Message:
%s

Login to your dashboard to reply: %s', 'codelab-educare-lms'),
                    $sender->display_name,
                    $subject,
                    $message,
                    Codelab_LMS_User_Roles::get_user_dashboard_url($recipient_id)
                );
                
                wp_mail($recipient->user_email, $email_subject, $email_message);
            }
            
            wp_send_json_success(array('message' => __('Message sent successfully!', 'codelab-educare-lms')));
        } else {
            wp_send_json_error(array('message' => __('Failed to send message', 'codelab-educare-lms')));
        }
    }
    
    /**
     * Get messages
     */
    public function get_messages() {
        $this->verify_nonce();
        
        $user_id = get_current_user_id();
        $type = sanitize_text_field($_POST['type']); // 'inbox', 'sent'
        $page = max(1, intval($_POST['page']));
        $per_page = 10;
        $offset = ($page - 1) * $per_page;
        
        global $wpdb;
        $messages_table = $wpdb->prefix . 'codelab_lms_messages';
        
        if ($type === 'sent') {
            $where = "sender_id = %d";
            $user_field = 'recipient_id';
        } else {
            $where = "recipient_id = %d";
            $user_field = 'sender_id';
        }
        
        $messages = $wpdb->get_results($wpdb->prepare("
            SELECT m.*, u.display_name as user_name, u.user_email, p.post_title as course_title
            FROM $messages_table m
            LEFT JOIN {$wpdb->users} u ON m.$user_field = u.ID
            LEFT JOIN {$wpdb->posts} p ON m.course_id = p.ID
            WHERE $where
            ORDER BY m.sent_date DESC
            LIMIT %d OFFSET %d
        ", $user_id, $per_page, $offset));
        
        $total_messages = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $messages_table WHERE $where",
            $user_id
        ));
        
        // Mark inbox messages as read
        if ($type === 'inbox') {
            $wpdb->update(
                $messages_table,
                array('status' => 'read', 'read_date' => current_time('mysql')),
                array('recipient_id' => $user_id, 'status' => 'sent'),
                array('%s', '%s'),
                array('%d', '%s')
            );
        }
        
        wp_send_json_success(array(
            'messages' => $messages,
            'total' => intval($total_messages),
            'page' => $page,
            'per_page' => $per_page,
            'total_pages' => ceil($total_messages / $per_page)
        ));
    }
    
    /**
     * Submit quiz
     */
    public function submit_quiz() {
        $this->verify_nonce();
        
        $quiz_id = intval($_POST['quiz_id']);
        $answers = $_POST['answers']; // Array of question_id => answer
        $user_id = get_current_user_id();
        
        if (!$quiz_id || !is_array($answers)) {
            wp_send_json_error(array('message' => __('Invalid quiz data', 'codelab-educare-lms')));
        }
        
        global $wpdb;
        
        // Get quiz details
        $quiz_table = $wpdb->prefix . 'codelab_lms_quizzes';
        $quiz = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $quiz_table WHERE id = %d",
            $quiz_id
        ));
        
        if (!$quiz) {
            wp_send_json_error(array('message' => __('Quiz not found', 'codelab-educare-lms')));
        }
        
        // Check if user can access this quiz
        $lesson = get_post($quiz->lesson_id);
        $course_id = get_post_meta($quiz->lesson_id, '_lesson_course', true);
        
        if (!Codelab_LMS_User_Roles::user_can_access_course($user_id, $course_id)) {
            wp_send_json_error(array('message' => __('Access denied', 'codelab-educare-lms')));
        }
        
        // Check attempt limit
        $attempts_table = $wpdb->prefix . 'codelab_lms_quiz_attempts';
        $attempt_count = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $attempts_table WHERE user_id = %d AND quiz_id = %d",
            $user_id,
            $quiz_id
        ));
        
        if ($attempt_count >= $quiz->max_attempts) {
            wp_send_json_error(array('message' => __('Maximum attempts exceeded', 'codelab-educare-lms')));
        }
        
        // Get quiz questions
        $questions_table = $wpdb->prefix . 'codelab_lms_quiz_questions';
        $questions = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $questions_table WHERE quiz_id = %d ORDER BY question_order",
            $quiz_id
        ));
        
        // Calculate score
        $total_score = 0;
        $max_score = 0;
        $correct_answers = 0;
        
        foreach ($questions as $question) {
            $max_score += $question->points;
            $user_answer = isset($answers[$question->id]) ? $answers[$question->id] : '';
            
            if ($question->question_type !== 'essay') {
                // Auto-grade non-essay questions
                if (strtolower(trim($user_answer)) === strtolower(trim($question->correct_answer))) {
                    $total_score += $question->points;
                    $correct_answers++;
                }
            } else {
                // Essay questions require manual grading
                // For now, give full points (will be manually adjusted)
                $total_score += $question->points;
            }
        }
        
        $percentage = $max_score > 0 ? ($total_score / $max_score) * 100 : 0;
        $passed = $percentage >= $quiz->pass_percentage;
        
        // Save attempt
        $wpdb->insert(
            $attempts_table,
            array(
                'user_id' => $user_id,
                'quiz_id' => $quiz_id,
                'score' => $total_score,
                'max_score' => $max_score,
                'passed' => $passed ? 1 : 0,
                'attempt_number' => $attempt_count + 1,
                'started_date' => current_time('mysql'),
                'completed_date' => current_time('mysql'),
                'answers' => json_encode($answers)
            ),
            array('%d', '%d', '%f', '%f', '%d', '%d', '%s', '%s', '%s')
        );
        
        wp_send_json_success(array(
            'score' => $total_score,
            'max_score' => $max_score,
            'percentage' => round($percentage, 1),
            'passed' => $passed,
            'pass_percentage' => $quiz->pass_percentage,
            'correct_answers' => $correct_answers,
            'total_questions' => count($questions),
            'attempts_used' => $attempt_count + 1,
            'max_attempts' => $quiz->max_attempts,
            'message' => $passed ? __('Congratulations! You passed the quiz.', 'codelab-educare-lms') : __('You did not pass this time. Please review and try again.', 'codelab-educare-lms')
        ));
    }
    
    /**
     * Load lesson content
     */
    public function load_lesson_content() {
        $this->verify_nonce();
        
        $lesson_id = intval($_POST['lesson_id']);
        $user_id = get_current_user_id();
        
        if (!$lesson_id) {
            wp_send_json_error(array('message' => __('Invalid lesson', 'codelab-educare-lms')));
        }
        
        $lesson = get_post($lesson_id);
        if (!$lesson || $lesson->post_type !== 'lms_lesson') {
            wp_send_json_error(array('message' => __('Lesson not found', 'codelab-educare-lms')));
        }
        
        // Check access
        $course_id = get_post_meta($lesson_id, '_lesson_course', true);
        if (!Codelab_LMS_User_Roles::user_can_access_course($user_id, $course_id)) {
            wp_send_json_error(array('message' => __('Access denied', 'codelab-educare-lms')));
        }
        
        // Track lesson access
        if (method_exists('Codelab_LMS_Public', 'track_lesson_progress')) {
            // Use reflection to access private method
            $reflection = new ReflectionClass('Codelab_LMS_Public');
            $method = $reflection->getMethod('track_lesson_progress');
            $method->setAccessible(true);
            $method->invokeArgs(null, array($user_id, $lesson_id));
        }
        
        $lesson_type = get_post_meta($lesson_id, '_lesson_type', true);
        $video_url = get_post_meta($lesson_id, '_lesson_video_url', true);
        $is_completed = Codelab_LMS_Public::is_lesson_completed($user_id, $lesson_id);
        
        wp_send_json_success(array(
            'title' => $lesson->post_title,
            'content' => apply_filters('the_content', $lesson->post_content),
            'lesson_type' => $lesson_type,
            'video_url' => $video_url,
            'is_completed' => $is_completed,
            'next_lesson' => Codelab_LMS_Public::get_next_lesson($course_id, $lesson_id),
            'previous_lesson' => Codelab_LMS_Public::get_previous_lesson($course_id, $lesson_id)
        ));
    }
    
    /**
     * Bulk enroll students (Admin only)
     */
    public function bulk_enroll() {
        if (!current_user_can('lms_manage_all')) {
            wp_send_json_error(array('message' => __('Access denied', 'codelab-educare-lms')));
        }
        
        $this->verify_nonce();
        
        $course_id = intval($_POST['course_id']);
        $user_ids = array_map('intval', $_POST['user_ids']);
        
        if (!$course_id || empty($user_ids)) {
            wp_send_json_error(array('message' => __('Invalid data provided', 'codelab-educare-lms')));
        }
        
        $enrolled_count = 0;
        $errors = array();
        
        foreach ($user_ids as $user_id) {
            if (codelab_lms_enroll_user($user_id, $course_id)) {
                $enrolled_count++;
            } else {
                $user = get_user_by('ID', $user_id);
                $errors[] = sprintf(__('Failed to enroll %s', 'codelab-educare-lms'), $user ? $user->display_name : 'User ID ' . $user_id);
            }
        }
        
        wp_send_json_success(array(
            'message' => sprintf(__('Successfully enrolled %d students', 'codelab-educare-lms'), $enrolled_count),
            'enrolled_count' => $enrolled_count,
            'errors' => $errors
        ));
    }
    
    /**
     * Transfer commission to mentor (Admin only)
     */
    public function transfer_commission() {
        if (!current_user_can('lms_manage_commissions')) {
            wp_send_json_error(array('message' => __('Access denied', 'codelab-educare-lms')));
        }
        
        $this->verify_nonce();
        
        $commission_id = intval($_POST['commission_id']);
        
        if (!$commission_id) {
            wp_send_json_error(array('message' => __('Invalid commission ID', 'codelab-educare-lms')));
        }
        
        $paystack = new Codelab_LMS_Paystack();
        
        if ($paystack->transfer_commission($commission_id)) {
            wp_send_json_success(array('message' => __('Commission transferred successfully', 'codelab-educare-lms')));
        } else {
            wp_send_json_error(array('message' => __('Commission transfer failed', 'codelab-educare-lms')));
        }
    }
    
    /**
     * Get course statistics (Admin/Mentor)
     */
    public function get_course_stats() {
        if (!current_user_can('lms_view_analytics')) {
            wp_send_json_error(array('message' => __('Access denied', 'codelab-educare-lms')));
        }
        
        $this->verify_nonce();
        
        $course_id = intval($_POST['course_id']);
        $user_id = get_current_user_id();
        
        if (!$course_id) {
            wp_send_json_error(array('message' => __('Invalid course ID', 'codelab-educare-lms')));
        }
        
        // Check if user can view stats for this course
        $mentor_id = get_post_meta($course_id, '_course_mentor', true);
        if (!current_user_can('lms_manage_all') && $mentor_id != $user_id) {
            wp_send_json_error(array('message' => __('Access denied', 'codelab-educare-lms')));
        }
        
        global $wpdb;
        $enrollments_table = $wpdb->prefix . 'codelab_lms_enrollments';
        
        // Get enrollment stats
        $total_enrollments = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $enrollments_table WHERE course_id = %d",
            $course_id
        ));
        
        $active_enrollments = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $enrollments_table WHERE course_id = %d AND status = 'active'",
            $course_id
        ));
        
        $completed_enrollments = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $enrollments_table WHERE course_id = %d AND status = 'completed'",
            $course_id
        ));
        
        $average_progress = $wpdb->get_var($wpdb->prepare(
            "SELECT AVG(progress_percentage) FROM $enrollments_table WHERE course_id = %d AND status IN ('active', 'completed')",
            $course_id
        ));
        
        // Get revenue stats
        $payments_table = $wpdb->prefix . 'codelab_lms_payments';
        $total_revenue = $wpdb->get_var($wpdb->prepare(
            "SELECT SUM(amount) FROM $payments_table WHERE course_id = %d AND status = 'successful'",
            $course_id
        ));
        
        wp_send_json_success(array(
            'total_enrollments' => intval($total_enrollments),
            'active_enrollments' => intval($active_enrollments),
            'completed_enrollments' => intval($completed_enrollments),
            'completion_rate' => $total_enrollments > 0 ? round(($completed_enrollments / $total_enrollments) * 100, 1) : 0,
            'average_progress' => round(floatval($average_progress), 1),
            'total_revenue' => floatval($total_revenue ?: 0),
            'revenue_formatted' => codelab_lms_format_currency($total_revenue ?: 0)
        ));
    }
}