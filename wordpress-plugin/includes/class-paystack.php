<?php
/**
 * Paystack Payment Gateway Class
 * Handles Paystack integration for Nigerian market
 */

if (!defined('ABSPATH')) {
    exit;
}

class Codelab_LMS_Paystack {
    
    private $public_key;
    private $secret_key;
    private $api_url = 'https://api.paystack.co';
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->public_key = get_option('codelab_lms_paystack_public_key');
        $this->secret_key = get_option('codelab_lms_paystack_secret_key');
        
        // Initialize hooks
        add_action('wp_ajax_codelab_lms_initialize_payment', array($this, 'initialize_payment'));
        add_action('wp_ajax_nopriv_codelab_lms_initialize_payment', array($this, 'initialize_payment'));
        add_action('wp_ajax_codelab_lms_verify_payment', array($this, 'verify_payment'));
        add_action('wp_ajax_nopriv_codelab_lms_verify_payment', array($this, 'verify_payment'));
        add_action('init', array($this, 'handle_webhook'));
    }
    
    /**
     * Initialize payment
     */
    public function initialize_payment() {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'], 'codelab_lms_nonce')) {
            wp_die(__('Security check failed', 'codelab-educare-lms'));
        }
        
        $course_id = intval($_POST['course_id']);
        $user_id = get_current_user_id();
        
        if (!$user_id) {
            wp_send_json_error(array('message' => __('Please login to enroll', 'codelab-educare-lms')));
        }
        
        if (!$course_id) {
            wp_send_json_error(array('message' => __('Invalid course', 'codelab-educare-lms')));
        }
        
        // Check if already enrolled
        if (codelab_lms_is_user_enrolled($user_id, $course_id)) {
            wp_send_json_error(array('message' => __('Already enrolled in this course', 'codelab-educare-lms')));
        }
        
        $user = get_user_by('ID', $user_id);
        $course = get_post($course_id);
        $amount = get_post_meta($course_id, '_course_price', true);
        
        if (!$amount || $amount <= 0) {
            wp_send_json_error(array('message' => __('Invalid course price', 'codelab-educare-lms')));
        }
        
        // Generate reference
        $reference = 'CLE_' . time() . '_' . $user_id . '_' . $course_id;
        
        // Initialize payment with Paystack
        $response = $this->api_request('transaction/initialize', array(
            'email' => $user->user_email,
            'amount' => $amount * 100, // Convert to kobo
            'currency' => 'NGN',
            'reference' => $reference,
            'metadata' => array(
                'user_id' => $user_id,
                'course_id' => $course_id,
                'course_title' => $course->post_title,
                'custom_fields' => array(
                    array(
                        'display_name' => 'Course',
                        'variable_name' => 'course_title',
                        'value' => $course->post_title
                    )
                )
            ),
            'callback_url' => home_url('/payment-callback')
        ));
        
        if ($response && $response['status']) {
            // Save payment record
            $this->save_payment_record(array(
                'user_id' => $user_id,
                'course_id' => $course_id,
                'reference' => $reference,
                'amount' => $amount,
                'status' => 'pending'
            ));
            
            wp_send_json_success(array(
                'authorization_url' => $response['data']['authorization_url'],
                'access_code' => $response['data']['access_code'],
                'reference' => $reference
            ));
        } else {
            wp_send_json_error(array('message' => __('Payment initialization failed', 'codelab-educare-lms')));
        }
    }
    
    /**
     * Verify payment
     */
    public function verify_payment() {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'], 'codelab_lms_nonce')) {
            wp_die(__('Security check failed', 'codelab-educare-lms'));
        }
        
        $reference = sanitize_text_field($_POST['reference']);
        
        if (!$reference) {
            wp_send_json_error(array('message' => __('Invalid reference', 'codelab-educare-lms')));
        }
        
        $response = $this->api_request('transaction/verify/' . $reference, array(), 'GET');
        
        if ($response && $response['status'] && $response['data']['status'] === 'success') {
            $this->process_successful_payment($response['data']);
            wp_send_json_success(array('message' => __('Payment successful! You are now enrolled.', 'codelab-educare-lms')));
        } else {
            wp_send_json_error(array('message' => __('Payment verification failed', 'codelab-educare-lms')));
        }
    }
    
    /**
     * Handle Paystack webhook
     */
    public function handle_webhook() {
        if (!isset($_GET['paystack_webhook'])) {
            return;
        }
        
        // Verify webhook signature
        $signature = $_SERVER['HTTP_X_PAYSTACK_SIGNATURE'] ?? '';
        $payload = file_get_contents('php://input');
        
        if (!$this->verify_webhook_signature($payload, $signature)) {
            http_response_code(400);
            exit('Invalid signature');
        }
        
        $event = json_decode($payload, true);
        
        if ($event['event'] === 'charge.success') {
            $this->process_successful_payment($event['data']);
        }
        
        http_response_code(200);
        exit('OK');
    }
    
    /**
     * Process successful payment
     */
    private function process_successful_payment($payment_data) {
        global $wpdb;
        
        $reference = $payment_data['reference'];
        $metadata = $payment_data['metadata'];
        
        $user_id = $metadata['user_id'];
        $course_id = $metadata['course_id'];
        $amount = $payment_data['amount'] / 100; // Convert from kobo
        
        // Update payment record
        $payments_table = $wpdb->prefix . 'codelab_lms_payments';
        $wpdb->update(
            $payments_table,
            array(
                'status' => 'successful',
                'transaction_id' => $payment_data['id'],
                'gateway_response' => json_encode($payment_data),
                'updated_date' => current_time('mysql')
            ),
            array('reference' => $reference),
            array('%s', '%s', '%s', '%s'),
            array('%s')
        );
        
        // Enroll user in course
        if (codelab_lms_enroll_user($user_id, $course_id, $reference)) {
            // Calculate and save mentor commission
            $this->calculate_mentor_commission($course_id, $amount, $user_id);
            
            // Send enrollment email
            $this->send_enrollment_email($user_id, $course_id);
            
            // Trigger action for other plugins
            do_action('codelab_lms_payment_successful', $user_id, $course_id, $amount, $payment_data);
        }
    }
    
    /**
     * Calculate mentor commission
     */
    private function calculate_mentor_commission($course_id, $amount, $student_id) {
        global $wpdb;
        
        $mentor_id = get_post_meta($course_id, '_course_mentor', true);
        
        if (!$mentor_id) {
            return;
        }
        
        $commission_rate = floatval(get_option('codelab_lms_commission_rate', 37.0));
        $commission_amount = ($amount * $commission_rate) / 100;
        
        // Get enrollment ID
        $enrollments_table = $wpdb->prefix . 'codelab_lms_enrollments';
        $enrollment_id = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM $enrollments_table WHERE user_id = %d AND course_id = %d",
            $student_id,
            $course_id
        ));
        
        // Save commission record
        $commissions_table = $wpdb->prefix . 'codelab_lms_commissions';
        $wpdb->insert(
            $commissions_table,
            array(
                'mentor_id' => $mentor_id,
                'enrollment_id' => $enrollment_id,
                'amount' => $commission_amount,
                'commission_rate' => $commission_rate,
                'status' => 'pending',
                'created_date' => current_time('mysql')
            ),
            array('%d', '%d', '%f', '%f', '%s', '%s')
        );
        
        // Update mentor total earnings
        $current_earnings = get_user_meta($mentor_id, '_lms_total_earnings', true);
        update_user_meta($mentor_id, '_lms_total_earnings', $current_earnings + $commission_amount);
        
        // Send commission notification email to mentor
        $this->send_commission_email($mentor_id, $commission_amount, $course_id);
    }
    
    /**
     * Transfer commission to mentor
     */
    public function transfer_commission($commission_id) {
        global $wpdb;
        
        $commissions_table = $wpdb->prefix . 'codelab_lms_commissions';
        $commission = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $commissions_table WHERE id = %d AND status = 'pending'",
            $commission_id
        ));
        
        if (!$commission) {
            return false;
        }
        
        $recipient_code = get_user_meta($commission->mentor_id, '_lms_paystack_recipient_code', true);
        
        if (!$recipient_code) {
            return false;
        }
        
        // Generate transfer reference
        $reference = 'TRF_' . time() . '_' . $commission->mentor_id . '_' . $commission_id;
        
        $response = $this->api_request('transfer', array(
            'source' => 'balance',
            'amount' => $commission->amount * 100, // Convert to kobo
            'recipient' => $recipient_code,
            'reason' => 'Course commission payment',
            'reference' => $reference
        ));
        
        if ($response && $response['status']) {
            // Update commission status
            $wpdb->update(
                $commissions_table,
                array(
                    'status' => 'paid',
                    'paid_date' => current_time('mysql'),
                    'notes' => 'Transfer reference: ' . $reference
                ),
                array('id' => $commission_id),
                array('%s', '%s', '%s'),
                array('%d')
            );
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Save payment record
     */
    private function save_payment_record($data) {
        global $wpdb;
        
        $payments_table = $wpdb->prefix . 'codelab_lms_payments';
        
        $wpdb->insert(
            $payments_table,
            array(
                'user_id' => $data['user_id'],
                'course_id' => $data['course_id'],
                'payment_method' => 'paystack',
                'reference' => $data['reference'],
                'amount' => $data['amount'],
                'currency' => 'NGN',
                'status' => $data['status'],
                'created_date' => current_time('mysql')
            ),
            array('%d', '%d', '%s', '%s', '%f', '%s', '%s', '%s')
        );
    }
    
    /**
     * Send enrollment email
     */
    private function send_enrollment_email($user_id, $course_id) {
        if (!get_option('codelab_lms_email_notifications', 1)) {
            return;
        }
        
        $user = get_user_by('ID', $user_id);
        $course = get_post($course_id);
        
        $subject = sprintf(__('Welcome to %s', 'codelab-educare-lms'), $course->post_title);
        
        $message = sprintf(
            __('Hi %s,

Congratulations! You have successfully enrolled in "%s".

You can access your course here: %s

Best regards,
Codelab Educare Team', 'codelab-educare-lms'),
            $user->display_name,
            $course->post_title,
            get_permalink($course_id)
        );
        
        wp_mail($user->user_email, $subject, $message);
    }
    
    /**
     * Send commission email to mentor
     */
    private function send_commission_email($mentor_id, $amount, $course_id) {
        if (!get_option('codelab_lms_email_notifications', 1)) {
            return;
        }
        
        $mentor = get_user_by('ID', $mentor_id);
        $course = get_post($course_id);
        
        $subject = __('New Commission Earned', 'codelab-educare-lms');
        
        $message = sprintf(
            __('Hi %s,

Great news! You have earned a new commission of %s from a student enrollment in your course "%s".

Your commission will be transferred to your bank account within 24-48 hours.

Best regards,
Codelab Educare Team', 'codelab-educare-lms'),
            $mentor->display_name,
            codelab_lms_format_currency($amount),
            $course->post_title
        );
        
        wp_mail($mentor->user_email, $subject, $message);
    }
    
    /**
     * Make API request to Paystack
     */
    private function api_request($endpoint, $data = array(), $method = 'POST') {
        if (!$this->secret_key) {
            return false;
        }
        
        $url = $this->api_url . '/' . $endpoint;
        
        $args = array(
            'method' => $method,
            'headers' => array(
                'Authorization' => 'Bearer ' . $this->secret_key,
                'Content-Type' => 'application/json'
            ),
            'timeout' => 30
        );
        
        if ($method !== 'GET' && !empty($data)) {
            $args['body'] = json_encode($data);
        }
        
        $response = wp_remote_request($url, $args);
        
        if (is_wp_error($response)) {
            return false;
        }
        
        $body = wp_remote_retrieve_body($response);
        return json_decode($body, true);
    }
    
    /**
     * Verify webhook signature
     */
    private function verify_webhook_signature($payload, $signature) {
        $computed_signature = hash_hmac('sha512', $payload, $this->secret_key);
        return hash_equals($signature, $computed_signature);
    }
    
    /**
     * Get payment status
     */
    public function get_payment_status($reference) {
        global $wpdb;
        
        $payments_table = $wpdb->prefix . 'codelab_lms_payments';
        return $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $payments_table WHERE reference = %s",
            $reference
        ));
    }
    
    /**
     * Get mentor commissions
     */
    public function get_mentor_commissions($mentor_id, $status = null) {
        global $wpdb;
        
        $commissions_table = $wpdb->prefix . 'codelab_lms_commissions';
        $where = "mentor_id = %d";
        $values = array($mentor_id);
        
        if ($status) {
            $where .= " AND status = %s";
            $values[] = $status;
        }
        
        return $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $commissions_table WHERE $where ORDER BY created_date DESC",
            $values
        ));
    }
    
    /**
     * Get payment statistics
     */
    public function get_payment_statistics($start_date = null, $end_date = null) {
        global $wpdb;
        
        $payments_table = $wpdb->prefix . 'codelab_lms_payments';
        $where = "status = 'successful'";
        $values = array();
        
        if ($start_date) {
            $where .= " AND created_date >= %s";
            $values[] = $start_date;
        }
        
        if ($end_date) {
            $where .= " AND created_date <= %s";
            $values[] = $end_date;
        }
        
        $query = "SELECT 
            COUNT(*) as total_transactions,
            SUM(amount) as total_revenue,
            AVG(amount) as average_amount
            FROM $payments_table 
            WHERE $where";
        
        if (!empty($values)) {
            return $wpdb->get_row($wpdb->prepare($query, $values));
        } else {
            return $wpdb->get_row($query);
        }
    }
}