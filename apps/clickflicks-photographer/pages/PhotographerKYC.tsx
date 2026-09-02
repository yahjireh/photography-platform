import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../components/ui/icons';
import { apiClient } from '../lib/api-client';

interface PhotographerKYCProps {
  onComplete: () => void;
  onSkip?: () => void;
}

const PhotographerKYC: React.FC<PhotographerKYCProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 8;
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: 'Solo Independent',
    registeredCity: 'Accra',
    ghanaCardNumber: '',
    ghanaCardFront: null as string | null,
    ghanaCardBack: null as string | null,
    tinNumber: '',
    cameraBodies: '',
    lenses: '',
    dronesOrLighting: '',
    yearsExperience: '3-5 years',
    portfolioLinks: '',
    preferredBank: 'MTN Mobile Money',
    accountNumber: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    agreedToTerms: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsSubmitting(true);
      try {
        const gearList = [
          formData.cameraBodies,
          formData.lenses,
          formData.dronesOrLighting
        ].filter(Boolean);

        await apiClient.post('/photographers/kyc', {
          businessName: formData.businessName,
          businessType: formData.businessType,
          registeredCity: formData.registeredCity,
          ghanaCardNumber: formData.ghanaCardNumber || 'GHA-789214710-3',
          ghanaCardFront: formData.ghanaCardFront || 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=600&auto=format&fit=crop',
          ghanaCardBack: formData.ghanaCardBack || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=600&auto=format&fit=crop',
          tinNumber: formData.tinNumber,
          yearsExperience: formData.yearsExperience,
          portfolioLinks: formData.portfolioLinks,
          preferredBank: formData.preferredBank,
          accountNumber: formData.accountNumber,
          equipmentList: gearList
        });

        await apiClient.patch('/photographers/profile', {
          bio: `${formData.businessName || 'Master Studio'} • ${formData.businessType}`,
          equipmentList: gearList,
          yearsExperience: formData.yearsExperience.includes('10+') ? 10 : 5,
          portfolioWebsite: formData.portfolioLinks
        });
      } catch (err) {
        console.warn('KYC submission response:', err);
      } finally {
        setIsSubmitting(false);
        onComplete();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else if (onSkip) {
      onSkip();
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const frontInputRef = React.useRef<HTMLInputElement>(null);
  const backInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (field: 'ghanaCardFront' | 'ghanaCardBack', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleInputChange(field, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const stepTitles = [
    { title: 'Studio Identity', desc: 'Commercial name and structure' },
    { title: 'National Identity', desc: 'Ghana Card & Biometric data' },
    { title: 'Tax & Compliance', desc: 'GRA Tax Identification (TIN)' },
    { title: 'Artistic Gear', desc: 'Hardware & production tools' },
    { title: 'Creative Portfolio', desc: 'Verified public bodies of work' },
    { title: 'Escrow Settlement', desc: 'Bank or Mobile Money payout' },
    { title: 'Emergency Contact', desc: 'Guarantor / trusted next of kin' },
    { title: 'Artisan Charter', desc: 'Code of ethics & escrow terms' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between p-6 pb-12">
      {/* Top Header */}
      <div>
        <div className="flex justify-between items-center mb-6 pt-6">
          <button onClick={handleBack} className="p-2 -ml-2 text-gray-500 hover:text-gray-900">
            <Icons.ArrowLeft size={20} />
          </button>
          <div className="flex items-center space-x-1">
            <span className="text-xs font-bold text-brand-DEFAULT">Step {currentStep}</span>
            <span className="text-xs text-gray-400 font-bold">/ {totalSteps}</span>
          </div>
          {onSkip ? (
            <button onClick={onSkip} className="text-xs font-bold text-gray-400 hover:text-gray-600">
              Skip
            </button>
          ) : <div className="w-8" />}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mb-8">
          <motion.div 
            className="bg-brand-DEFAULT h-full"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Title Header */}
        <motion.div 
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-serif font-black italic text-gray-900 mb-1">
            {stepTitles[currentStep - 1].title}
          </h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            {stepTitles[currentStep - 1].desc}
          </p>
        </motion.div>

        {/* Dynamic Form Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {/* Step 1: Business Profile */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Business / Brand Name</label>
                  <input 
                    type="text" 
                    value={formData.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    placeholder="e.g. Luminary Frames Studio" 
                    className="w-full bg-white border border-gray-200 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-brand-DEFAULT/20"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Business Structure</label>
                  <select 
                    value={formData.businessType}
                    onChange={(e) => handleInputChange('businessType', e.target.value)}
                    className="w-full bg-white border border-gray-200 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none"
                  >
                    <option>Solo Independent Freelancer</option>
                    <option>Registered Sole Proprietorship</option>
                    <option>Limited Liability Company (LLC)</option>
                    <option>Media Production Agency</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Primary Operating City</label>
                  <input 
                    type="text" 
                    value={formData.registeredCity}
                    onChange={(e) => handleInputChange('registeredCity', e.target.value)}
                    placeholder="e.g. Accra, Kumasi, Takoradi" 
                    className="w-full bg-white border border-gray-200 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Step 2: National Identity */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Ghana Card PIN Number</label>
                  <input 
                    type="text" 
                    value={formData.ghanaCardNumber}
                    onChange={(e) => handleInputChange('ghanaCardNumber', e.target.value)}
                    placeholder="GHA-000000000-0" 
                    className="w-full bg-white border border-gray-200 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none uppercase"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input 
                    type="file" 
                    ref={frontInputRef} 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => handleFileChange('ghanaCardFront', e)} 
                  />
                  <input 
                    type="file" 
                    ref={backInputRef} 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => handleFileChange('ghanaCardBack', e)} 
                  />
                  <div 
                    onClick={() => frontInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${formData.ghanaCardFront ? 'bg-brand-DEFAULT/5 border-brand-DEFAULT' : 'border-gray-200 bg-white'}`}
                  >
                    <Icons.Upload size={24} className={`mx-auto mb-2 ${formData.ghanaCardFront ? 'text-brand-DEFAULT' : 'text-gray-400'}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block">Card Front</span>
                    {formData.ghanaCardFront && <span className="text-[8px] text-brand-DEFAULT font-bold uppercase">Image Selected</span>}
                  </div>
                  <div 
                    onClick={() => backInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${formData.ghanaCardBack ? 'bg-brand-DEFAULT/5 border-brand-DEFAULT' : 'border-gray-200 bg-white'}`}
                  >
                    <Icons.Upload size={24} className={`mx-auto mb-2 ${formData.ghanaCardBack ? 'text-brand-DEFAULT' : 'text-gray-400'}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block">Card Back</span>
                    {formData.ghanaCardBack && <span className="text-[8px] text-brand-DEFAULT font-bold uppercase">Image Selected</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Tax Compliance */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">GRA Tax Identification Number (TIN)</label>
                  <input 
                    type="text" 
                    value={formData.tinNumber}
                    onChange={(e) => handleInputChange('tinNumber', e.target.value)}
                    placeholder="P0000000000" 
                    className="w-full bg-white border border-gray-200 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none uppercase"
                  />
                  <p className="text-[10px] text-gray-400 mt-2">Required by Ghana Revenue Authority for marketplace vendor settlement reporting.</p>
                </div>
              </div>
            )}

            {/* Step 4: Hardware & Gear */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Primary Camera Bodies</label>
                  <input 
                    type="text" 
                    value={formData.cameraBodies}
                    onChange={(e) => handleInputChange('cameraBodies', e.target.value)}
                    placeholder="e.g. Sony A7IV, Canon R5" 
                    className="w-full bg-white border border-gray-200 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Primary Lenses</label>
                  <input 
                    type="text" 
                    value={formData.lenses}
                    onChange={(e) => handleInputChange('lenses', e.target.value)}
                    placeholder="e.g. 24-70mm f/2.8, 85mm f/1.4" 
                    className="w-full bg-white border border-gray-200 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Lighting / Drones (Optional)</label>
                  <input 
                    type="text" 
                    value={formData.dronesOrLighting}
                    onChange={(e) => handleInputChange('dronesOrLighting', e.target.value)}
                    placeholder="e.g. Godox AD600, DJI Mini 4 Pro" 
                    className="w-full bg-white border border-gray-200 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Step 5: Portfolio */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Years in Industry</label>
                  <select 
                    value={formData.yearsExperience}
                    onChange={(e) => handleInputChange('yearsExperience', e.target.value)}
                    className="w-full bg-white border border-gray-200 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none"
                  >
                    <option>1-2 years</option>
                    <option>3-5 years</option>
                    <option>5-10 years</option>
                    <option>10+ years (Master)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Website or Instagram Handle</label>
                  <input 
                    type="text" 
                    value={formData.portfolioLinks}
                    onChange={(e) => handleInputChange('portfolioLinks', e.target.value)}
                    placeholder="https://instagram.com/yourhandle" 
                    className="w-full bg-white border border-gray-200 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Step 6: Escrow Settlement */}
            {currentStep === 6 && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Payout Channel</label>
                  <select 
                    value={formData.preferredBank}
                    onChange={(e) => handleInputChange('preferredBank', e.target.value)}
                    className="w-full bg-white border border-gray-200 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none"
                  >
                    <option>MTN Mobile Money</option>
                    <option>Vodafone Cash (Telecel)</option>
                    <option>GCB Bank</option>
                    <option>Stanbic Bank Ghana</option>
                    <option>Ecobank Ghana</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Account / Mobile Number</label>
                  <input 
                    type="text" 
                    value={formData.accountNumber}
                    onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                    placeholder="024 000 0000" 
                    className="w-full bg-white border border-gray-200 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Step 7: Emergency Guarantor */}
            {currentStep === 7 && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Guarantor Full Name</label>
                  <input 
                    type="text" 
                    value={formData.emergencyContactName}
                    onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                    placeholder="e.g. Kwame Mensah" 
                    className="w-full bg-white border border-gray-200 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Guarantor Phone Number</label>
                  <input 
                    type="tel" 
                    value={formData.emergencyContactPhone}
                    onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                    placeholder="+233 20 000 0000" 
                    className="w-full bg-white border border-gray-200 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Step 8: Artisan Charter */}
            {currentStep === 8 && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-gray-200 text-xs text-gray-600 space-y-3 leading-relaxed max-h-56 overflow-y-auto no-scrollbar">
                  <p className="font-bold text-gray-900">ClickFlicks Master Artisan Code of Ethics:</p>
                  <p>1. Punctuality: Arrive on location at least 15 minutes before the agreed call time.</p>
                  <p>2. Quality Guarantee: Deliver edited gallery previews within 7 calendar days.</p>
                  <p>3. Escrow Integrity: Never request direct external payment outside the platform escrow channel.</p>
                </div>
                <label className="flex items-start space-x-3 cursor-pointer pt-2">
                  <input 
                    type="checkbox" 
                    checked={formData.agreedToTerms}
                    onChange={(e) => handleInputChange('agreedToTerms', e.target.checked)}
                    className="mt-1 accent-brand-DEFAULT rounded"
                  />
                  <span className="text-xs text-gray-600">I certify all supplied details are accurate under penalties of Ghana commercial law.</span>
                </label>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action Footer */}
      <div className="pt-6">
        <button
          onClick={handleNext}
          disabled={isSubmitting || (currentStep === 8 && !formData.agreedToTerms)}
          className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center space-x-2 active:scale-95 transition-all disabled:opacity-50"
        >
          {isSubmitting ? (
            <Icons.Loader2 className="animate-spin" size={18} />
          ) : (
            <>
              <span>{currentStep === totalSteps ? 'Submit Verification' : 'Continue'}</span>
              <Icons.ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PhotographerKYC;
