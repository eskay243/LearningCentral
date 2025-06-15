import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  FileText, 
  CreditCard, 
  GraduationCap, 
  BookOpen,
  Shield,
  CheckCircle,
  AlertCircle,
  Upload,
  Calendar,
  Phone,
  MapPin,
  Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const studentKycSchema = z.object({
  // Personal Information
  fullName: z.string().min(2, 'Full name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  nationality: z.string().min(1, 'Nationality is required'),
  phoneNumber: z.string().min(10, 'Valid phone number is required'),
  alternateEmail: z.string().email('Valid email is required').optional().or(z.literal('')),
  gender: z.string().min(1, 'Gender is required'),
  
  // Address Information
  streetAddress: z.string().min(5, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  postalCode: z.string().min(3, 'Postal code is required'),
  country: z.string().min(2, 'Country is required'),
  
  // Identification
  idType: z.string().min(1, 'ID type is required'),
  idNumber: z.string().min(5, 'ID number is required'),
  idExpiryDate: z.string().min(1, 'ID expiry date is required'),
  
  // Student Information
  studentId: z.string().optional().or(z.literal('')),
  currentInstitution: z.string().min(2, 'Current institution is required'),
  courseOfStudy: z.string().min(2, 'Course of study is required'),
  graduationYear: z.number().min(2020, 'Valid graduation year is required'),
  learningGoals: z.string().min(20, 'Please describe your learning goals (minimum 20 characters)'),
  technicalBackground: z.string().min(10, 'Please describe your technical background'),
  preferredLearningStyle: z.string().min(1, 'Please select your preferred learning style'),
  
  // Guardian Information (for minors)
  parentGuardianName: z.string().optional().or(z.literal('')),
  parentGuardianPhone: z.string().optional().or(z.literal('')),
  parentGuardianEmail: z.string().email('Valid guardian email is required').optional().or(z.literal('')),
  
  // Payment Information (simplified for students)
  bankName: z.string().optional().or(z.literal('')),
  accountNumber: z.string().optional().or(z.literal('')),
  accountName: z.string().optional().or(z.literal('')),
  
  // Legal Compliance
  termsAccepted: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
  privacyPolicyAccepted: z.boolean().refine(val => val === true, 'You must accept the privacy policy'),
  dataProcessingConsent: z.boolean().refine(val => val === true, 'You must consent to data processing'),
  marketingConsent: z.boolean().optional(),
});

type StudentKycFormData = z.infer<typeof studentKycSchema>;

export default function StudentKycPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<{[key: string]: File}>({});
  const [isMinor, setIsMinor] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const form = useForm<StudentKycFormData>({
    resolver: zodResolver(studentKycSchema),
    defaultValues: {
      termsAccepted: false,
      privacyPolicyAccepted: false,
      dataProcessingConsent: false,
      marketingConsent: false,
    },
  });

  // Check if user is a minor based on date of birth
  const checkIfMinor = (dateOfBirth: string) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1 < 18;
    }
    return age < 18;
  };

  const submitKycMutation = useMutation({
    mutationFn: async (data: StudentKycFormData) => {
      const formData = new FormData();
      
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          formData.append(key, String(value));
        }
      });
      
      Object.entries(uploadedFiles).forEach(([key, file]) => {
        formData.append(key, file);
      });
      
      formData.append('userRole', 'student');
      
      const response = await fetch('/api/kyc/submit', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit KYC application');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "KYC Application Submitted",
        description: "Your KYC application has been submitted successfully and is under review.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (fieldName: string, file: File) => {
    setUploadedFiles(prev => ({
      ...prev,
      [fieldName]: file
    }));
  };

  const onSubmit = (data: StudentKycFormData) => {
    const requiredFiles = ['idFrontImage', 'profilePhoto'];
    const missingFiles = requiredFiles.filter(file => !uploadedFiles[file]);
    
    if (missingFiles.length > 0) {
      toast({
        title: "Missing Documents",
        description: `Please upload: ${missingFiles.join(', ')}`,
        variant: "destructive",
      });
      return;
    }
    
    if (isMinor && (!data.parentGuardianName || !data.parentGuardianPhone || !data.parentGuardianEmail)) {
      toast({
        title: "Guardian Information Required",
        description: "Parent/Guardian information is required for users under 18 years old.",
        variant: "destructive",
      });
      return;
    }
    
    submitKycMutation.mutate(data);
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const FileUploadField = ({ fieldName, label, required = false }: { fieldName: string; label: string; required?: boolean }) => (
    <div className="space-y-2">
      <Label htmlFor={fieldName}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
        <input
          id={fieldName}
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFileUpload(fieldName, e.target.files[0]);
            }
          }}
          className="hidden"
        />
        <label htmlFor={fieldName} className="cursor-pointer">
          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600">
            {uploadedFiles[fieldName] ? (
              <span className="text-green-600 flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4" />
                {uploadedFiles[fieldName].name}
              </span>
            ) : (
              'Click to upload or drag and drop'
            )}
          </p>
          <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
        </label>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Student KYC Verification</h1>
        <p className="text-muted-foreground">
          Complete your Know Your Customer verification to access all learning features and secure payments.
        </p>
        
        <div className="mt-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    {...form.register('fullName')}
                    placeholder="Enter your full name"
                  />
                  {form.formState.errors.fullName && (
                    <p className="text-sm text-red-500">{form.formState.errors.fullName.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...form.register('dateOfBirth')}
                    onChange={(e) => {
                      form.register('dateOfBirth').onChange(e);
                      setIsMinor(checkIfMinor(e.target.value));
                    }}
                  />
                  {form.formState.errors.dateOfBirth && (
                    <p className="text-sm text-red-500">{form.formState.errors.dateOfBirth.message}</p>
                  )}
                  {isMinor && (
                    <p className="text-sm text-amber-600 mt-1">
                      Guardian information will be required as you are under 18 years old.
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="nationality">Nationality *</Label>
                  <Select onValueChange={(value) => form.setValue('nationality', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select nationality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nigerian">Nigerian</SelectItem>
                      <SelectItem value="american">American</SelectItem>
                      <SelectItem value="british">British</SelectItem>
                      <SelectItem value="canadian">Canadian</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.nationality && (
                    <p className="text-sm text-red-500">{form.formState.errors.nationality.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    {...form.register('phoneNumber')}
                    placeholder="+234 XXX XXX XXXX"
                  />
                  {form.formState.errors.phoneNumber && (
                    <p className="text-sm text-red-500">{form.formState.errors.phoneNumber.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="alternateEmail">Alternate Email</Label>
                  <Input
                    id="alternateEmail"
                    type="email"
                    {...form.register('alternateEmail')}
                    placeholder="alternate@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="gender">Gender *</Label>
                  <Select onValueChange={(value) => form.setValue('gender', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.gender && (
                    <p className="text-sm text-red-500">{form.formState.errors.gender.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Address Information */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="streetAddress">Street Address *</Label>
                <Input
                  id="streetAddress"
                  {...form.register('streetAddress')}
                  placeholder="Enter your street address"
                />
                {form.formState.errors.streetAddress && (
                  <p className="text-sm text-red-500">{form.formState.errors.streetAddress.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    {...form.register('city')}
                    placeholder="Enter your city"
                  />
                  {form.formState.errors.city && (
                    <p className="text-sm text-red-500">{form.formState.errors.city.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    {...form.register('state')}
                    placeholder="Enter your state"
                  />
                  {form.formState.errors.state && (
                    <p className="text-sm text-red-500">{form.formState.errors.state.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="postalCode">Postal Code *</Label>
                  <Input
                    id="postalCode"
                    {...form.register('postalCode')}
                    placeholder="Enter postal code"
                  />
                  {form.formState.errors.postalCode && (
                    <p className="text-sm text-red-500">{form.formState.errors.postalCode.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Select onValueChange={(value) => form.setValue('country', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nigeria">Nigeria</SelectItem>
                      <SelectItem value="usa">United States</SelectItem>
                      <SelectItem value="uk">United Kingdom</SelectItem>
                      <SelectItem value="canada">Canada</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.country && (
                    <p className="text-sm text-red-500">{form.formState.errors.country.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Identification & Documents */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Identification Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="idType">ID Type *</Label>
                  <Select onValueChange={(value) => form.setValue('idType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ID type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="passport">International Passport</SelectItem>
                      <SelectItem value="drivers_license">Driver's License</SelectItem>
                      <SelectItem value="national_id">National ID Card</SelectItem>
                      <SelectItem value="voters_card">Voter's Card</SelectItem>
                      <SelectItem value="student_id">Student ID</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.idType && (
                    <p className="text-sm text-red-500">{form.formState.errors.idType.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="idNumber">ID Number *</Label>
                  <Input
                    id="idNumber"
                    {...form.register('idNumber')}
                    placeholder="Enter ID number"
                  />
                  {form.formState.errors.idNumber && (
                    <p className="text-sm text-red-500">{form.formState.errors.idNumber.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="idExpiryDate">ID Expiry Date *</Label>
                  <Input
                    id="idExpiryDate"
                    type="date"
                    {...form.register('idExpiryDate')}
                  />
                  {form.formState.errors.idExpiryDate && (
                    <p className="text-sm text-red-500">{form.formState.errors.idExpiryDate.message}</p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FileUploadField fieldName="idFrontImage" label="ID Front Image" required />
                <FileUploadField fieldName="profilePhoto" label="Profile Photo" required />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Academic & Learning Information */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Academic & Learning Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="studentId">Student ID (Optional)</Label>
                  <Input
                    id="studentId"
                    {...form.register('studentId')}
                    placeholder="Your institutional student ID"
                  />
                </div>

                <div>
                  <Label htmlFor="currentInstitution">Current Institution *</Label>
                  <Input
                    id="currentInstitution"
                    {...form.register('currentInstitution')}
                    placeholder="University, College, or School name"
                  />
                  {form.formState.errors.currentInstitution && (
                    <p className="text-sm text-red-500">{form.formState.errors.currentInstitution.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="courseOfStudy">Course of Study *</Label>
                  <Input
                    id="courseOfStudy"
                    {...form.register('courseOfStudy')}
                    placeholder="e.g., Computer Science, Engineering"
                  />
                  {form.formState.errors.courseOfStudy && (
                    <p className="text-sm text-red-500">{form.formState.errors.courseOfStudy.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="graduationYear">Expected Graduation Year *</Label>
                  <Input
                    id="graduationYear"
                    type="number"
                    {...form.register('graduationYear', { valueAsNumber: true })}
                    placeholder="2025"
                    min="2020"
                    max="2030"
                  />
                  {form.formState.errors.graduationYear && (
                    <p className="text-sm text-red-500">{form.formState.errors.graduationYear.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="preferredLearningStyle">Preferred Learning Style *</Label>
                  <Select onValueChange={(value) => form.setValue('preferredLearningStyle', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select learning style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visual">Visual (diagrams, videos)</SelectItem>
                      <SelectItem value="auditory">Auditory (lectures, discussions)</SelectItem>
                      <SelectItem value="kinesthetic">Hands-on (practice, exercises)</SelectItem>
                      <SelectItem value="mixed">Mixed approach</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.preferredLearningStyle && (
                    <p className="text-sm text-red-500">{form.formState.errors.preferredLearningStyle.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="learningGoals">Learning Goals *</Label>
                <Textarea
                  id="learningGoals"
                  {...form.register('learningGoals')}
                  placeholder="Describe what you want to achieve through this platform..."
                  className="min-h-[80px]"
                />
                {form.formState.errors.learningGoals && (
                  <p className="text-sm text-red-500">{form.formState.errors.learningGoals.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="technicalBackground">Technical Background *</Label>
                <Textarea
                  id="technicalBackground"
                  {...form.register('technicalBackground')}
                  placeholder="Describe your current technical skills and experience..."
                  className="min-h-[80px]"
                />
                {form.formState.errors.technicalBackground && (
                  <p className="text-sm text-red-500">{form.formState.errors.technicalBackground.message}</p>
                )}
              </div>

              {/* Guardian Information for Minors */}
              {isMinor && (
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <h4 className="font-medium text-amber-900 mb-3">Parent/Guardian Information (Required for minors)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="parentGuardianName">Guardian Name *</Label>
                      <Input
                        id="parentGuardianName"
                        {...form.register('parentGuardianName')}
                        placeholder="Full name of parent/guardian"
                      />
                    </div>

                    <div>
                      <Label htmlFor="parentGuardianPhone">Guardian Phone *</Label>
                      <Input
                        id="parentGuardianPhone"
                        {...form.register('parentGuardianPhone')}
                        placeholder="+234 XXX XXX XXXX"
                      />
                    </div>

                    <div>
                      <Label htmlFor="parentGuardianEmail">Guardian Email *</Label>
                      <Input
                        id="parentGuardianEmail"
                        type="email"
                        {...form.register('parentGuardianEmail')}
                        placeholder="guardian@example.com"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Optional Payment Information */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-3">Payment Information (Optional)</h4>
                <p className="text-sm text-blue-700 mb-3">
                  You can add this information later when making payments. This is optional for now.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      {...form.register('bankName')}
                      placeholder="Your bank name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      {...form.register('accountNumber')}
                      placeholder="Your account number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="accountName">Account Name</Label>
                    <Input
                      id="accountName"
                      {...form.register('accountName')}
                      placeholder="Account holder name"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Legal & Compliance */}
        {currentStep === 5 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Legal & Compliance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="termsAccepted"
                    checked={form.watch('termsAccepted')}
                    onCheckedChange={(checked) => form.setValue('termsAccepted', checked as boolean)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="termsAccepted" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      I accept the Terms and Conditions *
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      You agree to our Terms of Service and Student Agreement.
                    </p>
                  </div>
                </div>
                {form.formState.errors.termsAccepted && (
                  <p className="text-sm text-red-500">{form.formState.errors.termsAccepted.message}</p>
                )}

                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="privacyPolicyAccepted"
                    checked={form.watch('privacyPolicyAccepted')}
                    onCheckedChange={(checked) => form.setValue('privacyPolicyAccepted', checked as boolean)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="privacyPolicyAccepted" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      I accept the Privacy Policy *
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      You acknowledge that you have read and understand our Privacy Policy.
                    </p>
                  </div>
                </div>
                {form.formState.errors.privacyPolicyAccepted && (
                  <p className="text-sm text-red-500">{form.formState.errors.privacyPolicyAccepted.message}</p>
                )}

                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="dataProcessingConsent"
                    checked={form.watch('dataProcessingConsent')}
                    onCheckedChange={(checked) => form.setValue('dataProcessingConsent', checked as boolean)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="dataProcessingConsent" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      I consent to data processing *
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      You consent to the processing of your personal data for educational and verification purposes.
                    </p>
                  </div>
                </div>
                {form.formState.errors.dataProcessingConsent && (
                  <p className="text-sm text-red-500">{form.formState.errors.dataProcessingConsent.message}</p>
                )}

                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="marketingConsent"
                    checked={form.watch('marketingConsent') || false}
                    onCheckedChange={(checked) => form.setValue('marketingConsent', checked as boolean)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="marketingConsent" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      I consent to educational content and course notifications (Optional)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      You agree to receive course recommendations and educational content updates.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900">Student Benefits</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Once verified, you'll have access to all courses, mentorship programs, secure payments, 
                      progress tracking, and certificates. Your verification typically takes 1-2 business days.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          
          {currentStep < totalSteps ? (
            <Button type="button" onClick={nextStep}>
              Next
            </Button>
          ) : (
            <Button 
              type="submit" 
              disabled={submitKycMutation.isPending}
            >
              {submitKycMutation.isPending ? 'Submitting...' : 'Submit KYC Application'}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}