<?php
/**
 * Custom Post Types Class
 * Handles registration of custom post types for courses, lessons, and quizzes
 */

if (!defined('ABSPATH')) {
    exit;
}

class Codelab_LMS_Post_Types {
    
    /**
     * Initialize post types
     */
    public static function init() {
        add_action('init', array(__CLASS__, 'register_post_types'));
        add_action('init', array(__CLASS__, 'register_taxonomies'));
        add_action('add_meta_boxes', array(__CLASS__, 'add_meta_boxes'));
        add_action('save_post', array(__CLASS__, 'save_meta_boxes'));
    }
    
    /**
     * Register custom post types
     */
    public static function register_post_types() {
        // Course post type
        register_post_type('lms_course', array(
            'labels' => array(
                'name' => __('Courses', 'codelab-educare-lms'),
                'singular_name' => __('Course', 'codelab-educare-lms'),
                'add_new' => __('Add New Course', 'codelab-educare-lms'),
                'add_new_item' => __('Add New Course', 'codelab-educare-lms'),
                'edit_item' => __('Edit Course', 'codelab-educare-lms'),
                'new_item' => __('New Course', 'codelab-educare-lms'),
                'view_item' => __('View Course', 'codelab-educare-lms'),
                'search_items' => __('Search Courses', 'codelab-educare-lms'),
                'not_found' => __('No courses found', 'codelab-educare-lms'),
                'not_found_in_trash' => __('No courses found in trash', 'codelab-educare-lms'),
                'menu_name' => __('Courses', 'codelab-educare-lms')
            ),
            'public' => true,
            'has_archive' => true,
            'menu_icon' => 'dashicons-book',
            'supports' => array('title', 'editor', 'thumbnail', 'excerpt', 'custom-fields'),
            'rewrite' => array('slug' => 'courses'),
            'show_in_rest' => true,
            'menu_position' => 25,
            'capabilities' => array(
                'publish_posts' => 'lms_create_courses',
                'edit_posts' => 'lms_edit_courses',
                'edit_others_posts' => 'lms_manage_all',
                'delete_posts' => 'lms_edit_courses',
                'delete_others_posts' => 'lms_manage_all',
                'read_private_posts' => 'lms_manage_all',
                'edit_post' => 'lms_edit_courses',
                'delete_post' => 'lms_edit_courses',
                'read_post' => 'lms_access_courses'
            )
        ));
        
        // Lesson post type
        register_post_type('lms_lesson', array(
            'labels' => array(
                'name' => __('Lessons', 'codelab-educare-lms'),
                'singular_name' => __('Lesson', 'codelab-educare-lms'),
                'add_new' => __('Add New Lesson', 'codelab-educare-lms'),
                'add_new_item' => __('Add New Lesson', 'codelab-educare-lms'),
                'edit_item' => __('Edit Lesson', 'codelab-educare-lms'),
                'new_item' => __('New Lesson', 'codelab-educare-lms'),
                'view_item' => __('View Lesson', 'codelab-educare-lms'),
                'search_items' => __('Search Lessons', 'codelab-educare-lms'),
                'not_found' => __('No lessons found', 'codelab-educare-lms'),
                'not_found_in_trash' => __('No lessons found in trash', 'codelab-educare-lms'),
                'menu_name' => __('Lessons', 'codelab-educare-lms')
            ),
            'public' => true,
            'hierarchical' => true,
            'menu_icon' => 'dashicons-media-document',
            'supports' => array('title', 'editor', 'thumbnail', 'page-attributes', 'custom-fields'),
            'rewrite' => array('slug' => 'lessons'),
            'show_in_rest' => true,
            'show_in_menu' => 'edit.php?post_type=lms_course',
            'capabilities' => array(
                'publish_posts' => 'lms_create_courses',
                'edit_posts' => 'lms_edit_courses',
                'edit_others_posts' => 'lms_manage_all',
                'delete_posts' => 'lms_edit_courses',
                'delete_others_posts' => 'lms_manage_all',
                'read_private_posts' => 'lms_manage_all',
                'edit_post' => 'lms_edit_courses',
                'delete_post' => 'lms_edit_courses',
                'read_post' => 'lms_access_courses'
            )
        ));
        
        // Assignment post type
        register_post_type('lms_assignment', array(
            'labels' => array(
                'name' => __('Assignments', 'codelab-educare-lms'),
                'singular_name' => __('Assignment', 'codelab-educare-lms'),
                'add_new' => __('Add New Assignment', 'codelab-educare-lms'),
                'add_new_item' => __('Add New Assignment', 'codelab-educare-lms'),
                'edit_item' => __('Edit Assignment', 'codelab-educare-lms'),
                'new_item' => __('New Assignment', 'codelab-educare-lms'),
                'view_item' => __('View Assignment', 'codelab-educare-lms'),
                'search_items' => __('Search Assignments', 'codelab-educare-lms'),
                'not_found' => __('No assignments found', 'codelab-educare-lms'),
                'not_found_in_trash' => __('No assignments found in trash', 'codelab-educare-lms'),
                'menu_name' => __('Assignments', 'codelab-educare-lms')
            ),
            'public' => true,
            'menu_icon' => 'dashicons-clipboard',
            'supports' => array('title', 'editor', 'custom-fields'),
            'rewrite' => array('slug' => 'assignments'),
            'show_in_rest' => true,
            'show_in_menu' => 'edit.php?post_type=lms_course',
            'capabilities' => array(
                'publish_posts' => 'lms_create_courses',
                'edit_posts' => 'lms_edit_courses',
                'edit_others_posts' => 'lms_manage_all',
                'delete_posts' => 'lms_edit_courses',
                'delete_others_posts' => 'lms_manage_all',
                'read_private_posts' => 'lms_manage_all',
                'edit_post' => 'lms_edit_courses',
                'delete_post' => 'lms_edit_courses',
                'read_post' => 'lms_access_courses'
            )
        ));
    }
    
