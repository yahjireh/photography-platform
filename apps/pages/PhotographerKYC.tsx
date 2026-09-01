import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../components/ui/icons';

interface KYCData {
  // Step 1: Personal
  legalName: string;
  brandName: string;
  dob: string;
  nationality: string;
  gender: string;
  
  // Step 2: ID
  idType: string;
  idNumber: string;
  idFront: File | null;
  idBack: File | null;
  selfie: File | null;

  // Step 3: Contact
  email: string;
  phone: string;
  city: string;
  serviceAreas: string[];
  willingToTravel: string; // "yes" | "no"
  travelRange: number;

  // Step 4: Professional
  categories: string[];
  experience: string;
  languages: string[];
  bio: string;
  equipment: string[];

  // Step 5: Portfolio
  portfolioMethod: 'link' | 'upload';
  portfolioLink: string;
  portfolioFiles: File[];
  portfolioConsent: boolean;

  // Step 6: Payout
  payoutMethod: 'bank' | 'momo';
  // Bank
  bankAccountName: string;
  bankName: string;
  bankAccountNumber: string;
  // MoMo
  momoName: string;
  momoNetwork: string;
  momoNumber: string;
  // Tax
  tin: string;

  // Step 7: Consent
  consentInfo: boolean;
  consentVerification: boolean;
  consentTerms: boolean;
  consentPayouts: boolean;
}

const INITIAL_DATA: KYCData = {
  legalName: '', brandName: '', dob: '', nationality: 'Ghanaian', gender: '',
  idType: 'Ghana Card', idNumber: '', idFront: null, idBack: null, selfie: null,
  email: '', phone: '', city: '', serviceAreas: [], willingToTravel: 'no', travelRange: 0,
  categories: [], experience: '0-1', languages: [], bio: '', equipment: [],
  portfolioMethod: 'link', portfolioLink: '', portfolioFiles: [], portfolioConsent: false,
  payoutMethod: 'momo', bankAccountName: '', bankName: '', bankAccountNumber: '',
  momoName: '', momoNetwork: 'MTN', momoNumber: '', tin: '',
  consentInfo: false, consentVerification: false, consentTerms: false, consentPayouts: false
};

interface PhotographerKYCProps {
  onComplete: () => void;
}

