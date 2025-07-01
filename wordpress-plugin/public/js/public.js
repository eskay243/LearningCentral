/**
 * Codelab LMS Public JavaScript
 * Handles frontend interactions for the LMS
 */

(function($) {
    'use strict';

    // Initialize when DOM is ready
    $(document).ready(function() {
        initializePaymentButtons();
        initializeCoursePlayer();
        initializeMessageSystem();
        initializeQuizSystem();
        initializeLessonNavigation();
    });

    /**
     * Initialize payment buttons
     */
    function initializePaymentButtons() {
        $('.codelab-enroll-button').on('click', function(e) {
            e.preventDefault();
            
            const courseId = $(this).data('course-id');
            const isPaid = $(this).text().includes('₦');
            
            if (isPaid) {
                initializePayment(courseId);
            } else {
                enrollFree(courseId);
            }
        });
    }

    /**
     * Initialize Paystack payment
     */
    window.initializePayment = function(courseId) {
        if (!codelab_lms.paystack_public_key) {
            showNotification('Payment gateway not configured', 'error');
            return;
        }

        showLoader('Initializing payment...');

        $.ajax({
            url: codelab_lms.ajax_url,
            type: 'POST',
            data: {
                action: 'codelab_lms_initialize_payment',
                course_id: courseId,
                nonce: codelab_lms.nonce
            },
            success: function(response) {
                hideLoader();
                
                if (response.success) {
                    // Initialize Paystack payment
                    const handler = PaystackPop.setup({
                        key: codelab_lms.paystack_public_key,
                        email: '', // Will be filled by Paystack
                        amount: 0, // Will be filled by Paystack
                        ref: response.data.reference,
                        onClose: function() {
                            showNotification('Payment cancelled', 'warning');
                        },
                        callback: function(response) {
                            verifyPayment(response.reference);
                        }
                    });
                    
                    // Redirect to Paystack payment page
                    window.location.href = response.data.authorization_url;
                } else {
                    showNotification(response.data.message, 'error');
                }
            },
            error: function() {
                hideLoader();
                showNotification(codelab_lms.strings.error, 'error');
            }
        });
    };

    /**
     * Verify payment
     */
    function verifyPayment(reference) {
        showLoader('Verifying payment...');

        $.ajax({
            url: codelab_lms.ajax_url,
            type: 'POST',
            data: {
                action: 'codelab_lms_verify_payment',
                reference: reference,
                nonce: codelab_lms.nonce
            },
            success: function(response) {
                hideLoader();
                
                if (response.success) {
                    showNotification(response.data.message, 'success');
                    // Reload page to show enrollment status
                    setTimeout(function() {
                        window.location.reload();
                    }, 2000);
                } else {
                    showNotification(response.data.message, 'error');
                }
            },
            error: function() {
                hideLoader();
                showNotification(codelab_lms.strings.error, 'error');
            }
        });
    }

    /**
     * Enroll in free course
     */
    window.enrollFree = function(courseId) {
        if (!confirm(codelab_lms.strings.confirm_enrollment)) {
            return;
        }

        showLoader('Enrolling...');

        $.ajax({
            url: codelab_lms.ajax_url,
            type: 'POST',
            data: {
                action: 'codelab_lms_enroll_free',
                course_id: courseId,
                nonce: codelab_lms.nonce
            },
            success: function(response) {
                hideLoader();
                
                if (response.success) {
                    showNotification(response.data.message, 'success');
                    
                    if (response.data.redirect_url) {
                        setTimeout(function() {
                            window.location.href = response.data.redirect_url;
                        }, 1500);
                    } else {
                        setTimeout(function() {
                            window.location.reload();
                        }, 1500);
                    }
                } else {
                    showNotification(response.data.message, 'error');
                }
            },
            error: function() {
                hideLoader();
                showNotification(codelab_lms.strings.error, 'error');
            }
        });
    };

    /**
     * Initialize course player
     */
    function initializeCoursePlayer() {
        const $coursePlayer = $('.codelab-course-player');
        if ($coursePlayer.length === 0) return;

        // Mark lesson complete button
        $('.mark-lesson-complete').on('click', function(e) {
            e.preventDefault();
            
            const lessonId = $(this).data('lesson-id');
            markLessonComplete(lessonId);
        });

        // Lesson navigation
        $('.lesson-nav-item').on('click', function(e) {
            e.preventDefault();
            
            const lessonId = $(this).data('lesson-id');
            loadLessonContent(lessonId);
            
            // Update active state
            $('.lesson-nav-item').removeClass('active');
            $(this).addClass('active');
        });

        // Auto-track video progress
        $('video').on('ended', function() {
            const lessonId = $(this).data('lesson-id');
            if (lessonId) {
                markLessonComplete(lessonId);
            }
        });
    }

    /**
     * Mark lesson as complete
     */
    function markLessonComplete(lessonId) {
        $.ajax({
            url: codelab_lms.ajax_url,
            type: 'POST',
            data: {
                action: 'codelab_lms_mark_lesson_complete',
                lesson_id: lessonId,
                nonce: codelab_lms.nonce
            },
            success: function(response) {
                if (response.success) {
                    showNotification(response.data.message, 'success');
                    
                    // Update progress bar
                    updateProgressBar(response.data.progress_percentage);
                    
                    // Mark lesson as completed in UI
                    $('.lesson-nav-item[data-lesson-id="' + lessonId + '"]')
                        .addClass('completed')
                        .find('.lesson-status')
                        .html('<span class="dashicons dashicons-yes-alt"></span>');
                    
                    // Show next lesson button if available
                    if (response.data.next_lesson_url) {
                        showNextLessonButton(response.data.next_lesson_url, response.data.next_lesson_title);
                    }
                    
                    // Show completion message if course is completed
                    if (response.data.course_completed) {
                        showCourseCompletionMessage(response.data.completion_message);
                    }
                } else {
                    showNotification(response.data.message, 'error');
                }
            },
            error: function() {
                showNotification(codelab_lms.strings.error, 'error');
            }
        });
    }

    /**
     * Load lesson content
     */
    function loadLessonContent(lessonId) {
        showLoader('Loading lesson...');

        $.ajax({
            url: codelab_lms.ajax_url,
            type: 'POST',
            data: {
                action: 'codelab_lms_load_lesson_content',
                lesson_id: lessonId,
                nonce: codelab_lms.nonce
            },
            success: function(response) {
                hideLoader();
                
                if (response.success) {
                    const data = response.data;
                    
                    // Update lesson content
                    $('.lesson-title').text(data.title);
                    $('.lesson-content').html(data.content);
                    
                    // Handle video content
                    if (data.lesson_type === 'video' && data.video_url) {
                        displayVideoPlayer(data.video_url);
                    }
                    
                    // Update completion button
                    $('.mark-lesson-complete')
                        .data('lesson-id', lessonId)
                        .toggle(!data.is_completed);
                    
                    // Update navigation buttons
                    updateLessonNavigation(data.previous_lesson, data.next_lesson);
                    
                    // Update URL without page reload
                    if (history.pushState) {
                        const newUrl = window.location.pathname + '?lesson=' + lessonId;
                        history.pushState(null, null, newUrl);
                    }
                } else {
                    showNotification(response.data.message, 'error');
                }
            },
            error: function() {
                hideLoader();
                showNotification(codelab_lms.strings.error, 'error');
            }
        });
    }

    /**
     * Initialize message system
     */
    function initializeMessageSystem() {
        const $messageForm = $('#codelab-message-form');
        if ($messageForm.length === 0) return;

        $messageForm.on('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                action: 'codelab_lms_send_message',
                recipient_id: $('#message-recipient').val(),
                course_id: $('#message-course').val(),
                subject: $('#message-subject').val(),
                message: $('#message-content').val(),
                nonce: codelab_lms.nonce
            };

            if (!formData.recipient_id || !formData.subject || !formData.message) {
                showNotification('Please fill in all required fields', 'error');
                return;
            }

            showLoader('Sending message...');

            $.ajax({
                url: codelab_lms.ajax_url,
                type: 'POST',
                data: formData,
                success: function(response) {
                    hideLoader();
                    
                    if (response.success) {
                        showNotification(response.data.message, 'success');
                        $messageForm[0].reset();
                    } else {
                        showNotification(response.data.message, 'error');
                    }
                },
                error: function() {
                    hideLoader();
                    showNotification(codelab_lms.strings.error, 'error');
                }
            });
        });

        // Load messages
        loadMessages('inbox');
        
        // Message tabs
        $('.message-tab').on('click', function(e) {
            e.preventDefault();
            
            const type = $(this).data('type');
            $('.message-tab').removeClass('active');
            $(this).addClass('active');
            
            loadMessages(type);
        });
    }

    /**
     * Load messages
     */
    function loadMessages(type, page = 1) {
        $.ajax({
            url: codelab_lms.ajax_url,
            type: 'POST',
            data: {
                action: 'codelab_lms_get_messages',
                type: type,
                page: page,
                nonce: codelab_lms.nonce
            },
            success: function(response) {
                if (response.success) {
                    displayMessages(response.data.messages, type);
                    displayMessagesPagination(response.data, type);
                }
            },
            error: function() {
                showNotification(codelab_lms.strings.error, 'error');
            }
        });
    }

    /**
     * Initialize quiz system
     */
    function initializeQuizSystem() {
        const $quizForm = $('#codelab-quiz-form');
        if ($quizForm.length === 0) return;

        $quizForm.on('submit', function(e) {
            e.preventDefault();
            
            const quizId = $(this).data('quiz-id');
            const answers = {};
            
            // Collect answers
            $('input[name^="question_"], select[name^="question_"], textarea[name^="question_"]').each(function() {
                const questionId = $(this).attr('name').replace('question_', '');
                const value = $(this).val();
                
                if ($(this).attr('type') === 'radio' && !$(this).is(':checked')) {
                    return;
                }
                
                answers[questionId] = value;
            });

            showLoader('Submitting quiz...');

            $.ajax({
                url: codelab_lms.ajax_url,
                type: 'POST',
                data: {
                    action: 'codelab_lms_submit_quiz',
                    quiz_id: quizId,
                    answers: answers,
                    nonce: codelab_lms.nonce
                },
                success: function(response) {
                    hideLoader();
                    
                    if (response.success) {
                        displayQuizResults(response.data);
                    } else {
                        showNotification(response.data.message, 'error');
                    }
                },
                error: function() {
                    hideLoader();
                    showNotification(codelab_lms.strings.error, 'error');
                }
            });
        });

        // Quiz timer
        const $timer = $('.quiz-timer');
        if ($timer.length > 0) {
            const timeLimit = parseInt($timer.data('time-limit')) * 60; // Convert to seconds
            startQuizTimer(timeLimit);
        }
    }

    /**
     * Initialize lesson navigation
     */
    function initializeLessonNavigation() {
        $('.lesson-nav-button').on('click', function(e) {
            e.preventDefault();
            
            const url = $(this).attr('href');
            if (url) {
                window.location.href = url;
            }
        });
    }

    /**
     * Update progress bar
     */
    function updateProgressBar(percentage) {
        $('.course-progress-fill').css('width', percentage + '%');
        $('.course-progress-text').text(percentage + '% complete');
    }

    /**
     * Show next lesson button
     */
    function showNextLessonButton(url, title) {
        const nextButton = `
            <div class="next-lesson-prompt">
                <h4>Great job! Ready for the next lesson?</h4>
                <a href="${url}" class="button button-primary">${title}</a>
            </div>
        `;
        
        $('.lesson-content').append(nextButton);
    }

    /**
     * Show course completion message
     */
    function showCourseCompletionMessage(message) {
        const completionAlert = `
            <div class="course-completion-alert">
                <div class="completion-icon">🎉</div>
                <h3>${message}</h3>
                <p>Your certificate will be available in your dashboard shortly.</p>
            </div>
        `;
        
        $('.lesson-content').prepend(completionAlert);
    }

    /**
     * Display video player
     */
    function displayVideoPlayer(videoUrl) {
        let videoHtml = '';
        
        if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
            // Extract YouTube video ID
            const videoId = extractYouTubeId(videoUrl);
            videoHtml = `
                <div class="video-player">
                    <iframe width="100%" height="400" 
                        src="https://www.youtube.com/embed/${videoId}" 
                        frameborder="0" allowfullscreen>
                    </iframe>
                </div>
            `;
        } else if (videoUrl.includes('vimeo.com')) {
            // Extract Vimeo video ID
            const videoId = extractVimeoId(videoUrl);
            videoHtml = `
                <div class="video-player">
                    <iframe width="100%" height="400" 
                        src="https://player.vimeo.com/video/${videoId}" 
                        frameborder="0" allowfullscreen>
                    </iframe>
                </div>
            `;
        } else {
            // Direct video file
            videoHtml = `
                <div class="video-player">
                    <video width="100%" height="400" controls>
                        <source src="${videoUrl}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                </div>
            `;
        }
        
        $('.lesson-content').prepend(videoHtml);
    }

    /**
     * Update lesson navigation
     */
    function updateLessonNavigation(previousLesson, nextLesson) {
        const $prevButton = $('.lesson-nav-prev');
        const $nextButton = $('.lesson-nav-next');
        
        if (previousLesson) {
            $prevButton.attr('href', previousLesson.url).show();
        } else {
            $prevButton.hide();
        }
        
        if (nextLesson) {
            $nextButton.attr('href', nextLesson.url).show();
        } else {
            $nextButton.hide();
        }
    }

    /**
     * Display messages
     */
    function displayMessages(messages, type) {
        const $messagesList = $('.messages-list');
        let html = '';
        
        if (messages.length === 0) {
            html = '<p>No messages found.</p>';
        } else {
            messages.forEach(function(message) {
                const isUnread = type === 'inbox' && message.status === 'sent';
                html += `
                    <div class="message-item ${isUnread ? 'unread' : ''}">
                        <div class="message-header">
                            <strong>${message.subject}</strong>
                            <span class="message-meta">
                                ${type === 'inbox' ? 'From' : 'To'}: ${message.user_name} | 
                                ${formatDate(message.sent_date)}
                            </span>
                        </div>
                        <div class="message-preview">
                            ${message.message.substring(0, 100)}...
                        </div>
                        ${message.course_title ? `<div class="message-course">Course: ${message.course_title}</div>` : ''}
                    </div>
                `;
            });
        }
        
        $messagesList.html(html);
    }

    /**
     * Display quiz results
     */
    function displayQuizResults(results) {
        const resultsHtml = `
            <div class="quiz-results ${results.passed ? 'passed' : 'failed'}">
                <h3>${results.passed ? 'Congratulations!' : 'Quiz Not Passed'}</h3>
                <div class="results-summary">
                    <p><strong>Score:</strong> ${results.score} / ${results.max_score} (${results.percentage}%)</p>
                    <p><strong>Correct Answers:</strong> ${results.correct_answers} / ${results.total_questions}</p>
                    <p><strong>Required to Pass:</strong> ${results.pass_percentage}%</p>
                    <p><strong>Attempts Used:</strong> ${results.attempts_used} / ${results.max_attempts}</p>
                </div>
                <p class="results-message">${results.message}</p>
                ${!results.passed && results.attempts_used < results.max_attempts ? 
                    '<button type="button" onclick="location.reload()" class="button">Try Again</button>' : ''
                }
            </div>
        `;
        
        $('#codelab-quiz-form').html(resultsHtml);
    }

    /**
     * Start quiz timer
     */
    function startQuizTimer(timeLimit) {
        let timeRemaining = timeLimit;
        
        const timer = setInterval(function() {
            const minutes = Math.floor(timeRemaining / 60);
            const seconds = timeRemaining % 60;
            
            $('.quiz-timer').text(`Time remaining: ${minutes}:${seconds.toString().padStart(2, '0')}`);
            
            if (timeRemaining <= 0) {
                clearInterval(timer);
                $('#codelab-quiz-form').submit();
                showNotification('Time\'s up! Quiz submitted automatically.', 'warning');
            }
            
            timeRemaining--;
        }, 1000);
    }

    /**
     * Utility functions
     */
    function extractYouTubeId(url) {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
        return match ? match[1] : '';
    }

    function extractVimeoId(url) {
        const match = url.match(/vimeo\.com\/(\d+)/);
        return match ? match[1] : '';
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    function showLoader(message = 'Loading...') {
        if ($('.codelab-loader').length === 0) {
            $('body').append(`
                <div class="codelab-loader">
                    <div class="loader-content">
                        <div class="spinner"></div>
                        <p>${message}</p>
                    </div>
                </div>
            `);
        }
    }

    function hideLoader() {
        $('.codelab-loader').remove();
    }

    function showNotification(message, type = 'info') {
        const notification = `
            <div class="codelab-notification ${type}">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        $('body').append(notification);
        
        // Auto remove after 5 seconds
        setTimeout(function() {
            $('.codelab-notification').fadeOut(function() {
                $(this).remove();
            });
        }, 5000);
        
        // Manual close
        $('.notification-close').on('click', function() {
            $(this).parent().fadeOut(function() {
                $(this).remove();
            });
        });
    }

})(jQuery);