import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../components/ui/icons';
import { apiClient } from '../lib/api-client';

interface PhotographerKYCProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export interface PhotographerPackageItem {
  id?: string;
  name: string;
  price: number;
  deliveryDays: number;
  occasionType: string;
  description: string;
  features: string[];
  imageUrl?: string;
}

const GHANA_REGIONS = [
  'Greater Accra',
  'Ashanti',
  'Central',
  'Eastern',
  'Western',
  'Western North',
  'Volta',
  'Oti',
  'Northern',
  'North East',
  'Savannah',
  'Upper East',
  'Upper West',
  'Bono',
  'Bono East',
  'Ahafo'
];

const CITY_TO_REGION_MAP: Record<string, string> = {
  accra: 'Greater Accra',
  tema: 'Greater Accra',
  madina: 'Greater Accra',
  adenta: 'Greater Accra',
  spintex: 'Greater Accra',
  'east legon': 'Greater Accra',
  osu: 'Greater Accra',
  kumasi: 'Ashanti',
  obuas: 'Ashanti',
  ejisu: 'Ashanti',
  tafo: 'Ashanti',
  asokwa: 'Ashanti',
  'cape coast': 'Central',
  elmina: 'Central',
  winneba: 'Central',
  mankessim: 'Central',
  kasoa: 'Central',
  koforidua: 'Eastern',
  nkawkaw: 'Eastern',
  akag: 'Eastern',
  akob: 'Eastern',
  nsawam: 'Eastern',
  suhum: 'Eastern',
  takoradi: 'Western',
  sekondi: 'Western',
  tarkwa: 'Western',
  axim: 'Western',
  'sefwi wiawso': 'Western North',
  bibiani: 'Western North',
  ho: 'Volta',
  hohoe: 'Volta',
  keta: 'Volta',
  aflao: 'Volta',
  dambai: 'Oti',
  nkwanta: 'Oti',
  tamale: 'Northern',
  yendi: 'Northern',
  savelugu: 'Northern',
  nalerigu: 'North East',
  walewale: 'North East',
  damongo: 'Savannah',
  bole: 'Savannah',
  salaga: 'Savannah',
  bolgatanga: 'Upper East',
  navrongo: 'Upper East',
  bawku: 'Upper East',
  wa: 'Upper West',
  jirapa: 'Upper West',
  lawra: 'Upper West',
  sunyani: 'Bono',
  berekum: 'Bono',
  'dormaa ahenkro': 'Bono',
  techiman: 'Bono East',
  kintampo: 'Bono East',
  atebubu: 'Bono East',
  goaso: 'Ahafo',
  mim: 'Ahafo',
  kenyasi: 'Ahafo'
};

const CATEGORIES_LIST = [
  { id: 'MOBILE_PHOTOGRAPHY', label: 'Mobile Photography', icon: '📱' },
  { id: 'PHOTOJOURNALISM', label: 'Photojournalism', icon: '📰' },
  { id: 'VIDEOGRAPHY', label: 'Videography', icon: '🎥' },
  { id: 'PORTRAIT', label: 'Portrait', icon: '👤' },
  { id: 'WEDDING', label: 'Wedding', icon: '💍' },
  { id: 'EVENTS', label: 'Events', icon: '🎉' },
  { id: 'FASHION', label: 'Fashion', icon: '👗' },
  { id: 'PRODUCT', label: 'Product', icon: '📦' },
  { id: 'DOCUMENTARY', label: 'Documentary', icon: '🎞️' },
  { id: 'REAL_ESTATE', label: 'Real Estate', icon: '🏡' }
];