const PhotographerKYC: React.FC<PhotographerKYCProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<KYCData>(INITIAL_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateData = (field: keyof KYCData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (currentStep === 1) {
      if (data.legalName.length < 2) newErrors.legalName = 'Name too short';
      if (data.brandName.length < 2) newErrors.brandName = 'Brand name too short';
      if (!data.dob) newErrors.dob = 'Date of birth required';
      else {
        const age = new Date().getFullYear() - new Date(data.dob).getFullYear();
        if (age < 18) newErrors.dob = 'Must be 18+ years old';
      }
    }

    if (currentStep === 2) {
      if (data.idNumber.length < 4) newErrors.idNumber = 'Invalid ID number';
      if (!data.idFront) newErrors.idFront = 'Front ID image required';
    }

    if (currentStep === 3) {
      if (!data.email.includes('@')) newErrors.email = 'Invalid email';
      if (data.phone.length < 8) newErrors.phone = 'Invalid phone number';
      if (!data.city) newErrors.city = 'City required';
      if (data.serviceAreas.length === 0) newErrors.serviceAreas = 'Select at least one area';
      if (data.willingToTravel === 'yes' && data.travelRange <= 0) newErrors.travelRange = 'Enter range';
    }

    if (currentStep === 4) {
      if (data.categories.length === 0) newErrors.categories = 'Select a category';
      if (data.languages.length === 0) newErrors.languages = 'Add a language';
      if (data.bio.length < 30) newErrors.bio = 'Bio is too short (min 30 chars)';
    }

    if (currentStep === 5) {
      if (data.portfolioMethod === 'link' && !data.portfolioLink.startsWith('http')) newErrors.portfolioLink = 'Must contain http:// or https://';
      if (data.portfolioMethod === 'upload' && data.portfolioFiles.length < 5) newErrors.portfolioFiles = 'Upload at least 5 images';
      if (!data.portfolioConsent) newErrors.portfolioConsent = 'Confirmation required';
    }

    if (currentStep === 6) {
      if (data.payoutMethod === 'bank') {
         if (data.bankAccountName.length < 2) newErrors.bankAccountName = 'Required';
         if (!data.bankName) newErrors.bankName = 'Required';
         if (data.bankAccountNumber.length < 6) newErrors.bankAccountNumber = 'Invalid account number';
      } else {
         if (data.momoName.length < 2) newErrors.momoName = 'Required';
         if (data.momoNumber.length < 8) newErrors.momoNumber = 'Invalid number';
      }
    }

    if (currentStep === 7) {
      if (!data.consentInfo || !data.consentVerification || !data.consentTerms || !data.consentPayouts) {
        newErrors.consents = 'All consents must be checked';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      isValid = false;
    }

    return isValid;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };

  const toggleArrayItem = (field: keyof KYCData, item: string) => {
    const current = data[field] as string[];
    const updated = current.includes(item) 
      ? current.filter(i => i !== item)
      : [...current, item];
    updateData(field, updated);
  };

  const renderStep = () => {
    switch (step) {
      case 0: // Start
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="w-24 h-24 bg-brand-DEFAULT/10 rounded-full flex items-center justify-center mb-6">
                <Icons.ShieldCheck className="text-brand-DEFAULT w-12 h-12" />
            </div>
            <h1 className="text-3xl font-serif font-black italic text-gray-900 mb-4">Verify Your Studio</h1>
            <p className="text-gray-500 mb-10 max-w-xs leading-relaxed">
              To maintain our premium standard, all photographers must complete a Know Your Customer (KYC) verification.
            </p>
            <button onClick={() => setStep(1)} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">
              Start Verification
            </button>
            <button className="mt-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Save & Finish Later</button>
          </div>
        );

      case 1: // Personal
        return (
          <div className="space-y-6">
             <StepHeader title="Personal Details" subtitle="Step 1 of 8" />
             <Input label="Legal Full Name" value={data.legalName} onChange={e => updateData('legalName', e.target.value)} error={errors.legalName} />
             <Input label="Brand / Display Name" value={data.brandName} onChange={e => updateData('brandName', e.target.value)} error={errors.brandName} />
             <Input label="Date of Birth" type="date" value={data.dob} onChange={e => updateData('dob', e.target.value)} error={errors.dob} />
             
             <div className="space-y-1">
               <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Nationality</label>
               <select className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl font-bold text-sm outline-none" value={data.nationality} onChange={e => updateData('nationality', e.target.value)}>
                 <option>Ghanaian</option>
                 <option>Nigerian</option>
                 <option>Togolese</option>
                 <option>Other</option>
               </select>
             </div>

             <div className="space-y-1">
               <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Gender (Optional)</label>
               <select className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl font-bold text-sm outline-none" value={data.gender} onChange={e => updateData('gender', e.target.value)}>
                 <option value="">Select...</option>
                 <option>Male</option>
                 <option>Female</option>
                 <option>Prefer not to say</option>
               </select>
             </div>
          </div>
        );

      case 2: // ID
        return (
          <div className="space-y-6">
            <StepHeader title="Identity Check" subtitle="Step 2 of 8" />
            <div className="space-y-1">
               <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">ID Document Type</label>
               <select className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl font-bold text-sm outline-none" value={data.idType} onChange={e => updateData('idType', e.target.value)}>
                 <option>Ghana Card</option>
                 <option>Passport</option>
                 <option>Driver's License</option>
               </select>
             </div>
             <Input label="ID Number" value={data.idNumber} onChange={e => updateData('idNumber', e.target.value)} error={errors.idNumber} />
             
             <FileUpload label="Front of ID" file={data.idFront} onFile={f => updateData('idFront', f)} error={errors.idFront} />
             <FileUpload label="Back of ID (Optional)" file={data.idBack} onFile={f => updateData('idBack', f)} />
             <FileUpload label="Selfie Photo (Recommended)" file={data.selfie} onFile={f => updateData('selfie', f)} />
             
             <p className="text-[10px] text-gray-400 italic">Ensure text on ID is legible. Max file size 10MB.</p>
          </div>
        );
      
      case 3: // Contact
        return (
          <div className="space-y-6">
            <StepHeader title="Contact & Location" subtitle="Step 3 of 8" />
            <Input label="Email Address" type="email" value={data.email} onChange={e => updateData('email', e.target.value)} error={errors.email} />
            <Input label="Phone Number" type="tel" value={data.phone} onChange={e => updateData('phone', e.target.value)} error={errors.phone} />
            <Input label="Base City / Region" value={data.city} onChange={e => updateData('city', e.target.value)} error={errors.city} />
            
            <div className="space-y-2">
               <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Service Areas</label>
               <div className="flex flex-wrap gap-2">
                 {['Accra', 'Kumasi', 'Tema', 'Cape Coast', 'Takoradi', 'Tamale'].map(area => (
                   <Chip 
                    key={area} 
                    label={area} 
                    selected={data.serviceAreas.includes(area)} 
                    onClick={() => toggleArrayItem('serviceAreas', area)} 
                   />
                 ))}
               </div>
               {errors.serviceAreas && <p className="text-red-500 text-[10px] font-bold ml-1">{errors.serviceAreas}</p>}
            </div>

            <div className="space-y-1">
               <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Willing to Travel?</label>
               <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 p-4 bg-gray-50 rounded-2xl flex-1 border border-gray-100">
                    <input type="radio" checked={data.willingToTravel === 'yes'} onChange={() => updateData('willingToTravel', 'yes')} />
                    <span className="font-bold text-sm">Yes</span>
                  </label>
                  <label className="flex items-center space-x-2 p-4 bg-gray-50 rounded-2xl flex-1 border border-gray-100">
                    <input type="radio" checked={data.willingToTravel === 'no'} onChange={() => updateData('willingToTravel', 'no')} />
                    <span className="font-bold text-sm">No</span>
                  </label>
               </div>
            </div>

            {data.willingToTravel === 'yes' && (
               <Input label="Travel Range (km)" type="number" value={data.travelRange} onChange={e => updateData('travelRange', Number(e.target.value))} error={errors.travelRange} />
            )}
          </div>
        );

      case 4: // Professional
        return (
          <div className="space-y-6">
            <StepHeader title="Professional Profile" subtitle="Step 4 of 8" />
            
            <div className="space-y-2">
               <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Categories</label>
               <div className="flex flex-wrap gap-2">
                 {['Wedding', 'Portrait', 'Events', 'Fashion', 'Product', 'Real Estate', 'Documentary'].map(cat => (
                   <Chip key={cat} label={cat} selected={data.categories.includes(cat)} onClick={() => toggleArrayItem('categories', cat)} />
                 ))}
               </div>
               {errors.categories && <p className="text-red-500 text-[10px] font-bold ml-1">{errors.categories}</p>}
            </div>

            <div className="space-y-1">
               <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Years of Experience</label>
               <select className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl font-bold text-sm outline-none" value={data.experience} onChange={e => updateData('experience', e.target.value)}>
                 <option>0-1</option>
                 <option>2-4</option>
                 <option>5-9</option>
                 <option>10+</option>
               </select>
             </div>

             <div className="space-y-2">
               <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Languages</label>
               <div className="flex flex-wrap gap-2">
                 {['English', 'Twi', 'Ga', 'Ewe', 'Fante', 'French'].map(lang => (
                   <Chip key={lang} label={lang} selected={data.languages.includes(lang)} onClick={() => toggleArrayItem('languages', lang)} />
                 ))}
               </div>
               {errors.languages && <p className="text-red-500 text-[10px] font-bold ml-1">{errors.languages}</p>}
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Short Bio</label>
                <textarea 
                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl font-medium text-sm outline-none h-32 resize-none"
                    placeholder="Tell clients about your style..."
                    value={data.bio}
                    onChange={e => updateData('bio', e.target.value)}
                />
                {errors.bio && <p className="text-red-500 text-[10px] font-bold ml-1">{errors.bio}</p>}
            </div>
          </div>
        );

      case 5: // Portfolio
        return (
            <div className="space-y-6">
                <StepHeader title="Portfolio Check" subtitle="Step 5 of 8" />
                <div className="flex space-x-4 mb-4">
                    <button onClick={() => updateData('portfolioMethod', 'link')} className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors border ${data.portfolioMethod === 'link' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-500'}`}>Link</button>
                    <button onClick={() => updateData('portfolioMethod', 'upload')} className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors border ${data.portfolioMethod === 'upload' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-500'}`}>Upload</button>
                </div>

                {data.portfolioMethod === 'link' ? (
                    <Input label="Portfolio URL" placeholder="https://instagram.com/..." value={data.portfolioLink} onChange={e => updateData('portfolioLink', e.target.value)} error={errors.portfolioLink} />
                ) : (
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Upload Samples (5-10)</label>
                        <div className="h-32 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400">
                             <Icons.Image size={24} className="mb-2" />
                             <span className="text-[10px] font-bold uppercase">Click to select files</span>
                        </div>
                        {errors.portfolioFiles && <p className="text-red-500 text-[10px] font-bold ml-1">{errors.portfolioFiles}</p>}
                    </div>
                )}

                <label className="flex items-start space-x-3 p-4 bg-gray-50 rounded-2xl cursor-pointer">
                    <input type="checkbox" className="mt-1" checked={data.portfolioConsent} onChange={e => updateData('portfolioConsent', e.target.checked)} />
                    <span className="text-xs font-medium text-gray-600">I confirm that the portfolio content provided is my original work and I hold the rights to it.</span>
                </label>
                {errors.portfolioConsent && <p className="text-red-500 text-[10px] font-bold ml-1">{errors.portfolioConsent}</p>}
            </div>
        );

      case 6: // Payout
        return (
            <div className="space-y-6">
                <StepHeader title="Payout Method" subtitle="Step 6 of 8" />
                <div className="flex space-x-4 mb-4">
                    <button onClick={() => updateData('payoutMethod', 'momo')} className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors border ${data.payoutMethod === 'momo' ? 'bg-brand-DEFAULT text-white border-brand-DEFAULT' : 'bg-white border-gray-200 text-gray-500'}`}>Mobile Money</button>
                    <button onClick={() => updateData('payoutMethod', 'bank')} className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors border ${data.payoutMethod === 'bank' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-500'}`}>Bank</button>
                </div>

                {data.payoutMethod === 'momo' ? (
                    <>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Network</label>
                            <select className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl font-bold text-sm outline-none" value={data.momoNetwork} onChange={e => updateData('momoNetwork', e.target.value)}>
                                <option>MTN</option>
                                <option>Vodafone</option>
                                <option>AirtelTigo</option>
                            </select>
                        </div>
                        <Input label="Account Holder Name" value={data.momoName} onChange={e => updateData('momoName', e.target.value)} error={errors.momoName} />
                        <Input label="MoMo Number" type="tel" value={data.momoNumber} onChange={e => updateData('momoNumber', e.target.value)} error={errors.momoNumber} />
                    </>
                ) : (
                    <>
                         <Input label="Account Holder Name" value={data.bankAccountName} onChange={e => updateData('bankAccountName', e.target.value)} error={errors.bankAccountName} />
                         <Input label="Bank Name" value={data.bankName} onChange={e => updateData('bankName', e.target.value)} error={errors.bankName} />
                         <Input label="Account Number" value={data.bankAccountNumber} onChange={e => updateData('bankAccountNumber', e.target.value)} error={errors.bankAccountNumber} />
                    </>
                )}
                <Input label="Tax ID (TIN) - Optional" value={data.tin} onChange={e => updateData('tin', e.target.value)} />
            </div>
        );

      case 7: // Consent
        return (
            <div className="space-y-6">
                <StepHeader title="Agreements" subtitle="Step 7 of 8" />
                <div className="space-y-4">
                    <Checkbox label="I confirm the information I provided is accurate and belongs to me." checked={data.consentInfo} onChange={v => updateData('consentInfo', v)} />
                    <Checkbox label="I consent to identity and payment verification by the platform." checked={data.consentVerification} onChange={v => updateData('consentVerification', v)} />
                    <Checkbox label="I agree to the platform Terms and Photographer Guidelines." checked={data.consentTerms} onChange={v => updateData('consentTerms', v)} />
                    <Checkbox label="I understand payouts are controlled by admin verification and platform rules." checked={data.consentPayouts} onChange={v => updateData('consentPayouts', v)} />
                </div>
                {errors.consents && <p className="text-red-500 text-[10px] font-bold text-center mt-4">{errors.consents}</p>}
            </div>
        );

      case 8: // Review
        return (
            <div className="space-y-6">
                <StepHeader title="Review & Submit" subtitle="Final Step" />
                <div className="bg-gray-50 rounded-[32px] p-6 space-y-4 border border-gray-100">
                    <ReviewItem label="Name" value={data.legalName} />
                    <ReviewItem label="Brand" value={data.brandName} />
                    <ReviewItem label="ID Type" value={data.idType} />
                    <ReviewItem label="Contact" value={data.phone} />
                    <ReviewItem label="Location" value={`${data.city} (${data.serviceAreas.join(', ')})`} />
                    <ReviewItem label="Category" value={data.categories.join(', ')} />
                    <div className="pt-4 border-t border-gray-200">
                         <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Payout</p>
                         <p className="font-bold text-sm text-gray-900">{data.payoutMethod === 'momo' ? `${data.momoNetwork} - ${data.momoNumber}` : `${data.bankName} - Ends in ${data.bankAccountNumber.slice(-4)}`}</p>
                    </div>
                </div>
                <button 
                    onClick={onComplete}
                    className="w-full bg-brand-DEFAULT text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-brand-DEFAULT/30 active:scale-95 transition-all flex items-center justify-center space-x-2"
                >
                    <span>Submit Application</span>
                    <Icons.CheckCircle size={18} />
                </button>
            </div>
        );
      
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      {step > 0 && (
          <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white z-40 border-b border-gray-100/50">
             <button onClick={handleBack} className="p-2 bg-gray-50 rounded-xl text-gray-900"><Icons.ChevronLeft size={20} /></button>
             <div className="flex space-x-1">
                {[1,2,3,4,5,6,7,8].map(i => (
                    <div key={i} className={`h-1.5 w-4 rounded-full transition-colors ${i <= step ? 'bg-brand-DEFAULT' : 'bg-gray-100'}`} />
                ))}
             </div>
          </header>
      )}

      <div className="px-6 pt-6">
         <AnimatePresence mode="wait">
             <motion.div
                key={step}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
             >
                 {renderStep()}
             </motion.div>
         </AnimatePresence>
      </div>

      {step > 0 && step < 8 && (
          <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100 z-50 max-w-[480px] mx-auto">
              <button 
                onClick={handleNext}
                className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-2"
              >
                  <span>Next Step</span>
                  <Icons.ArrowRight size={16} />
              </button>
          </div>
      )}
    </div>
  );
};

// UI Components
const StepHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
    <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-DEFAULT mb-2">{subtitle}</p>
        <h2 className="text-3xl font-serif font-black italic text-gray-900">{title}</h2>
    </div>
);

const Input: React.FC<any> = ({ label, error, ...props }) => (
    <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">{label}</label>
        <input className={`w-full bg-gray-50 border ${error ? 'border-red-400' : 'border-gray-100'} p-4 rounded-2xl font-bold text-sm text-gray-900 outline-none focus:ring-2 focus:ring-brand-DEFAULT/10 transition-all`} {...props} />
        {error && <p className="text-red-500 text-[10px] font-bold ml-1">{error}</p>}
    </div>
);

const FileUpload: React.FC<{ label: string, file: File | null, onFile: (f: File) => void, error?: string }> = ({ label, file, onFile, error }) => (
    <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">{label}</label>
        <div className={`relative h-20 bg-gray-50 border-2 border-dashed ${error ? 'border-red-400' : 'border-gray-200'} rounded-2xl flex items-center px-4 overflow-hidden`}>
            {file ? (
                <div className="flex items-center space-x-3 w-full">
                    <div className="w-10 h-10 bg-brand-DEFAULT/10 rounded-lg flex items-center justify-center text-brand-DEFAULT"><Icons.FileCheck size={20} /></div>
                    <span className="text-xs font-bold text-gray-900 truncate flex-1">{file.name}</span>
                    <button onClick={(e) => { e.preventDefault(); }} className="p-2 text-gray-400"><Icons.Check size={16} /></button>
                </div>
            ) : (
                <div className="flex items-center space-x-3 text-gray-400 w-full">
                    <Icons.Upload size={20} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Tap to upload</span>
                </div>
            )}
            <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                onChange={(e) => { if(e.target.files?.[0]) onFile(e.target.files[0]) }}
                accept="image/*,application/pdf"
            />
        </div>
        {error && <p className="text-red-500 text-[10px] font-bold ml-1">{error}</p>}
    </div>
);

const Chip: React.FC<{ label: string, selected: boolean, onClick: () => void }> = ({ label, selected, onClick }) => (
    <button 
        onClick={onClick}
        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${selected ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'bg-white border-gray-200 text-gray-500'}`}
    >
        {label}
    </button>
);

const Checkbox: React.FC<{ label: string, checked: boolean, onChange: (v: boolean) => void }> = ({ label, checked, onChange }) => (
    <label className="flex items-start space-x-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer">
        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center mt-0.5 transition-colors ${checked ? 'bg-brand-DEFAULT border-brand-DEFAULT' : 'border-gray-300 bg-white'}`}>
            {checked && <Icons.Check size={12} className="text-white" strokeWidth={3} />}
        </div>
        <input type="checkbox" className="hidden" checked={checked} onChange={e => onChange(e.target.checked)} />
        <span className="text-xs font-medium text-gray-700 leading-tight select-none">{label}</span>
    </label>
);

const ReviewItem: React.FC<{ label: string, value: string }> = ({ label, value }) => (
    <div className="flex justify-between items-start">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-0.5">{label}</span>
        <span className="text-xs font-bold text-gray-900 text-right max-w-[60%]">{value}</span>
    </div>
);

export default PhotographerKYC;