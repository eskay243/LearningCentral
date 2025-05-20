import React from 'react';

type CertificateTemplateProps = {
  studentName: string;
  courseTitle: string;
  issueDate: string;
  verificationCode: string;
  instructorName?: string;
  templateStyle?: 'default' | 'modern' | 'classic';
  logo?: string;
};

const CertificateTemplate: React.FC<CertificateTemplateProps> = ({
  studentName,
  courseTitle,
  issueDate,
  verificationCode,
  instructorName = 'Codelab Educare',
  templateStyle = 'default',
  logo = '/images/logo.png',
}) => {
  // Template style variations
  const templates = {
    default: (
      <div className="certificate bg-white relative overflow-hidden" style={{ width: '100%', height: '100%', minHeight: '600px' }}>
        <div className="certificate-border absolute inset-0 border-[20px] border-blue-600 z-0"></div>
        <div className="certificate-content relative z-10 flex flex-col items-center justify-center p-10 h-full text-center">
          <div className="certificate-header mb-8">
            <img src={logo} alt="Codelab Educare Logo" className="h-20 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-blue-700 mb-2">Certificate of Completion</h1>
            <div className="w-32 h-1 bg-blue-700 mx-auto mb-2"></div>
          </div>
          
          <div className="certificate-body mb-8">
            <p className="text-xl mb-6">This is to certify that</p>
            <h2 className="text-3xl font-bold mb-6 text-gray-800">{studentName}</h2>
            <p className="text-xl mb-6">has successfully completed the course</p>
            <h3 className="text-2xl font-semibold mb-6 px-10 text-blue-800">{courseTitle}</h3>
            <p className="text-lg mb-8">on {issueDate}</p>
          </div>
          
          <div className="certificate-footer">
            <div className="flex justify-center space-x-20 mb-4">
              <div className="text-center">
                <div className="w-40 border-t-2 border-gray-400 pt-2">
                  <p className="font-semibold">{instructorName}</p>
                  <p className="text-sm text-gray-600">Course Instructor</p>
                </div>
              </div>
              <div className="text-center">
                <div className="w-40 border-t-2 border-gray-400 pt-2">
                  <p className="font-semibold">Codelab Educare</p>
                  <p className="text-sm text-gray-600">Institution</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 text-sm text-gray-500">
              <p>Verification Code: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{verificationCode}</span></p>
              <p className="mt-1">Verify this certificate at <span className="text-blue-600">codelabeducare.com/verify</span></p>
            </div>
          </div>
        </div>
      </div>
    ),
    
    modern: (
      <div className="certificate bg-gradient-to-r from-sky-50 to-indigo-50 relative overflow-hidden" style={{ width: '100%', height: '100%', minHeight: '600px' }}>
        <div className="absolute top-0 left-0 h-24 w-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-br-[100px]"></div>
        <div className="absolute bottom-0 right-0 h-24 w-24 bg-gradient-to-tl from-blue-500 to-purple-600 rounded-tl-[100px]"></div>
        
        <div className="certificate-content relative z-10 flex flex-col items-center justify-center p-10 h-full text-center">
          <div className="certificate-header mb-8">
            <img src={logo} alt="Codelab Educare Logo" className="h-16 mx-auto mb-4" />
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-2">Certificate of Achievement</h1>
            <div className="w-40 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mb-2"></div>
          </div>
          
          <div className="certificate-body mb-8">
            <p className="text-xl mb-6">This certifies that</p>
            <h2 className="text-3xl font-bold mb-6 text-gray-800">{studentName}</h2>
            <p className="text-xl mb-6">has successfully completed</p>
            <div className="bg-white rounded-lg shadow-md px-6 py-4 mb-6">
              <h3 className="text-2xl font-semibold text-blue-700">{courseTitle}</h3>
            </div>
            <p className="text-lg mb-8">Issued on {issueDate}</p>
          </div>
          
          <div className="certificate-footer">
            <div className="flex justify-center space-x-20 mb-4">
              <div className="text-center">
                <div className="w-40 border-t-2 border-purple-400 pt-2">
                  <p className="font-semibold">{instructorName}</p>
                  <p className="text-sm text-gray-600">Course Instructor</p>
                </div>
              </div>
              <div className="text-center">
                <div className="w-40 border-t-2 border-blue-400 pt-2">
                  <p className="font-semibold">Codelab Educare</p>
                  <p className="text-sm text-gray-600">Institution</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 text-sm bg-white px-4 py-2 rounded-full shadow-sm inline-block">
              <span>Verification Code: </span>
              <span className="font-mono bg-gray-100 px-2 py-1 rounded-md">{verificationCode}</span>
            </div>
          </div>
        </div>
      </div>
    ),
    
    classic: (
      <div className="certificate bg-amber-50 relative overflow-hidden" style={{ width: '100%', height: '100%', minHeight: '600px' }}>
        <div className="certificate-border absolute inset-0 border-[15px] border-double border-amber-700 z-0"></div>
        <div className="certificate-border-inner absolute inset-[15px] border-[2px] border-amber-600 z-0"></div>
        
        <div className="certificate-content relative z-10 flex flex-col items-center justify-center p-10 h-full text-center">
          <div className="certificate-header mb-8">
            <h1 className="font-serif text-5xl font-bold text-amber-800 mb-2">Certificate of Excellence</h1>
            <div className="w-40 h-0.5 bg-amber-700 mx-auto mb-2"></div>
          </div>
          
          <div className="certificate-body mb-8">
            <p className="font-serif text-xl mb-6">This certificate is proudly presented to</p>
            <h2 className="font-serif text-3xl font-bold mb-6 text-amber-900">{studentName}</h2>
            <p className="font-serif text-xl mb-6">for successfully completing the course</p>
            <h3 className="font-serif text-2xl font-semibold mb-6 px-10 text-amber-800">{courseTitle}</h3>
            <p className="font-serif text-lg mb-8">Awarded on this {issueDate}</p>
          </div>
          
          <div className="certificate-footer">
            <div className="flex justify-center space-x-20 mb-4">
              <div className="text-center">
                <div className="w-40 border-t border-amber-700 pt-2">
                  <p className="font-serif font-semibold">{instructorName}</p>
                  <p className="font-serif text-sm text-amber-700">Course Instructor</p>
                </div>
              </div>
              <div className="text-center">
                <div className="w-40 border-t border-amber-700 pt-2">
                  <p className="font-serif font-semibold">Codelab Educare</p>
                  <p className="font-serif text-sm text-amber-700">Institution</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 text-sm text-amber-800 border border-amber-300 bg-amber-100 px-4 py-2 rounded inline-block">
              Verification Code: <span className="font-mono font-bold">{verificationCode}</span>
            </div>
          </div>
        </div>
      </div>
    ),
  };

  return templates[templateStyle];
};

export default CertificateTemplate;