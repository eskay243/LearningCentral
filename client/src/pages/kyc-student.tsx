import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { Upload, FileText, Shield, User, Phone, MapPin, GraduationCap, CreditCard, AlertCircle } from 'lucide-react';

export default function KycStudentPage() {
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    middleName: '',
    dateOfBirth: '',
    gender: '',
    nationality: '',
    phoneNumber: '',
    alternatePhone: '',
    email: '',
    
    // Address Information
    currentAddress: '',
    permanentAddress: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Nigeria',
    
    // Educational Background
    highestEducation: '',
    institutionName: '',
    graduationYear: '',
    fieldOfStudy: '',
    currentEmployment: '',
    
    // Emergency Contact
    emergencyContactName: '',
    emergencyContactRelation: '',
    emergencyContactPhone: '',
    emergencyContactAddress: '',
    
    // Financial Information
    bankName: '',
    accountNumber: '',
    accountName: '',
    bvn: '',
    
    // Document Upload
    identificationDocument: null,
    proofOfAddress: null,
    educationalCertificate: null,
    
    // Additional Information
    learningGoals: '',
    priorExperience: '',
    referralSource: '',
    specialNeeds: '',
    
    // Consent and Agreements
    dataProcessingConsent: false,
    marketingConsent: false,
    termsAccepted: false
  });

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = [
      'firstName', 'lastName', 'dateOfBirth', 'gender', 'nationality',
      'phoneNumber', 'email', 'currentAddress', 'city', 'state',
      'emergencyContactName', 'emergencyContactPhone', 'dataProcessingConsent', 'termsAccepted'
    ];
    
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields before submitting.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "KYC Information Submitted",
      description: "Your KYC information has been submitted for review. You will receive a confirmation email within 24-48 hours.",
    });
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Personal Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Enter your first name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Enter your last name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="middleName">Middle Name</Label>
                <Input
                  id="middleName"
                  value={formData.middleName}
                  onChange={(e) => setFormData(prev => ({ ...prev, middleName: e.target.value }))}
                  placeholder="Enter your middle name (optional)"
                />
              </div>
              
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="gender">Gender *</Label>
                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="nationality">Nationality *</Label>
                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, nationality: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your nationality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nigerian">Nigerian</SelectItem>
                    <SelectItem value="ghanaian">Ghanaian</SelectItem>
                    <SelectItem value="kenyan">Kenyan</SelectItem>
                    <SelectItem value="south-african">South African</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Phone className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Contact Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phoneNumber">Primary Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="+234 XXX XXX XXXX"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="alternatePhone">Alternate Phone Number</Label>
                <Input
                  id="alternatePhone"
                  value={formData.alternatePhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, alternatePhone: e.target.value }))}
                  placeholder="+234 XXX XXX XXXX"
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your.email@example.com"
                  required
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Address Information</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="currentAddress">Current Address *</Label>
                <Textarea
                  id="currentAddress"
                  value={formData.currentAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentAddress: e.target.value }))}
                  placeholder="Enter your current residential address"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="permanentAddress">Permanent Address (if different)</Label>
                <Textarea
                  id="permanentAddress"
                  value={formData.permanentAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, permanentAddress: e.target.value }))}
                  placeholder="Enter your permanent address (optional)"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="City"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="State"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                    placeholder="Postal Code"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Educational & Emergency Contact</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="highestEducation">Highest Education Level</Label>
                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, highestEducation: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select education level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="secondary">Secondary School</SelectItem>
                    <SelectItem value="diploma">Diploma/Certificate</SelectItem>
                    <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                    <SelectItem value="master">Master's Degree</SelectItem>
                    <SelectItem value="doctorate">Doctorate</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="institutionName">Institution Name</Label>
                <Input
                  id="institutionName"
                  value={formData.institutionName}
                  onChange={(e) => setFormData(prev => ({ ...prev, institutionName: e.target.value }))}
                  placeholder="Name of your institution"
                />
              </div>
              
              <div>
                <Label htmlFor="graduationYear">Graduation Year</Label>
                <Input
                  id="graduationYear"
                  value={formData.graduationYear}
                  onChange={(e) => setFormData(prev => ({ ...prev, graduationYear: e.target.value }))}
                  placeholder="YYYY"
                />
              </div>
              
              <div>
                <Label htmlFor="fieldOfStudy">Field of Study</Label>
                <Input
                  id="fieldOfStudy"
                  value={formData.fieldOfStudy}
                  onChange={(e) => setFormData(prev => ({ ...prev, fieldOfStudy: e.target.value }))}
                  placeholder="Your field of study"
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="currentEmployment">Current Employment Status</Label>
                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, currentEmployment: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="employed">Employed</SelectItem>
                    <SelectItem value="self-employed">Self-employed</SelectItem>
                    <SelectItem value="unemployed">Unemployed</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h4 className="font-semibold">Emergency Contact Information</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergencyContactName">Emergency Contact Name *</Label>
                  <Input
                    id="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                    placeholder="Full name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="emergencyContactRelation">Relationship *</Label>
                  <Select onValueChange={(value) => setFormData(prev => ({ ...prev, emergencyContactRelation: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="sibling">Sibling</SelectItem>
                      <SelectItem value="spouse">Spouse</SelectItem>
                      <SelectItem value="relative">Relative</SelectItem>
                      <SelectItem value="friend">Friend</SelectItem>
                      <SelectItem value="guardian">Guardian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="emergencyContactPhone">Emergency Contact Phone *</Label>
                  <Input
                    id="emergencyContactPhone"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactPhone: e.target.value }))}
                    placeholder="+234 XXX XXX XXXX"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="emergencyContactAddress">Emergency Contact Address</Label>
                  <Input
                    id="emergencyContactAddress"
                    value={formData.emergencyContactAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactAddress: e.target.value }))}
                    placeholder="Address (optional)"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Financial Information & Documents</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  value={formData.bankName}
                  onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                  placeholder="Your bank name"
                />
              </div>
              
              <div>
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                  placeholder="Your account number"
                />
              </div>
              
              <div>
                <Label htmlFor="accountName">Account Name</Label>
                <Input
                  id="accountName"
                  value={formData.accountName}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountName: e.target.value }))}
                  placeholder="Account holder name"
                />
              </div>
              
              <div>
                <Label htmlFor="bvn">BVN (Bank Verification Number)</Label>
                <Input
                  id="bvn"
                  value={formData.bvn}
                  onChange={(e) => setFormData(prev => ({ ...prev, bvn: e.target.value }))}
                  placeholder="Your BVN"
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h4 className="font-semibold">Document Upload</h4>
              <p className="text-sm text-muted-foreground">
                Please upload clear, readable documents. Accepted formats: PDF, JPG, PNG (max 5MB each)
              </p>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <div className="text-sm font-medium">Government ID (Required)</div>
                  <div className="text-xs text-muted-foreground">National ID, Driver's License, or International Passport</div>
                </div>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <div className="text-sm font-medium">Proof of Address</div>
                  <div className="text-xs text-muted-foreground">Utility bill, bank statement, or rental agreement</div>
                </div>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <div className="text-sm font-medium">Educational Certificate (Optional)</div>
                  <div className="text-xs text-muted-foreground">Highest educational qualification</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Additional Information & Consent</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="learningGoals">Learning Goals & Objectives</Label>
                <Textarea
                  id="learningGoals"
                  value={formData.learningGoals}
                  onChange={(e) => setFormData(prev => ({ ...prev, learningGoals: e.target.value }))}
                  placeholder="What do you hope to achieve through our courses?"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="priorExperience">Prior Programming/Technical Experience</Label>
                <Textarea
                  id="priorExperience"
                  value={formData.priorExperience}
                  onChange={(e) => setFormData(prev => ({ ...prev, priorExperience: e.target.value }))}
                  placeholder="Describe any relevant experience you have"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="referralSource">How did you hear about us?</Label>
                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, referralSource: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select referral source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="social-media">Social Media</SelectItem>
                    <SelectItem value="friend-referral">Friend/Family Referral</SelectItem>
                    <SelectItem value="search-engine">Search Engine</SelectItem>
                    <SelectItem value="advertisement">Advertisement</SelectItem>
                    <SelectItem value="blog-article">Blog/Article</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="specialNeeds">Special Needs or Accommodations</Label>
                <Textarea
                  id="specialNeeds"
                  value={formData.specialNeeds}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialNeeds: e.target.value }))}
                  placeholder="Please describe any special accommodations you may need"
                  rows={2}
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h4 className="font-semibold">Consent & Agreements</h4>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="dataProcessingConsent"
                    checked={formData.dataProcessingConsent}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, dataProcessingConsent: !!checked }))}
                  />
                  <div className="text-sm">
                    <Label htmlFor="dataProcessingConsent" className="cursor-pointer">
                      I consent to the processing of my personal data for verification and educational purposes *
                    </Label>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="marketingConsent"
                    checked={formData.marketingConsent}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, marketingConsent: !!checked }))}
                  />
                  <div className="text-sm">
                    <Label htmlFor="marketingConsent" className="cursor-pointer">
                      I agree to receive marketing communications and course updates
                    </Label>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="termsAccepted"
                    checked={formData.termsAccepted}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, termsAccepted: !!checked }))}
                  />
                  <div className="text-sm">
                    <Label htmlFor="termsAccepted" className="cursor-pointer">
                      I have read and agree to the Terms of Service and Privacy Policy *
                    </Label>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">Important Notice</p>
                    <p className="text-yellow-700 mt-1">
                      Your KYC information will be reviewed within 24-48 hours. 
                      You will receive an email confirmation once your verification is complete.
                      All information provided must be accurate and verifiable.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Student KYC Verification</CardTitle>
                <CardDescription>
                  Complete your Know Your Customer verification to access all platform features
                </CardDescription>
              </div>
              <Badge variant="outline">
                Step {currentStep} of {totalSteps}
              </Badge>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {renderStepContent()}
              
              <div className="flex justify-between pt-6">
                <div>
                  {currentStep > 1 && (
                    <Button type="button" variant="outline" onClick={prevStep}>
                      Previous
                    </Button>
                  )}
                </div>
                
                <div className="flex gap-4">
                  <Link href="/dashboard">
                    <Button type="button" variant="ghost">
                      Save & Continue Later
                    </Button>
                  </Link>
                  
                  {currentStep < totalSteps ? (
                    <Button type="button" onClick={nextStep}>
                      Next
                    </Button>
                  ) : (
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      Submit KYC Application
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}