    /**
     * Register custom taxonomies
     */
    public static function register_taxonomies() {
        // Course categories
        register_taxonomy('course_category', 'lms_course', array(
            'labels' => array(
                'name' => __('Course Categories', 'codelab-educare-lms'),
                'singular_name' => __('Course Category', 'codelab-educare-lms'),
                'search_items' => __('Search Categories', 'codelab-educare-lms'),
                'all_items' => __('All Categories', 'codelab-educare-lms'),
                'edit_item' => __('Edit Category', 'codelab-educare-lms'),
                'update_item' => __('Update Category', 'codelab-educare-lms'),
                'add_new_item' => __('Add New Category', 'codelab-educare-lms'),
                'new_item_name' => __('New Category Name', 'codelab-educare-lms'),
                'menu_name' => __('Categories', 'codelab-educare-lms')
            ),
            'hierarchical' => true,
            'public' => true,
            'show_ui' => true,
            'show_admin_column' => true,
            'show_in_nav_menus' => true,
            'show_tagcloud' => true,
            'show_in_rest' => true,
            'rewrite' => array('slug' => 'course-category')
        ));
        
        // Course tags
        register_taxonomy('course_tag', 'lms_course', array(
            'labels' => array(
                'name' => __('Course Tags', 'codelab-educare-lms'),
                'singular_name' => __('Course Tag', 'codelab-educare-lms'),
                'search_items' => __('Search Tags', 'codelab-educare-lms'),
                'all_items' => __('All Tags', 'codelab-educare-lms'),
                'edit_item' => __('Edit Tag', 'codelab-educare-lms'),
                'update_item' => __('Update Tag', 'codelab-educare-lms'),
                'add_new_item' => __('Add New Tag', 'codelab-educare-lms'),
                'new_item_name' => __('New Tag Name', 'codelab-educare-lms'),
                'menu_name' => __('Tags', 'codelab-educare-lms')
            ),
            'hierarchical' => false,
            'public' => true,
            'show_ui' => true,
            'show_admin_column' => true,
            'show_in_nav_menus' => true,
            'show_tagcloud' => true,
            'show_in_rest' => true,
            'rewrite' => array('slug' => 'course-tag')
        ));
        
        // Course difficulty levels
        register_taxonomy('course_level', 'lms_course', array(
            'labels' => array(
                'name' => __('Course Levels', 'codelab-educare-lms'),
                'singular_name' => __('Course Level', 'codelab-educare-lms'),
                'menu_name' => __('Levels', 'codelab-educare-lms')
            ),
            'hierarchical' => false,
            'public' => true,
            'show_ui' => true,
            'show_admin_column' => true,
            'show_in_rest' => true,
            'rewrite' => array('slug' => 'course-level')
        ));
    }
    