export const PhotographerKYC: React.FC<PhotographerKYCProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7;
  const [verificationStatus, setVerificationStatus] = useState<string>('PENDING');
  const [isLoadingExisting, setIsLoadingExisting] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: 'Solo Independent Freelancer',
    registeredCity: 'Accra',
    region: 'Greater Accra',
    categories: ['PORTRAIT', 'MOBILE_PHOTOGRAPHY'] as string[],
    
    // National ID & Biometrics
    ghanaCardNumber: '',
    dateOfBirth: '',
    ghanaCardFront: null as string | null,
    ghanaCardBack: null as string | null,
    faceVerificationVideo: null as string | null,

    // Packages (Replaces TIN)
    packages: [
      {
        name: 'Standard Portrait Session',
        price: 800,
        deliveryDays: 3,
        occasionType: 'PORTRAIT',
        description: 'Includes 15 fully retouched high-res images and 1 outfit change.',
        features: ['15 Retouched Images', '1 Outfit Change', 'Online Private Gallery'],
        imageUrl: ''
      }
    ] as PhotographerPackageItem[],

    // Portfolio & Experience
    yearsExperience: '3-5 years',
    portfolioLinks: '',

    // Escrow Settlement
    preferredBank: 'MTN Mobile Money',
    accountNumber: '',
    accountName: '',

    // Emergency Contact / Guarantor
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: 'Guarantor / Next of Kin',

    agreedToTerms: false
  });

  // Package Modal Preview State
  const [previewPackage, setPreviewPackage] = useState<PhotographerPackageItem | null>(null);
  
  // Package Creator / Editor State
  const [isAddingPackage, setIsAddingPackage] = useState(false);
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgPrice, setNewPkgPrice] = useState<number>(1000);
  const [newPkgDays, setNewPkgDays] = useState<number>(3);
  const [newPkgOccasion, setNewPkgOccasion] = useState('PORTRAIT');
  const [newPkgDescription, setNewPkgDescription] = useState('');
  const [newPkgFeatures, setNewPkgFeatures] = useState('');
  const [newPkgImage, setNewPkgImage] = useState<string>('');
  const [editingPkgIndex, setEditingPkgIndex] = useState<number | null>(null);

  // Camera & Face Liveness Video State
  const [isRecordingFace, setIsRecordingFace] = useState(false);
  const [facePromptIndex, setFacePromptIndex] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSaveMsg, setAutoSaveMsg] = useState<string | null>(null);

  // File Inputs
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const packageImageRef = useRef<HTMLInputElement>(null);

  // Step Titles
  const stepTitles = [
    { title: 'Studio Identity & Location', desc: 'Commercial name, region & specialties' },
    { title: 'Ghana Card & Biometric Liveness', desc: 'National ID, DOB & live head-movement video' },
    { title: 'Studio Packages & Flyers', desc: 'Set your bookable rates & upload package flyers' },
    { title: 'Creative Portfolio', desc: 'Years in photography & portfolio link' },
    { title: 'Escrow Settlement Payout', desc: 'Validated MoMo or Bank settlement channel' },
    { title: 'Emergency Guarantor Contact', desc: 'Trusted contact in case of shoot emergencies' },
    { title: 'Artisan Charter & Agreement', desc: 'Platform ethics & final verification submission' }
  ];

  useEffect(() => {
    let isMounted = true;

    // 0. Immediately restore local storage draft so user never loses inputs (even offline or on network failure)
    if (typeof window !== 'undefined') {
      try {
        const localDraft = localStorage.getItem('clickflicks_photographer_kyc_local_draft');
        if (localDraft) {
          const parsed = JSON.parse(localDraft);
          if (parsed && typeof parsed === 'object') {
            setFormData(prev => ({ ...prev, ...parsed }));
          }
        }
      } catch (e) {
        console.warn('Could not read local KYC draft', e);
      }
    }

    async function loadExistingKYC() {
      try {
        setIsLoadingExisting(true);
        const res = await apiClient.get('/photographers/kyc/me');
        if (res.data?.success && res.data?.data && isMounted) {
          const { photographer, kyc, packages, documents } = res.data.data;
          
          setVerificationStatus(photographer?.verification_status || 'PENDING');

          let frontDoc: string | null = null;
          let backDoc: string | null = null;
          let videoDoc: string | null = null;

          if (Array.isArray(documents)) {
            const front = documents.find((d: any) => d.document_type === 'GHANA_CARD_FRONT');
            const back = documents.find((d: any) => d.document_type === 'GHANA_CARD_BACK');
            const video = documents.find((d: any) => d.document_type === 'FACE_VERIFICATION_VIDEO');
            if (front) frontDoc = front.document_url;
            if (back) backDoc = back.document_url;
            if (video) videoDoc = video.document_url;
          }

          setFormData(prev => ({
            ...prev,
            businessName: photographer?.business_name || prev.businessName,
            businessType: kyc?.business_type || prev.businessType,
            registeredCity: photographer?.service_area || photographer?.user?.location_city || prev.registeredCity,
            region: photographer?.region || prev.region,
            categories: Array.isArray(photographer?.specialties) && photographer.specialties.length > 0 
              ? photographer.specialties 
              : prev.categories,
            
            ghanaCardNumber: kyc?.ghana_card_number || prev.ghanaCardNumber,
            dateOfBirth: kyc?.date_of_birth ? new Date(kyc.date_of_birth).toISOString().split('T')[0] : prev.dateOfBirth,
            ghanaCardFront: frontDoc || prev.ghanaCardFront,
            ghanaCardBack: backDoc || prev.ghanaCardBack,
            faceVerificationVideo: videoDoc || prev.faceVerificationVideo,

            packages: Array.isArray(packages) && packages.length > 0
              ? packages.map((p: any) => ({
                  id: p.id,
                  name: p.name,
                  price: Number(p.price),
                  deliveryDays: p.delivery_days || 3,
                  occasionType: p.occasion_type || 'PORTRAIT',
                  description: p.description || '',
                  features: Array.isArray(p.features) ? p.features : [],
                  imageUrl: p.image_url || ''
                }))
              : prev.packages,

            yearsExperience: photographer?.years_experience ? `${photographer.years_experience} years` : prev.yearsExperience,
            portfolioLinks: photographer?.portfolio_website || prev.portfolioLinks,

            preferredBank: kyc?.preferred_bank || prev.preferredBank,
            accountNumber: kyc?.account_number || prev.accountNumber,
            accountName: kyc?.account_name || prev.accountName,

            emergencyContactName: photographer?.emergency_contact_name || kyc?.emergency_contact_name || prev.emergencyContactName,
            emergencyContactPhone: photographer?.emergency_contact_phone || kyc?.emergency_contact_phone || prev.emergencyContactPhone
          }));
        }
      } catch (err) {
        console.warn('Could not load existing KYC draft:', err);
      } finally {
        if (isMounted) setIsLoadingExisting(false);
      }
    }

    loadExistingKYC();
    return () => {
      isMounted = false;
      stopCameraStream();
    };
  }, []);

  // Smart City to Region auto-detector
  const handleCityChange = (city: string) => {
    setFormData(prev => {
      const cleanCity = city.trim().toLowerCase();
      let autoRegion = prev.region;
      for (const [key, regionName] of Object.entries(CITY_TO_REGION_MAP)) {
        if (cleanCity.includes(key) || key.includes(cleanCity)) {
          autoRegion = regionName;
          break;
        }
      }
      return { ...prev, registeredCity: city, region: autoRegion };
    });
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Telecom Mobile Money Prefix Validator
  const getMomoNetworkError = (): string | null => {
    const raw = formData.accountNumber.trim().replace(/\D/g, '');
    if (!raw || raw.length < 3) return null;
    
    let prefix = raw.substring(0, 3);
    if (raw.startsWith('233') && raw.length >= 5) {
      prefix = '0' + raw.substring(3, 5);
    }

    const mtnPrefixes = ['024', '025', '053', '054', '055', '059'];
    const telecelPrefixes = ['020', '050'];
    const atPrefixes = ['026', '027', '056', '057'];

    if (formData.preferredBank === 'MTN Mobile Money') {
      if (telecelPrefixes.includes(prefix)) {
        return `⚠️ ${prefix} is a Telecel (Vodafone) number and cannot be paired with MTN Mobile Money. Please switch your payout channel to Telecel Cash or enter an MTN number.`;
      }
      if (atPrefixes.includes(prefix)) {
        return `⚠️ ${prefix} is an AT (AirtelTigo) number and cannot be paired with MTN Mobile Money.`;
      }
    } else if (formData.preferredBank === 'Vodafone Cash (Telecel)') {
      if (mtnPrefixes.includes(prefix)) {
        return `⚠️ ${prefix} is an MTN number and cannot be paired with Telecel Cash. Please switch your payout channel to MTN MoMo or enter a Telecel number.`;
      }
      if (atPrefixes.includes(prefix)) {
        return `⚠️ ${prefix} is an AT (AirtelTigo) number and cannot be paired with Telecel Cash.`;
      }
    } else if (formData.preferredBank === 'AT Money (AirtelTigo)') {
      if (mtnPrefixes.includes(prefix) || telecelPrefixes.includes(prefix)) {
        return `⚠️ ${prefix} does not belong to AT Money network.`;
      }
    }

    return null;
  };

  // File Upload Handlers (Card Front / Back)
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

  // Package Flyer Upload Handler
  const handlePackageImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPkgImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save / Update Package in local state
  const handleSavePackage = () => {
    if (!newPkgName.trim()) {
      alert('Please enter a package name');
      return;
    }

    const featureArray = newPkgFeatures
      .split('\n')
      .map(f => f.trim())
      .filter(Boolean);

    const packageItem: PhotographerPackageItem = {
      name: newPkgName.trim(),
      price: Number(newPkgPrice) || 500,
      deliveryDays: Number(newPkgDays) || 3,
      occasionType: newPkgOccasion,
      description: newPkgDescription.trim(),
      features: featureArray.length > 0 ? featureArray : ['High Resolution Gallery', 'Pro Color Grading'],
      imageUrl: newPkgImage || undefined
    };

    if (editingPkgIndex !== null && editingPkgIndex >= 0) {
      setFormData(prev => {
        const next = [...prev.packages];
        next[editingPkgIndex] = packageItem;
        return { ...prev, packages: next };
      });
    } else {
      setFormData(prev => ({
        ...prev,
        packages: [...prev.packages, packageItem]
      }));
    }

    // Reset editor
    setNewPkgName('');
    setNewPkgPrice(1000);
    setNewPkgDays(3);
    setNewPkgDescription('');
    setNewPkgFeatures('');
    setNewPkgImage('');
    setEditingPkgIndex(null);
    setIsAddingPackage(false);
  };

  const handleEditPackage = (pkg: PhotographerPackageItem, index: number) => {
    setNewPkgName(pkg.name);
    setNewPkgPrice(pkg.price);
    setNewPkgDays(pkg.deliveryDays);
    setNewPkgOccasion(pkg.occasionType || 'PORTRAIT');
    setNewPkgDescription(pkg.description || '');
    setNewPkgFeatures((pkg.features || []).join('\n'));
    setNewPkgImage(pkg.imageUrl || '');
    setEditingPkgIndex(index);
    setIsAddingPackage(true);
  };

  const handleDeletePackage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      packages: prev.packages.filter((_, i) => i !== index)
    }));
  };

  // ============================================
  // CAMERA & BIOMETRIC FACE LIVENESS RECORDING
  // ============================================
  const facePrompts = [
    { title: 'Center Face', desc: 'Hold your head straight facing the camera' },
    { title: 'Turn Slowly Left', desc: 'Gently turn your head to the left side' },
    { title: 'Turn Slowly Right', desc: 'Gently turn your head to the right side' },
    { title: 'Tilt Up & Down', desc: 'Gently look up, then back down to center' }
  ];

  const startCamera = async () => {
    try {
      setCameraError(null);
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera access failed:', err);
      setCameraError('Unable to access front camera. Please allow camera permissions in your browser.');
      setIsCameraActive(false);
    }
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startFaceRecording = () => {
    if (!streamRef.current) return;
    recordedChunksRef.current = [];
    setIsRecordingFace(true);
    setFacePromptIndex(0);

    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4'
    });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
        handleInputChange('faceVerificationVideo', reader.result as string);
      };
      reader.readAsDataURL(blob);
      setIsRecordingFace(false);
      stopCameraStream();
    };

    mediaRecorder.start();

    // Progress through head-movement prompts every 1.5s (total 6 seconds)
    const promptInterval = setInterval(() => {
      setFacePromptIndex(prev => {
        if (prev >= 3) {
          clearInterval(promptInterval);
          setTimeout(() => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
              mediaRecorderRef.current.stop();
            }
          }, 800);
          return 3;
        }
        return prev + 1;
      });
    }, 1500);
  };

  // Progressive background auto-save so user never loses progress
  const autoSaveDraft = async () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('clickflicks_photographer_kyc_local_draft', JSON.stringify(formData));
      } catch (e) {
        // quota exceeded
      }
    }
    try {
      setAutoSaveMsg('Saving...');
      await apiClient.post('/photographers/kyc', {
        isDraft: true,
        businessName: formData.businessName,
        businessType: formData.businessType,
        registeredCity: formData.registeredCity,
        region: formData.region,
        categories: formData.categories,
        ghanaCardNumber: formData.ghanaCardNumber,
        dateOfBirth: formData.dateOfBirth,
        ghanaCardFront: formData.ghanaCardFront,
        ghanaCardBack: formData.ghanaCardBack,
        faceVerificationVideo: formData.faceVerificationVideo,
        packages: formData.packages,
        yearsExperience: formData.yearsExperience,
        portfolioLinks: formData.portfolioLinks,
        preferredBank: formData.preferredBank,
        accountNumber: formData.accountNumber,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone
      });
      setAutoSaveMsg('Saved');
      setTimeout(() => setAutoSaveMsg(null), 2000);
    } catch (e) {
      setAutoSaveMsg(null);
    }
  };

  // Next Step / Final Submission
  const handleNext = async () => {
    // Validate step 5 momo network
    if (currentStep === 5) {
      const momoErr = getMomoNetworkError();
      if (momoErr) {
        alert(momoErr);
        return;
      }
    }

    if (currentStep < totalSteps) {
      // Auto-save on next
      autoSaveDraft();
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Final submission
      setIsSubmitting(true);
      try {
        await apiClient.post('/photographers/kyc', {
          isDraft: false,
          businessName: formData.businessName,
          businessType: formData.businessType,
          registeredCity: formData.registeredCity,
          region: formData.region,
          categories: formData.categories,
          ghanaCardNumber: formData.ghanaCardNumber,
          dateOfBirth: formData.dateOfBirth,
          ghanaCardFront: formData.ghanaCardFront,
          ghanaCardBack: formData.ghanaCardBack,
          faceVerificationVideo: formData.faceVerificationVideo,
          packages: formData.packages,
          yearsExperience: formData.yearsExperience,
          portfolioLinks: formData.portfolioLinks,
          preferredBank: formData.preferredBank,
          accountNumber: formData.accountNumber,
          emergencyContactName: formData.emergencyContactName,
          emergencyContactPhone: formData.emergencyContactPhone
        });

        // Update profile
        await apiClient.patch('/photographers/profile', {
          bio: `${formData.businessName || 'Master Studio'} • ${formData.businessType}`,
          services: formData.categories,
          service_area: formData.registeredCity,
          region: formData.region,
          portfolioWebsite: formData.portfolioLinks
        });

        if (typeof window !== 'undefined') {
          localStorage.setItem('clickflicks_photographer_kyc_completed', 'true');
          localStorage.setItem('clickflicks_photographer_kyc_status', 'submitted');
          localStorage.removeItem('clickflicks_photographer_kyc_local_draft');
        }

        onComplete();
      } catch (err: any) {
        console.error('KYC submission error:', err);
        const errorMsg = err?.response?.data?.message || err?.message || 'Failed to submit verification. Please check your network and details and try again.';
        alert(errorMsg);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBack = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (onSkip) {
      onSkip();
    }
  };

  const isApproved = verificationStatus === 'APPROVED' || verificationStatus === 'VERIFIED';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between p-4 sm:p-6 pb-12 text-gray-900">
      <div>
        {/* Top Header Navigation */}
        <div className="flex justify-between items-center mb-4 pt-4">
          <button 
            type="button"
            onClick={handleBack} 
            className="p-2 -ml-2 text-gray-700 hover:text-gray-900 bg-white border border-gray-200 rounded-xl cursor-pointer shadow-xs"
            title="Go Back"
          >
            <Icons.ArrowLeft size={18} />
          </button>
          
          <div className="flex flex-col items-center">
            <div className="flex items-center space-x-1">
              <span className="text-xs font-black text-teal-800">Step {currentStep}</span>
              <span className="text-xs text-gray-400 font-bold">/ {totalSteps}</span>
            </div>
            {autoSaveMsg && (
              <span className="text-[10px] text-teal-700 font-bold animate-pulse">{autoSaveMsg}</span>
            )}
          </div>

          {onSkip ? (
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSkip();
              }} 
              className="px-3 py-1.5 text-xs font-bold text-gray-700 hover:text-gray-900 bg-white border border-gray-200 rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              Exit Studio
            </button>
          ) : <div className="w-8" />}
        </div>

        {/* Status / Resumable Banner */}
        {verificationStatus === 'PENDING' && (
          <div className="mb-4 bg-teal-50 border border-teal-200 p-3 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-teal-600 animate-ping" />
              <p className="text-xs font-bold text-teal-950">
                KYC Incomplete / Under Review • All steps remain freely editable
              </p>
            </div>
            <span className="text-[10px] uppercase font-black px-2 py-0.5 bg-teal-200/80 text-teal-900 rounded-lg">
              Draft Editable
            </span>
          </div>
        )}

        {/* Step Indicator Pills (Allows jumping directly to any step) */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar py-2 mb-4">
          {stepTitles.map((st, idx) => {
            const stepNum = idx + 1;
            const isDone = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;
            return (
              <button
                key={stepNum}
                type="button"
                onClick={() => {
                  autoSaveDraft();
                  setCurrentStep(stepNum);
                }}
                className={`flex-1 min-w-[36px] py-1.5 px-2 rounded-xl text-[10px] font-black tracking-wider transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-teal-700 text-white shadow-sm'
                    : isDone
                    ? 'bg-teal-100 text-teal-900 hover:bg-teal-200'
                    : 'bg-white border border-gray-200 text-gray-400 hover:text-gray-700'
                }`}
                title={st.title}
              >
                {stepNum}
              </button>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mb-6">
          <motion.div 
            className="bg-teal-700 h-full"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Title Header */}
        <motion.div 
          key={currentStep}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-serif font-black italic text-gray-900 mb-1">
            {stepTitles[currentStep - 1].title}
          </h1>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            {stepTitles[currentStep - 1].desc}
          </p>
        </motion.div>

        {/* Dynamic Form Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            className="space-y-4"
          >
            {/* ============================================ */}
            {/* STEP 1: STUDIO IDENTITY & SERVICE AREA       */}
            {/* ============================================ */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-700 block mb-1">
                    Business / Brand Name
                  </label>
                  <input 
                    type="text" 
                    value={formData.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    placeholder="e.g. Luminary Frames Studio" 
                    className="w-full bg-white border border-gray-300 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-teal-700/20"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-700 block mb-1">
                    Business Structure
                  </label>
                  <select 
                    value={formData.businessType}
                    onChange={(e) => handleInputChange('businessType', e.target.value)}
                    className="w-full bg-white border border-gray-300 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none cursor-pointer"
                  >
                    <option>Solo Independent Freelancer</option>
                    <option>Registered Sole Proprietorship</option>
                    <option>Limited Liability Company (LLC)</option>
                    <option>Media Production Agency</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-700 block mb-1">
                      Operating City
                    </label>
                    <input 
                      type="text" 
                      value={formData.registeredCity}
                      onChange={(e) => handleCityChange(e.target.value)}
                      placeholder="e.g. Accra, Kumasi, Takoradi" 
                      className="w-full bg-white border border-gray-300 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-teal-700/20"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-700 block mb-1">
                      Ghana Region
                    </label>
                    <select 
                      value={formData.region}
                      onChange={(e) => handleInputChange('region', e.target.value)}
                      className="w-full bg-white border border-gray-300 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none cursor-pointer"
                    >
                      {GHANA_REGIONS.map(reg => (
                        <option key={reg} value={reg}>{reg} Region</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Categories with high-contrast text and instant persistence */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-700 block mb-1">
                    Photography & Media Disciplines (Tap to select)
                  </label>
                  <p className="text-[11px] text-gray-500 mb-3">
                    Selected disciplines will appear in search results for direct client bookings.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES_LIST.map(cat => {
                      const isSelected = formData.categories.includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            const current = formData.categories;
                            const next = isSelected
                              ? current.filter(c => c !== cat.id)
                              : [...current, cat.id];
                            handleInputChange('categories', next.length > 0 ? next : [cat.id]);
                          }}
                          className={`px-3.5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center space-x-2 cursor-pointer shadow-xs ${
                            isSelected
                              ? 'bg-teal-700 text-white border-2 border-teal-700 shadow-md scale-[1.02]'
                              : 'bg-white border-2 border-gray-300 text-gray-900 hover:border-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-base">{cat.icon}</span>
                          <span className={isSelected ? 'text-white' : 'text-gray-950 font-black'}>
                            {cat.label}
                          </span>
                          {isSelected && <Icons.Check size={14} className="text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* STEP 2: GHANA CARD, DOB & BIOMETRIC FACE LIVENESS RECORDING */}
            {/* ============================================================ */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-700 block mb-1">
                    Ghana Card PIN Number
                  </label>
                  <input 
                    type="text" 
                    value={formData.ghanaCardNumber}
                    onChange={(e) => handleInputChange('ghanaCardNumber', e.target.value.toUpperCase())}
                    placeholder="GHA-000000000-0" 
                    className="w-full bg-white border border-gray-300 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none uppercase focus:ring-2 focus:ring-teal-700/20"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-700 block mb-1">
                    Date of Birth (as printed on Ghana Card)
                  </label>
                  <input 
                    type="date" 
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    className="w-full bg-white border border-gray-300 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none cursor-pointer focus:ring-2 focus:ring-teal-700/20"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Required for matching verification against your uploaded National ID document.
                  </p>
                </div>

                {/* Ghana Card Image Uploads with Live Image Previews */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-700 block mb-2">
                    Ghana Card Images (Front & Back Preview)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                    {/* Front Upload / Preview Box */}
                    <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-3 flex flex-col items-center justify-center min-h-[160px] text-center overflow-hidden">
                      {formData.ghanaCardFront ? (
                        <div className="w-full relative group">
                          <img 
                            src={formData.ghanaCardFront} 
                            alt="Ghana Card Front Preview" 
                            className="w-full h-32 object-cover rounded-xl shadow-xs"
                          />
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-[10px] font-black text-teal-800 uppercase flex items-center gap-1">
                              <Icons.CheckCircle size={12} /> Front Uploaded
                            </span>
                            <button
                              type="button"
                              onClick={() => frontInputRef.current?.click()}
                              className="text-[10px] font-bold text-gray-700 hover:text-gray-900 underline cursor-pointer"
                            >
                              Change
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          onClick={() => frontInputRef.current?.click()}
                          className="w-full py-6 cursor-pointer flex flex-col items-center"
                        >
                          <Icons.Upload size={24} className="text-gray-400 mb-1" />
                          <span className="text-xs font-black text-gray-900">Upload Card Front</span>
                          <span className="text-[10px] text-gray-400">PNG, JPG or PDF</span>
                        </div>
                      )}
                    </div>

                    {/* Back Upload / Preview Box */}
                    <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-3 flex flex-col items-center justify-center min-h-[160px] text-center overflow-hidden">
                      {formData.ghanaCardBack ? (
                        <div className="w-full relative group">
                          <img 
                            src={formData.ghanaCardBack} 
                            alt="Ghana Card Back Preview" 
                            className="w-full h-32 object-cover rounded-xl shadow-xs"
                          />
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-[10px] font-black text-teal-800 uppercase flex items-center gap-1">
                              <Icons.CheckCircle size={12} /> Back Uploaded
                            </span>
                            <button
                              type="button"
                              onClick={() => backInputRef.current?.click()}
                              className="text-[10px] font-bold text-gray-700 hover:text-gray-900 underline cursor-pointer"
                            >
                              Change
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          onClick={() => backInputRef.current?.click()}
                          className="w-full py-6 cursor-pointer flex flex-col items-center"
                        >
                          <Icons.Upload size={24} className="text-gray-400 mb-1" />
                          <span className="text-xs font-black text-gray-900">Upload Card Back</span>
                          <span className="text-[10px] text-gray-400">PNG, JPG or PDF</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Biometric Face Verification Video Recording */}
                <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                        <Icons.Video size={16} className="text-teal-700" />
                        Biometric Face Verification
                      </h3>
                      <p className="text-[11px] text-gray-500">
                        Record a short head-movement video (left, right, up, down) to match against your Ghana card photo.
                      </p>
                    </div>
                  </div>

                  {cameraError && (
                    <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-medium">
                      {cameraError}
                    </div>
                  )}

                  {/* Active Camera / Recording View */}
                  {isCameraActive ? (
                    <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center max-h-[320px]">
                      <video 
                        ref={videoRef} 
                        playsInline 
                        muted 
                        autoPlay 
                        className="w-full h-full object-cover mirror transform scale-x-[-1]"
                      />

                      {/* Head Movement Prompt Overlay */}
                      <div className="absolute inset-0 flex flex-col items-center justify-between p-4 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none">
                        <div className="bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-md">
                          <span className="text-xs font-black text-white flex items-center gap-1.5">
                            {isRecordingFace ? (
                              <>
                                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                                {facePrompts[facePromptIndex].title}
                              </>
                            ) : (
                              'Position face inside frame'
                            )}
                          </span>
                        </div>

                        {/* Oval Face Guide */}
                        <div className={`w-48 h-56 border-2 border-dashed rounded-[50%] transition-colors duration-300 ${
                          isRecordingFace ? 'border-teal-400 shadow-lg shadow-teal-500/30' : 'border-white/60'
                        }`} />

                        <div className="text-center">
                          <p className="text-[11px] font-bold text-white/90">
                            {isRecordingFace 
                              ? facePrompts[facePromptIndex].desc 
                              : 'Tap "Record Video" below when ready'}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Controls */}
                      <div className="absolute bottom-3 left-0 right-0 flex justify-center items-center gap-3">
                        {!isRecordingFace ? (
                          <>
                            <button
                              type="button"
                              onClick={startFaceRecording}
                              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md"
                            >
                              <Icons.Camera size={14} /> Start 6s Recording
                            </button>
                            <button
                              type="button"
                              onClick={stopCameraStream}
                              className="px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold backdrop-blur-md cursor-pointer"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <div className="bg-red-600/90 text-white px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-2 animate-pulse">
                            <span className="h-2 w-2 bg-white rounded-full" />
                            Recording Head Movements...
                          </div>
                        )}
                      </div>
                    </div>
                  ) : formData.faceVerificationVideo ? (
                    /* Recorded Video Preview */
                    <div className="space-y-3">
                      <div className="rounded-xl overflow-hidden bg-black max-h-[260px] flex items-center justify-center">
                        <video 
                          src={formData.faceVerificationVideo} 
                          controls 
                          playsInline 
                          className="w-full max-h-[260px] object-contain"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-teal-800 flex items-center gap-1">
                          <Icons.CheckCircle size={14} /> Face Liveness Video Captured
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            handleInputChange('faceVerificationVideo', null);
                            startCamera();
                          }}
                          className="text-xs font-black text-gray-700 hover:text-gray-900 underline cursor-pointer"
                        >
                          Retake Video
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Prompt to Start Camera */
                    <div 
                      onClick={startCamera}
                      className="border-2 border-dashed border-teal-300 bg-teal-50/50 hover:bg-teal-50 rounded-xl p-6 text-center cursor-pointer transition-colors flex flex-col items-center"
                    >
                      <div className="h-12 w-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-800 mb-2">
                        <Icons.Video size={22} />
                      </div>
                      <span className="text-xs font-black text-gray-900">Start Head-Movement Video Verification</span>
                      <span className="text-[10px] text-gray-500 mt-1 max-w-xs">
                        Requires camera permission. Guides you through moving your head left, right, up, and down.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* STEP 3: PACKAGES & OFFERINGS (Replaces TIN Number!)          */}
            {/* ============================================================ */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-700 block">
                      Studio Packages & Rates
                    </label>
                    <p className="text-[11px] text-gray-500">
                      Clients book these packages directly. Upload package flyer pictures so clients see your full offering.
                    </p>
                  </div>
                  {!isAddingPackage && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPkgIndex(null);
                        setNewPkgName('');
                        setNewPkgPrice(1000);
                        setNewPkgDays(3);
                        setNewPkgDescription('');
                        setNewPkgFeatures('');
                        setNewPkgImage('');
                        setIsAddingPackage(true);
                      }}
                      className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <Icons.Plus size={14} /> Add Package
                    </button>
                  )}
                </div>

                {/* Package Creator / Editor Form */}
                {isAddingPackage ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border-2 border-teal-500 rounded-2xl p-4 space-y-3 shadow-md"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-black text-gray-900">
                        {editingPkgIndex !== null ? 'Edit Package' : 'Create New Package'}
                      </h4>
                      <button 
                        type="button"
                        onClick={() => setIsAddingPackage(false)}
                        className="text-gray-400 hover:text-gray-600 text-xs font-bold"
                      >
                        Cancel
                      </button>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-600 block mb-1">
                        Package Name
                      </label>
                      <input 
                        type="text" 
                        value={newPkgName}
                        onChange={(e) => setNewPkgName(e.target.value)}
                        placeholder="e.g. Deluxe Wedding Package, Studio Portrait Special" 
                        className="w-full bg-gray-50 border border-gray-300 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-600 block mb-1">
                          Price (GH₵)
                        </label>
                        <input 
                          type="number" 
                          value={newPkgPrice}
                          onChange={(e) => setNewPkgPrice(Number(e.target.value))}
                          className="w-full bg-gray-50 border border-gray-300 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-600 block mb-1">
                          Turnaround (Days)
                        </label>
                        <input 
                          type="number" 
                          value={newPkgDays}
                          onChange={(e) => setNewPkgDays(Number(e.target.value))}
                          className="w-full bg-gray-50 border border-gray-300 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-600 block mb-1">
                        Occasion Type
                      </label>
                      <select 
                        value={newPkgOccasion}
                        onChange={(e) => setNewPkgOccasion(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-300 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none cursor-pointer"
                      >
                        <option value="PORTRAIT">Portrait</option>
                        <option value="WEDDING">Wedding</option>
                        <option value="EVENTS">Events</option>
                        <option value="MOBILE_PHOTOGRAPHY">Mobile Photography</option>
                        <option value="PHOTOJOURNALISM">Photojournalism</option>
                        <option value="FASHION">Fashion</option>
                        <option value="PRODUCT">Product</option>
                        <option value="REAL_ESTATE">Real Estate</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-600 block mb-1">
                        Deliverables (One per line)
                      </label>
                      <textarea 
                        rows={3}
                        value={newPkgFeatures}
                        onChange={(e) => setNewPkgFeatures(e.target.value)}
                        placeholder="25 Retouched High-Res Photos&#10;Online Gallery Access&#10;2 Outfit Changes"
                        className="w-full bg-gray-50 border border-gray-300 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none"
                      />
                    </div>

                    {/* Flyer / Picture Upload */}
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-600 block mb-1">
                        Upload Package Flyer / Price Menu Picture (Optional)
                      </label>
                      <input 
                        type="file" 
                        ref={packageImageRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handlePackageImageUpload}
                      />
                      {newPkgImage ? (
                        <div className="relative inline-block mt-1">
                          <img 
                            src={newPkgImage} 
                            alt="Package Flyer Preview" 
                            className="w-28 h-28 object-cover rounded-xl border border-teal-500 shadow-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setNewPkgImage('')}
                            className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full text-xs cursor-pointer shadow-md"
                          >
                            <Icons.X size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => packageImageRef.current?.click()}
                          className="w-full py-3 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Icons.Upload size={14} /> Upload Flyer / Menu Image
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleSavePackage}
                      className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-black cursor-pointer shadow-md"
                    >
                      {editingPkgIndex !== null ? 'Update Package' : 'Save Package'}
                    </button>
                  </motion.div>
                ) : null}

                {/* Packages List in Button Format */}
                <div className="space-y-2.5">
                  {formData.packages.length === 0 ? (
                    <div className="text-center py-8 bg-white border border-gray-200 rounded-2xl p-4">
                      <Icons.Package size={32} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-xs font-black text-gray-700">No Packages Created Yet</p>
                      <p className="text-[10px] text-gray-400">Click "Add Package" above to set your rates & upload flyers.</p>
                    </div>
                  ) : (
                    formData.packages.map((pkg, idx) => (
                      <div 
                        key={idx}
                        className="bg-white border border-gray-300 hover:border-teal-600 rounded-2xl p-3 flex items-center justify-between transition-all shadow-xs"
                      >
                        {/* Package Button: Tap to open full picture & details modal */}
                        <button
                          type="button"
                          onClick={() => setPreviewPackage(pkg)}
                          className="flex-1 text-left flex items-center space-x-3 cursor-pointer group"
                        >
                          {pkg.imageUrl ? (
                            <img 
                              src={pkg.imageUrl} 
                              alt={pkg.name} 
                              className="w-12 h-12 object-cover rounded-xl border border-gray-200 group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800">
                              <Icons.Package size={20} />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-black text-gray-900 group-hover:text-teal-800">
                                {pkg.name}
                              </h4>
                              {pkg.imageUrl && (
                                <span className="text-[9px] bg-teal-100 text-teal-900 px-1.5 py-0.5 rounded-md font-black flex items-center gap-0.5">
                                  <Icons.Image size={10} /> Flyer
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] font-black text-teal-700 mt-0.5">
                              GH₵ {pkg.price.toLocaleString()} • {pkg.deliveryDays} Days Delivery
                            </p>
                            <span className="text-[9px] font-bold text-gray-400 group-hover:underline">
                              Tap to view flyer & details →
                            </span>
                          </div>
                        </button>

                        <div className="flex items-center space-x-1 pl-2">
                          <button
                            type="button"
                            onClick={() => handleEditPackage(pkg, idx)}
                            className="p-2 text-gray-500 hover:text-gray-900 cursor-pointer"
                            title="Edit Package"
                          >
                            <Icons.Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePackage(idx)}
                            className="p-2 text-red-400 hover:text-red-600 cursor-pointer"
                            title="Delete Package"
                          >
                            <Icons.Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* STEP 4: CREATIVE PORTFOLIO & EXPERIENCE                     */}
            {/* ============================================================ */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-700 block mb-1">
                    Years in Photography / Media Industry
                  </label>
                  <select 
                    value={formData.yearsExperience}
                    onChange={(e) => handleInputChange('yearsExperience', e.target.value)}
                    className="w-full bg-white border border-gray-300 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none cursor-pointer"
                  >
                    <option>1-2 years</option>
                    <option>3-5 years</option>
                    <option>5-10 years</option>
                    <option>10+ years (Master)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-700 block mb-1">
                    Website or Instagram Portfolio Link
                  </label>
                  <input 
                    type="text" 
                    value={formData.portfolioLinks}
                    onChange={(e) => handleInputChange('portfolioLinks', e.target.value)}
                    placeholder="https://instagram.com/yourhandle or website URL" 
                    className="w-full bg-white border border-gray-300 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-teal-700/20"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Clients will be able to see verified work samples from your public profile.
                  </p>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* STEP 5: ESCROW SETTLEMENT & PAYOUT CHANNEL                  */}
            {/* ============================================================ */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-700 block mb-1">
                    Primary Settlement Channel
                  </label>
                  <select 
                    value={formData.preferredBank}
                    onChange={(e) => handleInputChange('preferredBank', e.target.value)}
                    className="w-full bg-white border border-gray-300 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none cursor-pointer"
                  >
                    <option value="MTN Mobile Money">MTN Mobile Money</option>
                    <option value="Vodafone Cash (Telecel)">Vodafone Cash (Telecel)</option>
                    <option value="AT Money (AirtelTigo)">AT Money (AirtelTigo)</option>
                    <option value="GCB Bank">GCB Bank</option>
                    <option value="Stanbic Bank Ghana">Stanbic Bank Ghana</option>
                    <option value="Ecobank Ghana">Ecobank Ghana</option>
                    <option value="Zenith Bank Ghana">Zenith Bank Ghana</option>
                    <option value="CalBank">CalBank</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-700 block mb-1">
                    Mobile Money / Account Number
                  </label>
                  <input 
                    type="text" 
                    value={formData.accountNumber}
                    onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                    placeholder="e.g. 024 123 4567" 
                    className="w-full bg-white border border-gray-300 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-teal-700/20"
                  />
                  
                  {/* Ghana Telecom Prefix Check Alert */}
                  {getMomoNetworkError() && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700">
                      {getMomoNetworkError()}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-700 block mb-1">
                    Account Name (Registered on MoMo / Bank)
                  </label>
                  <input 
                    type="text" 
                    value={formData.accountName}
                    onChange={(e) => handleInputChange('accountName', e.target.value)}
                    placeholder="e.g. Kwadwo Antwi" 
                    className="w-full bg-white border border-gray-300 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-teal-700/20"
                  />
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* STEP 6: EMERGENCY GUARANTOR CONTACT                         */}
            {/* ============================================================ */}
            {currentStep === 6 && (
              <div className="space-y-4">
                <div className="bg-teal-50 border border-teal-200 p-3 rounded-2xl">
                  <p className="text-xs font-bold text-teal-950">
                    🛡️ Emergency Contact Protection
                  </p>
                  <p className="text-[11px] text-teal-800 mt-1">
                    In case of unforeseen circumstances during an active booking or location shoot, this emergency contact is kept on record in the Admin Dashboard and provided to the booked client for safety and coordination.
                  </p>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-700 block mb-1">
                    Emergency Contact / Guarantor Full Name
                  </label>
                  <input 
                    type="text" 
                    value={formData.emergencyContactName}
                    onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                    placeholder="e.g. Kwame Mensah" 
                    className="w-full bg-white border border-gray-300 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-teal-700/20"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-700 block mb-1">
                    Emergency Contact Phone Number
                  </label>
                  <input 
                    type="tel" 
                    value={formData.emergencyContactPhone}
                    onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                    placeholder="e.g. 024 000 0000" 
                    className="w-full bg-white border border-gray-300 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-teal-700/20"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-700 block mb-1">
                    Relationship to You
                  </label>
                  <select 
                    value={formData.emergencyContactRelation}
                    onChange={(e) => handleInputChange('emergencyContactRelation', e.target.value)}
                    className="w-full bg-white border border-gray-300 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none cursor-pointer"
                  >
                    <option>Guarantor / Next of Kin</option>
                    <option>Spouse / Partner</option>
                    <option>Parent / Guardian</option>
                    <option>Sibling</option>
                    <option>Studio Manager / Business Partner</option>
                  </select>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* STEP 7: ARTISAN CHARTER & FINAL AGREEMENT                   */}
            {/* ============================================================ */}
            {currentStep === 7 && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-gray-300 text-xs text-gray-700 space-y-3 leading-relaxed max-h-56 overflow-y-auto no-scrollbar shadow-xs">
                  <p className="font-black text-gray-900">ClickFlicks Master Artisan Code of Ethics:</p>
                  <p>1. <strong>Punctuality & Reliability</strong>: Arrive at client locations at least 15 minutes prior to booking start time.</p>
                  <p>2. <strong>Delivery Standard</strong>: Deliver agreed retouched gallery assets within the turnaround timeframe stated in your packages.</p>
                  <p>3. <strong>Escrow Settlement</strong>: All booking deposits and milestones are held securely by ClickFlicks escrow until client sign-off.</p>
                  <p>4. <strong>Safety & Conduct</strong>: Treat all clients, models, and venues with professional courtesy and respect.</p>
                </div>

                <label className="flex items-start space-x-3 cursor-pointer pt-2">
                  <input 
                    type="checkbox" 
                    checked={formData.agreedToTerms}
                    onChange={(e) => handleInputChange('agreedToTerms', e.target.checked)}
                    className="mt-1 accent-teal-700 h-4 w-4 rounded cursor-pointer"
                  />
                  <span className="text-xs text-gray-700 font-medium">
                    I certify that all supplied details, Ghana card credentials, packages, and payout information are accurate under the laws of Ghana.
                  </span>
                </label>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action Footer */}
      <div className="pt-6 space-y-3">
        <button
          type="button"
          onClick={handleNext}
          disabled={isSubmitting || (currentStep === totalSteps && !formData.agreedToTerms)}
          className="w-full bg-teal-800 hover:bg-teal-900 text-white py-4 sm:py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center space-x-2 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
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

        {onSkip && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSkip();
            }}
            className="w-full py-2 text-center text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
          >
            I'll complete verification later
          </button>
        )}
      </div>

      {/* ============================================================ */}
      {/* PACKAGE FLYER PREVIEW MODAL                                  */}
      {/* ============================================================ */}
      <AnimatePresence>
        {previewPackage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-black text-gray-900 truncate">
                  {previewPackage.name}
                </h3>
                <button
                  type="button"
                  onClick={() => setPreviewPackage(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full cursor-pointer"
                >
                  <Icons.X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 overflow-y-auto space-y-4">
                {previewPackage.imageUrl ? (
                  <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
                    <img 
                      src={previewPackage.imageUrl} 
                      alt={previewPackage.name} 
                      className="w-full max-h-72 object-contain mx-auto"
                    />
                  </div>
                ) : (
                  <div className="py-8 bg-gray-50 rounded-2xl text-center">
                    <Icons.Package size={36} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-xs text-gray-500 font-bold">No flyer picture uploaded for this package</p>
                  </div>
                )}

                <div className="flex items-center justify-between bg-teal-50 p-3 rounded-2xl border border-teal-100">
                  <div>
                    <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">Price</span>
                    <span className="text-base font-black text-teal-900">
                      GH₵ {previewPackage.price.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">Turnaround</span>
                    <span className="text-xs font-black text-teal-900">
                      {previewPackage.deliveryDays} Days
                    </span>
                  </div>
                </div>

                {previewPackage.description && (
                  <div>
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Description</h4>
                    <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-xl">
                      {previewPackage.description}
                    </p>
                  </div>
                )}

                {Array.isArray(previewPackage.features) && previewPackage.features.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Deliverables</h4>
                    <ul className="space-y-1.5">
                      {previewPackage.features.map((feat, fi) => (
                        <li key={fi} className="text-xs font-bold text-gray-800 flex items-center gap-2">
                          <Icons.CheckCircle size={14} className="text-teal-700 flex-shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setPreviewPackage(null)}
                  className="w-full py-3 bg-gray-900 text-white rounded-xl text-xs font-black cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhotographerKYC;
