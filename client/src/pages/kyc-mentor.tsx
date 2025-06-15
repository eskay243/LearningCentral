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
  Building,
  Shield,
  CheckCircle,
  AlertCircle,
  Upload,
  Calendar,
  Phone,
  MapPin,
  Briefcase
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const mentorKycSchema = z.object({
  // Personal Information
  fullName: z.string().min(2, 'Full name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  nationality: z.string().min(1, 'Nationality is required'),
  phoneNumber: z.string().min(10, 'Valid phone number is required'),
  alternateEmail: z.string().email('Valid email is required').optional().or(z.literal('')),
  gender: z.string().min(1, 'Gender is required'),
  maritalStatus: z.string().min(1, 'Marital status is required'),
  
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
  
  // Financial Information
  bankName: z.string().min(2, 'Bank name is required'),
  accountNumber: z.string().min(10, 'Account number is required'),
  accountName: z.string().min(2, 'Account name is required'),
  bankCode: z.string().min(3, 'Bank code is required'),
  bvn: z.string().min(11, 'Valid BVN is required'),
  
  // Tax Information
  taxIdNumber: z.string().min(1, 'Tax ID is required'),
  taxIdType: z.string().min(1, 'Tax ID type is required'),
  
  // Education and Experience
  educationLevel: z.string().min(1, 'Education level is required'),
  educationField: z.string().min(2, 'Field of education is required'),
  yearsOfExperience: z.number().min(0, 'Years of experience is required'),
  currentEmployer: z.string().min(2, 'Current employer is required'),
  jobTitle: z.string().min(2, 'Job title is required'),
  
  // Professional Profiles
  linkedinProfile: z.string().url('Valid LinkedIn URL is required'),
  githubProfile: z.string().url('Valid GitHub URL is required').optional().or(z.literal('')),
  portfolioWebsite: z.string().url('Valid portfolio URL is required').optional().or(z.literal('')),
  
  // Teaching Experience
  teachingExperience: z.string().min(10, 'Teaching experience description is required'),
  previousMentoringExperience: z.string().min(10, 'Previous mentoring experience is required'),
  
  // Legal Compliance
  termsAccepted: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
  privacyPolicyAccepted: z.boolean().refine(val => val === true, 'You must accept the privacy policy'),
  dataProcessingConsent: z.boolean().refine(val => val === true, 'You must consent to data processing'),
  marketingConsent: z.boolean().optional(),
});

type MentorKycFormData = z.infer<typeof mentorKycSchema>;

export default function MentorKycPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<{[key: string]: File}>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const totalSteps = 6;
  const progress = (currentStep / totalSteps) * 100;

  const form = useForm<MentorKycFormData>({
    resolver: zodResolver(mentorKycSchema),
    defaultValues: {
      termsAccepted: false,
      privacyPolicyAccepted: false,
      dataProcessingConsent: false,
      marketingConsent: false,
    },
  });

  const submitKycMutation = useMutation({
    mutationFn: async (data: MentorKycFormData) => {
      // Create FormData for file uploads
      const formData = new FormData();
      
      // Add form data
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          formData.append(key, String(value));
        }
      });
      
      // Add uploaded files
      Object.entries(uploadedFiles).forEach(([key, file]) => {
        formData.append(key, file);
      });
      
      formData.append('userRole', 'mentor');
      
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

  const onSubmit = (data: MentorKycFormData) => {
    // Check if required files are uploaded
    const requiredFiles = ['idFrontImage', 'idBackImage', 'profilePhoto'];
    const missingFiles = requiredFiles.filter(file => !uploadedFiles[file]);
    
    if (missingFiles.length > 0) {
      toast({
        title: "Missing Documents",
        description: `Please upload: ${missingFiles.join(', ')}`,
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mentor KYC Verification</h1>
        <p className="text-muted-foreground">
          Complete your Know Your Customer verification to become a verified mentor on our platform.
        </p>
        
        {/* Progress Bar */}
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
                  />
                  {form.formState.errors.dateOfBirth && (
                    <p className="text-sm text-red-500">{form.formState.errors.dateOfBirth.message}</p>
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

                <div>
                  <Label htmlFor="maritalStatus">Marital Status *</Label>
                  <Select onValueChange={(value) => form.setValue('maritalStatus', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select marital status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married</SelectItem>
                      <SelectItem value="divorced">Divorced</SelectItem>
                      <SelectItem value="widowed">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.maritalStatus && (
                    <p className="text-sm text-red-500">{form.formState.errors.maritalStatus.message}</p>
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

        {/* Step 3: Identification */}
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FileUploadField fieldName="idFrontImage" label="ID Front Image" required />
                <FileUploadField fieldName="idBackImage" label="ID Back Image" required />
                <FileUploadField fieldName="profilePhoto" label="Profile Photo" required />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Financial Information */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Financial & Tax Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bankName">Bank Name *</Label>
                  <Input
                    id="bankName"
                    {...form.register('bankName')}
                    placeholder="Enter bank name"
                  />
                  {form.formState.errors.bankName && (
                    <p className="text-sm text-red-500">{form.formState.errors.bankName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="accountNumber">Account Number *</Label>
                  <Input
                    id="accountNumber"
                    {...form.register('accountNumber')}
                    placeholder="Enter account number"
                  />
                  {form.formState.errors.accountNumber && (
                    <p className="text-sm text-red-500">{form.formState.errors.accountNumber.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="accountName">Account Name *</Label>
                  <Input
                    id="accountName"
                    {...form.register('accountName')}
                    placeholder="Enter account name"
                  />
                  {form.formState.errors.accountName && (
                    <p className="text-sm text-red-500">{form.formState.errors.accountName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="bankCode">Bank Code *</Label>
                  <Input
                    id="bankCode"
                    {...form.register('bankCode')}
                    placeholder="Enter bank code"
                  />
                  {form.formState.errors.bankCode && (
                    <p className="text-sm text-red-500">{form.formState.errors.bankCode.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="bvn">BVN (Bank Verification Number) *</Label>
                  <Input
                    id="bvn"
                    {...form.register('bvn')}
                    placeholder="Enter your BVN"
                  />
                  {form.formState.errors.bvn && (
                    <p className="text-sm text-red-500">{form.formState.errors.bvn.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="taxIdType">Tax ID Type *</Label>
                  <Select onValueChange={(value) => form.setValue('taxIdType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tax ID type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tin">Tax Identification Number (TIN)</SelectItem>
                      <SelectItem value="vat_number">VAT Number</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.taxIdType && (
                    <p className="text-sm text-red-500">{form.formState.errors.taxIdType.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="taxIdNumber">Tax ID Number *</Label>
                  <Input
                    id="taxIdNumber"
                    {...form.register('taxIdNumber')}
                    placeholder="Enter your tax ID number"
                  />
                  {form.formState.errors.taxIdNumber && (
                    <p className="text-sm text-red-500">{form.formState.errors.taxIdNumber.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Professional Information */}
        {currentStep === 5 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Professional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="educationLevel">Education Level *</Label>
                  <Select onValueChange={(value) => form.setValue('educationLevel', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select education level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high_school">High School</SelectItem>
                      <SelectItem value="diploma">Diploma</SelectItem>
                      <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                      <SelectItem value="masters">Master's Degree</SelectItem>
                      <SelectItem value="phd">PhD</SelectItem>
                      <SelectItem value="certification">Professional Certification</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.educationLevel && (
                    <p className="text-sm text-red-500">{form.formState.errors.educationLevel.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="educationField">Field of Education *</Label>
                  <Input
                    id="educationField"
                    {...form.register('educationField')}
                    placeholder="e.g., Computer Science, Engineering"
                  />
                  {form.formState.errors.educationField && (
                    <p className="text-sm text-red-500">{form.formState.errors.educationField.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="yearsOfExperience">Years of Experience *</Label>
                  <Input
                    id="yearsOfExperience"
                    type="number"
                    {...form.register('yearsOfExperience', { valueAsNumber: true })}
                    placeholder="Enter years of experience"
                  />
                  {form.formState.errors.yearsOfExperience && (
                    <p className="text-sm text-red-500">{form.formState.errors.yearsOfExperience.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="currentEmployer">Current Employer *</Label>
                  <Input
                    id="currentEmployer"
                    {...form.register('currentEmployer')}
                    placeholder="Enter current employer"
                  />
                  {form.formState.errors.currentEmployer && (
                    <p className="text-sm text-red-500">{form.formState.errors.currentEmployer.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="jobTitle">Job Title *</Label>
                  <Input
                    id="jobTitle"
                    {...form.register('jobTitle')}
                    placeholder="Enter your job title"
                  />
                  {form.formState.errors.jobTitle && (
                    <p className="text-sm text-red-500">{form.formState.errors.jobTitle.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="linkedinProfile">LinkedIn Profile *</Label>
                  <Input
                    id="linkedinProfile"
                    {...form.register('linkedinProfile')}
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                  {form.formState.errors.linkedinProfile && (
                    <p className="text-sm text-red-500">{form.formState.errors.linkedinProfile.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="githubProfile">GitHub Profile</Label>
                  <Input
                    id="githubProfile"
                    {...form.register('githubProfile')}
                    placeholder="https://github.com/yourusername"
                  />
                </div>

                <div>
                  <Label htmlFor="portfolioWebsite">Portfolio Website</Label>
                  <Input
                    id="portfolioWebsite"
                    {...form.register('portfolioWebsite')}
                    placeholder="https://yourportfolio.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="teachingExperience">Teaching Experience *</Label>
                <Textarea
                  id="teachingExperience"
                  {...form.register('teachingExperience')}
                  placeholder="Describe your teaching experience, methodologies, and achievements..."
                  className="min-h-[100px]"
                />
                {form.formState.errors.teachingExperience && (
                  <p className="text-sm text-red-500">{form.formState.errors.teachingExperience.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="previousMentoringExperience">Previous Mentoring Experience *</Label>
                <Textarea
                  id="previousMentoringExperience"
                  {...form.register('previousMentoringExperience')}
                  placeholder="Describe your previous mentoring experience, number of mentees, success stories..."
                  className="min-h-[100px]"
                />
                {form.formState.errors.previousMentoringExperience && (
                  <p className="text-sm text-red-500">{form.formState.errors.previousMentoringExperience.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 6: Legal & Compliance */}
        {currentStep === 6 && (
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
                      You agree to our Terms of Service and User Agreement.
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
                      You consent to the processing of your personal data for verification purposes.
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
                      I consent to marketing communications (Optional)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      You agree to receive marketing emails and promotional content.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Important Notice</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Your KYC application will be reviewed within 2-3 business days. You will receive an email notification once the review is complete. 
                      Ensure all information provided is accurate and documents are clear and valid.
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