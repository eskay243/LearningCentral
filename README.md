# Codelab Educare LMS - Complete Learning Management System

A comprehensive Learning Management System built with React/Node.js and available as a WordPress plugin, optimized for the Nigerian education market with integrated Paystack payments and automated mentor commissions.

## 🎓 Project Overview

Codelab Educare LMS is a full-featured educational platform designed specifically for the Nigerian market. It provides a complete learning ecosystem with course management, student enrollment, payment processing, and mentor compensation systems.

### Key Features

- **Complete Course Management**: Course creation, lesson organization, progress tracking
- **Nigerian Payment Integration**: Paystack for local payment methods (cards, bank transfers, USSD)
- **Automated Commission System**: 37% mentor payouts with Paystack transfers
- **Multi-Role System**: Students, Mentors, and Administrators with role-based access
- **Assessment Engine**: Quizzes with multiple question types and automated grading
- **Certificate Generation**: Automated PDF certificates upon course completion
- **Real-time Communication**: Student-mentor messaging system
- **Mobile-Responsive**: Optimized for desktop and mobile devices

## 🚀 Deployment Options

### 1. Full-Stack Application (Current)
- **Frontend**: React with TypeScript and Vite
- **Backend**: Node.js with Express and PostgreSQL
- **Database**: PostgreSQL with Drizzle ORM
- **Deployment**: Docker containers with Nginx reverse proxy

### 2. WordPress Plugin
- **Integration**: Native WordPress plugin with custom post types
- **User Management**: Extended WordPress roles (LMS Student, LMS Mentor)
- **Admin Interface**: WordPress-native administration
- **Theme Compatibility**: Template override system

## 📁 Project Structure

```
├── client/                     # React frontend application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page components
│   │   ├── lib/                # Utilities and API clients
│   │   └── hooks/              # Custom React hooks
│   └── public/                 # Static assets
├── server/                     # Node.js backend
│   ├── routes.ts               # API route definitions
│   ├── storage.ts              # Database operations
│   └── db.ts                   # Database connection
├── shared/                     # Shared TypeScript definitions
│   └── schema.ts               # Database schema and types
├── wordpress-plugin/           # WordPress plugin version
│   ├── includes/               # Core plugin functionality
│   ├── admin/                  # WordPress admin interface
│   ├── public/                 # Frontend assets
│   └── templates/              # Theme templates
└── docs/                       # Documentation
```

## 🛠 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for development and building
- **TailwindCSS** for styling
- **Radix UI** for accessible components
- **TanStack Query** for data fetching
- **React Hook Form** for form management

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **PostgreSQL** with Drizzle ORM
- **Express Session** for authentication
- **Multer** for file uploads
- **Paystack API** for payments

### WordPress Plugin
- **WordPress 5.0+** compatibility
- **Custom Post Types** for courses and lessons
- **WordPress REST API** extensions
- **Native WordPress admin** integration

## 🔧 Installation & Setup

### Full-Stack Application

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd codelab-educare-lms
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Configure database and Paystack credentials
   ```

4. **Initialize database**
   ```bash
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

### WordPress Plugin

1. **Upload plugin files**
   ```bash
   # Upload wordpress-plugin/ folder to /wp-content/plugins/codelab-educare-lms/
   ```

2. **Activate plugin**
   - Go to WordPress Admin → Plugins
   - Find "Codelab Educare LMS" and click "Activate"

3. **Configure settings**
   - Go to Codelab LMS → Settings
   - Add Paystack API keys
   - Configure commission rates

## 🎯 User Roles & Permissions

### Students
- Course enrollment and payment
- Progress tracking and analytics
- Quiz taking and assignment submission
- Certificate downloads
- Mentor communication

### Mentors
- Course creation and management
- Student progress monitoring
- Assignment grading and feedback
- Commission tracking and withdrawals
- Revenue analytics

### Administrators
- Full system management
- User role assignment
- Payment oversight
- System configuration
- Analytics and reporting

## 💰 Payment & Commission System

### Paystack Integration
- **Supported Methods**: Cards, Bank Transfer, USSD, Mobile Money
- **Currency**: Nigerian Naira (NGN) primary, USD/GBP support
- **Security**: PCI-compliant payment processing
- **Webhooks**: Real-time payment verification

### Commission Structure
- **Mentor Commission**: 37% of course price
- **Automated Payouts**: Direct bank transfers via Paystack
- **Tracking**: Complete transaction history
- **Withdrawal**: On-demand payout requests

## 📊 Analytics & Reporting

### Student Analytics
- Course completion rates
- Time spent learning
- Quiz performance
- Certificate achievements