    /**
     * Add meta boxes
     */
    public static function add_meta_boxes() {
        // Course meta box
        add_meta_box(
            'course_details',
            __('Course Details', 'codelab-educare-lms'),
            array(__CLASS__, 'course_details_meta_box'),
            'lms_course',
            'normal',
            'high'
        );
        
        // Lesson meta box
        add_meta_box(
            'lesson_details',
            __('Lesson Details', 'codelab-educare-lms'),
            array(__CLASS__, 'lesson_details_meta_box'),
            'lms_lesson',
            'normal',
            'high'
        );
        
        // Assignment meta box
        add_meta_box(
            'assignment_details',
            __('Assignment Details', 'codelab-educare-lms'),
            array(__CLASS__, 'assignment_details_meta_box'),
            'lms_assignment',
            'normal',
            'high'
        );
    }
    
    /**
     * Course details meta box
     */
    public static function course_details_meta_box($post) {
        wp_nonce_field('course_details_nonce', 'course_details_nonce_field');
        
        $price = get_post_meta($post->ID, '_course_price', true);
        $duration = get_post_meta($post->ID, '_course_duration', true);
        $prerequisites = get_post_meta($post->ID, '_course_prerequisites', true);
        $mentor_id = get_post_meta($post->ID, '_course_mentor', true);
        $max_students = get_post_meta($post->ID, '_course_max_students', true);
        $certificate_enabled = get_post_meta($post->ID, '_course_certificate_enabled', true);
        $featured = get_post_meta($post->ID, '_course_featured', true);
        
        ?>
        <table class="form-table">
            <tr>
                <th scope="row"><label for="course_price"><?php _e('Price (₦)', 'codelab-educare-lms'); ?></label></th>
                <td><input type="number" id="course_price" name="course_price" value="<?php echo esc_attr($price); ?>" step="0.01" /></td>
            </tr>
            <tr>
                <th scope="row"><label for="course_duration"><?php _e('Duration (hours)', 'codelab-educare-lms'); ?></label></th>
                <td><input type="number" id="course_duration" name="course_duration" value="<?php echo esc_attr($duration); ?>" /></td>
            </tr>
            <tr>
                <th scope="row"><label for="course_mentor"><?php _e('Mentor', 'codelab-educare-lms'); ?></label></th>
                <td>
                    <?php
                    $mentors = get_users(array('role' => 'lms_mentor'));
                    ?>
                    <select id="course_mentor" name="course_mentor">
                        <option value=""><?php _e('Select Mentor', 'codelab-educare-lms'); ?></option>
                        <?php foreach ($mentors as $mentor): ?>
                            <option value="<?php echo $mentor->ID; ?>" <?php selected($mentor_id, $mentor->ID); ?>>
                                <?php echo esc_html($mentor->display_name); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="course_max_students"><?php _e('Max Students', 'codelab-educare-lms'); ?></label></th>
                <td><input type="number" id="course_max_students" name="course_max_students" value="<?php echo esc_attr($max_students); ?>" /></td>
            </tr>
            <tr>
                <th scope="row"><label for="course_prerequisites"><?php _e('Prerequisites', 'codelab-educare-lms'); ?></label></th>
                <td><textarea id="course_prerequisites" name="course_prerequisites" rows="4" cols="50"><?php echo esc_textarea($prerequisites); ?></textarea></td>
            </tr>
            <tr>
                <th scope="row"><?php _e('Certificate', 'codelab-educare-lms'); ?></th>
                <td>
                    <label>
                        <input type="checkbox" name="course_certificate_enabled" value="1" <?php checked($certificate_enabled, 1); ?> />
                        <?php _e('Enable certificate upon completion', 'codelab-educare-lms'); ?>
                    </label>
                </td>
            </tr>
            <tr>
                <th scope="row"><?php _e('Featured Course', 'codelab-educare-lms'); ?></th>
                <td>
                    <label>
                        <input type="checkbox" name="course_featured" value="1" <?php checked($featured, 1); ?> />
                        <?php _e('Mark as featured course', 'codelab-educare-lms'); ?>
                    </label>
                </td>
            </tr>
        </table>
        <?php
    }
    
