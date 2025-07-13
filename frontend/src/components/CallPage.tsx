import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import { AxiosError as AxiosErrorType } from 'axios';
import {
  PhoneIcon,
  PhoneXMarkIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  UserIcon,
  SignalIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  GlobeAltIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import {
  PhoneIcon as PhoneIconSolid,
  PhoneXMarkIcon as PhoneXMarkIconSolid,
} from '@heroicons/react/24/solid';

// Types
interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  format: string;
}

interface ConversationEntry {
  role: 'ai' | 'human';
  message: string;
  timestamp: Date;
}

interface Call {
  _id: string;
  callId: string;
  phoneNumber: string;
  leadName: string;
  status:
    | 'initiated'
    | 'ringing'
    | 'answered'
    | 'in_progress'
    | 'completed'
    | 'failed';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  conversation: ConversationEntry[];
  outcome?: string;
  qualificationScore?: number;
  meetingBooked?: boolean;
  createdAt: Date;
}

interface CallStats {
  totalCalls: number;
  successfulCalls: number;
  averageDuration: number;
  conversionRate: number;
}

// Country data
const COUNTRIES: Country[] = [
  {
    code: 'US',
    name: 'United States',
    dialCode: '+1',
    flag: '🇺🇸',
    format: '(###) ###-####',
  },
  {
    code: 'CA',
    name: 'Canada',
    dialCode: '+1',
    flag: '🇨🇦',
    format: '(###) ###-####',
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    dialCode: '+44',
    flag: '🇬🇧',
    format: '#### ### ####',
  },
  {
    code: 'AU',
    name: 'Australia',
    dialCode: '+61',
    flag: '🇦🇺',
    format: '### ### ###',
  },
  {
    code: 'IN',
    name: 'India',
    dialCode: '+91',
    flag: '🇮🇳',
    format: '##### #####',
  },
  {
    code: 'DE',
    name: 'Germany',
    dialCode: '+49',
    flag: '🇩🇪',
    format: '### #######',
  },
  {
    code: 'FR',
    name: 'France',
    dialCode: '+33',
    flag: '🇫🇷',
    format: '## ## ## ## ##',
  },
  {
    code: 'ES',
    name: 'Spain',
    dialCode: '+34',
    flag: '🇪🇸',
    format: '### ### ###',
  },
  {
    code: 'IT',
    name: 'Italy',
    dialCode: '+39',
    flag: '🇮🇹',
    format: '### ### ####',
  },
  {
    code: 'JP',
    name: 'Japan',
    dialCode: '+81',
    flag: '🇯🇵',
    format: '##-####-####',
  },
  {
    code: 'KR',
    name: 'South Korea',
    dialCode: '+82',
    flag: '🇰🇷',
    format: '##-####-####',
  },
  {
    code: 'CN',
    name: 'China',
    dialCode: '+86',
    flag: '🇨🇳',
    format: '### #### ####',
  },
  {
    code: 'BR',
    name: 'Brazil',
    dialCode: '+55',
    flag: '🇧🇷',
    format: '## #####-####',
  },
  {
    code: 'MX',
    name: 'Mexico',
    dialCode: '+52',
    flag: '🇲🇽',
    format: '## #### ####',
  },
  {
    code: 'RU',
    name: 'Russia',
    dialCode: '+7',
    flag: '🇷🇺',
    format: '### ###-##-##',
  },
  {
    code: 'ZA',
    name: 'South Africa',
    dialCode: '+27',
    flag: '🇿🇦',
    format: '## ### ####',
  },
  {
    code: 'NG',
    name: 'Nigeria',
    dialCode: '+234',
    flag: '🇳🇬',
    format: '### ### ####',
  },
  {
    code: 'EG',
    name: 'Egypt',
    dialCode: '+20',
    flag: '🇪🇬',
    format: '## #### ####',
  },
  {
    code: 'AE',
    name: 'UAE',
    dialCode: '+971',
    flag: '🇦🇪',
    format: '## ### ####',
  },
  {
    code: 'SA',
    name: 'Saudi Arabia',
    dialCode: '+966',
    flag: '🇸🇦',
    format: '## ### ####',
  },
  {
    code: 'SG',
    name: 'Singapore',
    dialCode: '+65',
    flag: '🇸🇬',
    format: '#### ####',
  },
  {
    code: 'MY',
    name: 'Malaysia',
    dialCode: '+60',
    flag: '🇲🇾',
    format: '##-### ####',
  },
  {
    code: 'TH',
    name: 'Thailand',
    dialCode: '+66',
    flag: '🇹🇭',
    format: '##-###-####',
  },
  {
    code: 'PH',
    name: 'Philippines',
    dialCode: '+63',
    flag: '🇵🇭',
    format: '### ### ####',
  },
  {
    code: 'ID',
    name: 'Indonesia',
    dialCode: '+62',
    flag: '🇮🇩',
    format: '###-###-####',
  },
];

