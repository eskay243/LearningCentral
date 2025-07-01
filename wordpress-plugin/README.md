# Codelab Educare LMS WordPress Plugin

A comprehensive Learning Management System (LMS) plugin for WordPress, optimized for the Nigerian education market with Paystack integration and mentor commission system.

## Features

### 🎓 **Complete LMS Functionality**
- Course creation and management with WordPress Block Editor
- Hierarchical lesson structure with progress tracking
- Quiz and assignment system with automated grading
- Student enrollment and progress analytics
- Certificate generation upon course completion

### 💰 **Nigerian Market Optimized Payments**
- **Paystack Integration**: Primary payment gateway for Nigerian market
- **Currency Support**: Nigerian Naira (₦) as default currency
- **37% Mentor Commissions**: Automated commission calculation and tracking
- **Bank Transfer Support**: Multiple Nigerian payment methods

### 👥 **User Management**
- **Three User Roles**: Student, Mentor, Administrator
- **WordPress Integration**: Seamless user management with existing WordPress users
- **Profile Management**: Extended user profiles with LMS-specific fields
- **Role-based Access Control**: Granular permissions for different user types

### 📊 **Analytics & Reporting**
- Course performance metrics
- Student progress analytics
- Revenue tracking and commission reports
- Mentor earnings dashboard

### 💬 **Communication System**
- Student-mentor private messaging
- Course announcements and notifications
- Email integration for automated communications
- Discussion forums per course

### 📱 **Mobile Optimized**
- Responsive design for all devices
- Progressive Web App features
- Offline content caching capabilities
- Touch-friendly interfaces

## Installation

### Requirements
- WordPress 5.0 or higher
- PHP 7.4 or higher
- MySQL 5.6 or higher
- Memory limit: 256MB or higher

### Installation Steps

1. **Download the Plugin**
   ```bash
   # Download the plugin files
   # Upload to /wp-content/plugins/codelab-educare-lms/
   ```

2. **Activate the Plugin**
   - Go to WordPress Admin → Plugins
   - Find "Codelab Educare LMS" and click "Activate"

3. **Initial Configuration**
   - Go to WordPress Admin → Codelab LMS → Settings
   - Configure Paystack API keys
   - Set commission rates (default: 37%)
   - Configure email notifications

4. **Create Default Pages**
   The plugin automatically creates these pages:
   - `/student-dashboard` - Student dashboard page
   - `/mentor-dashboard` - Mentor dashboard page  
   - `/courses` - Course catalog page
   - `/my-courses` - User's enrolled courses

## Configuration

### Paystack Setup