    /**
     * Lesson details meta box
     */
    public static function lesson_details_meta_box($post) {
        wp_nonce_field('lesson_details_nonce', 'lesson_details_nonce_field');
        
        $course_id = get_post_meta($post->ID, '_lesson_course', true);
        $video_url = get_post_meta($post->ID, '_lesson_video_url', true);
        $video_duration = get_post_meta($post->ID, '_lesson_video_duration', true);
        $lesson_type = get_post_meta($post->ID, '_lesson_type', true);
        $free_preview = get_post_meta($post->ID, '_lesson_free_preview', true);
        
        ?>
        <table class="form-table">
            <tr>
                <th scope="row"><label for="lesson_course"><?php _e('Course', 'codelab-educare-lms'); ?></label></th>
                <td>
                    <?php
                    $courses = get_posts(array('post_type' => 'lms_course', 'numberposts' => -1, 'post_status' => 'any'));
                    ?>
                    <select id="lesson_course" name="lesson_course">
                        <option value=""><?php _e('Select Course', 'codelab-educare-lms'); ?></option>
                        <?php foreach ($courses as $course): ?>
                            <option value="<?php echo $course->ID; ?>" <?php selected($course_id, $course->ID); ?>>
                                <?php echo esc_html($course->post_title); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="lesson_type"><?php _e('Lesson Type', 'codelab-educare-lms'); ?></label></th>
                <td>
                    <select id="lesson_type" name="lesson_type">
                        <option value="video" <?php selected($lesson_type, 'video'); ?>><?php _e('Video', 'codelab-educare-lms'); ?></option>
                        <option value="text" <?php selected($lesson_type, 'text'); ?>><?php _e('Text', 'codelab-educare-lms'); ?></option>
                        <option value="quiz" <?php selected($lesson_type, 'quiz'); ?>><?php _e('Quiz', 'codelab-educare-lms'); ?></option>
                        <option value="assignment" <?php selected($lesson_type, 'assignment'); ?>><?php _e('Assignment', 'codelab-educare-lms'); ?></option>
                    </select>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="lesson_video_url"><?php _e('Video URL', 'codelab-educare-lms'); ?></label></th>
                <td><input type="url" id="lesson_video_url" name="lesson_video_url" value="<?php echo esc_attr($video_url); ?>" class="regular-text" /></td>
            </tr>
            <tr>
                <th scope="row"><label for="lesson_video_duration"><?php _e('Duration (minutes)', 'codelab-educare-lms'); ?></label></th>
                <td><input type="number" id="lesson_video_duration" name="lesson_video_duration" value="<?php echo esc_attr($video_duration); ?>" /></td>
            </tr>
            <tr>
                <th scope="row"><?php _e('Free Preview', 'codelab-educare-lms'); ?></th>
                <td>
                    <label>
                        <input type="checkbox" name="lesson_free_preview" value="1" <?php checked($free_preview, 1); ?> />
                        <?php _e('Allow free preview of this lesson', 'codelab-educare-lms'); ?>
                    </label>
                </td>
            </tr>
        </table>
        <?php
    }
    