const CallPage: React.FC = () => {
  const { user } = useAuth();

  // Form state
  const [selectedCountry, setSelectedCountry] = useState<string>('US');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [leadName, setLeadName] = useState<string>('');
  const [aiPrompt, setAiPrompt] = useState<string>(
    'You are Mike, a real human sales rep who talks EXACTLY like a genuine person - not an AI or robot. You are warm, authentic, and conversational. Use natural speech patterns with hesitations and fillers like "um", "uh", "you know", "actually". Show authentic emotions and reactions like "Oh really?", "That\'s interesting!", "Wow!". Sound like you\'re having a real conversation with a friend. Be naturally curious about their business and ask questions like a genuinely interested person.'
  );

  // Call state
  const [currentCall, setCurrentCall] = useState<Call | null>(null);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // UI state
  const [recentCalls, setRecentCalls] = useState<Call[]>([]);
  const [callStats, setCallStats] = useState<CallStats>({
    totalCalls: 0,
    successfulCalls: 0,
    averageDuration: 0,
    conversionRate: 0,
  });
  const [isLoadingCalls, setIsLoadingCalls] = useState<boolean>(false);
  const [configStatus, setConfigStatus] = useState<any>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  // Computed values
  const selectedCountryData = useMemo(
    () =>
      COUNTRIES.find(country => country.code === selectedCountry) ||
      COUNTRIES[0],
    [selectedCountry]
  );

  const isCallActive = useMemo(
    () =>
      currentCall &&
      ['initiated', 'ringing', 'answered', 'in_progress'].includes(
        currentCall.status
      ),
    [currentCall]
  );

  const formattedCallDuration = useMemo(() => {
    const minutes = Math.floor(callDuration / 60);
    const seconds = callDuration % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [callDuration]);

  // Phone number formatting
  const formatPhoneNumber = useCallback(
    (value: string, format: string): string => {
      const cleaned = value.replace(/\D/g, '');
      let formatted = '';
      let cleanedIndex = 0;

      for (let i = 0; i < format.length && cleanedIndex < cleaned.length; i++) {
        if (format[i] === '#') {
          formatted += cleaned[cleanedIndex];
          cleanedIndex++;
        } else {
          formatted += format[i];
        }
      }

      return formatted;
    },
    []
  );

  const getFullPhoneNumber = useCallback((): string => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned ? `${selectedCountryData.dialCode}${cleaned}` : '';
  }, [phoneNumber, selectedCountryData.dialCode]);

  // Event handlers
  const handlePhoneNumberChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const formatted = formatPhoneNumber(value, selectedCountryData.format);
      setPhoneNumber(formatted);
    },
    [formatPhoneNumber, selectedCountryData.format]
  );

  const handleCountryChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newCountry = e.target.value;
      setSelectedCountry(newCountry);

      // Reformat phone number for new country
      if (phoneNumber) {
        const newCountryData =
          COUNTRIES.find(c => c.code === newCountry) || COUNTRIES[0];
        const cleaned = phoneNumber.replace(/\D/g, '');
        const reformatted = formatPhoneNumber(cleaned, newCountryData.format);
        setPhoneNumber(reformatted);
      }
    },
    [phoneNumber, formatPhoneNumber]
  );

  // API calls
  const checkConfigStatus = useCallback(async () => {
    try {
      const response = await api.get('/calls/config-status');
      setConfigStatus(response.data);
      setConfigError(null);

      if (!response.data.configured) {
        setConfigError(
          'API configuration incomplete. Please set up your Telnyx and OpenAI API keys.'
        );
      }
    } catch {
      // Log error silently in production
      setConfigError(
        'Unable to check API configuration. Please ensure the backend is running.'
      );
    }
  }, []);

  const fetchRecentCalls = useCallback(async () => {
    try {
      setIsLoadingCalls(true);
      const response = await api.get('/calls?limit=10');
      setRecentCalls(response.data.calls || []);

      // Calculate stats
      const calls = response.data.calls || [];
      const successful = calls.filter(
        (call: Call) => call.status === 'completed'
      ).length;
      const totalDuration = calls.reduce(
        (sum: number, call: Call) => sum + (call.duration || 0),
        0
      );
      const meetings = calls.filter((call: Call) => call.meetingBooked).length;

      setCallStats({
        totalCalls: calls.length,
        successfulCalls: successful,
        averageDuration:
          calls.length > 0 ? Math.round(totalDuration / calls.length) : 0,
        conversionRate:
          calls.length > 0 ? Math.round((meetings / calls.length) * 100) : 0,
      });
    } catch {
      // Log error silently in production
    } finally {
      setIsLoadingCalls(false);
    }
  }, []);

  const pollCallStatus = useCallback(async () => {
    if (!currentCall) return;

    try {
      const response = await api.get(`/calls/${currentCall._id}`);
      const updatedCall = response.data;

      setCurrentCall(updatedCall);

      if (
        updatedCall.status === 'completed' ||
        updatedCall.status === 'failed'
      ) {
        setCallDuration(0);
        await fetchRecentCalls();

        if (updatedCall.status === 'completed') {
          toast.success('Call completed successfully!');
        } else {
          toast.error('Call failed. Please try again.');
        }
      }
    } catch {
      // Log error silently in production
    }
  }, [currentCall, fetchRecentCalls]);

  const initiateCall = useCallback(async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    const fullNumber = getFullPhoneNumber();
    if (fullNumber.length < 8) {
      toast.error('Please enter a valid phone number');
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.post('/calls/initiate', {
        phoneNumber: fullNumber,
        leadName: leadName.trim() || 'Unknown Lead',
        aiPrompt: aiPrompt.trim(),
      });

      setCurrentCall(response.data);
      setCallDuration(0);
      toast.success('Call initiated successfully!');
    } catch (error: unknown) {
      const axiosError = error as AxiosErrorType;
      const errorData = axiosError.response?.data as { message?: string; details?: string; error?: string } | undefined;
      let errorMessage = 'Failed to initiate call. Please try again.';

      if (errorData?.message) {
        errorMessage = errorData.message;
        if (errorData.details) {
          errorMessage += ` ${errorData.details}`;
        }
      }

      toast.error(errorMessage);

      // Check config status again if it's a configuration error
      if (errorData?.error === 'Missing API credentials') {
        await checkConfigStatus();
      }
    } finally {
      setIsLoading(false);
    }
  }, [phoneNumber, leadName, aiPrompt, getFullPhoneNumber, checkConfigStatus]);

  const hangUpCall = useCallback(async () => {
    if (!currentCall) return;

    try {
      setIsLoading(true);
      await api.post(`/calls/${currentCall._id}/hangup`);

      setCurrentCall(null);
      setCallDuration(0);
      await fetchRecentCalls();
      toast.success('Call ended');
    } catch (error: unknown) {
      const axiosError = error as AxiosErrorType;
      const errorData = axiosError.response?.data as { message?: string } | undefined;
      toast.error(errorData?.message || 'Failed to hang up call');
    } finally {
      setIsLoading(false);
    }
  }, [currentCall, fetchRecentCalls]);

  const resetForm = useCallback(() => {
    setPhoneNumber('');
    setLeadName('');
    setSelectedCountry('US');
  }, []);

  // Effects
  useEffect(() => {
    fetchRecentCalls();
    checkConfigStatus();
  }, [fetchRecentCalls, checkConfigStatus]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isCallActive) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCallActive]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isCallActive) {
      interval = setInterval(pollCallStatus, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCallActive, pollCallStatus]);

  // Status badge component
  const StatusBadge: React.FC<{ status: Call['status'] }> = ({ status }) => {
    const statusConfig = {
      initiated: {
        color: 'bg-blue-100 text-blue-800',
        icon: ArrowPathIcon,
        text: 'Initiating',
      },
      ringing: {
        color: 'bg-yellow-100 text-yellow-800',
        icon: PhoneIcon,
        text: 'Ringing',
      },
      answered: {
        color: 'bg-green-100 text-green-800',
        icon: PhoneIconSolid,
        text: 'Answered',
      },
      in_progress: {
        color: 'bg-green-100 text-green-800',
        icon: PhoneIconSolid,
        text: 'In Progress',
      },
      completed: {
        color: 'bg-green-100 text-green-800',
        icon: CheckCircleIcon,
        text: 'Completed',
      },
      failed: {
        color: 'bg-red-100 text-red-800',
        icon: XCircleIcon,
        text: 'Failed',
      },
      busy: {
        color: 'bg-orange-100 text-orange-800',
        icon: PhoneXMarkIcon,
        text: 'Busy',
      },
      no_answer: {
        color: 'bg-gray-100 text-gray-800',
        icon: PhoneXMarkIcon,
        text: 'No Answer',
      },
    };

    const config = statusConfig[status] || statusConfig.initiated; // Fallback to 'initiated' if status not found
    const IconComponent = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        <IconComponent className='w-3 h-3 mr-1' />
        {config.text}
      </span>
    );
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white shadow-sm border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            <div className='flex items-center'>
              <PhoneIcon className='h-8 w-8 text-blue-600 mr-3' />
              <div>
                <h1 className='text-2xl font-bold text-gray-900'>
                  AI Sales Calls
                </h1>
                <p className='text-sm text-gray-500'>
                  Automated lead qualification and meeting booking
                </p>
              </div>
            </div>
            <div className='flex items-center space-x-4'>
              <div className='text-right'>
                <p className='text-sm font-medium text-gray-900'>
                  {user?.name}
                </p>
                <p className='text-xs text-gray-500'>{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Main Call Interface */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Call Stats */}
            <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
              <h2 className='text-lg font-semibold text-gray-900 mb-4'>
                Call Statistics
              </h2>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-blue-600'>
                    {callStats.totalCalls}
                  </div>
                  <div className='text-sm text-gray-500'>Total Calls</div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-green-600'>
                    {callStats.successfulCalls}
                  </div>
                  <div className='text-sm text-gray-500'>Successful</div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-purple-600'>
                    {callStats.averageDuration}s
                  </div>
                  <div className='text-sm text-gray-500'>Avg Duration</div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-orange-600'>
                    {callStats.conversionRate}%
                  </div>
                  <div className='text-sm text-gray-500'>Conversion</div>
                </div>
              </div>
            </div>

            {/* Configuration Status */}
            {configStatus && (
              <div
                className={`border rounded-lg p-4 mb-6 ${
                  configStatus.configured && configStatus.enhanced
                    ? 'bg-green-50 border-green-200'
                    : configStatus.configured
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-red-50 border-red-200'
                }`}
              >
                <div className='flex'>
                  {configStatus.configured && configStatus.enhanced ? (
                    <CheckCircleIcon className='h-5 w-5 text-green-400 mr-3 mt-0.5' />
                  ) : configStatus.configured ? (
                    <ExclamationTriangleIcon className='h-5 w-5 text-blue-400 mr-3 mt-0.5' />
                  ) : (
                    <XCircleIcon className='h-5 w-5 text-red-400 mr-3 mt-0.5' />
                  )}
                  <div className='flex-1'>
                    <h3
                      className={`text-sm font-medium ${
                        configStatus.configured && configStatus.enhanced
                          ? 'text-green-800'
                          : configStatus.configured
                            ? 'text-blue-800'
                            : 'text-red-800'
                      }`}
                    >
                      {configStatus.configured && configStatus.enhanced
                        ? 'Full Enhanced Features Active'
                        : configStatus.configured
                          ? 'Basic Features Active'
                          : 'Configuration Required'}
                    </h3>
                    <p
                      className={`text-sm mt-1 ${
                        configStatus.configured && configStatus.enhanced
                          ? 'text-green-700'
                          : configStatus.configured
                            ? 'text-blue-700'
                            : 'text-red-700'
                      }`}
                    >
                      {configStatus.message}
                    </p>

                    {/* Feature Status Grid */}
                    <div className='mt-3 grid grid-cols-2 md:grid-cols-4 gap-2'>
                      <div className='flex items-center text-xs'>
                        {configStatus.config?.telnyx_api_key ? (
                          <CheckCircleIcon className='h-4 w-4 text-green-500 mr-1' />
                        ) : (
                          <XCircleIcon className='h-4 w-4 text-red-500 mr-1' />
                        )}
                        <span>Telnyx Voice</span>
                      </div>
                      <div className='flex items-center text-xs'>
                        {configStatus.config?.openai_api_key ? (
                          <CheckCircleIcon className='h-4 w-4 text-green-500 mr-1' />
                        ) : (
                          <XCircleIcon className='h-4 w-4 text-red-500 mr-1' />
                        )}
                        <span>GPT-4 AI</span>
                      </div>
                      <div className='flex items-center text-xs'>
                        {configStatus.config?.deepgram_api_key ? (
                          <CheckCircleIcon className='h-4 w-4 text-green-500 mr-1' />
                        ) : (
                          <XCircleIcon className='h-4 w-4 text-gray-400 mr-1' />
                        )}
                        <span>Deepgram STT</span>
                      </div>
                      <div className='flex items-center text-xs'>
                        {configStatus.config?.elevenlabs_api_key ? (
                          <CheckCircleIcon className='h-4 w-4 text-green-500 mr-1' />
                        ) : (
                          <XCircleIcon className='h-4 w-4 text-gray-400 mr-1' />
                        )}
                        <span>ElevenLabs TTS</span>
                      </div>
                    </div>

                    {/* Missing Required APIs */}
                    {!configStatus.configured && (
                      <div className='mt-2 text-xs text-red-600'>
                        <p>
                          <strong>Missing Required APIs:</strong>
                        </p>
                        <ul className='list-disc list-inside ml-2'>
                          {!configStatus.config?.telnyx_api_key && (
                            <li>Telnyx API Key</li>
                          )}
                          {!configStatus.config?.telnyx_phone_number && (
                            <li>Telnyx Phone Number</li>
                          )}
                          {!configStatus.config?.openai_api_key && (
                            <li>OpenAI API Key</li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Optional Enhancement APIs */}
                    {configStatus.configured && !configStatus.enhanced && (
                      <div className='mt-2 text-xs text-blue-600'>
                        <p>
                          <strong>Optional Enhancement APIs:</strong>
                        </p>
                        <ul className='list-disc list-inside ml-2'>
                          {!configStatus.config?.deepgram_api_key && (
                            <li>
                              Deepgram API Key (for real-time speech
                              recognition)
                            </li>
                          )}
                          {!configStatus.config?.elevenlabs_api_key && (
                            <li>
                              ElevenLabs API Key (for ultra-realistic voice)
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {configError && !configStatus && (
              <div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-6'>
                <div className='flex'>
                  <ExclamationTriangleIcon className='h-5 w-5 text-red-400 mr-3 mt-0.5' />
                  <div>
                    <h3 className='text-sm font-medium text-red-800'>
                      Configuration Check Failed
                    </h3>
                    <p className='text-sm text-red-700 mt-1'>{configError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Call Interface */}
            <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
              <h2 className='text-lg font-semibold text-gray-900 mb-6'>
                Make a Call
              </h2>

              {/* Current Call Status */}
              {currentCall && (
                <div className='mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center'>
                      <SignalIcon className='h-5 w-5 text-blue-600 mr-2' />
                      <div>
                        <p className='font-medium text-blue-900'>
                          Calling {currentCall.leadName} (
                          {currentCall.phoneNumber})
                        </p>
                        <div className='flex items-center mt-1'>
                          <StatusBadge status={currentCall.status} />
                          {isCallActive && (
                            <>
                              <span className='mx-2 text-gray-400'>•</span>
                              <div className='flex items-center text-sm text-gray-600'>
                                <ClockIcon className='h-4 w-4 mr-1' />
                                {formattedCallDuration}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {isCallActive && (
                      <button
                        onClick={hangUpCall}
                        disabled={isLoading}
                        className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50'
                      >
                        <PhoneXMarkIconSolid className='h-4 w-4 mr-2' />
                        {isLoading ? 'Hanging up...' : 'Hang Up'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Call Form */}
              <div className='space-y-4'>
                {/* Country and Phone Number */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Country
                    </label>
                    <select
                      value={selectedCountry}
                      onChange={handleCountryChange}
                      disabled={!!isCallActive}
                      className='w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm'
                    >
                      {COUNTRIES.map(country => (
                        <option key={country.code} value={country.code}>
                          {country.flag} {country.name} ({country.dialCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Phone Number *
                    </label>
                    <div className='flex'>
                      <div className='flex items-center px-3 py-3 bg-gray-50 border border-r-0 border-gray-300 rounded-l-md'>
                        <span className='text-gray-600 text-sm font-medium whitespace-nowrap'>
                          {selectedCountryData.dialCode}
                        </span>
                      </div>
                      <input
                        type='tel'
                        value={phoneNumber}
                        onChange={handlePhoneNumberChange}
                        placeholder={selectedCountryData.format.replace(
                          /#/g,
                          '0'
                        )}
                        disabled={!!isCallActive}
                        className='flex-1 px-4 py-3 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm'
                      />
                    </div>
                    {phoneNumber && (
                      <p className='mt-1 text-xs text-gray-500'>
                        Full number: {getFullPhoneNumber()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Lead Name */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Lead Name (Optional)
                  </label>
                  <input
                    type='text'
                    value={leadName}
                    onChange={e => setLeadName(e.target.value)}
                    placeholder="Enter lead's name"
                    disabled={!!isCallActive}
                    className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100'
                  />
                </div>

                {/* AI Prompt */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    AI Sales Script
                    <div className='flex flex-wrap gap-2 mt-1'>
                      <span className='text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full'>
                        🧠 GPT-4 Powered
                      </span>
                      {configStatus?.config?.elevenlabs_api_key && (
                        <span className='text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full'>
                          🎤 ElevenLabs Voice
                        </span>
                      )}
                      {configStatus?.config?.deepgram_api_key && (
                        <span className='text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full'>
                          🎙️ Deepgram STT
                        </span>
                      )}
                      <span className='text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full'>
                        💬 Real-time Conversation
                      </span>
                    </div>
                  </label>
                  <textarea
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    rows={3}
                    disabled={!!isCallActive}
                    className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100'
                    placeholder='Customize how the AI should behave during the call...'
                  />
                  <div className='mt-2 text-xs text-gray-500'>
                    <p className='font-medium'>
                      🎯 Professional SDR with Enhanced Features:
                    </p>
                    <ul className='list-disc list-inside mt-1 space-y-1'>
                      <li>
                        Natural human conversation with GPT-4 intelligence
                      </li>
                      {configStatus?.config?.elevenlabs_api_key && (
                        <li>Ultra-realistic voice synthesis with ElevenLabs</li>
                      )}
                      {configStatus?.config?.deepgram_api_key && (
                        <li>Real-time speech recognition with Deepgram</li>
                      )}
                      <li>Contextual memory throughout the conversation</li>
                      <li>Professional qualification and lead scoring</li>
                    </ul>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className='flex space-x-3 pt-4'>
                  <button
                    onClick={initiateCall}
                    disabled={
                      isLoading || !!isCallActive || !phoneNumber.trim()
                    }
                    className='flex-1 inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    <PhoneIconSolid className='h-5 w-5 mr-2' />
                    {isLoading ? 'Initiating...' : 'Start Call'}
                  </button>

                  <button
                    onClick={resetForm}
                    disabled={!!isCallActive}
                    className='px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Live Conversation */}
            {currentCall &&
              currentCall.conversation &&
              currentCall.conversation.length > 0 && (
                <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                  <h2 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                    <ChatBubbleLeftRightIcon className='h-5 w-5 mr-2 text-blue-600' />
                    Live Conversation
                    <span className='ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full'>
                      🗣️ Human-like Conversation
                    </span>
                  </h2>
                  <div className='space-y-4 max-h-96 overflow-y-auto'>
                    {currentCall.conversation.map((entry, index) => (
                      <div
                        key={index}
                        className={`flex ${entry.role === 'ai' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-md px-4 py-3 rounded-lg shadow-sm ${
                            entry.role === 'ai'
                              ? 'bg-blue-50 text-blue-900 border border-blue-200'
                              : 'bg-green-50 text-green-900 border border-green-200'
                          }`}
                        >
                          <div className='flex items-center mb-2'>
                            <span className='text-xs font-semibold uppercase tracking-wide'>
                              {entry.role === 'ai'
                                ? '🗣️ Mike (Human-like AI)'
                                : '👤 Customer'}
                            </span>
                            <span className='text-xs text-gray-500 ml-2'>
                              {new Date(entry.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className='text-sm leading-relaxed'>
                            {entry.message}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className='mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
                    <div className='flex items-center'>
                      <span className='text-yellow-600 mr-2'>💡</span>
                      <span className='text-sm text-yellow-800'>
                        This is a live demonstration of ultra-natural human-like
                        AI conversation with authentic speech patterns
                      </span>
                    </div>
                  </div>
                </div>
              )}
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Recent Calls */}
            <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
              <div className='flex items-center justify-between mb-4'>
                <h2 className='text-lg font-semibold text-gray-900'>
                  Recent Calls
                </h2>
                <button
                  onClick={fetchRecentCalls}
                  disabled={isLoadingCalls}
                  className='p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md'
                >
                  <ArrowPathIcon
                    className={`h-4 w-4 ${isLoadingCalls ? 'animate-spin' : ''}`}
                  />
                </button>
              </div>

              {isLoadingCalls ? (
                <div className='space-y-3'>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className='animate-pulse'>
                      <div className='h-4 bg-gray-200 rounded mb-2'></div>
                      <div className='h-3 bg-gray-200 rounded w-3/4'></div>
                    </div>
                  ))}
                </div>
              ) : recentCalls.length === 0 ? (
                <div className='text-center py-8'>
                  <PhoneIcon className='h-12 w-12 text-gray-300 mx-auto mb-4' />
                  <p className='text-gray-500'>No calls yet</p>
                  <p className='text-sm text-gray-400'>
                    Your recent calls will appear here
                  </p>
                </div>
              ) : (
                <div className='space-y-3'>
                  {recentCalls.map(call => (
                    <div
                      key={call._id}
                      className='p-3 border border-gray-200 rounded-lg hover:bg-gray-50'
                    >
                      <div className='flex items-center justify-between mb-2'>
                        <div className='flex items-center'>
                          <UserIcon className='h-4 w-4 text-gray-400 mr-2' />
                          <span className='font-medium text-sm text-gray-900'>
                            {call.leadName}
                          </span>
                        </div>
                        <StatusBadge status={call.status} />
                      </div>
                      <div className='text-xs text-gray-500 space-y-1'>
                        <div className='flex items-center'>
                          <PhoneIcon className='h-3 w-3 mr-1' />
                          {call.phoneNumber}
                        </div>
                        <div className='flex items-center'>
                          <ClockIcon className='h-3 w-3 mr-1' />
                          {call.duration ? `${call.duration}s` : 'N/A'}
                        </div>
                        <div className='flex items-center'>
                          <GlobeAltIcon className='h-3 w-3 mr-1' />
                          {new Date(call.createdAt).toLocaleString()}
                        </div>
                      </div>
                      {call.meetingBooked && (
                        <div className='mt-2 text-xs text-green-600 font-medium'>
                          ✓ Meeting Booked
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Help & Tips */}
            <div className='bg-blue-50 rounded-xl border border-blue-200 p-6'>
              <h3 className='text-lg font-semibold text-blue-900 mb-3'>
                Tips for Success
              </h3>
              <ul className='space-y-2 text-sm text-blue-800'>
                <li className='flex items-start'>
                  <span className='text-blue-600 mr-2'>•</span>
                  Include country code for international numbers
                </li>
                <li className='flex items-start'>
                  <span className='text-blue-600 mr-2'>•</span>
                  Customize the AI script for your specific product
                </li>
                <li className='flex items-start'>
                  <span className='text-blue-600 mr-2'>•</span>
                  Monitor conversations in real-time
                </li>
                <li className='flex items-start'>
                  <span className='text-blue-600 mr-2'>•</span>
                  Review call outcomes to improve conversion
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallPage;