### Mentor Analytics
- Course enrollment metrics
- Revenue tracking
- Student engagement
- Commission earnings

### Admin Analytics
- Platform-wide metrics
- Revenue reporting
- User activity
- Course performance

## 🔐 Security Features

### Authentication
- Session-based authentication
- Role-based access control
- Password encryption
- Secure cookie handling

### Payment Security
- PCI-compliant processing
- Encrypted transaction data
- Fraud detection
- Audit logging

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection

## 🌍 Nigerian Market Optimization

### Payment Methods
- **Paystack Integration**: Leading Nigerian payment gateway
- **Local Banks**: Direct bank transfer support
- **USSD Payments**: Mobile banking integration
- **Card Support**: Mastercard, Visa, Verve

### Currency & Pricing
- **Primary Currency**: Nigerian Naira (₦)
- **Flexible Pricing**: Course-specific pricing
- **Commission Structure**: Transparent mentor payouts
- **Tax Compliance**: Nigerian tax considerations

## 📱 Mobile Optimization

### Responsive Design
- Mobile-first CSS approach
- Touch-friendly interfaces
- Optimized loading times
- Progressive Web App features

### Mobile Features
- Offline content access
- Push notifications
- Touch gestures
- Mobile payment integration

## 🔄 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/user` - Get current user

### Course Management
- `GET /api/courses` - List courses
- `POST /api/courses` - Create course
- `GET /api/courses/:id` - Get course details
- `PUT /api/courses/:id` - Update course

### Student Endpoints
- `POST /api/student/enroll` - Enroll in course
- `GET /api/student/courses` - Get enrolled courses
- `POST /api/student/progress` - Update progress

### Payment Endpoints
- `POST /api/payments/initialize` - Initialize payment
- `POST /api/payments/verify` - Verify payment
- `GET /api/payments/history` - Payment history

## 🧪 Testing

### Development Testing
```bash
npm run test          # Run unit tests
npm run test:e2e      # Run end-to-end tests
npm run test:coverage # Generate coverage report
```

### WordPress Plugin Testing
- WordPress unit tests
- Plugin compatibility testing
- Payment integration testing
- User role functionality testing

## 📚 Documentation

### Available Documentation
- [API Documentation](./docs/api.md)
- [WordPress Plugin Guide](./wordpress-plugin/README.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Contributing Guidelines](./CONTRIBUTING.md)

### Implementation Guides
- [Paystack Integration](./docs/paystack-integration.md)
- [User Role Management](./docs/user-roles.md)
- [Course Creation](./docs/course-creation.md)
- [Mobile Optimization](./docs/mobile-optimization.md)

## 🚀 Production Deployment

### Docker Deployment
```bash
# Build and deploy with Docker
docker-compose up -d

# Or use production deployment script
./production-deploy.sh
```

### Requirements
- **Server**: Ubuntu 20.04+ or similar
- **Memory**: 2GB RAM minimum
- **Storage**: 20GB SSD minimum
- **Database**: PostgreSQL 12+
- **Node.js**: 18.0+

### Environment Variables
```env
DATABASE_URL=postgresql://user:password@localhost:5432/codelab_lms
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key
PAYSTACK_SECRET_KEY=sk_test_your_secret_key
SESSION_SECRET=your_session_secret
NODE_ENV=production
```

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

### Code Standards
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Commit message conventions

### Areas for Contribution
- New payment gateway integrations
- Additional language support
- Enhanced mobile features
- Performance optimizations

## 📞 Support

### Getting Help
- **Documentation**: Check docs/ folder
- **Issues**: GitHub Issues tracker
- **Discussions**: GitHub Discussions
- **Email**: support@codelab.educare

### Common Issues
- Payment integration setup
- Database connection problems
- WordPress plugin conflicts
- Mobile responsiveness issues

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

### Technologies Used
- React and TypeScript ecosystem
- WordPress and PHP community
- Paystack for payment processing
- Nigerian education technology sector

### Contributors
- Core development team
- Beta testers and early adopters
- Nigerian education community feedback
- Open source contributors

---

## 📈 Project Status

**Current Version**: 1.0.0  
**Status**: Production Ready  
**Last Updated**: January 2025  
**Market**: Nigerian Education Technology  

### Recent Updates
- Complete WordPress plugin implementation
- Enhanced mobile responsiveness
- Improved payment security
- Nigerian market optimizations
- Production deployment automation

### Roadmap
- Multi-language support
- Advanced analytics dashboard
- Mobile app development
- Additional payment gateways
- Enterprise features

---

**Codelab Educare LMS** - Empowering Nigerian education through innovative technology solutions.