    /**
     * Assignment details meta box
     */
    public static function assignment_details_meta_box($post) {
        wp_nonce_field('assignment_details_nonce', 'assignment_details_nonce_field');
        
        $course_id = get_post_meta($post->ID, '_assignment_course', true);
        $max_points = get_post_meta($post->ID, '_assignment_max_points', true);
        $due_date = get_post_meta($post->ID, '_assignment_due_date', true);
        $submission_type = get_post_meta($post->ID, '_assignment_submission_type', true);
        $file_types = get_post_meta($post->ID, '_assignment_file_types', true);
        
        ?>
        <table class="form-table">
            <tr>
                <th scope="row"><label for="assignment_course"><?php _e('Course', 'codelab-educare-lms'); ?></label></th>
                <td>
                    <?php
                    $courses = get_posts(array('post_type' => 'lms_course', 'numberposts' => -1, 'post_status' => 'any'));
                    ?>
                    <select id="assignment_course" name="assignment_course">
                        <option value=""><?php _e('Select Course', 'codelab-educare-lms'); ?></option>
                        <?php foreach ($courses as $course): ?>
                            <option value="<?php echo $course->ID; ?>" <?php selected($course_id, $course->ID); ?>>
                                <?php echo esc_html($course->post_title); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="assignment_max_points"><?php _e('Max Points', 'codelab-educare-lms'); ?></label></th>
                <td><input type="number" id="assignment_max_points" name="assignment_max_points" value="<?php echo esc_attr($max_points); ?>" /></td>
            </tr>
            <tr>
                <th scope="row"><label for="assignment_due_date"><?php _e('Due Date', 'codelab-educare-lms'); ?></label></th>
                <td><input type="datetime-local" id="assignment_due_date" name="assignment_due_date" value="<?php echo esc_attr($due_date); ?>" /></td>
            </tr>
            <tr>
                <th scope="row"><label for="assignment_submission_type"><?php _e('Submission Type', 'codelab-educare-lms'); ?></label></th>
                <td>
                    <select id="assignment_submission_type" name="assignment_submission_type">
                        <option value="file" <?php selected($submission_type, 'file'); ?>><?php _e('File Upload', 'codelab-educare-lms'); ?></option>
                        <option value="text" <?php selected($submission_type, 'text'); ?>><?php _e('Text Entry', 'codelab-educare-lms'); ?></option>
                        <option value="both" <?php selected($submission_type, 'both'); ?>><?php _e('Both', 'codelab-educare-lms'); ?></option>
                    </select>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="assignment_file_types"><?php _e('Allowed File Types', 'codelab-educare-lms'); ?></label></th>
                <td><input type="text" id="assignment_file_types" name="assignment_file_types" value="<?php echo esc_attr($file_types); ?>" class="regular-text" placeholder="pdf,doc,docx,txt" /></td>
            </tr>
        </table>
        <?php
    }
    
    /**
     * Save meta box data
     */
    public static function save_meta_boxes($post_id) {
        // Check if this is an autosave
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }
        
        // Check user permissions
        if (!current_user_can('edit_post', $post_id)) {
            return;
        }
        
        // Save course meta
        if (get_post_type($post_id) === 'lms_course') {
            if (isset($_POST['course_details_nonce_field']) && wp_verify_nonce($_POST['course_details_nonce_field'], 'course_details_nonce')) {
                $fields = array(
                    'course_price' => 'floatval',
                    'course_duration' => 'intval',
                    'course_prerequisites' => 'sanitize_textarea_field',
                    'course_mentor' => 'intval',
                    'course_max_students' => 'intval',
                    'course_certificate_enabled' => 'intval',
                    'course_featured' => 'intval'
                );
                
                foreach ($fields as $field => $sanitize_function) {
                    if (isset($_POST[$field])) {
                        update_post_meta($post_id, '_' . $field, $sanitize_function($_POST[$field]));
                    }
                }
            }
        }
        
        // Save lesson meta
        if (get_post_type($post_id) === 'lms_lesson') {
            if (isset($_POST['lesson_details_nonce_field']) && wp_verify_nonce($_POST['lesson_details_nonce_field'], 'lesson_details_nonce')) {
                $fields = array(
                    'lesson_course' => 'intval',
                    'lesson_video_url' => 'esc_url_raw',
                    'lesson_video_duration' => 'intval',
                    'lesson_type' => 'sanitize_text_field',
                    'lesson_free_preview' => 'intval'
                );
                
                foreach ($fields as $field => $sanitize_function) {
                    if (isset($_POST[$field])) {
                        update_post_meta($post_id, '_' . $field, $sanitize_function($_POST[$field]));
                    }
                }
            }
        }
        
        // Save assignment meta
        if (get_post_type($post_id) === 'lms_assignment') {
            if (isset($_POST['assignment_details_nonce_field']) && wp_verify_nonce($_POST['assignment_details_nonce_field'], 'assignment_details_nonce')) {
                $fields = array(
                    'assignment_course' => 'intval',
                    'assignment_max_points' => 'intval',
                    'assignment_due_date' => 'sanitize_text_field',
                    'assignment_submission_type' => 'sanitize_text_field',
                    'assignment_file_types' => 'sanitize_text_field'
                );
                
                foreach ($fields as $field => $sanitize_function) {
                    if (isset($_POST[$field])) {
                        update_post_meta($post_id, '_' . $field, $sanitize_function($_POST[$field]));
                    }
                }
            }
        }
    }
}