import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MessageSquare,
  Smartphone,
  Bell,
  Clock,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Send,
  Sliders,
  Check,
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Info,
  Server,
  Zap,
  RotateCcw,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import whatsappService from '../../Api-Services/whatsappService';

const WhatsAppSettings = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [retryingFailed, setRetryingFailed] = useState(false);
  const [resendModalItem, setResendModalItem] = useState(null);
  const [resendingItem, setResendingItem] = useState(false);

  // Settings State
  const [settings, setSettings] = useState({
    integrationEnabled: false,
    otpVerificationEnabled: false,
    passActivationNotificationEnabled: false,
    eventReminderEnabled: false,
    fromNumberId: 'f401f874-6837-4091-b6a9-76d5c8031b21',
    connectedPhoneNumber: '919039035431',
    displayName: 'Renaissance University',
    otpTemplateName: 'rcf',
    otpTemplateLanguage: 'en',
    passActivationTemplateName: 'rcf_activation_pass',
    passActivationTemplateLanguage: 'en',
    eventReminderTemplateName: 'reminder_rcf',
    eventReminderTemplateLanguage: 'en',
    reminderTemplateName: 'reminder_rcf',
    reminderTemplateLanguage: 'en',
    reminderLeadHours: 24,
    lastConnectedStatus: 'UNKNOWN',
    lastTestedAt: null,
  });

  // Approved Templates from Botsense
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  // Outbound Message Logs State
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logSearch, setLogSearch] = useState('');
  const [logTypeFilter, setLogTypeFilter] = useState('');
  const [logStatusFilter, setLogStatusFilter] = useState('');
  const [logPage, setLogPage] = useState(0);
  const [logPageSize, setLogPageSize] = useState(10);
  const [logTotalPages, setLogTotalPages] = useState(0);
  const [logTotalElements, setLogTotalElements] = useState(0);

  // Initial Fetch
  useEffect(() => {
    fetchSettings();
    fetchTemplates();
    fetchLogs();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await whatsappService.getSettings();
      const data = res.data || res;
      if (data) {
        setSettings({
          integrationEnabled: Boolean(data.integrationEnabled),
          otpVerificationEnabled: Boolean(data.otpVerificationEnabled),
          passActivationNotificationEnabled: Boolean(data.passActivationNotificationEnabled),
          eventReminderEnabled: Boolean(data.eventReminderEnabled),
          fromNumberId: data.fromNumberId || 'f401f874-6837-4091-b6a9-76d5c8031b21',
          connectedPhoneNumber: data.connectedPhoneNumber || '919039035431',
          displayName: data.displayName || 'Renaissance University',
          otpTemplateName: data.otpTemplateName || 'rcf',
          otpTemplateLanguage: data.otpTemplateLanguage || 'en',
          passActivationTemplateName: data.passActivationTemplateName || 'rcf_activation_pass',
          passActivationTemplateLanguage: data.passActivationTemplateLanguage || 'en',
          eventReminderTemplateName: data.eventReminderTemplateName || data.reminderTemplateName || 'reminder_rcf',
          eventReminderTemplateLanguage: data.eventReminderTemplateLanguage || data.reminderTemplateLanguage || 'en',
          reminderTemplateName: data.eventReminderTemplateName || data.reminderTemplateName || 'reminder_rcf',
          reminderTemplateLanguage: data.eventReminderTemplateLanguage || data.reminderTemplateLanguage || 'en',
          reminderLeadHours: data.reminderLeadHours || 24,
          lastConnectedStatus: data.lastConnectedStatus || 'UNKNOWN',
          lastTestedAt: data.lastTestedAt,
        });
      }
    } catch (err) {
      console.error('Failed to load WhatsApp settings:', err);
      toast.error(err.message || 'Failed to fetch WhatsApp settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const res = await whatsappService.getTemplates();
      const list = res.data || res || [];
      setTemplates(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const fetchLogs = async (page = 0) => {
    setLogsLoading(true);
    try {
      const params = {
        page,
        size: logPageSize,
        sortBy: 'createdAt',
        sortDir: 'desc',
      };
      if (logSearch.trim()) params.search = logSearch.trim();
      if (logTypeFilter) params.type = logTypeFilter;
      if (logStatusFilter && logStatusFilter !== 'ALL') params.status = logStatusFilter;

      const res = await whatsappService.getLogs(params);
      const pageData = res.data || res;
      setLogs(pageData.content || []);
      setLogTotalPages(pageData.totalPages || pageData.page?.totalPages || 0);
      setLogTotalElements(pageData.totalElements || pageData.page?.totalElements || 0);
      setLogPage(page);
    } catch (err) {
      console.error('Failed to fetch message logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleRetryFailedMessages = async () => {
    setRetryingFailed(true);
    try {
      const res = await whatsappService.retryFailedMessages();
      toast.success(res.message || 'Failed messages re-queued for delivery');
      fetchLogs(0);
    } catch (err) {
      console.error('Failed to retry messages:', err);
      toast.error(err.message || 'Failed to retry messages');
    } finally {
      setRetryingFailed(false);
    }
  };

  const handleManualResend = async () => {
    if (!resendModalItem) return;
    setResendingItem(true);
    try {
      const res = await whatsappService.manualResend(resendModalItem.id);
      toast.success(res.message || 'Message re-queued for delivery');
      setResendModalItem(null);
      fetchLogs(logPage);
    } catch (err) {
      console.error('Failed to manually resend message:', err);
      toast.error(err.message || 'Failed to resend message');
    } finally {
      setResendingItem(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const reminderTpl = settings.eventReminderTemplateName || settings.reminderTemplateName || 'reminder_rcf';
      const reminderLang = settings.eventReminderTemplateLanguage || settings.reminderTemplateLanguage || 'en';
      const payload = {
        integrationEnabled: settings.integrationEnabled,
        otpVerificationEnabled: settings.otpVerificationEnabled,
        passActivationNotificationEnabled: settings.passActivationNotificationEnabled,
        eventReminderEnabled: settings.eventReminderEnabled,
        fromNumberId: settings.fromNumberId,
        connectedPhoneNumber: settings.connectedPhoneNumber,
        displayName: settings.displayName,
        otpTemplateName: settings.otpTemplateName,
        otpTemplateLanguage: settings.otpTemplateLanguage,
        passActivationTemplateName: settings.passActivationTemplateName,
        passActivationTemplateLanguage: settings.passActivationTemplateLanguage,
        eventReminderTemplateName: reminderTpl,
        eventReminderTemplateLanguage: reminderLang,
        reminderTemplateName: reminderTpl,
        reminderTemplateLanguage: reminderLang,
        reminderLeadHours: parseInt(settings.reminderLeadHours, 10) || 24,
      };

      const res = await whatsappService.updateSettings(payload);
      const updated = res.data || res;
      if (updated) {
        setSettings((prev) => ({
          ...prev,
          ...updated,
        }));
      }
      toast.success('WhatsApp configuration and toggles saved successfully!');
    } catch (err) {
      console.error('Failed to update settings:', err);
      toast.error(err.message || 'Failed to save WhatsApp settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const res = await whatsappService.testConnection();
      const updated = res.data || res;
      if (updated) {
        setSettings((prev) => ({
          ...prev,
          lastConnectedStatus: updated.lastConnectedStatus,
          lastTestedAt: updated.lastTestedAt,
          displayName: updated.displayName || prev.displayName,
          connectedPhoneNumber: updated.connectedPhoneNumber || prev.connectedPhoneNumber,
        }));
      }
      if (updated.lastConnectedStatus === 'ACTIVE' || updated.lastConnectedStatus === 'CONNECTED') {
        toast.success(`Botsense API Connected! Number: +${updated.connectedPhoneNumber}`);
      } else {
        toast.error(`Connection check status: ${updated.lastConnectedStatus}`);
      }
      fetchTemplates();
    } catch (err) {
      console.error('Connection test failed:', err);
      toast.error(err.message || 'Botsense API connection test failed');
    } finally {
      setTestingConnection(false);
    }
  };

  const toggleSwitch = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                WhatsApp Botsense Settings
              </h1>
              <p className="text-xs sm:text-sm text-gray-500">
                Manage WhatsApp OTP verification, pass confirmations, event reminders, and delivery tracking.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testingConnection}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 transition shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${testingConnection ? 'animate-spin' : ''}`} />
            {testingConnection ? 'Testing...' : 'Test Connection'}
          </button>

          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {/* Provider Details & Master Integration Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Connection Status Card */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Botsense Account
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  settings.lastConnectedStatus === 'ACTIVE' || settings.lastConnectedStatus === 'CONNECTED'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    settings.lastConnectedStatus === 'ACTIVE' || settings.lastConnectedStatus === 'CONNECTED'
                      ? 'bg-emerald-500 animate-pulse'
                      : 'bg-gray-400'
                  }`}
                />
                {settings.lastConnectedStatus}
              </span>
            </div>

            <div className="mt-4 space-y-2.5 text-xs">
              <div>
                <span className="text-gray-400 block text-[11px]">Display Name</span>
                <span className="font-bold text-gray-900 text-sm">{settings.displayName}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[11px]">WhatsApp Phone Number</span>
                <span className="font-mono font-bold text-emerald-700">+{settings.connectedPhoneNumber}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[11px]">Sender UUID (from_number_id)</span>
                <span className="font-mono text-[10px] text-gray-600 break-all">{settings.fromNumberId}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 mt-4 text-[11px] text-gray-400 flex items-center justify-between">
            <span>Provider: Botsense Cloud</span>
            <span>{settings.lastTestedAt ? `Checked: ${new Date(settings.lastTestedAt).toLocaleTimeString()}` : 'Not tested'}</span>
          </div>
        </div>

        {/* Master Integration Toggle Card */}
        <div
          className={`lg:col-span-2 border rounded-2xl p-6 transition-all flex flex-col justify-between shadow-xs ${
            settings.integrationEnabled
              ? 'bg-gradient-to-br from-emerald-50/70 via-white to-white border-emerald-300 ring-1 ring-emerald-400/20'
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                    settings.integrationEnabled
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {settings.integrationEnabled ? 'Active' : 'Disabled'}
                </span>
                <h3 className="text-base sm:text-lg font-black text-gray-900">
                  Master WhatsApp Integration Switch
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 max-w-xl leading-relaxed">
                Controls all outbound WhatsApp calls. When turned off, message processing halts immediately,
                pending queue items are suppressed, and OTP verification is bypassed without blocking attendees.
              </p>
            </div>

            {/* Toggle Button */}
            <button
              type="button"
              onClick={() => toggleSwitch('integrationEnabled')}
              className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                settings.integrationEnabled ? 'bg-emerald-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  settings.integrationEnabled ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100/80 flex items-center gap-2 text-xs text-gray-500">
            <Info className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Independent feature switches below only dispatch messages when this master toggle is ON.</span>
          </div>
        </div>
      </div>

      {/* 3 INDEPENDENT FEATURE TOGGLE CARDS */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
            Independent Feature Toggles & Templates
          </h2>
          <span className="text-xs text-gray-400">
            Each feature can be toggled ON or OFF independently
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: OTP Verification */}
          <div
            className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all ${
              settings.otpVerificationEnabled
                ? 'border-emerald-300 ring-2 ring-emerald-500/10'
                : 'border-gray-200 opacity-90'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">WhatsApp OTP</h3>
                    <span className="text-[10px] text-gray-400 font-medium">Attendee Verification</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleSwitch('otpVerificationEnabled')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    settings.otpVerificationEnabled ? 'bg-emerald-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      settings.otpVerificationEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <p className="text-xs text-gray-500 leading-relaxed">
                Sends a 6-digit verification code with a copy-code button. Strictly 10-minute validity. If disabled, pass activation proceeds immediately.
              </p>

              <div className="space-y-2 pt-2 border-t border-gray-100">
                <label className="block text-[11px] font-bold text-gray-700">Authentication Template</label>
                <select
                  value={settings.otpTemplateName}
                  onChange={(e) => setSettings({ ...settings, otpTemplateName: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="rcf">rcf (Default Authentication)</option>
                  {templates
                    .filter((t) => t.category === 'AUTHENTICATION' || t.name === 'rcf')
                    .map((t) => (
                      <option key={t.id || t.name} value={t.name}>
                        {t.name} ({t.language})
                      </option>
                    ))}
                </select>
                <p className="text-[10px] text-gray-400">Approved Botsense AUTH template with variable {`{{1}}`}.</p>
              </div>
            </div>
          </div>

          {/* Card 2: Pass Activation Confirmation */}
          <div
            className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all ${
              settings.passActivationNotificationEnabled
                ? 'border-emerald-300 ring-2 ring-emerald-500/10'
                : 'border-gray-200 opacity-90'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">Pass Confirmation</h3>
                    <span className="text-[10px] text-gray-400 font-medium">Post-Activation Delivery</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleSwitch('passActivationNotificationEnabled')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    settings.passActivationNotificationEnabled ? 'bg-emerald-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      settings.passActivationNotificationEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <p className="text-xs text-gray-500 leading-relaxed">
                Sends an instant WhatsApp confirmation message containing pass details, event title, attendee name, and admission verification info upon activation.
              </p>

              <div className="space-y-2 pt-2 border-t border-gray-100">
                <label className="block text-[11px] font-bold text-gray-700">Confirmation Template</label>
                <select
                  value={settings.passActivationTemplateName}
                  onChange={(e) => setSettings({ ...settings, passActivationTemplateName: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="rcf_activation_pass">rcf_activation_pass (Default)</option>
                  <option value="newupdate_veri">newupdate_veri (Verification Update)</option>
                  {templates
                    .filter((t) => t.category !== 'AUTHENTICATION')
                    .map((t) => (
                      <option key={t.id || t.name} value={t.name}>
                        {t.name} ({t.language})
                      </option>
                    ))}
                </select>
                <p className="text-[10px] text-gray-400">Approved Utility template for activated passes.</p>
              </div>
            </div>
          </div>

          {/* Card 3: Event Reminders */}
          <div
            className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all ${
              settings.eventReminderEnabled
                ? 'border-emerald-300 ring-2 ring-emerald-500/10'
                : 'border-gray-200 opacity-90'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">Event Reminders</h3>
                    <span className="text-[10px] text-gray-400 font-medium">Automated Schedule</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleSwitch('eventReminderEnabled')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    settings.eventReminderEnabled ? 'bg-emerald-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      settings.eventReminderEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <p className="text-xs text-gray-500 leading-relaxed">
                Background worker scans upcoming events and automatically sends reminder messages to attendees before the event begins.
              </p>

              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-gray-700">Reminder Template</label>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-400">Lead Hours:</span>
                    <input
                      type="number"
                      min="1"
                      max="168"
                      value={settings.reminderLeadHours}
                      onChange={(e) => setSettings({ ...settings, reminderLeadHours: e.target.value })}
                      className="w-14 px-1.5 py-0.5 border border-gray-200 rounded text-center text-xs font-mono font-bold"
                    />
                  </div>
                </div>
                <select
                  value={settings.eventReminderTemplateName || settings.reminderTemplateName || 'reminder_rcf'}
                  onChange={(e) => setSettings({
                    ...settings,
                    eventReminderTemplateName: e.target.value,
                    reminderTemplateName: e.target.value
                  })}
                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="reminder_rcf">reminder_rcf (Default Reminder)</option>
                  {templates.map((t) => (
                    <option key={t.id || t.name} value={t.name}>
                      {t.name} ({t.language})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-400">Dispatches {settings.reminderLeadHours}h before event starts.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MESSAGE AUDIT LOGS & DELIVERY TRACKING */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Outbound WhatsApp Message Logs</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Live audit logs and delivery tracking for all OTP, activation, and reminder dispatches.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleRetryFailedMessages}
              disabled={retryingFailed || logsLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-semibold hover:bg-amber-100 transition"
              title="Safely re-queue failed messages after template payload correction"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${retryingFailed ? 'animate-spin' : ''}`} />
              {retryingFailed ? 'Re-queuing...' : 'Retry Failed Messages'}
            </button>
            <button
              type="button"
              onClick={() => fetchLogs(0)}
              disabled={logsLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin' : ''}`} />
              Refresh Logs
            </button>
          </div>
        </div>

        {/* Filter Drawer */}
        <div className="p-4 bg-gray-50/60 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Search Phone / Ref</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search recipient or message ID..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchLogs(0)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Notification Type</label>
            <select
              value={logTypeFilter}
              onChange={(e) => {
                setLogTypeFilter(e.target.value);
                setLogPage(0);
                fetchLogs(0);
              }}
              className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="">All Types (OTP, Activation, Reminder)</option>
              <option value="OTP">OTP Verification</option>
              <option value="PASS_ACTIVATION">Pass Activation Confirmation</option>
              <option value="EVENT_REMINDER">Event Reminder</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Status Filter</label>
            <select
              value={logStatusFilter}
              onChange={(e) => {
                setLogStatusFilter(e.target.value);
                setLogPage(0);
                fetchLogs(0);
              }}
              className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="SENT">Sent / Delivered</option>
              <option value="UNKNOWN">Unknown (Timeout)</option>
              <option value="MANUAL_REVIEW">Manual Review</option>
              <option value="RETRY_WAIT">Retry Wait</option>
              <option value="FAILED">Failed</option>
              <option value="SUPPRESSED">Suppressed (Toggle Disabled)</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-5 py-3 w-16">S.No</th>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Recipient</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Template</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Provider Reference</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logsLoading ? (
                <tr>
                  <td colSpan="8" className="px-5 py-8 text-center text-gray-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-600 mb-2" />
                    Loading message audit logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-8 text-center text-gray-400">
                    No WhatsApp message logs found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log, index) => (
                  <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 py-3 font-mono font-semibold text-gray-600 text-[11px]">
                      {logPage * logPageSize + index + 1}
                    </td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 font-mono font-semibold text-gray-900">
                      {log.maskedMobile || log.recipientMobile}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.notificationType === 'OTP'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : log.notificationType === 'PASS_ACTIVATION'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {log.notificationType}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-[11px] text-gray-700">
                      {log.templateName || '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === 'SENT' || log.status === 'DELIVERED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : log.status === 'UNKNOWN'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : log.status === 'MANUAL_REVIEW'
                            ? 'bg-orange-50 text-orange-700 border border-orange-200'
                            : log.status === 'RETRY_WAIT'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : log.status === 'SUPPRESSED'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            log.status === 'SENT' || log.status === 'DELIVERED'
                              ? 'bg-emerald-500'
                              : log.status === 'UNKNOWN'
                              ? 'bg-purple-500 animate-pulse'
                              : log.status === 'MANUAL_REVIEW'
                              ? 'bg-orange-500'
                              : log.status === 'RETRY_WAIT'
                              ? 'bg-sky-500'
                              : log.status === 'SUPPRESSED'
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                        />
                        {log.status === 'UNKNOWN' ? 'UNKNOWN (Timeout)' : log.status}
                      </span>
                      {log.errorMessage && (
                        <span className="block text-[10px] text-red-600 mt-0.5 max-w-xs truncate" title={log.errorMessage}>
                          {log.errorMessage}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 font-mono text-[10px] text-gray-500 truncate max-w-xs" title={log.providerMessageId}>
                      {log.providerMessageId || '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {(log.status === 'UNKNOWN' || log.status === 'MANUAL_REVIEW' || log.status === 'FAILED') ? (
                        <button
                          type="button"
                          onClick={() => setResendModalItem(log)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors shadow-sm"
                          title="Authorized manual resend with duplicate acknowledgment"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Resend
                        </button>
                      ) : (
                        <span className="text-gray-400 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 sm:px-5 py-4 border-t border-gray-200 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span className="text-xs sm:text-sm text-gray-600">
              {logTotalElements > 0 ? (
                <>
                  Showing <span className="font-bold text-emerald-700">{logPage * logPageSize + 1}</span> to{' '}
                  <span className="font-bold text-emerald-700">
                    {Math.min((logPage + 1) * logPageSize, logTotalElements)}
                  </span>{' '}
                  of <span className="font-bold text-emerald-700">{logTotalElements}</span> message logs
                </>
              ) : (
                <span className="text-gray-500">No message logs found</span>
              )}
            </span>
            {logTotalElements > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Rows per page:</span>
                <select
                  value={logPageSize}
                  onChange={(e) => {
                    setLogPageSize(parseInt(e.target.value));
                    setLogPage(0);
                  }}
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer hover:border-emerald-400 transition"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {logTotalElements > 0 && (
            <div className="flex items-center gap-1.5 self-center sm:self-auto">
              <button
                type="button"
                disabled={logPage === 0 || logsLoading}
                onClick={() => fetchLogs(Math.max(0, logPage - 1))}
                className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 disabled:hover:text-gray-700 transition-all duration-200 text-xs font-semibold shadow-sm"
              >
                Previous
              </button>
              {Array.from({ length: logTotalPages }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => fetchLogs(i)}
                  disabled={logsLoading}
                  className={`w-9 h-9 rounded-lg transition-all duration-200 text-xs font-bold shadow-sm ${
                    logPage === i
                      ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white border-emerald-600 shadow-md hover:from-emerald-700 hover:to-emerald-800 transform hover:scale-105'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 disabled:hover:text-gray-700'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                type="button"
                disabled={logPage >= logTotalPages - 1 || logsLoading}
                onClick={() => fetchLogs(Math.min(logTotalPages - 1, logPage + 1))}
                className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 disabled:hover:text-gray-700 transition-all duration-200 text-xs font-semibold shadow-sm"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Manual Resend Confirmation Modal */}
      {resendModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">
                Confirm Manual WhatsApp Resend
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                This message experienced an ambiguous delivery outcome (e.g. read timeout).
                <span className="font-semibold text-amber-700 block mt-2 p-2.5 bg-amber-50 rounded-lg border border-amber-200">
                  ⚠️ Warning: The WhatsApp message may already have been delivered to {resendModalItem.maskedMobile || resendModalItem.recipientMobile}. Manually resending will dispatch another message and may result in a duplicate.
                </span>
              </p>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  disabled={resendingItem}
                  onClick={() => setResendModalItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={resendingItem}
                  onClick={handleManualResend}
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  {resendingItem && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  I Understand, Resend Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppSettings;
