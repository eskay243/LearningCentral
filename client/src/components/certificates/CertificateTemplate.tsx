import React from 'react';

interface CertificateTemplateProps {
  studentName: string;
  courseTitle: string;
  issueDate: string;
  verificationCode: string;
  templateStyle?: 'default' | 'modern' | 'classic';
  additionalNote?: string;
}

const CertificateTemplate: React.FC<CertificateTemplateProps> = ({
  studentName,
  courseTitle,
  issueDate,
  verificationCode,
  templateStyle = 'default',
  additionalNote
}) => {
  const renderDefaultTemplate = () => (
    <div className="relative w-full aspect-[1.414/1] p-8 border-8 border-blue-200 bg-gradient-to-br from-blue-50 to-white text-center flex flex-col items-center justify-between">
      <div className="absolute inset-0 border-4 border-blue-100 m-2" />
      
      <div className="w-full pt-6">
        <h1 className="font-serif text-3xl text-blue-800 uppercase tracking-wide">Certificate of Completion</h1>
        <div className="w-full flex justify-center my-2">
          <div className="w-1/3 h-1 bg-blue-600 rounded" />
        </div>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center space-y-4">
        <p className="font-serif text-lg">This certifies that</p>
        <h2 className="font-serif text-3xl text-blue-900 font-bold">{studentName}</h2>
        <p className="font-serif text-lg">has successfully completed the course</p>
        <h3 className="font-serif text-2xl text-blue-900 font-bold max-w-lg">{courseTitle}</h3>
        
        {additionalNote && (
          <p className="text-sm text-blue-700 italic max-w-lg mt-2">{additionalNote}</p>
        )}
      </div>
      
      <div className="w-full pb-6">
        <div className="flex justify-between items-end">
          <div className="text-left">
            <p className="text-sm">Date</p>
            <p className="font-semibold">{issueDate}</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-32 h-12 border-b border-gray-400 mb-1"></div>
            <p className="text-sm">Signature</p>
          </div>
          
          <div className="text-right">
            <p className="text-xs text-gray-500">Verification Code</p>
            <p className="font-mono text-xs">{verificationCode}</p>
          </div>
        </div>
        
        <div className="mt-4 pt-2 border-t border-blue-200">
          <p className="text-sm text-center text-blue-700">
            Codelab Educare - Excellence in Technical Education
          </p>
        </div>
      </div>
    </div>
  );
  
  const renderModernTemplate = () => (
    <div className="relative w-full aspect-[1.414/1] p-8 bg-gradient-to-br from-purple-600 to-blue-500 text-white text-center flex flex-col items-center justify-between overflow-hidden">
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-yellow-300" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-pink-500" />
      </div>
      
      <div className="absolute top-0 left-0 w-full h-full border-[12px] border-white/10 m-0 z-10" />
      
      <div className="w-full pt-6 relative z-20">
        <h1 className="font-sans text-3xl font-bold uppercase tracking-wider">Certificate of Achievement</h1>
        <div className="w-full flex justify-center my-2">
          <div className="w-24 h-1 bg-white/60 rounded" />
        </div>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 relative z-20">
        <p className="font-light text-lg text-white/90">This is to certify that</p>
        <h2 className="font-sans text-4xl font-bold">{studentName}</h2>
        <p className="font-light text-lg text-white/90">has successfully completed</p>
        <h3 className="font-sans text-2xl font-semibold max-w-lg">{courseTitle}</h3>
        
        {additionalNote && (
          <p className="text-sm text-white/80 max-w-lg mt-2 italic">{additionalNote}</p>
        )}
      </div>
      
      <div className="w-full pb-6 relative z-20">
        <div className="flex justify-between items-end">
          <div className="text-left">
            <p className="text-xs text-white/80">Issue Date</p>
            <p className="font-medium">{issueDate}</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-32 h-12 border-b border-white/40 mb-1"></div>
            <p className="text-sm text-white/80">Director</p>
          </div>
          
          <div className="text-right">
            <p className="text-xs text-white/60">Verify At</p>
            <p className="font-mono text-xs">Code: {verificationCode}</p>
          </div>
        </div>
        
        <div className="mt-4 pt-2 border-t border-white/10">
          <p className="text-sm text-center text-white/80">
            Codelab Educare • Transforming Education Through Technology
          </p>
        </div>
      </div>
    </div>
  );
  
  const renderClassicTemplate = () => (
    <div className="relative w-full aspect-[1.414/1] p-8 border-8 border-amber-300 bg-amber-50 text-center flex flex-col items-center justify-between">
      <div className="absolute inset-0 border-2 border-amber-800/30 m-4" />
      
      <div className="absolute top-12 left-12 right-12 bottom-12 border-[1px] border-amber-800/20" />
      
      <div className="w-full pt-8 relative z-20">
        <div className="flex justify-center">
          <div className="w-24 h-24 border-2 border-amber-700 rounded-full flex items-center justify-center">
            <div className="w-20 h-20 bg-amber-700 rounded-full flex items-center justify-center text-white font-serif">
              <span className="text-xs">CODELAB</span>
            </div>
          </div>
        </div>
        <h1 className="font-serif text-3xl text-amber-800 uppercase tracking-widest mt-4">Certificate of Excellence</h1>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 px-12">
        <p className="font-serif text-lg text-amber-900">This is to certify that</p>
        <h2 className="font-serif text-4xl text-amber-900 font-bold">{studentName}</h2>
        <p className="font-serif text-lg text-amber-900">has demonstrated exceptional proficiency in the course</p>
        <h3 className="font-serif text-2xl text-amber-900 font-bold max-w-lg">{courseTitle}</h3>
        
        {additionalNote && (
          <p className="text-sm text-amber-800 italic max-w-lg mt-2">{additionalNote}</p>
        )}
      </div>
      
      <div className="w-full pb-6 relative z-20">
        <div className="flex justify-between items-end">
          <div className="text-left">
            <p className="text-sm text-amber-800">Date of Award</p>
            <p className="font-semibold text-amber-900">{issueDate}</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-32 h-12 border-b border-amber-700 mb-1"></div>
            <p className="text-sm text-amber-800">Chief Academic Officer</p>
          </div>
          
          <div className="text-right">
            <p className="text-xs text-amber-700">Authentication</p>
            <p className="font-mono text-xs text-amber-900">{verificationCode}</p>
          </div>
        </div>
        
        <div className="mt-6 pt-2 border-t border-amber-300">
          <p className="text-sm text-center text-amber-800">
            Codelab Educare - Tradition of Excellence Since 2023
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="certificate-container">
      {templateStyle === 'default' && renderDefaultTemplate()}
      {templateStyle === 'modern' && renderModernTemplate()}
      {templateStyle === 'classic' && renderClassicTemplate()}
    </div>
  );
};

export default CertificateTemplate;