1. **Get Paystack API Keys**
   - Go to [Paystack Dashboard](https://dashboard.paystack.co/apikeys)
   - Copy your Publishable key (starts with `pk_`)
   - Copy your Secret key (starts with `sk_`)

2. **Configure in WordPress**
   - Go to Codelab LMS → Settings
   - Enter your Paystack Public Key
   - Enter your Paystack Secret Key
   - Save settings

### User Roles Configuration

The plugin creates three custom user roles:

- **LMS Student**: Can enroll in courses, track progress, take quizzes
- **LMS Mentor**: Can create courses, manage students, view analytics
- **Administrator**: Full access to all LMS functionality

### Commission System

- Default commission rate: 37% of course price goes to mentor
- Commissions are automatically calculated when students enroll
- Mentors can withdraw earnings through Paystack transfer
- Full transaction history and reporting

## Usage

### For Administrators

1. **Managing Courses**
   - Go to Courses → Add New
   - Use WordPress Block Editor to create course content
   - Set course price, mentor, and other details
   - Publish course to make it available

2. **Managing Users**
   - Create mentor accounts and assign LMS Mentor role
   - Bulk enroll students in courses
   - View user statistics and progress

3. **Payment Management**
   - View all transactions in Payments dashboard
   - Process mentor commission transfers
   - Generate financial reports

### For Mentors

1. **Creating Courses**
   - Use familiar WordPress post editor
   - Add lessons with video, text, or quiz content
   - Set course pricing and enrollment limits
   - Track student progress and engagement

2. **Student Management**
   - View enrolled students
   - Send messages to students
   - Grade assignments manually
   - Monitor course performance

3. **Earnings**
   - View commission earnings
   - Request payouts to bank account
   - Track payment history

### For Students

1. **Enrolling in Courses**
   - Browse course catalog
   - Pay via Paystack (Nigerian payment methods)
   - Access course content immediately after payment

2. **Learning Experience**
   - Track progress through course dashboard
   - Take quizzes and submit assignments
   - Communicate with mentors
   - Download certificates upon completion

## Shortcodes

The plugin provides several shortcodes for displaying LMS content:

### Course Display
```php
// Display course catalog
[codelab_courses category="programming" limit="6"]

// Show single course information
[codelab_course_info id="123"]

// Display enrollment button
[codelab_enroll_button course_id="123"]
```

### Dashboards
```php
// Student dashboard
[codelab_student_dashboard]

// Mentor dashboard  
[codelab_mentor_dashboard]

// User's enrolled courses
[codelab_my_courses]
```

### Other Features
```php
// Course search form
[codelab_course_search]

// Course progress bar
[codelab_course_progress course_id="123"]

// User certificates
[codelab_certificates]
```

## API Endpoints

The plugin extends WordPress REST API with LMS-specific endpoints:

### Public Endpoints
- `GET /wp-json/codelab-lms/v1/courses` - Get course list
- `GET /wp-json/codelab-lms/v1/courses/{id}` - Get single course
- `POST /wp-json/codelab-lms/v1/enroll` - Enroll in course

### Authenticated Endpoints
- `GET /wp-json/codelab-lms/v1/my-courses` - User's enrolled courses
- `GET /wp-json/codelab-lms/v1/progress/{course_id}` - Course progress
- `POST /wp-json/codelab-lms/v1/lessons/{id}/complete` - Mark lesson complete

## Customization

### Theme Integration

The plugin includes template files that can be overridden in your theme:

```
your-theme/
├── codelab-lms/
│   ├── single-course.php        # Single course page
│   ├── archive-courses.php      # Course catalog
│   ├── single-lesson.php        # Individual lesson
│   └── dashboard.php            # User dashboard
```

### Custom CSS

Add custom styles to your theme:

```css
/* Override course card styling */
.course-card {
    border-radius: 8px;
    /* Your custom styles */
}

/* Customize enrollment button */
.codelab-enroll-button {
    background-color: your-brand-color;
    /* Your custom styles */
}
```

### Hooks and Filters

The plugin provides numerous hooks for customization:

```php
// After successful enrollment
add_action('codelab_lms_user_enrolled', 'my_enrollment_handler', 10, 3);

// After course completion
add_action('codelab_lms_course_completed', 'my_completion_handler', 10, 2);

// Modify course price display
add_filter('codelab_lms_course_price', 'my_price_filter', 10, 2);
```

## Database Schema

The plugin creates these database tables:

- `wp_codelab_lms_enrollments` - Course enrollments and progress
- `wp_codelab_lms_lesson_progress` - Individual lesson completion
- `wp_codelab_lms_quizzes` - Quiz definitions
- `wp_codelab_lms_quiz_questions` - Quiz questions
- `wp_codelab_lms_quiz_attempts` - Student quiz attempts
- `wp_codelab_lms_messages` - Internal messaging system
- `wp_codelab_lms_commissions` - Mentor commission tracking
- `wp_codelab_lms_certificates` - Generated certificates
- `wp_codelab_lms_payments` - Payment transaction logs

## Performance Optimization

### Caching Strategy
- WordPress object caching for course data
- Database query optimization for large datasets
- Lazy loading for course content and images
- CDN integration support

### Database Optimization
- Proper indexing on foreign keys
- Pagination for large course listings
- Efficient progress tracking queries

## Security Features

### Data Protection
- WordPress nonce verification for all forms
- Capability checks for all user actions
- SQL injection prevention through prepared statements
- XSS protection through data sanitization

### Payment Security
- PCI compliance through Paystack integration
- Encrypted payment data storage
- Audit logs for all financial transactions
- Fraud detection through Paystack

## Troubleshooting

### Common Issues

**Payment Not Working**
- Verify Paystack API keys are correct
- Check if keys are for the right environment (test vs live)
- Ensure WordPress site URL is accessible to Paystack webhooks

**Courses Not Displaying**
- Check if user has proper permissions
- Verify course is published and has content
- Clear any caching plugins

**Emails Not Sending**
- Verify WordPress email configuration
- Check if email notifications are enabled in settings
- Test with WordPress default email functionality

### Debug Mode

Enable debug mode in wp-config.php:
```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
```

Check debug.log for LMS-related errors.

### Support

For technical support:
1. Check plugin documentation and FAQ
2. Search WordPress.org support forums
3. Contact plugin developers through official channels

## Contributing

We welcome contributions to improve the plugin:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

Please follow WordPress coding standards and include tests for new features.

## License

This plugin is licensed under GPL v2 or later.

## Changelog

### Version 1.0.0
- Initial release
- Complete LMS functionality
- Paystack payment integration
- Nigerian market optimizations
- User role management
- Course creation and management
- Quiz and assignment system
- Commission tracking system
- Mobile-responsive design

---

**Codelab Educare LMS** - Empowering education in Nigeria through technology.